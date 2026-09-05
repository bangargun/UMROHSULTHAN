// ─── MASTER DATA CHECKLIST PERLENGKAPAN UMROH (PACKING LIST) ──────────────────

export interface PackingItem {
  id: string;
  name: string;
  category: "PAKAIAN" | "IBADAH" | "PRIBADI" | "ELEKTRONIK" | "KESEHATAN" | "LAUNDRY" | "AKSESORIS";
  notes?: string;
  isEssential?: boolean;
}

export const MEN_PACKING_LIST: PackingItem[] = [
  { id: "m-1", name: "Kain Ihram", category: "PAKAIAN", notes: "2 lembar (atas & bawah) tanpa jahitan", isEssential: true },
  { id: "m-2", name: "Sabuk Ihram", category: "PAKAIAN", notes: "Pengencang kain ihram dengan kantong saku", isEssential: true },
  { id: "m-3", name: "Baju Koko / Jubah (5 pcs)", category: "PAKAIAN", notes: "Untuk shalat harian di Masjidil Haram & Nabawi" },
  { id: "m-4", name: "Baju Kaos (2 pcs)", category: "PAKAIAN", notes: "Pakaian santai / istirahat di hotel" },
  { id: "m-5", name: "Celana Panjang (3 pcs)", category: "PAKAIAN", notes: "Bahan katun / longgar nyaman" },
  { id: "m-6", name: "Sarung", category: "PAKAIAN", notes: "Untuk santai di hotel" },
  { id: "m-7", name: "Peci / Kopiah", category: "IBADAH", notes: "Dipakai di luar waktu berihram" },
  { id: "m-8", name: "Pakaian Dalam Secukupnya", category: "PAKAIAN", notes: "Disesuaikan dengan durasi perjalanan 9-12 hari" },
  { id: "m-9", name: "Sajadah Lipat", category: "IBADAH", notes: "Ringan & praktis saat shalat di pelataran masjid" },
  { id: "m-10", name: "Al-Qur'an Sedang / Mini", category: "IBADAH", notes: "Buku saku / Al-Qur'an terjemah" },
  { id: "m-11", name: "Handuk Kecil", category: "PRIBADI", notes: "Untuk lap keringat / wudhu" },
  { id: "m-12", name: "Botol Minum", category: "PRIBADI", notes: "Untuk isi ulang air Zamzam di masjid" },
  { id: "m-13", name: "Perlengkapan Mandi", category: "PRIBADI", notes: "Sabun non-parfum untuk ihram, sikat & pasta gigi, sampo" },
  { id: "m-14", name: "Sandal Ringan", category: "PRIBADI", notes: "Sandal jepit / selop yang tidak menutupi mata kaki" },
  { id: "m-15", name: "Kacamata Hitam", category: "AKSESORIS", notes: "Pelindung terik matahari siang di tanah suci" },
  { id: "m-16", name: "Topi", category: "AKSESORIS", notes: "Dipakai di luar kondisi berihram" },
  { id: "m-17", name: "Colokan 3 Internasional (Travel Adaptor)", category: "ELEKTRONIK", notes: "Tipe colokan kaki 3 (British Standard G) untuk di hotel Saudi", isEssential: true },
  { id: "m-18", name: "Botol Spray Wudhu (100 ml)", category: "PRIBADI", notes: "Sangat membantu wudhu darurat di bus / saf masjid", isEssential: true },
  { id: "m-19", name: "Bodycare / Skincare Maks 100 ml", category: "PRIBADI", notes: "Parfum (non-ihram), deodorant, sunblock / pelembab kulit" },
  { id: "m-20", name: "Perlengkapan Laundry", category: "LAUNDRY", notes: "Hanger baju, deterjen sachet, pewangi pakaian" },
  { id: "m-21", name: "Obat-obatan Pribadi", category: "KESEHATAN", notes: "Vitamin, tolak angin, freshcare, obat flu/batuk, koyo, paracetamol", isEssential: true },
  { id: "m-22", name: "Tas Pribadi / Tas Paspor", category: "PRIBADI", notes: "Menyimpan paspor, dompet, HP, dan kartu identitas jamaah", isEssential: true },
];

