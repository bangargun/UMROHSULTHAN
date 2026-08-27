import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const pkg = await prisma.package.findUnique({
      where: { id: params.id },
      include: {
        pilgrims: true,
      },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(pkg);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch package" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
      status,
    } = body;

    const updated = await prisma.package.update({
      where: { id: params.id },
      data: {
        code,
        name,
        description,
        departureDate: departureDate ? new Date(departureDate) : undefined,
        returnDate: returnDate ? new Date(returnDate) : undefined,
        durationDays: durationDays ? parseInt(durationDays) : undefined,
        hotelMakkah,
        hotelMadinah,
        airline,
        priceQuad: priceQuad !== undefined ? parseFloat(priceQuad) : undefined,
        priceTriple: priceTriple !== undefined ? parseFloat(priceTriple) : undefined,
        priceDouble: priceDouble !== undefined ? parseFloat(priceDouble) : undefined,
        quota: quota !== undefined ? parseInt(quota) : undefined,
        commissionAgent: commissionAgent !== undefined ? parseFloat(commissionAgent) : undefined,
        commissionReferral: commissionReferral !== undefined ? parseFloat(commissionReferral) : undefined,
        status,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating package:", error);
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const pilgrimCount = await prisma.pilgrim.count({
      where: { packageId: params.id },
    });

    if (pilgrimCount > 0) {
      return NextResponse.json(
        { error: `Paket ini tidak dapat dihapus karena sudah memiliki ${pilgrimCount} jamaah terdaftar.` },
        { status: 400 }
      );
    }

    await prisma.package.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete package" }, { status: 500 });
  }
}
