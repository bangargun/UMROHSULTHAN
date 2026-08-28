import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/google-drive";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { transferProofBase64, paymentNotes } = body;

    const reg = await prisma.registration.findUnique({
      where: { id: params.id },
      include: { package: true },
    });

    if (!reg) {
      return NextResponse.json({ error: "Pendaftaran tidak ditemukan" }, { status: 404 });
    }

    if (reg.status !== "VERIFIED" && reg.status !== "PAYMENT_PENDING") {
      return NextResponse.json(
        { error: "Pembayaran hanya dapat diunggah setelah status VERIFIED!" },
        { status: 400 }
      );
    }

    let transferProofUrl = reg.transferProofUrl;
    if (transferProofBase64) {
      try {
        const saved = await saveUploadedFile({
          fileBase64: transferProofBase64,
          fileName: `BUKTI_BAYAR_${reg.fullName.replace(/\s+/g, "_")}_${Date.now()}.jpg`,
          subFolder: "payments",
        });
        transferProofUrl = saved.fileUrl;
      } catch (err) {
        console.error("Gagal simpan bukti bayar:", err);
      }
    }

    const updatedReg = await prisma.registration.update({
      where: { id: params.id },
      data: {
        status: "PAYMENT_PENDING",
        transferProofUrl,
        notes: paymentNotes
          ? `${reg.notes ? reg.notes + " | " : ""}Bukti Bayar: ${paymentNotes}`
          : reg.notes,
      },
      include: { package: true },
    });

    return NextResponse.json({
      success: true,
      message: "Bukti pembayaran berhasil diunggah! Menunggu verifikasi admin.",
      registration: updatedReg,
    });
  } catch (error: any) {
    console.error("Upload payment failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
