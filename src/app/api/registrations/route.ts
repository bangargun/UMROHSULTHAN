import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { saveUploadedFile, GOOGLE_DRIVE_MAIN_FOLDER_ID } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

// GET: Ambil daftar seluruh antrean pendaftaran
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { regNumber: { contains: search } },
        { idJamaah: { contains: search } },
        { phone: { contains: search } },
        { nik: { contains: search } },
      ];
    }

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        package: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(registrations);
  } catch (error: any) {
    console.error("Failed to fetch registrations:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pendaftaran", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Pendaftaran baru dari Landing Page (Jamaah / Agen)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title = "Bpk",
      fullName,
      fatherName,
      identityType = "KTP",
      nik,
      hasPassport = false,
      passportName,
      passportNumber,
      passportIssuedDate,
      passportIssuedCity,
      passportExpiry,
      placeOfBirth,
      dateOfBirth,
      gender = "MALE",
      address,
      subDistrict,
      district,
      city,
      province,
      telephone,
      phone,
      email,
      citizenship = "WNI",
      maritalStatus,
      education,
      job,
      packageId,
      roomType = "QUAD",
      uniformSize = "L",
      chronicDiseases,
      wheelchairAssistance = false,
      wheelchairNotes,
      umrahExperienceCount = "BELUM_PERNAH",
      isPreviousClient = false,
      previousPackageName,
      channel = "DIRECT",
      agentId,
      agentName,
      referralName,
      ktpBase64,
      familyCardBase64,
      passportBase64,
      diplomaBase64,
      marriageBookBase64,
      notes,
    } = body;

    if (!fullName || !phone || !nik || !packageId) {
      return NextResponse.json(
        { error: "Nama lengkap, nomor WhatsApp, NIK, dan Paket Umroh wajib diisi!" },
        { status: 400 }
      );
    }

    // Ambil info paket
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      return NextResponse.json(
        { error: "Paket umroh yang dipilih tidak ditemukan!" },
        { status: 404 }
      );
    }

    // Validasi Cutoff Pendaftaran: Maksimal H-10 sebelum keberangkatan
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const depDate = new Date(pkg.departureDate);
    const diffTime = depDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 10) {
      return NextResponse.json(
        {
          error: `Pendaftaran untuk paket "${pkg.name}" telah ditutup karena batas akhir pendaftaran adalah H-10 sebelum keberangkatan (Keberangkatan: ${depDate.toISOString().split("T")[0]}, sisa ${diffDays} hari).`,
        },
        { status: 400 }
      );
    }

    // Tentukan harga berdasarkan tipe kamar
    let pricePackage = pkg.priceQuad;
    if (roomType === "TRIPLE") pricePackage = pkg.priceTriple;
    if (roomType === "DOUBLE") pricePackage = pkg.priceDouble;

    // Generate Sequence Number unik
    const count = await prisma.registration.count();
    const dateStr = new Date().toISOString().slice(2, 7).replace("-", ""); // e.g. 2608
    const seq = String(count + 1).padStart(4, "0");
    const regNumber = `REG-${dateStr}-${seq}`;
    const idJamaah = `JAM-${dateStr}-${seq}`;

    // Label Pengalaman Umroh
    const expMap: { [key: string]: string } = {
      BELUM_PERNAH: "Belum Pernah (Pertama Kali)",
      "1_KALI": "1 Kali",
      "2_KALI": "2 Kali",
      "3_KALI": "3 Kali",
      LEBIH_DARI_3_KALI: "Lebih dari 3 Kali",
    };
    const expLabel = expMap[umrahExperienceCount] || umrahExperienceCount;
    const alumniText = isPreviousClient ? ` | Alumni Sulthan Haramain (${previousPackageName || "Program Sebelumnya"})` : "";

    // 1. Catat Otomatis ke Prospek Marketing & Pencarian Jamaah (Leads CRM)
    let leadId: string | null = null;
    try {
      const createdLead = await prisma.lead.create({
        data: {
          name: fullName.trim().toUpperCase(),
          phone: phone.trim(),
          email: email ? email.trim() : null,
          city: city ? city.trim() : "Tebing Tinggi",
          source: channel === "AGENT" ? "AGENT" : "WEBSITE",
          agentName: agentName || null,
          referralPilgrimName: referralName || null,
          packageId: packageId,
          status: "CLOSING_DP", // Status prospek siap bayar DP
          budget: pricePackage,
          estimatedPax: 1,
          notes: `[Pendaftaran Online ${regNumber}] ID Jamaah: ${idJamaah} | Paket: ${pkg.name} | Kamar: ${roomType} | Baju: ${uniformSize} | Umroh: ${expLabel}${alumniText} | Ayah: ${fatherName || "-"} | Paspor: ${hasPassport ? (passportNumber || "Ada") : "Belum Ada"} | Riwayat Penyakit: ${chronicDiseases || "Tidak Ada"} ${wheelchairAssistance ? `| Kursi Roda: ${wheelchairNotes || "Ya"}` : ""}`.trim(),
          interactions: {
            create: {
              type: "WHATSAPP",
              summary: `Calon jamaah mendaftar online melalui Landing Page resmi (No. Reg: ${regNumber}). Pengalaman umroh: ${expLabel}${alumniText}. Menunggu verifikasi DP.`,
            },
          },
        },
      });
      leadId = createdLead.id;
    } catch (leadErr) {
      console.error("Gagal sinkronisasi Lead CRM:", leadErr);
    }

    // 1. Upload KTP (Wajib)
    let ktpFileUrl: string | null = null;
    if (ktpBase64) {
      try {
        const saved = await saveUploadedFile({
          fileBase64: ktpBase64,
          fileName: `KTP_${fullName.replace(/\s+/g, "_")}_${nik.slice(-4)}.jpg`,
          subFolder: "ktp",
        });
        ktpFileUrl = saved.fileUrl;
      } catch (err) {
        console.error("Gagal simpan KTP:", err);
      }
    }

    // 2. Upload Kartu Keluarga (Wajib)
    let familyCardFileUrl: string | null = null;
    if (familyCardBase64) {
      try {
        const saved = await saveUploadedFile({
          fileBase64: familyCardBase64,
          fileName: `KK_${fullName.replace(/\s+/g, "_")}_${nik.slice(-4)}.jpg`,
          subFolder: "kk",
        });
        familyCardFileUrl = saved.fileUrl;
      } catch (err) {
        console.error("Gagal simpan Kartu Keluarga:", err);
      }
    }

    // 3. Upload Paspor (Kondisional jika ada)
    let passportFileUrl: string | null = null;
    if (passportBase64) {
      try {
        const saved = await saveUploadedFile({
          fileBase64: passportBase64,
          fileName: `PASPOR_${fullName.replace(/\s+/g, "_")}_${(passportNumber || "DOK").slice(-4)}.jpg`,
          subFolder: "passport",
        });
        passportFileUrl = saved.fileUrl;
      } catch (err) {
        console.error("Gagal simpan Paspor:", err);
      }
    }

    // 4. Upload Ijazah (Kondisional jika ada)
    let diplomaFileUrl: string | null = null;
    if (diplomaBase64) {
      try {
        const saved = await saveUploadedFile({
          fileBase64: diplomaBase64,
          fileName: `IJAZAH_${fullName.replace(/\s+/g, "_")}_${nik.slice(-4)}.jpg`,
          subFolder: "ijazah",
        });
        diplomaFileUrl = saved.fileUrl;
      } catch (err) {
        console.error("Gagal simpan Ijazah:", err);
      }
    }

    // 5. Upload Buku Nikah (Kondisional jika ada)
    let marriageBookFileUrl: string | null = null;
    if (marriageBookBase64) {
      try {
        const saved = await saveUploadedFile({
          fileBase64: marriageBookBase64,
          fileName: `BUKUNIKAH_${fullName.replace(/\s+/g, "_")}_${nik.slice(-4)}.jpg`,
          subFolder: "buku_nikah",
        });
        marriageBookFileUrl = saved.fileUrl;
      } catch (err) {
        console.error("Gagal simpan Buku Nikah:", err);
      }
    }

    // Buat data pendaftaran di database dengan status NEW
    const newReg = await prisma.registration.create({
      data: {
        regNumber,
        idJamaah,
        title: title || "Bpk",
        fullName: fullName.trim().toUpperCase(),
        fatherName: fatherName ? fatherName.trim().toUpperCase() : null,
        identityType: identityType || "KTP",
        nik: nik.trim(),
        hasPassport: Boolean(hasPassport),
        passportName: passportName ? passportName.trim().toUpperCase() : null,
        passportNumber: passportNumber ? passportNumber.trim().toUpperCase() : null,
        passportIssuedDate: passportIssuedDate ? new Date(passportIssuedDate) : null,
        passportIssuedCity: passportIssuedCity ? passportIssuedCity.trim() : null,
        passportExpiry: passportExpiry ? new Date(passportExpiry) : null,
        placeOfBirth: placeOfBirth ? placeOfBirth.trim() : null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || "MALE",
        address: address ? address.trim() : null,
        subDistrict: subDistrict ? subDistrict.trim() : null,
        district: district ? district.trim() : null,
        city: city ? city.trim() : null,
        province: province ? province.trim() : null,
        telephone: telephone ? telephone.trim() : null,
        phone: phone.trim(),
        email: email ? email.trim() : null,
        citizenship: citizenship || "WNI",
        maritalStatus: maritalStatus || null,
        education: education || null,
        job: job || null,
        packageId,
        roomType,
        pricePackage,
        dpAmount: 5000000,
        uniformSize: uniformSize || "L",
        chronicDiseases: chronicDiseases || null,
        wheelchairAssistance: Boolean(wheelchairAssistance),
        wheelchairNotes: wheelchairNotes || null,
        umrahExperienceCount: umrahExperienceCount || "BELUM_PERNAH",
        isPreviousClient: Boolean(isPreviousClient),
        previousPackageName: previousPackageName ? previousPackageName.trim() : null,
        channel,
        agentId: agentId || null,
        agentName: agentName || null,
        referralName: referralName || null,
        leadId,
        ktpFileUrl,
        familyCardFileUrl,
        passportFileUrl,
        diplomaFileUrl,
        marriageBookFileUrl,
        googleDriveFolderId: GOOGLE_DRIVE_MAIN_FOLDER_ID,
        status: "NEW",
        notes: notes || null,
      },
      include: {
        package: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pendaftaran berhasil diterima!",
      registration: newReg,
      trackingUrl: `/daftar/status?reg=${newReg.regNumber}`,
    });
  } catch (error: any) {
    console.error("Failed to create registration:", error);
    return NextResponse.json(
      { error: "Gagal memproses pendaftaran", details: error.message },
      { status: 500 }
    );
  }
}
