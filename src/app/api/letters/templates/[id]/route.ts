import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { code, title, subject, defaultDest, defaultNotes, bodyTemplate, isActive } = body;

    const cleanCode = code ? code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "") : undefined;

    const updated = await prisma.letterTemplate.update({
      where: { id: params.id },
      data: {
        code: cleanCode,
        title,
        subject,
        defaultDest,
        defaultNotes,
        bodyTemplate,
        isActive,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating letter template:", error);
    return NextResponse.json({ error: "Failed to update letter template" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.letterTemplate.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting letter template:", error);
    return NextResponse.json({ error: "Failed to delete letter template" }, { status: 500 });
  }
}
