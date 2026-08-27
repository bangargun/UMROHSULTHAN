import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const packageId = searchParams.get("packageId");

    // 1. Build date range filter
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(`${startDate}T00:00:00.000Z`),
        lte: new Date(`${endDate}T23:59:59.999Z`),
      };
    } else if (startDate) {
      dateFilter = {
        gte: new Date(`${startDate}T00:00:00.000Z`),
      };
    } else if (endDate) {
      dateFilter = {
        lte: new Date(`${endDate}T23:59:59.999Z`),
      };
    }

    const hasDateFilter = Boolean(startDate || endDate);

    // 2. Fetch Journal Entries for this date range
    const journalEntries = await prisma.journalEntry.findMany({
      where: hasDateFilter ? { transactionDate: dateFilter } : {},
      include: {
        lines: true,
      },
      orderBy: { transactionDate: "desc" },
    });

    // 3. Check if we have journal data
    const hasJournalData = journalEntries.length > 0;

    let totalRevenuePaid = 0;
    let totalHPP = 0;
    let totalOperational = 0;
    const breakdownRevenue: { [key: string]: number } = {};
    const breakdownHPP: { [key: string]: number } = {};
    const breakdownOperational: { [key: string]: number } = {};

    if (hasJournalData) {
      journalEntries.forEach((entry) => {
        entry.lines.forEach((line) => {
          if (line.accountCategory === "REVENUE") {
            const val = line.credit - line.debit;
            totalRevenuePaid += val;
            const key = line.accountName || line.accountCode;
            breakdownRevenue[key] = (breakdownRevenue[key] || 0) + val;
          } else if (line.accountCategory === "HPP_EXPENSE") {
            const val = line.debit - line.credit;
            totalHPP += val;
            const key = line.accountName || line.accountCode;
            breakdownHPP[key] = (breakdownHPP[key] || 0) + val;
          } else if (line.accountCategory === "OPEX_EXPENSE") {
            const val = line.debit - line.credit;
            totalOperational += val;
            const key = line.accountName || line.accountCode;
            breakdownOperational[key] = (breakdownOperational[key] || 0) + val;
          }
        });
      });
    } else {
      // Fallback to Invoices & Expenses if no journal entries yet
      const [invoices, expenses] = await Promise.all([
        prisma.invoice.findMany({
          where: hasDateFilter ? { paymentDate: dateFilter } : {},
          include: { pilgrim: { include: { package: true } } },
        }),
        prisma.expense.findMany({
          where: hasDateFilter ? { expenseDate: dateFilter } : {},
          include: { package: true },
        }),
      ]);

      invoices.forEach((inv) => {
        if (inv.status === "PAID") {
          totalRevenuePaid += inv.amount;
          breakdownRevenue["Pendapatan Paket Umroh"] = (breakdownRevenue["Pendapatan Paket Umroh"] || 0) + inv.amount;
        }
      });

      const hppCategories = [
        "TIKET_PESAWAT",
        "HOTEL_SAUDI",
        "VISA_ASURANSI",
        "MUTHAWWIF_HANDLING",
        "LOGISTIK_VENDOR",
        "KOMISI_AGEN",
        "KOMISI_REFERRAL",
      ];
      expenses.forEach((exp) => {
        if (hppCategories.includes(exp.category)) {
          totalHPP += exp.amount;
          breakdownHPP[exp.title || exp.category] = (breakdownHPP[exp.title || exp.category] || 0) + exp.amount;
        } else {
          totalOperational += exp.amount;
          breakdownOperational[exp.title || exp.category] = (breakdownOperational[exp.title || exp.category] || 0) + exp.amount;
        }
      });
    }

    const totalRevenue = totalRevenuePaid;
    const grossProfit = totalRevenue - totalHPP;
    const totalExpenses = totalHPP + totalOperational;
    const netProfit = grossProfit - totalOperational;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // 4. Packages Report
    const packages = await prisma.package.findMany({
      include: {
        _count: { select: { pilgrims: true } },
        expenses: true,
        pilgrims: {
          include: { invoices: true },
        },
      },
      orderBy: { departureDate: "asc" },
    });

    const packageReports = packages.map((pkg) => {
      let pkgRevenue = 0;
      let pkgPending = 0;

      pkg.pilgrims.forEach((p) => {
        p.invoices.forEach((inv) => {
          if (inv.status === "PAID") pkgRevenue += inv.amount;
          else pkgPending += inv.amount;
        });
      });

      const pkgExpenses = pkg.expenses || [];
      const pkgHpp = pkgExpenses.reduce((acc, e) => acc + e.amount, 0);
      const pkgProfit = pkgRevenue - pkgHpp;
      const pkgMargin = pkgRevenue > 0 ? (pkgProfit / pkgRevenue) * 100 : 0;

      return {
        id: pkg.id,
        code: pkg.code,
        name: pkg.name,
        departureDate: pkg.departureDate,
        returnDate: pkg.returnDate,
        totalPilgrims: pkg._count.pilgrims,
        quota: pkg.quota,
        revenue: pkgRevenue,
        pendingRevenue: pkgPending,
        hpp: pkgHpp,
        profit: pkgProfit,
        margin: pkgMargin,
        airline: pkg.airline,
        hotelMakkah: pkg.hotelMakkah,
        hotelMadinah: pkg.hotelMadinah,
      };
    });

    return NextResponse.json({
      summary: {
        totalRevenuePaid,
        totalRevenuePending: 0,
        totalRevenue,
        totalHPP,
        totalOperational,
        totalExpenses,
        grossProfit,
        netProfit,
        grossMargin,
        netMargin,
        isFromJournal: hasJournalData,
        journalEntriesCount: journalEntries.length,
      },
      breakdownRevenue,
      breakdownHPP,
      breakdownOperational,
      packageReports,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    });
  } catch (error) {
    console.error("Error generating profit-loss report:", error);
    return NextResponse.json({ error: "Failed to generate financial report" }, { status: 500 });
  }
}
