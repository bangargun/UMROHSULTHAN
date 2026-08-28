import fs from "fs";
import path from "path";

export const GOOGLE_DRIVE_MAIN_FOLDER_ID =
  process.env.GOOGLE_DRIVE_FOLDER_ID || "161j-oTJ8WgbCYRKsxXCST3wE7CAHU3XY";

/**
 * Mendapatkan URL folder Google Drive resmi
 */
export function getGoogleDriveFolderUrl(folderId: string = GOOGLE_DRIVE_MAIN_FOLDER_ID): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

/**
 * Menyimpan berkas unggahan (KTP, Paspor, Bukti Transfer)
 * dengan penamaan standar dan direktori terisolasi
 */
export async function saveUploadedFile({
  fileBase64,
  fileName,
  subFolder = "registrations",
}: {
  fileBase64: string;
  fileName: string;
  subFolder?: string;
}): Promise<{ fileUrl: string; driveFolderUrl: string }> {
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", subFolder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Bersihkan header base64 jika ada
    const base64Data = fileBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadDir, safeName);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${subFolder}/${safeName}`;
    const driveFolderUrl = getGoogleDriveFolderUrl(GOOGLE_DRIVE_MAIN_FOLDER_ID);

    return {
      fileUrl,
      driveFolderUrl,
    };
  } catch (error) {
    console.error("Error saving uploaded file:", error);
    throw error;
  }
}
