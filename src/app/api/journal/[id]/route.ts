import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { transactionDate, description, referenceNo, lines } = body;

    if (!description || !lines || !Array.isArray(lines) || lines.length < 2) {
      return NextResponse.json(
        { error: "Jurnal Umum minimal harus memiliki 2 baris." },
        { status: 400 }
      );
    }

    const totalDebit = lines.reduce((acc: number, l: any) => acc + (parseFloat(l.debit) || 0), 0);
    const totalCredit = lines.reduce((acc: number, l: any) => acc + (parseFloat(l.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: `Debet (Rp ${totalDebit.toLocaleString()}) dan Kredit (Rp ${totalCredit.toLocaleString()}) harus balance.` },
        { status: 400 }
      );
    }

    // Delete existing lines and re-create
    await prisma.journalEntryLine.deleteMany({
      where: { journalEntryId: params.id },
    });

    const updated = await prisma.journalEntry.update({
      where: { id: params.id },
      data: {
        transactionDate: transactionDate ? new Date(transactionDate) : undefined,
        description,
        referenceNo: referenceNo || null,
        lines: {
          create: lines.map((l: any) => ({
            accountCode: l.accountCode,
            accountName: l.accountName,
            accountCategory: l.accountCategory || "ASSET",
            debit: parseFloat(l.debit) || 0,
            credit: parseFloat(l.credit) || 0,
            memo: l.memo || null,
          })),
        },
      },
      include: { lines: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating journal entry:", error);
    return NextResponse.json({ error: "Failed to update journal entry" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.journalEntry.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    return NextResponse.json({ error: "Failed to delete journal entry" }, { status: 500 });
  }
}
