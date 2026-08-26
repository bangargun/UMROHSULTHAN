import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { packageId, category, title, amount, expenseDate, paymentMethod, recipientVendor, notes } = body;

    const updated = await prisma.expense.update({
      where: { id: params.id },
      data: {
        packageId: packageId || null,
        category,
        title,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        expenseDate: expenseDate ? new Date(expenseDate) : undefined,
        paymentMethod,
        recipientVendor,
        notes,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.expense.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
