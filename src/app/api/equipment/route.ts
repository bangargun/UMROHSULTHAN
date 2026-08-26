import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const equipment = await prisma.equipment.findMany({
      include: {
        movements: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(equipment);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, sku, category, totalStock, unit, minStockAlert, description } = body;

    const initialStock = parseInt(totalStock) || 0;
    const itemSku = sku || `EQ-${Date.now().toString().slice(-6)}`;

    const item = await prisma.equipment.create({
      data: {
        name,
        sku: itemSku,
        category: category || "AKSESORIS",
        totalStock: initialStock,
        availableStock: initialStock,
        unit: unit || "PCS",
        minStockAlert: parseInt(minStockAlert) || 10,
        description,
      },
    });

    if (initialStock > 0) {
      await prisma.stockMovement.create({
        data: {
          equipmentId: item.id,
          type: "IN_PURCHASE",
          quantity: initialStock,
          referenceNo: "INIT-STOCK",
          notes: "Stok awal saat pendaftaran barang",
          createdBy: "Admin",
        },
      });
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "SKU barang sudah digunakan" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create equipment" }, { status: 500 });
  }
}
