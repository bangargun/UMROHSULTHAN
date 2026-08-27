import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.masterHotel.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Hotel berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting master hotel:", error);
    return NextResponse.json({ error: "Failed to delete hotel" }, { status: 500 });
  }
}
