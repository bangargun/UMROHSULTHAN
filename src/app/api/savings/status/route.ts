import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || searchParams.get("acc");

    if (!query) {
      return NextResponse.json(
        { error: "Masukkan Nomor Rekening Tabungan, Nomor WhatsApp, atau NIK Anda!" },
        { status: 400 }
      );
    }

    const cleanQuery = query.trim();

    const account = await prisma.savingsAccount.findFirst({
      where: {
        OR: [
          { accountNumber: cleanQuery.toUpperCase() },
          { phone: cleanQuery },
          { nik: cleanQuery },
        ],
      },
      include: {
        targetPackage: true,
        transactions: {
          orderBy: { transactionDate: "desc" },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Data rekening tabungan tidak ditemukan. Pastikan nomor rekening, WhatsApp, atau NIK yang Anda masukkan sudah benar." },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error: any) {
    console.error("Failed to query savings status:", error);
    return NextResponse.json({ error: "Gagal memproses pencarian saldo tabungan" }, { status: 500 });
  }
}
