import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Default Standard Travel Umroh Chart of Accounts (COA)
const defaultCOA = [
  // 1. ASSET (Kas & Bank)
  { code: "1101", name: "Kas Utama Kantor", category: "ASSET", group: "Kas & Setara Kas", normalBalance: "DEBIT", description: "Kas tunai di brankas kantor pusat" },
  { code: "1102", name: "Bank Syariah Indonesia (BSI)", category: "ASSET", group: "Kas & Setara Kas", normalBalance: "DEBIT", description: "Rekening utama penerimaan DP & pelunasan jamaah" },
  { code: "1103", name: "Bank Central Asia (BCA)", category: "ASSET", group: "Kas & Setara Kas", normalBalance: "DEBIT", description: "Rekening operasional bank BCA" },
  { code: "1104", name: "Bank Mandiri Operasional", category: "ASSET", group: "Kas & Setara Kas", normalBalance: "DEBIT", description: "Rekening penampungan & vendor" },
  { code: "1120", name: "Piutang Jamaah & Agen", category: "ASSET", group: "Piutang Usaha", normalBalance: "DEBIT", description: "Sisa tagihan pelunasan jamaah yang belum lunas" },
  { code: "1140", name: "Persediaan Perlengkapan Logistik", category: "ASSET", group: "Persediaan", normalBalance: "DEBIT", description: "Nilai stok koper, seragam, dan buku doa di gudang" },
  { code: "1150", name: "Uang Muka Vendor Saudi / Maskapai", category: "ASSET", group: "Uang Muka", normalBalance: "DEBIT", description: "Deposit blok tiket pesawat & booking hotel Makkah/Madinah" },

  // 2. LIABILITIES (Kewajiban & Hutang)
  { code: "2101", name: "Hutang Vendor Maskapai & Hotel", category: "LIABILITY", group: "Hutang Usaha", normalBalance: "CREDIT", description: "Kewajiban pembayaran ke airline & penyedia hotel" },
  { code: "2102", name: "Hutang Komisi Agen Freelance", category: "LIABILITY", group: "Hutang Usaha", normalBalance: "CREDIT", description: "Komisi closing agen yang belum dicairkan" },
  { code: "2103", name: "Pendapatan Diterima Dimuka (DP Jamaah)", category: "LIABILITY", group: "Uang Muka Pelanggan", normalBalance: "CREDIT", description: "Uang muka jamaah untuk keberangkatan masa mendatang" },

  // 3. EQUITY (Modal)
  { code: "3101", name: "Modal Disetor Pemilik", category: "EQUITY", group: "Modal", normalBalance: "CREDIT", description: "Modal pendirian PT Sulthan Haramain Tour & Travel" },
  { code: "3201", name: "Laba Ditahan (Retained Earnings)", category: "EQUITY", group: "Laba Ditahan", normalBalance: "CREDIT", description: "Akumulasi laba bersih periode sebelumnya" },

  // 4. REVENUE (Pendapatan Usaha)
  { code: "4101", name: "Pendapatan Paket Umroh Reguler", category: "REVENUE", group: "Pendapatan Operasional", normalBalance: "CREDIT", description: "Penerimaan pelunasan paket umroh standar/quad" },
  { code: "4102", name: "Pendapatan Paket Umroh VIP / Plus", category: "REVENUE", group: "Pendapatan Operasional", normalBalance: "CREDIT", description: "Penerimaan paket umroh VIP bintang 5 & plus Turki/Dubai" },
  { code: "4103", name: "Pendapatan Upgrade Kamar (Double/Triple)", category: "REVENUE", group: "Pendapatan Operasional", normalBalance: "CREDIT", description: "Biaya tambahan upgrade kamar hotel jamaah" },
  { code: "4201", name: "Pendapatan Layanan Paspor & Dokumen", category: "REVENUE", group: "Pendapatan Lain-lain", normalBalance: "CREDIT", description: "Jasa asistensi pengurusan paspor & vaksin" },

  // 5. HPP_EXPENSE (Beban Pokok Pendapatan / HPP Paket)
  { code: "5101", name: "HPP - Tiket Pesawat Internasional", category: "HPP_EXPENSE", group: "Beban Pokok Penjualan (HPP)", normalBalance: "DEBIT", description: "Biaya tiket penerbangan PP Jakarta - Jeddah/Madinah" },
  { code: "5102", name: "HPP - Akomodasi Hotel Makkah", category: "HPP_EXPENSE", group: "Beban Pokok Penjualan (HPP)", normalBalance: "DEBIT", description: "Sewa kamar hotel bintang 5 di Makkah (Pullman Zamzam)" },
  { code: "5103", name: "HPP - Akomodasi Hotel Madinah", category: "HPP_EXPENSE", group: "Beban Pokok Penjualan (HPP)", normalBalance: "DEBIT", description: "Sewa kamar hotel di Madinah (Dallah Taibah)" },
  { code: "5104", name: "HPP - Visa Umroh & Asuransi Saudi", category: "HPP_EXPENSE", group: "Beban Pokok Penjualan (HPP)", normalBalance: "DEBIT", description: "Penerbitan e-Visa Umroh resmi Muassasah & asuransi Tawuniya" },
  { code: "5105", name: "HPP - Handling Bandara & Bus Transport", category: "HPP_EXPENSE", group: "Beban Pokok Penjualan (HPP)", normalBalance: "DEBIT", description: "Handling bandara Soekarno Hatta / Jeddah & Bus AC Saudi" },
  { code: "5106", name: "HPP - Muthawwif & Tour Leader", category: "HPP_EXPENSE", group: "Beban Pokok Penjualan (HPP)", normalBalance: "DEBIT", description: "Bisyarah pembimbing ibadah & tour leader bersertifikat" },
  { code: "5107", name: "HPP - Catering Jamaah & Ziarah", category: "HPP_EXPENSE", group: "Beban Pokok Penjualan (HPP)", normalBalance: "DEBIT", description: "Konsumsi full board 3x sehari & city tour Makkah-Madinah" },
  { code: "5108", name: "HPP - Perlengkapan Logistik Jamaah", category: "HPP_EXPENSE", group: "Beban Pokok Penjualan (HPP)", normalBalance: "DEBIT", description: "Pengadaan koper fiber 24\", kain ihram, mukena, batik" },

  // 6. OPEX_EXPENSE (Beban Operasional & Kantor)
  { code: "6101", name: "Beban Komisi & Reward Agen Freelance", category: "OPEX_EXPENSE", group: "Beban Pemasaran & Penjualan", normalBalance: "DEBIT", description: "Fee insentif closing agen per pax jamaah" },
  { code: "6102", name: "Beban Iklan, Promosi & Brosur", category: "OPEX_EXPENSE", group: "Beban Pemasaran & Penjualan", normalBalance: "DEBIT", description: "Biaya Meta Ads, brosur cetak, dan event manasik akbar" },
  { code: "6201", name: "Beban Gaji Karyawan & Staff Kantor", category: "OPEX_EXPENSE", group: "Beban Umum & Administrasi", normalBalance: "DEBIT", description: "Gaji staf admin, marketing, logistik, dan pimpinan" },
  { code: "6202", name: "Beban Sewa Gedung & Listrik Kantor", category: "OPEX_EXPENSE", group: "Beban Umum & Administrasi", normalBalance: "DEBIT", description: "Operasional kantor pusat dan kantor cabang kota" },
  { code: "6203", name: "Beban Internet, Server & Software", category: "OPEX_EXPENSE", group: "Beban Umum & Administrasi", normalBalance: "DEBIT", description: "Langganan internet, domain, server cloud, dan sistem IT" },
  { code: "6204", name: "Beban Administrasi Bank & Pajak", category: "OPEX_EXPENSE", group: "Beban Umum & Administrasi", normalBalance: "DEBIT", description: "Biaya admin transfer bank, kurs SAR-IDR, dan pajak" },
];

export async function GET() {
  try {
    let accounts = await prisma.chartOfAccount.findMany({
      orderBy: { code: "asc" },
    });

    if (accounts.length === 0) {
      console.log("🌱 Initializing Default Chart of Accounts for Travel Umroh...");
      for (let i = 0; i < defaultCOA.length; i++) {
        await prisma.chartOfAccount.create({
          data: {
            ...defaultCOA[i],
            orderIndex: i + 1,
          },
        });
      }
      accounts = await prisma.chartOfAccount.findMany({
        orderBy: { code: "asc" },
      });
    }

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, category, group, normalBalance, description } = body;

    if (!code || !name || !category) {
      return NextResponse.json({ error: "Kode Akun, Nama Akun, dan Kategori wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.chartOfAccount.findUnique({
      where: { code },
    });
    if (existing) {
      return NextResponse.json({ error: `Kode Akun "${code}" sudah terdaftar` }, { status: 400 });
    }

    const created = await prisma.chartOfAccount.create({
      data: {
        code,
        name,
        category,
        group: group || category,
        normalBalance: normalBalance || (["ASSET", "HPP_EXPENSE", "OPEX_EXPENSE"].includes(category) ? "DEBIT" : "CREDIT"),
        description: description || null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
