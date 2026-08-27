import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(agents);
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, city, referralCode, commissionPerPax, bankName, accountNumber, accountHolder } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Nama dan Nomor WhatsApp agen wajib diisi" }, { status: 400 });
    }

    const cleanPhone = phone.trim();
    const cleanCity = city || "Jakarta";
    const refCode = referralCode
      ? referralCode.toUpperCase().trim()
      : `SULTHAN-${cleanCity.slice(0, 3).toUpperCase()}${Math.floor(10 + Math.random() * 90)}`;

    const existing = await prisma.agent.findFirst({
      where: {
        OR: [{ phone: cleanPhone }, { referralCode: refCode }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Agen dengan nomor WhatsApp atau Kode Referral tersebut sudah terdaftar" },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        phone: cleanPhone,
        city: cleanCity,
        referralCode: refCode,
        commissionPerPax: commissionPerPax ? parseFloat(commissionPerPax) : 1500000,
        bankName: bankName || "BSI",
        accountNumber: accountNumber || null,
        accountHolder: accountHolder || name,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error("Error creating agent:", error);
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}
