import fs from "fs";
import path from "path";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8857243171:AAHmGmUDwLmxThPHEwfoJMvowSGjTmSeVng";
const TELEGRAM_API_BASE = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const TELEGRAM_FILE_BASE = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}`;

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  replyMarkup?: any
) {
  try {
    const payload: any = {
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const res = await fetch(`${TELEGRAM_API_BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error("Telegram sendMessage error:", data);
    }
    return data;
  } catch (error) {
    console.error("Failed to send telegram message:", error);
    return null;
  }
}

export async function answerTelegramCallback(
  callbackQueryId: string,
  text?: string
) {
  try {
    const payload: any = { callback_query_id: callbackQueryId };
    if (text) payload.text = text;

    await fetch(`${TELEGRAM_API_BASE}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Failed to answer callback query:", error);
  }
}

export async function downloadTelegramFile(fileId: string, prefix: string): Promise<string | null> {
  try {
    // 1. Get file path from Telegram
    const getFileRes = await fetch(`${TELEGRAM_API_BASE}/getFile?file_id=${fileId}`);
    const fileData = await getFileRes.json();

    if (!fileData.ok || !fileData.result?.file_path) {
      console.error("Telegram getFile failed:", fileData);
      return null;
    }

    const remoteFilePath = fileData.result.file_path;
    const ext = path.extname(remoteFilePath) || ".jpg";
    const filename = `${prefix}_${Date.now()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "leads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const localFilePath = path.join(uploadDir, filename);

    // 2. Download binary stream
    const downloadUrl = `${TELEGRAM_FILE_BASE}/${remoteFilePath}`;
    const downloadRes = await fetch(downloadUrl);
    if (!downloadRes.ok) {
      console.error("Failed to download file stream from Telegram:", downloadRes.statusText);
      return null;
    }

    const arrayBuffer = await downloadRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(localFilePath, buffer);

    // Return public URL path
    return `/uploads/leads/${filename}`;
  } catch (error) {
    console.error("Error downloading telegram file:", error);
    return null;
  }
}
