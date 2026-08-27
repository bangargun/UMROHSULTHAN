import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.masterAirline.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Maskapai berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting master airline:", error);
    return NextResponse.json({ error: "Failed to delete airline" }, { status: 500 });
  }
}
