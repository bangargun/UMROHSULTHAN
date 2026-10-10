import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: { package: true },
    });
    if (!expense) {
      return NextResponse.json({ error: "Data pengeluaran tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch expense" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const {
      packageId,
      category,
      title,
      amount,
      currency,
      amountForeign,
      exchangeRate,
      expenseDate,
      dueDate,
      status,
      paymentMethod,
      recipientVendor,
      recipientPhone,
      approvedBy,
      paidBy,
      notes,
      items,
      proofUrl,
    } = body;

    const updated = await prisma.expense.update({
      where: { id: params.id },
      data: {
        ...(packageId !== undefined && { packageId: packageId || null }),
        ...(category && { category }),
        ...(title && { title: title.trim() }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(currency && { currency }),
        ...(amountForeign !== undefined && { amountForeign: amountForeign ? parseFloat(amountForeign) : null }),
        ...(exchangeRate !== undefined && { exchangeRate: exchangeRate ? parseFloat(exchangeRate) : null }),
        ...(expenseDate && { expenseDate: new Date(expenseDate) }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(status && { status }),
        ...(paymentMethod && { paymentMethod }),
        ...(recipientVendor !== undefined && { recipientVendor: recipientVendor ? recipientVendor.trim() : null }),
        ...(recipientPhone !== undefined && { recipientPhone: recipientPhone ? recipientPhone.trim() : null }),
        ...(approvedBy !== undefined && { approvedBy: approvedBy ? approvedBy.trim() : null }),
        ...(paidBy !== undefined && { paidBy: paidBy ? paidBy.trim() : null }),
        ...(notes !== undefined && { notes: notes ? notes.trim() : null }),
        ...(items !== undefined && { items: typeof items === "string" ? items : (items ? JSON.stringify(items) : null) }),
        ...(proofUrl !== undefined && { proofUrl }),
      },
      include: { package: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating expense:", error);
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
    console.error("Error deleting expense:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
