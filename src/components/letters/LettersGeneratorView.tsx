"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Printer,
  X,
  Sparkles,
  Building,
  Plane,
  UserCheck,
  Calendar,
  Trash2,
  FilePlus,
  CheckCircle2,
  Pencil,
  Edit3,
  Shield,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Pagination from "@/components/common/Pagination";

interface LettersGeneratorViewProps {
  letters: any[];
  pilgrims: any[];
  onRefresh: () => void;
  initialPilgrim?: any;
}

export default function LettersGeneratorView({
  letters,
  pilgrims,
  onRefresh,
  initialPilgrim,
}: LettersGeneratorViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(!!initialPilgrim);
  const [editingLetter, setEditingLetter] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLetterForPrint, setSelectedLetterForPrint] = useState<any | null>(null);
  const [includeLetterhead, setIncludeLetterhead] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(true);
  const [includeLegalAttachments, setIncludeLegalAttachments] = useState(true);
  const [paperSize, setPaperSize] = useState<"A4" | "F4_216" | "F4_215" | "Letter">("A4");
  const [letterFontSize, setLetterFontSize] = useState<"12pt" | "11pt" | "10.5pt" | "10pt">("11pt");
  const [printScale, setPrintScale] = useState<number>(100);
  const [includeMeterai, setIncludeMeterai] = useState<boolean>(true);
  const [marginPreset, setMarginPreset] = useState<"standar" | "lebar" | "sedang" | "kompak" | "kustom">("standar");
  const [customMarginLeft, setCustomMarginLeft] = useState(25);
  const [customMarginRight, setCustomMarginRight] = useState(20);
  const [customMarginTop, setCustomMarginTop] = useState(12);
  const [customMarginBottom, setCustomMarginBottom] = useState(10);

  const getMargins = () => {
    if (marginPreset === "lebar") {
      return { top: 16, right: 25, bottom: 14, left: 30 };
    }
    if (marginPreset === "sedang") {
      return { top: 12, right: 18, bottom: 10, left: 22 };
    }
    if (marginPreset === "kompak") {
      return { top: 10, right: 14, bottom: 8, left: 18 };
    }
    if (marginPreset === "kustom") {
      return {
        top: Math.max(5, customMarginTop),
        right: Math.max(5, customMarginRight),
        bottom: Math.max(5, customMarginBottom),
        left: Math.max(5, customMarginLeft),
      };
    }
    // Standar Resmi PPIU (Kiri 25mm, Kanan 20mm, Atas 12mm, Bawah 10mm)
    return { top: 12, right: 20, bottom: 10, left: 25 };
  };
  const [travelSettings, setTravelSettings] = useState<any>({
    companyName: "PT BAROKAH SULTHAN HARAMAIN",
    licenseNumber: "25052200384080005",
    kemenhanLicense: "Keputusan Menteri Hukum Republik Indonesia NOMOR AHU-0007388.AH.01.01.TAHUN 2026",
    address: "Jl. Pahlawan No.10 J, Ps. Gambir, Kec. Tebing Tinggi Kota, Kota Tebing Tinggi, Sumatera Utara 20631",
    phone: "0821-6733-9464",
    email: "barokahsulthanharamain@gmail.com",
    directorName: "ATIYATUL AMRA",
    directorTitle: "Direktur Utama",
  });

  const [letterTemplates, setLetterTemplates] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([fetch("/api/settings"), fetch("/api/letters/templates")])
      .then(async ([sRes, lRes]) => {
        const sData = await sRes.json();
        const lData = await lRes.json();
        if (sData && sData.companyName) {
          setTravelSettings(sData);
          setFormData((prev) => ({
            ...prev,
            generatedBy: sData.directorName || prev.generatedBy,
          }));
        }
        if (lData && Array.isArray(lData)) {
          setLetterTemplates(lData);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  // Form states
  const [formData, setFormData] = useState({
    pilgrimId: initialPilgrim?.id || pilgrims[0]?.id || "",
    type: "SURAT_ENDORSEMENT_PASPOR",
    customTitle: "",
    customSubject: "",
    customBody: "",
    destinationInstitution: "Kepala Kantor Imigrasi Kelas I Khusus",
    applicantJobTitle: "Karyawan Swasta",
    letterCity: "Tebing Tinggi",
    fatherName: initialPilgrim?.fatherName || "",
    endorsedTargetName: "",
    nrp: "",
    pangkat: "",
    kesatuan: "",
    familyCompanion: "",
    returnDate: "",
    customNotes: "Permohonan penambahan nama pada halaman pengesahan paspor untuk syarat Visa Umroh.",
    generatedBy: "ATIYATUL AMRA",
  });

  const [editFormData, setEditFormData] = useState({
    pilgrimId: "",
    type: "SURAT_ENDORSEMENT_PASPOR",
    customTitle: "",
    customSubject: "",
    customBody: "",
    destinationInstitution: "",
    applicantJobTitle: "Karyawan Swasta",
    letterCity: "Tebing Tinggi",
    fatherName: "",
    endorsedTargetName: "",
    nrp: "",
    pangkat: "",
    kesatuan: "",
    familyCompanion: "",
    returnDate: "",
    customNotes: "",
    generatedBy: "ATIYATUL AMRA",
  });

  const [loading, setLoading] = useState(false);

  // Helper to compute endorsement name: [Nama Jamaah] + [Nama Orang Tua Laki-laki]
  const computeEndorsementName = (pName: string, fName: string) => {
    const cleanName = (pName || "").trim();
    const cleanFather = (fName || "").trim();
    if (!cleanFather) return cleanName.toUpperCase();
    return `${cleanName} ${cleanFather}`.replace(/\s+/g, " ").toUpperCase();
  };

  // Helper to clean duplicate "Kepada" or "Yth" in destination
  const cleanDestination = (dest: string) => {
    if (!dest) return "Bapak / Ibu Pimpinan Instansi Terkait";
    let d = dest.trim();
    d = d.replace(/^kepada\s+yth\.?\s*:?\s*/i, "");
    d = d.replace(/^kepada\s+/i, "");
    d = d.replace(/^yth\.?\s*:?\s*/i, "");
    return d;
  };

  // Helper to get formal Perihal (Subject) based on letter type
  const getPrintSubject = (letter: any) => {
    if (!letter) return "Surat Resmi PPIU";
    if (letter.type === "SURAT_UNDANGAN_MANASIK") {
      return letter.customSubject || "Undangan Bimbingan Manasik Ibadah Umroh & Pembagian Perlengkapan";
    }
    if (letter.type === "SURAT_UNDANGAN_HALAL_BIHALAL") {
      return letter.customSubject || "Undangan Silaturahmi, Temu Alumni & Halal Bi Halal Pasca Umroh";
    }
    if (letter.type === "SURAT_PERPANJANG_PASPOR" || (letter.customTitle && /perpanjang/i.test(letter.customTitle))) {
      return "Permohonan Perpanjangan / Penggantian Paspor Calon Jemaah Umrah";
    }
    if (letter.type === "SURAT_ENDORSEMENT_PASPOR" || (letter.customTitle && /endorse/i.test(letter.customTitle))) {
      return "Permohonan Penambahan / Endorsement Nama pada Paspor";
    }
    if (letter.type === "SURAT_REKOMENDASI_PASPOR") {
      return "Permohonan Rekomendasi Paspor Calon Jemaah Umrah";
    }
    if (letter.type === "SURAT_IZIN_CUTI_TNI_POLRI") {
      return letter.customSubject || "Pemberitahuan Umroh";
    }
    return letter.customSubject || getLetterTitle(letter);
  };

  // Smart Formatted Letter Body Renderer (Aligns key-values into neat official format and formats paragraphs)
  const renderFormattedLetterBody = (text: string) => {
    if (!text) return null;

    const isKVLine = (line: string) => {
      const colonIdx = line.indexOf(":");
      if (colonIdx <= 0 || colonIdx >= 45) return false;
      if (line.startsWith("http") || /^\d+\.\s/.test(line)) return false;
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      if (!val || val.length === 0) return false;
      if (/^(saya|kami|adapun|sehubungan|bersama|dengan|mengingat|atas|permohonan|menimbang)\b/i.test(key)) return false;
      return true;
    };

    // Split text into paragraph blocks by 2 or more newlines
    const blocks = text.split(/\n\s*\n/);

    return (
      <div className="space-y-1 text-inherit text-black text-justify font-serif leading-[1.28]">
        {blocks.map((block, bIdx) => {
          const trimmed = block.trim();
          if (!trimmed) return null;

          // Check if paragraph is Islamic greeting (Assalamu'alaikum)
          if (/^assalamu[’']?alaikum/i.test(trimmed)) {
            return (
              <p key={bIdx} className="font-bold italic text-black pt-0.5">
                {trimmed}
              </p>
            );
          }

          // Check if paragraph is greeting (Dengan hormat)
          if (/^dengan hormat/i.test(trimmed)) {
            const dhLines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
            if (dhLines.length > 1) {
              return (
                <div key={bIdx} className="space-y-0.5 pt-0.5">
                  <p className="font-bold text-black">{dhLines[0]}</p>
                  {dhLines.slice(1).map((l, idx) => (
                    <p key={idx} className="font-normal text-black">{l}</p>
                  ))}
                </div>
              );
            }
            return (
              <p key={bIdx} className="font-bold text-black pt-0.5">
                {trimmed}
              </p>
            );
          }

          // Check if paragraph is Islamic closing (Wassalamu'alaikum)
          if (/^wassalamu[’']?alaikum/i.test(trimmed)) {
            return (
              <p key={bIdx} className="font-bold italic text-black pt-0.5">
                {trimmed}
              </p>
            );
          }

          // Check if paragraph is formal closing (Hormat kami)
          if (/^hormat kami/i.test(trimmed)) {
            return (
              <p key={bIdx} className="font-bold text-black pt-0.5">
                {trimmed}
              </p>
            );
          }

          const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);

          // Check if block contains key-value pairs
          const hasKV = lines.some((l) => isKVLine(l));
          if (hasKV) {
            const introLines: string[] = [];
            const tableRows: { key: string; val: string }[] = [];
            const outroLines: string[] = [];
            let inTable = false;

            lines.forEach((line) => {
              if (isKVLine(line)) {
                inTable = true;
                const colonIdx = line.indexOf(":");
                tableRows.push({
                  key: line.slice(0, colonIdx).trim(),
                  val: line.slice(colonIdx + 1).trim(),
                });
              } else {
                if (!inTable) {
                  introLines.push(line);
                } else {
                  outroLines.push(line);
                }
              }
            });

            return (
              <div key={bIdx} className="space-y-0.5 text-inherit text-justify">
                {introLines.length > 0 && (
                  <p className="font-medium text-black leading-snug indent-6">
                    {introLines.join(" ")}
                  </p>
                )}
                {tableRows.length > 0 && (
                  <div className="my-0.5 pl-4 sm:pl-6">
                    <table className="w-full border-collapse text-inherit text-black">
                      <tbody>
                        {tableRows.map((row, lIdx) => {
                          const isEndorsementHighlight = /nama endorsement/i.test(row.key);
                          return (
                            <tr key={lIdx} className="align-top">
                              <td className="w-36 sm:w-44 pr-2 py-[1px] whitespace-nowrap font-medium text-black">
                                {row.key}
                              </td>
                              <td className="w-3 py-[1px] font-bold text-center text-black">:</td>
                              <td
                                className={`pl-2 py-[1px] text-black ${
                                  isEndorsementHighlight
                                    ? "font-bold uppercase underline tracking-wide text-black"
                                    : /nama|nik|nomor paspor/i.test(row.key)
                                    ? "font-bold"
                                    : "font-normal"
                                }`}
                              >
                                {row.val}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {outroLines.length > 0 && (
                  <p className="leading-[1.28] text-black pt-0.5 text-justify indent-6">
                    {outroLines.join(" ")}
                  </p>
                )}
              </div>
            );
          }

          // Check if block contains numbered list
          const hasNumberedList = lines.some((line) => /^\d+\.\s/.test(line));
          if (hasNumberedList) {
            const listItems: string[] = [];
            const introLines: string[] = [];
            lines.forEach((l) => {
              if (/^\d+\.\s/.test(l)) {
                listItems.push(l.replace(/^\d+\.\s*/, ""));
              } else {
                introLines.push(l);
              }
            });

            return (
              <div key={bIdx} className="space-y-0.5 text-inherit text-justify">
                {introLines.length > 0 && (
                  <p className="leading-snug text-black font-medium indent-6">{introLines.join(" ")}</p>
                )}
                <ol className="list-decimal pl-6 sm:pl-8 space-y-0 text-black leading-[1.25]">
                  {listItems.map((item, iIdx) => (
                    <li key={iIdx} className="leading-[1.25] pl-0.5 text-justify">
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            );
          }

          // Normal narrative paragraph (formal Indonesian naskah dinas indent)
          return (
            <p key={bIdx} className="leading-[1.28] text-justify text-inherit text-black indent-6">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  // Comprehensive helper to generate rich, standard default body text for ANY letter type
  const buildDefaultLetterBody = (
    type: string,
    p: any,
    settings: any,
    opts?: {
      fatherName?: string;
      endorsedTargetName?: string;
      applicantJobTitle?: string;
      letterCity?: string;
      destinationInstitution?: string;
      customNotes?: string;
      generatedBy?: string;
      customTitle?: string;
      nrp?: string;
      pangkat?: string;
      kesatuan?: string;
      familyCompanion?: string;
      returnDate?: string;
    }
  ) => {
    const pName = (p?.name || "NAMA JAMAAH").trim();
    const pNik = p?.nik || "-";
    const pTTL = `${p?.placeOfBirth || "INDONESIA"}, ${formatDate(p?.dateOfBirth, "dd-MM-yyyy")}`;
    const pAddress = p?.address || p?.city || "-";
    const pPassport = p?.passportNumber
      ? `${p.passportNumber}${p.passportExpiry ? ` (Berlaku s/d: ${formatDate(p.passportExpiry, "dd-MM-yyyy")})` : ""}`
      : "Dalam Proses Pengurusan";
    const pPackage = p?.package?.name || "Program Umroh Reguler";
    const pDepDate = p?.package?.departureDate ? formatDate(p.package.departureDate, "dd MMMM yyyy") : "Jadwal Keberangkatan Resmi";
    const pDepMonth = p?.package?.departureDate ? formatDate(p.package.departureDate, "MMMM yyyy") : "Jadwal Keberangkatan";
    const director = opts?.generatedBy || settings?.directorName || "ATIYATUL AMRA";
    const directorTitle = settings?.directorTitle || "Direktur Utama";
    const travelName = settings?.companyName || "PT BAROKAH SULTHAN HARAMAIN";
    const travelAddr = settings?.address || "Jl. Pahlawan No.10 J, Ps. Gambir, Kec. Tebing Tinggi Kota, Kota Tebing Tinggi, Sumatera Utara 20631";
    const endorsedName = opts?.endorsedTargetName || computeEndorsementName(p?.name || "", opts?.fatherName || p?.fatherName || "");
    const jobTitle = opts?.applicantJobTitle || "Karyawan Swasta";

    if (type === "SURAT_ENDORSEMENT_PASPOR") {
      return `Assalamu’alaikum Wr. Wb.

Semoga Allah SWT melimpahkan Rahmat dan Hidayah-Nya kepada kita semua sehingga kita dapat melaksanakan aktifitas sehari-hari dengan baik.

Saya yang bertanda tangan dibawah ini:
Nama : ${director}
Jabatan : ${directorTitle.toUpperCase()}
Alamat : ${travelAddr}

Bersama ini saya mengajukan permohonan penambahan / endorsement nama pada halaman pengesahan paspor menjadi 3 (tiga) suku kata guna memenuhi persyaratan penerbitan Visa Umroh dari Kementerian Haji dan Umrah Kerajaan Arab Saudi, untuk calon Jemaah Umrah dengan data sebagai berikut:

Nama Sesuai KTP : ${pName.toUpperCase()}
Nama Endorsement (3 Kata) : ${endorsedName.toUpperCase()}
Tempat/tanggal lahir : ${pTTL.toUpperCase()}
NIK : ${pNik}
Nomor Paspor RI : ${pPassport}
Alamat : ${pAddress.toUpperCase()}

Benar yang bersangkutan telah mendaftar dan berniat melaksanakan Ibadah Umrah melalui kami, berdasarkan SE Direktur Jendral Imigrasi No. IMI-0342 GR.01.01 tahun 2014 tentang Penerbitan Proses Pengurusan Paspor oleh PPIU tanggal 04 Maret 2014, Kami menyatakan bahwa:
1. Permohonan penambahan / endorsement nama paspor yang diurus adalah Paspor Warga Negara Indonesia yang akan melakukan perjalanan ke Arab Saudi dalam rangka menunaikan Ibadah Umrah.
2. Rombongan calon jama’ah umrah yang diberangkatkan tidak akan melakukan pelanggaran peraturan Keimigrasian berupa penyalahgunaan izin tinggal, dan atau tidak melebihi izin tinggalnya (overstay), memalsukan atau membuat palsu paspor yang diberikan kepadanya maupun bekerja secara illegal.
3. Apabila terjadi pelanggaran sebagaimana dimaksud, maka izin usaha sebagai Penyelenggara Perjalanan Ibadah Umrah bersedia dicabut.
4. Calon Jama’ah tersebut Insya Allah akan berangkat Umrah pada bulan ${pDepMonth}.

Demikian surat pernyataan dan jaminan ini kami sampaikan, apabila kami tidak memenuhi kewajiban sebagaimana tersebut diatas, kami bersedia menerima sanksi sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.

Wassalamu’alaikum Wr. Wb.`;
    }

    if (type === "SURAT_REKOMENDASI_PASPOR") {
      return `Assalamu’alaikum Wr. Wb.

Semoga Allah SWT melimpahkan Rahmat dan Hidayah-Nya kepada kita semua sehingga kita dapat melaksanakan aktifitas sehari-hari dengan baik.

Saya yang bertanda tangan dibawah ini:
Nama : ${director}
Jabatan : ${directorTitle.toUpperCase()}
Alamat : ${travelAddr}

Bersama ini saya mengajukan permohonan rekomendasi pembuatan Paspor RI baru untuk calon Jemaah Umrah dengan data sebagai berikut:

Nama : ${pName.toUpperCase()}
Tempat/tanggal lahir : ${pTTL.toUpperCase()}
NIK : ${pNik}
Alamat : ${pAddress.toUpperCase()}

Benar yang bersangkutan telah mendaftar dan berniat melaksanakan Ibadah Umrah melalui kami, berdasarkan SE Direktur Jendral Imigrasi No. IMI-0342 GR.01.01 tahun 2014 tentang Penerbitan Proses Pengurusan Paspor oleh PPIU tanggal 04 Maret 2014, Kami menyatakan bahwa:
1. Permohonan paspor yang diurus adalah Paspor Warga Negara Indonesia yang akan melakukan perjalanan ke Arab Saudi dalam rangka menunaikan Ibadah Umrah.
2. Rombongan calon jama’ah umrah yang diberangkatkan tidak akan melakukan pelanggaran peraturan Keimigrasian berupa penyalahgunaan izin tinggal, dan atau tidak melebihi izin tinggalnya (overstay), memalsukan atau membuat palsu paspor yang diberikan kepadanya maupun bekerja secara illegal.
3. Apabila terjadi pelanggaran sebagaimana dimaksud, maka izin usaha sebagai Penyelenggara Perjalanan Ibadah Umrah bersedia dicabut.
4. Calon Jama’ah tersebut Insya Allah akan berangkat Umrah pada bulan ${pDepMonth}.

Demikian surat pernyataan dan jaminan ini kami sampaikan, apabila kami tidak memenuhi kewajiban sebagaimana tersebut diatas, kami bersedia menerima sanksi sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.

Wassalamu’alaikum Wr. Wb.`;
    }

    if (type === "SURAT_PERPANJANG_PASPOR") {
      return `Assalamu’alaikum Wr. Wb.

Semoga Allah SWT melimpahkan Rahmat dan Hidayah-Nya kepada kita semua sehingga kita dapat melaksanakan aktifitas sehari-hari dengan baik.

Saya yang bertanda tangan dibawah ini:
Nama : ${director}
Jabatan : ${directorTitle.toUpperCase()}
Alamat : ${travelAddr}

Bersama ini saya mengajukan permohonan perpanjangan / penggantian Paspor RI untuk calon Jemaah Umrah dengan data sebagai berikut:

Nama : ${pName.toUpperCase()}
Tempat/tanggal lahir : ${pTTL.toUpperCase()}
NIK : ${pNik}
Nomor Paspor Lama : ${pPassport}
Alamat : ${pAddress.toUpperCase()}

Benar yang bersangkutan telah mendaftar dan berniat melaksanakan Ibadah Umrah melalui kami, berdasarkan SE Direktur Jendral Imigrasi No. IMI-0342 GR.01.01 tahun 2014 tentang Penerbitan Proses Pengurusan Paspor oleh PPIU tanggal 04 Maret 2014, Kami menyatakan bahwa:
1. Permohonan perpanjangan / penggantian paspor yang diurus adalah Paspor Warga Negara Indonesia yang akan melakukan perjalanan ke Arab Saudi dalam rangka menunaikan Ibadah Umrah.
2. Rombongan calon jama’ah umrah yang diberangkatkan tidak akan melakukan pelanggaran peraturan Keimigrasian berupa penyalahgunaan izin tinggal, dan atau tidak melebihi izin tinggalnya (overstay), memalsukan atau membuat palsu paspor yang diberikan kepadanya maupun bekerja secara illegal.
3. Apabila terjadi pelanggaran sebagaimana dimaksud, maka izin usaha sebagai Penyelenggara Perjalanan Ibadah Umrah bersedia dicabut.
4. Calon Jama’ah tersebut Insya Allah akan berangkat Umrah pada bulan ${pDepMonth}.

Demikian surat pernyataan dan jaminan ini kami sampaikan, apabila kami tidak memenuhi kewajiban sebagaimana tersebut diatas, kami bersedia menerima sanksi sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.

Wassalamu’alaikum Wr. Wb.`;
    }

    if (type === "SURAT_IZIN_CUTI") {
      return `Dengan hormat,

Sehubungan dengan rencana keberangkatan Ibadah Umrah ke Tanah Suci Makkah dan Madinah, bersama ini kami selaku Pimpinan ${travelName} memohon kiranya Bapak/Ibu Pimpinan dapat memberikan dispensasi dan izin cuti bagi karyawan / peserta didik yang terdaftar sebagai calon jemaah umrah kami untuk menunaikan ibadah umrah ke Tanah Suci pada tanggal ${pDepDate} s.d. selesai, dengan data diri sebagai berikut:

Nama Lengkap : ${pName.toUpperCase()}
Nomor Induk Kependudukan (NIK) : ${pNik}
Jabatan / Profesi : ${jobTitle}
Program Paket Umroh : ${pPackage}
Jadwal Keberangkatan : ${pDepDate}

Adapun yang bersangkutan dijadwalkan menunaikan seluruh rangkaian ibadah umrah mulai dari jadwal keberangkatan hingga kepulangan kembali ke tanah air dalam keadaan sehat wal'afiat.

Demikian surat permohonan dispensasi dan izin cuti ini kami sampaikan. Atas perhatian, kebijaksanaan, dan izin yang diberikan oleh Bapak/Ibu Pimpinan, kami haturkan terima kasih yang sebesar-besarnya.`;
    }

    if (type === "SURAT_IZIN_CUTI_TNI_POLRI") {
      const nrp = opts?.nrp || "-";
      const pangkat = opts?.pangkat || "-";
      const kesatuan = opts?.kesatuan || opts?.destinationInstitution || "-";
      const familyCompanion = opts?.familyCompanion || "";
      let companionStr = "";
      if (familyCompanion) {
        companionStr = familyCompanion.trim().toLowerCase().startsWith("bersama")
          ? ` ${familyCompanion.trim()}`
          : ` bersama ${familyCompanion.trim()}`;
      } else {
        companionStr = " bersama keluarga";
      }

      const pReturnDate = opts?.returnDate
        ? formatDate(opts.returnDate, "dd MMMM yyyy")
        : p?.package?.returnDate
        ? formatDate(p.package.returnDate, "dd MMMM yyyy")
        : "";

      const returnClause = pReturnDate ? ` dan kembali di tanah air pada tanggal ${pReturnDate}` : "";

      return `Assalamu'alaikum, Wr., Wb.

Dengan Hormat,
Bersama surat ini kami beritahukan bahwa :

Nama : ${pName}
NRP : ${nrp}
Pangkat : ${pangkat}
Anggota : ${kesatuan}

Yang akan melaksanakan ibadah umroh${companionStr}. Beliau terdaftar sebagai calon jamaah umroh yang dijadwalkan berangkat pada tanggal ${pDepDate}${returnClause}.

Demikian surat pemberitahuan ini kami sampaikan, atas bantuan dan kerjasamanya kami ucapkan terima kasih.

Wassalamu'alaikum, Wr., Wb.`;
    }

    if (type === "SURAT_PENGANTAR_KEMENAG") {
      return `Dengan hormat,

Bersama ini kami dari ${travelName} bermaksud mengajukan permohonan Surat Rekomendasi Pendaftaran Ibadah Umrah ke Kantor Kementerian Agama bagi calon jemaah umrah kami yang telah terdaftar secara sah pada sistem SISKOPATUH dan memenuhi seluruh persyaratan administrasi keberangkatan:

Nama Lengkap : ${pName.toUpperCase()}
Nomor Induk Kependudukan (NIK) : ${pNik}
Tempat & Tanggal Lahir : ${pTTL.toUpperCase()}
Alamat Tempat Tinggal : ${pAddress.toUpperCase()}
Program Paket : ${pPackage} (Keberangkatan: ${pDepDate})

Demikian surat pengantar ini kami sampaikan, atas bantuan, bimbingan, dan pelayanan yang diberikan kami ucapkan terima kasih.`;
    }

    if (type === "SURAT_KETERANGAN_JAMAAH") {
      return `Dengan hormat,

Yang bertanda tangan di bawah ini Pimpinan ${travelName} dengan ini menerangkan dengan sebenarnya bahwa:

Nama Lengkap Sesuai KTP : ${pName.toUpperCase()}
Nomor Induk Kependudukan (NIK) : ${pNik}
Nomor Paspor RI : ${pPassport}
Tempat & Tanggal Lahir : ${pTTL.toUpperCase()}
Alamat Tempat Tinggal : ${pAddress.toUpperCase()}

Adalah benar terdaftar secara resmi sebagai Calon Jemaah Umrah pada biro perjalanan kami untuk Program ${pPackage} yang dijadwalkan berangkat pada tanggal ${pDepDate}.

Surat keterangan ini kami buat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya sesuai keperluan administratif yang bersangkutan.

Demikian surat keterangan ini kami terbitkan untuk dipergunakan dengan penuh tanggung jawab.`;
    }

    if (type === "SURAT_MAHRAM") {
      return `Dengan hormat,

Yang bertanda tangan di bawah ini Pimpinan ${travelName} dengan ini menerangkan bahwa calon jemaah umrah:

Nama Lengkap : ${pName.toUpperCase()}
Nomor Induk Kependudukan (NIK) : ${pNik}
Nomor Paspor RI : ${pPassport}

Melakukan perjalanan ibadah umrah ke Tanah Suci didampingi oleh keluarga / mahram sah yang terdaftar bersama dalam satu rombongan keberangkatan Program ${pPackage} (Jadwal Keberangkatan: ${pDepDate}).

Demikian surat keterangan mahram dan pendampingan keluarga ini kami sampaikan untuk kelengkapan administrasi pengurusan dokumen perjalanan ibadah ke Tanah Suci.`;
    }

    if (type === "SURAT_UNDANGAN_MANASIK") {
      return `Assalamu’alaikum Warahmatullahi Wabarakatuh,

Puji dan syukur senantiasa kita panjatkan ke hadirat Allah SWT atas segala limpahan rahmat dan hidayah-Nya. Sehubungan dengan semakin dekatnya jadwal keberangkatan ibadah Umroh ke Tanah Suci, bersama ini kami mengundang Bapak/Ibu Calon Jamaah Umroh beserta keluarga untuk hadir dalam kegiatan Bimbingan Manasik Ibadah Umroh (Teori Tata Cara Ibadah & Simulasi Praktik Thawaf/Sa'i) sekaligus Pembagian Koper dan Perlengkapan Resmi Travel.

Mengingat pentingnya acara ini demi kesiapan fisik, mental, dan kelancaran ibadah Bapak/Ibu di Tanah Suci, kehadiran Bapak/Ibu tepat pada waktunya sangat kami harapkan.

Atas perhatian, kesediaan waktu, dan kehadirannya, kami ucapkan terima kasih yang sebesar-besarnya. Jazakumullahu Khairan Katsiran.

Wassalamu’alaikum Warahmatullahi Wabarakatuh,`;
    }

    if (type === "SURAT_UNDANGAN_HALAL_BIHALAL") {
      return `Assalamu’alaikum Warahmatullahi Wabarakatuh,

Alhamdulillahirabbil'alamin, atas limpahan rahmat dan karunia Allah SWT, seluruh rangkaian ibadah Umroh ke Tanah Suci Makkah dan Madinah telah terlaksana dengan lancar dan seluruh jamaah telah tiba kembali di tanah air dengan selamat. Guna mempererat tali silaturahmi, menjaga kemabruran ibadah, dan ukhuwah islamiyah antar jamaah, kami mengundang Bapak/Ibu Jamaah Umroh beserta keluarga dalam acara Halal Bi Halal & Temu Kangen Alumni Jamaah Umroh.

Kehadiran Bapak/Ibu beserta keluarga sangat kami nantikan untuk saling bertatap muka dan menyambung tali persaudaraan sesama tamu Allah SWT.

Atas perhatian dan kehadirannya, kami ucapkan terima kasih yang sebesar-besarnya. Jazakumullahu Khairan Katsiran.

Wassalamu’alaikum Warahmatullahi Wabarakatuh,`;
    }

    return `Dengan hormat,

Bersama ini kami selaku Pimpinan ${travelName} menerangkan bahwa calon jamaah umrah kami yang terdaftar pada program keberangkatan resmi memerlukan dokumen surat keterangan ini untuk keperluan kelengkapan administratif:

Nama Lengkap : ${pName.toUpperCase()}
NIK : ${pNik}
Alamat : ${pAddress.toUpperCase()}
Program Paket : ${pPackage} (Keberangkatan: ${pDepDate})

Demikian surat keterangan ini kami sampaikan dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.`;
  };

  // Helper to extract clean endorsed name from letter record
  const getEndorsedName = (letter: any) => {
    if (!letter) return "";
    const p = letter.pilgrim;
    if (letter.customNotes) {
      const match = letter.customNotes.match(/Target Nama Endorsement \(3 Kata\):\s*([^.\n]+)/i);
      if (match && match[1].trim() !== (p?.name || "").trim()) {
        return match[1].trim().toUpperCase();
      }
    }
    if (
      letter.customTitle &&
      letter.customTitle !== "Surat Permohonan Endorsement Nama Paspor" &&
      letter.customTitle !== "SURAT_ENDORSEMENT_PASPOR" &&
      letter.customTitle.trim() !== ""
    ) {
      return letter.customTitle.toUpperCase();
    }
    return computeEndorsementName(p?.name || "", p?.fatherName || "");
  };

  // Helper to extract military/police details from letter
  const parseTniPolriData = (letter: any) => {
    let nrp = "";
    let pangkat = "";
    let kesatuan = "";
    let familyCompanion = "";
    let returnDate = "";

    if (letter?.customNotes) {
      const mNrp = letter.customNotes.match(/NRP:\s*([^|;\n]+)/i);
      if (mNrp) nrp = mNrp[1].trim();
      const mPangkat = letter.customNotes.match(/Pangkat:\s*([^|;\n]+)/i);
      if (mPangkat) pangkat = mPangkat[1].trim();
      const mKesatuan = letter.customNotes.match(/Kesatuan:\s*([^|;\n]+)/i);
      if (mKesatuan) kesatuan = mKesatuan[1].trim();
      const mPendamping = letter.customNotes.match(/Pendamping:\s*([^|;\n]+)/i);
      if (mPendamping) familyCompanion = mPendamping[1].trim();
      const mKembali = letter.customNotes.match(/Tanggal Kembali:\s*([^|;\n]+)/i);
      if (mKembali) returnDate = mKembali[1].trim();
    }

    if (letter?.applicantJobTitle) {
      if (!pangkat) {
        const mP = letter.applicantJobTitle.match(/^([^(\n|]+)/);
        if (mP && !/karyawan|pns|swasta/i.test(mP[1])) pangkat = mP[1].trim();
      }
      if (!nrp) {
        const mN = letter.applicantJobTitle.match(/NRP:\s*([^)\n|]+)/i);
        if (mN) nrp = mN[1].trim();
      }
    }

    if (letter?.customBody) {
      if (!nrp) {
        const m = letter.customBody.match(/NRP\s*:\s*([^\n]+)/i);
        if (m) nrp = m[1].trim();
      }
      if (!pangkat) {
        const m = letter.customBody.match(/Pangkat\s*:\s*([^\n]+)/i);
        if (m) pangkat = m[1].trim();
      }
      if (!kesatuan) {
        const m = letter.customBody.match(/Anggota\s*:\s*([^\n]+)/i);
        if (m) kesatuan = m[1].trim();
      }
    }

    if (!kesatuan && letter?.destinationInstitution) {
      kesatuan = letter.destinationInstitution;
    }

    return { nrp, pangkat, kesatuan, familyCompanion, returnDate };
  };

  // Auto-sync selected pilgrim details & suggested endorsement name & default body
  useEffect(() => {
    const p = pilgrims.find((item) => item.id === formData.pilgrimId) || initialPilgrim;
    if (p) {
      const fName = p.fatherName || "";
      const suggested = computeEndorsementName(p.name || "", fName);
      setFormData((prev) => {
        const body = prev.customBody || buildDefaultLetterBody(prev.type, p, travelSettings, {
          fatherName: fName,
          endorsedTargetName: suggested,
          applicantJobTitle: prev.applicantJobTitle,
          letterCity: prev.letterCity,
          destinationInstitution: prev.destinationInstitution,
          customNotes: prev.customNotes,
          generatedBy: prev.generatedBy,
          customTitle: prev.customTitle,
          nrp: prev.nrp,
          pangkat: prev.pangkat,
          kesatuan: prev.kesatuan,
          familyCompanion: prev.familyCompanion,
          returnDate: prev.returnDate,
        });
        return {
          ...prev,
          fatherName: fName,
          endorsedTargetName: suggested,
          customBody: body,
        };
      });
    }
  }, [formData.pilgrimId, formData.type, pilgrims, initialPilgrim, travelSettings]);

  const filteredLetters = letters.filter((l) =>
    l.letterNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.pilgrim?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.destinationInstitution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.customTitle && l.customTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Paginated letters
  const paginatedLetters = filteredLetters.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleTypeChange = (newType: string) => {
    const p = pilgrims.find((item) => item.id === formData.pilgrimId) || initialPilgrim;
    let defaultDest = "Kepala Kantor Imigrasi Kelas I / II TPI";
    let defaultNote = "Untuk keperluan permohonan paspor ibadah umroh.";
    let defaultSubject = "Permohonan Rekomendasi Paspor";
    let defaultCustomTitle = "";

    if (newType === "SURAT_ENDORSEMENT_PASPOR") {
      defaultDest = "Kepala Kantor Imigrasi Kelas I / II TPI";
      defaultSubject = "Permohonan Penambahan / Endorsement Nama di Paspor";
      defaultNote = "Penambahan nama menjadi 3 kata pada halaman pengesahan paspor untuk pemenuhan syarat Visa Umroh.";
      defaultCustomTitle = "Surat Permohonan Endorsement Nama Paspor";
    } else if (newType === "SURAT_REKOMENDASI_PASPOR") {
      defaultDest = "Kantor Imigrasi Kelas II TPI Pematang Siantar";
      defaultSubject = "Permohonan Paspor Calon Jemaah Umrah";
      defaultNote = "Rekomendasi & Jaminan resmi pengurusan paspor baru umroh berdasarkan SE Dirjen Imigrasi No. IMI-0342 GR.01.01 Tahun 2014.";
      defaultCustomTitle = "Surat Permohonan Rekomendasi & Pernyataan Jaminan Paspor";
    } else if (newType === "SURAT_PERPANJANG_PASPOR") {
      defaultDest = "Kantor Imigrasi Kelas II TPI Pematang Siantar";
      defaultSubject = "Permohonan Perpanjangan / Penggantian Paspor Calon Jemaah Umrah";
      defaultNote = "Rekomendasi & Jaminan resmi perpanjangan/penggantian paspor habis masa berlaku untuk ibadah Umroh berdasarkan SE Dirjen Imigrasi No. IMI-0342 GR.01.01 Tahun 2014.";
      defaultCustomTitle = "Surat Rekomendasi Perpanjangan Paspor";
    } else if (newType === "SURAT_IZIN_CUTI") {
      defaultDest = "Pimpinan Perusahaan / Instansi Terkait";
      defaultSubject = "Permohonan Izin / Dispensasi Cuti Ibadah Umroh";
      defaultNote = "Permohonan dispensasi/izin cuti kerja untuk menunaikan ibadah umroh.";
      defaultCustomTitle = "Surat Permohonan Izin Cuti Umroh";
    } else if (newType === "SURAT_IZIN_CUTI_TNI_POLRI") {
      defaultDest = formData.kesatuan || "Komandan / Pimpinan Kesatuan";
      defaultSubject = "Pemberitahuan Umroh";
      defaultNote = "Permohonan izin cuti dan pemberitahuan umroh anggota TNI / Polri.";
      defaultCustomTitle = "Surat Izin Cuti / Pemberitahuan Umroh TNI & Polri";
    } else if (newType === "SURAT_PENGANTAR_KEMENAG") {
      defaultDest = "Kepala Kantor Kementerian Agama Kab/Kota";
      defaultSubject = "Permohonan Surat Rekomendasi Kemenag";
      defaultNote = "Rekomendasi pendaftaran umroh ke Kantor Kemenag Kab/Kota.";
      defaultCustomTitle = "Surat Pengantar Rekomendasi Kemenag";
    } else if (newType === "SURAT_KETERANGAN_JAMAAH") {
      defaultDest = "Pihak Terkait / Kedutaan";
      defaultSubject = "Surat Keterangan Terdaftar Jamaah Umroh";
      defaultNote = "Keterangan resmi bahwa yang bersangkutan telah terdaftar sebagai jamaah umroh aktif.";
      defaultCustomTitle = "Surat Keterangan Terdaftar Jamaah";
    } else if (newType === "SURAT_MAHRAM") {
      defaultDest = "Kantor Imigrasi / Kementerian Agama";
      defaultSubject = "Surat Keterangan Mahram / Pendampingan Keluarga";
      defaultNote = "Keterangan hubungan mahram dan pendampingan resmi selama di Tanah Suci.";
      defaultCustomTitle = "Surat Keterangan Mahram & Pendampingan";
    } else if (newType === "SURAT_UNDANGAN_MANASIK") {
      defaultDest = p ? `Bpk/Ibu ${p.name} & Keluarga` : "Bapak/Ibu Calon Jamaah Umroh & Keluarga";
      defaultSubject = "Undangan Bimbingan Manasik Ibadah Umroh & Pembagian Perlengkapan";
      defaultNote = "Waktu: Pukul 08:30 WIB s.d Selesai\nTempat: Kantor Pusat PT Barokah Sulthan Haramain / Hotel\nDress Code: Busana Muslim Putih / Rapi Syar'i\nCatatan: Harap hadir 15 menit sebelum acara dan membawa buku catatan panduan doa.";
      defaultCustomTitle = "Surat Undangan Manasik Umroh & Pembagian Perlengkapan";
    } else if (newType === "SURAT_UNDANGAN_HALAL_BIHALAL") {
      defaultDest = p ? `Bpk/Ibu ${p.name} & Keluarga` : "Bapak/Ibu Alumni Jamaah Umroh & Keluarga";
      defaultSubject = "Undangan Silaturahmi, Temu Alumni & Halal Bi Halal Pasca Umroh";
      defaultNote = "Waktu: Pukul 09:00 WIB s.d Selesai\nTempat: Ruang Pertemuan / Restoran / Kantor Travel\nDress Code: Seragam Batik Travel / Busana Muslim Rapi\nCatatan: Acara temu kangen, tausiyah merawat kemabruran ibadah, penyerahan piagam/sertifikat resmi umroh, dan jamuan makan bersama.";
      defaultCustomTitle = "Surat Undangan Halal Bi Halal & Silaturahmi Pasca Umroh";
    } else if (newType === "SURAT_CUSTOM") {
      defaultDest = "";
      defaultSubject = "";
      defaultCustomTitle = "";
      defaultNote = "";
    }

    const defaultBody = buildDefaultLetterBody(newType, p, travelSettings, {
      fatherName: formData.fatherName,
      endorsedTargetName: formData.endorsedTargetName,
      applicantJobTitle: formData.applicantJobTitle,
      letterCity: formData.letterCity,
      destinationInstitution: defaultDest,
      customNotes: defaultNote,
      generatedBy: formData.generatedBy,
      customTitle: defaultCustomTitle,
      nrp: formData.nrp,
      pangkat: formData.pangkat,
      kesatuan: formData.kesatuan,
      familyCompanion: formData.familyCompanion,
      returnDate: formData.returnDate,
    });

    setFormData({
      ...formData,
      type: newType,
      customTitle: defaultCustomTitle,
      customSubject: defaultSubject,
      destinationInstitution: defaultDest,
      customNotes: defaultNote,
      customBody: defaultBody,
    });
  };

  const handleGenerateLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // If endorsement and fatherName was entered, update pilgrim record in DB
      if (formData.type === "SURAT_ENDORSEMENT_PASPOR" && formData.pilgrimId && formData.fatherName) {
        await fetch(`/api/pilgrims/${formData.pilgrimId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fatherName: formData.fatherName }),
        });
      }

      let finalNotes = formData.customNotes;
      if (formData.type === "SURAT_ENDORSEMENT_PASPOR" && formData.endorsedTargetName) {
        finalNotes = `Target Nama Endorsement (3 Kata): ${formData.endorsedTargetName}. ${formData.customNotes}`;
      } else if (formData.type === "SURAT_IZIN_CUTI_TNI_POLRI") {
        finalNotes = `[TNI/POLRI] NRP: ${formData.nrp} | Pangkat: ${formData.pangkat} | Kesatuan: ${formData.kesatuan} | Pendamping: ${formData.familyCompanion} | Tanggal Kembali: ${formData.returnDate}. ${formData.customNotes}`;
      }

      const res = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          applicantJobTitle: formData.type === "SURAT_IZIN_CUTI_TNI_POLRI"
            ? (formData.pangkat ? `${formData.pangkat} (NRP: ${formData.nrp || "-"})` : (formData.applicantJobTitle || "Anggota TNI / Polri"))
            : formData.applicantJobTitle,
          destinationInstitution: formData.type === "SURAT_IZIN_CUTI_TNI_POLRI"
            ? (formData.kesatuan || formData.destinationInstitution || "Pimpinan Kesatuan")
            : formData.destinationInstitution,
          customTitle: formData.type === "SURAT_ENDORSEMENT_PASPOR" ? formData.endorsedTargetName : formData.customTitle,
          customNotes: finalNotes,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setIsAddModalOpen(false);
        onRefresh();
        setSelectedLetterForPrint(created);
      } else {
        const err = await res.json();
        alert(`Gagal menerbitkan surat: ${err.error || "Periksa data form"}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLetter = async (id: string, letterNo: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus surat nomor "${letterNo}"?`)) return;
    try {
      const res = await fetch(`/api/letters?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Surat berhasil dihapus.");
        onRefresh();
        if (selectedLetterForPrint && selectedLetterForPrint.id === id) {
          setSelectedLetterForPrint(null);
        }
      } else {
        alert("Gagal menghapus surat.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenEditLetter = (letter: any) => {
    setEditingLetter(letter);
    const p = letter.pilgrim;
    const fName = p?.fatherName || "";
    const endosName = getEndorsedName(letter);
    const tniData = parseTniPolriData(letter);
    const defaultBody = letter.customBody || buildDefaultLetterBody(letter.type || "SURAT_ENDORSEMENT_PASPOR", p, travelSettings, {
      fatherName: fName,
      endorsedTargetName: endosName,
      applicantJobTitle: letter.applicantJobTitle || "Karyawan Swasta",
      letterCity: letter.letterCity || "Tebing Tinggi",
      destinationInstitution: letter.destinationInstitution || "",
      customNotes: letter.customNotes || "",
      generatedBy: letter.generatedBy || travelSettings.directorName || "ATIYATUL AMRA",
      customTitle: letter.customTitle || "",
      nrp: tniData.nrp,
      pangkat: tniData.pangkat,
      kesatuan: tniData.kesatuan,
      familyCompanion: tniData.familyCompanion,
      returnDate: tniData.returnDate,
    });

    setEditFormData({
      pilgrimId: letter.pilgrimId || "",
      type: letter.type || "SURAT_ENDORSEMENT_PASPOR",
      customTitle: letter.customTitle || "",
      customSubject: letter.customSubject || "",
      customBody: defaultBody,
      destinationInstitution: letter.destinationInstitution || "",
      applicantJobTitle: letter.applicantJobTitle || "Karyawan Swasta",
      letterCity: letter.letterCity || "Tebing Tinggi",
      fatherName: fName,
      endorsedTargetName: endosName,
      nrp: tniData.nrp,
      pangkat: tniData.pangkat,
      kesatuan: tniData.kesatuan,
      familyCompanion: tniData.familyCompanion,
      returnDate: tniData.returnDate,
      customNotes: letter.customNotes || "",
      generatedBy: letter.generatedBy || travelSettings.directorName || "ATIYATUL AMRA",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLetter) return;
    setLoading(true);
    try {
      let finalNotes = editFormData.customNotes;
      if (editFormData.type === "SURAT_IZIN_CUTI_TNI_POLRI") {
        const cleanNotes = editFormData.customNotes.replace(/\[TNI\/POLRI\][^.]*\.\s*/i, "");
        finalNotes = `[TNI/POLRI] NRP: ${editFormData.nrp} | Pangkat: ${editFormData.pangkat} | Kesatuan: ${editFormData.kesatuan} | Pendamping: ${editFormData.familyCompanion} | Tanggal Kembali: ${editFormData.returnDate}. ${cleanNotes}`;
      }

      const res = await fetch("/api/letters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingLetter.id,
          ...editFormData,
          applicantJobTitle: editFormData.type === "SURAT_IZIN_CUTI_TNI_POLRI"
            ? (editFormData.pangkat ? `${editFormData.pangkat} (NRP: ${editFormData.nrp || "-"})` : (editFormData.applicantJobTitle || "Anggota TNI / Polri"))
            : editFormData.applicantJobTitle,
          destinationInstitution: editFormData.type === "SURAT_IZIN_CUTI_TNI_POLRI"
            ? (editFormData.kesatuan || editFormData.destinationInstitution || "Pimpinan Kesatuan")
            : editFormData.destinationInstitution,
          customNotes: finalNotes,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        alert("Surat resmi berhasil diperbarui!");
        setIsEditModalOpen(false);
        setEditingLetter(null);
        onRefresh();
        if (selectedLetterForPrint && selectedLetterForPrint.id === updated.id) {
          setSelectedLetterForPrint(updated);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Gagal memperbarui surat.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLetterTitle = (letter: any) => {
    if (letter?.customTitle) return letter.customTitle;
    const type = typeof letter === "string" ? letter : letter?.type;
    switch (type) {
      case "SURAT_ENDORSEMENT_PASPOR":
        return "Surat Permohonan Endos Nama di Paspor";
      case "SURAT_REKOMENDASI_PASPOR":
        return "Surat Rekomendasi Pembuatan Paspor";
      case "SURAT_PERPANJANG_PASPOR":
        return "Surat Rekomendasi Perpanjangan Paspor";
      case "SURAT_IZIN_CUTI":
        return "Surat Permohonan Izin Cuti Umroh";
      case "SURAT_IZIN_CUTI_TNI_POLRI":
        return "Surat Izin Cuti / Pemberitahuan Umroh TNI & Polri";
      case "SURAT_PENGANTAR_KEMENAG":
        return "Surat Pengantar Rekomendasi Kemenag";
      case "SURAT_KETERANGAN_JAMAAH":
        return "Surat Keterangan Terdaftar Jamaah";
      case "SURAT_MAHRAM":
        return "Surat Keterangan Mahram & Pendamping";
      case "SURAT_UNDANGAN_MANASIK":
        return "Surat Undangan Manasik Umroh";
      case "SURAT_UNDANGAN_HALAL_BIHALAL":
        return "Surat Undangan Halal Bi Halal & Silaturahmi";
      case "SURAT_CUSTOM":
        return letter?.customTitle || "Surat Keterangan Resmi";
      default:
        return "Surat Resmi Travel";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-600" />
            Generator Surat-Surat Keperluan Jamaah Umroh
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cetak otomatis Surat Endos Nama Paspor, Rekomendasi Paspor Baru, Izin Cuti, Pengantar Kemenag, dan Surat Kustom.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              handleTypeChange("SURAT_CUSTOM");
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-2.5 text-xs font-bold text-slate-950 shadow-xs transition-all"
          >
            <Plus className="h-4 w-4" />
            + Buat Surat Kustom Lainnya
          </button>

          <button
            onClick={() => {
              handleTypeChange("SURAT_ENDORSEMENT_PASPOR");
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all"
          >
            <FilePlus className="h-4 w-4" />
            + Terbitkan Surat Resmi
          </button>
        </div>
      </div>

      {/* Quick Letter Type Category Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2 no-print">
        <button
          onClick={() => {
            handleTypeChange("SURAT_ENDORSEMENT_PASPOR");
            setIsAddModalOpen(true);
          }}
          className="p-2.5 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 text-left transition-all group shadow-2xs"
        >
          <span className="text-[10px] font-bold text-amber-800 uppercase block">Imigrasi</span>
          <p className="text-xs font-bold text-slate-900 group-hover:text-amber-700 line-clamp-1 mt-0.5">
            Endos Paspor
          </p>
        </button>

        <button
          onClick={() => {
            handleTypeChange("SURAT_REKOMENDASI_PASPOR");
            setIsAddModalOpen(true);
          }}
          className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 text-left transition-all group shadow-2xs"
        >
          <span className="text-[10px] font-bold text-emerald-800 uppercase block">Imigrasi</span>
          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 line-clamp-1 mt-0.5">
            Paspor Baru
          </p>
        </button>

        <button
          onClick={() => {
            handleTypeChange("SURAT_PERPANJANG_PASPOR");
            setIsAddModalOpen(true);
          }}
          className="p-2.5 rounded-xl bg-white hover:bg-teal-50 border border-slate-200 text-left transition-all group shadow-2xs"
        >
          <span className="text-[10px] font-bold text-teal-800 uppercase block">Imigrasi</span>
          <p className="text-xs font-bold text-slate-900 group-hover:text-teal-700 line-clamp-1 mt-0.5">
            Perpanjang Paspor
          </p>
        </button>

        <button
          onClick={() => {
            handleTypeChange("SURAT_IZIN_CUTI");
            setIsAddModalOpen(true);
          }}
          className="p-2.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-left transition-all group shadow-2xs"
        >
          <span className="text-[10px] font-bold text-blue-800 uppercase block">Kantor/Sekolah</span>
          <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 line-clamp-1 mt-0.5">
            Izin Cuti Umroh
          </p>
        </button>

        <button
          onClick={() => {
            handleTypeChange("SURAT_IZIN_CUTI_TNI_POLRI");
            setIsAddModalOpen(true);
          }}
          className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-left transition-all group shadow-2xs"
        >
          <span className="text-[10px] font-bold text-emerald-800 uppercase block">Militer/Polisi</span>
          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 line-clamp-1 mt-0.5">
            Cuti TNI & Polri
          </p>
        </button>

        <button
          onClick={() => {
            handleTypeChange("SURAT_PENGANTAR_KEMENAG");
            setIsAddModalOpen(true);
          }}
          className="p-2.5 rounded-xl bg-white hover:bg-teal-50 border border-slate-200 text-left transition-all group shadow-2xs"
        >
          <span className="text-[10px] font-bold text-teal-800 uppercase block">Kemenag</span>
          <p className="text-xs font-bold text-slate-900 group-hover:text-teal-700 line-clamp-1 mt-0.5">
            Pengantar Kemenag
          </p>
        </button>

        <button
          onClick={() => {
            handleTypeChange("SURAT_UNDANGAN_MANASIK");
            setIsAddModalOpen(true);
          }}
          className="p-2.5 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-left transition-all group shadow-2xs"
        >
          <span className="text-[10px] font-bold text-indigo-700 uppercase block">Pra-Berangkat</span>
          <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 line-clamp-1 mt-0.5">
            Undangan Manasik
          </p>
        </button>

        <button
          onClick={() => {
            handleTypeChange("SURAT_UNDANGAN_HALAL_BIHALAL");
            setIsAddModalOpen(true);
          }}
          className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-left transition-all group shadow-2xs"
        >
          <span className="text-[10px] font-bold text-emerald-700 uppercase block">Pasca-Pulang</span>
          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 line-clamp-1 mt-0.5">
            Halal Bi Halal
          </p>
        </button>

        <button
          onClick={() => {
            handleTypeChange("SURAT_KETERANGAN_JAMAAH");
            setIsAddModalOpen(true);
          }}
          className="p-2.5 rounded-xl bg-white hover:bg-purple-50 border border-slate-200 text-left transition-all group shadow-2xs"
        >
          <span className="text-[10px] font-bold text-purple-800 uppercase block">Legalitas</span>
          <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700 line-clamp-1 mt-0.5">
            Surat Keterangan
          </p>
        </button>

        <button
          onClick={() => {
            handleTypeChange("SURAT_CUSTOM");
            setIsAddModalOpen(true);
          }}
          className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-left transition-all group shadow-2xs"
        >
          <span className="text-[10px] font-bold text-amber-900 uppercase block">+ Kustom</span>
          <p className="text-xs font-bold text-amber-950 line-clamp-1 mt-0.5">
            Surat Lainnya...
          </p>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs no-print">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor surat, nama jamaah, judul surat, atau instansi tujuan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Letters List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Surat & Tanggal</th>
                <th className="py-3 px-4">Keperluan / Jenis Surat</th>
                <th className="py-3 px-4">Nama Jamaah & Paket</th>
                <th className="py-3 px-4">Tujuan Surat / Instansi</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredLetters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Belum ada surat yang diterbitkan. Klik <strong>"+ Terbitkan Surat Resmi"</strong> atau <strong>"+ Buat Surat Kustom"</strong>.
                  </td>
                </tr>
              ) : (
                paginatedLetters.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-slate-900">{l.letterNumber}</p>
                      <p className="text-[10px] text-slate-400">{formatDate(l.issueDate, "dd MMMM yyyy")}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block font-bold text-slate-900 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                        {getLetterTitle(l)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{l.pilgrim?.name}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{l.pilgrim?.package?.name}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{l.destinationInstitution}</p>
                      {l.applicantJobTitle && (
                        <p className="text-[10px] text-slate-500">Jabatan: {l.applicantJobTitle}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedLetterForPrint(l)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors"
                          title="Pratinjau & Cetak Surat"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Pratinjau & Cetak
                        </button>

                        <button
                          onClick={() => handleOpenEditLetter(l)}
                          className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors"
                          title="Edit Data Surat"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteLetter(l.id, l.letterNumber)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                          title="Hapus Surat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredLetters.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          itemLabel="surat"
        />
      </div>

      {/* Modal: Form Terbitkan Surat (Standard & Custom Dynamic) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Generator Dokumen Resmi
                </span>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  {formData.type === "SURAT_CUSTOM" ? "Buat Surat Keperluan Kustom" : "Terbitkan Surat Keperluan Jamaah"}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateLetter} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700">Pilih Jamaah Umroh Terdaftar *</label>
                <select
                  required
                  value={formData.pilgrimId}
                  onChange={(e) => {
                    const selectedP = pilgrims.find((p) => p.id === e.target.value);
                    const fName = selectedP?.fatherName || "";
                    let updatedDest = formData.destinationInstitution;
                    if (formData.type === "SURAT_UNDANGAN_MANASIK" || formData.type === "SURAT_UNDANGAN_HALAL_BIHALAL") {
                      updatedDest = selectedP ? `Bpk/Ibu ${selectedP.name} & Keluarga` : formData.destinationInstitution;
                    }
                    setFormData({
                      ...formData,
                      pilgrimId: e.target.value,
                      fatherName: fName,
                      endorsedTargetName: computeEndorsementName(selectedP?.name || "", fName),
                      destinationInstitution: updatedDest,
                    });
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold focus:ring-2 focus:ring-emerald-500/20"
                >
                  {pilgrims.length === 0 ? (
                    <option value="">(Belum ada data jamaah terdaftar)</option>
                  ) : (
                    pilgrims.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - (NIK: {p.nik} | {p.package?.name || "Paket"})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">Pilih Template Keperluan Surat *</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                >
                  {letterTemplates.length === 0 ? (
                    <>
                      <option value="SURAT_ENDORSEMENT_PASPOR">✨ Surat Permohonan Endos Nama di Paspor (Imigrasi - 3 Kata)</option>
                      <option value="SURAT_REKOMENDASI_PASPOR">Surat Rekomendasi Pembuatan Paspor Baru (Imigrasi)</option>
                      <option value="SURAT_PERPANJANG_PASPOR">Surat Rekomendasi Perpanjangan / Penggantian Paspor (Imigrasi)</option>
                      <option value="SURAT_IZIN_CUTI">Surat Permohonan Izin Cuti Kerja / Kuliah / Sekolah</option>
                      <option value="SURAT_IZIN_CUTI_TNI_POLRI">🎖️ Surat Izin Cuti / Pemberitahuan Umroh TNI & Polri</option>
                      <option value="SURAT_PENGANTAR_KEMENAG">Surat Pengantar Rekomendasi Kemenag Kab/Kota</option>
                      <option value="SURAT_UNDANGAN_MANASIK">🕌 Surat Undangan Manasik Umroh & Pembagian Perlengkapan</option>
                      <option value="SURAT_UNDANGAN_HALAL_BIHALAL">🤝 Surat Undangan Halal Bi Halal & Silaturahmi Pasca Umroh</option>
                      <option value="SURAT_KETERANGAN_JAMAAH">Surat Keterangan Terdaftar Calon Jamaah Umroh</option>
                      <option value="SURAT_MAHRAM">Surat Keterangan Mahram & Pendampingan Keluarga</option>
                      <option value="SURAT_CUSTOM">➕ Buat Jenis Surat Kustom Lainnya...</option>
                    </>
                  ) : (
                    letterTemplates.map((t) => (
                      <option key={t.id} value={t.typeKey}>
                        [{t.code}] {t.title}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* SPECIFIC FIELDS FOR ENDORSEMENT PASPOR */}
              {formData.type === "SURAT_ENDORSEMENT_PASPOR" && (
                <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      Detail Endorsement Nama Paspor (Nama + Nama Orang Tua Laki-laki)
                    </div>
                    <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                      Syarat Visa Umroh
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-800 flex items-center justify-between">
                        <span>Nama Orang Tua Laki-laki (Ayah Kandung) *</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AHMAD DAHLAN"
                        value={formData.fatherName}
                        onChange={(e) => {
                          const newFather = e.target.value;
                          const currentPilgrim = pilgrims.find((p) => p.id === formData.pilgrimId) || initialPilgrim;
                          setFormData({
                            ...formData,
                            fatherName: newFather,
                            endorsedTargetName: computeEndorsementName(currentPilgrim?.name || "", newFather),
                          });
                        }}
                        className="mt-1 w-full rounded-xl border border-amber-300 p-2.5 bg-white font-bold text-slate-900 uppercase focus:ring-2 focus:ring-amber-500/20"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Otomatis tersimpan ke profil master data jamaah.
                      </span>
                    </div>

                    <div>
                      <label className="font-bold text-slate-800">
                        Nama Pengajuan Endorsement (Nama + Nama Orang Tua Laki-laki) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. LINA AHMAD DAHLAN"
                        value={formData.endorsedTargetName}
                        onChange={(e) => setFormData({ ...formData, endorsedTargetName: e.target.value.toUpperCase() })}
                        className="mt-1 w-full rounded-xl border border-amber-400 p-2.5 bg-white font-black text-slate-950 uppercase text-sm tracking-wide focus:ring-2 focus:ring-amber-500/20 shadow-xs"
                      />
                      <span className="text-[10px] text-emerald-800 font-bold mt-0.5 block">
                        Format Resmi: [Nama Lengkap Jamaah] + [Nama Orang Tua Laki-laki]
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* SPECIFIC FIELDS FOR TNI & POLRI */}
              {formData.type === "SURAT_IZIN_CUTI_TNI_POLRI" && (
                <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs">
                      <Shield className="w-4 h-4 text-emerald-700" />
                      Detail Anggota Personil TNI / Polri (Format Resmi Kedinasan)
                    </div>
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-md">
                      TNI / Polri
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-800 text-xs">Pangkat Militer / Kepolisian *</label>
                      <input
                        type="text"
                        required
                        list="tni-polri-pangkat-list"
                        placeholder="e.g. Peltu / Kapten / Bripka / Serka / Mayor"
                        value={formData.pangkat}
                        onChange={(e) => {
                          const val = e.target.value;
                          const p = pilgrims.find((item) => item.id === formData.pilgrimId) || initialPilgrim;
                          const updatedBody = buildDefaultLetterBody(formData.type, p, travelSettings, {
                            fatherName: formData.fatherName,
                            endorsedTargetName: formData.endorsedTargetName,
                            applicantJobTitle: formData.applicantJobTitle,
                            letterCity: formData.letterCity,
                            destinationInstitution: formData.destinationInstitution,
                            customNotes: formData.customNotes,
                            generatedBy: formData.generatedBy,
                            customTitle: formData.customTitle,
                            nrp: formData.nrp,
                            pangkat: val,
                            kesatuan: formData.kesatuan,
                            familyCompanion: formData.familyCompanion,
                            returnDate: formData.returnDate,
                          });
                          setFormData({ ...formData, pangkat: val, customBody: updatedBody });
                        }}
                        className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <datalist id="tni-polri-pangkat-list">
                        <option value="Prada" />
                        <option value="Pratu" />
                        <option value="Praka" />
                        <option value="Kopda" />
                        <option value="Koptu" />
                        <option value="Kopka" />
                        <option value="Serda" />
                        <option value="Sertu" />
                        <option value="Serka" />
                        <option value="Serma" />
                        <option value="Pelda" />
                        <option value="Peltu" />
                        <option value="Letda" />
                        <option value="Lettu" />
                        <option value="Kapten" />
                        <option value="Mayor" />
                        <option value="Letkol" />
                        <option value="Kolonel" />
                        <option value="Bripda" />
                        <option value="Briptu" />
                        <option value="Brigadir" />
                        <option value="Bripka" />
                        <option value="Aipda" />
                        <option value="Aiptu" />
                        <option value="Ipda" />
                        <option value="Iptu" />
                        <option value="Akp" />
                        <option value="Kompol" />
                        <option value="Akbp" />
                        <option value="Kombes Pol" />
                      </datalist>
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 text-xs">NRP (Nomor Registrasi Pokok) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 21960179470377"
                        value={formData.nrp}
                        onChange={(e) => {
                          const val = e.target.value;
                          const p = pilgrims.find((item) => item.id === formData.pilgrimId) || initialPilgrim;
                          const updatedBody = buildDefaultLetterBody(formData.type, p, travelSettings, {
                            fatherName: formData.fatherName,
                            endorsedTargetName: formData.endorsedTargetName,
                            applicantJobTitle: formData.applicantJobTitle,
                            letterCity: formData.letterCity,
                            destinationInstitution: formData.destinationInstitution,
                            customNotes: formData.customNotes,
                            generatedBy: formData.generatedBy,
                            customTitle: formData.customTitle,
                            nrp: val,
                            pangkat: formData.pangkat,
                            kesatuan: formData.kesatuan,
                            familyCompanion: formData.familyCompanion,
                            returnDate: formData.returnDate,
                          });
                          setFormData({ ...formData, nrp: val, customBody: updatedBody });
                        }}
                        className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 text-xs">Anggota / Kesatuan / Satuan Tugas *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ba Subdenpom I/1 - 4 Kisaran / Kodim 0208 Asahan / Polres Tebing Tinggi"
                      value={formData.kesatuan}
                      onChange={(e) => {
                        const val = e.target.value;
                        const p = pilgrims.find((item) => item.id === formData.pilgrimId) || initialPilgrim;
                        const updatedBody = buildDefaultLetterBody(formData.type, p, travelSettings, {
                          fatherName: formData.fatherName,
                          endorsedTargetName: formData.endorsedTargetName,
                          applicantJobTitle: formData.applicantJobTitle,
                          letterCity: formData.letterCity,
                          destinationInstitution: val,
                          customNotes: formData.customNotes,
                          generatedBy: formData.generatedBy,
                          customTitle: formData.customTitle,
                          nrp: formData.nrp,
                          pangkat: formData.pangkat,
                          kesatuan: val,
                          familyCompanion: formData.familyCompanion,
                          returnDate: formData.returnDate,
                        });
                        setFormData({
                          ...formData,
                          kesatuan: val,
                          destinationInstitution: val,
                          customBody: updatedBody,
                        });
                      }}
                      className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-800 text-xs">Pendamping Keluarga (Opsional)</label>
                      <input
                        type="text"
                        placeholder="e.g. bersama istri dan ketiga anaknya"
                        value={formData.familyCompanion}
                        onChange={(e) => {
                          const val = e.target.value;
                          const p = pilgrims.find((item) => item.id === formData.pilgrimId) || initialPilgrim;
                          const updatedBody = buildDefaultLetterBody(formData.type, p, travelSettings, {
                            fatherName: formData.fatherName,
                            endorsedTargetName: formData.endorsedTargetName,
                            applicantJobTitle: formData.applicantJobTitle,
                            letterCity: formData.letterCity,
                            destinationInstitution: formData.destinationInstitution,
                            customNotes: formData.customNotes,
                            generatedBy: formData.generatedBy,
                            customTitle: formData.customTitle,
                            nrp: formData.nrp,
                            pangkat: formData.pangkat,
                            kesatuan: formData.kesatuan,
                            familyCompanion: val,
                            returnDate: formData.returnDate,
                          });
                          setFormData({ ...formData, familyCompanion: val, customBody: updatedBody });
                        }}
                        className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 text-xs">Tanggal Tiba Kembali di Tanah Air</label>
                      <input
                        type="date"
                        value={formData.returnDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          const p = pilgrims.find((item) => item.id === formData.pilgrimId) || initialPilgrim;
                          const updatedBody = buildDefaultLetterBody(formData.type, p, travelSettings, {
                            fatherName: formData.fatherName,
                            endorsedTargetName: formData.endorsedTargetName,
                            applicantJobTitle: formData.applicantJobTitle,
                            letterCity: formData.letterCity,
                            destinationInstitution: formData.destinationInstitution,
                            customNotes: formData.customNotes,
                            generatedBy: formData.generatedBy,
                            customTitle: formData.customTitle,
                            nrp: formData.nrp,
                            pangkat: formData.pangkat,
                            kesatuan: formData.kesatuan,
                            familyCompanion: formData.familyCompanion,
                            returnDate: val,
                          });
                          setFormData({ ...formData, returnDate: val, customBody: updatedBody });
                        }}
                        className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SUBJECT FIELD FOR ALL LETTER TYPES */}
              <div>
                <label className="font-bold text-slate-700">Perihal / Hal Surat *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Permohonan Rekomendasi Paspor Umroh"
                  value={formData.customSubject}
                  onChange={(e) => setFormData({ ...formData, customSubject: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* SPECIFIC FIELDS FOR CUSTOM LETTER TITLE */}
              {formData.type === "SURAT_CUSTOM" && (
                <div>
                  <label className="font-bold text-slate-800">Judul / Jenis Surat Kustom *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SURAT KETERANGAN PENDAMPINGAN LANSIA"
                    value={formData.customTitle}
                    onChange={(e) => setFormData({ ...formData, customTitle: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold"
                  />
                </div>
              )}

              {/* UNIVERSAL FULL BODY LETTER EDITOR */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                    Isi & Redaksi Surat Lengkap (Dapat Diedit Sepenuhnya) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const p = pilgrims.find((item) => item.id === formData.pilgrimId) || initialPilgrim;
                      const resetBody = buildDefaultLetterBody(formData.type, p, travelSettings, {
                        fatherName: formData.fatherName,
                        endorsedTargetName: formData.endorsedTargetName,
                        applicantJobTitle: formData.applicantJobTitle,
                        letterCity: formData.letterCity,
                        destinationInstitution: formData.destinationInstitution,
                        customNotes: formData.customNotes,
                        generatedBy: formData.generatedBy,
                        customTitle: formData.customTitle,
                        nrp: formData.nrp,
                        pangkat: formData.pangkat,
                        kesatuan: formData.kesatuan,
                        familyCompanion: formData.familyCompanion,
                        returnDate: formData.returnDate,
                      });
                      setFormData({ ...formData, customBody: resetBody });
                    }}
                    className="text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" /> Muat Ulang Redaksi Standar
                  </button>
                </div>
                <textarea
                  rows={8}
                  required
                  value={formData.customBody}
                  onChange={(e) => setFormData({ ...formData, customBody: e.target.value })}
                  placeholder="Ketik atau sesuaikan seluruh isi redaksi surat di sini..."
                  className="w-full rounded-xl border border-slate-300 p-3 bg-white text-xs text-slate-900 leading-relaxed font-sans focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-500">
                  💡 Teks di atas akan dicetak persis pada lembar surat resmi. Anda bebas mengedit kalimat pembuka, klausul permohonan, atau rincian data sesuai kebutuhan instansi penerima.
                </p>
              </div>

              {/* CITY & DESTINATION INSTITUTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Kota Diterbitkan Surat *</label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      required
                      list="add-letter-cities"
                      placeholder="e.g. Tebing Tinggi / Medan / Jakarta"
                      value={formData.letterCity}
                      onChange={(e) => setFormData({ ...formData, letterCity: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <datalist id="add-letter-cities">
                      <option value="Tebing Tinggi" />
                      <option value="Medan" />
                      <option value="Pematang Siantar" />
                      <option value="Jakarta" />
                      <option value="Surabaya" />
                      <option value="Bandung" />
                      <option value="Makassar" />
                    </datalist>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Pilih dari list atau ketik kota lain</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Tujuan Surat / Instansi *</label>
                  <input
                    type="text"
                    required
                    list="destination-institutions-list"
                    placeholder="e.g. Kantor Imigrasi Kelas II TPI Pematang Siantar"
                    value={formData.destinationInstitution}
                    onChange={(e) => setFormData({ ...formData, destinationInstitution: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <datalist id="destination-institutions-list">
                    <option value="Kantor Imigrasi Kelas II TPI Pematang Siantar" />
                    <option value="Kantor Imigrasi Kelas I Khusus TPI Medan" />
                    <option value="Kantor Imigrasi Kelas II TPI Tanjung Balai Asahan" />
                    <option value="Kantor Imigrasi Kelas II TPI Belawan" />
                    <option value="Kantor Imigrasi Kelas II Non TPI Sibolga" />
                    <option value="Kepala Kantor Kementerian Agama Kota Tebing Tinggi" />
                    <option value="Kepala Kantor Kementerian Agama Kab. Serdang Bedagai" />
                  </datalist>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Pilih dari rekomendasi atau ketik instansi lain</span>
                </div>
              </div>

              {formData.type === "SURAT_IZIN_CUTI" && (
                <div>
                  <label className="font-bold text-slate-700">Profesi / Jabatan Jamaah di Tempat Kerja</label>
                  <input
                    type="text"
                    placeholder="e.g. Staff Keuangan / Guru / Manajer Operasional"
                    value={formData.applicantJobTitle}
                    onChange={(e) => setFormData({ ...formData, applicantJobTitle: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700">Keterangan / Keperluan Tambahan</label>
                <textarea
                  rows={2}
                  value={formData.customNotes}
                  onChange={(e) => setFormData({ ...formData, customNotes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || pilgrims.length === 0}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs"
                >
                  {loading ? "Menerbitkan..." : "Generate Surat PDF"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Surat Resmi */}
      {isEditModalOpen && editingLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Edit Data Dokumen Resmi
                </span>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-amber-600" />
                  Edit Surat: {editingLetter.letterNumber}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingLetter(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLetter} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700">Pilih Jamaah Umroh Terdaftar *</label>
                <select
                  required
                  value={editFormData.pilgrimId}
                  onChange={(e) => {
                    const selectedP = pilgrims.find((p) => p.id === e.target.value);
                    const fName = selectedP?.fatherName || "";
                    let updatedDest = editFormData.destinationInstitution;
                    if (editFormData.type === "SURAT_UNDANGAN_MANASIK" || editFormData.type === "SURAT_UNDANGAN_HALAL_BIHALAL") {
                      updatedDest = selectedP ? `Bpk/Ibu ${selectedP.name} & Keluarga` : editFormData.destinationInstitution;
                    }
                    setEditFormData({
                      ...editFormData,
                      pilgrimId: e.target.value,
                      fatherName: fName,
                      endorsedTargetName: computeEndorsementName(selectedP?.name || "", fName),
                      destinationInstitution: updatedDest,
                    });
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold focus:ring-2 focus:ring-amber-500/20"
                >
                  {pilgrims.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - (NIK: {p.nik} | {p.package?.name || "Paket"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">Pilih Template Keperluan Surat *</label>
                <select
                  value={editFormData.type}
                  onChange={(e) => {
                    setEditFormData({
                      ...editFormData,
                      type: e.target.value,
                    });
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20"
                >
                  {letterTemplates.length === 0 ? (
                    <>
                      <option value="SURAT_ENDORSEMENT_PASPOR">✨ Surat Permohonan Endos Nama di Paspor (Imigrasi - 3 Kata)</option>
                      <option value="SURAT_REKOMENDASI_PASPOR">Surat Rekomendasi Pembuatan Paspor Baru (Imigrasi)</option>
                      <option value="SURAT_PERPANJANG_PASPOR">Surat Rekomendasi Perpanjangan / Penggantian Paspor (Imigrasi)</option>
                      <option value="SURAT_IZIN_CUTI">Surat Permohonan Izin Cuti Kerja / Kuliah / Sekolah</option>
                      <option value="SURAT_IZIN_CUTI_TNI_POLRI">🎖️ Surat Izin Cuti / Pemberitahuan Umroh TNI & Polri</option>
                      <option value="SURAT_PENGANTAR_KEMENAG">Surat Pengantar Rekomendasi Kemenag Kab/Kota</option>
                      <option value="SURAT_UNDANGAN_MANASIK">🕌 Surat Undangan Manasik Umroh & Pembagian Perlengkapan</option>
                      <option value="SURAT_UNDANGAN_HALAL_BIHALAL">🤝 Surat Undangan Halal Bi Halal & Silaturahmi Pasca Umroh</option>
                      <option value="SURAT_KETERANGAN_JAMAAH">Surat Keterangan Terdaftar Calon Jamaah Umroh</option>
                      <option value="SURAT_MAHRAM">Surat Keterangan Mahram & Pendampingan Keluarga</option>
                      <option value="SURAT_CUSTOM">➕ Buat Jenis Surat Kustom Lainnya...</option>
                    </>
                  ) : (
                    letterTemplates.map((t) => (
                      <option key={t.id} value={t.typeKey}>
                        [{t.code}] {t.title}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* SPECIFIC FIELDS FOR ENDORSEMENT PASPOR */}
              {editFormData.type === "SURAT_ENDORSEMENT_PASPOR" && (
                <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      Detail Endorsement Nama Paspor (Nama + Nama Orang Tua Laki-laki)
                    </div>
                    <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                      Syarat Visa Umroh
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-800">
                        Nama Orang Tua Laki-laki (Ayah Kandung) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AHMAD DAHLAN"
                        value={editFormData.fatherName}
                        onChange={(e) => {
                          const newFather = e.target.value;
                          const currentPilgrim = pilgrims.find((p) => p.id === editFormData.pilgrimId);
                          setEditFormData({
                            ...editFormData,
                            fatherName: newFather,
                            endorsedTargetName: computeEndorsementName(currentPilgrim?.name || "", newFather),
                          });
                        }}
                        className="mt-1 w-full rounded-xl border border-amber-300 p-2.5 bg-white font-bold text-slate-900 uppercase focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-800">
                        Nama Pengajuan Endorsement (3 Kata) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. LINA AHMAD DAHLAN"
                        value={editFormData.endorsedTargetName}
                        onChange={(e) => setEditFormData({ ...editFormData, endorsedTargetName: e.target.value.toUpperCase() })}
                        className="mt-1 w-full rounded-xl border border-amber-400 p-2.5 bg-white font-black text-slate-950 uppercase text-sm tracking-wide focus:ring-2 focus:ring-amber-500/20 shadow-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SPECIFIC FIELDS FOR TNI & POLRI */}
              {editFormData.type === "SURAT_IZIN_CUTI_TNI_POLRI" && (
                <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs">
                      <Shield className="w-4 h-4 text-emerald-700" />
                      Detail Anggota Personil TNI / Polri (Format Resmi Kedinasan)
                    </div>
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-md">
                      TNI / Polri
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-800 text-xs">Pangkat Militer / Kepolisian *</label>
                      <input
                        type="text"
                        required
                        list="tni-polri-pangkat-list"
                        placeholder="e.g. Peltu / Kapten / Bripka / Serka / Mayor"
                        value={editFormData.pangkat}
                        onChange={(e) => {
                          const val = e.target.value;
                          const p = pilgrims.find((item) => item.id === editFormData.pilgrimId);
                          const updatedBody = buildDefaultLetterBody(editFormData.type, p, travelSettings, {
                            fatherName: editFormData.fatherName,
                            endorsedTargetName: editFormData.endorsedTargetName,
                            applicantJobTitle: editFormData.applicantJobTitle,
                            letterCity: editFormData.letterCity,
                            destinationInstitution: editFormData.destinationInstitution,
                            customNotes: editFormData.customNotes,
                            generatedBy: editFormData.generatedBy,
                            customTitle: editFormData.customTitle,
                            nrp: editFormData.nrp,
                            pangkat: val,
                            kesatuan: editFormData.kesatuan,
                            familyCompanion: editFormData.familyCompanion,
                            returnDate: editFormData.returnDate,
                          });
                          setEditFormData({ ...editFormData, pangkat: val, customBody: updatedBody });
                        }}
                        className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 text-xs">NRP (Nomor Registrasi Pokok) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 21960179470377"
                        value={editFormData.nrp}
                        onChange={(e) => {
                          const val = e.target.value;
                          const p = pilgrims.find((item) => item.id === editFormData.pilgrimId);
                          const updatedBody = buildDefaultLetterBody(editFormData.type, p, travelSettings, {
                            fatherName: editFormData.fatherName,
                            endorsedTargetName: editFormData.endorsedTargetName,
                            applicantJobTitle: editFormData.applicantJobTitle,
                            letterCity: editFormData.letterCity,
                            destinationInstitution: editFormData.destinationInstitution,
                            customNotes: editFormData.customNotes,
                            generatedBy: editFormData.generatedBy,
                            customTitle: editFormData.customTitle,
                            nrp: val,
                            pangkat: editFormData.pangkat,
                            kesatuan: editFormData.kesatuan,
                            familyCompanion: editFormData.familyCompanion,
                            returnDate: editFormData.returnDate,
                          });
                          setEditFormData({ ...editFormData, nrp: val, customBody: updatedBody });
                        }}
                        className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 text-xs">Anggota / Kesatuan / Satuan Tugas *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ba Subdenpom I/1 - 4 Kisaran / Kodim 0208 Asahan / Polres Tebing Tinggi"
                      value={editFormData.kesatuan}
                      onChange={(e) => {
                        const val = e.target.value;
                        const p = pilgrims.find((item) => item.id === editFormData.pilgrimId);
                        const updatedBody = buildDefaultLetterBody(editFormData.type, p, travelSettings, {
                          fatherName: editFormData.fatherName,
                          endorsedTargetName: editFormData.endorsedTargetName,
                          applicantJobTitle: editFormData.applicantJobTitle,
                          letterCity: editFormData.letterCity,
                          destinationInstitution: val,
                          customNotes: editFormData.customNotes,
                          generatedBy: editFormData.generatedBy,
                          customTitle: editFormData.customTitle,
                          nrp: editFormData.nrp,
                          pangkat: editFormData.pangkat,
                          kesatuan: val,
                          familyCompanion: editFormData.familyCompanion,
                          returnDate: editFormData.returnDate,
                        });
                        setEditFormData({
                          ...editFormData,
                          kesatuan: val,
                          destinationInstitution: val,
                          customBody: updatedBody,
                        });
                      }}
                      className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-800 text-xs">Pendamping Keluarga (Opsional)</label>
                      <input
                        type="text"
                        placeholder="e.g. bersama istri dan ketiga anaknya"
                        value={editFormData.familyCompanion}
                        onChange={(e) => {
                          const val = e.target.value;
                          const p = pilgrims.find((item) => item.id === editFormData.pilgrimId);
                          const updatedBody = buildDefaultLetterBody(editFormData.type, p, travelSettings, {
                            fatherName: editFormData.fatherName,
                            endorsedTargetName: editFormData.endorsedTargetName,
                            applicantJobTitle: editFormData.applicantJobTitle,
                            letterCity: editFormData.letterCity,
                            destinationInstitution: editFormData.destinationInstitution,
                            customNotes: editFormData.customNotes,
                            generatedBy: editFormData.generatedBy,
                            customTitle: editFormData.customTitle,
                            nrp: editFormData.nrp,
                            pangkat: editFormData.pangkat,
                            kesatuan: editFormData.kesatuan,
                            familyCompanion: val,
                            returnDate: editFormData.returnDate,
                          });
                          setEditFormData({ ...editFormData, familyCompanion: val, customBody: updatedBody });
                        }}
                        className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 text-xs">Tanggal Tiba Kembali di Tanah Air</label>
                      <input
                        type="date"
                        value={editFormData.returnDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          const p = pilgrims.find((item) => item.id === editFormData.pilgrimId);
                          const updatedBody = buildDefaultLetterBody(editFormData.type, p, travelSettings, {
                            fatherName: editFormData.fatherName,
                            endorsedTargetName: editFormData.endorsedTargetName,
                            applicantJobTitle: editFormData.applicantJobTitle,
                            letterCity: editFormData.letterCity,
                            destinationInstitution: editFormData.destinationInstitution,
                            customNotes: editFormData.customNotes,
                            generatedBy: editFormData.generatedBy,
                            customTitle: editFormData.customTitle,
                            nrp: editFormData.nrp,
                            pangkat: editFormData.pangkat,
                            kesatuan: editFormData.kesatuan,
                            familyCompanion: editFormData.familyCompanion,
                            returnDate: val,
                          });
                          setEditFormData({ ...editFormData, returnDate: val, customBody: updatedBody });
                        }}
                        className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SUBJECT FIELD FOR ALL LETTER TYPES */}
              <div>
                <label className="font-bold text-slate-700">Perihal / Hal Surat *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Permohonan Rekomendasi Paspor Umroh"
                  value={editFormData.customSubject}
                  onChange={(e) => setEditFormData({ ...editFormData, customSubject: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* SPECIFIC FIELDS FOR CUSTOM LETTER TITLE */}
              {editFormData.type === "SURAT_CUSTOM" && (
                <div>
                  <label className="font-bold text-slate-800">Judul / Jenis Surat Kustom *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SURAT KETERANGAN PENDAMPINGAN LANSIA"
                    value={editFormData.customTitle}
                    onChange={(e) => setEditFormData({ ...editFormData, customTitle: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold"
                  />
                </div>
              )}

              {/* UNIVERSAL FULL BODY LETTER EDITOR */}
              <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-300/80 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    Isi & Redaksi Surat Lengkap (Dapat Diedit Sepenuhnya) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const p = pilgrims.find((item) => item.id === editFormData.pilgrimId);
                      const resetBody = buildDefaultLetterBody(editFormData.type, p, travelSettings, {
                        fatherName: editFormData.fatherName,
                        endorsedTargetName: editFormData.endorsedTargetName,
                        applicantJobTitle: editFormData.applicantJobTitle,
                        letterCity: editFormData.letterCity,
                        destinationInstitution: editFormData.destinationInstitution,
                        customNotes: editFormData.customNotes,
                        generatedBy: editFormData.generatedBy,
                        customTitle: editFormData.customTitle,
                        nrp: editFormData.nrp,
                        pangkat: editFormData.pangkat,
                        kesatuan: editFormData.kesatuan,
                        familyCompanion: editFormData.familyCompanion,
                        returnDate: editFormData.returnDate,
                      });
                      setEditFormData({ ...editFormData, customBody: resetBody });
                    }}
                    className="text-[11px] font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-amber-700" /> Muat Ulang Redaksi Standar
                  </button>
                </div>
                <textarea
                  rows={8}
                  required
                  value={editFormData.customBody}
                  onChange={(e) => setEditFormData({ ...editFormData, customBody: e.target.value })}
                  placeholder="Ketik atau sesuaikan seluruh isi redaksi surat di sini..."
                  className="w-full rounded-xl border border-amber-300 p-3 bg-white text-xs text-slate-900 leading-relaxed font-sans focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-500">
                  💡 Teks di atas akan dicetak persis pada lembar surat resmi. Anda bebas mengedit kalimat pembuka, klausul permohonan, atau rincian data sesuai kebutuhan instansi penerima.
                </p>
              </div>

              {/* CITY & DESTINATION INSTITUTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Kota Diterbitkan Surat *</label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      required
                      list="edit-letter-cities"
                      placeholder="e.g. Tebing Tinggi / Medan / Jakarta"
                      value={editFormData.letterCity}
                      onChange={(e) => setEditFormData({ ...editFormData, letterCity: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold focus:ring-2 focus:ring-amber-500/20"
                    />
                    <datalist id="edit-letter-cities">
                      <option value="Tebing Tinggi" />
                      <option value="Medan" />
                      <option value="Pematang Siantar" />
                      <option value="Jakarta" />
                      <option value="Surabaya" />
                      <option value="Bandung" />
                      <option value="Makassar" />
                    </datalist>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Pilih dari list atau ketik kota lain</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Tujuan Surat / Instansi *</label>
                  <input
                    type="text"
                    required
                    list="destination-institutions-list"
                    placeholder="e.g. Kantor Imigrasi Kelas II TPI Pematang Siantar"
                    value={editFormData.destinationInstitution}
                    onChange={(e) => setEditFormData({ ...editFormData, destinationInstitution: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Pilih dari rekomendasi atau ketik instansi lain</span>
                </div>
              </div>

              {editFormData.type === "SURAT_IZIN_CUTI" && (
                <div>
                  <label className="font-bold text-slate-700">Profesi / Jabatan Jamaah di Tempat Kerja</label>
                  <input
                    type="text"
                    placeholder="e.g. Staff Keuangan / Guru / Manajer Operasional"
                    value={editFormData.applicantJobTitle}
                    onChange={(e) => setEditFormData({ ...editFormData, applicantJobTitle: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700">Keterangan / Keperluan Tambahan</label>
                <textarea
                  rows={2}
                  value={editFormData.customNotes}
                  onChange={(e) => setEditFormData({ ...editFormData, customNotes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingLetter(null);
                  }}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 shadow-xs flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {loading ? "Menyimpan..." : "Simpan Perubahan Surat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Tampilan Dokumen Surat Resmi Siap Cetak (A4 Standard Print View) */}
      {selectedLetterForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-sm print:p-0 print:bg-transparent print:static print:block print:overflow-visible">
          <div className="printable-modal-content bg-white rounded-3xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:max-w-none print:overflow-visible print:p-0 print:space-y-0 print:shadow-none print:rounded-none">
            
            {/* 1. Header Toolbar (Always Fixed at Top, Never Cut Off) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 bg-white z-20 shrink-0 no-print">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Pratinjau Dokumen Resmi PPIU
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {includeLegalAttachments ? "Surat Resmi + 3 Halaman Dokumen Legalitas (SK Kemenkumham & NIB)" : "Hanya Surat Resmi (1 Halaman)"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEditLetter(selectedLetterForPrint)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-sm transition-all cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" /> Sunting Redaksi Surat
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Cetak / Unduh PDF
                </button>
                <button
                  onClick={() => setSelectedLetterForPrint(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 2. Scrollable Body (Options Toolbar & Official Letter Sheet) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 print:overflow-visible print:p-0 print:space-y-0">
              {/* Dynamic Print Paper Size & Strict Single-Page Print CSS */}
              <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                  @page {
                    size: ${
                      paperSize === "F4_216"
                        ? "216mm 330mm portrait"
                        : paperSize === "F4_215"
                        ? "215mm 330mm portrait"
                        : paperSize === "Letter"
                        ? "216mm 279mm portrait"
                        : "210mm 297mm portrait"
                    };
                    margin: 0 !important;
                  }
                  html, body {
                    background: #ffffff !important;
                    color: #000000 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    height: auto !important;
                    overflow: visible !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    font-family: "Times New Roman", Times, Georgia, serif !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                  .printable-modal-content {
                    box-shadow: none !important;
                    border: none !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    max-width: 100% !important;
                    max-height: none !important;
                    overflow: visible !important;
                    background: transparent !important;
                  }
                  .print-sheet-wrapper {
                    padding: 0 !important;
                    margin: 0 !important;
                    background: transparent !important;
                  }
                  .print-sheet {
                    page-break-before: avoid !important;
                    break-before: avoid !important;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    page-break-after: ${includeLegalAttachments ? "always !important" : "avoid !important"};
                    break-after: ${includeLegalAttachments ? "page !important" : "avoid !important"};
                    width: 100% !important;
                    max-width: 100% !important;
                    height: ${paperSize.startsWith("F4") ? "328mm" : paperSize === "Letter" ? "276mm" : "294mm"} !important;
                    max-height: ${paperSize.startsWith("F4") ? "328mm" : paperSize === "Letter" ? "276mm" : "294mm"} !important;
                    margin: 0 auto !important;
                    padding: ${getMargins().top}mm ${getMargins().right}mm ${getMargins().bottom}mm ${getMargins().left}mm !important;
                    border: none !important;
                    box-shadow: none !important;
                    box-sizing: border-box !important;
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: space-between !important;
                    overflow: hidden !important;
                    font-family: "Times New Roman", Times, Georgia, serif !important;
                    font-size: ${
                      letterFontSize === "12pt"
                        ? "13.5px"
                        : letterFontSize === "11pt"
                        ? "12.2px"
                        : letterFontSize === "10.5pt"
                        ? "11.8px"
                        : "11.2px"
                    } !important;
                    line-height: ${
                      letterFontSize === "12pt"
                        ? "1.35"
                        : letterFontSize === "11pt"
                        ? "1.28"
                        : letterFontSize === "10.5pt"
                        ? "1.25"
                        : "1.20"
                    } !important;
                    zoom: ${printScale}%;
                  }
                  .print-attachment-page {
                    page-break-before: always !important;
                    break-before: page !important;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    page-break-after: always !important;
                    break-after: page !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    min-height: ${paperSize.startsWith("F4") ? "320mm" : paperSize === "Letter" ? "270mm" : "290mm"} !important;
                    max-height: ${paperSize.startsWith("F4") ? "330mm" : paperSize === "Letter" ? "279mm" : "297mm"} !important;
                    margin: 0 auto !important;
                    padding: 12mm 20mm 12mm 20mm !important;
                    border: none !important;
                    box-shadow: none !important;
                    box-sizing: border-box !important;
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: space-between !important;
                  }
                  .print-attachment-page:last-child {
                    page-break-after: avoid !important;
                    break-after: avoid !important;
                  }
                  .print-attachment-img {
                    max-height: ${paperSize.startsWith("F4") ? "275mm" : paperSize === "Letter" ? "225mm" : "245mm"} !important;
                    max-width: 100% !important;
                    width: auto !important;
                    height: auto !important;
                    object-fit: contain !important;
                    display: block !important;
                    margin: 0 auto !important;
                  }
                }
              ` }} />

              {/* Print Options & Letterhead Control Toolbar */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 no-print">
                {/* Row 1: Paper Type Presets & Paper Size Selector */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200/80">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 mr-1">
                      📄 Jenis Kertas:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIncludeLetterhead(true);
                        setIncludeFooter(true);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
                        includeLetterhead
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>📄 Kertas HVS Polos</span>
                      {includeLetterhead && <span className="text-[10px] bg-emerald-700 px-1.5 py-0.2 rounded-full">Aktif</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIncludeLetterhead(false);
                        setIncludeFooter(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
                        !includeLetterhead
                          ? "bg-amber-600 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>🏷️ Kertas Berkop Fisik</span>
                      {!includeLetterhead && <span className="text-[10px] bg-amber-700 px-1.5 py-0.2 rounded-full">Aktif</span>}
                    </button>
                  </div>

                  {/* Paper Size Selector */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-700">📐 Ukuran Kertas:</span>
                    <div className="inline-flex rounded-xl bg-white p-0.5 border border-slate-200 shadow-2xs">
                      {[
                        { id: "A4", label: "A4 (210×297)" },
                        { id: "F4_216", label: "F4 / Folio (216×330)" },
                        { id: "F4_215", label: "F4 (215×330)" },
                        { id: "Letter", label: "Letter" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPaperSize(p.id as any)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            paperSize === p.id
                              ? "bg-slate-900 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 2: Proportional Font Size & Print Scale */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200/80">
                  {/* Font Size */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 mr-1">
                      🔤 Ukuran Huruf:
                    </span>
                    <div className="inline-flex rounded-xl bg-white p-0.5 border border-slate-200 shadow-2xs">
                      {[
                        { id: "12pt", label: "Besar (12 pt)", desc: "Standar Naskah Dinas" },
                        { id: "11pt", label: "Sedang (11 pt)", desc: "Proporsional (Rekomendasi Resmi)" },
                        { id: "10.5pt", label: "Ideal (10.5 pt)", desc: "Pas 1 Halaman" },
                        { id: "10pt", label: "Kompak (10 pt)", desc: "Ringkas" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setLetterFontSize(opt.id as any)}
                          title={opt.desc}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            letterFontSize === opt.id
                              ? "bg-emerald-700 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Print Scale / Height Percentage */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-700">🔍 Skala / Tinggi:</span>
                    <div className="inline-flex rounded-xl bg-white p-0.5 border border-slate-200 shadow-2xs">
                      {[
                        { val: 100, label: "100%" },
                        { val: 95, label: "95%" },
                        { val: 90, label: "90%" },
                        { val: 85, label: "85%" },
                        { val: 80, label: "80%" },
                        { val: 70, label: "70%" },
                      ].map((s) => (
                        <button
                          key={s.val}
                          type="button"
                          onClick={() => setPrintScale(s.val)}
                          className={`px-2 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            printScale === s.val
                              ? "bg-slate-900 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 3: Margin Presets & Fine-Tuning Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200/80">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 mr-1">
                      📏 Margin Kertas:
                    </span>
                    <div className="inline-flex rounded-xl bg-white p-0.5 border border-slate-200 shadow-2xs">
                      {[
                        { id: "standar", label: "Standar PPIU (25mm / 20mm)", desc: "Kiri 25mm, Kanan 20mm (Standar Resmi)" },
                        { id: "lebar", label: "Lebar / Arsip (30mm / 25mm)", desc: "Kiri 30mm, Kanan 25mm (Untuk Map Lubang)" },
                        { id: "sedang", label: "Sedang (22mm / 18mm)", desc: "Kiri 22mm, Kanan 18mm (Proporsional)" },
                        { id: "kompak", label: "Kompak (18mm / 14mm)", desc: "Kiri 18mm, Kanan 14mm (Hemat Ruang)" },
                        { id: "kustom", label: "⚙️ Kustom...", desc: "Atur ukuran margin sendiri" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setMarginPreset(opt.id as any)}
                          title={opt.desc}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            marginPreset === opt.id
                              ? "bg-slate-900 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                      Margin: Kiri {getMargins().left}mm • Kanan {getMargins().right}mm • Atas {getMargins().top}mm • Bawah {getMargins().bottom}mm
                    </span>
                  </div>
                </div>

                {/* Custom Margin Sub-controls (Appears when 'kustom' selected) */}
                {marginPreset === "kustom" && (
                  <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 flex flex-wrap items-center gap-4 text-xs">
                    <span className="font-bold text-amber-900">🔧 Atur Margin Kustom (mm):</span>

                    {/* Kiri */}
                    <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-amber-300 shadow-2xs">
                      <span className="font-semibold text-slate-700">Kiri:</span>
                      <button
                        type="button"
                        onClick={() => setCustomMarginLeft((v) => Math.max(10, v - 2))}
                        className="w-5 h-5 flex items-center justify-center font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-slate-900">{customMarginLeft}mm</span>
                      <button
                        type="button"
                        onClick={() => setCustomMarginLeft((v) => Math.min(45, v + 2))}
                        className="w-5 h-5 flex items-center justify-center font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                      >
                        +
                      </button>
                    </div>

                    {/* Kanan */}
                    <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-amber-300 shadow-2xs">
                      <span className="font-semibold text-slate-700">Kanan:</span>
                      <button
                        type="button"
                        onClick={() => setCustomMarginRight((v) => Math.max(10, v - 2))}
                        className="w-5 h-5 flex items-center justify-center font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-slate-900">{customMarginRight}mm</span>
                      <button
                        type="button"
                        onClick={() => setCustomMarginRight((v) => Math.min(45, v + 2))}
                        className="w-5 h-5 flex items-center justify-center font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                      >
                        +
                      </button>
                    </div>

                    {/* Atas */}
                    <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-amber-300 shadow-2xs">
                      <span className="font-semibold text-slate-700">Atas:</span>
                      <button
                        type="button"
                        onClick={() => setCustomMarginTop((v) => Math.max(8, v - 2))}
                        className="w-5 h-5 flex items-center justify-center font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-slate-900">{customMarginTop}mm</span>
                      <button
                        type="button"
                        onClick={() => setCustomMarginTop((v) => Math.min(40, v + 2))}
                        className="w-5 h-5 flex items-center justify-center font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                      >
                        +
                      </button>
                    </div>

                    {/* Bawah */}
                    <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-amber-300 shadow-2xs">
                      <span className="font-semibold text-slate-700">Bawah:</span>
                      <button
                        type="button"
                        onClick={() => setCustomMarginBottom((v) => Math.max(8, v - 2))}
                        className="w-5 h-5 flex items-center justify-center font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-slate-900">{customMarginBottom}mm</span>
                      <button
                        type="button"
                        onClick={() => setCustomMarginBottom((v) => Math.min(40, v + 2))}
                        className="w-5 h-5 flex items-center justify-center font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Row 4: Granular Checkboxes & Kertas Info */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-800">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={includeLetterhead}
                        onChange={(e) => setIncludeLetterhead(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>Kepala Surat (Kop Resmi)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={includeFooter}
                        onChange={(e) => setIncludeFooter(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>Footer Garis & Kontak</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={includeMeterai}
                        onChange={(e) => setIncludeMeterai(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>Meterai Rp 10.000</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={includeLegalAttachments}
                        onChange={(e) => setIncludeLegalAttachments(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>Lampiran Legalitas (SK & NIB)</span>
                    </label>
                  </div>

                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                    !includeLetterhead
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : "bg-slate-100 text-slate-800 border-slate-300"
                  }`}>
                    {!includeLetterhead
                      ? `🖨️ Kertas Berkop (${paperSize === "F4_216" ? "F4 216×330" : paperSize === "F4_215" ? "F4 215×330" : paperSize})`
                      : `📄 Kertas Polos (${paperSize === "F4_216" ? "F4 216×330" : paperSize === "F4_215" ? "F4 215×330" : paperSize})`}
                  </span>
                </div>

                {!includeLetterhead && (
                  <div className="text-[11px] text-amber-900 bg-amber-50/90 px-3 py-2 rounded-xl border border-amber-200 flex items-center gap-2">
                    <span className="font-bold text-amber-700">💡 Info Mode Kertas Berkop Fisik:</span>
                    <span>Kepala surat disembunyikan dan isi surat langsung naik ke baris teratas agar pas dicetak pada kertas blanko berkop Anda.</span>
                  </div>
                )}
              </div>

              {/* Paper Sheet Preview Container (Centered on desktop with subtle desk background) */}
              <div className="print-sheet-wrapper flex justify-center w-full overflow-x-auto py-2 sm:py-4 bg-slate-100/75 rounded-2xl p-1 sm:p-4 print:p-0 print:bg-transparent print:rounded-none">
                <div
                  className="print-sheet bg-white text-black font-serif shadow-lg border border-slate-300 print:border-none print:shadow-none print:m-0 flex flex-col justify-between"
                  style={{
                    width: paperSize === "F4_216" ? "216mm" : paperSize === "F4_215" ? "215mm" : paperSize === "Letter" ? "216mm" : "210mm",
                    minHeight: paperSize.startsWith("F4") ? "328mm" : paperSize === "Letter" ? "276mm" : "294mm",
                    maxHeight: paperSize.startsWith("F4") ? "328mm" : paperSize === "Letter" ? "276mm" : "294mm",
                    paddingTop: `${getMargins().top}mm`,
                    paddingRight: `${getMargins().right}mm`,
                    paddingBottom: `${getMargins().bottom}mm`,
                    paddingLeft: `${getMargins().left}mm`,
                    fontSize:
                      letterFontSize === "12pt"
                        ? "13.5px"
                        : letterFontSize === "11pt"
                        ? "12.2px"
                        : letterFontSize === "10.5pt"
                        ? "11.8px"
                        : "11.2px",
                    lineHeight:
                      letterFontSize === "12pt"
                        ? "1.35"
                        : letterFontSize === "11pt"
                        ? "1.28"
                        : letterFontSize === "10.5pt"
                        ? "1.25"
                        : "1.20",
                    zoom: `${printScale}%`,
                    boxSizing: "border-box",
                    overflow: "hidden",
                  }}
                >
                  <div>
                    {/* 1. KOP SURAT (Conditional) */}
                    {includeLetterhead ? (
                      <div>
                        <div className="flex items-center gap-3 pb-0.5">
                          <div
                            className="flex-shrink-0 flex items-center justify-center p-0.5"
                            style={{ width: "88px", height: "88px" }}
                          >
                            <img
                              src="/sulthan-haramain-logo.jpg"
                              alt="Logo Sulthan Haramain"
                              className="object-contain"
                              style={{ width: "88px", height: "88px" }}
                            />
                          </div>
                          <div className="flex-1 text-center font-serif text-black">
                            <h1 className="text-[15px] sm:text-[16.5px] font-bold tracking-wider uppercase leading-tight text-black">
                              {travelSettings.companyName || "PT BAROKAH SULTHAN HARAMAIN"}
                            </h1>
                            <p className="text-[8.5px] sm:text-[9px] font-semibold text-black leading-tight mt-0.5">
                              Izin PPIU Induk Usaha PT. Grand Restu Haraman No. {(travelSettings.licenseNumber || "25052200384080005").replace(/•?\s*NIB[\s\S]*/i, "").replace(/•?\s*KBLI[\s\S]*/i, "").replace(/NO\.\s*IZIN\s*PPIU\s*:\s*/i, "").trim()} • SK Menkumham No. AHU-0007388.AH.01.01.TAHUN 2026
                            </p>
                            <p className="text-[8px] sm:text-[8.5px] text-slate-800 leading-tight mt-0.5">
                              {travelSettings.address || "Jl. Pahlawan No.10 J, Ps. Gambir, Kec. Tebing Tinggi Kota, Kota Tebing Tinggi, Sumatera Utara 20631"}
                            </p>
                            <p className="text-[8px] sm:text-[8.5px] text-slate-800 leading-tight mt-0.5">
                              Telp / WhatsApp: {travelSettings.phone || "0821-6733-9464"} • Email: {travelSettings.email || "barokahsulthanharamain@gmail.com"}
                            </p>
                          </div>
                          {/* Right counter-balance spacer to ensure header text remains centered */}
                          <div className="flex-shrink-0 hidden sm:block" style={{ width: "88px" }}></div>
                        </div>

                        {/* Standar Garis Ganda Naskah Dinas (Kop Resmi Indonesia) */}
                        <div className="w-full border-b-[2px] border-black mt-0.5"></div>
                        <div className="w-full border-b-[0.8px] border-black mt-[1.2px] mb-1.5"></div>
                      </div>
                    ) : null}

                    {/* 2. DATE & LETTER NUMBER (Structured Dinas Table & Right-Aligned Date) */}
                    <div className={`${includeLetterhead ? "pt-1" : "pt-0"} font-serif text-black flex justify-between items-start text-[11.5px] leading-tight`}>
                      <table className="border-collapse text-inherit text-black text-left">
                        <tbody>
                          <tr>
                            <td className="pr-3 py-[1px] font-bold whitespace-nowrap">Nomor</td>
                            <td className="px-1 py-[1px] font-bold">:</td>
                            <td className="py-[1px] whitespace-nowrap font-mono">{selectedLetterForPrint.letterNumber || "001/REK-PASPOR/SULTHAN/IX/2026"}</td>
                          </tr>
                          {selectedLetterForPrint.type === "SURAT_IZIN_CUTI_TNI_POLRI" ? (
                            <>
                              <tr>
                                <td className="pr-3 py-[1px] font-bold whitespace-nowrap">Hal</td>
                                <td className="px-1 py-[1px] font-bold">:</td>
                                <td className="py-[1px] font-bold">
                                  {getPrintSubject(selectedLetterForPrint)}
                                </td>
                              </tr>
                              <tr>
                                <td className="pr-3 py-[1px] font-bold whitespace-nowrap">Sifat</td>
                                <td className="px-1 py-[1px] font-bold">:</td>
                                <td className="py-[1px] font-bold">Penting</td>
                              </tr>
                              <tr>
                                <td className="pr-3 py-[1px] font-bold whitespace-nowrap">Lampiran</td>
                                <td className="px-1 py-[1px] font-bold">:</td>
                                <td className="py-[1px] whitespace-nowrap">{includeLegalAttachments ? "1 (Satu) Berkas" : "-"}</td>
                              </tr>
                            </>
                          ) : (
                            <>
                              <tr>
                                <td className="pr-3 py-[1px] font-bold whitespace-nowrap">Lampiran</td>
                                <td className="px-1 py-[1px] font-bold">:</td>
                                <td className="py-[1px] whitespace-nowrap">{includeLegalAttachments ? "1 (Satu) Berkas" : "-"}</td>
                              </tr>
                              <tr className="align-top">
                                <td className="pr-3 py-[1px] font-bold whitespace-nowrap">Perihal</td>
                                <td className="px-1 py-[1px] font-bold">:</td>
                                <td className="py-[1px] font-bold underline">
                                  {getPrintSubject(selectedLetterForPrint)}
                                </td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>

                      {selectedLetterForPrint.type !== "SURAT_IZIN_CUTI_TNI_POLRI" && (
                        <div className="text-right whitespace-nowrap font-serif text-black pl-4 pt-0.5">
                          <p>
                            {selectedLetterForPrint.letterCity || "Tebing Tinggi"},{" "}
                            {formatDate(selectedLetterForPrint.issueDate || selectedLetterForPrint.createdAt, "dd MMMM yyyy")}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 3. RECIPIENT */}
                    {selectedLetterForPrint.type === "SURAT_IZIN_CUTI_TNI_POLRI" &&
                    (!selectedLetterForPrint.destinationInstitution ||
                      selectedLetterForPrint.destinationInstitution.trim() === "" ||
                      /pimpinan kesatuan/i.test(selectedLetterForPrint.destinationInstitution)) ? null : (
                      <div className="pt-1.5 font-serif text-black space-y-0 text-[11.5px] leading-tight">
                        <p>Kepada Yth :</p>
                        <p className="font-bold text-[1.03em] uppercase">
                          {cleanDestination(selectedLetterForPrint.destinationInstitution)}
                        </p>
                        <p>Di Tempat</p>
                      </div>
                    )}

                    {/* 4. LETTER BODY (UNIVERSAL CLEAN FORMATTING VIA RENDERER) */}
                    <div className="pt-1 font-serif text-black">
                      {renderFormattedLetterBody(
                        selectedLetterForPrint.customBody ||
                          buildDefaultLetterBody(
                            selectedLetterForPrint.type,
                            selectedLetterForPrint.pilgrim,
                            travelSettings,
                            {
                              fatherName: selectedLetterForPrint.pilgrim?.fatherName,
                              endorsedTargetName: getEndorsedName(selectedLetterForPrint),
                              applicantJobTitle: selectedLetterForPrint.applicantJobTitle,
                              letterCity: selectedLetterForPrint.letterCity,
                              destinationInstitution: selectedLetterForPrint.destinationInstitution,
                              customNotes: selectedLetterForPrint.customNotes,
                              generatedBy: selectedLetterForPrint.generatedBy,
                              customTitle: selectedLetterForPrint.customTitle,
                              nrp: parseTniPolriData(selectedLetterForPrint).nrp,
                              pangkat: parseTniPolriData(selectedLetterForPrint).pangkat,
                              kesatuan: parseTniPolriData(selectedLetterForPrint).kesatuan,
                              familyCompanion: parseTniPolriData(selectedLetterForPrint).familyCompanion,
                              returnDate: parseTniPolriData(selectedLetterForPrint).returnDate,
                            }
                          )
                      )}
                    </div>

                    {/* 5. SIGNATURE AREA (Left-aligned as requested, with spacious wet-signature and meterai area) */}
                    <div className="pt-2.5 flex justify-start font-serif text-black text-[11.5px]">
                      <div className="w-72 sm:w-80 text-left">
                        {selectedLetterForPrint.type === "SURAT_IZIN_CUTI_TNI_POLRI" && (
                          <p className="font-normal text-[0.96em] pb-1">
                            {selectedLetterForPrint.letterCity || "Tebing Tinggi"},{" "}
                            {formatDate(selectedLetterForPrint.issueDate || selectedLetterForPrint.createdAt, "dd MMMM yyyy")}
                          </p>
                        )}
                        <p className="font-normal text-[0.96em]">Hormat kami</p>
                        <p className="font-bold uppercase tracking-wide text-[0.98em]">
                          {travelSettings.companyName || "PT BAROKAH SULTHAN HARAMAIN"}
                        </p>

                        {/* Ruang TTD Lega & Meterai Tempel */}
                        <div className="relative w-full mt-3.5 mb-2 flex items-center min-h-[72px]">
                          {includeMeterai && (
                            <div
                              className="border border-dashed border-slate-400 rounded-md p-1.5 text-center flex flex-col items-center justify-center bg-slate-50 leading-tight mr-4 shrink-0 select-none shadow-2xs"
                              style={{ width: "94px", height: "64px" }}
                            >
                              <span className="font-bold uppercase tracking-wider text-[7px] text-slate-600">METERAI TEMPEL</span>
                              <span className="font-black text-[10px] text-slate-900 my-0.5">Rp 10.000</span>
                              <span className="text-[6.5px] text-slate-500">Ttd & Cap Menimpa</span>
                            </div>
                          )}
                          {/* Ruang Tanda Tangan Basah & Cap Stempel Resmi */}
                          <div className="h-16 flex-1"></div>
                        </div>

                        <div className="pt-1.5">
                          <p className="font-bold underline uppercase tracking-wide text-[1.04em]">
                            {selectedLetterForPrint.generatedBy || travelSettings.directorName || "ATIYATUL AMRA"}
                          </p>
                          <p className="text-[0.92em] font-medium mt-0.5">
                            {travelSettings.directorTitle || "Direktur Utama"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6. FORMAL FOOTER */}
                  {includeFooter && (
                    <div className="pt-1.5 mt-auto border-t border-black text-center text-[8.5px] text-black font-serif">
                      <p className="font-bold tracking-wide uppercase text-[9px]">
                        {travelSettings.companyName || "PT BAROKAH SULTHAN HARAMAIN"} • KOTA TEBING TINGGI - SUMATERA UTARA
                      </p>
                      <p className="text-[8px] text-slate-700 mt-0.2">
                        Kantor: {travelSettings.address || "Jl. Pahlawan No.10 J, Tebing Tinggi"} • Telp/WA: {travelSettings.phone || "0821-6733-9464"} • Email: {travelSettings.email || "barokahsulthanharamain@gmail.com"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ATTACHMENT PAGES (LAMPIRAN DOKUMEN LEGALITAS RESMI PPIU) */}
              {includeLegalAttachments && (
                <div className="space-y-4 print:space-y-0">
                  {/* PAGE 2: SK KEMENKUMHAM RI */}
                  <div className="print-attachment-page border border-slate-300 p-6 sm:py-8 sm:px-12 md:px-14 rounded-2xl bg-white shadow-sm flex flex-col justify-between print:border-none print:shadow-none">
                    <div className="space-y-2 w-full">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-slate-800">
                        <span className="text-[10.5px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-800">
                          LAMPIRAN I: SALINAN KEPUTUSAN MENTERI HUKUM REPUBLIK INDONESIA
                        </span>
                        <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-500">
                          HALAMAN 2 DARI 4
                        </span>
                      </div>
                      <div className="p-0.5 rounded-xl bg-white border border-slate-200 print:border-none overflow-hidden flex items-center justify-center">
                        <img
                          src="/legal-docs/legalitas-kemenkumham.png"
                          alt="SK Kemenkumham Pengesahan PT Barokah Sulthan Haramain"
                          className="print-attachment-img w-full max-h-[245mm] object-contain mx-auto"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PAGE 3: NIB HALAMAN 1 */}
                  <div className="print-attachment-page border border-slate-300 p-6 sm:py-8 sm:px-12 md:px-14 rounded-2xl bg-white shadow-sm flex flex-col justify-between print:border-none print:shadow-none">
                    <div className="space-y-2 w-full">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-slate-800">
                        <span className="text-[10.5px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-800">
                          LAMPIRAN II: NOMOR INDUK BERUSAHA (NIB) 1504260072814 - PEMERINTAH RI
                        </span>
                        <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-500">
                          HALAMAN 3 DARI 4
                        </span>
                      </div>
                      <div className="p-0.5 rounded-xl bg-white border border-slate-200 print:border-none overflow-hidden flex items-center justify-center">
                        <img
                          src="/legal-docs/legalitas-nib-1.png"
                          alt="NIB PT Barokah Sulthan Haramain"
                          className="print-attachment-img w-full max-h-[245mm] object-contain mx-auto"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PAGE 4: LAMPIRAN NIB KBLI 79122 (UMROH & HAJI KHUSUS) */}
                  <div className="print-attachment-page border border-slate-300 p-6 sm:py-8 sm:px-12 md:px-14 rounded-2xl bg-white shadow-sm flex flex-col justify-between print:border-none print:shadow-none">
                    <div className="space-y-2 w-full">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-slate-800">
                        <span className="text-[10.5px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-800">
                          LAMPIRAN III: LAMPIRAN NIB KBLI 79122 (BIRO PERJALANAN IBADAH UMROH & HAJI KHUSUS)
                        </span>
                        <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-500">
                          HALAMAN 4 DARI 4
                        </span>
                      </div>
                      <div className="p-0.5 rounded-xl bg-white border border-slate-200 print:border-none overflow-hidden flex items-center justify-center">
                        <img
                          src="/legal-docs/legalitas-nib-2.png"
                          alt="Lampiran NIB KBLI 79122 PPIU"
                          className="print-attachment-img w-full max-h-[245mm] object-contain mx-auto"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
