import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        interactions: { orderBy: { createdAt: "desc" } },
        pilgrim: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      city,
      source,
      agentName,
      referralPilgrimName,
      packageId,
      status,
      notes,
      budget,
      estimatedPax,
      assignedAgent,
    } = body;

    const updated = await prisma.lead.update({
      where: { id: params.id },
      data: {
        name,
        phone,
        email,
        city,
        source,
        agentName: source === "AGENT" ? agentName || null : null,
        referralPilgrimName: source === "REFERRAL" ? referralPilgrimName || null : null,
        packageId: packageId !== undefined ? packageId : undefined,
        status,
        notes,
        budget: budget !== undefined ? parseFloat(budget) : undefined,
        estimatedPax: estimatedPax !== undefined ? parseInt(estimatedPax) : undefined,
        assignedAgent,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.lead.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
