import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        equipment: true,
      },
      orderBy: { movementDate: "desc" },
    });
    return NextResponse.json(movements);
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return NextResponse.json({ error: "Failed to fetch stock movements" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { equipmentId, type, quantity, referenceNo, notes, createdBy, movementDate } = body;

    const qty = parseInt(quantity);
    if (!equipmentId || !qty || qty <= 0) {
      return NextResponse.json({ error: "Barang dan jumlah mutasi harus valid" }, { status: 400 });
    }

    const item = await prisma.equipment.findUnique({ where: { id: equipmentId } });
    if (!item) {
      return NextResponse.json({ error: "Barang tidak ditemukan" }, { status: 404 });
    }

    let stockChange = 0;
    if (type === "IN_PURCHASE" || type === "RETURN") {
      stockChange = qty;
    } else if (type === "OUT_DISTRIBUTION" || type === "ADJUSTMENT") {
      if (item.availableStock < qty && type === "OUT_DISTRIBUTION") {
        return NextResponse.json({ error: `Stok tidak mencukupi. Sisa stok: ${item.availableStock} ${item.unit}` }, { status: 400 });
      }
      stockChange = -qty;
    }

    const mDate = movementDate ? new Date(movementDate) : new Date();

    const movement = await prisma.stockMovement.create({
      data: {
        equipmentId,
        type: type || "IN_PURCHASE",
        quantity: qty,
        referenceNo: referenceNo || null,
        notes: notes || null,
        createdBy: createdBy || "Petugas Logistik",
        movementDate: mDate,
      },
    });

    const updatedEquipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        availableStock: item.availableStock + stockChange,
        totalStock: stockChange > 0 ? item.totalStock + stockChange : item.totalStock,
      },
    });

    return NextResponse.json({ movement, updatedEquipment }, { status: 201 });
  } catch (error) {
    console.error("Error creating stock movement:", error);
    return NextResponse.json({ error: "Failed to record stock movement" }, { status: 500 });
  }
}
