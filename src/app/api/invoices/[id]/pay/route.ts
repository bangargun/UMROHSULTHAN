import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const {
      paymentMethod,
      paymentDate,
      notes,
      proofUrl,
      payerName,
      payerPhone,
      isAgentPayment,
      agentId,
      agentName,
      agentPaymentScheme,
      agentCommissionAmount,
    } = body;

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { pilgrim: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
    }

    let targetAgent: any = null;
    const effAgentId = agentId || invoice.agentId;
    if (effAgentId) {
      targetAgent = await prisma.agent.findUnique({ where: { id: effAgentId } });
    } else if (agentName || invoice.agentName) {
      targetAgent = await prisma.agent.findFirst({ where: { name: agentName || invoice.agentName || "" } });
    }

    const effectiveAgentId = targetAgent?.id || effAgentId || null;
    const effectiveAgentName = targetAgent?.name || agentName || invoice.agentName || (isAgentPayment && payerName ? payerName : null);

    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: "PAID",
        paymentMethod: paymentMethod || "BANK_TRANSFER",
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        payerName: payerName !== undefined ? payerName : (effectiveAgentName ? `${effectiveAgentName} (Mitra/Agen)` : invoice.payerName),
        payerPhone: payerPhone !== undefined ? payerPhone : (targetAgent?.phone || invoice.payerPhone),
        agentId: effectiveAgentId,
        agentName: effectiveAgentName,
        notes: notes || invoice.notes,
        proofUrl: proofUrl || invoice.proofUrl,
      },
    });

    // Update agent payout & stats if agent is connected
    if (targetAgent) {
      const commPerPax = targetAgent.commissionPerPax || 1500000;
      const totalComm = agentCommissionAmount !== undefined && agentCommissionAmount !== null && agentCommissionAmount !== ""
        ? (parseFloat(agentCommissionAmount) || 0)
        : commPerPax;

      if (totalComm > 0) {
        if (agentPaymentScheme === "NET_COMMISSION_DEDUCTION") {
          await prisma.agentCommissionPayout.create({
            data: {
              agentId: targetAgent.id,
              amount: totalComm,
              status: "PAID",
              payoutDate: paymentDate ? new Date(paymentDate) : new Date(),
              notes: `Potong Komisi Langsung (${targetAgent.name}) - 1 pax (Invoice: ${invoice.invoiceNumber})`,
            },
          });
          await prisma.agent.update({
            where: { id: targetAgent.id },
            data: {
              totalClosingPax: { increment: 1 },
              totalCommissionEarned: { increment: totalComm },
              paidCommission: { increment: totalComm },
            },
          });
        } else {
          // GROSS Payment
          await prisma.agentCommissionPayout.create({
            data: {
              agentId: targetAgent.id,
              amount: totalComm,
              status: "APPROVED",
              notes: `Hak Komisi Agen (${targetAgent.name}) - Pembayaran Bruto Invoice: ${invoice.invoiceNumber}`,
            },
          });
          await prisma.agent.update({
            where: { id: targetAgent.id },
            data: {
              totalClosingPax: { increment: 1 },
              totalCommissionEarned: { increment: totalComm },
              pendingCommission: { increment: totalComm },
            },
          });
        }
      }
    }

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
