import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let whereClause: any = {};
    if (category && category !== "ALL") {
      whereClause.category = category;
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { question: { contains: search } },
        { answer: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const faqs = await prisma.salesFaq.findMany({
      where: whereClause,
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(faqs);
  } catch (error) {
    console.error("Error fetching sales FAQs:", error);
    return NextResponse.json({ error: "Failed to fetch sales FAQs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, title, question, answer, waScript, tags, isMandatory } = body;

    if (!title || !question || !answer) {
      return NextResponse.json({ error: "Judul, Pertanyaan/Komplain, dan Jawaban wajib diisi" }, { status: 400 });
    }

    const count = await prisma.salesFaq.count();
    const faq = await prisma.salesFaq.create({
      data: {
        category: category || "CLOSING_OBJECTION",
        title: title.trim(),
        question: question.trim(),
        answer: answer.trim(),
        waScript: waScript ? waScript.trim() : null,
        tags: tags ? tags.trim() : null,
        isMandatory: isMandatory !== undefined ? Boolean(isMandatory) : true,
        orderIndex: count + 1,
      },
    });

    return NextResponse.json(faq, { status: 201 });
  } catch (error) {
    console.error("Error creating sales FAQ:", error);
    return NextResponse.json({ error: "Failed to create sales FAQ" }, { status: 500 });
  }
}
