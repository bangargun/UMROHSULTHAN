import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { category, title, question, answer, waScript, tags, isMandatory } = body;

    const existing = await prisma.salesFaq.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "FAQ / Panduan tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.salesFaq.update({
      where: { id },
      data: {
        category: category !== undefined ? category : existing.category,
        title: title !== undefined ? title.trim() : existing.title,
        question: question !== undefined ? question.trim() : existing.question,
        answer: answer !== undefined ? answer.trim() : existing.answer,
        waScript: waScript !== undefined ? waScript : existing.waScript,
        tags: tags !== undefined ? tags : existing.tags,
        isMandatory: isMandatory !== undefined ? Boolean(isMandatory) : existing.isMandatory,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating sales FAQ:", error);
    return NextResponse.json({ error: "Failed to update sales FAQ" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.salesFaq.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "FAQ berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting sales FAQ:", error);
    return NextResponse.json({ error: "Failed to delete sales FAQ" }, { status: 500 });
  }
}
