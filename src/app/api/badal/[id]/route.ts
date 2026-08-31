import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const order = await prisma.badalUmroh.findUnique({ where: { id: params.id } });
    if (!order) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const {
      status,
      executorName,
      executorPhone,
      scheduledDate,
      completedAt,
      transferProofUrl,
      executionPhotoUrl,
      executionVideoUrl,
      paymentMethod,
      paymentDate,
      certificateIssuedAt,
      notes,
    } = body;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (executorName !== undefined) updateData.executorName = executorName;
    if (executorPhone !== undefined) updateData.executorPhone = executorPhone;
    if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null;
    if (transferProofUrl !== undefined) updateData.transferProofUrl = transferProofUrl;
    if (executionPhotoUrl !== undefined) updateData.executionPhotoUrl = executionPhotoUrl;
    if (executionVideoUrl !== undefined) updateData.executionVideoUrl = executionVideoUrl;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (paymentDate !== undefined) updateData.paymentDate = paymentDate ? new Date(paymentDate) : null;
    if (certificateIssuedAt !== undefined) updateData.certificateIssuedAt = certificateIssuedAt ? new Date(certificateIssuedAt) : null;
    if (notes !== undefined) updateData.notes = notes;

    // Auto-set completedAt if status becomes COMPLETED
    if (status === "COMPLETED" && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }
    // Auto-set certificateIssuedAt if status becomes CERTIFICATE_ISSUED
    if (status === "CERTIFICATE_ISSUED" && !updateData.certificateIssuedAt) {
      updateData.certificateIssuedAt = new Date();
    }
    // Auto-set paymentDate if status becomes PAYMENT_RECEIVED
    if (status === "PAYMENT_RECEIVED" && !updateData.paymentDate) {
      updateData.paymentDate = new Date();
    }

    const updated = await prisma.badalUmroh.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Failed to update badal umroh:", error);
    return NextResponse.json({ error: "Gagal memperbarui data badal umroh" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.badalUmroh.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}
