import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      packageId,
      roomType = "QUAD",
      passportNumber,
      passportExpiry,
    } = body;

    const account = await prisma.savingsAccount.findUnique({
      where: { id: params.id },
      include: { targetPackage: true },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Rekening tabungan tidak ditemukan" },
        { status: 404 }
      );
    }

    const finalPackageId = packageId || account.targetPackageId;
    if (!finalPackageId) {
      return NextResponse.json(
        { error: "Paket umroh keberangkatan wajib dipilih untuk konversi jamaah!" },
        { status: 400 }
      );
    }

    const targetPkg = await prisma.package.findUnique({
      where: { id: finalPackageId },
    });

    if (!targetPkg) {
      return NextResponse.json(
        { error: "Paket keberangkatan yang dipilih tidak ditemukan" },
        { status: 404 }
      );
    }

    // Tentukan status pembayaran jamaah
    let packagePrice = targetPkg.priceQuad;
    if (roomType === "TRIPLE") packagePrice = targetPkg.priceTriple;
    if (roomType === "DOUBLE") packagePrice = targetPkg.priceDouble;

    const isFullyPaid = account.totalBalance >= packagePrice;

    // 1. Cek atau Buat Jamaah di tabel Pilgrim
    let pilgrim = await prisma.pilgrim.findUnique({
      where: { nik: account.nik },
    });

    if (!pilgrim) {
      pilgrim = await prisma.pilgrim.create({
        data: {
          packageId: finalPackageId,
          name: account.fullName,
          nik: account.nik,
          passportNumber: passportNumber || null,
          passportExpiry: passportExpiry ? new Date(passportExpiry) : null,
          gender: account.gender,
          phone: account.phone,
          email: account.email || null,
          address: account.address || null,
          city: account.city || null,
          province: account.province || null,
          roomType: roomType || "QUAD",
          uniformSize: account.uniformSize || "L",
          healthNotes: `Konversi dari Rekening Tabungan Umroh (${account.accountNumber}). Koper & Seragam sudah diserahkan di awal.`,
          status: isFullyPaid ? "FULL_PAID" : "DP_PAID",
        },
      });

      // Tambahkan checklist persyaratan
      const reqTemplates = await prisma.requirementTemplate.findMany({
        orderBy: { orderIndex: "asc" },
      });

      if (reqTemplates.length > 0) {
        await prisma.pilgrimRequirement.createMany({
          data: reqTemplates.map((t) => ({
            pilgrimId: pilgrim!.id,
            name: t.name,
            isSubmitted: false,
            isVerified: false,
          })),
        });
      }

      // Update bookedCount pada paket
      await prisma.package.update({
        where: { id: finalPackageId },
        data: {
          bookedCount: { increment: 1 },
        },
      });
    }

    // 2. Buat Invoice Resmi
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    await prisma.invoice.create({
      data: {
        invoiceNumber,
        pilgrimId: pilgrim.id,
        title: `Konversi Tabungan Umroh (${account.accountNumber})`,
        amount: account.totalBalance,
        dueDate: new Date(),
        status: "PAID",
        paymentMethod: "BANK_TRANSFER",
        paymentDate: new Date(),
        notes: `Total Saldo Tabungan Terkumpul: Rp ${account.totalBalance.toLocaleString("id-ID")}`,
      },
    });

    // 3. Update Rekening Tabungan ke Status CONVERTED_TO_PILGRIM
    const updatedAccount = await prisma.savingsAccount.update({
      where: { id: account.id },
      data: {
        status: "CONVERTED_TO_PILGRIM",
        convertedAt: new Date(),
        pilgrimId: pilgrim.id,
      },
      include: {
        targetPackage: true,
        transactions: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Penabung ${account.fullName} berhasil dikonversi menjadi Jamaah Resmi di Manifest Paket ${targetPkg.name}!`,
      pilgrim,
      account: updatedAccount,
    });
  } catch (error: any) {
    console.error("Failed to convert savings account to pilgrim:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengkonversi penabung ke manifest" },
      { status: 500 }
    );
  }
}
