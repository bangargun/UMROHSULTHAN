import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get("packageId");
    const status = searchParams.get("status");

    const where: any = {};
    if (packageId) where.packageId = packageId;
    if (status) where.status = status;

    const pilgrims = await prisma.pilgrim.findMany({
      where,
      include: {
        package: true,
        invoices: {
          orderBy: { createdAt: "desc" },
        },
        requirements: true,
        handovers: {
          include: {
            items: {
              include: { equipment: true },
            },
          },
        },
        letters: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(pilgrims);
  } catch (error) {
    console.error("Error fetching pilgrims:", error);
    return NextResponse.json({ error: "Failed to fetch pilgrims" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      packageId,
      name,
      nik,
      passportNumber,
      passportExpiry,
      placeOfBirth,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      city,
      province,
      fatherName,
      motherName,
      emergencyContactName,
      emergencyContactPhone,
      mahramName,
      mahramRelation,
      roomType,
      uniformSize,
      bloodType,
      healthNotes,
      visaNumber,
      visaIssueDate,
      visaExpiryDate,
      mofaNumber,
      muassasahName,
      insuranceNumber,
      status,
      initialDpAmount,
    } = body;

    if (!packageId || !name || !nik || !phone) {
      return NextResponse.json({ error: "Data wajib: Paket, Nama, NIK, dan No HP" }, { status: 400 });
    }

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) {
      return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
    }

    // 1. Create Pilgrim
    const pilgrim = await prisma.pilgrim.create({
      data: {
        packageId,
        name,
        nik,
        passportNumber: passportNumber || null,
        passportExpiry: passportExpiry ? new Date(passportExpiry) : null,
        visaNumber: visaNumber || null,
        visaIssueDate: visaIssueDate ? new Date(visaIssueDate) : null,
        visaExpiryDate: visaExpiryDate ? new Date(visaExpiryDate) : null,
        mofaNumber: mofaNumber || null,
        muassasahName: muassasahName || null,
        insuranceNumber: insuranceNumber || null,
        placeOfBirth: placeOfBirth || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || "MALE",
        phone,
        email: email || null,
        address: address || null,
        city: city || null,
        province: province || null,
        fatherName: fatherName || null,
        motherName: motherName || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        mahramName: mahramName || null,
        mahramRelation: mahramRelation || null,
        roomType: roomType || "QUAD",
        uniformSize: uniformSize || "L",
        bloodType: bloodType || null,
        healthNotes: healthNotes || null,
        status: status || (initialDpAmount ? "DP_PAID" : "REGISTERED"),
      },
    });

    // 2. Update package booked count & quota status
    const newBookedCount = pkg.bookedCount + 1;
    await prisma.package.update({
      where: { id: packageId },
      data: {
        bookedCount: { increment: 1 },
        status: newBookedCount >= pkg.quota ? "FULL" : pkg.status,
      },
    });

    // 3. Create Initial DP Invoice
    const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const dpAmount = initialDpAmount ? parseFloat(initialDpAmount) : 10000000;
    await prisma.invoice.create({
      data: {
        invoiceNumber,
        pilgrimId: pilgrim.id,
        type: "DP",
        title: `Pembayaran DP Booking Seat - ${pkg.name}`,
        amount: dpAmount,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: initialDpAmount ? "PAID" : "PENDING",
        paymentDate: initialDpAmount ? new Date() : null,
        paymentMethod: initialDpAmount ? "BANK_TRANSFER" : null,
        notes: initialDpAmount ? "DP terbayar langsung saat pendaftaran" : "Menunggu pembayaran DP",
      },
    });

    // 4. Query Master Requirement Templates (Dynamic Single Source of Truth)
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
      await prisma.pilgrimRequirement.create({
        data: {
          pilgrimId: pilgrim.id,
          name: t.name,
          isSubmitted: false,
          isVerified: false,
          notes: t.isMandatory ? "Dokumen wajib" : "Dokumen kondisional",
        },
      });
    }

    // 5. Initialize Draft Logistics Handover from Master Equipment Catalog
    const allEquipment = await prisma.equipment.findMany({
      orderBy: { name: "asc" },
    });

    if (allEquipment.length > 0) {
      const handover = await prisma.logisticsHandover.create({
        data: {
          pilgrimId: pilgrim.id,
          officerName: "Petugas Logistik",
          recipientName: pilgrim.name,
          notes: "Draft formulir serah terima perlengkapan umroh",
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

    // 6. Automatically generate User account with password for pilgrim portal
    const initialUserPassword = body.portalPassword || "123456";
    const cleanUsername = (pilgrim.nik || pilgrim.phone || `jamaah_${pilgrim.id.slice(0, 6)}`).toLowerCase().trim();

    try {
      await prisma.user.upsert({
        where: { username: cleanUsername },
        update: {
          name: pilgrim.name,
          phone: pilgrim.phone,
          email: pilgrim.email || null,
          plainPassword: initialUserPassword,
          role: "PILGRIM",
          pilgrimId: pilgrim.id,
        },
        create: {
          name: pilgrim.name,
          username: cleanUsername,
          password: initialUserPassword,
          plainPassword: initialUserPassword,
          phone: pilgrim.phone,
          email: pilgrim.email || null,
          role: "PILGRIM",
          isActive: true,
          pilgrimId: pilgrim.id,
        },
      });
    } catch (userErr) {
      console.warn("Auto-generating user account warning:", userErr);
    }

    const createdFullPilgrim = await prisma.pilgrim.findUnique({
      where: { id: pilgrim.id },
      include: {
        package: true,
        invoices: true,
        requirements: true,
        handovers: { include: { items: { include: { equipment: true } } } },
        user: true,
      },
    });

    return NextResponse.json(createdFullPilgrim, { status: 201 });
  } catch (error: any) {
    console.error("Error creating pilgrim:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "NIK sudah terdaftar dalam sistem" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create pilgrim" }, { status: 500 });
  }
}
