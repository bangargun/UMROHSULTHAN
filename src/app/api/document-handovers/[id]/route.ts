import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const documentHandover = await prisma.documentHandover.findUnique({
      where: { id: params.id },
      include: {
        pilgrim: {
          include: { package: true },
        },
      },
    });

    if (!documentHandover) {
      return NextResponse.json({ error: "Data serah terima tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(documentHandover);
  } catch (error) {
    console.error("Error fetching single document handover:", error);
    return NextResponse.json({ error: "Failed to fetch document handover" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, returnDate, returnOfficerName, returnNotes } = body;

    const updated = await prisma.documentHandover.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(returnDate && { returnDate: new Date(returnDate) }),
        ...(returnOfficerName && { returnOfficerName: returnOfficerName.trim() }),
        ...(returnNotes !== undefined && { returnNotes }),
      },
      include: {
        pilgrim: {
          include: { package: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating document handover:", error);
    return NextResponse.json({ error: "Failed to update document handover" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.documentHandover.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document handover:", error);
    return NextResponse.json({ error: "Failed to delete document handover" }, { status: 500 });
  }
}
