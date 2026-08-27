import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const airlines = await prisma.masterAirline.findMany({
      orderBy: { name: "asc" },
    });
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
