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
    const { pilgrimId, pilgrimIds, allocations, type, title, amount, dueDate, notes, payerName, payerPhone } = body;

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

        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            pilgrimId: item.pilgrimId,
            type: type || "INSTALLMENT",
            title: item.title || title || "Tagihan Pembayaran Umroh",
            amount: parseFloat(item.amount),
            dueDate: new Date(dueDate),
            status: "PENDING",
            payerName: payerName || null,
            payerPhone: payerPhone || null,
            notes: notes || null,
          },
          include: {
            pilgrim: { include: { package: true } },
          },
        });
        createdInvoices.push(invoice);
      }

      return NextResponse.json({
        success: true,
        message: `Berhasil menerbitkan ${createdInvoices.length} invoice sesuai alokasi jamaah.`,
        invoices: createdInvoices,
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
          status: "PENDING",
          payerName: payerName || null,
          payerPhone: payerPhone || null,
          notes: notes || null,
        },
        include: {
          pilgrim: { include: { package: true } },
        },
      });
      createdInvoices.push(invoice);
    }

    if (createdInvoices.length === 1) {
      return NextResponse.json(createdInvoices[0], { status: 201 });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menerbitkan ${createdInvoices.length} invoice untuk jamaah terpilih.`,
      invoices: createdInvoices,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
