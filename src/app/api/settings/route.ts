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
          companyName: "PT SULTHAN HARAMAIN TOUR & TRAVEL",
          licenseNumber: "PPIU Kemenag RI No. U.412 Tahun 2022",
          kemenhanLicense: "Izin Khusus Kemenhan RI No. B/108/M/XII/2023",
          address: "Sulthan Haramain Tower, Jl. Prof. Dr. Satrio No. 88, Kuningan, Jakarta Selatan 12940",
          phone: "(021) 5290-8888 / 0811-9876-5432",
          email: "salam@sulthanharamain.com",
          website: "www.sulthanharamain.com",
          directorName: "H. Sulthan Syarif, Lc., M.A.",
          directorTitle: "Direktur Utama",
          bankBSI: "8888-999-123 a.n PT SULTHAN HARAMAIN TOUR & TRAVEL",
          bankBCA: "731-888-9900 a.n PT SULTHAN HARAMAIN TOUR & TRAVEL",
          bankMandiri: "137-00-8888999-1 a.n PT SULTHAN HARAMAIN TOUR & TRAVEL",
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
        companyName: companyName || "PT SULTHAN HARAMAIN TOUR & TRAVEL",
        licenseNumber: licenseNumber || "PPIU Kemenag RI No. U.412 Tahun 2022",
        kemenhanLicense: kemenhanLicense || "Izin Khusus Kemenhan RI No. B/108/M/XII/2023",
        address: address || "Sulthan Haramain Tower, Jakarta Selatan",
        phone: phone || "0811-9876-5432",
        email: email || "salam@sulthanharamain.com",
        website: website || "www.sulthanharamain.com",
        directorName: directorName || "H. Sulthan Syarif, Lc.",
        directorTitle: directorTitle || "Direktur Utama",
        bankBSI: bankBSI || "8888-999-123 a.n PT SULTHAN HARAMAIN",
        bankBCA: bankBCA || "731-888-9900 a.n PT SULTHAN HARAMAIN",
        bankMandiri: bankMandiri || "137-00-8888999-1 a.n PT SULTHAN HARAMAIN",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
