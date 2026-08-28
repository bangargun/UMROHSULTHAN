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
      fullName,
      phone,
      email,
      nik,
      passportNumber,
      passportExpiry,
      placeOfBirth,
      dateOfBirth,
      gender,
      address,
      city,
      province,
      packageId,
      roomType = "QUAD",
      uniformSize = "L",
      chronicDiseases,
      wheelchairAssistance = false,
      wheelchairNotes,
      channel = "DIRECT",
      agentId,
      agentName,
      referralName,
      ktpBase64,
      passportBase64,
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
          notes: `[Pendaftaran Online ${regNumber}] ID Jamaah: ${idJamaah} | Paket: ${pkg.name} | Kamar: ${roomType} | Baju: ${uniformSize} | Riwayat Penyakit: ${chronicDiseases || "Tidak Ada"} ${wheelchairAssistance ? `| Kursi Roda: ${wheelchairNotes || "Ya"}` : ""}`.trim(),
          interactions: {
            create: {
              type: "WHATSAPP",
              summary: `Calon jamaah mendaftar online melalui Landing Page resmi (No. Reg: ${regNumber}). Menunggu verifikasi DP.`,
            },
          },
        },
      });
      leadId = createdLead.id;
    } catch (leadErr) {
      console.error("Gagal sinkronisasi Lead CRM:", leadErr);
    }

    // Upload KTP jika ada
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

    // Upload Paspor jika ada
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

    // Buat data pendaftaran di database dengan status NEW
    const newReg = await prisma.registration.create({
      data: {
        regNumber,
        idJamaah,
        fullName: fullName.trim().toUpperCase(),
        phone: phone.trim(),
        email: email ? email.trim() : null,
        nik: nik.trim(),
        passportNumber: passportNumber ? passportNumber.trim().toUpperCase() : null,
        passportExpiry: passportExpiry ? new Date(passportExpiry) : null,
        placeOfBirth: placeOfBirth ? placeOfBirth.trim() : null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || "MALE",
        address: address ? address.trim() : null,
        city: city ? city.trim() : null,
        province: province ? province.trim() : null,
        packageId,
        roomType,
        pricePackage,
        dpAmount: 5000000,
        uniformSize: uniformSize || "L",
        chronicDiseases: chronicDiseases || null,
        wheelchairAssistance: Boolean(wheelchairAssistance),
        wheelchairNotes: wheelchairNotes || null,
        channel,
        agentId: agentId || null,
        agentName: agentName || null,
        referralName: referralName || null,
        leadId,
        ktpFileUrl,
        passportFileUrl,
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
