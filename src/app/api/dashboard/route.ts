import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalLeads,
      leadsByStatus,
      totalPilgrims,
      pilgrimsByStatus,
      invoices,
      lowStockItems,
      upcomingPackages,
      recentLeads,
      recentInvoices,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.pilgrim.count(),
      prisma.pilgrim.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.invoice.findMany({
        select: {
          amount: true,
          status: true,
          type: true,
        },
      }),
      prisma.equipment.findMany({
        where: {
          availableStock: {
            lte: prisma.equipment.fields.minStockAlert,
          },
        },
      }),
      prisma.package.findMany({
        where: {
          departureDate: {
            gte: new Date(),
          },
        },
        orderBy: { departureDate: "asc" },
        take: 3,
        include: {
          _count: { select: { pilgrims: true } },
        },
      }),
      prisma.lead.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          pilgrim: true,
        },
      }),
    ]);

    // Financial sums
    let totalRevenue = 0;
    let totalPending = 0;
    let totalOverdue = 0;

    for (const inv of invoices) {
      if (inv.status === "PAID") {
        totalRevenue += inv.amount;
      } else if (inv.status === "PENDING") {
        totalPending += inv.amount;
      } else if (inv.status === "OVERDUE") {
        totalOverdue += inv.amount;
      }
    }

    return NextResponse.json({
      summary: {
        totalLeads,
        totalPilgrims,
        totalRevenue,
        totalPending,
        totalOverdue,
        lowStockCount: lowStockItems.length,
      },
      leadsByStatus,
      pilgrimsByStatus,
      upcomingPackages,
      recentLeads,
      recentInvoices,
      lowStockItems,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
