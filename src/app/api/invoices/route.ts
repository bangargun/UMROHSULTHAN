import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const pilgrimId = searchParams.get("pilgrimId");

    const where: any = {};
    if (status) where.status = status;
    if (pilgrimId) where.pilgrimId = pilgrimId;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        pilgrim: {
          include: { package: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      pilgrimId,
      pilgrimIds,
      allocations,
      type,
      title,
      amount,
      dueDate,
      notes,
      payerName,
      payerPhone,
      discountAmount,
      discountReason,
      isPaid,
      paymentMethod,
      paymentDate,
    } = body;

    const invoiceStatus = isPaid ? "PAID" : "PENDING";
    const actualPaymentDate = isPaid ? (paymentDate ? new Date(paymentDate) : new Date()) : null;
    const actualPaymentMethod = isPaid ? (paymentMethod || "CASH") : null;

    // Support detailed per-pilgrim allocations: [{ pilgrimId, amount, title? }]
    if (Array.isArray(allocations) && allocations.length > 0) {
      if (!dueDate) {
        return NextResponse.json({ error: "Tanggal jatuh tempo wajib diisi" }, { status: 400 });
      }

      const validAllocations = allocations.filter((a) => a.pilgrimId && parseFloat(a.amount) > 0);
      if (validAllocations.length === 0) {
        return NextResponse.json({ error: "Minimal ada 1 alokasi pembayaran untuk jamaah terpilih (> Rp 0)" }, { status: 400 });
      }

      const createdInvoices = [];
      for (let i = 0; i < validAllocations.length; i++) {
        const item = validAllocations[i];
        const count = await prisma.invoice.count();
        const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(count + 1 + i).padStart(4, "0")}`;

        const totalDiscount = discountAmount ? (parseFloat(discountAmount) || 0) : 0;
        const pilgrimDiscount = totalDiscount > 0 ? (totalDiscount / validAllocations.length) : 0;

        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            pilgrimId: item.pilgrimId,
            type: type || "INSTALLMENT",
            title: item.title || title || "Tagihan Pembayaran Umroh",
            amount: parseFloat(item.amount),
            dueDate: new Date(dueDate),
            status: invoiceStatus,
            paymentMethod: actualPaymentMethod,
            paymentDate: actualPaymentDate,
            payerName: payerName || null,
            payerPhone: payerPhone || null,
            discountAmount: pilgrimDiscount,
            discountReason: discountReason || null,
            notes: notes || null,
          },
          include: {
            pilgrim: { include: { package: true } },
          },
        });

        if (isPaid) {
          const allPilgrimInvoices = await prisma.invoice.findMany({
            where: { pilgrimId: item.pilgrimId },
          });
          const pilgrimData = await prisma.pilgrim.findUnique({
            where: { id: item.pilgrimId },
            include: { package: true },
          });
          const paidInvoices = allPilgrimInvoices.filter((inv) => inv.status === "PAID");
          const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

          let grossPrice = pilgrimData?.package ? (pilgrimData.package.priceQuad || 0) : 0;
          if (pilgrimData?.roomType === "TRIPLE" && pilgrimData.package?.priceTriple) grossPrice = pilgrimData.package.priceTriple;
          if (pilgrimData?.roomType === "DOUBLE" && pilgrimData.package?.priceDouble) grossPrice = pilgrimData.package.priceDouble;

          const effDiscount = Math.max(pilgrimData?.discountAmount || 0, pilgrimDiscount);
          const netObligation = Math.max(0, grossPrice - effDiscount);

          const isFullyPaid = totalPaid >= netObligation && netObligation > 0;
          await prisma.pilgrim.update({
            where: { id: item.pilgrimId },
            data: { status: isFullyPaid ? "FULLY_PAID" : "DP_PAID" },
          });
        }

        createdInvoices.push(invoice);
      }

      return NextResponse.json({
        success: true,
        message: `Berhasil menerbitkan ${createdInvoices.length} invoice sesuai alokasi jamaah.`,
        invoices: createdInvoices,
        invoice: createdInvoices[0],
      }, { status: 201 });
    }

    // Support single pilgrim or simple multi-pilgrim array
    const targetPilgrimIds: string[] = Array.isArray(pilgrimIds) && pilgrimIds.length > 0
      ? pilgrimIds
      : pilgrimId ? [pilgrimId] : [];

    if (targetPilgrimIds.length === 0 || !amount || !dueDate) {
      return NextResponse.json({ error: "Data wajib: Jamaah, Nominal, dan Tanggal Jatuh Tempo" }, { status: 400 });
    }

    const createdInvoices = [];

    for (let i = 0; i < targetPilgrimIds.length; i++) {
      const pid = targetPilgrimIds[i];
      const count = await prisma.invoice.count();
      const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(count + 1 + i).padStart(4, "0")}`;

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          pilgrimId: pid,
          type: type || "INSTALLMENT",
          title: title || "Tagihan Pembayaran Umroh",
          amount: parseFloat(amount),
          dueDate: new Date(dueDate),
          status: invoiceStatus,
          paymentMethod: actualPaymentMethod,
          paymentDate: actualPaymentDate,
          payerName: payerName || null,
          payerPhone: payerPhone || null,
          discountAmount: discountAmount ? (parseFloat(discountAmount) || 0) : 0,
          discountReason: discountReason || null,
          notes: notes || null,
        },
        include: {
          pilgrim: { include: { package: true } },
        },
      });

      if (isPaid || discountAmount !== undefined) {
        const allPilgrimInvoices = await prisma.invoice.findMany({
          where: { pilgrimId: pid },
        });
        const pilgrimData = await prisma.pilgrim.findUnique({
          where: { id: pid },
          include: { package: true },
        });
        const currentDiscount = discountAmount ? parseFloat(discountAmount) : (pilgrimData?.discountAmount || 0);
        let pkgPrice = pilgrimData?.package ? (pilgrimData.package.priceQuad || 0) : 0;
        if (pilgrimData?.roomType === "TRIPLE" && pilgrimData.package?.priceTriple) pkgPrice = pilgrimData.package.priceTriple;
        if (pilgrimData?.roomType === "DOUBLE" && pilgrimData.package?.priceDouble) pkgPrice = pilgrimData.package.priceDouble;
        const netPkgPrice = Math.max(0, pkgPrice - currentDiscount);

        const totalPaid = allPilgrimInvoices.filter((inv) => inv.status === "PAID").reduce((sum, inv) => sum + (inv.amount || 0), 0);
        let newPilgrimStatus = pilgrimData?.status || "REGISTERED";
        if (["REGISTERED", "DP_PAID", "FULLY_PAID"].includes(newPilgrimStatus)) {
          if (netPkgPrice > 0 && totalPaid >= netPkgPrice) {
            newPilgrimStatus = "FULLY_PAID";
          } else if (totalPaid > 0) {
            newPilgrimStatus = "DP_PAID";
          }
        }

        await prisma.pilgrim.update({
          where: { id: pid },
          data: {
            status: newPilgrimStatus,
            discountAmount: discountAmount !== undefined ? (parseFloat(discountAmount) || 0) : undefined,
            discountReason: discountReason !== undefined ? discountReason : undefined,
          },
        });
      }

      createdInvoices.push(invoice);
    }

    if (createdInvoices.length === 1) {
      return NextResponse.json(createdInvoices[0], { status: 201 });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menerbitkan ${createdInvoices.length} invoice untuk jamaah terpilih.`,
      invoices: createdInvoices,
      invoice: createdInvoices[0],
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
