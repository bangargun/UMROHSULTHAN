import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    let whereClause: any = {};
    if (agentId && agentId !== "ALL") whereClause.agentId = agentId;

    const payouts = await prisma.agentCommissionPayout.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payouts);
  } catch (error) {
    console.error("Error fetching agent payouts:", error);
    return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agentId, packageId, pilgrimId, amount, notes } = body;

    if (!agentId || !amount) {
      return NextResponse.json({ error: "Agen dan Nominal Komisi wajib diisi" }, { status: 400 });
    }

    const payout = await prisma.agentCommissionPayout.create({
      data: {
        agentId,
        packageId: packageId || null,
        pilgrimId: pilgrimId || null,
        amount: parseFloat(amount),
        status: "APPROVED",
        notes: notes || null,
      },
    });

    return NextResponse.json(payout, { status: 201 });
  } catch (error) {
    console.error("Error creating agent payout:", error);
    return NextResponse.json({ error: "Failed to create payout" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, paymentProof, notes } = body;

    if (!id) return NextResponse.json({ error: "ID wajib disertakan" }, { status: 400 });

    const payout = await prisma.agentCommissionPayout.findUnique({ where: { id } });
    if (!payout) return NextResponse.json({ error: "Data pencairan tidak ditemukan" }, { status: 404 });

    const updated = await prisma.agentCommissionPayout.update({
      where: { id },
      data: {
        status: status || payout.status,
        paymentProof: paymentProof !== undefined ? paymentProof : payout.paymentProof,
        payoutDate: status === "PAID" ? new Date() : payout.payoutDate,
        notes: notes !== undefined ? notes : payout.notes,
      },
    });

    // If marked as PAID, post journal entry (Beban Komisi Agen & Kas Keluar)
    if (status === "PAID" && payout.status !== "PAID") {
      try {
        const agent = await prisma.agent.findUnique({ where: { id: payout.agentId } });
        const count = await prisma.journalEntry.count();
        const entryNumber = `JU-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

        await prisma.journalEntry.create({
          data: {
            entryNumber,
            transactionDate: new Date(),
            referenceNo: `PAYOUT-${payout.id.slice(0, 8).toUpperCase()}`,
            description: `Pencairan Komisi Agen / Mitra: ${agent?.name || "Mitra"} (Rp ${payout.amount.toLocaleString("id-ID")})`,
            sourceModule: "AGENT_PAYOUT",
            sourceId: payout.id,
            lines: {
              create: [
                {
                  accountCode: "5103",
                  accountName: "Beban Komisi Agen & Referral",
                  accountCategory: "HPP_EXPENSE",
                  debit: payout.amount,
                  credit: 0,
                  memo: `Beban komisi agen ${agent?.name || ""}`,
                },
                {
                  accountCode: "1101",
                  accountName: "Kas Utama / Bank",
                  accountCategory: "ASSET",
                  debit: 0,
                  credit: payout.amount,
                  memo: `Pengeluaran kas pembayaran komisi agen`,
                },
              ],
            },
          },
        });

        // Update agent total paid commission
        if (agent) {
          await prisma.agent.update({
            where: { id: agent.id },
            data: {
              paidCommission: { increment: payout.amount },
            },
          });
        }
      } catch (jErr) {
        console.error("Journal entry for payout error:", jErr);
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating payout status:", error);
    return NextResponse.json({ error: "Failed to update payout" }, { status: 500 });
  }
}
