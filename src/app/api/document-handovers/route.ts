import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const documentHandovers = await prisma.documentHandover.findMany({
      include: {
        pilgrim: {
          include: { package: true },
        },
      },
      orderBy: { handoverDate: "desc" },
    });
    return NextResponse.json(documentHandovers);
  } catch (error) {
    console.error("Error fetching document handovers:", error);
    return NextResponse.json({ error: "Failed to fetch document handovers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      pilgrimId,
      handoverType = "RECEIVE_FROM_PILGRIM",
      handoverDate,
      officerName,
      submitterName,
      submitterPhone,
      submitterRelation = "YANG_BERSANGKUTAN",
      hasOriginalPassport = true,
      passportNumber,
      passportExpiry,
      passportPhysicalState = "BAIK_LENGKAP",
      hasYellowVaccineBook = false,
      vaccineNotes,
      hasPassportPhotos = false,
      photoCount = 0,
      hasFamilyCardCopy = false,
      hasIdCardCopy = false,
      hasMarriageBook = false,
      hasBirthCertificate = false,
      additionalDocuments,
      notes,
      submitterSignatureUrl,
      officerSignatureUrl,
    } = body;

    if (!pilgrimId || !officerName || !submitterName) {
      return NextResponse.json(
        { error: "Data wajib: Calon Jamaah, Nama Petugas Penerima, dan Nama Penyerah Dokumen" },
        { status: 400 }
      );
    }

    const now = handoverDate ? new Date(handoverDate) : new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    // Hitung sequence nomor surat tanda terima bulan ini
    const countThisMonth = await prisma.documentHandover.count({
      where: {
        createdAt: {
          gte: new Date(year, now.getMonth(), 1),
          lt: new Date(year, now.getMonth() + 1, 1),
        },
      },
    });

    const seqNumber = String(countThisMonth + 1).padStart(3, "0");
    const prefix = handoverType === "RETURN_TO_PILGRIM" ? "BAST-KEMBALI" : "STT-PASPOR";
    const receiptNumber = `${prefix}/BSH/${year}${month}/${seqNumber}`;

    const newHandover = await prisma.documentHandover.create({
      data: {
        receiptNumber,
        pilgrimId,
        handoverType,
        handoverDate: now,
        officerName: officerName.trim(),
        submitterName: submitterName.trim(),
        submitterPhone: submitterPhone ? submitterPhone.trim() : null,
        submitterRelation,
        hasOriginalPassport: !!hasOriginalPassport,
        passportNumber: passportNumber ? passportNumber.trim().toUpperCase() : null,
        passportExpiry: passportExpiry ? new Date(passportExpiry) : null,
        passportPhysicalState,
        hasYellowVaccineBook: !!hasYellowVaccineBook,
        vaccineNotes: vaccineNotes ? vaccineNotes.trim() : null,
        hasPassportPhotos: !!hasPassportPhotos,
        photoCount: Number(photoCount) || 0,
        hasFamilyCardCopy: !!hasFamilyCardCopy,
        hasIdCardCopy: !!hasIdCardCopy,
        hasMarriageBook: !!hasMarriageBook,
        hasBirthCertificate: !!hasBirthCertificate,
        additionalDocuments: additionalDocuments ? additionalDocuments.trim() : null,
        notes: notes ? notes.trim() : null,
        submitterSignatureUrl: submitterSignatureUrl || null,
        officerSignatureUrl: officerSignatureUrl || null,
        status: handoverType === "RETURN_TO_PILGRIM" ? "RETURNED_TO_PILGRIM" : "STORED_SAFELY",
      },
      include: {
        pilgrim: {
          include: { package: true },
        },
      },
    });

    // Otomatis sinkronkan data paspor ke profil jamaah jika belum lengkap
    if (passportNumber) {
      const updateData: any = {};
      if (passportNumber) updateData.passportNumber = passportNumber.trim().toUpperCase();
      if (passportExpiry) updateData.passportExpiry = new Date(passportExpiry);

      await prisma.pilgrim.update({
        where: { id: pilgrimId },
        data: updateData,
      });

      // Update requirement paspor fisik jika ada di PilgrimRequirement
      try {
        await prisma.pilgrimRequirement.updateMany({
          where: {
            pilgrimId,
            name: { contains: "Paspor" },
          },
          data: {
            isSubmitted: true,
            notes: `Fisik diserahkan via ${receiptNumber}`,
          },
        });
      } catch (e) {
        // Abaikan jika tidak ada requirement paspor
      }
    }

    return NextResponse.json(newHandover, { status: 201 });
  } catch (error) {
    console.error("Error creating document handover:", error);
    return NextResponse.json({ error: "Failed to create document handover" }, { status: 500 });
  }
}
