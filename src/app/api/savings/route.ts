import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { saveUploadedFile, GOOGLE_DRIVE_MAIN_FOLDER_ID } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let whereClause: any = {};
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const accounts = await prisma.savingsAccount.findMany({
      where: whereClause,
      include: {
        targetPackage: true,
        transactions: {
          orderBy: { transactionDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(accounts);
  } catch (error: any) {
    console.error("Failed to fetch savings accounts:", error);
    return NextResponse.json({ error: "Gagal mengambil data tabungan umroh" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      phone,
      email,
      nik,
      gender = "MALE",
      address,
      city,
      province,
      uniformSize = "L",
      targetPackageId,
      targetPackageName,
      targetAmount,
      initialDeposit = 2000000,
      equipmentReceived = true,
      channel = "DIRECT",
      agentId,
      agentName,
      referralName,
      ktpBase64,
      transferProofBase64,
      notes,
    } = body;

    if (!fullName || !phone || !nik) {
      return NextResponse.json(
        { error: "Nama lengkap, nomor WhatsApp, dan NIK wajib diisi!" },
        { status: 400 }
      );
    }

    // Resolve Target Package & Target Amount
    let finalTargetName = targetPackageName || "UMROH REGULER (ESTIMASI)";
    let finalTargetAmount = targetAmount ? parseFloat(targetAmount) : 31500000;

    if (targetPackageId) {
      const pkg = await prisma.package.findUnique({
        where: { id: targetPackageId },
      });
      if (pkg) {
        finalTargetName = `${pkg.name} (QUAD)`;
        finalTargetAmount = pkg.priceQuad || finalTargetAmount;
      }
    }

    const depositNum = parseFloat(initialDeposit) || 2000000;

    // Generate Nomor Rekening Tabungan Unik (TAB-2608-0001)
    const count = await prisma.savingsAccount.count();
    const dateStr = new Date().toISOString().slice(2, 7).replace("-", "");
    const seq = String(count + 1).padStart(4, "0");
    const accountNumber = `TAB-${dateStr}-${seq}`;

    // Upload KTP jika ada
    let ktpFileUrl: string | null = null;
    if (ktpBase64) {
      try {
        const saved = await saveUploadedFile({
          fileBase64: ktpBase64,
          fileName: `KTP_TAB_${fullName.replace(/\s+/g, "_")}_${nik.slice(-4)}.jpg`,
          subFolder: "ktp",
        });
        ktpFileUrl = saved.fileUrl;
      } catch (err) {
        console.error("Gagal simpan KTP Tabungan:", err);
      }
    }

    // Upload Bukti Setoran Awal jika ada
    let transferProofUrl: string | null = null;
    if (transferProofBase64) {
      try {
        const saved = await saveUploadedFile({
          fileBase64: transferProofBase64,
          fileName: `SETORAN_AWAL_${fullName.replace(/\s+/g, "_")}_${Date.now().toString().slice(-4)}.jpg`,
          subFolder: "transfers",
        });
        transferProofUrl = saved.fileUrl;
      } catch (err) {
        console.error("Gagal simpan Bukti Setoran Awal:", err);
      }
    }

    // 1. Buat Rekening Tabungan
    const remainingAmount = Math.max(0, finalTargetAmount - depositNum);
    const newAccount = await prisma.savingsAccount.create({
      data: {
        accountNumber,
        fullName: fullName.trim().toUpperCase(),
        phone: phone.trim(),
        email: email ? email.trim() : null,
        nik: nik.trim(),
        gender,
        address: address ? address.trim() : null,
        city: city ? city.trim() : "Tebing Tinggi",
        province: province ? province.trim() : "Sumatera Utara",
        uniformSize: uniformSize || "L",
        targetPackageId: targetPackageId || null,
        targetPackageName: finalTargetName,
        targetAmount: finalTargetAmount,
        initialDeposit: depositNum,
        totalBalance: depositNum,
        equipmentReceived: Boolean(equipmentReceived),
        equipmentHandoverDate: equipmentReceived ? new Date() : null,
        status: remainingAmount === 0 ? "TARGET_REACHED" : "ACTIVE",
        channel,
        agentId: agentId || null,
        agentName: agentName || null,
        referralName: referralName || null,
        ktpFileUrl,
        transferProofUrl,
        googleDriveFolderId: GOOGLE_DRIVE_MAIN_FOLDER_ID,
        notes: notes || null,
        transactions: {
          create: {
            receiptNumber: `KWT-${accountNumber}-01`,
            amount: depositNum,
            currentBalance: depositNum,
            remainingAmount,
            paymentMethod: "BANK_TRANSFER",
            transactionDate: new Date(),
            proofUrl: transferProofUrl,
            notes: "Setoran Awal Pendaftaran Tabungan Umroh (DP Rp 2 Jt - Koper & Perlengkapan Diterima)",
            officerName: "Admin Keuangan",
          },
        },
      },
      include: {
        targetPackage: true,
        transactions: true,
      },
    });

    // 2. Sinkronkan ke Leads CRM
    try {
      await prisma.lead.create({
        data: {
          name: fullName.trim().toUpperCase(),
          phone: phone.trim(),
          email: email ? email.trim() : null,
          city: city ? city.trim() : "Tebing Tinggi",
          source: channel === "AGENT" ? "AGENT" : "WEBSITE",
          agentName: agentName || null,
          referralPilgrimName: referralName || null,
          packageId: targetPackageId || null,
          status: "INTERESTED",
          budget: finalTargetAmount,
          estimatedPax: 1,
          notes: `[Penabung Umroh Barokah] No. Rek: ${accountNumber} | Target: ${finalTargetName} | Saldo Awal: Rp ${depositNum.toLocaleString("id-ID")} | Koper: ${equipmentReceived ? "Sudah Diterima" : "Pending"} | Size: ${uniformSize}`,
          interactions: {
            create: {
              type: "WHATSAPP",
              summary: `Membuka Rekening Tabungan Umroh Barokah (${accountNumber}) dengan setoran awal Rp ${depositNum.toLocaleString("id-ID")}. Perlengkapan koper diserahkan.`,
            },
          },
        },
      });
    } catch (leadErr) {
      console.error("Gagal sync Tabungan ke Lead CRM:", leadErr);
    }

    return NextResponse.json({
      success: true,
      message: "Rekening Tabungan Umroh berhasil dibuka!",
      account: newAccount,
      trackingUrl: `/tabungan/status?acc=${newAccount.accountNumber}`,
    });
  } catch (error: any) {
    console.error("Failed to create savings account:", error);
    return NextResponse.json({ error: error.message || "Gagal membuat rekening tabungan" }, { status: 500 });
  }
}
