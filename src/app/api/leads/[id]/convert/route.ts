import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { packageId, nik, roomType, uniformSize, dpAmount, dpDueDate, gender, address } = body;

    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: { pilgrim: true },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead tidak ditemukan" }, { status: 404 });
    }

    if (lead.pilgrim) {
      return NextResponse.json({ error: "Lead ini sudah pernah dikonversi menjadi Jamaah" }, { status: 400 });
    }

    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Paket Umroh tidak ditemukan" }, { status: 404 });
    }

    const generatedNik = nik || `3174${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    // 1. Create Pilgrim
    const pilgrim = await prisma.pilgrim.create({
      data: {
        leadId: lead.id,
        packageId: pkg.id,
        name: lead.name,
        nik: generatedNik,
        phone: lead.phone,
        email: lead.email,
        city: lead.city,
        gender: gender || "MALE",
        address: address || `Alamat prospek: ${lead.city || "-"}`,
        roomType: roomType || "QUAD",
        uniformSize: uniformSize || "L",
        status: "REGISTERED",
      },
    });

    // 2. Update Lead status to CLOSING_DP
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "CLOSING_DP" },
    });

    // 3. Increment package booked count & sync quota status
    const newBookedCount = pkg.bookedCount + 1;
    await prisma.package.update({
      where: { id: pkg.id },
      data: {
        bookedCount: { increment: 1 },
        status: newBookedCount >= pkg.quota ? "FULL" : pkg.status,
      },
    });

    // 4. Create DP Invoice
    const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nominalDp = dpAmount ? parseFloat(dpAmount) : 10000000;
    const dueDate = dpDueDate ? new Date(dpDueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        pilgrimId: pilgrim.id,
        type: "DP",
        title: `Pembayaran DP Booking Seat - ${pkg.name}`,
        amount: nominalDp,
        dueDate,
        status: "PENDING",
        notes: `DP awal booking keberangkatan tanggal ${pkg.departureDate.toISOString().split("T")[0]}`,
      },
    });

    // 5. Automatic Commission Calculation & Journal Entry
    const isAgent = lead.source === "AGENT";
    const isReferral = lead.source === "REFERRAL";
    const paxCount = lead.estimatedPax || 1;
    let commissionAmount = 0;
    let beneficiaryName = "";

    if (isAgent) {
      commissionAmount = (pkg.commissionAgent || 1500000) * paxCount;
      beneficiaryName = lead.agentName || "Mitra Lapangan";
    } else if (isReferral) {
      commissionAmount = (pkg.commissionReferral || 500000) * paxCount;
      beneficiaryName = lead.referralPilgrimName || "Alumni / Jamaah";
    }

    if (commissionAmount > 0) {
      // A. Create Journal Entry
      const entryNumber = `JU-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
      await prisma.journalEntry.create({
        data: {
          entryNumber,
          transactionDate: new Date(),
          description: `Akrual Komisi ${isAgent ? "Mitra/Agen" : "Referral"} (${beneficiaryName}) - Paket ${pkg.name} (${lead.name})`,
          referenceNo: invoiceNumber,
          sourceModule: "INVOICE",
          sourceId: invoice.id,
          createdBy: "Sistem Otomatis",
          lines: {
            create: [
              {
                accountCode: "5105",
                accountName: isAgent ? "Beban Komisi Mitra & Agen" : "Beban Komisi Referral Alumni",
                accountCategory: "HPP_EXPENSE",
                debit: commissionAmount,
                credit: 0,
                memo: `Komisi ${paxCount} pax atas pendaftaran ${lead.name}`,
              },
              {
                accountCode: "2102",
                accountName: isAgent ? "Hutang Komisi Agen" : "Hutang Komisi Referral",
                accountCategory: "LIABILITY",
                debit: 0,
                credit: commissionAmount,
                memo: `Hutang komisi yang akan dicairkan ke ${beneficiaryName}`,
              },
            ],
          },
        },
      });

      // B. Create Package Expense for Profit Loss Tracking
      await prisma.expense.create({
        data: {
          packageId: pkg.id,
          title: `Komisi ${isAgent ? "Agen: " + beneficiaryName : "Referral: " + beneficiaryName} (${lead.name})`,
          category: isAgent ? "KOMISI_AGEN" : "KOMISI_REFERRAL",
          amount: commissionAmount,
          recipientVendor: beneficiaryName,
          expenseDate: new Date(),
          notes: `Komisi otomatis per pax paket ${pkg.name}`,
          paymentMethod: "BANK_TRANSFER",
        },
      });

      // C. Update Agent Stats if matched in Agent table
      if (isAgent && lead.agentName) {
        const foundAgent = await prisma.agent.findFirst({
          where: {
            OR: [
              { name: { equals: lead.agentName } },
              { referralCode: { equals: lead.agentName } },
            ],
          },
        });

        if (foundAgent) {
          await prisma.agent.update({
            where: { id: foundAgent.id },
            data: {
              totalClosingPax: { increment: paxCount },
              totalCommissionEarned: { increment: commissionAmount },
              pendingCommission: { increment: commissionAmount },
            },
          });
        }
      }
    }

    // 6. Query Master Requirement Templates (Dynamic Single Source of Truth)
    let templates = await prisma.requirementTemplate.findMany({
      orderBy: { orderIndex: "asc" },
    });

    if (templates.length === 0) {
      // Fallback defaults if none exist
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

    // 6. Initialize Draft Logistics Handover from Master Equipment Catalog
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

    return NextResponse.json({ pilgrim, invoice });
  } catch (error) {
    console.error("Error converting lead to pilgrim:", error);
    return NextResponse.json({ error: "Failed to convert lead to pilgrim" }, { status: 500 });
  }
}
