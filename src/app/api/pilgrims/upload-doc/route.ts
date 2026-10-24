import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "paspor"; // "paspor" | "vaksin"
    const pilgrimName = (formData.get("pilgrimName") as string) || "JAMAAH";

    if (!file) {
      return NextResponse.json({ success: false, error: "File tidak ditemukan" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Folder tujuan di public/uploads/docs/
    const subFolder = type === "vaksin" ? "vaksin" : "paspor";
    const uploadDir = path.join(process.cwd(), "public", "uploads", subFolder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.name) || (file.type.includes("pdf") ? ".pdf" : ".jpg");
    const cleanName = pilgrimName.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
    const fileName = `${Date.now()}_${cleanName}_${subFolder.toUpperCase()}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${subFolder}/${fileName}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName,
    });
  } catch (err: any) {
    console.error("Gagal upload dokumen visa:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
