import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      include: {
        _count: {
          select: { pilgrims: true },
        },
      },
      orderBy: { departureDate: "asc" },
    });
    return NextResponse.json(packages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      code,
      name,
      description,
      departureDate,
      returnDate,
      durationDays,
      hotelMakkah,
      hotelMadinah,
      airline,
      priceQuad,
      priceTriple,
      priceDouble,
      quota,
      commissionAgent,
      commissionReferral,
    } = body;

    const pkg = await prisma.package.create({
      data: {
        code: code || `UMR-${Date.now().toString().slice(-6)}`,
        name,
        description,
        departureDate: new Date(departureDate),
        returnDate: new Date(returnDate),
        durationDays: parseInt(durationDays) || 9,
        hotelMakkah,
        hotelMadinah,
        airline,
        priceQuad: parseFloat(priceQuad),
        priceTriple: parseFloat(priceTriple),
        priceDouble: parseFloat(priceDouble),
        quota: parseInt(quota) || 45,
        commissionAgent: commissionAgent !== undefined ? parseFloat(commissionAgent) : 1500000,
        commissionReferral: commissionReferral !== undefined ? parseFloat(commissionReferral) : 500000,
      },
    });

    return NextResponse.json(pkg, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}
