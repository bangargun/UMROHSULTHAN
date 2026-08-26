import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let whereClause: any = {};

    if (startDate && endDate) {
      whereClause.transactionDate = {
        gte: new Date(`${startDate}T00:00:00.000Z`),
        lte: new Date(`${endDate}T23:59:59.999Z`),
      };
    } else if (startDate) {
      whereClause.transactionDate = {
        gte: new Date(`${startDate}T00:00:00.000Z`),
      };
    } else if (endDate) {
      whereClause.transactionDate = {
        lte: new Date(`${endDate}T23:59:59.999Z`),
      };
    }

    const entries = await prisma.journalEntry.findMany({
      where: whereClause,
      include: {
        lines: true,
      },
      orderBy: { transactionDate: "desc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return NextResponse.json({ error: "Failed to fetch journal entries" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transactionDate, description, referenceNo, lines, createdBy, sourceModule, sourceId } = body;

    if (!description || !lines || !Array.isArray(lines) || lines.length < 2) {
      return NextResponse.json(
        { error: "Jurnal Umum minimal harus memiliki 2 baris (Debet & Kredit berpasangan)." },
        { status: 400 }
      );
    }

    // Validate debit == credit
    const totalDebit = lines.reduce((acc: number, l: any) => acc + (parseFloat(l.debit) || 0), 0);
    const totalCredit = lines.reduce((acc: number, l: any) => acc + (parseFloat(l.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: `Total Debet (Rp ${totalDebit.toLocaleString()}) harus sama dengan Total Kredit (Rp ${totalCredit.toLocaleString()}). Kaidah akuntansi harus balance.` },
        { status: 400 }
      );
    }

    // Generate sequential entry number: JU-YYYYMM-0001
    const tDate = transactionDate ? new Date(transactionDate) : new Date();
    const yearMonth = `${tDate.getFullYear()}${String(tDate.getMonth() + 1).padStart(2, "0")}`;
    
    const countMonth = await prisma.journalEntry.count({
      where: {
        entryNumber: {
          startsWith: `JU-${yearMonth}-`,
        },
      },
    });

    const entryNumber = `JU-${yearMonth}-${String(countMonth + 1).padStart(4, "0")}`;

    const created = await prisma.journalEntry.create({
      data: {
        entryNumber,
        transactionDate: tDate,
        description,
        referenceNo: referenceNo || null,
        sourceModule: sourceModule || "MANUAL",
        sourceId: sourceId || null,
        createdBy: createdBy || "Admin Akuntansi",
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
      include: {
        lines: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating journal entry:", error);
    return NextResponse.json({ error: "Failed to create journal entry" }, { status: 500 });
  }
}
