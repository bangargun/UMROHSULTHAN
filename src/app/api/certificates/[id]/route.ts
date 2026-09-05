import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id: params.id },
      include: {
        pilgrim: {
          include: { package: true },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: "Sertifikat tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(certificate);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch certificate" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { muthawwifName, directorName, directorTitle, issueDate, notes } = body;

    const updated = await prisma.certificate.update({
      where: { id: params.id },
      data: {
        muthawwifName: muthawwifName || undefined,
        directorName: directorName || undefined,
        directorTitle: directorTitle || undefined,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
      include: {
        pilgrim: {
          include: { package: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update certificate" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.certificate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete certificate" }, { status: 500 });
  }
}
