import fs from "fs";
import path from "path";
import { Readable } from "stream";

export const GOOGLE_DRIVE_MAIN_FOLDER_ID =
  process.env.GOOGLE_DRIVE_FOLDER_ID || "161j-oTJ8WgbCYRKsxXCST3wE7CAHU3XY";

// Inisialisasi Google Drive Client jika service account JSON tersedia
let driveClient: any = null;

async function getGoogleDriveClient() {
  if (driveClient) return driveClient;

  try {
    const { google } = await import("googleapis");
    const serviceAccountPath = path.join(process.cwd(), "google-service-account.json");

    let auth;
    if (fs.existsSync(serviceAccountPath)) {
      auth = new google.auth.GoogleAuth({
        keyFile: serviceAccountPath,
        scopes: ["https://www.googleapis.com/auth/drive"],
      });
    } else if (
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    ) {
      auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/drive"],
      });
    }

    if (auth) {
      driveClient = google.drive({ version: "v3", auth });
      return driveClient;
    }
  } catch (err) {
    // Google Drive library not configured yet, use local storage fallback
  }
  return null;
}

/**
 * Mendapatkan URL folder Google Drive resmi
 */
export function getGoogleDriveFolderUrl(folderId: string = GOOGLE_DRIVE_MAIN_FOLDER_ID): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

/**
 * Menyimpan berkas unggahan (KTP, Paspor, Bukti Transfer)
 * Otomatis upload ke Google Drive jika service account aktif,
 * atau menyimpan di penyimpanan lokal sebagai fallback aman.
 */
export async function saveUploadedFile({
  fileBase64,
  fileName,
  subFolder = "registrations",
  targetFolderId = GOOGLE_DRIVE_MAIN_FOLDER_ID,
}: {
  fileBase64: string;
  fileName: string;
  subFolder?: string;
  targetFolderId?: string;
}): Promise<{ fileUrl: string; driveFolderUrl: string; driveFileId?: string }> {
  try {
    // 1. Bersihkan header base64 dan siapkan Buffer
    const base64Data = fileBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // 2. Simpan backup lokal terlebih dahulu
    const uploadDir = path.join(process.cwd(), "public", "uploads", subFolder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadDir, safeName);
    fs.writeFileSync(filePath, buffer);
    let fileUrl = `/uploads/${subFolder}/${safeName}`;

    // 3. Coba upload langsung ke Google Drive jika Google Drive API aktif
    const drive = await getGoogleDriveClient();
    let driveFileId: string | undefined;

    if (drive && targetFolderId) {
      try {
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        const response = await drive.files.create({
          requestBody: {
            name: fileName,
            parents: [targetFolderId],
          },
          media: {
            mimeType: "image/jpeg",
            body: stream,
          },
          fields: "id, webViewLink, webContentLink",
        });

        if (response.data && response.data.id) {
          driveFileId = response.data.id;
          fileUrl = response.data.webViewLink || fileUrl;
          console.log(`[Google Drive] Berkas ${fileName} berhasil diunggah ke Google Drive (ID: ${driveFileId})`);
        }
      } catch (uploadErr) {
        console.error("[Google Drive] Upload ke Google Drive gagal, menggunakan link lokal:", uploadErr);
      }
    }

    return {
      fileUrl,
      driveFolderUrl: getGoogleDriveFolderUrl(targetFolderId),
      driveFileId,
    };
  } catch (error) {
    console.error("Error saving uploaded file:", error);
    throw error;
  }
}
