import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        interactions: {
          orderBy: { createdAt: "desc" },
        },
        pilgrim: {
          select: { id: true, name: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, city, source, notes, budget, estimatedPax, assignedAgent } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Nama dan Nomor Telepon wajib diisi" }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email: email || null,
        city: city || null,
        source: source || "INSTAGRAM",
        status: "NEW",
        notes: notes || null,
        budget: budget ? parseFloat(budget) : null,
        estimatedPax: estimatedPax ? parseInt(estimatedPax) : 1,
        assignedAgent: assignedAgent || null,
      },
    });

    // Create initial interaction
    await prisma.leadInteraction.create({
      data: {
        leadId: lead.id,
        type: "WHATSAPP",
        summary: `Lead baru dibuat via channel ${lead.source}. Catatan: ${notes || "Belum ada catatan."}`,
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
