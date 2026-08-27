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
          licenseNumber: "25052200384080005",
          kemenhanLicense: "Keputusan Menteri Hukum Republik Indonesia NOMOR AHU-0007388.AH.01.01.TAHUN 2026",
          directorName: "ATIYATUL AMRA",
          directorTitle: "Direktur Utama",
          address: "Jl. Pahlawan No.10 J, Ps. Gambir, Kec. Tebing Tinggi Kota, Kota Tebing Tinggi, Sumatera Utara 20631",
          phone: "0821-6733-9464",
          email: "barokahsulthanharamain@gmail.com",
          website: "",
          bankBSI: "",
          bankBCA: "",
          bankMandiri: "107-00-7777-2020 a.n SULTHAN HARAMAIN",
        },
      });
    } else {
      // Ensure exact official PPIU values
      setting = await prisma.travelSetting.update({
        where: { id: "default-settings" },
        data: {
          companyName: "PT BAROKAH SULTHAN HARAMAIN",
          licenseNumber: "25052200384080005",
          kemenhanLicense: "Keputusan Menteri Hukum Republik Indonesia NOMOR AHU-0007388.AH.01.01.TAHUN 2026",
          directorName: "ATIYATUL AMRA",
          directorTitle: "Direktur Utama",
          address: "Jl. Pahlawan No.10 J, Ps. Gambir, Kec. Tebing Tinggi Kota, Kota Tebing Tinggi, Sumatera Utara 20631",
          phone: "0821-6733-9464",
          email: "barokahsulthanharamain@gmail.com",
          bankMandiri: setting.bankMandiri || "107-00-7777-2020 a.n SULTHAN HARAMAIN",
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
      superAdminPin,
    } = body;

    if (superAdminPin !== "12345") {
      return NextResponse.json(
        { error: "Akses Ditolak! Dilarang mengubah data kecuali Super Admin dengan PIN yang benar." },
        { status: 403 }
      );
    }

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
        licenseNumber: licenseNumber || "25052200384080005",
        kemenhanLicense: kemenhanLicense || "Keputusan Menteri Hukum Republik Indonesia NOMOR AHU-0007388.AH.01.01.TAHUN 2026",
        address: address || "Jl. Pahlawan No.10 J, Ps. Gambir, Kec. Tebing Tinggi Kota, Kota Tebing Tinggi, Sumatera Utara 20631",
        phone: phone || "0821-6733-9464",
        email: email || "barokahsulthanharamain@gmail.com",
        website: website || "",
        directorName: directorName || "ATIYATUL AMRA",
        directorTitle: directorTitle || "Direktur Utama",
        bankBSI: bankBSI || "",
        bankBCA: bankBCA || "",
        bankMandiri: bankMandiri || "107-00-7777-2020 a.n SULTHAN HARAMAIN",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update travel settings" }, { status: 500 });
  }
}
