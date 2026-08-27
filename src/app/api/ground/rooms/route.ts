import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get("packageId");
    const hotelCity = searchParams.get("hotelCity");

    let whereClause: any = {};
    if (packageId && packageId !== "ALL") whereClause.packageId = packageId;
    if (hotelCity && hotelCity !== "ALL") whereClause.hotelCity = hotelCity.toUpperCase();

    const rooms = await prisma.roomAllocation.findMany({
      where: whereClause,
      orderBy: [{ hotelCity: "asc" }, { roomNumber: "asc" }],
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Error fetching room allocations:", error);
    return NextResponse.json({ error: "Failed to fetch room allocations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { packageId, hotelCity, hotelName, roomNumber, roomType, floor, pilgrimIds, notes } = body;

    if (!packageId || !roomNumber || !hotelCity) {
      return NextResponse.json({ error: "Paket, Kota Hotel, dan Nomor Kamar wajib diisi" }, { status: 400 });
    }

    const room = await prisma.roomAllocation.create({
      data: {
        packageId,
        hotelCity: hotelCity.toUpperCase(),
        hotelName: hotelName || null,
        roomNumber: String(roomNumber).trim(),
        roomType: roomType || "QUAD",
        floor: floor || null,
        pilgrimIds: JSON.stringify(pilgrimIds || []),
        notes: notes || null,
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("Error saving room allocation:", error);
    return NextResponse.json({ error: "Failed to create room allocation" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID wajib disertakan" }, { status: 400 });

    await prisma.roomAllocation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting room allocation:", error);
    return NextResponse.json({ error: "Failed to delete room allocation" }, { status: 500 });
  }
}
