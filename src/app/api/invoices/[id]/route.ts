import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        pilgrim: {
          include: { package: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data invoice" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const {
      pilgrimId,
      type,
      title,
      amount,
      dueDate,
      status,
      paymentMethod,
      paymentDate,
      payerName,
      payerPhone,
      discountAmount,
      discountReason,
      notes,
    } = body;

    const existing = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { pilgrim: { include: { package: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
    }

    const newPilgrimId = pilgrimId || existing.pilgrimId;
    const isPaid = status === "PAID";

    const updateData: any = {};
    if (pilgrimId !== undefined) updateData.pilgrimId = pilgrimId;
    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title;
    if (amount !== undefined) updateData.amount = parseFloat(amount) || 0;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (payerName !== undefined) updateData.payerName = payerName;
    if (payerPhone !== undefined) updateData.payerPhone = payerPhone;
    if (discountAmount !== undefined) updateData.discountAmount = parseFloat(discountAmount) || 0;
    if (discountReason !== undefined) updateData.discountReason = discountReason;

    if (isPaid) {
      updateData.paymentMethod = paymentMethod || existing.paymentMethod || "BANK_TRANSFER";
      updateData.paymentDate = paymentDate ? new Date(paymentDate) : (existing.paymentDate || new Date());
    } else if (status === "PENDING" || status === "OVERDUE" || status === "CANCELLED") {
      updateData.paymentDate = null;
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        pilgrim: {
          include: { package: true },
        },
      },
    });

    // Re-evaluate target pilgrim status
    const evaluatePilgrimStatus = async (pId: string) => {
      const pilgrim = await prisma.pilgrim.findUnique({
        where: { id: pId },
        include: { package: true, invoices: true },
      });
      if (!pilgrim) return;

      const currentDiscount = discountAmount !== undefined ? (parseFloat(discountAmount) || 0) : (pilgrim.discountAmount || 0);
      let pkgPrice = pilgrim.package ? (pilgrim.package.priceQuad || 0) : 0;
      if (pilgrim.roomType === "TRIPLE" && pilgrim.package?.priceTriple) pkgPrice = pilgrim.package.priceTriple;
      if (pilgrim.roomType === "DOUBLE" && pilgrim.package?.priceDouble) pkgPrice = pilgrim.package.priceDouble;
      const netPkgPrice = Math.max(0, pkgPrice - currentDiscount);

      const paidInvoices = pilgrim.invoices.filter((inv) => inv.status === "PAID");
      const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

      // Only update status if pilgrim is in registration/payment stages (not departed/returned)
      if (["REGISTERED", "DP_PAID", "FULLY_PAID"].includes(pilgrim.status)) {
        let newStatus = "REGISTERED";
        if (netPkgPrice > 0 && totalPaid >= netPkgPrice) {
          newStatus = "FULLY_PAID";
        } else if (totalPaid > 0 || paidInvoices.length > 0) {
          newStatus = "DP_PAID";
        }
        await prisma.pilgrim.update({
          where: { id: pId },
          data: {
            status: newStatus,
            discountAmount: discountAmount !== undefined ? (parseFloat(discountAmount) || 0) : undefined,
            discountReason: discountReason !== undefined ? discountReason : undefined,
          },
        });
      }
    };

    await evaluatePilgrimStatus(newPilgrimId);
    if (existing.pilgrimId !== newPilgrimId) {
      await evaluatePilgrimStatus(existing.pilgrimId);
    }

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Gagal memperbarui invoice" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.invoice.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
    }

    const pilgrimId = existing.pilgrimId;

    await prisma.invoice.delete({
      where: { id: params.id },
    });

    // Re-evaluate pilgrim status
    const pilgrim = await prisma.pilgrim.findUnique({
      where: { id: pilgrimId },
      include: { package: true, invoices: true },
    });

    if (pilgrim && ["REGISTERED", "DP_PAID", "FULLY_PAID"].includes(pilgrim.status)) {
      let pkgPrice = pilgrim.package ? (pilgrim.package.priceQuad || 0) : 0;
      if (pilgrim.roomType === "TRIPLE" && pilgrim.package?.priceTriple) pkgPrice = pilgrim.package.priceTriple;
      if (pilgrim.roomType === "DOUBLE" && pilgrim.package?.priceDouble) pkgPrice = pilgrim.package.priceDouble;

      const paidInvoices = pilgrim.invoices.filter((inv) => inv.status === "PAID");
      const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

      let newStatus = "REGISTERED";
      if (pkgPrice > 0 && totalPaid >= pkgPrice) {
        newStatus = "FULLY_PAID";
      } else if (totalPaid > 0 || paidInvoices.length > 0) {
        newStatus = "DP_PAID";
      }

      await prisma.pilgrim.update({
        where: { id: pilgrimId },
        data: { status: newStatus },
      });
    }

    return NextResponse.json({ success: true, message: "Invoice berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: "Gagal menghapus invoice" }, { status: 500 });
  }
}
