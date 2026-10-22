const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8857243171:AAHmGmUDwLmxThPHEwfoJMvowSGjTmSeVng";
const API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function main() {
  console.log("==========================================================");
  console.log("  🤖 SULTHAN UMROH - TELEGRAM BOT LOCAL RUNNER");
  console.log("  Target: http://localhost:3005/api/telegram/webhook");
  console.log("==========================================================");

  // 1. Matikan Webhook sementara agar mode getUpdates aktif
  try {
    const res = await fetch(`${API_URL}/deleteWebhook`);
    const data = await res.json();
    console.log("ℹ️ Status Webhook:", data.description || "Cleared for local polling");
  } catch (err) {
    console.error("Gagal membersihkan webhook:", err.message);
  }

  console.log("✅ Bot @sulthanharamainbot AKTIF & TERHUBUNG KE LOCAL!");
  console.log("📱 Buka Telegram di HP Anda, cari @sulthanharamainbot dan ketik: /start");
  console.log("   (Tekan Ctrl+C di terminal ini jika ingin menghentikan)");
  console.log("----------------------------------------------------------");

  let offset = 0;
  while (true) {
    try {
      const res = await fetch(`${API_URL}/getUpdates?offset=${offset}&timeout=25`);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;

          const sender = update.message?.from?.first_name || update.callback_query?.from?.first_name || "User";
          const text = update.message?.text || update.callback_query?.data || (update.message?.photo ? "[FOTO DOKUMEN]" : "[MEDIA]");
          console.log(`📩 Pesan masuk dari [${sender}]: ${text}`);

          // Teruskan ke API Webhook Local
          try {
            const hookRes = await fetch("http://localhost:3005/api/telegram/webhook", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(update),
            });
            if (!hookRes.ok) {
              console.error(`⚠️ Webhook local merespons status: ${hookRes.status}`);
            }
          } catch (postErr) {
            console.error("❌ Gagal mengirim ke local server (pastikan npm run dev aktif di port 3005):", postErr.message);
          }
        }
      }
    } catch (loopErr) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

main().catch(console.error);
