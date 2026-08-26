import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const handovers = await prisma.logisticsHandover.findMany({
      include: {
        pilgrim: {
          include: { package: true },
        },
        items: {
          include: { equipment: true },
        },
      },
      orderBy: { handoverDate: "desc" },
    });
    return NextResponse.json(handovers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch handovers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pilgrimId, officerName, recipientName, signatureUrl, notes, items } = body;

    if (!pilgrimId || !officerName || !recipientName) {
      return NextResponse.json({ error: "Data wajib: Jamaah, Petugas, dan Penerima" }, { status: 400 });
    }

    // Create Handover record
    const handover = await prisma.logisticsHandover.create({
      data: {
        pilgrimId,
        officerName,
        recipientName,
        signatureUrl,
        notes,
        isCompleted: true,
      },
    });

    // Create handover items and deduct stock if given
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.equipmentId && item.isGiven) {
          await prisma.handoverItem.create({
            data: {
              handoverId: handover.id,
              equipmentId: item.equipmentId,
              quantity: item.quantity || 1,
              isGiven: true,
              notes: item.notes || null,
            },
          });

          // Deduct equipment available stock
          await prisma.equipment.update({
            where: { id: item.equipmentId },
            data: {
              availableStock: { decrement: item.quantity || 1 },
            },
          });

          // Record stock movement
          await prisma.stockMovement.create({
            data: {
              equipmentId: item.equipmentId,
              type: "OUT_DISTRIBUTION",
              quantity: item.quantity || 1,
              referenceNo: `HANDOVER-${handover.id.slice(0, 8)}`,
              notes: `Diserahkan kepada ${recipientName}`,
              createdBy: officerName,
            },
          });
        }
      }
    }

    const fullHandover = await prisma.logisticsHandover.findUnique({
      where: { id: handover.id },
      include: {
        pilgrim: { include: { package: true } },
        items: { include: { equipment: true } },
      },
    });

    return NextResponse.json(fullHandover, { status: 201 });
  } catch (error) {
    console.error("Error creating handover:", error);
    return NextResponse.json({ error: "Failed to record logistics handover" }, { status: 500 });
  }
}
