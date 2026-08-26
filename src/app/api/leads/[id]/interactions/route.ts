import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { type, summary, nextFollowUpDate } = body;

    if (!summary) {
      return NextResponse.json({ error: "Ringkasan follow-up wajib diisi" }, { status: 400 });
    }

    const interaction = await prisma.leadInteraction.create({
      data: {
        leadId: params.id,
        type: type || "WHATSAPP",
        summary,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
      },
    });

    // Update status to CONTACTED if it was NEW
    const lead = await prisma.lead.findUnique({ where: { id: params.id } });
    if (lead && lead.status === "NEW") {
      await prisma.lead.update({
        where: { id: params.id },
        data: { status: "CONTACTED" },
      });
    }

    return NextResponse.json(interaction, { status: 201 });
  } catch (error) {
    console.error("Error creating interaction:", error);
    return NextResponse.json({ error: "Failed to record interaction" }, { status: 500 });
  }
}
