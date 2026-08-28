import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reg = await prisma.registration.findUnique({
      where: { id: params.id },
      include: { package: true },
    });

    if (!reg) {
      return NextResponse.json({ error: "Pendaftaran tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(reg);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = await prisma.registration.update({
      where: { id: params.id },
      data: body,
      include: { package: true },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.registration.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: "Pendaftaran berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
