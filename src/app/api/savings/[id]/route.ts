import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const account = await prisma.savingsAccount.findUnique({
      where: { id: params.id },
      include: {
        targetPackage: true,
        transactions: {
          orderBy: { transactionDate: "desc" },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Rekening tabungan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error: any) {
    console.error("Failed to fetch savings account:", error);
    return NextResponse.json({ error: "Gagal mengambil data rekening tabungan" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      fullName,
      phone,
      email,
      address,
      city,
      province,
      uniformSize,
      targetPackageId,
      targetPackageName,
      targetAmount,
      equipmentReceived,
      status,
      notes,
    } = body;

    const updated = await prisma.savingsAccount.update({
      where: { id: params.id },
      data: {
        fullName: fullName ? fullName.trim().toUpperCase() : undefined,
        phone: phone ? phone.trim() : undefined,
        email: email !== undefined ? (email ? email.trim() : null) : undefined,
        address: address !== undefined ? (address ? address.trim() : null) : undefined,
        city: city !== undefined ? (city ? city.trim() : null) : undefined,
        province: province !== undefined ? (province ? province.trim() : null) : undefined,
        uniformSize,
        targetPackageId,
        targetPackageName,
        targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
        equipmentReceived: equipmentReceived !== undefined ? Boolean(equipmentReceived) : undefined,
        status,
        notes,
      },
      include: {
        targetPackage: true,
        transactions: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Failed to update savings account:", error);
    return NextResponse.json({ error: "Gagal memperbarui data tabungan" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.savingsAccount.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: "Rekening tabungan berhasil dihapus" });
  } catch (error: any) {
    console.error("Failed to delete savings account:", error);
    return NextResponse.json({ error: "Gagal menghapus rekening tabungan" }, { status: 500 });
  }
}
