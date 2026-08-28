import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reg = await prisma.registration.findUnique({
      where: { id: params.id },
      include: { package: true },
    });

    if (!reg) {
      return NextResponse.json({ error: "Pendaftaran tidak ditemukan" }, { status: 404 });
    }

    if (reg.status === "PAID") {
      return NextResponse.json({ error: "Pendaftaran ini sudah berstatus PAID!" }, { status: 400 });
    }

    // 1. Cek / Buat data Jamaah Resmi di tabel Pilgrim
    let pilgrim = await prisma.pilgrim.findUnique({
      where: { nik: reg.nik },
    });

    if (!pilgrim) {
      const healthInfo = [
        reg.chronicDiseases ? `Penyakit Kronis: ${reg.chronicDiseases}` : null,
        reg.wheelchairAssistance ? `Butuh Kursi Roda: ${reg.wheelchairNotes || "Ya"}` : null,
      ]
        .filter(Boolean)
        .join(" | ");

      pilgrim = await prisma.pilgrim.create({
        data: {
          leadId: reg.leadId || null,
          packageId: reg.packageId,
          name: reg.fullName,
          nik: reg.nik,
          passportNumber: reg.passportNumber || null,
          passportExpiry: reg.passportExpiry || null,
          placeOfBirth: reg.placeOfBirth || null,
          dateOfBirth: reg.dateOfBirth || null,
          gender: reg.gender || "MALE",
          phone: reg.phone,
          email: reg.email || null,
          address: reg.address || null,
          city: reg.city || null,
          province: reg.province || null,
          roomType: reg.roomType || "QUAD",
          uniformSize: reg.uniformSize || "L",
          healthNotes: healthInfo || null,
          status: "DP_PAID",
        },
      });

      // Tambahkan template checklist persyaratan untuk jamaah baru
      const reqTemplates = await prisma.requirementTemplate.findMany({
        orderBy: { orderIndex: "asc" },
      });

      if (reqTemplates.length > 0) {
        await prisma.pilgrimRequirement.createMany({
          data: reqTemplates.map((t) => ({
            pilgrimId: pilgrim!.id,
            name: t.name,
            isSubmitted: false,
            isVerified: false,
          })),
        });
      }

      // Update bookedCount pada paket
      await prisma.package.update({
        where: { id: reg.packageId },
        data: {
          bookedCount: { increment: 1 },
        },
      });
    }

    // 2. Buat / Update Invoice Resmi di tabel Invoice
    const invoiceNumber = reg.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        pilgrimId: pilgrim.id,
        title: `Pembayaran DP Seat Umroh (${reg.package.name})`,
        amount: reg.dpAmount || 5000000,
        dueDate: new Date(),
        status: "PAID",
        paymentMethod: "BANK_TRANSFER",
        paymentDate: new Date(),
        proofUrl: reg.transferProofUrl || null,
        notes: `Diterbitkan otomatis dari Pendaftaran Online ${reg.regNumber}`,
      },
    });

    // 3. Update status Registration ke PAID
    const updatedReg = await prisma.registration.update({
      where: { id: params.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        pilgrimId: pilgrim.id,
        invoiceNumber,
      },
      include: { package: true },
    });

    return NextResponse.json({
      success: true,
      message: `Pembayaran DP Rp ${new Intl.NumberFormat("id-ID").format(
        reg.dpAmount
      )} untuk ${reg.fullName} berhasil dikonfirmasi! Jamaah resmi terdaftar di manifest.`,
      registration: updatedReg,
      pilgrim,
      invoice,
    });
  } catch (error: any) {
    console.error("Confirm payment failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
