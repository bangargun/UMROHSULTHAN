import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const letters = await prisma.officialLetter.findMany({
      include: {
        pilgrim: {
          include: { package: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(letters);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch letters" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      pilgrimId,
      type,
      customTitle,
      customSubject,
      customBody,
      destinationInstitution,
      applicantJobTitle,
      customNotes,
      generatedBy,
    } = body;

    if (!pilgrimId || !type || !destinationInstitution) {
      return NextResponse.json({ error: "Data wajib: Jamaah, Jenis Surat, dan Tujuan Surat" }, { status: 400 });
    }

    const now = new Date();
    const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    const monthRoman = romanMonths[now.getMonth()];
    const year = now.getFullYear();

    // Get all letters for the current year to find the highest sequential sequence
    const currentYearLetters = await prisma.officialLetter.findMany({
      select: { letterNumber: true },
      orderBy: { createdAt: "desc" },
    });

    let nextSeq = 1;
    for (const item of currentYearLetters) {
      const match = item.letterNumber.match(/^(\d+)\//);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= nextSeq) {
          nextSeq = num + 1;
        }
      }
    }

    // Dynamically lookup prefix from LetterTemplate master data
    const tmpl = await prisma.letterTemplate.findFirst({
      where: {
        OR: [{ typeKey: type }, { code: type }],
      },
    });

    let prefix = tmpl?.code || "RESMI";
    if (!tmpl) {
      if (type === "SURAT_ENDORSEMENT_PASPOR") prefix = "ENDOS";
      else if (type === "SURAT_REKOMENDASI_PASPOR") prefix = "PASPOR";
      else if (type === "SURAT_IZIN_CUTI") prefix = "CUTI";
      else if (type === "SURAT_PENGANTAR_KEMENAG") prefix = "KEMENAG";
      else if (type === "SURAT_KETERANGAN_JAMAAH") prefix = "JAMAAH";
      else if (type === "SURAT_MAHRAM") prefix = "MAHRAM";
      else if (type === "SURAT_CUSTOM") prefix = "RESMI";
    }

    // Format: 001/ENDOS/SULTHAN/VIII/2026
    const letterNumber = `${String(nextSeq).padStart(3, "0")}/${prefix}/SULTHAN/${monthRoman}/${year}`;

    const letter = await prisma.officialLetter.create({
      data: {
        letterNumber,
        pilgrimId,
        type,
        customTitle: customTitle || null,
        customSubject: customSubject || null,
        customBody: customBody || null,
        destinationInstitution,
        applicantJobTitle: applicantJobTitle || null,
        customNotes: customNotes || null,
        generatedBy: generatedBy || "H. Sulthan Syarif, Lc., M.A.",
      },
      include: {
        pilgrim: {
          include: { package: true },
        },
      },
    });

    return NextResponse.json(letter, { status: 201 });
  } catch (error) {
    console.error("Error generating official letter:", error);
    return NextResponse.json({ error: "Failed to generate official letter" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      pilgrimId,
      type,
      customTitle,
      customSubject,
      customBody,
      destinationInstitution,
      applicantJobTitle,
      customNotes,
      generatedBy,
      fatherName,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "ID surat wajib disertakan" }, { status: 400 });
    }

    const updated = await prisma.officialLetter.update({
      where: { id },
      data: {
        pilgrimId: pilgrimId || undefined,
        type: type || undefined,
        customTitle: customTitle || null,
        customSubject: customSubject || null,
        customBody: customBody || null,
        destinationInstitution: destinationInstitution || undefined,
        applicantJobTitle: applicantJobTitle || null,
        customNotes: customNotes || null,
        generatedBy: generatedBy || undefined,
      },
      include: {
        pilgrim: {
          include: { package: true },
        },
      },
    });

    if (pilgrimId && fatherName && fatherName.trim() !== "") {
      try {
        await prisma.pilgrim.update({
          where: { id: pilgrimId },
          data: { fatherName: fatherName.trim().toUpperCase() },
        });
      } catch (err) {
        console.warn("Auto-update fatherName warning:", err);
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating official letter:", error);
    return NextResponse.json({ error: "Failed to update official letter" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID surat wajib disertakan" }, { status: 400 });
    }

    await prisma.officialLetter.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting official letter:", error);
    return NextResponse.json({ error: "Failed to delete official letter" }, { status: 500 });
  }
}
