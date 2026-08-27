import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    let airlines = await prisma.masterAirline.findMany({
      orderBy: { name: "asc" },
    });

    if (airlines.length === 0) {
      const initialAirlines = [
        { name: "Saudia Airlines (Direct CGK - JED / MED)", code: "SV", routeType: "DIRECT" },
        { name: "Garuda Indonesia (Direct CGK - JED / MED)", code: "GA", routeType: "DIRECT" },
        { name: "Lion Air Umroh Premium (Direct KJT/CGK - JED/MED)", code: "JT", routeType: "DIRECT" },
        { name: "Emirates Airlines (Transit Dubai DXB)", code: "EK", routeType: "TRANSIT" },
        { name: "Qatar Airways (Transit Doha DOH)", code: "QR", routeType: "TRANSIT" },
        { name: "Etihad Airways (Transit Abu Dhabi AUH)", code: "EY", routeType: "TRANSIT" },
        { name: "Oman Air (Transit Muscat MCT)", code: "WY", routeType: "TRANSIT" },
        { name: "Batik Air Malaysia (Transit Kuala Lumpur KUL)", code: "OD", routeType: "TRANSIT" },
      ];

      for (const a of initialAirlines) {
        await prisma.masterAirline.create({ data: a });
      }

      airlines = await prisma.masterAirline.findMany({
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json(airlines);
  } catch (error) {
    console.error("Error fetching master airlines:", error);
    return NextResponse.json({ error: "Failed to fetch airlines" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, routeType } = body;

    if (!name) {
      return NextResponse.json({ error: "Nama Maskapai Penerbangan wajib diisi" }, { status: 400 });
    }

    const cleanName = name.trim();

    // Check if already exists
    let airline = await prisma.masterAirline.findUnique({
      where: { name: cleanName },
    });

    if (!airline) {
      airline = await prisma.masterAirline.create({
        data: {
          name: cleanName,
          code: code ? code.trim().toUpperCase() : null,
          routeType: routeType || "DIRECT",
        },
      });
    }

    return NextResponse.json(airline, { status: 201 });
  } catch (error) {
    console.error("Error creating master airline:", error);
    return NextResponse.json({ error: "Failed to create airline" }, { status: 500 });
  }
}
