# 🕋 Aplikasi Manajemen & Operasional Travel Umroh Terpadu

Aplikasi Sistem ERP & CRM Travel Umroh modern yang mengintegrasikan seluruh proses bisnis travel umroh: mulai dari **pencarian & pipeline prospek jamaah (Marketing CRM)**, **invoicing pembayaran DP & pelunasan + WhatsApp Reminder**, **inventaris logistik keluar-masuk perlengkapan**, **form ceklis serah terima barang dengan digital signature**, **ceklis persyaratan & dokumen umroh**, hingga **generator surat-surat resmi (Surat Izin Cuti, Rekomendasi Paspor Imigrasi, Pengantar Kemenag)**, serta **portal tampilan smartphone (Mobile App Android & iOS)** untuk jamaah dan agen di lapangan.

---

## 🌟 Fitur Unggulan Sistem

### 1. 🎯 Marketing & Pipeline Prospek (Pencarian Jamaah)
- Input calon jamaah baru dari berbagai sumber (*Instagram, TikTok, Website, Referral, Agen, Walk-In*).
- Kanban Pipeline Status: *Lead Baru ➡️ Dihubungi ➡️ Tertarik ➡️ Penawaran Terkirim ➡️ Closing DP ➡️ Batal*.
- Riwayat interaksi & catatan follow-up (*Telepon, WhatsApp, Pertemuan*) dengan pengingat jadwal tindak lanjut.
- **Fitur 1-Klik Konversi ke Jamaah Resmi**: Otomatis mendaftarkan jamaah ke database, menerbitkan Invoice DP resmi, dan menyiapkan matriks ceklis berkas persyaratan.

### 2. 👥 Database Lengkap Jamaah & Manifest Keberangkatan
- Master data profil lengkap: NIK KTP, No. Paspor, Masa Berlaku Paspor, Tempat/Tgl Lahir, Jenis Kelamin, Golongan Darah, Alamat.
- Manajemen Mahram & Hubungan Keluarga.
- Kontak Darurat & Catatan Khusus Riwayat Kesehatan.
- Preferensi Tipe Kamar (*Quad, Triple, Double*) dan Ukuran Seragam/Batik (*S, M, L, XL, XXL, XXXL*).
- Filter status perjalanan & export data manifest jamaah ke format CSV / Excel.

### 3. 💳 Keuangan, Invoicing & Follow-up Pembayaran
- Pencatatan otomatis Uang Muka (DP), Cicilan Bertahap, dan Pelunasan Akhir.
- **Tombol WhatsApp Reminder Otomatis**: Sekali klik langsung membuka chat WhatsApp jamaah dengan pesan tagihan rapi berisikan rincian nominal, tanggal jatuh tempo, dan nomor rekening resmi travel (BSI, BCA, Mandiri).
- **Kwitansi Pembayaran Digital Resmi**: Dilengkapi nomor kwitansi otomatis, terbilang rupiah, tanda tangan bendahara, stempel travel, dan siap dicetak/PDF.

### 4. 📦 Inventaris Logistik & Mutasi Keluar-Masuk Perlengkapan
- Manajemen stok perlengkapan (*Koper Bagasi 24", Ransel Kabin, Kain Ihram Pria, Mukena/Bergo Wanita, Bahan Kain Batik, Buku Saku Doa Manasik, Tas Paspor Leher*).
- Pencatatan mutasi stok: *Stok Masuk (Restock/Beli dari Supplier), Distribusi ke Jamaah, Retur, dan Penyesuaian Stock Opname*.
- Notifikasi & peringatan visual jika stok menipis (di bawah *Min. Stock Alert*).

### 5. ✍️ Form Ceklis Serah Terima Logistik + Tanda Tangan Digital
- Formulir interaktif penyerahan perlengkapan per jamaah.
- Checklist item yang diserahkan dengan otomatisasi pemotongan stok gudang.
- **Canvas Tanda Tangan Digital (Signature Pad)**: Jamaah/penerima dapat langsung menandatangani di layar laptop atau smartphone/tablet saat menerima barang.
- Cetak **Berita Acara Serah Terima (BAST)** resmi berformat standar dengan tanda tangan digital tersemat.

### 6. 📋 Form Ceklis Syarat & Dokumen Umroh
- Matriks kelengkapan berkas per jamaah:
  1. Paspor Asli (Masa Berlaku Min. 8 Bulan)
  2. Buku Kuning / Sertifikat Vaksin Meningitis
  3. Pasfoto 4x6 Latar Belakang Putih (80% Wajah)
  4. Fotokopi KTP & Kartu Keluarga (KK)
  5. Buku Nikah Asli / Akta Lahir (Bagi Mahram)
  6. Surat Rekomendasi Kemenag / Kantor
- Fitur 1-Klik Verifikasi Berkas Sah & tracking progress kelengkapan dokumen.

### 7. 📄 Generator Surat-Surat Resmi Keperluan Jamaah (Siap Cetak / PDF)
- **Surat Rekomendasi Pembuatan / Penggantian Paspor** (ke Kantor Imigrasi).
- **Surat Permohonan Izin / Cuti Ibadah Umroh** (ke Pimpinan Perusahaan, Instansi Pemerintah, Kampus, atau Sekolah).
- **Surat Pengantar Rekomendasi Kemenag** (ke Kantor Kemenag Kab/Kota).
- **Surat Keterangan Terdaftar Calon Jamaah**.
- Format KOP surat resmi, nomor surat otomatis standar PPIU, landasan izin Kemenag, dan tanda tangan direktur.

### 8. 📱 Portal Mobile User (Android & iOS Responsive PWA)
- Tampilan khusus smartphone yang dapat diakses oleh jamaah & agen di lapangan:
  - **Portal Jamaah**: Profil saya, hitung mundur (countdown) keberangkatan, status pembayaran & invoice tagihan, ceklis syarat dokumen saya, ceklis perlengkapan yang diterima.
  - **Portal Agen Lapangan**: Input cepat prospek calon jamaah saat pameran/manasik, cek ketersediaan kuota paket & stok perlengkapan.

---

## 🚀 Cara Menjalankan Aplikasi

1. **Jalankan server aplikasi**:
   ```bash
   npm run dev
   ```
2. **Buka di browser**:
   - Web Admin & Mobile Simulator: [http://localhost:3000](http://localhost:3000)

3. **Perintah Database (Prisma)**:
   - Reset & Seed data awal: `npm run db:seed`
   - Buka Prisma Studio (GUI Database Viewer): `npx prisma studio`

---

## 🛠 Teknologi yang Digunakan
- **Framework**: Next.js 14 (App Router, Server Actions & REST API)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **Database & ORM**: SQLite + Prisma ORM (Portabel, siap beralih ke PostgreSQL/MySQL)
- **Document & Print Engine**: Custom CSS Print Engine & Responsive A4 Layout
