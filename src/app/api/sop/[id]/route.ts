import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prisma.sopDocument.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json({ error: "Dokumen SOP tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error fetching SOP detail:", error);
    return NextResponse.json({ error: "Gagal memuat dokumen SOP" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const existing = await prisma.sopDocument.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Dokumen SOP tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.sopDocument.update({
      where: { id: params.id },
      data: {
        code: code !== undefined ? code : existing.code,
        category: category !== undefined ? category : existing.category,
        title: title !== undefined ? title : existing.title,
        purpose: purpose !== undefined ? purpose : existing.purpose,
        scope: scope !== undefined ? scope : existing.scope,
        responsibleRole: responsibleRole !== undefined ? responsibleRole : existing.responsibleRole,
        version: version !== undefined ? version : existing.version,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : existing.effectiveDate,
        contentMarkdown: contentMarkdown !== undefined ? contentMarkdown : existing.contentMarkdown,
        tags: tags !== undefined ? tags : existing.tags,
        isMandatory: isMandatory !== undefined ? Boolean(isMandatory) : existing.isMandatory,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating SOP document:", error);
    return NextResponse.json({ error: "Gagal memperbarui dokumen SOP" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.sopDocument.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Dokumen SOP berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting SOP document:", error);
    return NextResponse.json({ error: "Gagal menghapus dokumen SOP" }, { status: 500 });
  }
}
