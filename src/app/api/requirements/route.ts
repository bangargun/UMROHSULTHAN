import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, isSubmitted, isVerified, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "ID Syarat wajib diisi" }, { status: 400 });
    }

    const requirement = await prisma.pilgrimRequirement.update({
      where: { id },
      data: {
        isSubmitted: isSubmitted !== undefined ? isSubmitted : undefined,
        isVerified: isVerified !== undefined ? isVerified : undefined,
        verifiedAt: isVerified ? new Date() : (isVerified === false ? null : undefined),
        notes: notes !== undefined ? notes : undefined,
      },
    });

    // Check if all requirements of this pilgrim are verified
    const allReqs = await prisma.pilgrimRequirement.findMany({
      where: { pilgrimId: requirement.pilgrimId },
    });

    const allVerified = allReqs.every((r) => r.isVerified);
    if (allVerified) {
      await prisma.pilgrim.update({
        where: { id: requirement.pilgrimId },
        data: { status: "DOCUMENTS_READY" },
      });
    }

    return NextResponse.json(requirement);
  } catch (error) {
    console.error("Error updating requirement:", error);
    return NextResponse.json({ error: "Failed to update requirement" }, { status: 500 });
  }
}
