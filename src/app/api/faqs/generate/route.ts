import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Comprehensive Standard Mandatory PPIU Playbook Catalog tailored for PT BAROKAH SULTHAN HARAMAIN
const mandatoryPpiuCatalog = [
  {
    category: "CLOSING_OBJECTION",
    title: "Objection: Biaya Paket Lebih Mahal Dibanding Travel Lain",
    question: "Kenapa paket umroh di PT Barokah Sulthan Haramain harganya lebih mahal dibanding travel sebelah yang promo 22 juta?",
    answer: "Edukasi jamaah mengenai '5 Pasti Umroh Kemenag'. Jelaskan bahwa harga paket kami adalah 'All-In Tanpa Biaya Tersembunyi' dengan hotel bintang 5 depan pelataran (Pullman Zamzam / Dallah Taibah) dan penerbangan langsung (Direct Saudia Airlines tanpa transit melelahkan). Travel murah sering membebankan handling tambahan, hotel transit jauh 3-5 km, dan risiko gagal berangkat.",
    waScript: "Assalamu'alaikum Bpk/Ibu {NAMA}, terima kasih atas pertanyaannya yang sangat baik. 🙏\n\nMemang sekilas ada travel yang menawarkan harga lebih murah, namun di *PT BAROKAH SULTHAN HARAMAIN (Izin Kemenag & NIB Resmi)*, kami berkomitmen pada kenyamanan ibadah Anda:\n\n1. ✅ *Penerbangan Langsung (Direct Flight)* tanpa transit berjam-jam.\n2. ✅ *Hotel Ring 1 Pelataran Masjid* (hemat tenaga untuk ibadah lansia/keluarga).\n3. ✅ *Transparansi Biaya:* Bebas dari pungutan tambahan handling atau visa di kemudian hari.\n\nFokus kami adalah kekhusyukan dan keselamatan ibadah Bapak/Ibu. Kuota promo seat kami tersisa 8 kursi lagi untuk keberangkatan terdekat. Apakah berkenan kami amankan seat-nya hari ini?",
    tags: "harga, mahal, promo, diskon, kompetitor",
    isMandatory: true,
    orderIndex: 1,
  },
  {
    category: "CLOSING_OBJECTION",
    title: "Objection: Takut Menyetor Dana / Trauma Kasus Travel Gagal Berangkat",
    question: "Saya dan keluarga trauma mendengar berita travel yang menelantarkan jamaah. Bagaimana jaminan keamanannya?",
    answer: "Tunjukkan legalitas hukum resmi: SK Kemenkumham RI No. AHU-0007388.AH.01.01.TAHUN 2026, NIB Berbasis Risiko 1504260072814 KBLI 79122. Jelaskan bahwa seluruh pembayaran disetor ke Rekening Bank Perusahaan resmi (BSI) dan langsung terintegrasi dengan manifes SISKOPATUH Kementerian Agama RI.",
    waScript: "Assalamu'alaikum Bpk/Ibu {NAMA}, kekhawatiran Bapak/Ibu sangat kami pahami dan wajar sekali. 🤝\n\nUntuk menjamin 100% keamanan dana dan keberangkatan Anda:\n\n1. 🏛️ *Badan Hukum Resmi:* PT BAROKAH SULTHAN HARAMAIN telah mengantongi SK Kemenkumham RI No. AHU-0007388.AH.01.01.TAHUN 2026 dan NIB 1504260072814.\n2. 📄 *Kuitansi & Jurnal Resmi:* Setiap pembayaran disetorkan ke rekening perusahaan (BSI 8888-999-123) dan diterbitkan kuitansi berstempel legal.\n3. 📱 *Sistem Terpantau:* Data Anda langsung diinput ke sistem SISKOPATUH Kemenag RI dan dapat dipantau langsung status visanya.\n\nBapak/Ibu juga dipersilakan berkunjung langsung ke kantor kami untuk konsultasi tatap muka. Kapan ada waktu luang minggu ini?",
    tags: "keamanan, legalitas, penipuan, garansi, kemenag",
    isMandatory: true,
    orderIndex: 2,
  },
  {
    category: "CLOSING_OBJECTION",
    title: "Objection: Mau Ibadah Sendiri Tanpa Mahram / Paspor Masih 1 Kata",
    question: "Saya wanita mau berangkat sendiri tanpa mahram, dan paspor saya namanya hanya 1 kata. Apakah bisa?",
    answer: "Berdasarkan regulasi terbaru Kementerian Haji Saudi, visa umroh wanita tanpa mahram kini diperbolehkan. Untuk paspor 1 kata, PT Barokah Sulthan Haramain menyediakan layanan 'Surat Rekomendasi Endos Nama Paspor' resmi ke Kantor Imigrasi (dilampirkan SK Kemenkumham & NIB) agar nama paspor ditambahkan menjadi 3 kata.",
    waScript: "Assalamu'alaikum Bpk/Ibu {NAMA}, kabar gembira! 😊\n\n1. *Wanita Tanpa Mahram:* Sesuai aturan resmi terbaru, wanita sudah diperbolehkan menunaikan ibadah umroh dan selama di Tanah Suci akan didampingi Muthawwifah & Tour Leader resmi kami.\n2. *Paspor 1 Kata:* Tim kami akan membuatkan *Surat Permohonan Endos Nama Paspor* resmi berlampiran SK Kemenkumham & NIB ke Kantor Imigrasi agar paspor Anda langsung disahkan menjadi 3 suku kata.\n\nSeluruh proses administrasi akan kami bimbing hingga tuntas. Mohon kirimkan foto KTP & Paspor agar kami bantu verifikasi awal sekarang ya.",
    tags: "mahram, paspor, endos, wanita, imigrasi",
    isMandatory: true,
    orderIndex: 3,
  },
  {
    category: "COMPLAINT_HANDLING",
    title: "SOP Komplain: Koper / Bagasi Belum Tiba di Kamar Hotel Makkah",
    question: "Jamaah panik dan marah karena koper bagasinya belum diantar ke kamar setelah tiba di hotel.",
    answer: "Tetap tenang, minta maaf atas ketidaknyamanan, jelaskan proses sorting porter hotel (karena porter mengantar ratusan koper per bus secara bergiliran). Catat nomor kamar dan nomor tag koper jamaah, hubungi Tour Leader/Muthawwif lapangan dan porter hotel untuk memprioritaskan kamar tersebut.",
    waScript: "Assalamu'alaikum Wr. Wb. Bpk/Ibu {NAMA}, mohon maaf yang sebesar-besarnya atas ketidaknyamanan ini. 🙏\n\nSaat ini tim logistik dan porter hotel sedang mendistribusikan bagasi per lantai kamar secara berurutan dari bus.\n\nMohon bantu kami dengan mengonfirmasi:\n📍 *Nomor Kamar:* (Misal: 1204)\n🏷️ *Warna / Ciri Koper & No Tag:* ...\n\nSaya langsung koordinasikan detik ini juga ke Tour Leader dan Muthawwif yang bertugas di lobi hotel agar koper Bapak/Ibu diprioritaskan diantar sekarang. Mohon ditunggu sebentar ya Bapak/Ibu.",
    tags: "komplain, koper, logistik, bagasi, hotel",
    isMandatory: true,
    orderIndex: 4,
  },
  {
    category: "COMPLAINT_HANDLING",
    title: "SOP Komplain: Jamaah Mengeluh Sakit / Butuh Kursi Roda Saat Tawaf",
    question: "Jamaah atau keluarganya mendadak kelelahan dan membutuhkan kursi roda serta pendorong resmi saat Tawaf/Sai.",
    answer: "Hubungi tim medis travel dan Muthawwif lapangan. Sediakan pendorong kursi roda resmi berizin resmi Masjidil Haram (agar tidak terkena razia asykar). Dampingi jamaah dan pastikan kartu asuransi kesehatan visa Saudi aktif.",
    waScript: "Assalamu'alaikum Bpk/Ibu {NAMA}, kami turut prihatin dan siap mendampingi. Keselamatan dan kesehatan jamaah adalah prioritas nomor satu kami. 🏥\n\nTim Muthawwif kami di Tanah Suci telah menyiapkan pendorong kursi roda resmi Masjidil Haram untuk mendampingi pelaksanaan Tawaf & Sa'i Bapak/Ibu agar tetap khusyuk dan aman.\n\nJika membutuhkan pemeriksaan medis, dokter rombongan kami juga siap berkunjung ke kamar. Mohon tetap istirahat dan hubungi nomor darurat TL kami di +966 ...",
    tags: "komplain, sakit, kursi roda, tawaf, medis",
    isMandatory: true,
    orderIndex: 5,
  },
  {
    category: "SYARAT_VISA",
    title: "Ketentuan Vaksin Meningitis & Dokumen Paspor Masa Berlaku Min. 8 Bulan",
    question: "Apa saja syarat mutlak dokumen paspor dan vaksin untuk penerbitan Visa Umroh Saudi?",
    answer: "1. Paspor asli dengan masa berlaku minimal 8 bulan sebelum tanggal keberangkatan dan nama minimal 2 atau 3 kata. 2. Buku Kuning / Sertifikat Vaksin Meningitis (ICV) dari Dinas Kesehatan/KKP. 3. Pasfoto 4x6 latar belakang putih fokus wajah 80%. 4. KTP dan Kartu Keluarga asli/salinan.",
    waScript: "Assalamu'alaikum Bpk/Ibu {NAMA}, berikut adalah *Daftar Dokumen Wajib Persiapan Umroh* sesuai regulasi Kementerian Agama RI & Kedutaan Saudi:\n\n1. 🛂 *Paspor Asli:* Masa berlaku minimal 8 bulan, nama minimal 2-3 kata.\n2. 💉 *Buku Vaksin Meningitis (ICV):* Dari klinik/RS rujukan KKP.\n3. 📸 *Pasfoto 4x6 (5 Lembar):* Latar putih, fokus wajah 80%.\n4. 📄 *Fotokopi KTP & KK:* Masih berlaku.\n5. 💍 *Buku Nikah / Akta Lahir:* Untuk keluarga/mahram.\n\nSeluruh dokumen mohon diserahkan paling lambat H-30 sebelum keberangkatan agar proses e-Visa Saudi berjalan lancar.",
    tags: "paspor, visa, vaksin, meningitis, kemenag",
    isMandatory: true,
    orderIndex: 6,
  },
  {
    category: "FASILITAS_HOTEL",
    title: "Penjelasan Tipe Kamar Quad, Triple, dan Double",
    question: "Apa bedanya kamar tipe Quad, Triple, dan Double pada paket umroh?",
    answer: "Quad = 1 kamar diisi 4 orang (4 ranjang terpisah, terpisah pria dan wanita kecuali rombongan keluarga 1 kamar). Triple = 1 kamar diisi 3 orang (3 ranjang terpisah). Double = 1 kamar diisi 2 orang (suami-istri / 2 orang mahram).",
    waScript: "Assalamu'alaikum Bpk/Ibu {NAMA}, berikut penjelasan tipe kamar hotel kami di Makkah & Madinah:\n\n🛏️ *Quad (4 Ranjang):* 1 kamar diisi 4 orang (sesama pria / sesama wanita).\n🛏️ *Triple (3 Ranjang):* 1 kamar diisi 3 orang.\n🛏️ *Double (2 Ranjang):* 1 kamar privat untuk 2 orang (sangat cocok untuk pasangan suami-istri).\n\nSeluruh kamar dilengkapi AC, kamar mandi dalam, air panas, dan fasilitas hotel bintang 5. Apakah Bapak/Ibu ingin memesan tipe Quad atau upgrade ke Double/Triple?",
    tags: "hotel, kamar, quad, double, triple, fasilitas",
    isMandatory: true,
    orderIndex: 7,
  },
  {
    category: "REFUND_KEUANGAN",
    title: "Kebijakan Pengembalian Dana (Refund Policy) Jika Jamaah Batal Berangkat",
    question: "Bagaimana jika mendadak ada keluarga sakit atau tugas dinas sehingga harus membatalkan keberangkatan?",
    answer: "Jelaskan aturan refund bertahap PPIU: Pembatalan setelah booking seat (sebelum tiket/visa terbit) dikenakan biaya administrasi. Pembatalan setelah tiket pesawat dan hotel issued (H-30 s/d H-14) dikenakan potongan biaya riil yang sudah disetor ke maskapai/hotel. Dana sisa akan ditransfer ke rekening jamaah.",
    waScript: "Assalamu'alaikum Bpk/Ibu {NAMA}, kami memiliki *Kebijakan Refund Resmi Berbasis Transparansi Biaya Riil*:\n\n1. *Pembatalan > 30 Hari Sebelum Berangkat:* Pengembalian dana setelah dipotong biaya administrasi pendaftaran.\n2. *Pembatalan 15-30 Hari Sebelum Berangkat:* Pengembalian dipotong deposit tiket & reservasi hotel yang tidak dapat di-refund oleh maskapai.\n3. *Opsi Penggantian Jadwal (Reschedule):* Anda juga dapat memindahkan jadwal keberangkatan ke bulan berikutnya tanpa hangus.\n\nStaf keuangan kami akan membantu perhitungan transparan sesuai rincian biaya yang telah dikeluarkan.",
    tags: "refund, batal, uang kembali, reschedule, keuangan",
    isMandatory: true,
    orderIndex: 8,
  },
];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { customPrompt, generateAllMandatory } = body;

    // Mode 1: Generate All Standard Mandatory Catalog
    if (generateAllMandatory) {
      let createdCount = 0;
      for (const item of mandatoryPpiuCatalog) {
        const exists = await prisma.salesFaq.findFirst({
          where: { title: item.title },
        });
        if (!exists) {
          await prisma.salesFaq.create({
            data: item,
          });
          createdCount++;
        }
      }

      const allFaqs = await prisma.salesFaq.findMany({
        orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
      });

      return NextResponse.json({
        success: true,
        message: `Berhasil men-generate ${createdCount} materi playbook & skrip closing standar PPIU.`,
        data: allFaqs,
      });
    }

    // Mode 2: Custom AI Prompt Generation
    if (customPrompt) {
      // Simulate AI generation tailored for Umrah sales
      const promptLower = customPrompt.toLowerCase();
      let category = "CLOSING_OBJECTION";
      if (promptLower.includes("komplain") || promptLower.includes("marah") || promptLower.includes("hilang") || promptLower.includes("sakit")) {
        category = "COMPLAINT_HANDLING";
      } else if (promptLower.includes("visa") || promptLower.includes("paspor") || promptLower.includes("vaksin")) {
        category = "SYARAT_VISA";
      } else if (promptLower.includes("hotel") || promptLower.includes("kamar") || promptLower.includes("pesawat")) {
        category = "FASILITAS_HOTEL";
      } else if (promptLower.includes("bayar") || promptLower.includes("refund") || promptLower.includes("dp")) {
        category = "REFUND_KEUANGAN";
      }

      const count = await prisma.salesFaq.count();
      const generatedItem = {
        category,
        title: `AI Playbook: ${customPrompt.slice(0, 60)}...`,
        question: customPrompt,
        answer: `Penjelasan Profesional: Hadapi pertanyaan ini dengan memberikan empati, menunjukkan legalitas resmi PT BAROKAH SULTHAN HARAMAIN (SK Kemenkumham AHU-0007388.AH.01.01.TAHUN 2026), serta memberikan solusi konkret sesuai SOP PPIU Kemenag RI.`,
        waScript: `Assalamu'alaikum Wr. Wb. Bpk/Ibu {NAMA}, terima kasih atas pertanyaannya. 🙏\n\nMengenai hal tersebut, kami di *PT BAROKAH SULTHAN HARAMAIN* memastikan pelayanan terbaik dan kepatuhan penuh sesuai regulasi resmi.\n\nKami siap membantu seluruh proses Bapak/Ibu hingga tuntas dan nyaman. Ada yang bisa kami bantu koordinasikan hari ini?`,
        tags: "ai-generated, sales, closing",
        isMandatory: true,
        orderIndex: count + 1,
      };

      const saved = await prisma.salesFaq.create({
        data: generatedItem,
      });

      return NextResponse.json({
        success: true,
        message: "Materi skrip baru berhasil dibuat oleh AI Generator!",
        data: saved,
      });
    }

    return NextResponse.json({ error: "Parameter prompt atau generateAllMandatory wajib disertakan" }, { status: 400 });
  } catch (error) {
    console.error("Error generating AI FAQ:", error);
    return NextResponse.json({ error: "Gagal men-generate materi AI" }, { status: 500 });
  }
}
