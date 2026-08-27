import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { code, name, city, address, headName, phone, email, status } = body;

    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Cabang tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.branch.update({
      where: { id },
      data: {
        code: code !== undefined ? code.toUpperCase().trim() : existing.code,
        name: name !== undefined ? name : existing.name,
        city: city !== undefined ? city : existing.city,
        address: address !== undefined ? address : existing.address,
        headName: headName !== undefined ? headName : existing.headName,
        phone: phone !== undefined ? phone : existing.phone,
        email: email !== undefined ? email : existing.email,
        status: status !== undefined ? status : existing.status,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating branch:", error);
    return NextResponse.json({ error: "Failed to update branch" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.branch.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Cabang berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting branch:", error);
    return NextResponse.json({ error: "Failed to delete branch" }, { status: 500 });
  }
}
