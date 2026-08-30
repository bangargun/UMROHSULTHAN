import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      amount,
      paymentMethod = "BANK_TRANSFER",
      transactionDate,
      proofBase64,
      notes,
      officerName = "Admin Keuangan",
    } = body;

    const depositAmount = parseFloat(amount);
    if (!depositAmount || depositAmount <= 0) {
      return NextResponse.json(
        { error: "Nominal setoran harus lebih besar dari Rp 0!" },
        { status: 400 }
      );
    }

    const account = await prisma.savingsAccount.findUnique({
      where: { id: params.id },
      include: { transactions: true },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Rekening tabungan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Upload Bukti Setoran jika ada
    let proofUrl: string | null = null;
    if (proofBase64) {
      try {
        const saved = await saveUploadedFile({
          fileBase64: proofBase64,
          fileName: `SETORAN_${account.accountNumber}_${Date.now().toString().slice(-4)}.jpg`,
          subFolder: "transfers",
        });
        proofUrl = saved.fileUrl;
      } catch (err) {
        console.error("Gagal simpan bukti setoran:", err);
      }
    }

    // Hitung Saldo Baru & Sisa Tagihan
    const newTotalBalance = account.totalBalance + depositAmount;
    const newRemaining = Math.max(0, account.targetAmount - newTotalBalance);

    // Sequence nomor kuitansi unik (KWT-TAB-2608-0001-02)
    const txCount = account.transactions.length + 1;
    const receiptNumber = `KWT-${account.accountNumber}-${String(txCount).padStart(2, "0")}`;

    // 1. Buat Transaksi Setoran
    const transaction = await prisma.savingsTransaction.create({
      data: {
        savingsAccountId: account.id,
        receiptNumber,
        amount: depositAmount,
        currentBalance: newTotalBalance,
        remainingAmount: newRemaining,
        paymentMethod,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        proofUrl,
        notes: notes || "Setoran Tabungan Umroh Barokah",
        officerName,
      },
    });

    // 2. Update Total Saldo Rekening
    const updatedAccount = await prisma.savingsAccount.update({
      where: { id: account.id },
      data: {
        totalBalance: newTotalBalance,
        status: newRemaining === 0 ? "TARGET_REACHED" : "ACTIVE",
      },
      include: {
        targetPackage: true,
        transactions: {
          orderBy: { transactionDate: "desc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Setoran sebesar Rp ${depositAmount.toLocaleString("id-ID")} berhasil dicatat!`,
      transaction,
      account: updatedAccount,
    });
  } catch (error: any) {
    console.error("Failed to record deposit:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mencatat setoran tabungan" },
      { status: 500 }
    );
  }
}
