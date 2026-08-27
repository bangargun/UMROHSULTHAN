import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    let setting = await prisma.travelSetting.findUnique({
      where: { id: "default-settings" },
    });

    if (!setting) {
      setting = await prisma.travelSetting.create({
        data: {
          id: "default-settings",
          companyName: "PT BAROKAH SULTHAN HARAMAIN",
          licenseNumber: "SK Kemenkumham No. AHU-0007388.AH.01.01.TAHUN 2026 • NIB: 1504260072814",
          kemenhanLicense: "KBLI 79122: Aktivitas Biro Perjalanan Ibadah Umroh & Haji Khusus",
          address: "Jl. Syekh Beringin Perumahan Griya Palm Asri Blok B, Tebing Tinggi, Sumatera Utara 20631",
          phone: "0821-6733-9464",
          email: "barokahsulthanharamain@gmail.com",
          website: "www.sulthanharamain.com",
          directorName: "Direktur Utama",
          directorTitle: "Direktur Utama",
          bankBSI: "8888-999-123 a.n PT BAROKAH SULTHAN HARAMAIN",
          bankBCA: "731-888-9900 a.n PT BAROKAH SULTHAN HARAMAIN",
          bankMandiri: "137-00-8888999-1 a.n PT BAROKAH SULTHAN HARAMAIN",
        },
      });
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch travel settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      companyName,
      licenseNumber,
      kemenhanLicense,
      address,
      phone,
      email,
      website,
      directorName,
      directorTitle,
      bankBSI,
      bankBCA,
      bankMandiri,
    } = body;

    const updated = await prisma.travelSetting.upsert({
      where: { id: "default-settings" },
      update: {
        companyName,
        licenseNumber,
        kemenhanLicense,
        address,
        phone,
        email,
        website,
        directorName,
        directorTitle,
        bankBSI,
        bankBCA,
        bankMandiri,
      },
      create: {
        id: "default-settings",
        companyName: companyName || "PT BAROKAH SULTHAN HARAMAIN",
        licenseNumber: licenseNumber || "SK Kemenkumham No. AHU-0007388.AH.01.01.TAHUN 2026 • NIB: 1504260072814",
        kemenhanLicense: kemenhanLicense || "KBLI 79122: Aktivitas Biro Perjalanan Ibadah Umroh & Haji Khusus",
        address: address || "Jl. Syekh Beringin Perumahan Griya Palm Asri Blok B, Tebing Tinggi, Sumatera Utara 20631",
        phone: phone || "0821-6733-9464",
        email: email || "barokahsulthanharamain@gmail.com",
        website: website || "www.sulthanharamain.com",
        directorName: directorName || "Direktur Utama",
        directorTitle: directorTitle || "Direktur Utama",
        bankBSI: bankBSI || "8888-999-123 a.n PT BAROKAH SULTHAN HARAMAIN",
        bankBCA: bankBCA || "731-888-9900 a.n PT BAROKAH SULTHAN HARAMAIN",
        bankMandiri: bankMandiri || "137-00-8888999-1 a.n PT BAROKAH SULTHAN HARAMAIN",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update travel settings" }, { status: 500 });
  }
}
