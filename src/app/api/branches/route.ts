import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(branches);
  } catch (error) {
    console.error("Error fetching branches:", error);
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, city, address, headName, phone, email } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "Nama Cabang dan Kode Cabang wajib diisi" }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();
    const existing = await prisma.branch.findUnique({ where: { code: cleanCode } });
    if (existing) {
      return NextResponse.json({ error: `Kode cabang "${cleanCode}" sudah terdaftar` }, { status: 400 });
    }

    const branch = await prisma.branch.create({
      data: {
        code: cleanCode,
        name,
        city: city || "Jakarta",
        address: address || null,
        headName: headName || null,
        phone: phone || null,
        email: email || null,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json({ error: "Failed to create branch" }, { status: 500 });
  }
}
