import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const packageId = searchParams.get("packageId");
    const docType = searchParams.get("type") || "all"; // "paspor" | "vaksin" | "all"

    if (!packageId) {
      return NextResponse.json({ success: false, error: "Package ID wajib disertakan" }, { status: 400 });
    }

    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        pilgrims: {
          orderBy: { name: "asc" },
        },
      },
    });

    if (!pkg) {
      return NextResponse.json({ success: false, error: "Paket tidak ditemukan" }, { status: 404 });
    }

    // Direktori temporary untuk mengumpulkan file
    const tempDir = path.join("/tmp", `batch_docs_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    fs.mkdirSync(tempDir, { recursive: true });

    let collectedCount = 0;

    pkg.pilgrims.forEach((p, idx) => {
      const num = String(idx + 1).padStart(2, "0");
      const cleanName = p.name.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();

      // Paspor
      if ((docType === "paspor" || docType === "all") && p.passportFileUrl) {
        let sourcePath = "";
        if (p.passportFileUrl.startsWith("/uploads/")) {
          sourcePath = path.join(process.cwd(), "public", p.passportFileUrl);
        } else if (p.passportFileUrl.startsWith("/")) {
          sourcePath = path.join(process.cwd(), "public", p.passportFileUrl);
        }

        if (sourcePath && fs.existsSync(sourcePath)) {
          const ext = path.extname(sourcePath) || ".jpg";
          const passNo = p.passportNumber ? `_${p.passportNumber}` : "";
          const destName = `${num}_${cleanName}_PASPOR${passNo}${ext}`;
          fs.copyFileSync(sourcePath, path.join(tempDir, destName));
          collectedCount++;
        }
      }

      // Vaksin
      if ((docType === "vaksin" || docType === "all") && p.vaccineCardFileUrl) {
        let sourcePath = "";
        if (p.vaccineCardFileUrl.startsWith("/uploads/")) {
          sourcePath = path.join(process.cwd(), "public", p.vaccineCardFileUrl);
        } else if (p.vaccineCardFileUrl.startsWith("/")) {
          sourcePath = path.join(process.cwd(), "public", p.vaccineCardFileUrl);
        }

        if (sourcePath && fs.existsSync(sourcePath)) {
          const ext = path.extname(sourcePath) || ".jpg";
          const destName = `${num}_${cleanName}_VAKSIN_ICV${ext}`;
          fs.copyFileSync(sourcePath, path.join(tempDir, destName));
          collectedCount++;
        }
      }
    });

    if (collectedCount === 0) {
      // Hapus folder temp
      fs.rmSync(tempDir, { recursive: true, force: true });
      return NextResponse.json(
        { success: false, error: "Belum ada berkas scan yang diunggah untuk jemaah di paket ini." },
        { status: 400 }
      );
    }

    // Zip file
    const zipFileName = `BERKAS_${docType.toUpperCase()}_${pkg.name.replace(/[^a-zA-Z0-9]/g, "_")}.zip`;
    const zipFilePath = path.join("/tmp", zipFileName);

    // Jalankan zip bawaan sistem
    execSync(`cd "${tempDir}" && zip -r "${zipFilePath}" .`);

    const zipBuffer = fs.readFileSync(zipFilePath);

    // Bersihkan temporary
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.unlinkSync(zipFilePath);

    return new Response(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFileName}"`,
      },
    });
  } catch (err: any) {
    console.error("Gagal membuat batch zip dokumen:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
