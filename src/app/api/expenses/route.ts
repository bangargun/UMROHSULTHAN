import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get("packageId");
    const category = searchParams.get("category");

    const where: any = {};
    if (packageId) where.packageId = packageId;
    if (category) where.category = category;

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        package: true,
      },
      orderBy: { expenseDate: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { packageId, category, title, amount, expenseDate, paymentMethod, recipientVendor, notes } = body;

    if (!title || !amount) {
      return NextResponse.json({ error: "Nama Pengeluaran dan Nominal wajib diisi" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        packageId: packageId || null,
        category: category || "OPERASIONAL_KANTOR",
        title,
        amount: parseFloat(amount),
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        paymentMethod: paymentMethod || "BANK_TRANSFER",
        recipientVendor: recipientVendor || null,
        notes: notes || null,
        createdBy: "Admin Keuangan",
      },
      include: {
        package: true,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
