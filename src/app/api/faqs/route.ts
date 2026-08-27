import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let whereClause: any = {};
    if (category && category !== "ALL") {
      whereClause.category = category;
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { question: { contains: search } },
        { answer: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    let faqs = await prisma.salesFaq.findMany({
      where: whereClause,
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    });

    if (faqs.length === 0 && !category && !search) {
      const initialFaqs = [
        // 1. CLOSING & OBJECTION HANDLING
        {
          category: "CLOSING_OBJECTION",
          title: "Objection: Harga Paket Dianggap Lebih Mahal Dibanding Travel Lain",
          question: "Kenapa harga paket di Sulthan Haramain lebih mahal ya? Travel sebelah ada yang 22 jutaan.",
          answer:
            "Jelaskan bahwa Sulthan Haramain menggunakan fasilitas Bintang 5 (Pullman Zamzam / Swissotel) yang berada tepat di pelataran Masjidil Haram (jalan kaki < 50m) tanpa perlu naik bus shuttle, penerbangan Direct tanpa transit (Saudia/Garuda), makanan fullboard menu Indonesia bercita rasa Nusantara, serta jaminan legalitas resmi PPIU Kemenag RI dengan asuransi all-risk. Paket murah biasanya hotel bintang 3 berjarak 800m-1km dan maskapai transit berjam-jam yang menguras tenaga jamaah lansia.",
          waScript:
            "Assalamu'alaikum Warahmatullahi Wabarakatuh Bapak/Ibu [NAMA_JAMAAH],\n\nTerima kasih banyak atas pertanyaannya. Kami sangat memahami pertimbangan anggaran keluarga. 🙏\n\nPerlu kami sampaikan dengan jujur, perbedaan utama paket *Sulthan Haramain* adalah:\n1. 🏨 **Hotel Bintang 5 Pelataran Depan Masjidil Haram** (hanya 50 meter jalan kaki, sangat nyaman untuk istirahat & ibadah lansia tanpa perlu lelah menunggu bus shuttle).\n2. ✈️ **Penerbangan Direct Langsung Tanpa Transit** (CGK langsung Jeddah/Madinah, tidak lelah transit 8-12 jam).\n3. 🍽️ **Fullboard Menu Indonesia 3x Sehari**.\n4. 🛡️ **Izin Resmi PPIU Kemenag No. U.412/2022** (Jaminan 5 Pasti Umroh Kemenag).\n\nKenyamanan dan kekhusyukan ibadah Bapak/Ibu sekeluarga di Tanah Suci adalah amanah dan prioritas utama kami. Boleh kami bantu *lock seat* promo bulan ini dengan DP awal terlebih dahulu?",
          tags: "harga mahal, bandingkan travel, bintang 5, jarak hotel, closing",
          isMandatory: true,
          orderIndex: 1,
        },
        {
          category: "CLOSING_OBJECTION",
          title: "Objection: Mau Diskusi Dulu dengan Keluarga / Menunda Booking",
          question: "Saya rembukan dulu sama suami/keluarga ya, nanti saya kabari lagi.",
          answer:
            "Berikan apresiasi dan ciptakan urgency halus mengenai ketersediaan seat penerbangan direct dan kamar hotel ring-1 yang cepat penuh di musim keberangkatan tersebut. Tawarkan hold seat sementara 24-48 jam tanpa risiko agar kuota dan harga promo tidak hangus.",
          waScript:
            "Baik Bapak/Ibu [NAMA_JAMAAH], tentu sangat baik untuk dimusyawarahkan bersama keluarga tercinta. Semoga Allah mudahkan niat suci ibadah ke Baitullah. 🤲\n\nSebagai informasi, untuk keberangkatan tanggal [TGL_BERANGKAT], kuota seat penerbangan langsung saat ini tersisa **[SISA_SEAT] seat lagi** dan harga promo kamar ini sangat diminati.\n\nAgar seat dan harga promo Bapak/Ibu tidak terambil jamaah lain saat musyawarah, apakah berkenan kami bantu **Hold Seat Sementara (Gratis 24 Jam)** terlebih dahulu?\n\nJika sudah ada keputusan besok, kita tinggal lanjutkan ke tahap pendaftaran resmi. Boleh kami bantu amankan seatnya hari ini?",
          tags: "tunda, rembukan keluarga, urgency, hold seat, closing",
          isMandatory: true,
          orderIndex: 2,
        },
        {
          category: "CLOSING_OBJECTION",
          title: "Objection: Khawatir Travel Bodong / Trauma Penipuan Umroh",
          question: "Travelnya amanah gak ya? Soalnya banyak berita travel umroh bermasalah dan jamaah gagal berangkat.",
          answer:
            "Tegaskan legalitas resmi PPIU Kemenag RI, kepemilikan kantor fisik resmi yang bisa dikunjungi langsung, sistem manifest tiket & visa yang transparan (bisa dicek online), serta rekening penampungan atas nama resmi PT (Bukan Rekening Pribadi).",
          waScript:
            "Alhamdulillah, kekhawatiran Bapak/Ibu sangat wajar dan kami sangat menghargai kehati-hatian tersebut. 🙏\n\nPT Sulthan Haramain Tour & Travel adalah **Penyelenggara Perjalanan Ibadah Umroh (PPIU) Resmi Terdaftar di Kementerian Agama RI No. U.412 Tahun 2022**.\n\nPrinsip **5 Pasti Umroh** kami:\n1. 📜 **Pasti Travel Berizin Kemenag**\n2. ✈️ **Pasti Jadwal & Maskapainya**\n3. 🏨 **Pasti Hotelnya (Ring 1 Pelataran)**\n4. 🛂 **Pasti Visanya (E-Visa resmi MoFA Saudi)**\n5. 💳 **Pasti Rekening PT Resmi** (Seluruh pembayaran hanya ke rekening PT Sulthan Haramain, tidak pernah rekening pribadi).\n\nBapak/Ibu juga sangat kami persilakan berkunjung langsung ke kantor kami untuk silaturahmi dan konsultasi tatap muka. Kapan ada waktu luang untuk kami jadwalkan temu ramah?",
          tags: "legalitas, kemenag, amanah, izin ppiu, rekening pt, penipuan",
          isMandatory: true,
          orderIndex: 3,
        },
        {
          category: "CLOSING_OBJECTION",
          title: "Objection: Ingin Berangkat Berdua Suami-Istri Tapi Budget Terbatas",
          question: "Kami cuma berdua suami-istri, kalau ambil kamar Double mahal. Boleh gak kamar berdua dengan harga Quad?",
          answer:
            "Jelaskan sistem kamar hotel di Saudi (Quad = 1 kamar 4 orang terpisah gender, Double = 1 kamar private 2 orang). Tawarkan solusi paket Quad dengan penempatan kamar jamaah pria bersama pria lain dan wanita bersama wanita lain, ATAU tawarkan promo diskon upgrade Double.",
          waScript:
            "Assalamu'alaikum Bapak/Ibu [NAMA_JAMAAH],\n\nUntuk paket kamar di hotel Arab Saudi ketentuannya adalah:\n• **Paket Quad**: 1 Kamar ber-4 (Jamaah pria sekamar dengan sesama pria, dan jamaah wanita sekamar dengan sesama wanita).\n• **Paket Double**: 1 Kamar khusus ber-2 private khusus pasangan suami-istri.\n\n💡 **Solusi Terbaik**:\n1. Jika ingin paling hemat, Bapak & Ibu bisa ambil **Paket Quad**. Selama ibadah di masjid dan ziarah tetap selalu bersama, hanya saat tidur malam beristirahat di kamar terpisah gender.\n2. Jika menghendaki kamar private ber-2, kami ada program promo potongan khusus upgrade kamar Double sebesar Rp 1.000.000 per pasang untuk pendaftaran minggu ini.\n\nKira-kira opsi mana yang lebih nyaman untuk Bapak & Ibu?",
          tags: "kamar double, kamar quad, suami istri, upgrade, harga",
          isMandatory: true,
          orderIndex: 4,
        },

        // 2. COMPLAINT HANDLING & SERVICE RECOVERY
        {
          category: "COMPLAINT_HANDLING",
          title: "SOP Komplain: Koper / Bagasi Belum Tiba di Bandara Jeddah/Madinah",
          question: "Bagasi koper jamaah tertinggal di Jakarta / belum keluar di conveyor belt Bandara Jeddah.",
          answer:
            "Langkah 1: Jangan panik, tenangkan jamaah. Jelaskan koper tas paspor dan kain ihram cadangan aman di tas tenteng. Langkah 2: Tim handling bandara langsung ke kantor Lost & Found (PIR - Property Irregularity Report) maskapai dengan membawa baggage claim tag. Langkah 3: Berikan emergency kit perlengkapan darurat dan antarkan jamaah ke hotel terlebih dahulu. Koper akan diantarkan langsung oleh tim operasional ke kamar hotel jamaah maksimal 1x24 jam.",
          waScript:
            "Assalamu'alaikum Bapak/Ibu [NAMA_JAMAAH],\n\nMohon maaf sebesar-besarnya atas ketidaknyamanan terkait keterlambatan bagasi koper di bandara. 🙏\n\nKami informasikan bahwa **Tim Handling Lapangan Sulthan Haramain telah membuat laporan resmi Property Irregularity Report (PIR) ke pihak maskapai** dengan nomor tag bagasi Bapak/Ibu.\n\nBapak/Ibu dipersilakan beristirahat dan melanjutkan agenda ibadah di hotel terlebih dahulu. Tim kami yang akan mengurus, mengambil, dan mengantarkan koper langsung ke depan pintu kamar Bapak/Ibu begitu bagasi tiba di hotel.\n\nJika ada kebutuhan darurat pakaian/perlengkapan sementara, silakan hubungi Tour Leader kami di nomor WhatsApp: [NO_TL]. Kami siap melayani 24 jam.",
          tags: "komplain bagasi, koper hilang, lost and found, bandara, delay bagasi",
          isMandatory: true,
          orderIndex: 5,
        },
        {
          category: "COMPLAINT_HANDLING",
          title: "SOP Komplain: Kamar Hotel Belum Ready Saat Check-in di Makkah/Madinah",
          question: "Jamaah sudah lelah tiba di hotel tapi kamar belum bisa dimasuki karena proses pembersihan hotel.",
          answer:
            "Jelaskan standar jam check-in hotel internasional di Saudi (pukul 16:00 WAS). Sediakan welcome drink & ruang tunggu khusus lobi/restoran. Bagikan kunci kamar prioritas untuk lansia & anak-anak terlebih dahulu. Jika keterlambatan > 2 jam, koordinasikan kompensasi snack/makan bersama muthawwif.",
          waScript:
            "Assalamu'alaikum Bapak/Ibu Jamaah yang kami muliakan,\n\nKami memahami Bapak/Ibu sangat lelah setelah perjalanan darat dari Madinah/Bandara. Pihak manajemen hotel saat ini sedang melakukan proses *sanitasi & sterilisasi kamar* agar siap ditempati dengan bersih dan nyaman.\n\nSambil menunggu kamar siap secara bertahap, kami persilakan Bapak/Ibu menikmati **Welcome Drink & Snack** di area Restoran Hotel lantai [LANTAI].\n\nPrioritas pembagian kunci kamar pertama kami dahulukan bagi jamaah lansia dan keluarga dengan balita. Terima kasih atas kesabaran dan keikhlasan Bapak/Ibu sekalian. Semoga menjadi bagian dari pahala kesabaran ibadah umroh.",
          tags: "check-in hotel, kamar belum ready, ruang tunggu, komplain hotel",
          isMandatory: true,
          orderIndex: 6,
        },
        {
          category: "COMPLAINT_HANDLING",
          title: "SOP Komplain: Jamaah Sakit di Tanah Suci & Klaim Asuransi",
          question: "Jamaah mengalami demam tinggi, kelelahan berat, atau perlu penanganan medis darurat di RS Saudi.",
          answer:
            "Langkah 1: Muthawwif / TL segera mendampingi ke Klinik Kesehatan BPHI / Rumah Sakit Saudi terdekat (RS King Abdul Aziz / RS Al Ansar Madinah). Langkah 2: Tunjukkan E-Visa Umroh dan Asuransi Kesehatan Saudi (Insurance Policy Number). Seluruh biaya penanganan rawat darurat di RS Pemerintah Saudi tercover asuransi resmi. Langkah 3: Update kondisi berkala ke keluarga di tanah air.",
          waScript:
            "Assalamu'alaikum Warahmatullahi Wabarakatuh Keluarga Bapak/Ibu [NAMA_JAMAAH],\n\nKami dari manajemen *Sulthan Haramain* mengabarkan bahwa saat ini Bapak/Ibu [NAMA_JAMAAH] sedang didampingi langsung oleh Tour Leader & Muthawwif kami untuk mendapatkan penanganan medis terbaik dari dokter di [NAMA_KLINIK_RS].\n\nSeluruh administrasi menggunakan kartu **Asuransi Kesehatan Umroh Saudi Resmi** yang sudah tercover dalam paket.\n\nDokter telah memberikan obat dan menyarankan istirahat cukup. Kami akan terus memantau dan memberikan kabar berkala kepada pihak keluarga. Mohon doa dari tanah air agar beliau lekas pulih dan dapat melanjutkan rangkaian ibadah dengan sehat wal afiat. 🤲",
          tags: "jamaah sakit, dokter, rumah sakit saudi, klaim asuransi, darurat",
          isMandatory: true,
          orderIndex: 7,
        },
        {
          category: "COMPLAINT_HANDLING",
          title: "SOP Komplain: Pembatalan Keberangkatan Mendadak & Permohonan Refund",
          question: "Jamaah ingin membatalkan keberangkatan 2 minggu sebelum berangkat karena sakit mendadak dan minta uang kembali 100%.",
          answer:
            "Jelaskan dengan empati dan transparan sesuai kontrak PPIU: Tiket pesawat internasional issued non-refundable (atau kena cancellation fee maskapai), E-Visa sudah terbit dan tidak bisa ditarik biaya dari MoFA Saudi, serta hotel sudah dibayar penuh (room block guarantee). Tawarkan opsi: Reschedule jadwal ke tanggal berikutnya atau ganti nama jamaah (transfer pax jika tiket memungkinkan) agar dana tidak hangus.",
          waScript:
            "Assalamu'alaikum Bapak/Ibu [NAMA_JAMAAH],\n\nInna lillahi wa inna ilaihi raji'un, kami turut prihatin atas kendala yang dialami Bapak/Ibu. Semoga Allah segera memberikan kesembuhan dan jalan keluar terbaik. 🤲\n\nMengenai permohonan pembatalan, sesuai dengan ketentuan standar PPIU dan maskapai penerbangan, komponen yang sudah *issued & terbit resmi* (Tiket Pesawat, E-Visa Saudi, & Room Hotel Block) memiliki biaya penalti pembatalan dari pihak ketiga.\n\n💡 **Opsi Solutif dari Kami**:\n1. **Reschedule Jadwal**: Menggeser jadwal keberangkatan ke bulan berikutnya (hanya dikenakan selisih rebook tiket jika ada).\n2. **Penggantian Nama Jamaah (Transfer Pax)**: Digantikan oleh anggota keluarga lain agar dana hotel & fasilitas tidak hangus.\n\nBoleh kami bantu koordinasikan dengan pihak maskapai untuk opsi yang paling meringankan bagi keluarga?",
          tags: "refund, pembatalan, sakit, reschedule, penalti tiket",
          isMandatory: true,
          orderIndex: 8,
        },

        // 3. PERSYARATAN DOKUMEN & VISA
        {
          category: "SYARAT_VISA",
          title: "Ketentuan Paspor & Aturan Masa Berlaku",
          question: "Paspor saya habisnya 5 bulan lagi setelah tanggal pulang, apakah bisa dipakai?",
          answer:
            "TIDAK BISA. Regulasi Imigrasi Arab Saudi dan IATA mewajibkan masa berlaku paspor minimal 6-8 bulan sebelum tanggal keberangkatan. Jika kurang dari 6 bulan, sistem E-Visa MoFA Saudi akan otomatis me-reject pengajuan visa dan maskapai akan menolak boarding di bandara.",
          waScript:
            "Assalamu'alaikum Bapak/Ibu [NAMA_JAMAAH],\n\nSesuai regulasi resmi Imigrasi Kerajaan Arab Saudi dan Otoritas Penerbangan Internasional (IATA), **masa berlaku paspor minimal adalah 6 bulan dari tanggal jadwal keberangkatan**.\n\nJika masa berlaku paspor saat ini di bawah 6 bulan, kami sarankan untuk melakukan perpanjangan paspor segera di Kantor Imigrasi terdekat. Kami dapat memberikan **Surat Rekomendasi Resmi Travel PPIU** untuk mempercepat proses perpanjangan paspor Bapak/Ibu. Boleh kami bantu buatkan suratnya hari ini?",
          tags: "paspor, masa berlaku, visa rejected, syarat imigrasi",
          isMandatory: true,
          orderIndex: 9,
        },
        {
          category: "SYARAT_VISA",
          title: "Aturan Mahram Wanita Umroh Terbaru",
          question: "Apakah wanita di bawah 45 tahun sekarang boleh berangkat umroh sendiri tanpa mahram?",
          answer:
            "BOLEH. Berdasarkan regulasi terbaru Kementerian Haji & Umrah Kerajaan Arab Saudi, wanita dari segala usia diperbolehkan menunaikan ibadah umroh tanpa mahram laki-laki, asalkan bergabung dalam rombongan biro travel resmi PPIU yang berizin.",
          waScript:
            "Assalamu'alaikum Ibu [NAMA_JAMAAH],\n\nKabar gembira, berdasarkan regulasi resmi terbaru dari Kementerian Haji & Umrah Arab Saudi, **jamaah wanita saat ini SUDAH DIPERBOLEHKAN berangkat umroh mandiri tanpa mahram**, dengan syarat terdaftar dalam rombongan travel resmi berizin PPIU seperti Sulthan Haramain.\n\nSelama di Tanah Suci, Ibu akan didampingi oleh Tour Leader, Pembimbing Ibadah (Muthawwif), dan rombongan jamaah wanita lainnya sehingga sangat aman, nyaman, dan khusyuk. Kami siap mendampingi perjalanan ibadah Ibu. 🙏",
          tags: "mahram, wanita tanpa mahram, aturan saudi baru",
          isMandatory: true,
          orderIndex: 10,
        },
        {
          category: "SYARAT_VISA",
          title: "Ketentuan Vaksinasi & Sertifikat Kesehatan",
          question: "Vaksin apa saja yang wajib untuk berangkat umroh tahun ini?",
          answer:
            "Wajib: Vaksin Meningitis Meningokokus (Sertifikat Kuning / ICV Resmi dari KKP/Klinik Rujukan atau terdaftar di SatuSehat). Vaksin Polio diwajibkan untuk jamaah dari wilayah tertentu. Vaksin Covid-19 disarankan dosis lengkap.",
          waScript:
            "Assalamu'alaikum Bapak/Ibu [NAMA_JAMAAH],\n\nUntuk persyaratan kesehatan umroh resmi:\n1. 💉 **Vaksin Meningitis (Wajib)**: Mendapatkan buku kuning ICV / sertifikat resmi di KKP Bandara, RSUD, atau klinik rujukan resmi minimal 14 hari sebelum keberangkatan.\n2. 📄 **Buku Nikah / Akta Lahir**: Khusus bagi yang membawa anak di bawah umur.\n\nTim kami siap memberikan daftar lokasi klinik vaksin terdekat dari tempat tinggal Bapak/Ibu.",
          tags: "vaksin meningitis, buku kuning, icv, syarat medis",
          isMandatory: true,
          orderIndex: 11,
        },

        // 4. FASILITAS, HOTEL & PENERBANGAN
        {
          category: "FASILITAS_HOTEL",
          title: "Fasilitas Makanan & Menu Selama di Makkah/Madinah",
          question: "Makanannya cocok gak ya buat lidah orang Indonesia? Takut gak cocok makanan Arab.",
          answer:
            "Semua paket Sulthan Haramain menyajikan Fullboard Buffet 3x Sehari dengan Menu Masakan Khas Nusantara Indonesia yang dimasak oleh chef Indonesia di hotel bintang 5 (tersedia nasi putih, rendang, ayam goreng, soto, sambal terasi, kerupuk, sayur asem, buah segar, teh manis & kopi hangat).",
          waScript:
            "Assalamu'alaikum Bapak/Ibu [NAMA_JAMAAH],\n\nBapak/Ibu tidak perlu khawatir mengenai makanan. Seluruh hotel bintang 5 kami menyediakan **Fullboard Buffet 3x Sehari dengan Masakan Khas Indonesia (Chef Nusantara)**. 🍛\n\nMenu harian meliputi hidangan yang familiar seperti soto, rawon, ayam bakar, rendang, sayur lodeh, lengkap dengan aneka sambal dan kerupuk khas Indonesia. Jamaah lansia dan anak-anak sangat cocok dan berselera.",
          tags: "makanan indonesia, catering, menu nusantara, nafsu makan",
          isMandatory: true,
          orderIndex: 12,
        },
        {
          category: "FASILITAS_HOTEL",
          title: "Ketentuan Bagasi Pesawat & Air Zamzam",
          question: "Berapa jatah bagasi koper dan apakah dapat Air Zamzam?",
          answer:
            "Bagasi kabin: 7 Kg (Tas tenteng / tas paspor). Bagasi tercatat pesawat direct: 25 - 30 Kg (1-2 koper). Air Zamzam 5 Liter resmi dari maskapai dibagikan saat tiba di Bandara Internasional Indonesia (sesuai regulasi GACA Saudi yang melarang membawa zamzam di koper bagasi pribadi).",
          waScript:
            "Assalamu'alaikum Bapak/Ibu [NAMA_JAMAAH],\n\nUntuk ketentuan bagasi penerbangan:\n• 🧳 **Bagasi Koper Tercatat**: 25 - 30 Kg per jamaah.\n• 🎒 **Bagasi Kabin**: 7 Kg (Tas ransel / koper kabin 20 inch).\n• 💧 **Air Zamzam 5 Liter Resmi**: Insya Allah didapatkan secara resmi dan dibagikan setibanya di Bandara Tanah Air.\n\n*Catatan*: Air zamzam tidak boleh dimasukkan ke dalam koper bagasi karena akan disita oleh pihak otoritas bandara Saudi (GACA).",
          tags: "bagasi koper, batas berat, air zamzam 5 liter, kargo",
          isMandatory: true,
          orderIndex: 13,
        },

        // 5. PEMBAYARAN, REKENING & CICILAN
        {
          category: "REFUND_KEUANGAN",
          title: "Skema Pembayaran DP, Pelunasan, dan Opsi Tabungan",
          question: "Bagaimana tahapan pembayaran dan nomor rekening resmi travel?",
          answer:
            "Tahap 1: Pembayaran DP Penguncian Seat Rp 10.000.000 / pax. Tahap 2: Pembayaran Bertahap / Cicilan bebas nominal. Tahap 3: Pelunasan maksimal 30 hari sebelum tanggal keberangkatan saat proses ticketing & visa. Pembayaran HANYA ke rekening resmi PT Sulthan Haramain Tour & Travel (Bank BSI / Mandiri / BCA).",
          waScript:
            "Assalamu'alaikum Bapak/Ibu [NAMA_JAMAAH],\n\nBerikut skema tahapan pembayaran di Sulthan Haramain:\n1. 💳 **DP Booking Seat**: Rp 10.000.000 / pax (Langsung mendapatkan nomor manifest & invoice resmi).\n2. 📈 **Cicilan Fleksibel**: Bebas diangsur bertahap sesuai kemampuan keluarga.\n3. 🏁 **Pelunasan**: Maksimal 30 hari sebelum jadwal keberangkatan.\n\n🏦 **Rekening Resmi PT (Biro Perjalanan PPIU)**:\n• **Bank Syariah Indonesia (BSI)**: 8888-999-123\n• **Bank BCA**: 731-888-9900\n• **Bank Mandiri**: 137-00-8888999-1\n*a.n PT SULTHAN HARAMAIN TOUR & TRAVEL*\n\nSetiap pembayaran otomatis diterbitkan kuitansi resmi sistem ber-barcode.",
          tags: "pembayaran dp, pelunasan, cicilan, rekening pt bsi bca",
          isMandatory: true,
          orderIndex: 14,
        },

        // 6. FAQ UMUM & TIPS IBADAH
        {
          category: "FAQ_UMUM",
          title: "Membawa Uang Saku & Kartu Debit di Arab Saudi",
          question: "Sebaiknya bawa uang tunai Riyal berapa dan apakah kartu debit ATM Indonesia bisa dipakai di sana?",
          answer:
            "Disarankan membawa uang tunai Riyal secukupnya (sekitar SAR 500 - 1.000 untuk keperluan infak dan belanja kecil). Kartu debit ATM bank Indonesia (BSI, BCA, Mandiri) berlogo Visa/Mastercard dapat digunakan tarik tunai Riyal di seluruh ATM Al-Rajhi, SNB Al-Ahli di Makkah/Madinah dengan kurs kompetitif. Transaksi di toko-toko besar juga menerima QRIS & Kartu Debit.",
          waScript:
            "Assalamu'alaikum Bapak/Ibu [NAMA_JAMAAH],\n\nTips persiapan uang saku di Tanah Suci:\n1. 💵 **Uang Tunai Riyal**: Cukup bawa SAR 500 - 1.000 per orang untuk sedekah & belanja kecil.\n2. 💳 **Kartu Debit ATM Indonesia**: Kartu ATM berlogo Visa/Mastercard (BSI, BCA, Mandiri) bisa digunakan langsung tarik tunai Riyal di mesin ATM sekitar Masjidil Haram & Nabawi.\n3. 📲 **Non-Tunai**: Hampir semua toko dan farmasi di Saudi menerima kartu debit/kredit contactless.\n\nTour Leader kami akan mendampingi dan menunjukkan lokasi ATM terdekat di hotel.",
          tags: "uang saku, riyal saudi, kartu debit atm, belanja",
          isMandatory: true,
          orderIndex: 15,
        },
      ];

      for (const faq of initialFaqs) {
        await prisma.salesFaq.create({ data: faq });
      }

      faqs = await prisma.salesFaq.findMany({
        where: whereClause,
        orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
      });
    }

    return NextResponse.json(faqs);
  } catch (error) {
    console.error("Error fetching sales FAQs:", error);
    return NextResponse.json({ error: "Failed to fetch sales FAQs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, title, question, answer, waScript, tags, isMandatory } = body;

    if (!title || !question || !answer) {
      return NextResponse.json({ error: "Judul, Pertanyaan/Komplain, dan Jawaban wajib diisi" }, { status: 400 });
    }

    const faq = await prisma.salesFaq.create({
      data: {
        category: category || "CLOSING_OBJECTION",
        title: title.trim(),
        question: question.trim(),
        answer: answer.trim(),
        waScript: waScript ? waScript.trim() : null,
        tags: tags ? tags.trim() : null,
        isMandatory: isMandatory !== undefined ? Boolean(isMandatory) : true,
      },
    });

    return NextResponse.json(faq, { status: 201 });
  } catch (error) {
    console.error("Error creating sales FAQ:", error);
    return NextResponse.json({ error: "Failed to create sales FAQ" }, { status: 500 });
  }
}
