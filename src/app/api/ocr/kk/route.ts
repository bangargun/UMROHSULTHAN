import { NextResponse } from "next/server";
import { createWorker } from "tesseract.js";

interface KkMember {
  name: string;
  nik: string;
  gender: "MALE" | "FEMALE";
  birthPlace: string;
  birthDate: string;
  religion?: string;
  maritalStatus?: string;
  relation: string; // KEPALA KELUARGA, ISTRI, ANAK, AYAH, IBU, FAMILI LAIN
  fatherName?: string;
  motherName?: string;
}

interface KkParsedResult {
  noKk?: string;
  headOfFamily?: string;
  address?: string;
  rtRw?: string;
  village?: string;
  district?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  members: KkMember[];
  rawText: string;
}

function parseKkText(rawText: string): KkParsedResult {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const fullText = rawText.replace(/\r/g, "");

  const result: KkParsedResult = {
    members: [],
    rawText,
  };

  // 1. Nomor KK (16 digit)
  const kkMatch = fullText.match(/(?:No\.?\s*KK|Kartu Keluarga|No\.)\s*[:=\-]?\s*([0-9IlDOoS]{16})/i) ||
    fullText.match(/\b([1-9][0-9]{15})\b/);
  if (kkMatch) {
    let cleanKk = (kkMatch[1] || kkMatch[0])
      .replace(/[Il]/g, "1")
      .replace(/[OoD]/g, "0")
      .replace(/[S]/g, "5")
      .replace(/[^0-9]/g, "");
    if (cleanKk.length >= 16) {
      result.noKk = cleanKk.slice(0, 16);
    }
  }

  // 2. Nama Kepala Keluarga
  const headMatch = fullText.match(/(?:Nama Kepala Keluarga|Kepala Keluarga)\s*[:=\-]?\s*([^\n\r]+)/i);
  if (headMatch) {
    result.headOfFamily = headMatch[1].replace(/[^a-zA-Z\s\.,']/g, "").trim();
  }

  // 3. Alamat, RT/RW, Kelurahan, Kecamatan, Kota
  const addrMatch = fullText.match(/(?:Alamat)\s*[:=\-]?\s*([^\n\r]+)/i);
  if (addrMatch) {
    result.address = addrMatch[1].trim();
  }

  const rtrwMatch = fullText.match(/(?:RT\/RW|RT|RW)\s*[:=\-]?\s*([0-9\/\s\-]+)/i);
  if (rtrwMatch) {
    result.rtRw = rtrwMatch[1].trim();
  }

  const desaMatch = fullText.match(/(?:Desa\/Kelurahan|Kelurahan|Desa)\s*[:=\-]?\s*([^\n\r]+)/i);
  if (desaMatch) {
    result.village = desaMatch[1].replace(/[^a-zA-Z\s]/g, "").trim();
  }

  const kecMatch = fullText.match(/(?:Kecamatan)\s*[:=\-]?\s*([^\n\r]+)/i);
  if (kecMatch) {
    result.district = kecMatch[1].replace(/[^a-zA-Z\s]/g, "").trim();
  }

  const kotaMatch = fullText.match(/(?:Kabupaten\/Kota|Kabupaten|Kota)\s*[:=\-]?\s*([^\n\r]+)/i);
  if (kotaMatch) {
    result.city = kotaMatch[1].replace(/[^a-zA-Z\s]/g, "").trim();
  }

  const provMatch = fullText.match(/(?:Provinsi)\s*[:=\-]?\s*([^\n\r]+)/i);
  if (provMatch) {
    result.province = provMatch[1].replace(/[^a-zA-Z\s]/g, "").trim();
  }

  // 4. Extract Family Members Table Lines
  // Search for 16-digit NIK occurrences and surrounding text
  const nikRegex = /\b([1-9][0-9]{15})\b/g;
  let match;
  const foundNiks: string[] = [];

  while ((match = nikRegex.exec(fullText)) !== null) {
    const nik = match[1];
    // Skip if it's the No. KK itself
    if (result.noKk && nik === result.noKk) continue;
    if (!foundNiks.includes(nik)) {
      foundNiks.push(nik);
    }
  }

  // Parse lines to associate names and metadata with NIKs
  lines.forEach((line, idx) => {
    // Check if line contains a 16-digit NIK
    const lineNikMatch = line.match(/\b([1-9][0-9]{15})\b/);
    if (lineNikMatch) {
      const nik = lineNikMatch[1];
      if (result.noKk && nik === result.noKk) return;

      // Extract Name (letters before or around NIK)
      let name = line.replace(nik, "").replace(/[0-9\-\.\/]/g, "").trim();
      // If name is too short, check previous line
      if (name.length < 3 && lines[idx - 1]) {
        name = lines[idx - 1].replace(/[0-9\-\.\/]/g, "").trim();
      }

      // Determine gender
      let gender: "MALE" | "FEMALE" = "MALE";
      if (/PEREMPUAN|WANITA|P\b/i.test(line) || (lines[idx + 1] && /PEREMPUAN|WANITA/i.test(lines[idx + 1]))) {
        gender = "FEMALE";
      }

      // Determine relation (Kepala Keluarga, Istri, Anak)
      let relation = "KEPALA KELUARGA";
      if (/ISTRI/i.test(line) || (lines[idx + 1] && /ISTRI/i.test(lines[idx + 1]))) {
        relation = "ISTRI";
      } else if (/ANAK/i.test(line) || (lines[idx + 1] && /ANAK/i.test(lines[idx + 1]))) {
        relation = "ANAK";
      } else if (/ORANG TUA|AYAH|IBU/i.test(line)) {
        relation = "ORANG TUA";
      }

      // Check if already in member list
      if (!result.members.some((m) => m.nik === nik)) {
        result.members.push({
          nik,
          name: name || `Anggota Keluarga (${result.members.length + 1})`,
          gender,
          birthPlace: result.city || "Jakarta",
          birthDate: "1990-01-01",
          relation,
        });
      }
    }
  });

  // If no NIKs were parsed from OCR table, fallback create at least Kepala Keluarga
  if (result.members.length === 0 && result.headOfFamily) {
    result.members.push({
      nik: result.noKk || "",
      name: result.headOfFamily,
      gender: "MALE",
      birthPlace: result.city || "Jakarta",
      birthDate: "1985-01-01",
      relation: "KEPALA KELUARGA",
    });
  }

  return result;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const base64Image = formData.get("image") as string | null;

    let imageBuffer: Buffer;

    if (file) {
      const bytes = await file.arrayBuffer();
      imageBuffer = Buffer.from(bytes);
    } else if (base64Image) {
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
      imageBuffer = Buffer.from(base64Data, "base64");
    } else {
      return NextResponse.json(
        { error: "File gambar Kartu Keluarga (KK) wajib diunggah." },
        { status: 400 }
      );
    }

    // Initialize Tesseract Worker
    const worker = await createWorker(["ind", "eng"]);
    const ret = await worker.recognize(imageBuffer);
    await worker.terminate();

    const rawText = ret.data.text;
    const parsedData = parseKkText(rawText);

    return NextResponse.json({
      success: true,
      data: parsedData,
      rawTextLength: rawText.length,
    });
  } catch (error: any) {
    console.error("Error in KK OCR API:", error);
    return NextResponse.json(
      { error: "Gagal memproses gambar Kartu Keluarga: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
}
