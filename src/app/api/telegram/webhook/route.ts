import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  sendTelegramMessage,
  answerTelegramCallback,
  downloadTelegramFile,
} from "@/lib/telegram";

export const dynamic = "force-dynamic";

function formatRupiah(num: number | null | undefined): string {
  if (!num) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDateIndo(dateVal: Date | string | null | undefined): string {
  if (!dateVal) return "-";
  try {
    const d = new Date(dateVal);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

// Menu Utama Bot
function getMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🕋 Lihat Paket Umroh Aktif", callback_data: "menu_packages" },
        { text: "📝 Daftar / Konsultasi", callback_data: "menu_register" },
      ],
      [
        { text: "📋 Kirim / Lengkapi Berkas", callback_data: "menu_upload_docs" },
        { text: "🔍 Cek Status Pendaftaran", callback_data: "menu_status" },
      ],
      [
        { text: "💳 Rekening Resmi Travel", callback_data: "menu_bank" },
        { text: "📞 Hubungi Konsultan Umroh", callback_data: "menu_contact" },
      ],
    ],
  };
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    bot: "@sulthanharamainbot",
    message: "Webhook Telegram Travel Umroh aktif dan siap menerima data.",
  });
}

export async function POST(request: Request) {
  try {
    const update = await request.json();

    // 1. Handle Callback Query (Tombol Menu Inline)
    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId = String(cq.message.chat.id);
      const data = cq.data;
      await answerTelegramCallback(cq.id);

      // Cari atau buat session
      let session = await prisma.telegramSession.findUnique({
        where: { chatId },
      });
      if (!session) {
        session = await prisma.telegramSession.create({
          data: {
            chatId,
            username: cq.from?.username || "",
            firstName: cq.from?.first_name || "",
            step: "IDLE",
          },
        });
      }

      // Action: Lihat Paket Umroh Aktif
      if (data === "menu_packages") {
        const packages = await prisma.package.findMany({
          where: {
            status: { in: ["ACTIVE", "FULL"] },
          },
          orderBy: { departureDate: "asc" },
        });

        if (packages.length === 0) {
          await sendTelegramMessage(
            chatId,
            "🕋 <b>Informasi Paket Umroh:</b>\n\nSaat ini belum ada paket keberangkatan aktif. Silakan hubungi konsultan kami untuk info jadwal terbaru.",
            getMainMenuKeyboard()
          );
          return NextResponse.json({ ok: true });
        }

        let msg = "🕋 <b>DAFTAR PAKET UMROH:</b>\n\n";
        const buttons: any[] = [];

        packages.forEach((pkg, idx) => {
          const isFull = pkg.status === "FULL" || pkg.bookedCount >= pkg.quota;
          const sisaKursi = Math.max(0, pkg.quota - pkg.bookedCount);
          msg += `<b>${idx + 1}. ${pkg.name}</b>\n`;
          msg += `📅 Berangkat: <b>${formatDateIndo(pkg.departureDate)}</b> (${pkg.durationDays} Hari)\n`;
          msg += `✈️ Maskapai: ${pkg.airline}\n`;
          msg += `🏨 Hotel: ${pkg.hotelMakkah} (Makkah) & ${pkg.hotelMadinah} (Madinah)\n`;
          msg += `💰 Harga Mulai: <b>${formatRupiah(pkg.priceQuad)}</b> (Quad)\n`;
          msg += isFull
            ? `⚠️ Status: <b>Kuota Utama Penuh (Tersedia Waiting List)</b>\n\n`
            : `🪑 Sisa Kuota: <b>${sisaKursi} Kursi</b>\n\n`;

          buttons.push([
            {
              text: isFull
                ? `📝 Daftar Waiting List: ${pkg.name.slice(0, 20)}`
                : `📝 Booking: ${pkg.name.slice(0, 24)}...`,
              callback_data: `select_pkg_${pkg.id}`,
            },
          ]);
        });

        buttons.push([{ text: "🔙 Kembali ke Menu Utama", callback_data: "menu_main" }]);

        await sendTelegramMessage(chatId, msg, { inline_keyboard: buttons });
        return NextResponse.json({ ok: true });
      }

      // Action: Mulai Pendaftaran / Booking
      if (data === "menu_register") {
        const packages = await prisma.package.findMany({
          where: {
            status: { in: ["ACTIVE", "FULL"] },
          },
          orderBy: { departureDate: "asc" },
        });

        if (packages.length === 0) {
          await sendTelegramMessage(
            chatId,
            "Saat ini belum ada paket yang tersedia untuk booking online. Silakan hubungi konsultan kami.",
            getMainMenuKeyboard()
          );
          return NextResponse.json({ ok: true });
        }

        const buttons = packages.map((pkg) => {
          const isFull = pkg.status === "FULL" || pkg.bookedCount >= pkg.quota;
          return [
            {
              text: `${isFull ? "🈵 [Penuh/Waitlist]" : "🛫"} ${pkg.name} (${formatDateIndo(pkg.departureDate)})`,
              callback_data: `select_pkg_${pkg.id}`,
            },
          ];
        });
        buttons.push([{ text: "❌ Batalkan", callback_data: "menu_main" }]);

        await sendTelegramMessage(
          chatId,
          "📝 <b>Pendaftaran & Konsultasi Umroh</b>\n\nSilakan pilih program paket yang Anda minati:",
          { inline_keyboard: buttons }
        );
        return NextResponse.json({ ok: true });
      }

      // Action: Memilih Paket Tertentu
      if (data.startsWith("select_pkg_")) {
        const pkgId = data.replace("select_pkg_", "");
        const pkg = await prisma.package.findUnique({ where: { id: pkgId } });

        await prisma.telegramSession.update({
          where: { chatId },
          data: {
            step: "ASKING_NAME",
            data: JSON.stringify({ packageId: pkgId, packageName: pkg?.name || "" }),
          },
        });

        await sendTelegramMessage(
          chatId,
          `✅ Anda memilih paket: <b>${pkg?.name || "Program Umroh"}</b>\n\n<b>Langkah 1 dari 4:</b>\nSilakan ketikkan <b>Nama Lengkap</b> Anda (sesuai KTP / Paspor):`
        );
        return NextResponse.json({ ok: true });
      }

      // Action: Cek Berkas / Panduan Berkas
      if (data === "menu_upload_docs") {
        const latestLead = await prisma.lead.findFirst({
          where: { telegramChatId: chatId },
          orderBy: { createdAt: "desc" },
        });

        if (!latestLead) {
          await sendTelegramMessage(
            chatId,
            "⚠️ Anda belum terdaftar sebagai calon jamaah. Silakan pilih menu <b>📝 Daftar / Konsultasi</b> terlebih dahulu.",
            getMainMenuKeyboard()
          );
          return NextResponse.json({ ok: true });
        }

        // Tampilkan status berkas saat ini
        let statusMsg = `📋 <b>STATUS KELENGKAPAN BERKAS ANDA</b>\nNama: <b>${latestLead.name}</b>\n\n`;
        statusMsg += `1. KTP: ${latestLead.ktpFileUrl ? "✅ Sudah Diunggah" : "❌ Belum Ada"}\n`;
        statusMsg += `2. Kartu Keluarga: ${latestLead.familyCardFileUrl ? "✅ Sudah Diunggah" : "❌ Belum Ada"}\n`;
        statusMsg += `3. Buku Nikah: ${latestLead.marriageBookFileUrl ? "✅ Sudah Diunggah" : "⚠️ Belum Ada (Opsional)"}\n`;
        statusMsg += `4. Paspor: ${latestLead.passportFileUrl ? "✅ Sudah Diunggah" : "⏳ Belum Ada (Opsional)"}\n\n`;

        // Tentukan apa yang harus diupload sekarang
        if (!latestLead.ktpFileUrl) {
          statusMsg += "📸 <b>Mari lengkapi KTP Anda:</b>\nSilakan kirimkan <b>Foto KTP</b> Anda di chat ini sekarang.";
          await prisma.telegramSession.update({
            where: { chatId },
            data: { step: "WAITING_KTP", leadId: latestLead.id },
          });
        } else if (!latestLead.familyCardFileUrl) {
          statusMsg += "📸 <b>Mari lengkapi Kartu Keluarga:</b>\nSilakan kirimkan <b>Foto Kartu Keluarga (KK)</b> Anda di chat ini sekarang.";
          await prisma.telegramSession.update({
            where: { chatId },
            data: { step: "WAITING_KK", leadId: latestLead.id },
          });
        } else if (!latestLead.passportFileUrl) {
          statusMsg += "📸 <b>Paspor RI (Jika Ada):</b>\nSilakan kirim foto Paspor Anda, atau klik tombol di bawah jika belum punya.";
          await prisma.telegramSession.update({
            where: { chatId },
            data: { step: "WAITING_PASSPORT", leadId: latestLead.id },
          });
        } else {
          statusMsg += "🎉 <b>Alhamdulillah, semua berkas pokok Anda sudah tersimpan dengan aman!</b>\nTim travel kami sedang memverifikasi data Anda.";
        }

        await sendTelegramMessage(chatId, statusMsg);
        return NextResponse.json({ ok: true });
      }

      // Action: Skip Buku Nikah
      if (data === "skip_marriage") {
        await prisma.telegramSession.update({
          where: { chatId },
          data: { step: "WAITING_PASSPORT" },
        });

        await sendTelegramMessage(
          chatId,
          "⏩ Buku Nikah dilewati.\n\n<b>Langkah Terakhir:</b>\nApakah Anda sudah memiliki <b>Paspor RI</b> aktif?\n\n• Jika <b>Sudah</b>: Silakan kirim foto halaman identitas Paspor Anda.\n• Jika <b>Belum</b>: Klik tombol di bawah ini.",
          {
            inline_keyboard: [
              [{ text: "⏳ Belum Punya Paspor", callback_data: "skip_passport" }],
            ],
          }
        );
        return NextResponse.json({ ok: true });
      }

      // Action: Skip Paspor
      if (data === "skip_passport") {
        await prisma.telegramSession.update({
          where: { chatId },
          data: { step: "IDLE" },
        });

        await sendTelegramMessage(
          chatId,
          "🎉 <b>Alhamdulillah, Pendaftaran Selesai!</b>\n\nData dan berkas Anda sudah masuk ke sistem <b>Marketing & Pipeline Prospek</b> PT Barokah Sulthan Haramain.\n\nBagi calon jamaah yang belum memiliki Paspor, tim kami akan membantu mengeluarkan <b>Surat Rekomendasi Pembuatan Paspor Umroh ke Kantor Imigrasi</b>.\n\nKonsultan kami akan segera menghubungi Anda melalui WhatsApp. Jazakumullah khairan!",
          getMainMenuKeyboard()
        );
        return NextResponse.json({ ok: true });
      }

      // Action: Rekening Resmi
      if (data === "menu_bank") {
        const bankMsg =
          "💳 <b>REKENING RESMI PT BAROKAH SULTHAN HARAMAIN:</b>\n\n" +
          "🏦 <b>Bank Syariah Indonesia (BSI)</b>\n" +
          "No. Rekening: <code>7214673394</code>\n" +
          "Atas Nama: <b>PT BAROKAH SULTHAN HARAMAIN</b>\n\n" +
          "⚠️ <i>PENTING: Jangan melakukan pembayaran ke rekening selain atas nama resmi PT BAROKAH SULTHAN HARAMAIN. Seluruh bukti pembayaran wajib dikonfirmasi ke admin resmi kami.</i>";

        await sendTelegramMessage(chatId, bankMsg, getMainMenuKeyboard());
        return NextResponse.json({ ok: true });
      }

      // Action: Kontak & Lokasi Kantor
      if (data === "menu_contact") {
        const contactMsg =
          "📞 <b>KANTOR & KONSULTAN UMROH:</b>\n\n" +
          "🏢 <b>PT BAROKAH SULTHAN HARAMAIN</b>\n" +
          "Izin PPIU: SK Kemenkumham RI No. AHU-0007388.AH.01.01.2026\n" +
          "NIB: 1504260072814 • KBLI 79122\n\n" +
          "📍 <b>Alamat Kantor:</b>\n" +
          "Jl. Syekh Beringin Griya Palm Asri, Tebing Tinggi, Sumatera Utara\n\n" +
          "📱 <b>WhatsApp Konsultan:</b>\n" +
          "• CS 1: 0821-6733-9464\n" +
          "• CS 2: 0812-6548-2321\n" +
          "✉️ Email: barokahsulthanharamain@gmail.com";

        await sendTelegramMessage(chatId, contactMsg, getMainMenuKeyboard());
        return NextResponse.json({ ok: true });
      }

      // Action: Status Pendaftaran
      if (data === "menu_status") {
        const lead = await prisma.lead.findFirst({
          where: { telegramChatId: chatId },
          include: { package: true },
          orderBy: { createdAt: "desc" },
        });

        if (!lead) {
          await sendTelegramMessage(
            chatId,
            "Anda belum memiliki pendaftaran aktif. Silakan klik menu <b>📝 Daftar / Konsultasi</b>.",
            getMainMenuKeyboard()
          );
        } else {
          const statusLead =
            lead.status === "NEW"
              ? "🆕 Prospek Baru (Menunggu Follow-up)"
              : lead.status === "CONTACTED"
              ? "📞 Sedang Dihubungi Konsultan"
              : lead.status === "CLOSING_DP"
              ? "✅ Terverifikasi (DP Diterima)"
              : lead.status;

          const msg =
            `🔍 <b>STATUS PENDAFTARAN ANDA:</b>\n\n` +
            `Nama: <b>${lead.name}</b>\n` +
            `Program Paket: <b>${lead.package?.name || "Belum dipilih"}</b>\n` +
            `Kota Domisili: ${lead.city || "-"}\n` +
            `Jumlah Peserta: ${lead.estimatedPax} Orang\n` +
            `Status Tahap: <b>${statusLead}</b>\n\n` +
            `<b>Kelengkapan Berkas:</b>\n` +
            `• KTP: ${lead.ktpFileUrl ? "✅ Ada" : "❌ Belum Ada"}\n` +
            `• KK: ${lead.familyCardFileUrl ? "✅ Ada" : "❌ Belum Ada"}\n` +
            `• Buku Nikah: ${lead.marriageBookFileUrl ? "✅ Ada" : "Belum Ada"}\n` +
            `• Paspor: ${lead.passportFileUrl ? "✅ Ada" : "Belum Ada"}`;

          await sendTelegramMessage(chatId, msg, getMainMenuKeyboard());
        }
        return NextResponse.json({ ok: true });
      }

      // Action: Kembali ke menu utama
      if (data === "menu_main") {
        await sendTelegramMessage(
          chatId,
          "🕋 <b>Menu Utama Barokah Sulthan Haramain:</b>\nSilakan pilih layanan di bawah ini:",
          getMainMenuKeyboard()
        );
        return NextResponse.json({ ok: true });
      }
    }

    // 2. Handle Message Masuk (Text atau Media Foto/Dokumen)
    if (update.message) {
      const msg = update.message;
      const chatId = String(msg.chat.id);
      const text = msg.text?.trim() || "";

      // Cari atau buat session
      let session = await prisma.telegramSession.findUnique({
        where: { chatId },
      });
      if (!session) {
        session = await prisma.telegramSession.create({
          data: {
            chatId,
            username: msg.from?.username || "",
            firstName: msg.from?.first_name || "",
            step: "IDLE",
          },
        });
      }

      // Perintah /start atau /reset
      if (text === "/start" || text === "/reset" || text === "/menu") {
        await prisma.telegramSession.update({
          where: { chatId },
          data: { step: "IDLE", data: null },
        });

        const welcomeText =
          `Assalamu'alaikum Warahmatullahi Wabarakatuh, <b>${msg.from?.first_name || "Sahabat"}</b>! 🕋✨\n\n` +
          `Selamat datang di Layanan Informasi & Pendaftaran Digital <b>PT BAROKAH SULTHAN HARAMAIN</b>.\n\n` +
          `Kami siap membantu mewujudkan perjalanan ibadah Umroh Anda yang amanah, nyaman, dan sesuai sunnah Rasulullah ﷺ.\n\n` +
          `Silakan pilih menu di bawah ini untuk memulai:`;

        await sendTelegramMessage(chatId, welcomeText, getMainMenuKeyboard());
        return NextResponse.json({ ok: true });
      }

      // ==========================================
      // A. PERCAKAPAN FORMULIR PENDAFTARAN (TEKS)
      // ==========================================
      if (session.step === "ASKING_NAME") {
        if (!text) {
          await sendTelegramMessage(chatId, "Mohon ketikkan Nama Lengkap Anda dengan benar:");
          return NextResponse.json({ ok: true });
        }

        const currentData = JSON.parse(session.data || "{}");
        currentData.name = text.toUpperCase();

        await prisma.telegramSession.update({
          where: { chatId },
          data: {
            step: "ASKING_PHONE",
            data: JSON.stringify(currentData),
          },
        });

        await sendTelegramMessage(
          chatId,
          `Terima kasih, Bapak/Ibu <b>${currentData.name}</b>.\n\n<b>Langkah 2 dari 4:</b>\nSilakan ketikkan <b>Nomor Handphone / WhatsApp</b> aktif Anda (Contoh: <code>081234567890</code>):`
        );
        return NextResponse.json({ ok: true });
      }

      if (session.step === "ASKING_PHONE") {
        // Ambil dari teks atau contact sharing
        const phone = msg.contact?.phone_number || text;
        if (!phone || phone.length < 8) {
          await sendTelegramMessage(chatId, "Format nomor HP tidak valid. Masukkan minimal 9-13 digit angka:");
          return NextResponse.json({ ok: true });
        }

        const currentData = JSON.parse(session.data || "{}");
        currentData.phone = phone.replace(/[^0-9+]/g, "");

        await prisma.telegramSession.update({
          where: { chatId },
          data: {
            step: "ASKING_CITY",
            data: JSON.stringify(currentData),
          },
        });

        await sendTelegramMessage(
          chatId,
          "<b>Langkah 3 dari 4:</b>\nSilakan ketikkan <b>Kota / Kabupaten Domisili</b> Anda saat ini (Contoh: <code>Tebing Tinggi</code> atau <code>Medan</code>):"
        );
        return NextResponse.json({ ok: true });
      }

      if (session.step === "ASKING_CITY") {
        if (!text) {
          await sendTelegramMessage(chatId, "Ketikkan nama Kota / Kabupaten domisili Anda:");
          return NextResponse.json({ ok: true });
        }

        const currentData = JSON.parse(session.data || "{}");
        currentData.city = text.toUpperCase();

        await prisma.telegramSession.update({
          where: { chatId },
          data: {
            step: "ASKING_PAX",
            data: JSON.stringify(currentData),
          },
        });

        await sendTelegramMessage(
          chatId,
          "<b>Langkah 4 dari 4:</b>\nBerapa jumlah orang yang rencana akan berangkat bersama Anda? (Ketik angka, contoh: <code>1</code>, <code>2</code>, atau <code>4</code>):"
        );
        return NextResponse.json({ ok: true });
      }

      if (session.step === "ASKING_PAX") {
        const pax = parseInt(text, 10) || 1;
        const currentData = JSON.parse(session.data || "{}");

        // 🎯 SIMPAN LANGSUNG KE TABEL LEADS (MARKETING & PIPELINE PROSPEK)
        const newLead = await prisma.lead.create({
          data: {
            name: currentData.name,
            phone: currentData.phone,
            city: currentData.city,
            estimatedPax: pax,
            packageId: currentData.packageId || null,
            source: "TELEGRAM_BOT",
            status: "NEW",
            notes: `Prospek otomatis via Telegram Bot @sulthanharamainbot. Minat paket: ${currentData.packageName || "Umroh"}.`,
            telegramChatId: chatId,
            telegramUsername: msg.from?.username ? `@${msg.from.username}` : null,
          },
        });

        // Catat interaksi pertama di Lead CRM
        await prisma.leadInteraction.create({
          data: {
            leadId: newLead.id,
            type: "WHATSAPP",
            summary: `Pendaftaran awal via Telegram Bot. Nama: ${currentData.name}, Kota: ${currentData.city}, Pax: ${pax}.`,
          },
        });

        // Lanjut ke alur pengumpulan berkas (KTP)
        await prisma.telegramSession.update({
          where: { chatId },
          data: {
            step: "WAITING_KTP",
            leadId: newLead.id,
            data: null,
          },
        });

        const successMsg =
          `🎉 <b>Alhamdulillah, Data Anda Berhasil Dicatat!</b>\n\n` +
          `Pendaftaran Anda sudah masuk ke sistem <b>Marketing & Pipeline Prospek</b> kami.\n\n` +
          `──────────────\n` +
          `<b>PANDUAN KELENGKAPAN BERKAS</b>\n` +
          `Agar porsi pendaftaran Anda dapat diproses lebih cepat, mari kita lengkapi berkas identitas Anda.\n\n` +
          `📸 <b>Langkah 1: Silakan kirimkan FOTO KTP Anda sekarang.</b>\n` +
          `<i>(Kirim foto langsung di chat ini, pastikan foto jelas dan tidak buram)</i>`;

        await sendTelegramMessage(chatId, successMsg);
        return NextResponse.json({ ok: true });
      }

      // ==========================================
      // B. PENANGANAN MEDIA FOTO / BERKAS DOKUMEN
      // ==========================================
      const photoArray = msg.photo;
      const document = msg.document;
      const fileId = photoArray && photoArray.length > 0
        ? photoArray[photoArray.length - 1].file_id
        : document
        ? document.file_id
        : null;

      if (fileId && session.leadId) {
        const leadId = session.leadId;

        // 1. Terima KTP
        if (session.step === "WAITING_KTP") {
          const fileUrl = await downloadTelegramFile(fileId, `KTP_${leadId}`);
          if (fileUrl) {
            await prisma.lead.update({
              where: { id: leadId },
              data: { ktpFileUrl: fileUrl },
            });

            await prisma.leadInteraction.create({
              data: {
                leadId,
                type: "WHATSAPP",
                summary: `Mengunggah foto KTP via Telegram Bot (${fileUrl})`,
              },
            });

            await prisma.telegramSession.update({
              where: { chatId },
              data: { step: "WAITING_KK" },
            });

            await sendTelegramMessage(
              chatId,
              `✅ <b>Foto KTP Berhasil Diterima & Disimpan!</b>\n\n` +
              `📸 <b>Langkah 2:</b>\nSilakan kirimkan <b>Foto Kartu Keluarga (KK)</b> Anda sekarang:`
            );
            return NextResponse.json({ ok: true });
          }
        }

        // 2. Terima Kartu Keluarga
        if (session.step === "WAITING_KK") {
          const fileUrl = await downloadTelegramFile(fileId, `KK_${leadId}`);
          if (fileUrl) {
            await prisma.lead.update({
              where: { id: leadId },
              data: { familyCardFileUrl: fileUrl },
            });

            await prisma.leadInteraction.create({
              data: {
                leadId,
                type: "WHATSAPP",
                summary: `Mengunggah foto KK via Telegram Bot (${fileUrl})`,
              },
            });

            await prisma.telegramSession.update({
              where: { chatId },
              data: { step: "WAITING_MARRIAGE" },
            });

            await sendTelegramMessage(
              chatId,
              `✅ <b>Foto Kartu Keluarga Berhasil Diterima!</b>\n\n` +
              `💍 <b>Langkah 3 (Opsional):</b>\nApakah Anda berangkat bersama suami/istri dan memiliki <b>Buku Nikah</b>?\n\n` +
              `• Jika <b>Ada</b>: Kirim foto Buku Nikah sekarang.\n• Jika <b>Tidak / Berangkat Sendiri</b>: Klik tombol di bawah ini:`,
              {
                inline_keyboard: [
                  [{ text: "➡️ Lewati Buku Nikah", callback_data: "skip_marriage" }],
                ],
              }
            );
            return NextResponse.json({ ok: true });
          }
        }

        // 3. Terima Buku Nikah
        if (session.step === "WAITING_MARRIAGE") {
          const fileUrl = await downloadTelegramFile(fileId, `BUKUNIKAH_${leadId}`);
          if (fileUrl) {
            await prisma.lead.update({
              where: { id: leadId },
              data: { marriageBookFileUrl: fileUrl },
            });

            await prisma.leadInteraction.create({
              data: {
                leadId,
                type: "WHATSAPP",
                summary: `Mengunggah foto Buku Nikah via Telegram Bot (${fileUrl})`,
              },
            });

            await prisma.telegramSession.update({
              where: { chatId },
              data: { step: "WAITING_PASSPORT" },
            });

            await sendTelegramMessage(
              chatId,
              `✅ <b>Foto Buku Nikah Berhasil Diterima!</b>\n\n` +
              `📕 <b>Langkah Terakhir:</b>\nApakah Anda sudah memiliki <b>Paspor RI</b> aktif (minimal 7 bulan)?\n\n` +
              `• Jika <b>Sudah</b>: Silakan kirimkan foto halaman data identitas Paspor Anda.\n• Jika <b>Belum Punya</b>: Klik tombol di bawah:`,
              {
                inline_keyboard: [
                  [{ text: "⏳ Belum Punya Paspor", callback_data: "skip_passport" }],
                ],
              }
            );
            return NextResponse.json({ ok: true });
          }
        }

        // 4. Terima Paspor
        if (session.step === "WAITING_PASSPORT") {
          const fileUrl = await downloadTelegramFile(fileId, `PASPOR_${leadId}`);
          if (fileUrl) {
            await prisma.lead.update({
              where: { id: leadId },
              data: { passportFileUrl: fileUrl },
            });

            await prisma.leadInteraction.create({
              data: {
                leadId,
                type: "WHATSAPP",
                summary: `Mengunggah foto Paspor via Telegram Bot (${fileUrl})`,
              },
            });

            await prisma.telegramSession.update({
              where: { chatId },
              data: { step: "IDLE" },
            });

            await sendTelegramMessage(
              chatId,
              `🎉 <b>Alhamdulillah, Seluruh Berkas Berhasil Diterima!</b>\n\n` +
              `Semua dokumen Anda (KTP, KK, Buku Nikah, Paspor) telah tersimpan secara aman di sistem <b>Marketing & Pipeline</b> kami.\n\n` +
              `Konsultan PT Barokah Sulthan Haramain akan segera memverifikasi dan menghubungi Anda melalui WhatsApp. Terima kasih telah mempercayakan ibadah Anda kepada kami.`,
              getMainMenuKeyboard()
            );
            return NextResponse.json({ ok: true });
          }
        }
      }

      // Jika pesan tidak dikenal dan bukan dalam sesi
      if (session.step === "IDLE") {
        await sendTelegramMessage(
          chatId,
          "Ketik <b>/start</b> untuk membuka Menu Layanan Informasi & Pendaftaran Umroh kami.",
          getMainMenuKeyboard()
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in telegram webhook:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
