import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Default Standard Letter Templates & Abbreviations for Travel Umroh
const defaultLetterTemplates = [
  {
    code: "ENDOS",
    typeKey: "SURAT_ENDORSEMENT_PASPOR",
    title: "Surat Permohonan Endos Nama di Paspor",
    subject: "Permohonan Penambahan / Endorsement Nama pada Paspor",
    defaultDest: "Kepala Kantor Imigrasi Kelas I / II TPI",
    defaultNotes: "Penambahan nama menjadi 3 suku kata pada halaman pengesahan paspor untuk pemenuhan syarat Visa Umroh.",
    bodyTemplate: "Bersama ini kami selaku Pimpinan PT SULTHAN HARAMAIN TOUR & TRAVEL mengajukan permohonan kepada Bapak/Ibu kiranya berkenan melakukan Penambahan / Endorsement Nama pada Halaman Pengesahan (Endorsement Page) paspor calon jamaah umroh kami menjadi 3 (tiga) suku kata guna memenuhi persyaratan penerbitan Visa Umroh dari Kementerian Haji dan Umrah Kerajaan Arab Saudi.",
    orderIndex: 1,
  },
  {
    code: "PASPOR",
    typeKey: "SURAT_REKOMENDASI_PASPOR",
    title: "Surat Rekomendasi Pembuatan Paspor Baru",
    subject: "Permohonan Paspor Calon Jemaah Umrah",
    defaultDest: "Kantor Imigrasi Kelas II TPI Pematang Siantar",
    defaultNotes: "Rekomendasi & Jaminan resmi pengurusan paspor baru umroh berdasarkan SE Dirjen Imigrasi No. IMI-0342 GR.01.01 Tahun 2014.",
    bodyTemplate: "Bersama ini saya mengajukan permohonan paspor untuk calon Jemaah Umrah berdasarkan SE Direktur Jendral Imigrasi No. IMI-0342 GR.01.01 tahun 2014 tentang Penerbitan Proses Pengurusan Paspor oleh PPIU tanggal 04 Maret 2014.",
    orderIndex: 2,
  },
  {
    code: "PERPANJANG",
    typeKey: "SURAT_PERPANJANG_PASPOR",
    title: "Surat Rekomendasi Perpanjangan / Penggantian Paspor",
    subject: "Permohonan Perpanjangan / Penggantian Paspor Calon Jemaah Umrah",
    defaultDest: "Kantor Imigrasi Kelas II TPI Pematang Siantar",
    defaultNotes: "Rekomendasi & Jaminan resmi perpanjangan/penggantian paspor habis masa berlaku untuk ibadah Umroh berdasarkan SE Dirjen Imigrasi No. IMI-0342 GR.01.01 Tahun 2014.",
    bodyTemplate: "Bersama ini saya mengajukan permohonan perpanjangan / penggantian paspor untuk calon Jemaah Umrah berdasarkan SE Direktur Jendral Imigrasi No. IMI-0342 GR.01.01 tahun 2014 tentang Penerbitan Proses Pengurusan Paspor oleh PPIU tanggal 04 Maret 2014.",
    orderIndex: 3,
  },
  {
    code: "CUTI",
    typeKey: "SURAT_IZIN_CUTI",
    title: "Surat Permohonan Izin Cuti Kerja / Kuliah / Sekolah",
    subject: "Permohonan Izin / Dispensasi Cuti Ibadah Umroh",
    defaultDest: "Pimpinan Perusahaan / Kepala Instansi",
    defaultNotes: "Permohonan dispensasi/izin cuti kerja untuk menunaikan ibadah umroh.",
    bodyTemplate: "Bersama ini kami memohon kiranya Bapak/Ibu pimpinan dapat memberikan dispensasi serta izin cuti bagi karyawan/peserta didik yang bersangkutan untuk menunaikan ibadah umroh ke Tanah Suci Makkah dan Madinah sampai dengan selesai.",
    orderIndex: 3,
  },
  {
    code: "KEMENAG",
    typeKey: "SURAT_PENGANTAR_KEMENAG",
    title: "Surat Pengantar Rekomendasi Kemenag",
    subject: "Permohonan Surat Rekomendasi Pendaftaran Umroh Kemenag",
    defaultDest: "Kepala Kantor Kementerian Agama Kab/Kota",
    defaultNotes: "Rekomendasi pendaftaran umroh ke Kantor Kemenag Kab/Kota.",
    bodyTemplate: "Bersama ini kami mengajukan permohonan penerbitan surat rekomendasi dari Kantor Kementerian Agama bagi calon jamaah umroh yang terdaftar pada PPIU kami guna melengkapi persyaratan dokumen perjalanan ibadah.",
    orderIndex: 4,
  },
  {
    code: "JAMAAH",
    typeKey: "SURAT_KETERANGAN_JAMAAH",
    title: "Surat Keterangan Terdaftar Calon Jamaah",
    subject: "Surat Keterangan Terdaftar Calon Jamaah Umroh",
    defaultDest: "Pihak Terkait / Kedutaan / Bank",
    defaultNotes: "Keterangan resmi bahwa yang bersangkutan telah terdaftar sebagai jamaah umroh aktif.",
    bodyTemplate: "Dengan ini kami menerangkan dengan sebenarnya bahwa nama yang tercantum di bawah ini adalah benar calon jamaah umroh resmi PT SULTHAN HARAMAIN TOUR & TRAVEL yang telah melengkapi administrasi pendaftaran.",
    orderIndex: 5,
  },
  {
    code: "MAHRAM",
    typeKey: "SURAT_MAHRAM",
    title: "Surat Keterangan Mahram & Pendampingan",
    subject: "Surat Pernyataan Mahram dan Pendampingan Keluarga",
    defaultDest: "Kantor Imigrasi / Kementerian Agama",
    defaultNotes: "Keterangan hubungan mahram dan pendampingan resmi selama di Tanah Suci.",
    bodyTemplate: "Dengan ini kami menyatakan bahwa jamaah yang bersangkutan berangkat didampingi oleh mahram resmi / keluarga selama pelaksanaan ibadah umroh di Tanah Suci.",
    orderIndex: 6,
  },
  {
    code: "MANASIK",
    typeKey: "SURAT_UNDANGAN_MANASIK",
    title: "Surat Undangan Manasik Umroh & Pembagian Perlengkapan",
    subject: "Undangan Bimbingan Manasik Ibadah Umroh & Pembagian Logistik",
    defaultDest: "Bapak/Ibu Calon Jamaah Umroh & Keluarga",
    defaultNotes: "Undangan bimbingan teori & praktik manasik umroh serta pendistribusian koper dan perlengkapan.",
    bodyTemplate: "Sehubungan dengan semakin dekatnya jadwal keberangkatan ibadah Umroh ke Tanah Suci, bersama ini kami mengundang Bapak/Ibu Calon Jamaah Umroh untuk hadir dalam kegiatan Bimbingan Manasik Ibadah Umroh (Teori & Simulasi Praktik Thawaf/Sa'i) sekaligus Pembagian Koper & Perlengkapan Resmi Travel.",
    orderIndex: 7,
  },
  {
    code: "SILATURAHMI",
    typeKey: "SURAT_UNDANGAN_HALAL_BIHALAL",
    title: "Surat Undangan Halal Bi Halal & Silaturahmi Kepulangan",
    subject: "Undangan Silaturahmi, Temu Alumni & Halal Bi Halal Pasca Umroh",
    defaultDest: "Bapak/Ibu Alumni Jamaah Umroh & Keluarga",
    defaultNotes: "Undangan temu kangen, silaturahmi, dan penyerahan piagam/sertifikat resmi pasca ibadah umroh.",
    bodyTemplate: "Alhamdulillahirabbil'alamin, atas berkat rahmat Allah SWT seluruh rangkaian ibadah Umroh telah terlaksana dengan lancar dan seluruh jamaah telah tiba kembali di tanah air dengan selamat. Guna mempererat tali silaturahmi dan ukhuwah islamiyah antar jamaah, kami mengundang Bapak/Ibu beserta keluarga dalam acara Halal Bi Halal & Temu Kangen Alumni Jamaah Umroh.",
    orderIndex: 8,
  },
  {
    code: "RESMI",
    typeKey: "SURAT_CUSTOM",
    title: "Surat Keterangan Resmi Kustom Lainnya",
    subject: "Surat Keterangan Resmi Travel Umroh",
    defaultDest: "Instansi / Pihak Terkait",
    defaultNotes: "Surat keterangan resmi dinamis untuk keperluan administratif lainnya.",
    bodyTemplate: "Bersama ini kami selaku Pimpinan PT SULTHAN HARAMAIN TOUR & TRAVEL menerangkan bahwa calon jamaah umroh kami yang terdaftar pada program keberangkatan resmi memerlukan dokumen surat keterangan ini.",
    orderIndex: 9,
  },
];

