import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoiceNumber, transactionStatus, paymentType, settlementTime } = body;

    if (!invoiceNumber) {
      return NextResponse.json({ error: "Invoice Number wajib disertakan" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: { pilgrim: { include: { package: true } } },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
    }

    // Process payment if status is settlement / capture / success
    const isPaid = transactionStatus === "settlement" || transactionStatus === "capture" || transactionStatus === "PAID";

    if (isPaid && invoice.status !== "PAID") {
      const payDate = settlementTime ? new Date(settlementTime) : new Date();

      // 1. Update invoice to PAID
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "PAID",
          paymentDate: payDate,
          paymentMethod: paymentType || "VIRTUAL_ACCOUNT",
          notes: `Lunas otomatis via Payment Gateway (${paymentType || "VA"}) - ${invoiceNumber}`,
        },
      });

      // 2. Check if all invoices for pilgrim are paid
      const allInvoices = await prisma.invoice.findMany({
        where: { pilgrimId: invoice.pilgrimId },
      });

      const allPaid = allInvoices.every((inv) => inv.id === invoice.id || inv.status === "PAID");
      if (allPaid) {
        await prisma.pilgrim.update({
          where: { id: invoice.pilgrimId },
          data: { status: "FULLY_PAID" },
        });
      } else {
        await prisma.pilgrim.update({
          where: { id: invoice.pilgrimId },
          data: { status: "DP_PAID" },
        });
      }

      // 3. Post to General Journal (Kas Masuk & Pendapatan)
      try {
        const count = await prisma.journalEntry.count();
        const entryNumber = `JU-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

        await prisma.journalEntry.create({
          data: {
            entryNumber,
            transactionDate: payDate,
            referenceNo: invoice.invoiceNumber,
            description: `Penerimaan Pembayaran ${invoice.type} - ${invoice.pilgrim?.name} via Payment Gateway (${paymentType || "VA"})`,
            sourceModule: "PAYMENT_GATEWAY",
            sourceId: invoice.id,
            lines: {
              create: [
                {
                  accountCode: "1102",
                  accountName: "Bank Syariah Indonesia (BSI) / VA Gateway",
                  accountCategory: "ASSET",
                  debit: invoice.amount,
                  credit: 0,
                  memo: `Penerimaan kas masuk VA ${invoice.invoiceNumber}`,
                },
                {
                  accountCode: "4101",
                  accountName: "Pendapatan Paket Umroh Reguler",
                  accountCategory: "REVENUE",
                  debit: 0,
                  credit: invoice.amount,
                  memo: `Pendapatan paket umroh ${invoice.pilgrim?.name}`,
                },
              ],
            },
          },
        });
      } catch (jErr) {
        console.error("Journal auto-post error:", jErr);
      }

      return NextResponse.json({
        success: true,
        message: `Invoice ${invoiceNumber} berhasil dilunasi via Webhook Payment Gateway.`,
      });
    }

    return NextResponse.json({ success: true, status: invoice.status });
  } catch (error) {
    console.error("Error processing Payment Gateway Webhook:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}
