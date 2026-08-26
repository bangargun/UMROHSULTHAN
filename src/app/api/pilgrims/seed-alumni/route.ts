import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    // 1. Check or Create Past Season Packages
    let pastPkg1 = await prisma.package.findFirst({
      where: { code: "UMR-2026-RAMADHAN" },
    });

    if (!pastPkg1) {
      pastPkg1 = await prisma.package.create({
        data: {
          code: "UMR-2026-RAMADHAN",
          name: "Paket Umroh Iktikaf Lailatul Qadar 1447H (Musim Lalu)",
          description: "Program Umroh 16 Hari Spesial Ramadhan & Lebaran di Makkah",
          departureDate: new Date("2026-03-15"),
          returnDate: new Date("2026-03-31"),
          durationDays: 16,
          hotelMakkah: "Pullman Zamzam Tower (Bintang 5)",
          hotelMadinah: "Dallah Taibah Hotel (Bintang 5)",
          airline: "Saudia Airlines (Direct CGK-JED)",
          priceQuad: 39500000,
          priceTriple: 43500000,
          priceDouble: 48000000,
          quota: 45,
          status: "COMPLETED",
        },
      });
    }

    let pastPkg2 = await prisma.package.findFirst({
      where: { code: "UMR-2025-SYAWAL" },
    });

    if (!pastPkg2) {
      pastPkg2 = await prisma.package.create({
        data: {
          code: "UMR-2025-SYAWAL",
          name: "Paket Umroh Syawal Berkah 1446H (Tahun 2025)",
          description: "Program Umroh Reguler 9 Hari Pasca Idul Fitri",
          departureDate: new Date("2025-05-01"),
          returnDate: new Date("2025-05-10"),
          durationDays: 9,
          hotelMakkah: "Movenpick Hotel Anwar Al Madinah (Bintang 5)",
          hotelMadinah: "Rove Al Madinah (Bintang 4)",
          airline: "Garuda Indonesia",
          priceQuad: 29500000,
          priceTriple: 32500000,
          priceDouble: 36000000,
          quota: 50,
          status: "COMPLETED",
        },
      });
    }

    // 2. Sample Alumni Pilgrims
    const sampleAlumni = [
      {
        name: "H. Bambang Sudiro, S.E.",
        nik: "3171011508750009",
        passportNumber: "C8819201",
        passportExpiry: new Date("2030-05-20"),
        placeOfBirth: "Surabaya",
        dateOfBirth: new Date("1975-08-15"),
        gender: "MALE",
        phone: "081288997711",
        email: "bambang.sudiro@gmail.com",
        city: "Jakarta Selatan",
        province: "DKI Jakarta",
        roomType: "DOUBLE",
        uniformSize: "XL",
        bloodType: "O",
        status: "RETURNED",
        packageId: pastPkg1.id,
      },
      {
        name: "Hj. Ratna Wulandari",
        nik: "3171015509780003",
        passportNumber: "C8819202",
        passportExpiry: new Date("2030-05-20"),
        placeOfBirth: "Bandung",
        dateOfBirth: new Date("1978-09-25"),
        gender: "FEMALE",
        phone: "081288997722",
        email: "ratna.wulan@gmail.com",
        city: "Jakarta Selatan",
        province: "DKI Jakarta",
        roomType: "DOUBLE",
        uniformSize: "M",
        bloodType: "A",
        status: "RETURNED",
        packageId: pastPkg1.id,
      },
      {
        name: "Drs. H. Mulyadi Saputra",
        nik: "3273011204680004",
        passportNumber: "B9928172",
        passportExpiry: new Date("2029-11-12"),
        placeOfBirth: "Bandung",
        dateOfBirth: new Date("1968-04-12"),
        gender: "MALE",
        phone: "081322114455",
        email: "mulyadi.saputra@yahoo.com",
        city: "Bandung",
        province: "Jawa Barat",
        roomType: "QUAD",
        uniformSize: "L",
        bloodType: "B",
        status: "RETURNED",
        packageId: pastPkg2.id,
      },
      {
        name: "Hj. Nurhayati",
        nik: "3273015506700007",
        passportNumber: "B9928173",
        passportExpiry: new Date("2029-11-12"),
        placeOfBirth: "Tasikmalaya",
        dateOfBirth: new Date("1970-06-15"),
        gender: "FEMALE",
        phone: "081322114466",
        email: "nurhayati.tasik@gmail.com",
        city: "Bandung",
        province: "Jawa Barat",
        roomType: "QUAD",
        uniformSize: "L",
        bloodType: "AB",
        status: "RETURNED",
        packageId: pastPkg2.id,
      },
      {
        name: "H. Ir. Agus Hendrawan",
        nik: "3374012010720005",
        passportNumber: "E4401928",
        passportExpiry: new Date("2031-02-18"),
        placeOfBirth: "Semarang",
        dateOfBirth: new Date("1972-10-20"),
        gender: "MALE",
        phone: "081809090901",
        email: "agus.hendrawan@corp.id",
        city: "Semarang",
        province: "Jawa Tengah",
        roomType: "TRIPLE",
        uniformSize: "XXL",
        bloodType: "O",
        status: "DEPARTED",
        packageId: pastPkg1.id,
      },
    ];

    let createdCount = 0;
    for (const item of sampleAlumni) {
      const existing = await prisma.pilgrim.findUnique({
        where: { nik: item.nik },
      });

      if (!existing) {
        await prisma.pilgrim.create({ data: item });
        createdCount++;
      } else {
        await prisma.pilgrim.update({
          where: { nik: item.nik },
          data: { status: item.status, packageId: item.packageId },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil memuat ${createdCount} data contoh alumni jamaah lampau.`,
    });
  } catch (error) {
    console.error("Error seeding alumni:", error);
    return NextResponse.json({ error: "Gagal memuat data contoh alumni" }, { status: 500 });
  }
}
