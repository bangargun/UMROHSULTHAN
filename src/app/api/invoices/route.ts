import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const pilgrimId = searchParams.get("pilgrimId");

    const where: any = {};
    if (status) where.status = status;
    if (pilgrimId) where.pilgrimId = pilgrimId;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        pilgrim: {
          include: { package: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pilgrimId, type, title, amount, dueDate, notes } = body;

    if (!pilgrimId || !amount || !dueDate) {
      return NextResponse.json({ error: "Data wajib: Jamaah, Nominal, dan Tanggal Jatuh Tempo" }, { status: 400 });
    }

    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(count + 1).padStart(4, "0")}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        pilgrimId,
        type: type || "INSTALLMENT",
        title: title || "Tagihan Pembayaran Umroh",
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        status: "PENDING",
        notes,
      },
      include: {
        pilgrim: { include: { package: true } },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
