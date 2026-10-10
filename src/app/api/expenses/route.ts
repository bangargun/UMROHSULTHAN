import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get("packageId");
    const category = searchParams.get("category");
    const documentType = searchParams.get("documentType");

    const where: any = {};
    if (packageId) where.packageId = packageId;
    if (category) where.category = category;
    if (documentType) where.documentType = documentType;

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
    const {
      voucherNumber,
      documentType = "BKK",
      packageId,
      category,
      title,
      amount,
      currency = "IDR",
      amountForeign,
      exchangeRate,
      expenseDate,
      dueDate,
      status = "PAID",
      paymentMethod = "BANK_TRANSFER",
      recipientVendor,
      recipientPhone,
      approvedBy,
      paidBy,
      notes,
      items,
      proofUrl,
    } = body;

    if (!title || amount === undefined || amount === null) {
      return NextResponse.json({ error: "Peruntukan Pengeluaran dan Nominal wajib diisi" }, { status: 400 });
    }

    const now = expenseDate ? new Date(expenseDate) : new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    let finalVoucherNumber = voucherNumber ? voucherNumber.trim() : null;

    if (!finalVoucherNumber) {
      const countThisMonth = await prisma.expense.count({
        where: {
          createdAt: {
            gte: new Date(year, now.getMonth(), 1),
            lt: new Date(year, now.getMonth() + 1, 1),
          },
        },
      });

      const seq = String(countThisMonth + 1).padStart(3, "0");
      const prefix = documentType === "VENDOR_INVOICE" ? "INV-VEND" : "BKK";
      finalVoucherNumber = `${prefix}/BSH/${year}${month}/${seq}`;
    }

    const expense = await prisma.expense.create({
      data: {
        voucherNumber: finalVoucherNumber,
        documentType: documentType || "BKK",
        packageId: packageId || null,
        category: category || "OPERASIONAL_KANTOR",
        title: title.trim(),
        amount: parseFloat(amount) || 0,
        currency: currency || "IDR",
        amountForeign: amountForeign ? parseFloat(amountForeign) : null,
        exchangeRate: exchangeRate ? parseFloat(exchangeRate) : null,
        expenseDate: now,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || "PAID",
        paymentMethod: paymentMethod || "BANK_TRANSFER",
        recipientVendor: recipientVendor ? recipientVendor.trim() : null,
        recipientPhone: recipientPhone ? recipientPhone.trim() : null,
        approvedBy: approvedBy ? approvedBy.trim() : "Pimpinan Travel",
        paidBy: paidBy ? paidBy.trim() : "Kasir / Bagian Keuangan",
        notes: notes ? notes.trim() : null,
        items: typeof items === "string" ? items : (items ? JSON.stringify(items) : null),
        proofUrl: proofUrl || null,
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
