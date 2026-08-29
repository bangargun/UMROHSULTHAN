import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get("packageId");

    let whereClause: any = {};
    if (packageId && packageId !== "ALL") {
      whereClause.packageId = packageId;
    }

    const pilgrims = await prisma.pilgrim.findMany({
      where: whereClause,
      include: {
        package: true,
        requirements: true,
      },
      orderBy: { name: "asc" },
    });

    // Format according to standard SISKOPATUH Kementerian Agama RI specification
    const siskopatuhData = pilgrims.map((p, idx) => {
      // Check Meningitis vaccination status from requirements
      const meningitisReq = p.requirements.find(
        (r) => r.name.toLowerCase().includes("meningitis") || r.name.toLowerCase().includes("vaksin")
      );
      const isVaccinated = meningitisReq ? meningitisReq.isVerified : false;

      // Check Passport requirement
      const passportReq = p.requirements.find(
        (r) => r.name.toLowerCase().includes("paspor")
      );
      const passportVerified = passportReq ? passportReq.isVerified : !!p.passportNumber;

      return {
        noUrut: idx + 1,
        kdPpiu: "PPIU-007388",
        namaPpiu: "PT BAROKAH SULTHAN HARAMAIN",
        nik: p.nik || "-",
        noPaspor: p.passportNumber || "-",
        namaLengkap: p.name,
        namaAyahKandung: p.fatherName ? p.fatherName.trim() : "-",
        namaIbuKandung: p.motherName ? p.motherName.trim() : "-",
        tempatLahir: p.placeOfBirth || "-",
        tanggalLahir: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split("T")[0] : "-",
        jenisKelamin: p.gender === "MALE" ? "L" : "P",
        nomorHp: p.phone || "-",
        alamat: p.address || "-",
        kota: p.city || "-",
        provinsi: p.province || "Sumatera Utara",
        statusPerkawinan: "MENIKAH",
        namaMahram: p.mahramName || "-",
        hubunganMahram: p.mahramRelation || "-",
        statusVaksinMeningitis: isVaccinated ? "SUDAH" : "BELUM",
        statusPaspor: passportVerified ? "VALID" : "PENDING",
        tipeKamar: p.roomType || "QUAD",
        ukuranSeragam: p.uniformSize || "L",
        kodePaket: p.package?.code || "-",
        namaPaket: p.package?.name || "-",
        tanggalKeberangkatan: p.package?.departureDate ? new Date(p.package.departureDate).toISOString().split("T")[0] : "-",
        tanggalKepulangan: (() => {
          if (!p.package?.departureDate) return "-";
          const dep = new Date(p.package.departureDate);
          let ret = p.package.returnDate ? new Date(p.package.returnDate) : null;
          if (!ret || ret <= dep) {
            ret = new Date(dep);
            ret.setDate(dep.getDate() + ((p.package.durationDays || 9) - 1));
          }
          return ret.toISOString().split("T")[0];
        })(),
        maskapai: p.package?.airline || "-",
        hotelMakkah: p.package?.hotelMakkah || "-",
        hotelMadinah: p.package?.hotelMadinah || "-",
        statusJamaah: p.status,
      };
    });

    return NextResponse.json(siskopatuhData);
  } catch (error) {
    console.error("Error fetching SISKOPATUH data:", error);
    return NextResponse.json({ error: "Failed to fetch SISKOPATUH manifest" }, { status: 500 });
  }
}
