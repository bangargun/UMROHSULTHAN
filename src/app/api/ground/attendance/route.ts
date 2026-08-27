import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get("packageId");

    let whereClause: any = {};
    if (packageId && packageId !== "ALL") whereClause.packageId = packageId;

    const attendances = await prisma.groundAttendance.findMany({
      where: whereClause,
      orderBy: { eventDate: "desc" },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error("Error fetching ground attendance:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { packageId, eventName, checkedPilgrimIds, conductedBy, notes } = body;

    if (!packageId || !eventName) {
      return NextResponse.json({ error: "Paket dan Nama Titik Kumpul / Agenda wajib diisi" }, { status: 400 });
    }

    const attendance = await prisma.groundAttendance.create({
      data: {
        packageId,
        eventName: eventName.trim(),
        checkedPilgrimIds: JSON.stringify(checkedPilgrimIds || []),
        conductedBy: conductedBy || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error("Error saving ground attendance:", error);
    return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID wajib disertakan" }, { status: 400 });

    await prisma.groundAttendance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return NextResponse.json({ error: "Failed to delete attendance" }, { status: 500 });
  }
}
