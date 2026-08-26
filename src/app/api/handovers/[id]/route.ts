import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const handover = await prisma.logisticsHandover.findUnique({
      where: { id: params.id },
      include: {
        pilgrim: {
          include: { package: true },
        },
        items: {
          include: { equipment: true },
        },
      },
    });

    if (!handover) {
      return NextResponse.json({ error: "Serah terima tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(handover);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch handover" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { officerName, recipientName, signatureUrl, notes, isCompleted, items } = body;

    const existing = await prisma.logisticsHandover.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Serah terima tidak ditemukan" }, { status: 404 });
    }

    // Update handover metadata
    const updated = await prisma.logisticsHandover.update({
      where: { id: params.id },
      data: {
        officerName: officerName || existing.officerName,
        recipientName: recipientName || existing.recipientName,
        signatureUrl: signatureUrl !== undefined ? signatureUrl : existing.signatureUrl,
        notes: notes !== undefined ? notes : existing.notes,
        isCompleted: isCompleted !== undefined ? isCompleted : existing.isCompleted,
        handoverDate: isCompleted ? new Date() : existing.handoverDate,
      },
    });

    // Update individual items and deduct stock if state changed to isGiven = true
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const currentItem = existing.items.find((i) => i.id === item.id || i.equipmentId === item.equipmentId);
        
        if (currentItem) {
          const wasGiven = currentItem.isGiven;
          const nowGiven = item.isGiven;

          await prisma.handoverItem.update({
            where: { id: currentItem.id },
            data: {
              isGiven: item.isGiven,
              quantity: item.quantity || currentItem.quantity,
              notes: item.notes || currentItem.notes,
            },
          });

          // If freshly given, decrement stock
          if (!wasGiven && nowGiven) {
            await prisma.equipment.update({
              where: { id: currentItem.equipmentId },
              data: {
                availableStock: { decrement: item.quantity || currentItem.quantity },
              },
            });

            await prisma.stockMovement.create({
              data: {
                equipmentId: currentItem.equipmentId,
                type: "OUT_DISTRIBUTION",
                quantity: item.quantity || currentItem.quantity,
                referenceNo: `HANDOVER-${params.id.slice(0, 8)}`,
                notes: `Diserahkan kepada ${updated.recipientName}`,
                createdBy: updated.officerName,
              },
            });
          }
          // If revoked, return stock
          else if (wasGiven && !nowGiven) {
            await prisma.equipment.update({
              where: { id: currentItem.equipmentId },
              data: {
                availableStock: { increment: item.quantity || currentItem.quantity },
              },
            });

            await prisma.stockMovement.create({
              data: {
                equipmentId: currentItem.equipmentId,
                type: "RETURN",
                quantity: item.quantity || currentItem.quantity,
                referenceNo: `RET-${params.id.slice(0, 8)}`,
                notes: `Dibatalkan penyerahan oleh ${updated.officerName}`,
                createdBy: updated.officerName,
              },
            });
          }
        }
      }
    }

    const fullResult = await prisma.logisticsHandover.findUnique({
      where: { id: params.id },
      include: {
        pilgrim: { include: { package: true } },
        items: { include: { equipment: true } },
      },
    });

    return NextResponse.json(fullResult);
  } catch (error) {
    console.error("Error updating handover:", error);
    return NextResponse.json({ error: "Failed to update handover" }, { status: 500 });
  }
}
