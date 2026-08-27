import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");

    const hotels = await prisma.masterHotel.findMany({
      where: city ? { city: city.toUpperCase() } : {},
      orderBy: { name: "asc" },
    });

    return NextResponse.json(hotels);
  } catch (error) {
    console.error("Error fetching master hotels:", error);
    return NextResponse.json({ error: "Failed to fetch hotels" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, city, rating, distance } = body;

    if (!name || !city) {
      return NextResponse.json({ error: "Nama Hotel dan Kota (Makkah/Madinah) wajib diisi" }, { status: 400 });
    }

    const cleanCity = city.toUpperCase() === "MADINAH" ? "MADINAH" : "MAKKAH";
    const cleanName = name.trim();

    let hotel = await prisma.masterHotel.findFirst({
      where: {
        name: cleanName,
        city: cleanCity,
      },
    });

    if (!hotel) {
      hotel = await prisma.masterHotel.create({
        data: {
          name: cleanName,
          city: cleanCity,
          rating: rating ? parseInt(rating) : 5,
          distance: distance ? distance.trim() : null,
        },
      });
    }

    return NextResponse.json(hotel, { status: 201 });
  } catch (error) {
    console.error("Error creating master hotel:", error);
    return NextResponse.json({ error: "Failed to create hotel" }, { status: 500 });
  }
}
