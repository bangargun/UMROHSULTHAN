import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || searchParams.get("reg");

    if (!query) {
      return NextResponse.json({ error: "Parameter pencarian (Nomor Registrasi / WhatsApp / NIK) wajib diisi!" }, { status: 400 });
    }

    const cleanQuery = query.trim();

    const registration = await prisma.registration.findFirst({
      where: {
        OR: [
          { regNumber: cleanQuery.toUpperCase() },
          { idJamaah: cleanQuery.toUpperCase() },
          { phone: cleanQuery },
          { nik: cleanQuery },
        ],
      },
      include: {
        package: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Data pendaftaran tidak ditemukan. Pastikan Nomor Registrasi atau No. WhatsApp Anda benar." },
        { status: 404 }
      );
    }

    // Ambil info bank travel dari TravelSetting
    const settings = await prisma.travelSetting.findFirst({
      where: { id: "default-settings" },
    });

    return NextResponse.json({
      success: true,
      registration,
      travelSettings: settings || {
        companyName: "PT BAROKAH SULTHAN HARAMAIN",
        phone: "0821-6733-9464",
        bankMandiri: "107-00-7777-2020 a.n SULTHAN HARAMAIN",
        bankBSI: "7123-4567-89 a.n BAROKAH SULTHAN",
        bankBCA: "731-008-899 a.n BAROKAH SULTHAN",
      },
    });
  } catch (error: any) {
    console.error("Status lookup failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
