import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

function generateOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BDL-${yy}${mm}-${rand}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;

    const orders = await prisma.badalUmroh.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Failed to fetch badal umroh:", error);
    return NextResponse.json({ error: "Gagal mengambil data badal umroh" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      ordererName,
      ordererPhone,
      ordererEmail,
      ordererNik,
      ordererAddress,
      ordererCity,
      ordererRelation,
      recipientName,
      recipientGender = "MALE",
      recipientStatus = "DECEASED",
      recipientBirthPlace,
      recipientDateOfBirth,
      packageType = "BADAL_BASIC",
      price,
      transferProofBase64,
      notes,
    } = body;

    if (!ordererName || !ordererPhone || !recipientName || !ordererRelation) {
      return NextResponse.json(
        { error: "Nama pemesan, nomor HP, nama yang dibadalkan, dan hubungan keluarga wajib diisi!" },
        { status: 400 }
      );
    }

    // Tentukan harga berdasarkan paket
    const packagePrices: Record<string, number> = {
      BADAL_BASIC: 3500000,
      BADAL_PREMIUM: 5000000,
      BADAL_WITH_VIDEO: 7500000,
    };
    const finalPrice = price ? parseFloat(price) : (packagePrices[packageType] || 3500000);

    // Generate order number unik
    let orderNumber = generateOrderNumber();
    let exists = await prisma.badalUmroh.findUnique({ where: { orderNumber } });
    while (exists) {
      orderNumber = generateOrderNumber();
      exists = await prisma.badalUmroh.findUnique({ where: { orderNumber } });
    }

    // Generate invoice number
    const invoiceNumber = `INV-BDL-${orderNumber.replace("BDL-", "")}`;

    // Upload Bukti Transfer jika ada
    let transferProofUrl: string | null = null;
    if (transferProofBase64) {
      try {
        const saved = await saveUploadedFile({
          fileBase64: transferProofBase64,
          fileName: `TRANSFER_BADAL_${ordererName.replace(/\s+/g, "_")}_${Date.now().toString().slice(-4)}.jpg`,
          subFolder: "transfers",
        });
        transferProofUrl = saved.fileUrl;
      } catch (err) {
        console.error("Gagal simpan Bukti Transfer Badal:", err);
      }
    }

    const order = await prisma.badalUmroh.create({
      data: {
        orderNumber,
        ordererName: ordererName.toUpperCase(),
        ordererPhone,
        ordererEmail,
        ordererNik,
        ordererAddress,
        ordererCity,
        ordererRelation,
        recipientName: recipientName.toUpperCase(),
        recipientGender,
        recipientStatus,
        recipientBirthPlace,
        recipientDateOfBirth: recipientDateOfBirth ? new Date(recipientDateOfBirth) : null,
        packageType,
        price: finalPrice,
        transferProofUrl,
        invoiceNumber,
        notes,
        status: "PENDING_PAYMENT",
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create badal umroh:", error);
    return NextResponse.json({ error: "Gagal mendaftarkan badal umroh" }, { status: 500 });
  }
}
