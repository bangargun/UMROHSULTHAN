import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    // Cari jamaah yang sudah pernah terdaftar
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nik: { contains: search } },
        { phone: { contains: search } },
        { passportNumber: { contains: search } },
      ];
    }

    const pilgrims = await prisma.pilgrim.findMany({
      where,
      include: {
        package: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Mengelompokkan berdasarkan NIK untuk mendapatkan riwayat trip dan data terbaru
    const alumniMap = new Map<string, any>();
    for (const p of pilgrims) {
      if (!alumniMap.has(p.nik)) {
        alumniMap.set(p.nik, {
          ...p,
          tripHistory: [
            {
              pilgrimId: p.id,
              packageName: p.package?.name || "Paket Umroh",
              packageCode: p.package?.code || "-",
              departureDate: p.package?.departureDate || null,
              status: p.status,
              createdAt: p.createdAt,
            },
          ],
        });
      } else {
        const existing = alumniMap.get(p.nik);
        existing.tripHistory.push({
          pilgrimId: p.id,
          packageName: p.package?.name || "Paket Umroh",
          packageCode: p.package?.code || "-",
          departureDate: p.package?.departureDate || null,
          status: p.status,
          createdAt: p.createdAt,
        });
      }
    }

    const result = Array.from(alumniMap.values());
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching alumni list:", error);
    return NextResponse.json({ error: "Gagal memuat data alumni" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      alumniPilgrimId,
      newPackageId,
      roomType,
      uniformSize,
      initialDpAmount,
      alumniDiscount,
      newPassportNumber,
      newPassportExpiry,
      newPassportIssuedCity,
      newPassportIssuedDate,
      specialNotes,
    } = body;

    if (!alumniPilgrimId || !newPackageId) {
      return NextResponse.json(
        { error: "Pilih jamaah alumni dan paket tujuan terlebih dahulu" },
        { status: 400 }
      );
    }

    // 1. Ambil data calon alumni
    const sourcePilgrim = await prisma.pilgrim.findUnique({
      where: { id: alumniPilgrimId },
      include: { package: true },
    });

    if (!sourcePilgrim) {
      return NextResponse.json({ error: "Data jamaah alumni tidak ditemukan" }, { status: 404 });
    }

    // 2. Cek apakah jemaah dengan NIK ini sudah terdaftar di paket tujuan
    const existingRegistration = await prisma.pilgrim.findFirst({
      where: {
        nik: sourcePilgrim.nik,
        packageId: newPackageId,
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: `Jamaah (${sourcePilgrim.name}) sudah terdaftar dalam paket ini!` },
        { status: 400 }
      );
    }

    // 3. Cek paket tujuan dan kuota
    const targetPackage = await prisma.package.findUnique({
      where: { id: newPackageId },
    });

    if (!targetPackage) {
      return NextResponse.json({ error: "Paket tujuan tidak ditemukan" }, { status: 404 });
    }

    if (targetPackage.bookedCount >= targetPackage.quota) {
      return NextResponse.json(
        { error: `Kuota paket ${targetPackage.name} sudah penuh (${targetPackage.bookedCount}/${targetPackage.quota})` },
        { status: 400 }
      );
    }

    // 4. Hitung total keberangkatan (trip count)
    const pastTripsCount = await prisma.pilgrim.count({
      where: { nik: sourcePilgrim.nik },
    });
    const currentTripCount = pastTripsCount + 1;

    // 5. Normalisasi data paspor (apakah diperbarui atau pakai yang lama)
    const finalPassportNumber = newPassportNumber?.trim() || sourcePilgrim.passportNumber;
    const finalPassportExpiry = newPassportExpiry ? new Date(newPassportExpiry) : sourcePilgrim.passportExpiry;
    const finalPassportIssuedCity = newPassportIssuedCity?.trim() || sourcePilgrim.passportIssuedCity;
    const finalPassportIssuedDate = newPassportIssuedDate ? new Date(newPassportIssuedDate) : sourcePilgrim.passportIssuedDate;

    // Evaluasi masa berlaku paspor terhadap tanggal keberangkatan paket baru
    let passportStatusWarning: string | null = null;
    if (targetPackage.departureDate && finalPassportExpiry) {
      const departureTime = new Date(targetPackage.departureDate).getTime();
      const expiryTime = new Date(finalPassportExpiry).getTime();
      const diffMonths = (expiryTime - departureTime) / (1000 * 60 * 60 * 24 * 30.44);

      if (diffMonths < 6) {
        passportStatusWarning = `Masa berlaku paspor tersisa ${Math.max(0, Math.round(diffMonths))} bulan dari jadwal keberangkatan. Diperlukan perpanjangan paspor segera.`;
      }
    }

    const discountVal = parseFloat(alumniDiscount) || 0;
    const dpVal = parseFloat(initialDpAmount) || 0;

    // 6. Buat record Pilgrim baru dengan menyalin seluruh data SISKOPATUH & berkas
    const newPilgrim = await prisma.pilgrim.create({
      data: {
        packageId: newPackageId,
        isAlumni: true,
        tripCount: currentTripCount,
        previousPilgrimId: sourcePilgrim.id,
        title: sourcePilgrim.title || "Bpk",
        name: sourcePilgrim.name,
        fatherName: sourcePilgrim.fatherName,
        identityType: sourcePilgrim.identityType || "KTP",
        nik: sourcePilgrim.nik,
        passportName: sourcePilgrim.passportName || sourcePilgrim.name,
        passportNumber: finalPassportNumber,
        passportIssuedDate: finalPassportIssuedDate,
        passportIssuedCity: finalPassportIssuedCity,
        passportExpiry: finalPassportExpiry,
        placeOfBirth: sourcePilgrim.placeOfBirth,
        dateOfBirth: sourcePilgrim.dateOfBirth,
        gender: sourcePilgrim.gender,
        address: sourcePilgrim.address,
        subDistrict: sourcePilgrim.subDistrict,
        district: sourcePilgrim.district,
        city: sourcePilgrim.city,
        province: sourcePilgrim.province,
        telephone: sourcePilgrim.telephone,
        phone: sourcePilgrim.phone,
        email: sourcePilgrim.email,
        citizenship: sourcePilgrim.citizenship || "WNI",
        maritalStatus: sourcePilgrim.maritalStatus,
        education: sourcePilgrim.education,
        job: sourcePilgrim.job,
        motherName: sourcePilgrim.motherName,
        emergencyContactName: sourcePilgrim.emergencyContactName,
        emergencyContactPhone: sourcePilgrim.emergencyContactPhone,
        mahramName: sourcePilgrim.mahramName,
        mahramRelation: sourcePilgrim.mahramRelation,
        roomType: roomType || sourcePilgrim.roomType || "QUAD",
        uniformSize: uniformSize || sourcePilgrim.uniformSize || "L",
        bloodType: sourcePilgrim.bloodType,
        healthNotes: specialNotes ? `${sourcePilgrim.healthNotes || ""} | Catatan: ${specialNotes}` : sourcePilgrim.healthNotes,
        hasMeningitisVaccine: sourcePilgrim.hasMeningitisVaccine,
        meningitisVaccineNumber: sourcePilgrim.meningitisVaccineNumber,
        meningitisVaccineClinic: sourcePilgrim.meningitisVaccineClinic,
        meningitisVaccineDate: sourcePilgrim.meningitisVaccineDate,
        meningitisVaccineExpiry: sourcePilgrim.meningitisVaccineExpiry,
        hasPolioVaccine: sourcePilgrim.hasPolioVaccine,
        polioVaccineNumber: sourcePilgrim.polioVaccineNumber,
        polioVaccineClinic: sourcePilgrim.polioVaccineClinic,
        polioVaccineDate: sourcePilgrim.polioVaccineDate,
        polioVaccineExpiry: sourcePilgrim.polioVaccineExpiry,
        vaccineNumber: sourcePilgrim.vaccineNumber,
        vaccineType: sourcePilgrim.vaccineType,
        vaccineClinicName: sourcePilgrim.vaccineClinicName,
        vaccineDate: sourcePilgrim.vaccineDate,
        vaccineExpiryDate: sourcePilgrim.vaccineExpiryDate,
        vaccineStatus: sourcePilgrim.vaccineStatus,
        ktpFileUrl: sourcePilgrim.ktpFileUrl,
        familyCardFileUrl: sourcePilgrim.familyCardFileUrl,
        vaccineCardFileUrl: sourcePilgrim.vaccineCardFileUrl,
        passportFileUrl: sourcePilgrim.passportFileUrl,
        marriageBookFileUrl: sourcePilgrim.marriageBookFileUrl,
        diplomaFileUrl: sourcePilgrim.diplomaFileUrl,
        portalPassword: sourcePilgrim.portalPassword || "123456",
        status: dpVal > 0 ? "DP_PAID" : "REGISTERED",
        discountAmount: discountVal,
        discountReason: discountVal > 0 ? `Diskon Loyalitas Alumni Umroh (Keberangkatan ke-${currentTripCount})` : null,
        alumniDiscount: discountVal,
      },
    });

    // 7. Update kuota paket
    const newBookedCount = targetPackage.bookedCount + 1;
    await prisma.package.update({
      where: { id: newPackageId },
      data: {
        bookedCount: { increment: 1 },
        status: newBookedCount >= targetPackage.quota ? "FULL" : targetPackage.status,
      },
    });

    // 8. Buat Invoice DP Booking
    const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const standardDpAmount = dpVal > 0 ? dpVal : 10000000;
    await prisma.invoice.create({
      data: {
        invoiceNumber,
        pilgrimId: newPilgrim.id,
        type: "DP",
        title: `DP Booking Seat Paket Baru (Alumni Ke-${currentTripCount}) - ${targetPackage.name}`,
        amount: standardDpAmount,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: dpVal > 0 ? "PAID" : "PENDING",
        paymentDate: dpVal > 0 ? new Date() : null,
        paymentMethod: dpVal > 0 ? "BANK_TRANSFER" : null,
        notes: dpVal > 0
          ? `DP terbayar langsung saat re-registrasi alumni (Diskon: Rp ${discountVal.toLocaleString("id-ID")})`
          : `Menunggu pembayaran DP registrasi ulang alumni (Diskon: Rp ${discountVal.toLocaleString("id-ID")})`,
      },
    });

    // 9. Inisialisasi Checklist Persyaratan (Otomatis centang berkas yang sudah ada)
    let templates = await prisma.requirementTemplate.findMany({
      orderBy: { orderIndex: "asc" },
    });

    if (templates.length === 0) {
      const defaultTemplates = [
        { name: "Paspor Asli (Masa Berlaku Min. 8 Bulan)", isMandatory: true, orderIndex: 1 },
        { name: "Buku Kuning / Sertifikat Vaksin Meningitis", isMandatory: true, orderIndex: 2 },
        { name: "Pasfoto 4x6 Latar Belakang Putih (80% Wajah)", isMandatory: true, orderIndex: 3 },
        { name: "Fotokopi KTP & Kartu Keluarga (KK)", isMandatory: true, orderIndex: 4 },
        { name: "Buku Nikah Asli / Akta Lahir (Bagi Mahram)", isMandatory: false, orderIndex: 5 },
        { name: "Surat Rekomendasi Kemenag / Kantor", isMandatory: false, orderIndex: 6 },
      ];
      for (const t of defaultTemplates) {
        const created = await prisma.requirementTemplate.create({ data: t });
        templates.push(created);
      }
    }

    for (const t of templates) {
      // Periksa apakah berkas sudah otomatis ada dari arsip
      const hasKtpKk = (t.name.includes("KTP") || t.name.includes("KK")) && (sourcePilgrim.ktpFileUrl || sourcePilgrim.familyCardFileUrl);
      const hasVaksin = t.name.includes("Vaksin") && sourcePilgrim.vaccineCardFileUrl;

      await prisma.pilgrimRequirement.create({
        data: {
          pilgrimId: newPilgrim.id,
          name: t.name,
          isSubmitted: Boolean(hasKtpKk || hasVaksin),
          isVerified: Boolean(hasKtpKk || hasVaksin),
          notes: (hasKtpKk || hasVaksin)
            ? "Otomatis terverifikasi dari arsip pendaftaran sebelumnya"
            : (t.isMandatory ? "Dokumen wajib" : "Dokumen kondisional"),
        },
      });
    }

    // 10. Inisialisasi Handover Perlengkapan
    const allEquipment = await prisma.equipment.findMany({
      orderBy: { name: "asc" },
    });

    if (allEquipment.length > 0) {
      const handover = await prisma.logisticsHandover.create({
        data: {
          pilgrimId: newPilgrim.id,
          officerName: "Tim Admin",
          recipientName: newPilgrim.name,
          notes: `Draft serah terima perlengkapan umroh (Alumni Keberangkatan Ke-${currentTripCount})`,
          isCompleted: false,
        },
      });

      for (const eq of allEquipment) {
        await prisma.handoverItem.create({
          data: {
            handoverId: handover.id,
            equipmentId: eq.id,
            quantity: 1,
            isGiven: false,
            notes: "Belum diserahkan",
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Alhamdulillah, alumni ${newPilgrim.name} berhasil didaftarkan ke paket ${targetPackage.name}! (Keberangkatan ke-${currentTripCount})`,
      pilgrim: newPilgrim,
      passportWarning: passportStatusWarning,
      tripCount: currentTripCount,
    });
  } catch (error) {
    console.error("Error re-enrolling alumni:", error);
    return NextResponse.json({ error: "Gagal mendaftarkan ulang alumni" }, { status: 500 });
  }
}
