import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDateToYMD(d: Date | string | null | undefined): string {
  if (!d) return "";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

function mapTitle(gender: string | null | undefined, titleStr: string | null | undefined, marital: string | null | undefined): "TUAN" | "NYONYA" | "NONA" {
  const g = (gender || "").toUpperCase();
  const t = (titleStr || "").toLowerCase();
  const m = (marital || "").toUpperCase();

  if (t.includes("nona") || t.includes("sdri")) return "NONA";
  if (t.includes("nyonya") || t.includes("ibu") || t.includes("hj")) return "NYONYA";
  if (t.includes("tuan") || t.includes("bpk") || t.includes("bapak") || t.includes("h.") || t.includes("ustadz")) return "TUAN";

  if (g === "MALE" || g === "L" || g === "PRIA" || g === "LAKI-LAKI") {
    return "TUAN";
  }

  // Female
  if (m.includes("BELUM") || m.includes("LAJANG") || m.includes("SINGLE")) {
    return "NONA";
  }
  return "NYONYA";
}

function mapStatusPernikahan(str: string | null | undefined): "BELUM MENIKAH" | "MENIKAH" | "JANDA / DUDA" {
  if (!str) return "MENIKAH";
  const s = str.toUpperCase();
  if (s.includes("BELUM") || s.includes("LAJANG") || s.includes("SINGLE")) return "BELUM MENIKAH";
  if (s.includes("CERAI") || s.includes("JANDA") || s.includes("DUDA")) return "JANDA / DUDA";
  return "MENIKAH";
}

function mapPendidikan(str: string | null | undefined): string {
  if (!str || str === "-") return "SMA/MA";
  const s = str.toUpperCase().trim();
  if (s.includes("TIDAK") || s.includes("BELUM")) return "TIDAK SEKOLAH";
  if (s === "SD" || s.includes("SD/") || s.includes("MI")) return "SD/MI";
  if (s === "SMP" || s.includes("SMP/") || s.includes("MTS")) return "SMP/MTS";
  if (s === "SMA" || s === "SMK" || s === "MA" || s.includes("SMA/") || s.includes("SLTA")) return "SMA/MA";
  if (/\bD1\b/.test(s)) return "D1";
  if (/\bD2\b/.test(s)) return "D2";
  if (/\bD3\b/.test(s) || s.includes("DIPLOMA")) return "D3";
  if (/\bD4\b/.test(s) || /\bS1\b/.test(s) || s.includes("SARJANA")) return "D4/S1";
  if (/\bS2\b/.test(s) || s.includes("MAGISTER")) return "S2";
  if (/\bS3\b/.test(s) || s.includes("DOKTOR")) return "S3";
  return "SMA/MA";
}

function mapPekerjaan(str: string | null | undefined): string {
  if (!str || str === "-") return "LAINNYA";
  const s = str.toUpperCase().trim();
  if (s.includes("PNS") || s.includes("ASN")) return "PNS";
  if (s.includes("TNI") || s.includes("POLRI") || s.includes("POLISI") || s.includes("TENTARA")) return "TNI / POLRI";
  if (s.includes("PETANI") || s.includes("PEKEBUN")) return "PETANI";
  if (s.includes("NELAYAN")) return "NELAYAN";
  if (s.includes("WIRAUSAHA") || s.includes("WIRASWASTA") || s.includes("PEDAGANG") || s.includes("BISNIS")) return "WIRAUSAHA";
  if (s.includes("SWASTA") || s.includes("KARYAWAN") || s.includes("PEGAWAI") || s.includes("BURUH")) return "PEG. SWASTA";
  if (s.includes("TIDAK BEKERJA") || s.includes("IRT") || s.includes("IBU RUMAH TANGGA") || s.includes("PELAJAR") || s.includes("MAHASISWA") || s.includes("PENSIUN")) return "TIDAK BEKERJA";
  return "LAINNYA";
}

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

    // Format exactly according to official 32-column SISKOPATUH Kemenag RI specification
    const siskopatuhData = pilgrims.map((p, idx) => {
      // Check Meningitis vaccination status from requirements or pilgrim model
      const meningitisReq = p.requirements.find(
        (r) => r.name.toLowerCase().includes("meningitis") || r.name.toLowerCase().includes("vaksin")
      );
      const isVaccinated = p.hasMeningitisVaccine || (meningitisReq ? meningitisReq.isVerified : false);

      // Check Passport requirement
      const passportReq = p.requirements.find(
        (r) => r.name.toLowerCase().includes("paspor")
      );
      const passportVerified = passportReq ? passportReq.isVerified : !!(p.passportNumber && p.passportNumber !== "-");

      const title = mapTitle(p.gender, p.title, p.maritalStatus);
      const nama = (p.name || "").trim().toUpperCase();
      const namaAyah = p.fatherName && p.fatherName !== "-" ? p.fatherName.trim().toUpperCase() : "";
      
      const hasValidPassport = p.passportNumber && p.passportNumber !== "-" && p.passportNumber.trim() !== "";
      const jenisIdentitas: "PASPOR" | "NIK" = hasValidPassport ? "PASPOR" : "NIK";
      const noIdentitas = jenisIdentitas === "PASPOR" ? p.passportNumber!.trim().toUpperCase() : (p.nik ? p.nik.trim() : "");
      const namaPaspor = (p.passportName || p.name || "").trim().toUpperCase();
      const noPaspor = hasValidPassport ? p.passportNumber!.trim().toUpperCase() : "";
      const tglDikeluarkanPaspor = formatDateToYMD(p.passportIssuedDate);
      const kotaPaspor = p.passportIssuedCity && p.passportIssuedCity !== "-" ? p.passportIssuedCity.trim().toUpperCase() : "";

      const tempatLahir = p.placeOfBirth && p.placeOfBirth !== "-" ? p.placeOfBirth.trim().toUpperCase() : "";
      const tglLahir = formatDateToYMD(p.dateOfBirth);

      const alamat = p.address && p.address !== "-" ? p.address.trim().toUpperCase() : "";
      const provinsi = p.province && p.province !== "-" ? p.province.trim().toUpperCase() : "SUMATERA UTARA";
      const kabupaten = p.city && p.city !== "-" ? p.city.trim().toUpperCase() : "";
      const kecamatan = p.district && p.district !== "-" ? p.district.trim().toUpperCase() : "";
      const kelurahan = p.subDistrict && p.subDistrict !== "-" ? p.subDistrict.trim().toUpperCase() : "";

      const noTelepon = p.telephone && p.telephone !== "-" ? p.telephone.trim() : "";
      const noHp = p.phone && p.phone !== "-" ? p.phone.trim() : "";
      const kewarganegaraan = p.citizenship === "WNA" ? "WNA" : "WNI";
      const statusPernikahan = mapStatusPernikahan(p.maritalStatus);
      const pendidikan = mapPendidikan(p.education);
      const pekerjaan = mapPekerjaan(p.job);

      const providerVisa = p.visaProvider && p.visaProvider !== "-" ? p.visaProvider.trim() : "";
      const noVisa = p.visaNumber && p.visaNumber !== "-" ? p.visaNumber.trim() : "";
      const tglBerlakuVisa = formatDateToYMD(p.visaIssueDate);
      const tglAkhirVisa = formatDateToYMD(p.visaExpiryDate);

      const asuransi = p.insuranceNumber ? "ASURANSI TAKAFUL UMUM" : "";
      const noPolis = p.insuranceNumber && p.insuranceNumber !== "-" ? p.insuranceNumber.trim() : "";
      const tglInputPolis = "";
      const tglAwalPolis = formatDateToYMD(p.package?.departureDate);
      const tglAkhirPolis = formatDateToYMD(p.package?.returnDate);
      const noBpjs = "";

      return {
        // --- 32 Kolom Baku Kemenag RI SISKOPATUH ---
        title,
        nama,
        namaAyah,
        jenisIdentitas,
        noIdentitas,
        namaPaspor,
        noPaspor,
        tglDikeluarkanPaspor,
        kotaPaspor,
        tempatLahir,
        tglLahir,
        alamat,
        provinsi,
        kabupaten,
        kecamatan,
        kelurahan,
        noTelepon,
        noHp,
        kewarganegaraan,
        statusPernikahan,
        pendidikan,
        pekerjaan,
        providerVisa,
        noVisa,
        tglBerlakuVisa,
        tglAkhirVisa,
        asuransi,
        noPolis,
        tglInputPolis,
        tglAwalPolis,
        tglAkhirPolis,
        noBpjs,

        // --- Metadata Tambahan untuk Tampilan & ID Card ---
        id: p.id,
        noUrut: idx + 1,
        namaLengkap: nama,
        nik: p.nik || "-",
        jenisKelamin: p.gender === "FEMALE" ? "P" : "L",
        statusVaksinMeningitis: isVaccinated ? "SUDAH" : "BELUM",
        statusPaspor: passportVerified ? "VALID" : "PENDING",
        tipeKamar: p.roomType || "QUAD",
        ukuranSeragam: p.uniformSize || "L",
        kodePaket: p.package?.code || "-",
        namaPaket: p.package?.name || "-",
        tanggalKeberangkatan: formatDateToYMD(p.package?.departureDate),
        tanggalKepulangan: formatDateToYMD(p.package?.returnDate),
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
