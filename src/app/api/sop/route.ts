import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {};
    if (category && category !== "ALL") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { code: { contains: search } },
        { tags: { contains: search } },
        { responsibleRole: { contains: search } },
        { contentMarkdown: { contains: search } },
      ];
    }

    const documents = await prisma.sopDocument.findMany({
      where,
      orderBy: [{ category: "asc" }, { orderIndex: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching SOP documents:", error);
    return NextResponse.json({ error: "Gagal memuat dokumen SOP" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      code,
      category,
      title,
      purpose,
      scope,
      responsibleRole,
      version,
      effectiveDate,
      contentMarkdown,
      tags,
      isMandatory,
    } = body;

    if (!title || !category || !contentMarkdown) {
      return NextResponse.json(
        { error: "Judul, Kategori, dan Isi Konten SOP wajib diisi" },
        { status: 400 }
      );
    }

    // Auto-generate code if empty
    let finalCode = code;
    if (!finalCode) {
      const count = await prisma.sopDocument.count();
      const prefix = category.startsWith("OPERASIONAL")
        ? "SOP-OPS"
        : category.startsWith("LEGALITAS")
        ? "REG-CORP"
        : category.startsWith("MITIGASI")
        ? "SOP-EMG"
        : category.startsWith("KEUANGAN")
        ? "SOP-FIN"
        : "SOP-HR";
      finalCode = `${prefix}-${String(count + 1).padStart(3, "0")}`;
    }

    const newDoc = await prisma.sopDocument.create({
      data: {
        code: finalCode,
        category,
        title,
        purpose: purpose || null,
        scope: scope || null,
        responsibleRole: responsibleRole || "Semua Divisi Terkait",
        version: version || "1.0",
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        contentMarkdown,
        tags: tags || null,
        isMandatory: isMandatory !== undefined ? Boolean(isMandatory) : true,
      },
    });

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error) {
    console.error("Error creating SOP document:", error);
    return NextResponse.json({ error: "Gagal menambahkan dokumen SOP" }, { status: 500 });
  }
}