export const WOMEN_PACKING_LIST: PackingItem[] = [
  { id: "w-1", name: "1 Set Gamis Umroh Hitam / Putih", category: "PAKAIAN", notes: "Pakaian ihram syar'i menutup aurat", isEssential: true },
  { id: "w-2", name: "Mukenah dari Travel", category: "IBADAH", notes: "Mukenah resmi travel untuk shalat berjamaah", isEssential: true },
  { id: "w-3", name: "6 Set Gamis Bebas (Tidak Menerawang)", category: "PAKAIAN", notes: "Gamis harian longgar bahan adem" },
  { id: "w-4", name: "Daster / Baju Tidur (4 pcs)", category: "PAKAIAN", notes: "Untuk istirahat di kamar hotel" },
  { id: "w-5", name: "Handsock (5 pcs)", category: "PAKAIAN", notes: "Manset penutup pergelangan tangan agar aurat tidak terbuka" },
  { id: "w-6", name: "Kaos Kaki (6 Pasang)", category: "PAKAIAN", notes: "Kaos kaki wudhu / jempol tebal" },
  { id: "w-7", name: "Inner / Ciput Hijab (4 pcs)", category: "PAKAIAN", notes: "Penjaga rambut agar tidak keluar dari jilbab" },
  { id: "w-8", name: "Celana Legging (4 pcs)", category: "PAKAIAN", notes: "Dalaman gamis untuk kenyamanan berjalan jauh" },
  { id: "w-9", name: "Set Pakaian Dalam Secukupnya", category: "PAKAIAN", notes: "Disesuaikan dengan durasi perjalanan 9-12 hari" },
  { id: "w-10", name: "Handuk Kecil", category: "PRIBADI", notes: "Untuk lap keringat / wudhu" },
  { id: "w-11", name: "Botol Minum", category: "PRIBADI", notes: "Untuk isi ulang air Zamzam di masjid" },
  { id: "w-12", name: "Sajadah Lipat", category: "IBADAH", notes: "Ringan & praktis saat shalat di pelataran masjid" },
  { id: "w-13", name: "Al-Qur'an Sedang / Mini", category: "IBADAH", notes: "Buku saku / Al-Qur'an terjemah" },
  { id: "w-14", name: "Perlengkapan Mandi", category: "PRIBADI", notes: "Sabun non-parfum untuk ihram, sikat & pasta gigi, pembersih wajah" },
  { id: "w-15", name: "Sandal Ringan", category: "PRIBADI", notes: "Sandal selop / jepit empuk nyaman untuk tawaf & sa'i" },
  { id: "w-16", name: "Kacamata Hitam", category: "AKSESORIS", notes: "Pelindung silau matahari di pelataran Ka'bah" },
  { id: "w-17", name: "Topi / Payung Pelindung", category: "AKSESORIS", notes: "Pelindung panas siang hari di luar masjid" },
  { id: "w-18", name: "Colokan 3 Internasional (Travel Adaptor)", category: "ELEKTRONIK", notes: "Tipe colokan kaki 3 (British Standard G) untuk hotel Saudi", isEssential: true },
  { id: "w-19", name: "Payung Lipat Kecil", category: "AKSESORIS", notes: "Pelindung cuaca panas saat city tour & ziarah" },
  { id: "w-20", name: "Botol Spray Wudhu (100 ml)", category: "PRIBADI", notes: "Sangat membantu wudhu praktis di saf shalat", isEssential: true },
  { id: "w-21", name: "Bodycare / Skincare Maks 100 ml", category: "PRIBADI", notes: "Parfum (non-ihram), deodorant, body lotion, sunblock, pembalut, pantyliner", isEssential: true },
  { id: "w-22", name: "Perlengkapan Laundry", category: "LAUNDRY", notes: "Hanger baju, deterjen sachet, pewangi pakaian" },
  { id: "w-23", name: "Obat-obatan Pribadi & Primolut", category: "KESEHATAN", notes: "Vitamin, paracetamol, tolak angin, freshcare, obat flu/batuk, koyo, Primolut (obat penunda haid konsul dokter/bidan)", isEssential: true },
  { id: "w-24", name: "Tas Pribadi / Tas Paspor", category: "PRIBADI", notes: "Menyimpan paspor, dompet, HP, dan kartu identitas jamaah", isEssential: true },
];

export function getPackingListByGender(gender?: string): PackingItem[] {
  if (gender === "FEMALE" || gender === "PEREMPUAN" || gender === "F") {
    return WOMEN_PACKING_LIST;
  }
  return MEN_PACKING_LIST;
}

export function generatePackingWhatsAppText(options: {
  pilgrimName?: string;
  gender?: "MALE" | "FEMALE" | string;
  packageName?: string;
  departureDate?: string;
  companyName?: string;
  phone?: string;
}): string {
  const isFemale = options.gender === "FEMALE" || options.gender === "PEREMPUAN" || options.gender === "F";
  const titleGender = isFemale ? "PEREMPUAN (MUSLIMAH)" : "LAKI-LAKI (IKHWAN)";
  const items = isFemale ? WOMEN_PACKING_LIST : MEN_PACKING_LIST;
  const company = options.companyName || "PT BAROKAH SULTHAN HARAMAIN";

  let text = `*PANDUAN & CHECKLIST PERSIAPAN PERLENGKAPAN UMROH*\n`;
  text += `*${company}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (options.pilgrimName) {
    text += `Yth. Jamaah: *${options.pilgrimName}*\n`;
  }
  if (options.packageName) {
    text += `Program: *${options.packageName}*\n`;
  }
  if (options.departureDate) {
    text += `Jadwal Berangkat: *${options.departureDate}*\n`;
  }
  text += `Kategori: *Perlengkapan Umroh ${titleGender}*\n\n`;

  text += `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n`;
  text += `Menjelang keberangkatan ibadah umroh, berikut panduan checklist barang bawaan pribadi yang wajib dipersiapkan di koper:\n\n`;

  items.forEach((item, idx) => {
    text += `${idx + 1}. *${item.name}*\n`;
    if (item.notes) {
      text += `   ↳ _${item.notes}_\n`;
    }
  });

  text += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `⚠️ *CATATAN PENTING KOPER & PENERBANGAN:*\n`;
  text += `1. Semua cairan/skincare/spray lebih dari 100 ml *WAJIB* dimasukkan ke dalam Koper Bagasi Besar.\n`;
  text += `2. Barang berharga (Paspor, Buku Kuning, Uang, HP, Powerbank maks 20.000 mAh) *WAJIB* di Tas Kabin/Tas Paspor.\n`;
  text += `3. Dilarang membawa gunting, gunting kuku, pisau cukur di Tas Kabin (masukkan koper bagasi).\n`;
  text += `4. Koper besar akan diserahkan dan ditimbang saat check-in bandara (maksimal 25-30 kg).\n\n`;
  text += `Semoga Allah memudahkan seluruh persiapan ibadah umroh Bapak/Ibu dan mengaruniakan umroh yang mabrur. Aamiin 🤲\n\n`;
  text += `Hotline Travel: *${options.phone || "0821-6733-9464"}*`;

  return text;
}
