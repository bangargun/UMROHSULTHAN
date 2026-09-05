import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { paymentMethod, paymentDate, notes, proofUrl, payerName, payerPhone } = body;

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { pilgrim: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: "PAID",
        paymentMethod: paymentMethod || "BANK_TRANSFER",
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        payerName: payerName !== undefined ? payerName : invoice.payerName,
        payerPhone: payerPhone !== undefined ? payerPhone : invoice.payerPhone,
        notes: notes || invoice.notes,
        proofUrl: proofUrl || invoice.proofUrl,
      },
    });

    // Check all invoices of pilgrim to update pilgrim status
    const allPilgrimInvoices = await prisma.invoice.findMany({
      where: { pilgrimId: invoice.pilgrimId },
    });

    const pendingInvoices = allPilgrimInvoices.filter((inv) => inv.status !== "PAID" && inv.id !== params.id);
    
    let newPilgrimStatus = invoice.pilgrim.status;
    if (pendingInvoices.length === 0) {
      newPilgrimStatus = "FULLY_PAID";
    } else if (invoice.type === "DP") {
      newPilgrimStatus = "DP_PAID";
    }

    await prisma.pilgrim.update({
      where: { id: invoice.pilgrimId },
      data: { status: newPilgrimStatus },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("Error paying invoice:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
