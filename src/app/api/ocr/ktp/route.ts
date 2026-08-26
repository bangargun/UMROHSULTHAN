import { NextResponse } from "next/server";
import { createWorker } from "tesseract.js";

// Helper function to extract KTP fields using comprehensive regex heuristics
function parseKtpText(rawText: string) {
  const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
  const fullText = rawText.replace(/\r/g, "");

  const result: {
    nik?: string;
    name?: string;
    birthPlace?: string;
    birthDate?: string;
    gender?: "MALE" | "FEMALE";
    address?: string;
    rtRw?: string;
    village?: string;
    district?: string;
    religion?: string;
    maritalStatus?: string;
    occupation?: string;
    bloodType?: string;
    rawText: string;
  } = { rawText };

  // 1. NIK: 16-digit number
  const nikMatch = fullText.match(/\b([1-9][0-9]{15})\b/) || fullText.match(/NIK\s*[:=\-]?\s*([0-9IlDOoS]{16})/i);
  if (nikMatch) {
    // Clean common OCR misreads in numbers (I/l -> 1, O/D -> 0, S -> 5)
    let cleanNik = (nikMatch[1] || nikMatch[0])
      .replace(/[Il]/g, "1")
      .replace(/[OoD]/g, "0")
      .replace(/[S]/g, "5")
      .replace(/[^0-9]/g, "");
    if (cleanNik.length >= 16) {
      result.nik = cleanNik.slice(0, 16);
    }
  }

  // 2. NAMA
  const nameLineMatch = fullText.match(/(?:Nama|NAMA)\s*[:=\-]?\s*([^\n\r]+)/i);
  if (nameLineMatch) {
    result.name = nameLineMatch[1]
      .replace(/[^a-zA-Z\s\.,']/g, "")
      .replace(/\s+/g, " ")
      .trim();
  } else {
    // Fallback: look for line right below NIK
    const nikIndex = lines.findIndex(l => l.toUpperCase().includes("NIK") || /\d{14,}/.test(l));
    if (nikIndex !== -1 && lines[nikIndex + 1]) {
      const candidate = lines[nikIndex + 1].replace(/Nama\s*[:=\-]?/i, "").trim();
      if (candidate.length > 2 && !/\d/.test(candidate)) {
        result.name = candidate;
      }
    }
  }

  // 3. Tempat / Tgl Lahir (e.g., "JAKARTA, 23-04-1985" or "SURABAYA, 01/01/1990")
  const ttlMatch = fullText.match(/(?:Tempat\/Tgl Lahir|Tempat\/Tgl|Lahir)\s*[:=\-]?\s*([a-zA-Z\s]+)[,\s]+(\d{1,2}[\-\/\s\.]\d{1,2}[\-\/\s\.]\d{4})/i);
  if (ttlMatch) {
    result.birthPlace = ttlMatch[1].trim();
    const rawDate = ttlMatch[2].replace(/[\/\s\.]/g, "-");
    const dateParts = rawDate.split("-");
    if (dateParts.length === 3) {
      const day = dateParts[0].padStart(2, "0");
      const month = dateParts[1].padStart(2, "0");
      const year = dateParts[2];
      result.birthDate = `${year}-${month}-${day}`;
    }
  }

  // 4. Jenis Kelamin (LAKI-LAKI / PEREMPUAN)
  if (/LAKI|PRIA/i.test(fullText)) {
    result.gender = "MALE";
  } else if (/PEREMPUAN|WANITA/i.test(fullText)) {
    result.gender = "FEMALE";
  }

  // 5. Golongan Darah (Gol. Darah : A / B / AB / O)
  const bloodMatch = fullText.match(/(?:Gol\.?\s*Darah|Darah)\s*[:=\-]?\s*([ABO0]{1,2})/i);
  if (bloodMatch) {
    let blood = bloodMatch[1].toUpperCase().replace("0", "O");
    if (["A", "B", "AB", "O"].includes(blood)) {
      result.bloodType = blood;
    }
  }

  // 6. Alamat Lengkap
  const addrMatch = fullText.match(/(?:Alamat)\s*[:=\-]?\s*([^\n\r]+)/i);
  if (addrMatch) {
    result.address = addrMatch[1].trim();
  }

  const rtrwMatch = fullText.match(/(?:RT\/RW|RTRW)\s*[:=\-]?\s*([0-9\/\s\-]+)/i);
  if (rtrwMatch) {
    result.rtRw = rtrwMatch[1].trim();
  }

  const kelMatch = fullText.match(/(?:Kel\/Desa|Kelurahan|Desa)\s*[:=\-]?\s*([^\n\r]+)/i);
  if (kelMatch) {
    result.village = kelMatch[1].trim();
  }

  const kecMatch = fullText.match(/(?:Kecamatan)\s*[:=\-]?\s*([^\n\r]+)/i);
  if (kecMatch) {
    result.district = kecMatch[1].trim();
  }

  // If address exists, combine with RT/RW, Kel, Kec
  let fullAddressParts: string[] = [];
  if (result.address) fullAddressParts.push(result.address);
  if (result.rtRw) fullAddressParts.push(`RT/RW ${result.rtRw}`);
  if (result.village) fullAddressParts.push(`Kel. ${result.village}`);
  if (result.district) fullAddressParts.push(`Kec. ${result.district}`);
  if (fullAddressParts.length > 1) {
    result.address = fullAddressParts.join(", ");
  }

  // 7. Agama
  const religionMatch = fullText.match(/(?:Agama)\s*[:=\-]?\s*([^\n\r]+)/i);
  if (religionMatch) {
    result.religion = religionMatch[1].trim();
  }

  // 8. Status Perkawinan
  const maritalMatch = fullText.match(/(?:Status Perkawinan|Perkawinan)\s*[:=\-]?\s*([^\n\r]+)/i);
  if (maritalMatch) {
    result.maritalStatus = maritalMatch[1].trim();
  }

  // 9. Pekerjaan
  const jobMatch = fullText.match(/(?:Pekerjaan)\s*[:=\-]?\s*([^\n\r]+)/i);
  if (jobMatch) {
    result.occupation = jobMatch[1].trim();
  }

  return result;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const base64Image = formData.get("image") as string | null;

    let imageInput: string | Buffer | null = null;

    if (file) {
      const bytes = await file.arrayBuffer();
      imageInput = Buffer.from(bytes);
    } else if (base64Image) {
      imageInput = base64Image;
    }

    if (!imageInput) {
      return NextResponse.json({ error: "File foto KTP wajib disertakan" }, { status: 400 });
    }

    console.log("🔍 Processing KTP OCR Image with Tesseract...");
    const worker = await createWorker("ind+eng");
    const { data: { text } } = await worker.recognize(imageInput);
    await worker.terminate();

    console.log("📝 Extracted OCR Raw Text:\n", text);
    const parsedData = parseKtpText(text);

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    console.error("KTP OCR Error:", error);
    return NextResponse.json({
      error: "Gagal memproses pembacaan foto KTP. Pastikan gambar jelas dan tidak buram.",
    }, { status: 500 });
  }
}
