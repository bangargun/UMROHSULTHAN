import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get("packageId");

    let whereClause: any = {};
    if (packageId && packageId !== "ALL") whereClause.packageId = packageId;

    const buses = await prisma.busAllocation.findMany({
      where: whereClause,
      orderBy: { busNumber: "asc" },
    });

    return NextResponse.json(buses);
  } catch (error) {
    console.error("Error fetching bus allocations:", error);
    return NextResponse.json({ error: "Failed to fetch bus allocations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { packageId, busNumber, busName, capacity, driverName, driverPhone, tourLeaderName, muthawwifName, pilgrimIds, notes } = body;

    if (!packageId || !busNumber) {
      return NextResponse.json({ error: "Paket dan Nomor Bus wajib diisi" }, { status: 400 });
    }

    const bus = await prisma.busAllocation.create({
      data: {
        packageId,
        busNumber: String(busNumber).trim(),
        busName: busName || null,
        capacity: capacity ? parseInt(capacity) : 45,
        driverName: driverName || null,
        driverPhone: driverPhone || null,
        tourLeaderName: tourLeaderName || null,
        muthawwifName: muthawwifName || null,
        pilgrimIds: JSON.stringify(pilgrimIds || []),
        notes: notes || null,
      },
    });

    return NextResponse.json(bus, { status: 201 });
  } catch (error) {
    console.error("Error saving bus allocation:", error);
    return NextResponse.json({ error: "Failed to create bus allocation" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID wajib disertakan" }, { status: 400 });

    await prisma.busAllocation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bus allocation:", error);
    return NextResponse.json({ error: "Failed to delete bus allocation" }, { status: 500 });
  }
}