export async function GET() {
  try {
    let templates = await prisma.letterTemplate.findMany({
      orderBy: { orderIndex: "asc" },
    });

    if (templates.length === 0) {
      console.log("🌱 Initializing Default Letter Templates and Abbreviations...");
      for (const t of defaultLetterTemplates) {
        await prisma.letterTemplate.create({ data: t });
      }
      templates = await prisma.letterTemplate.findMany({
        orderBy: { orderIndex: "asc" },
      });
    } else {
      // Ensure MANASIK and SILATURAHMI exist in database
      for (const t of defaultLetterTemplates) {
        const exist = templates.find((x) => x.typeKey === t.typeKey || x.code === t.code);
        if (!exist) {
          await prisma.letterTemplate.create({ data: t });
        }
      }
      templates = await prisma.letterTemplate.findMany({
        orderBy: { orderIndex: "asc" },
      });
    }

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching letter templates:", error);
    return NextResponse.json({ error: "Failed to fetch letter templates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, typeKey, title, subject, defaultDest, defaultNotes, bodyTemplate } = body;

    if (!code || !title) {
      return NextResponse.json({ error: "Kode Singkatan dan Judul Surat wajib diisi" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    const cleanKey = typeKey || `SURAT_${cleanCode}`;

    const existing = await prisma.letterTemplate.findFirst({
      where: {
        OR: [{ code: cleanCode }, { typeKey: cleanKey }],
      },
    });

    if (existing) {
      return NextResponse.json({ error: `Kode Singkatan "${cleanCode}" sudah digunakan.` }, { status: 400 });
    }

    const count = await prisma.letterTemplate.count();

    const created = await prisma.letterTemplate.create({
      data: {
        code: cleanCode,
        typeKey: cleanKey,
        title,
        subject: subject || title,
        defaultDest: defaultDest || "Instansi Terkait",
        defaultNotes: defaultNotes || null,
        bodyTemplate: bodyTemplate || null,
        orderIndex: count + 1,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating letter template:", error);
    return NextResponse.json({ error: "Failed to create letter template" }, { status: 500 });
  }
}
