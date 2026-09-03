import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Master Catalog of Official PPIU Standard Operating Procedures & Legal Governance
const officialSopCatalog = [
  // 1. LEGALITAS & TATA KELOLA PERUSAHAAN
  {
    code: "REG-CORP-001",
    category: "LEGALITAS_PERUSAHAAN",
    title: "Visi, Misi, Falsafah Nilai & 7 Prinsip Budaya Kerja Perusahaan",
    purpose: "Menetapkan arah strategis, landasan moral spiritual, dan budaya kerja unggul seluruh insan perusahaan dalam melayani tamu-tamu Allah (Dhuyufurrahman).",
    scope: "Berlaku untuk seluruh Direksi, Manajemen, Staf Operasional, Tour Leader, Muthawwif, Cabang, dan Mitra Agen.",
    responsibleRole: "Direktur Utama & Dewan Pengawas",
    version: "2.0",
    tags: "visi, misi, budaya, nilai, tata kelola, integritas",
    isMandatory: true,
    orderIndex: 1,
    contentMarkdown: `### 1. Visi Perusahaan
Menjadi Penyelenggara Perjalanan Ibadah Umroh (PPIU) dan Haji Khusus terdepan, terpercaya, dan paling amanah di Indonesia yang memberikan pengalaman spiritual terbaik, fasilitas bintang lima, serta bimbingan ibadah murni sesuai Al-Qur'an dan Sunnah.

---

### 2. Misi Perusahaan
1. **Khidmah Sepenuh Hati:** Memberikan pelayanan prima (*Service Excellence*) kepada setiap jamaah dengan mengedepankan keamanan, kepastian, dan kenyamanan.
2. **Kepastian 5 Pasti Umroh:** Menjamin kepastian legalitas travel, jadwal keberangkatan, tiket penerbangan, hotel ring satu, dan visa resmi Saudi.
3. **Bimbingan Ibadah Berkualitas:** Menyediakan asatidz pembimbing dan muthawwif berpengalaman yang membimbing manasik dan ibadah secara mendalam dan sabar.
4. **Transparansi & Akuntabilitas:** Menyelenggarakan tata kelola manajemen dan keuangan yang amanah, bebas dari pungutan tersembunyi, dan sesuai regulasi Kementerian Agama RI.
5. **Kesejahteraan Umat & Karyawan:** Menjadi wasilah keberkahan ekonomi bagi seluruh karyawan, mitra cabang, agen, dan masyarakat sekitar.

---

### 3. Falsafah 7 Nilai Budaya Kerja (B-A-R-O-K-A-H)
- **B (Bersih Niat):** Setiap pekerjaan diniatkan sebagai ibadah dan pengabdian melayani tamu Allah.
- **A (Amanah & Jujur):** Menjaga kepercayaan jamaah dan perusahaan tanpa kompromi.
- **R (Responsif & Cepat):** Tanggap menyelesaikan kendala jamaah dalam hitungan menit.
- **O (Orientasi Kualitas):** Memastikan standar fasilitas, hotel, dan maskapai terbaik.
- **K (Kekeluargaan):** Menjalin hubungan hangat, santun, dan peduli kepada jamaah dan rekan kerja.
- **A (Adaptif Teknologi):** Memanfaatkan sistem digital ERP terintegrasi untuk efisiensi total.
- **H (Hati yang Ikhlas):** Melayani dengan senyuman, kehangatan, dan kesabaran tanpa pamrih.`,
  },
  {
    code: "REG-CORP-002",
    category: "LEGALITAS_PERUSAHAAN",
    title: "Peraturan Perusahaan (Company Regulations) & Hak Kewajiban Karyawan",
    purpose: "Mengatur tata tertib kerja, etika profesionalisme, hak, kewajiban, serta sanksi disipliner bagi seluruh pegawai dalam rangka menjaga mutu penyelenggaraan PPIU.",
    scope: "Seluruh karyawan tetap, kontrak, magang, dan tenaga lepas di kantor pusat maupun kantor cabang.",
    responsibleRole: "Direktur Operasional & HRD",
    version: "2.0",
    tags: "peraturan perusahaan, tata tertib, hak karyawan, kewajiban, disiplin",
    isMandatory: true,
    orderIndex: 2,
    contentMarkdown: `### BAB I: KETENTUAN UMUM
1. **Perusahaan** adalah badan hukum resmi Penyelenggara Perjalanan Ibadah Umroh (PPIU) yang berizin Kementerian Agama RI.
2. **Karyawan** adalah tenaga kerja yang memiliki hubungan kerja dengan perusahaan dan menerima upah/imbalan sesuai kesepakatan.

---

### BAB II: HAK DAN KEWAJIBAN KARYAWAN
#### Pasal 1: Kewajiban Pokok Karyawan
- Menjaga nama baik, kerahasiaan data jamaah, dan aset perusahaan.
- Hadir tepat waktu sesuai jam kerja operasional (08.30 - 17.00 WIB) dan melayani jamaah dengan ramah (*Senyum, Salam, Sapa, Santun*).
- Menjalankan setiap transaksi keuangan hanya melalui rekening bank resmi perusahaan (Dilarang menerima setoran uang tunai/transfer ke rekening pribadi).

#### Pasal 2: Hak Karyawan
- Menerima gaji pokok, tunjangan, dan insentif sesuai kinerja dan perjanjian kerja.
- Mendapatkan hak cuti tahunan, cuti hari besar, serta jaminan perlindungan kerja.
- Berkesempatan mendapatkan program umroh dinas / pendampingan jamaah sesuai evaluasi prestasi.

---

### BAB III: LARANGAN DAN SANKSI DISIPLIN
1. **Pelanggaran Ringan (Surat Peringatan I):** Terlambat hadir tanpa izin, lalai mengupdate data jamaah pada sistem.
2. **Pelanggaran Sedang (Surat Peringatan II):** Memberikan informasi palsu kepada calon jamaah, bertindak tidak sopan kepada jamaah.
3. **Pelanggaran Berat (Surat Peringatan III / Pemutusan Hubungan Kerja Seketika):**
   - Mengalihkan pembayaran dana jamaah ke rekening pribadi atau pihak lain (Fraud/Penggelapan).
   - Memalsukan dokumen paspor, identitas, atau kuitansi pembayaran.
   - Merusak reputasi dan legalitas izin PPIU perusahaan di hadapan instansi pemerintah.`,
  },
  {
    code: "REG-CORP-003",
    category: "SDM_KODE_ETIK",
    title: "Kode Etik & Pakta Integritas Tour Leader (TL) dan Muthawwif",
    purpose: "Menetapkan standar perilaku, moralitas, kepemimpinan, dan tanggung jawab pendampingan ibadah bagi Tour Leader dan Muthawwif di Tanah Air dan Arab Saudi.",
    scope: "Seluruh Tour Leader bersertifikasi BNSP dan Muthawwif mukim di Makkah/Madinah yang ditugaskan mendampingi grup keberangkatan.",
    responsibleRole: "Kepala Divisi Bimbingan Ibadah & Tour Leader",
    version: "1.5",
    tags: "tour leader, muthawwif, kode etik, integritas, bimbingan",
    isMandatory: true,
    orderIndex: 3,
    contentMarkdown: `### PAKTA INTEGRITAS PEMBIMBING IBADAH
Setiap Tour Leader dan Muthawwif yang bertugas menandatangani dan wajib menjalankan:

1. **Khidmah Ikhlas:** Menempatkan keselamatan, kenyamanan, dan bimbingan ibadah jamaah di atas kepentingan pribadi.
2. **Standar Ibadah Sesuai Sunnah:** Membimbing rukun dan wajib umroh (Thawaf, Sa'i, Tahallul) dengan sabar, tidak tergesa-gesa, dan melarang praktik bid'ah atau mistik.
3. **Kesiapsiagaan 24 Jam:** Wajib mengaktifkan nomor telepon dan WhatsApp lokal Saudi selama keberlangsungan program umroh untuk respon darurat.
4. **Larangan Praktik Komersil Liar:**
   - Dilarang keras memungut biaya tambahan di luar program resmi tanpa izin manajemen.
   - Dilarang mengarahkan jamaah ke toko/belanja komersil yang merugikan waktu ibadah jamaah.
5. **Perhatian Khusus Lansia & Risti (Risiko Tinggi):** Memberikan prioritas pendampingan bagi jamaah lansia, pengguna kursi roda, dan jamaah yang sakit.`,
  },

  // 2. SOP OPERASIONAL UMROH LENGKAP
  {
    code: "SOP-OPS-001",
    category: "OPERASIONAL_UMROH",
    title: "SOP Pemasaran, Konsultasi, & Standar Pelayanan Informasi Calon Jamaah",
    purpose: "Menjamin calon jamaah mendapatkan informasi paket, jadwal keberangkatan, legalitas travel, dan transparansi rincian biaya secara akurat dan profesional.",
    scope: "Divisi Marketing, Customer Service, Admin Front Office, dan Seluruh Mitra Agen.",
    responsibleRole: "Admin Marketing & CRM",
    version: "1.0",
    tags: "marketing, leads, konsultasi, brosur, crm",
    isMandatory: true,
    orderIndex: 4,
    contentMarkdown: `### 1. Prosedur Respon Awal Prospek
- Admin wajib merespons setiap pesan WhatsApp/inquiry masuk maksimal **5 menit** pada jam kerja.
- Sampaikan salam islami yang ramah dan perkenalkan legalitas resmi PPIU (*Izin Kemenkumham & NIB Kemenag*).

### 2. Penyampaian Detail Paket
- Kirimkan flyer/brosur digital resmi yang memuat tanggal keberangkatan, maskapai penerbangan, hotel Makkah & Madinah, serta rincian tipe kamar (Quad, Triple, Double).
- Jelaskan prinsip *All-In* paket (Tiket PP, Visa, Hotel, Makan Fullboard, Muthawwif, Bus AC, Perlengkapan, Asuransi).
- Jelaskan fasilitas yang belum termasuk (Paspor, Vaksin Meningitis, Keperluan Pribadi, Kursi Roda Khusus).

### 3. Pencatatan di Sistem CRM
- Input nama prospek, nomor HP/WA, domisili, dan minat paket ke dalam modul CRM Aplikasi ERP.`,
  },
  {
    code: "SOP-OPS-002",
    category: "OPERASIONAL_UMROH",
    title: "SOP Pendaftaran, Verifikasi 26 Field SISKOPATUH & Dokumen Jamaah",
    purpose: "Memastikan data calon jamaah terverifikasi 100% lengkap dan sesuai format baku SISKOPATUH Kementerian Agama RI serta persyaratan imigrasi.",
    scope: "Divisi Operasional & Administrasi Pendaftaran.",
    responsibleRole: "Admin Operasional",
    version: "2.0",
    tags: "pendaftaran, siskopatuh, verifikasi, ktp, kk, berkas",
    isMandatory: true,
    orderIndex: 5,
    contentMarkdown: `### 1. Pengisian Data Mandiri & Input Petugas
Petugas memverifikasi 26 parameter standar Kemenag RI:
- **Identitas Pribadi:** Title, Nama Sesuai Kartu Vaksin & Paspor, Nama Ayah Kandung, NIK, Tempat/Tgl Lahir, Jenis Kelamin.
- **Alamat 4 Tingkat:** Alamat Lengkap, Kelurahan, Kecamatan, Kabupaten/Kota, Provinsi.
- **Paspor RI:** Nama Paspor, Nomor Paspor, Tanggal Terbit, Kota Penerbit, Tanggal Expired (Masa berlaku min. 8 bulan).
- **Demografi & Kontak:** No HP/WA, Status Pernikahan, Pendidikan, Pekerjaan, Kewarganegaraan.

### 2. Validasi 5 Dokumen Digital
- KTP Elektronik asli (foto jelas).
- Kartu Keluarga (KK).
- Buku Nikah (bagi suami istri) / Akta Lahir (bagi anak).
- Sertifikat Vaksin Meningitis (ICV).
- Berkas diunggah otomatis ke Google Drive Travel terenkripsi.`,
  },
  {
    code: "SOP-OPS-003",
    category: "KEUANGAN_REFUND",
    title: "SOP Penagihan Uang Muka (DP), Cicilan & Pelunasan H-30",
    purpose: "Menjamin ketertiban arus kas, pencatatan kuitansi legal, dan kepastian penyetoran dana ke maskapai serta hotel tepat waktu.",
    scope: "Divisi Keuangan, Akuntansi, dan Kasir Travel.",
    responsibleRole: "Admin Finance",
    version: "1.2",
    tags: "keuangan, dp, pelunasan, invoice, kuitansi, bsi",
    isMandatory: true,
    orderIndex: 6,
    contentMarkdown: `### 1. Pembayaran Uang Muka (DP Booking Seat)
- Calon jamaah menyetorkan DP minimal Rp 5.000.000,- (atau program tabungan DP Rp 2.000.000,-).
- Penyetoran wajib ke Rekening Resmi Perusahaan (BSI / BCA / Mandiri).
- Terbitkan Invoice DP dan Kuitansi Resmi bertanda tangan digital dalam tempo maksimal 1x24 jam.

### 2. Monitoring & Penagihan Pelunasan H-30
- Sistem mengirimkan notifikasi pengingat otomatis via WhatsApp pada H-45 dan H-35 sebelum keberangkatan.
- Pelunasan penuh wajib diselesaikan paling lambat **H-30 keberangkatan** untuk keperluan penerbitan tiket penerbangan dan E-Visa MoFA.
- Petugas mengupdate status pembayaran menjadi 'PAID (Lunas)' pada modul Invoicing.`,
  },
  {
    code: "SOP-OPS-004",
    category: "OPERASIONAL_UMROH",
    title: "SOP Pengurusan Paspor & Surat Rekomendasi Endorsement Nama 3 Kata",
    purpose: "Membantu calon jamaah yang belum memiliki paspor atau memiliki nama 1 kata untuk mendapatkan pengesahan paspor di Kantor Imigrasi.",
    scope: "Divisi Dokumen & Hubungan Antar Lembaga.",
    responsibleRole: "Admin Dokumen & Legalitas",
    version: "1.0",
    tags: "paspor, imigrasi, rekomendasi, endos nama, 3 kata",
    isMandatory: true,
    orderIndex: 7,
    contentMarkdown: `### 1. Penerbitan Surat Rekomendasi PPIU
- Generator Surat di sistem ERP menerbitkan Surat Rekomendasi Pembuatan / Perpanjangan Paspor resmi ber-KOP PPIU, dibubuhi TTD Direktur Utama dan stempel.
- Lampirkan salinan SK Kemenkumham dan NIB izin operasional PPIU.

### 2. Endorsement Penambahan Nama Ayah Kandung
- Bagi paspor dengan nama 1 atau 2 suku kata, sistem mencantumkan nama ayah kandung pada surat permohonan endorsement nama agar disahkan imigrasi menjadi 3 kata sesuai aturan Kerajaan Arab Saudi.`,
  },
  {
    code: "SOP-OPS-005",
    category: "OPERASIONAL_UMROH",
    title: "SOP Penerbitan E-Visa Umroh Saudi & Sinkronisasi SISKOPATUH",
    purpose: "Memastikan seluruh manifes jamaah terdaftar resmi di Kementerian Agama dan E-Visa MoFA terbit tanpa kendala sebelum keberangkatan.",
    scope: "Divisi Ticketing & Visa Handling.",
    responsibleRole: "Admin Ticketing & Provider Visa",
    version: "1.5",
    tags: "visa, mofa, siskopatuh, kemenag, muassasah",
    isMandatory: true,
    orderIndex: 8,
    contentMarkdown: `### 1. Sinkronisasi Data SISKOPATUH
- Ekspor data jamaah dari modul SISKOPATUH ERP ke format CSV standar Kemenag RI.
- Upload data ke portal SISKOPATUH untuk verifikasi QR Code resmi Kemenag.

### 2. Pengajuan E-Visa Saudi
- Pastikan tiket pesawat PP dan konfirmasi reservasi hotel (*BRN Hotel*) telah valid.
- Ajukan e-Visa melalui provider visa resmi / Muassasah Saudi.
- Unduh e-Visa yang telah disetujui, cetak 2 rangkap, dan sematkan pada modul Database Jamaah.`,
  },
  {
    code: "SOP-OPS-006",
    category: "OPERASIONAL_UMROH",
    title: "SOP Bimbingan Manasik Umroh (Teori & Praktik Peragaan Thawaf/Sa'i)",
    purpose: "Membekali jamaah dengan pemahaman fiqih umroh, tata cara ibadah yang benar, doa-doa ma'tsur, serta kesiapan fisik dan mental.",
    scope: "Divisi Bimbingan Ibadah & Asatidz Pembimbing.",
    responsibleRole: "Kepala Pembimbing Ibadah (Asatidz)",
    version: "1.0",
    tags: "manasik, bimbingan, thawaf, sai, fiqih, doa",
    isMandatory: true,
    orderIndex: 9,
    contentMarkdown: `### 1. Pelaksanaan Manasik Teori
- Diselenggarakan pada H-14 atau H-7 sebelum keberangkatan di aula hotel / gedung pertemuan yang representatif.
- Materi mencakup: Niat & Miqat, Larangan Ihram, Rukun Umroh, Wajib Umroh, Hikmah Perjalanan Spiritual, serta Tips Kesehatan di Tanah Suci.

### 2. Pelaksanaan Praktik Peragaan
- Jamaah pria mengenakan pakaian ihram dan jamaah wanita mengenakan busana muslimah rapi.
- Peragaan langsung Thawaf mengelilingi miniatur Ka'bah 7 putaran dan Sa'i dari Safa ke Marwah.
- Pembagian Buku Panduan Doa dan sosialisasi audio manasik di Portal Digital Jamaah.`,
  },
  {
    code: "SOP-OPS-007",
    category: "OPERASIONAL_UMROH",
    title: "SOP Pengadaan & Serah Terima Logistik Perlengkapan Jamaah",
    purpose: "Menjamin ketersediaan, kualitas fisik, dan kelancaran serah terima seluruh atribut perlengkapan umroh kepada setiap jamaah.",
    scope: "Divisi Logistik, Gudang, dan Staf Serah Terima.",
    responsibleRole: "Staf Logistik & Gudang",
    version: "1.0",
    tags: "logistik, koper, ihram, mukena, batik, serah terima",
    isMandatory: true,
    orderIndex: 10,
    contentMarkdown: `### 1. Paket Perlengkapan Wajib
Setiap jamaah berhak mendapatkan:
- 1 Unit Koper Bagasi Besar (Ukuran 24/28 Inch Standar Maskapai)
- 1 Unit Koper Kabin / Tas Troley Kecil
- 1 Unit Tas Selempang Paspor / Tas Dokumen
- Kain Ihram 2 Lembar + Sabuk (Jamaah Pria) / Mukena & Bergo (Jamaah Wanita)
- Kain Batik Seragam Resmi Travel
- Buku Doa Saku, Buku Panduan, & Gelang Identitas / ID Card QR

### 2. Serah Terima & Tanda Tangan Digital
- Penyerahan dilakukan saat Manasik atau dikirim via ekspedisi khusus.
- Jamaah menandatangani Berita Acara Serah Terima digital pada modul Ceklis Serah Terima ERP.`,
  },
  {
    code: "SOP-OPS-008",
    category: "OPERASIONAL_UMROH",
    title: "SOP Ground Handling & Pelepasan Jamaah di Bandara Indonesia",
    purpose: "Mengatur alur penerimaan jamaah di bandara, penanganan bagasi, pembagian paspor/boarding pass, dan proses pelepasan resmi.",
    scope: "Tim Ground Handling Bandara, Tour Leader, dan Manajemen.",
    responsibleRole: "Koordinator Ground Handling Bandara",
    version: "1.5",
    tags: "bandara, airport handling, bagasi, boarding pass, imigrasi",
    isMandatory: true,
    orderIndex: 11,
    contentMarkdown: `### 1. Titik Kumpul (H-4 Jam Sebelum Terbang)
- Jamaah berkumpul di Meeting Point / Lounge Bandara yang telah ditentukan 4 jam sebelum jadwal *take-off*.
- Tim handling mengumpulkan seluruh koper bagasi, menimbang, memasang *luggage tag*, dan melakukan proses *group check-in*.

### 2. Pembagian Dokumen & Pengarahan
- Tour Leader membagikan paspor asli, e-Visa, boarding pass, dan ID Card kalung kepada setiap jamaah.
- Doa pelepasan bersama dipimpin oleh Pembimbing Ibadah.
- Pendampingan jamaah melewati pemeriksaan Imigrasi dan menuju ruang tunggu keberangkatan (*boarding gate*).`,
  },
  {
    code: "SOP-OPS-009",
    category: "OPERASIONAL_UMROH",
    title: "SOP Airport Handling Kedatangan di Bandara Jeddah / Madinah",
    purpose: "Menjamin kelancaran penyambutan rombongan di bandara kedatangan Saudi, proses imigrasi cepat, dan transfer bus ke hotel.",
    scope: "Muthawwif Mukim, Tim Handling Saudi, dan Tour Leader.",
    responsibleRole: "Koordinator Handling Saudi & Muthawwif",
    version: "1.0",
    tags: "kedatangan, jeddah, madinah, bus saudi, imigrasi saudi",
    isMandatory: true,
    orderIndex: 12,
    contentMarkdown: `### 1. Penyambutan & Pemeriksaan Paspor
- Muthawwif dan perwakilan Muassasah menyambut rombongan di pintu keluar terminal kedatangan Bandara Jeddah/Madinah.
- Membantu jamaah lansia yang membutuhkan asistensi kursi roda di area imigrasi Saudi.

### 2. Penataan Bagasi & Transportasi Bus
- Tim porter memindahkan seluruh koper rombongan langsung ke bagasi Bus AC Eksekutif.
- Memastikan seluruh jamaah menaiki bus sesuai nomor grup yang telah ditetapkan.
- Pembagian snack/makanan selamat datang dan air zamzam di dalam bus.`,
  },
  {
    code: "SOP-OPS-010",
    category: "OPERASIONAL_UMROH",
    title: "SOP Check-In Hotel Makkah/Madinah & Distribusi Kunci Kamar",
    purpose: "Mengatur proses check-in hotel ring satu secara tertib, nyaman, dan memastikan koper tiba di depan kamar masing-masing.",
    scope: "Tour Leader, Muthawwif, dan Porter Hotel.",
    responsibleRole: "Tour Leader & Muthawwif Lapangan",
    version: "1.2",
    tags: "hotel, check-in, makkah, madinah, rooming list",
    isMandatory: true,
    orderIndex: 13,
    contentMarkdown: `### 1. Kedatangan di Hotel
- Jamaah dipersilakan duduk beristirahat di lobi hotel sambil menikmati minuman selamat datang.
- Tour Leader berkoordinasi dengan resepsionis hotel untuk pengambilan seluruh kartu kunci (*keycard*) kamar sesuai *Rooming List*.

### 2. Pembagian Kunci & Pengantaran Bagasi
- Kunci dibagikan per nama kamar (Quad, Triple, Double) secara tertib.
- Porter hotel mendistribusikan koper ke masing-masing kamar jamaah dalam waktu maksimal **60 menit** setelah check-in.
- Jamaah diberikan waktu istirahat dan makan sebelum pelaksanaan ibadah.`,
  },
  {
    code: "SOP-OPS-011",
    category: "OPERASIONAL_UMROH",
    title: "SOP Pelaksanaan Ibadah Umroh (Miqat, Thawaf, Sa'i, Tahallul)",
    purpose: "Menuntun seluruh jamaah melaksanakan rukun dan wajib umroh secara sempurna, khusyuk, aman, dan selamat.",
    scope: "Muthawwif, Pembimbing Ibadah, dan Tour Leader.",
    responsibleRole: "Muthawwif & Pembimbing Ibadah",
    version: "2.0",
    tags: "umroh, miqat, thawaf, sai, tahallul, muthawwif",
    isMandatory: true,
    orderIndex: 14,
    contentMarkdown: `### 1. Mengambil Miqat & Niat Ihram
- Jamaah mandi sunnah ihram dan mengenakan pakaian ihram dari hotel/miqat (Dzulhulaifah / Yalamlam / Tan'im).
- Shalat sunnah ihram 2 rakaat dan melafalkan niat umroh dipandu Muthawwif.
- Membaca talbiyah bersama sepanjang perjalanan menuju Masjidil Haram.

### 2. Pelaksanaan Thawaf 7 Putaran
- Memasuki Masjidil Haram dengan mendahulukan kaki kanan dan membaca doa masuk masjid.
- Muthawwif memandu rombongan dengan alat audio receiver (wireless transmitter) agar suara doa terdengar jernih oleh seluruh jamaah tanpa berteriak.
- Menjaga keutuhan barisan dan mengawal jamaah wanita serta lansia.

### 3. Sa'i & Tahallul
- Melaksanakan Sa'i 7 putaran antara bukit Shafa dan Marwah.
- Mengakhiri rangkaian umroh dengan mencukur/memotong rambut (Tahallul) dan membaca doa syukur bersama.`,
  },
  {
    code: "SOP-OPS-012",
    category: "OPERASIONAL_UMROH",
    title: "SOP Bimbingan Ziarah Kota Suci Madinah (Raudhah) & Makkah",
    purpose: "Memberikan edukasi napak tilas sejarah perjuangan Nabi Muhammad SAW dan bimbingan masuk ke Raudhah Al-Jannah.",
    scope: "Muthawwif dan Seluruh Jamaah.",
    responsibleRole: "Muthawwif & Tour Leader",
    version: "1.0",
    tags: "ziarah, madinah, raudhah, nusuk, makkah, napak tilas",
    isMandatory: true,
    orderIndex: 15,
    contentMarkdown: `### 1. Ziarah Raudhah via Aplikasi Nusuk
- Tim IT & Muthawwif mendaftarkan seluruh jamaah untuk mendapatkan *Tasreh (Izin Masuk Resmi)* Raudhah via aplikasi Nusuk Saudi.
- Mengatur jadwal masuk terpisah antara rombongan pria dan rombongan wanita didampingi Muthawwifah.

### 2. Ziarah Luar Kota Madinah & Makkah
- Madinah: Masjid Quba, Kebun Kurma, Bukit Uhud & Makam Syuhada Uhud, Masjid Qiblatain.
- Makkah: Jabal Tsur, Padang Arafah, Jabal Rahmah, Muzdalifah, Mina, dan Jabal Nur (Gua Hira).
- Muthawwif menyampaikan sirah nabawiyah dengan bahasa yang menyentuh dan mudah dipahami.`,
  },
  {
    code: "SOP-OPS-013",
    category: "OPERASIONAL_UMROH",
    title: "SOP Check-Out Hotel, Penimbangan Bagasi, Distribusi Zamzam & Kepulangan",
    purpose: "Menjamin proses kepulangan terkoordinasi rapi, bagasi tidak melebihi kuota maskapai, dan air zamzam terdistribusi lengkap.",
    scope: "Tour Leader, Tim Handling Saudi, dan Maskapai.",
    responsibleRole: "Tour Leader & Handling Saudi",
    version: "1.0",
    tags: "kepulangan, check-out, timbang bagasi, air zamzam, bandara jeddah",
    isMandatory: true,
    orderIndex: 16,
    contentMarkdown: `### 1. Penimbangan Bagasi di Hotel (H-1 Kepulangan)
- Tim handling melakukan *weighing test* koper di lobi hotel untuk memastikan tidak ada koper yang over-capacity (max. 30 kg / 23 kg per koper).
- Pemasangan pita identitas dan kunci gembok koper.

### 2. Check-Out & Keberangkatan ke Bandara
- Seluruh jamaah berkumpul di lobi 5 jam sebelum jadwal penerbangan.
- Muthawwif memandu doa safar (perjalanan pulang).
- Penyerahan Air Zamzam resmi (5 Liter per jamaah) sesuai regulasi maskapai di bandara kedatangan Indonesia.`,
  },

  // 3. SOP MITIGASI RISIKO & PENANGANAN DARURAT
  {
    code: "SOP-EMG-001",
    category: "MITIGASI_DARURAT",
    title: "SOP Penanganan Jamaah Sakit di Saudi, Rawat Inap & Asuransi Visa",
    purpose: "Memberikan pertolongan medis cepat, koordinasi rumah sakit Kerajaan Arab Saudi, dan pengurusan klaim asuransi kesehatan visa umroh.",
    scope: "Tim Medis Rombongan, Tour Leader, Muthawwif, dan Perwakilan Travel di Saudi.",
    responsibleRole: "Dokter Rombongan & Tour Leader",
    version: "1.5",
    tags: "darurat, sakit, rumah sakit saudi, asuransi, medis",
    isMandatory: true,
    orderIndex: 17,
    contentMarkdown: `### 1. Pertolongan Pertama
- Jika jamaah mengalami gejala medis di hotel atau masjid, segera hubungi Dokter Rombongan / Tour Leader.
- Bawa obat-obatan pertolongan pertama dan periksa tanda-tanda vital (tensi darah, saturasi oksigen, gula darah).

### 2. Rujukan ke Rumah Sakit Saudi (Gratis dengan Asuransi Umroh)
- Jika memerlukan penanganan lebih lanjut, bawa jamaah ke RS Pemerintah Saudi terdekat:
  - Makkah: RS King Abdulaziz (Zaher) / RS Ajyad Emergency / RS Al-Noor Specialist Hospital.
  - Madinah: RS King Fahd Madinah / RS Al-Ansar.
- Tunjukkan E-Visa Umroh dan Paspor untuk aktivasi perlindungan asuransi kesehatan Saudi (MOH/Cooperative Health Insurance Council).
- Tour Leader / Muthawwif wajib mendampingi jamaah selama proses pemeriksaan dan mengabari keluarga di Tanah Air.`,
  },
  {
    code: "SOP-EMG-002",
    category: "MITIGASI_DARURAT",
    title: "SOP Penanganan Jamaah Wafat di Tanah Suci & Pemakaman Makkah/Madinah",
    purpose: "Menjamin penanganan jenazah jamaah secara syar'i, tertib administrasi konsuler KJRI/KBRI, dan pemakaman mulia di Tanah Suci.",
    scope: "Direksi, Tour Leader, Muthawwif, KJRI Jeddah, dan Keluarga Jamaah.",
    responsibleRole: "Direktur Utama & Koordinator Saudi",
    version: "2.0",
    tags: "wafat, meninggal, jenazah, makam baqi, makam ma'la, kjri",
    isMandatory: true,
    orderIndex: 18,
    contentMarkdown: `### 1. Tindakan Medis & Surat Kematian
- Dapatkan Surat Keterangan Medis Kematian (*Shahadah Wafat*) dari Rumah Sakit Pemerintah Saudi dan Kepolisian setempat.
- Hubungi Kantor Urusan Haji & Umroh (KUH) KJRI Jeddah untuk pengurusan Surat Keterangan Kematian (COD).

### 2. Persetujuan Keluarga di Indonesia
- Manajemen di Indonesia bersilaturahmi langsung ke keluarga duka untuk menyampaikan bela sungkawa dan meminta Surat Persetujuan Pemakaman di Tanah Suci (*Tanazul*).

### 3. Pemulasaraan, Shalat Jenazah & Pemakaman
- Jenazah dimandikan dan dikafani oleh tim resmi Muassasah Saudi.
- Jenazah dishalatkan di Masjidil Haram (Makkah) atau Masjid Nabawi (Madinah) setelah shalat fardhu bersama jutaan jamaah.
- Pemakaman dilakukan di kompleks pemakaman mulia: Pemakaman Ma'la / Syara'i (Makkah) atau Pemakaman Baqi (Madinah).
- Seluruh dokumen pemakaman dan barang peninggalan diserahkan resmi kepada ahli waris di Indonesia.`,
  },
  {
    code: "SOP-EMG-003",
    category: "MITIGASI_DARURAT",
    title: "SOP Penanganan Jamaah Terpisah / Hilang di Masjidil Haram atau Nabawi",
    purpose: "Menemukan kembali jamaah yang terpisah dari rombongan secara cepat menggunakan gelang identitas dan titik kumpul darurat.",
    scope: "Tour Leader, Muthawwif, Petugas Asykar, dan Seluruh Jamaah.",
    responsibleRole: "Tour Leader & Muthawwif",
    version: "1.0",
    tags: "hilang, terpisah, masjidil haram, gelang qr, titik kumpul",
    isMandatory: true,
    orderIndex: 19,
    contentMarkdown: `### 1. Tindakan Bagi Jamaah yang Terpisah
- Tetap tenang dan jangan panik keluar dari area masjid secara acak.
- Datangi pos keamanan / Asykar terdekat dan perlihatkan **Gelang ID Card QR** yang memuat nomor telepon Tour Leader dan nama hotel.
- Menuju Titik Kumpul Tetap (*Emergency Meeting Point*) yang telah disepakati saat briefing.

### 2. Tindakan Tim Tour Leader & Muthawwif
- Lakukan pengecekan posisi via grup WhatsApp dan koordinasi dengan pos keamanan Masjidil Haram / Nabawi.
- Jika dalam 2 jam belum ditemukan, laporkan ke Kantor Sektor Perlindungan Jamaah (Linjam) KJRI Jeddah.`,
  },
  {
    code: "SOP-EMG-004",
    category: "MITIGASI_DARURAT",
    title: "SOP Penanganan Paspor Hilang di Arab Saudi & Pengurusan SPLP KJRI",
    purpose: "Menerbitkan Surat Perjalanan Laksana Paspor (SPLP) agar jamaah yang kehilangan paspor tetap dapat pulang ke Indonesia tepat waktu.",
    scope: "Tour Leader, Muassasah Saudi, Imigrasi Saudi, dan KJRI Jeddah.",
    responsibleRole: "Tour Leader & Admin Legalitas",
    version: "1.0",
    tags: "paspor hilang, splp, kjri jeddah, lapor polisi saudi",
    isMandatory: true,
    orderIndex: 20,
    contentMarkdown: `### 1. Laporan Kepolisian Saudi
- Tour Leader mendampingi jamaah ke Kantor Polisi setempat (*Syurthoh*) untuk membuat Surat Tanda Lapor Kehilangan Paspor.

### 2. Pengurusan SPLP di KJRI Jeddah
- Bawa berkas ke Kantor KJRI Jeddah: Fotokopi KTP, KK, Akta Lahir, e-Visa Umroh, Surat Kehilangan Polisi, dan Pasfoto 4x6 latar putih.
- KJRI menerbitkan dokumen SPLP resmi sebagai pengganti paspor untuk kepulangan jamaah ke Indonesia.`,
  },
  {
    code: "SOP-FIN-001",
    category: "KEUANGAN_REFUND",
    title: "SOP Kebijakan Pembatalan (Cancellation), Reschedule, & Pengembalian Dana (Refund)",
    purpose: "Memberikan transparansi, kepastian hukum, dan keadilan bagi jamaah maupun perusahaan terkait pembatalan keberangkatan karena udzur syar'i.",
    scope: "Divisi Keuangan, Manajemen Operasional, dan Jamaah.",
    responsibleRole: "Direktur Keuangan & Admin Operasional",
    version: "2.0",
    tags: "refund, pembatalan, batal, reschedule, pengembalian dana, potongan",
    isMandatory: true,
    orderIndex: 21,
    contentMarkdown: `### 1. Ketentuan Umum Pembatalan
- Permohonan pembatalan wajib diajukan secara tertulis oleh jamaah / ahli waris disertai bukti alasan yang sah (surat dokter / surat dinas).

### 2. Skema Pemotongan Biaya Riil (*Refund Policy*)
- **Pembatalan > 45 Hari Sebelum Keberangkatan:** Dipotong biaya administrasi pendaftaran Rp 1.500.000,-.
- **Pembatalan 30 - 44 Hari Sebelum Keberangkatan:** Dipotong deposit tiket pesawat maskapai yang tidak dapat di-refund + biaya admin.
- **Pembatalan 15 - 29 Hari Sebelum Keberangkatan:** Dipotong 50% dari total harga paket (karena tiket dan kamar hotel telah diterbitkan atas nama jamaah).
- **Pembatalan < 14 Hari Sebelum Keberangkatan:** Dipotong 80% - 100% dari total harga paket sesuai dengan biaya riil yang tidak dapat ditarik kembali dari hotel Saudi dan maskapai.

### 3. Opsi Reschedule (Pindah Jadwal Bebas Hangus)
- Jamaah diberikan opsi mengalihkan keberangkatan ke bulan berikutnya atau dialihkan ke anggota keluarga pengganti dengan hanya membayar selisih biaya penyesuaian tiket (*name change fee*).
- Dana refund yang telah disetujui akan ditransfer ke rekening bank jamaah dalam waktu maksimal **14 hari kerja**.`,
  },
];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { customPrompt, generateAllOfficialCatalog } = body;

    // Mode 1: Generate All Official Standard PPIU Catalog
    if (generateAllOfficialCatalog) {
      let createdCount = 0;
      let updatedCount = 0;

      for (const item of officialSopCatalog) {
        const existing = await prisma.sopDocument.findUnique({
          where: { code: item.code },
        });

        if (!existing) {
          await prisma.sopDocument.create({
            data: {
              code: item.code,
              category: item.category,
              title: item.title,
              purpose: item.purpose,
              scope: item.scope,
              responsibleRole: item.responsibleRole,
              version: item.version,
              tags: item.tags,
              isMandatory: item.isMandatory,
              orderIndex: item.orderIndex,
              contentMarkdown: item.contentMarkdown,
            },
          });
          createdCount++;
        } else {
          await prisma.sopDocument.update({
            where: { id: existing.id },
            data: {
              category: item.category,
              title: item.title,
              purpose: item.purpose,
              scope: item.scope,
              responsibleRole: item.responsibleRole,
              version: item.version,
              tags: item.tags,
              isMandatory: item.isMandatory,
              orderIndex: item.orderIndex,
              contentMarkdown: item.contentMarkdown,
            },
          });
          updatedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Katalog SOP Resmi PPIU berhasil disinkronisasi: ${createdCount} dibuat baru, ${updatedCount} diperbarui.`,
        createdCount,
        updatedCount,
      });
    }

    // Mode 2: Custom AI Prompt Generator
    if (customPrompt && customPrompt.trim().length > 0) {
      const pLower = customPrompt.toLowerCase();

      // Smart heuristic categorization
      let generatedCategory = "OPERASIONAL_UMROH";
      let codePrefix = "SOP-OPS";
      if (pLower.includes("peraturan") || pLower.includes("hukum") || pLower.includes("legalitas") || pLower.includes("akta") || pLower.includes("visi")) {
        generatedCategory = "LEGALITAS_PERUSAHAAN";
        codePrefix = "REG-CORP";
      } else if (pLower.includes("darurat") || pLower.includes("sakit") || pLower.includes("hilang") || pLower.includes("wafat") || pLower.includes("mitigasi")) {
        generatedCategory = "MITIGASI_DARURAT";
        codePrefix = "SOP-EMG";
      } else if (pLower.includes("refund") || pLower.includes("uang") || pLower.includes("bayar") || pLower.includes("kas") || pLower.includes("harga")) {
        generatedCategory = "KEUANGAN_REFUND";
        codePrefix = "SOP-FIN";
      } else if (pLower.includes("etik") || pLower.includes("karyawan") || pLower.includes("tl") || pLower.includes("muthawwif") || pLower.includes("komisi")) {
        generatedCategory = "SDM_KODE_ETIK";
        codePrefix = "SOP-HR";
      }

      const count = await prisma.sopDocument.count();
      const generatedCode = `${codePrefix}-${String(count + 1).padStart(3, "0")}`;
      const generatedTitle = customPrompt.length > 70 ? `${customPrompt.slice(0, 67)}...` : customPrompt;

      const generatedMarkdown = `### 1. TUJUAN & RUANG LINGKUP
- **Tujuan:** Menstandarisasi tata cara dan pedoman teknis pelaksanaan terkait "${customPrompt}" agar berjalan tertib, amanah, akuntabel, dan sesuai standar Kementerian Agama RI.
- **Ruang Lingkup:** Berlaku untuk seluruh unit kerja, staf operasional, perwakilan lapangan, serta pihak terkait di lingkungan PT Barokah Sulthan Haramain.

---

### 2. DASAR HUKUM & ACUAN REGULASI
1. Undang-Undang No. 8 Tahun 2019 tentang Penyelenggaraan Ibadah Haji dan Umroh.
2. Peraturan Menteri Agama (PMA) RI tentang Standar Operasional Penyelenggara Perjalanan Ibadah Umroh (PPIU).
3. Regulasi Kementerian Haji & Umrah Kerajaan Arab Saudi.
4. Peraturan dan Kebijakan Manajemen PT Barokah Sulthan Haramain.

---

### 3. PIHAK YANG BERTANGGUNG JAWAB
- **Penanggung Jawab Utama:** Direktur Utama / Manajer Operasional.
- **Pelaksana Teknis:** Seluruh staf divisi terkait yang ditunjuk dalam surat tugas.

---

### 4. TAHAPAN & PROSEDUR STANDAR (STEP-BY-STEP)
1. **Tahap 1 - Identifikasi & Verifikasi:**
   - Melakukan pengecekan data awal, kelengkapan berkas, atau status kondisi terkait.
   - Memastikan tidak ada data fiktif dan mencatat ke dalam sistem ERP terintegrasi.
2. **Tahap 2 - Koordinasi & Eksekusi Lapangan:**
   - Menghubungi pihak-pihak berkepentingan (jamaah, instansi imigrasi/kemenag, muassasah, atau maskapai).
   - Melaksanakan tindakan sesuai alur instruksi kerja yang telah ditetapkan.
3. **Tahap 3 - Validasi & Pengesahan:**
   - Memeriksa kesesuaian hasil pelaksanaan dengan standar mutu layanan travel.
   - Mengarsipkan dokumen resmi dan bukti penyelesaian tugas.
4. **Tahap 4 - Monitoring & Laporan Pertanggungjawaban:**
   - Menyusun laporan berkala kepada manajemen puncak.
   - Memberikan evaluasi dan umpan balik untuk perbaikan berkesinambungan.

---

### 5. DOKUMEN & FORMULIR TERKAIT
- Form Verifikasi Berkas & Identitas.
- Berita Acara Pelaksanaan Kerja.
- Kuitansi / Bukti Transaksi Resmi.`;

      const newDoc = await prisma.sopDocument.create({
        data: {
          code: generatedCode,
          category: generatedCategory,
          title: `SOP: ${generatedTitle}`,
          purpose: `Pedoman dan tata laksana pelaksanaan terkait ${customPrompt}`,
          scope: "Seluruh divisi operasional dan manajemen PT Barokah Sulthan Haramain",
          responsibleRole: "Manajer Terkait & Staf Operasional",
          version: "1.0",
          tags: "ai-generated, sop, operasional, kustom",
          isMandatory: true,
          orderIndex: count + 1,
          contentMarkdown: generatedMarkdown,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Dokumen SOP kustom berhasil digenerate oleh AI.",
        document: newDoc,
      });
    }

    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  } catch (error) {
    console.error("Error in AI SOP generate:", error);
    return NextResponse.json({ error: "Gagal memproses generasi SOP" }, { status: 500 });
  }
}
