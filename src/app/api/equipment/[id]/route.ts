import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.equipment.findUnique({
      where: { id: params.id },
      include: {
        movements: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Barang tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, sku, category, unit, minStockAlert, description, availableStock, totalStock } = body;

    const updated = await prisma.equipment.update({
      where: { id: params.id },
      data: {
        name,
        sku,
        category,
        unit,
        minStockAlert: minStockAlert !== undefined ? parseInt(minStockAlert) : undefined,
        description,
        availableStock: availableStock !== undefined ? parseInt(availableStock) : undefined,
        totalStock: totalStock !== undefined ? parseInt(totalStock) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating equipment:", error);
    return NextResponse.json({ error: "Failed to update equipment" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const handoverItemCount = await prisma.handoverItem.count({
      where: { equipmentId: params.id },
    });

    if (handoverItemCount > 0) {
      return NextResponse.json(
        { error: "Barang ini tidak dapat dihapus karena tercatat dalam riwayat serah terima logistik jamaah." },
        { status: 400 }
      );
    }

    await prisma.equipment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete equipment" }, { status: 500 });
  }
}
