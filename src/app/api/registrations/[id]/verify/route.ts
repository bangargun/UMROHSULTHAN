import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const { dpAmount = 5000000, notes } = body;

    const reg = await prisma.registration.findUnique({
      where: { id: params.id },
      include: { package: true },
    });

    if (!reg) {
      return NextResponse.json({ error: "Pendaftaran tidak ditemukan" }, { status: 404 });
    }

    if (reg.status !== "NEW") {
      return NextResponse.json(
        { error: `Status saat ini (${reg.status}) tidak dapat diverifikasi ulang!` },
        { status: 400 }
      );
    }

    // Generate Invoice Number DP
    const invCount = await prisma.invoice.count();
    const dateStr = new Date().toISOString().slice(2, 7).replace("-", "");
    const seq = String(invCount + 1).padStart(4, "0");
    const invoiceNumber = `INV-${dateStr}-${seq}`;

    // Update registration status to VERIFIED
    const updatedReg = await prisma.registration.update({
      where: { id: params.id },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
        dpAmount: Number(dpAmount),
        invoiceNumber,
        notes: notes ? `${reg.notes ? reg.notes + " | " : ""}${notes}` : reg.notes,
      },
      include: { package: true },
    });

    return NextResponse.json({
      success: true,
      message: `Pendaftaran ${reg.fullName} berhasil diverifikasi! Tagihan DP telah diterbitkan.`,
      registration: updatedReg,
      invoiceNumber,
      dpAmount: Number(dpAmount),
    });
  } catch (error: any) {
    console.error("Verification failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
