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
  const [paperSize, setPaperSize] = useState<"A4" | "F4" | "Letter">("A4");
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

  // Auto-sync selected pilgrim details & suggested endorsement name
  useEffect(() => {
    const p = pilgrims.find((item) => item.id === formData.pilgrimId) || initialPilgrim;
    if (p) {
      const fName = p.fatherName || "";
      const suggested = computeEndorsementName(p.name || "", fName);
      setFormData((prev) => ({
        ...prev,
        fatherName: fName,
        endorsedTargetName: suggested,
      }));
    }
  }, [formData.pilgrimId, formData.type, pilgrims, initialPilgrim]);

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
    const p = pilgrims.find((item) => item.id === formData.pilgrimId);
    let defaultDest = "Kepala Kantor Imigrasi Kelas I / II TPI";
    let defaultNote = "Untuk keperluan permohonan paspor ibadah umroh.";
    let defaultSubject = "Permohonan Rekomendasi Paspor";
    let defaultCustomTitle = "";
    let defaultBody = "";

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
      defaultBody = `Sehubungan dengan semakin dekatnya jadwal keberangkatan ibadah Umroh ke Tanah Suci, bersama ini kami mengundang Bapak/Ibu Calon Jamaah Umroh beserta keluarga untuk hadir dalam kegiatan Bimbingan Manasik Ibadah Umroh (Teori Tata Cara Ibadah & Simulasi Praktik Thawaf/Sa'i) sekaligus Pembagian Koper dan Perlengkapan Resmi Travel.`;
    } else if (newType === "SURAT_UNDANGAN_HALAL_BIHALAL") {
      defaultDest = p ? `Bpk/Ibu ${p.name} & Keluarga` : "Bapak/Ibu Alumni Jamaah Umroh & Keluarga";
      defaultSubject = "Undangan Silaturahmi, Temu Alumni & Halal Bi Halal Pasca Umroh";
      defaultNote = "Waktu: Pukul 09:00 WIB s.d Selesai\nTempat: Ruang Pertemuan / Restoran / Kantor Travel\nDress Code: Seragam Batik Travel / Busana Muslim Rapi\nCatatan: Acara temu kangen, tausiyah merawat kemabruran ibadah, penyerahan piagam/sertifikat resmi umroh, dan jamuan makan bersama.";
      defaultCustomTitle = "Surat Undangan Halal Bi Halal & Silaturahmi Pasca Umroh";
      defaultBody = `Alhamdulillahirabbil'alamin, atas limpahan rahmat dan karunia Allah SWT, seluruh rangkaian ibadah Umroh ke Tanah Suci Makkah dan Madinah telah terlaksana dengan lancar dan seluruh jamaah telah tiba kembali di tanah air dengan selamat. Guna mempererat tali silaturahmi, menjaga kemabruran ibadah, dan ukhuwah islamiyah antar jamaah, kami mengundang Bapak/Ibu Jamaah Umroh beserta keluarga dalam acara Halal Bi Halal & Temu Kangen Alumni Jamaah Umroh.`;
    } else if (newType === "SURAT_CUSTOM") {
      defaultDest = "";
      defaultSubject = "";
      defaultCustomTitle = "";
      defaultNote = "";
      defaultBody = `Bersama ini kami selaku Pimpinan PT SULTHAN HARAMAIN TOUR & TRAVEL menerangkan bahwa calon jamaah umroh kami yang terdaftar pada program keberangkatan resmi memerlukan dokumen surat keterangan ini untuk keperluan kelengkapan administratif.`;
    }

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
      }

      const res = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
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
    setEditFormData({
      pilgrimId: letter.pilgrimId || "",
      type: letter.type || "SURAT_ENDORSEMENT_PASPOR",
      customTitle: letter.customTitle || "",
      customSubject: letter.customSubject || "",
      customBody: letter.customBody || "",
      destinationInstitution: letter.destinationInstitution || "",
      applicantJobTitle: letter.applicantJobTitle || "Karyawan Swasta",
      letterCity: letter.letterCity || "Tebing Tinggi",
      fatherName: p?.fatherName || "",
      endorsedTargetName: getEndorsedName(letter),
      customNotes: letter.customNotes || "",
      generatedBy: letter.generatedBy || travelSettings.directorName || "H. Sulthan Syarif, Lc., M.A.",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLetter) return;
    setLoading(true);
    try {
      const res = await fetch("/api/letters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingLetter.id,
          ...editFormData,
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 no-print">
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

              {/* SPECIFIC FIELDS FOR UNDANGAN MANASIK / HALAL BI HALAL */}
              {(formData.type === "SURAT_UNDANGAN_MANASIK" || formData.type === "SURAT_UNDANGAN_HALAL_BIHALAL") && (
                <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      {formData.type === "SURAT_UNDANGAN_MANASIK"
                        ? "Detail Undangan Manasik Umroh & Pembagian Perlengkapan"
                        : "Detail Undangan Halal Bi Halal & Silaturahmi Pasca Umroh"}
                    </div>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-md">
                      {formData.type === "SURAT_UNDANGAN_MANASIK" ? "Pra-Keberangkatan" : "Pasca-Kepulangan"}
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800">Perihal / Hal Undangan *</label>
                    <input
                      type="text"
                      required
                      value={formData.customSubject}
                      onChange={(e) => setFormData({ ...formData, customSubject: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800">Paragraf Pembuka Undangan *</label>
                    <textarea
                      rows={3}
                      required
                      value={formData.customBody}
                      onChange={(e) => setFormData({ ...formData, customBody: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              )}

              {/* SPECIFIC FIELDS FOR CUSTOM LETTER */}
              {formData.type === "SURAT_CUSTOM" && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
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
                  <div>
                    <label className="font-bold text-slate-800">Perihal / Hal Surat *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Permohonan Fasilitas Kursi Roda dan Prioritas Layanan"
                      value={formData.customSubject}
                      onChange={(e) => setFormData({ ...formData, customSubject: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-800">Paragraf Isi / Permohonan Khusus</label>
                    <textarea
                      rows={3}
                      value={formData.customBody}
                      onChange={(e) => setFormData({ ...formData, customBody: e.target.value })}
                      placeholder="Tuliskan isi permohonan atau pernyataan yang diinginkan..."
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                </div>
              )}

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

              {/* SPECIFIC FIELDS FOR UNDANGAN MANASIK / HALAL BI HALAL */}
              {(editFormData.type === "SURAT_UNDANGAN_MANASIK" || editFormData.type === "SURAT_UNDANGAN_HALAL_BIHALAL") && (
                <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      {editFormData.type === "SURAT_UNDANGAN_MANASIK"
                        ? "Detail Undangan Manasik Umroh & Pembagian Perlengkapan"
                        : "Detail Undangan Halal Bi Halal & Silaturahmi Pasca Umroh"}
                    </div>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                      {editFormData.type === "SURAT_UNDANGAN_MANASIK" ? "Pra-Keberangkatan" : "Pasca-Kepulangan"}
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800">Perihal / Hal Undangan *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.customSubject}
                      onChange={(e) => setEditFormData({ ...editFormData, customSubject: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-amber-300 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800">Paragraf Pembuka Undangan *</label>
                    <textarea
                      rows={3}
                      required
                      value={editFormData.customBody}
                      onChange={(e) => setEditFormData({ ...editFormData, customBody: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-amber-300 p-2.5 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              )}

              {/* SPECIFIC FIELDS FOR CUSTOM LETTER */}
              {editFormData.type === "SURAT_CUSTOM" && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
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
                  <div>
                    <label className="font-bold text-slate-800">Perihal / Hal Surat *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Permohonan Fasilitas Kursi Roda dan Prioritas Layanan"
                      value={editFormData.customSubject}
                      onChange={(e) => setEditFormData({ ...editFormData, customSubject: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-800">Paragraf Isi / Permohonan Khusus</label>
                    <textarea
                      rows={3}
                      value={editFormData.customBody}
                      onChange={(e) => setEditFormData({ ...editFormData, customBody: e.target.value })}
                      placeholder="Tuliskan isi permohonan atau pernyataan yang diinginkan..."
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                </div>
              )}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-transparent print:static print:block print:overflow-visible">
          <div className="printable-modal-content bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[95vh] overflow-y-auto print:max-h-none print:max-w-none print:overflow-visible print:p-0 print:space-y-0 print:shadow-none print:rounded-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 no-print">
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
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Cetak / Unduh PDF Sekarang
                </button>
                <button
                  onClick={() => setSelectedLetterForPrint(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dynamic Print Paper Size Styling */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                @page {
                  size: ${paperSize === "F4" ? "215mm 330mm portrait" : paperSize === "Letter" ? "letter portrait" : "A4 portrait"};
                  margin: 0.6cm;
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
                    {(["A4", "F4", "Letter"] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setPaperSize(size)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          paperSize === size
                            ? "bg-slate-900 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {size === "A4" ? "A4 (210×297)" : size === "F4" ? "F4 / Folio (215×330)" : "Letter"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2: Granular Checkboxes & Status Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-bold text-slate-800">
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
                    : "bg-emerald-100 text-emerald-900 border-emerald-300"
                }`}>
                  {!includeLetterhead ? `🖨️ Cetak Kertas Berkop (${paperSize})` : `📄 Cetak Kertas Polos (${paperSize})`}
                </span>
              </div>

              {!includeLetterhead && (
                <div className="text-[11px] text-amber-900 bg-amber-50/90 px-3 py-2 rounded-xl border border-amber-200 flex items-center gap-2">
                  <span className="font-bold text-amber-700">💡 Info Mode Kertas Berkop Fisik:</span>
                  <span>Kepala surat disembunyikan dan isi surat langsung naik ke baris teratas agar pas dicetak pada kertas blanko berkop Anda.</span>
                </div>
              )}
            </div>

            {/* Official Letter A4/F4 Template (Matching Exact Geometric PPIU Reference) */}
            <div className="print-sheet border border-slate-300 p-8 sm:p-10 rounded-2xl bg-white text-slate-900 font-sans leading-relaxed text-xs space-y-6 shadow-sm min-h-[840px] flex flex-col justify-between print:border-none print:shadow-none print:p-4 print:min-h-[27cm]">
              <div>
                {/* 1. KOP SURAT (Conditional) */}
                {includeLetterhead ? (
                  <>
                    <div className="flex items-center gap-4 pb-2">
                      <div className="h-16 w-16 flex-shrink-0 flex items-center justify-center p-1">
                        <img
                          src="/sulthan-haramain-logo.jpg"
                          alt="Logo Sulthan Haramain"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 uppercase leading-none">
                          {travelSettings.companyName || "PT BAROKAH SULTHAN HARAMAIN"}
                        </h1>
                        <p className="text-[10px] sm:text-[10.5px] text-slate-700 leading-tight mt-1">
                          {travelSettings.address || "Jl. Pahlawan No.10 J, Ps. Gambir, Kec. Tebing Tinggi Kota, Kota Tebing Tinggi, Sumatera Utara 20631"}
                        </p>
                        <p className="text-[9.5px] sm:text-[10px] font-semibold text-slate-700 leading-tight mt-0.5">
                          Telp / WhatsApp: {travelSettings.phone || "0821-6733-9464"} • Email: {travelSettings.email || "barokahsulthanharamain@gmail.com"}
                        </p>
                        <p className="text-[9.5px] sm:text-[10px] font-bold text-slate-900 leading-tight mt-0.5 tracking-tight">
                          {travelSettings.kemenhanLicense || "Keputusan Menteri Hukum Republik Indonesia NOMOR AHU-0007388.AH.01.01.TAHUN 2026"}
                        </p>
                        <p className="text-[8px] sm:text-[8.5px] font-semibold text-slate-500 tracking-wide mt-0.5 uppercase">
                          NO. IZIN PPIU : {(travelSettings.licenseNumber || "25052200384080005")
                            .replace(/•?\s*NIB[\s\S]*/i, "")
                            .replace(/•?\s*KBLI[\s\S]*/i, "")
                            .replace(/NO\.\s*IZIN\s*PPIU\s*:\s*/i, "")
                            .trim()}
                        </p>
                      </div>
                    </div>

                    {/* 2. GEOMETRIC HEADER DIVIDER LINE (Yellow Bar + Diagonal Slashes + Dark Wedge) */}
                    <div className="relative w-full h-5 flex items-center my-1 overflow-hidden">
                      {/* Left Gold Bar */}
                      <div className="h-2.5 flex-1 bg-gradient-to-r from-amber-400 to-amber-500 rounded-l" />
                      
                      {/* Middle Diagonal Slashes */}
                      <div className="flex gap-1 px-2">
                        <div className="w-1.5 h-3.5 bg-amber-400 -skew-x-25" />
                        <div className="w-1.5 h-3.5 bg-amber-400 -skew-x-25" />
                        <div className="w-1.5 h-3.5 bg-amber-400 -skew-x-25" />
                        <div className="w-1.5 h-3.5 bg-amber-400 -skew-x-25" />
                      </div>

                      {/* Right Dark Wedge Block */}
                      <div className="w-24 sm:w-32 h-3.5 bg-slate-900 -skew-x-25 -mr-3" />
                    </div>
                  </>
                ) : null}

                {/* 3. DATE & LETTER NUMBER */}
                <div className={`${includeLetterhead ? "pt-4" : "pt-0"} text-xs flex justify-between items-start`}>
                  <div>
                    <p className="font-mono text-slate-900">
                      <strong>Nomor :</strong> {selectedLetterForPrint.letterNumber || "001/MANASIK/SULTHAN/IX/2026"}
                    </p>
                    <p className="text-slate-900 mt-0.5">
                      <strong>Perihal :</strong>{" "}
                      <span className="font-bold underline">
                        {selectedLetterForPrint.type === "SURAT_UNDANGAN_MANASIK"
                          ? (selectedLetterForPrint.customSubject || "Undangan Bimbingan Manasik Ibadah Umroh & Pembagian Perlengkapan")
                          : selectedLetterForPrint.type === "SURAT_UNDANGAN_HALAL_BIHALAL"
                          ? (selectedLetterForPrint.customSubject || "Undangan Silaturahmi, Temu Alumni & Halal Bi Halal Pasca Umroh")
                          : selectedLetterForPrint.type === "SURAT_PERPANJANG_PASPOR" ||
                          (selectedLetterForPrint.customTitle && /perpanjang/i.test(selectedLetterForPrint.customTitle))
                          ? "Permohonan Perpanjangan / Penggantian Paspor Calon Jemaah Umrah"
                          : selectedLetterForPrint.type === "SURAT_ENDORSEMENT_PASPOR" ||
                            (selectedLetterForPrint.customTitle && /endorse/i.test(selectedLetterForPrint.customTitle))
                          ? "Permohonan Penambahan / Endorsement Nama pada Paspor"
                          : selectedLetterForPrint.type === "SURAT_REKOMENDASI_PASPOR"
                          ? "Permohonan Paspor Calon Jemaah Umrah"
                          : selectedLetterForPrint.customSubject || getLetterTitle(selectedLetterForPrint)}
                      </span>
                    </p>
                  </div>
                  <p className="text-slate-900 font-semibold">
                    {selectedLetterForPrint.letterCity || "Tebing Tinggi"}, {formatDate(selectedLetterForPrint.issueDate || selectedLetterForPrint.createdAt, "dd MMMM yyyy")}
                  </p>
                </div>

                {/* 4. RECIPIENT */}
                <div className="pt-4 text-xs space-y-0.5">
                  <p>Kepada Yth :</p>
                  <p className="font-bold text-slate-950">{selectedLetterForPrint.destinationInstitution || "Bapak/Ibu Calon Jamaah Umroh & Keluarga"}</p>
                  <p>Di</p>
                  <p>Tempat</p>
                </div>

                {/* 5. LETTER BODY */}
                {selectedLetterForPrint.type === "SURAT_UNDANGAN_MANASIK" || selectedLetterForPrint.type === "SURAT_UNDANGAN_HALAL_BIHALAL" ? (
                  <div className="pt-3.5 space-y-3 text-xs text-justify leading-relaxed">
                    <p className="font-bold text-slate-950">Assalamu’alaikum Warahmatullahi Wabarakatuh,</p>

                    <p className="text-slate-800">
                      {selectedLetterForPrint.customBody ? (
                        selectedLetterForPrint.customBody
                      ) : selectedLetterForPrint.type === "SURAT_UNDANGAN_MANASIK" ? (
                        <>
                          Puji dan syukur senantiasa kita panjatkan ke hadirat Allah SWT atas segala limpahan rahmat dan hidayah-Nya. Sehubungan dengan semakin dekatnya jadwal keberangkatan ibadah Umroh ke Tanah Suci, bersama ini kami dari <strong>{travelSettings.companyName}</strong> mengundang Bapak/Ibu Calon Jamaah Umroh beserta keluarga untuk hadir dalam kegiatan <strong>Bimbingan Manasik Ibadah Umroh</strong> sekaligus <strong>Pembagian Koper & Perlengkapan Resmi Travel</strong>.
                        </>
                      ) : (
                        <>
                          Alhamdulillahirabbil&apos;alamin, atas limpahan rahmat, perlindungan, dan kemudahan dari Allah SWT, seluruh rangkaian ibadah Umroh ke Tanah Suci Makkah dan Madinah telah terlaksana dengan lancar dan seluruh jamaah telah tiba kembali di tanah air dalam keadaan sehat wal&apos;afiat. Guna mempererat tali silaturahmi, menjaga kemabruran ibadah, dan ukhuwah islamiyah antar sesama jamaah, kami mengundang Bapak/Ibu Jamaah Umroh beserta keluarga dalam acara <strong>Silaturahmi & Halal Bi Halal Pasca Umroh</strong>.
                        </>
                      )}
                    </p>

                    <div className="space-y-1.5 pt-1">
                      <p className="font-bold text-slate-900">
                        Adapun rincian informasi dan data kegiatan adalah sebagai berikut :
                      </p>

                      <div className="border border-slate-900 rounded-xl p-3.5 bg-slate-50/50 space-y-2">
                        <div className="grid grid-cols-[150px_12px_1fr] text-slate-900">
                          <span className="font-semibold">Nama Jamaah</span>
                          <span>:</span>
                          <span className="font-black uppercase text-slate-950">{selectedLetterForPrint.pilgrim?.name || "-"}</span>
                        </div>

                        <div className="grid grid-cols-[150px_12px_1fr] text-slate-900">
                          <span className="font-semibold">Program Paket Umroh</span>
                          <span>:</span>
                          <span className="font-bold text-slate-900">
                            {selectedLetterForPrint.pilgrim?.package?.name || "Program Umroh Reguler"}
                          </span>
                        </div>

                        {selectedLetterForPrint.pilgrim?.package?.departureDate && (
                          <div className="grid grid-cols-[150px_12px_1fr] text-slate-900">
                            <span className="font-semibold">Jadwal Keberangkatan</span>
                            <span>:</span>
                            <span className="font-semibold text-slate-900">
                              {formatDate(selectedLetterForPrint.pilgrim?.package?.departureDate, "dd MMMM yyyy")}
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-[150px_12px_1fr] text-slate-900">
                          <span className="font-semibold">Agenda Kegiatan</span>
                          <span>:</span>
                          <span>
                            {selectedLetterForPrint.type === "SURAT_UNDANGAN_MANASIK" ? (
                              <span className="font-medium text-slate-900 block space-y-0.5">
                                <span>1. Pembekalan Teori Rukun, Wajib, Sunnah & Larangan Ibadah Umroh</span><br />
                                <span>2. Simulasi Praktik Thawaf, Sa&apos;i, dan Tahallul</span><br />
                                <span>3. Penjelasan Teknis Handling Bandara & Ketentuan Bagasi Pesawat</span><br />
                                <span>4. Pembagian Koper Fiber, Seragam Batik, Ihram/Mukena & Buku Doa</span>
                              </span>
                            ) : (
                              <span className="font-medium text-slate-900 block space-y-0.5">
                                <span>1. Pembacaan Doa Syukur & Tausiyah &quot;Merawat Kemabruran Pasca Umroh&quot;</span><br />
                                <span>2. Penayangan Video Dokumentasi Perjalanan & Kesan Pesan Jamaah</span><br />
                                <span>3. Penyerahan Sertifikat / Piagam Resmi Umroh (Syahadah Al-Umrah)</span><br />
                                <span>4. Silaturahmi Ukhuwah & Jamuan Makan Bersama</span>
                              </span>
                            )}
                          </span>
                        </div>

                        {selectedLetterForPrint.customNotes && (
                          <div className="grid grid-cols-[150px_12px_1fr] text-slate-900 pt-1.5 border-t border-slate-200">
                            <span className="font-semibold">Waktu, Tempat & Catatan</span>
                            <span>:</span>
                            <span className="font-semibold text-slate-950 whitespace-pre-line">{selectedLetterForPrint.customNotes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="pt-1 text-slate-800">
                      Mengingat pentingnya acara ini demi {selectedLetterForPrint.type === "SURAT_UNDANGAN_MANASIK" ? "kesiapan fisik, mental, dan kelancaran ibadah Bapak/Ibu di Tanah Suci" : "menjaga tali ukhuwah islamiyah dan kelanggengan nilai-nilai ibadah kita"}, kehadiran Bapak/Ibu tepat pada waktunya sangat kami harapkan.
                    </p>

                    <p className="pt-0.5 text-slate-800">
                      Atas perhatian, kesediaan waktu, dan kehadirannya, kami ucapkan terima kasih yang sebesar-besarnya. <em>Jazakumullahu Khairan Katsiran</em>.
                    </p>

                    <p className="font-bold text-slate-950 pt-1">Wassalamu’alaikum Warahmatullahi Wabarakatuh,</p>
                  </div>
                ) : selectedLetterForPrint.type === "SURAT_REKOMENDASI_PASPOR" ||
                selectedLetterForPrint.type === "SURAT_PERPANJANG_PASPOR" ||
                selectedLetterForPrint.type === "SURAT_ENDORSEMENT_PASPOR" ||
                (selectedLetterForPrint.customTitle && /perpanjang.*paspor|paspor.*baru|endorse/i.test(selectedLetterForPrint.customTitle)) ? (
                  <div className="pt-3 space-y-3 text-xs text-justify leading-relaxed">
                    <p className="font-semibold text-slate-900">Assalamu’alaikum Wr. Wb.</p>
                    <p className="text-slate-800">
                      Semoga Allah SWT melimpahkan Rahmat dan Hidayah-Nya kepada kita semua sehingga kita dapat melaksanakan aktifitas sehari-hari dengan baik.
                    </p>

                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">Saya yang bertanda tangan dibawah ini:</p>
                      <div className="pl-3 sm:pl-5 space-y-0.5 text-slate-900">
                        <div className="grid grid-cols-[140px_12px_1fr]">
                          <span className="font-semibold">Nama</span>
                          <span>:</span>
                          <span className="font-bold uppercase text-slate-950">{selectedLetterForPrint.generatedBy || travelSettings.directorName || "ATIYATUL AMRA"}</span>
                        </div>
                        <div className="grid grid-cols-[140px_12px_1fr]">
                          <span className="font-semibold">Jabatan</span>
                          <span>:</span>
                          <span className="font-bold uppercase text-slate-950">{travelSettings.directorTitle || "DIREKTUR UTAMA"}</span>
                        </div>
                        <div className="grid grid-cols-[140px_12px_1fr]">
                          <span className="font-semibold">Alamat</span>
                          <span>:</span>
                          <span>{travelSettings.address || "Jl. Pahlawan No.10 J, Ps. Gambir, Kec. Tebing Tinggi Kota, Kota Tebing Tinggi, Sumatera Utara 20631"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <p className="font-semibold text-slate-900">
                        {selectedLetterForPrint.type === "SURAT_ENDORSEMENT_PASPOR"
                          ? "Bersama ini saya mengajukan permohonan penambahan / endorsement nama pada halaman pengesahan paspor menjadi 3 (tiga) suku kata guna memenuhi persyaratan penerbitan Visa Umroh dari Kementerian Haji dan Umrah Kerajaan Arab Saudi, untuk calon Jemaah Umrah dengan data sebagai berikut:"
                          : selectedLetterForPrint.type === "SURAT_PERPANJANG_PASPOR"
                          ? "Bersama ini saya mengajukan permohonan perpanjangan / penggantian paspor untuk calon Jemaah Umrah dengan data sebagai berikut:"
                          : "Bersama ini saya mengajukan permohonan paspor untuk calon Jemaah Umrah dengan data sebagai berikut:"}
                      </p>

                      <div className="pl-3 sm:pl-5 space-y-0.5 text-slate-900">
                        <div className="grid grid-cols-[140px_12px_1fr]">
                          <span className="font-semibold">{selectedLetterForPrint.type === "SURAT_ENDORSEMENT_PASPOR" ? "Nama Sesuai KTP" : "Nama"}</span>
                          <span>:</span>
                          <span className="font-bold uppercase text-slate-950">{selectedLetterForPrint.pilgrim?.name || "-"}</span>
                        </div>

                        {selectedLetterForPrint.type === "SURAT_ENDORSEMENT_PASPOR" && (
                          <div className="grid grid-cols-[140px_12px_1fr] bg-amber-50/80 p-1 rounded">
                            <span className="font-bold text-amber-950">Nama Endorsement (3 Kata)</span>
                            <span className="text-amber-950">:</span>
                            <span className="font-black text-slate-950 underline uppercase tracking-wide">
                              {getEndorsedName(selectedLetterForPrint)}
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-[140px_12px_1fr]">
                          <span className="font-semibold">Tempat/tanggal lahir</span>
                          <span>:</span>
                          <span className="uppercase">
                            {selectedLetterForPrint.pilgrim?.placeOfBirth || "INDONESIA"}, {formatDate(selectedLetterForPrint.pilgrim?.dateOfBirth, "dd-MM-yyyy")}
                          </span>
                        </div>

                        <div className="grid grid-cols-[140px_12px_1fr]">
                          <span className="font-semibold">NIK</span>
                          <span>:</span>
                          <span className="font-mono font-bold text-slate-950">{selectedLetterForPrint.pilgrim?.nik || "-"}</span>
                        </div>

                        {(selectedLetterForPrint.type === "SURAT_PERPANJANG_PASPOR" || selectedLetterForPrint.type === "SURAT_ENDORSEMENT_PASPOR") && (
                          <div className="grid grid-cols-[140px_12px_1fr]">
                            <span className="font-semibold">Nomor Paspor RI</span>
                            <span>:</span>
                            <span className="font-mono font-bold text-slate-950">
                              {selectedLetterForPrint.pilgrim?.passportNumber ? (
                                <>
                                  {selectedLetterForPrint.pilgrim?.passportNumber}{" "}
                                  {selectedLetterForPrint.pilgrim?.passportExpiry && (
                                    <span className="font-sans font-normal text-slate-600">
                                      (Masa Berlaku s/d: {formatDate(selectedLetterForPrint.pilgrim?.passportExpiry, "dd-MM-yyyy")})
                                    </span>
                                  )}
                                </>
                              ) : (
                                "Dalam Proses"
                              )}
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-[140px_12px_1fr]">
                          <span className="font-semibold">Alamat</span>
                          <span>:</span>
                          <span className="uppercase">
                            {selectedLetterForPrint.pilgrim?.address || selectedLetterForPrint.pilgrim?.city || "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="pt-1 text-slate-900">
                      Benar yang bersangkutan telah mendaftar dan berniat melaksanakan Ibadah Umrah melalui kami, berdasarkan <strong>SE Direktur Jendral Imigrasi No. IMI-0342 GR.01.01 tahun 2014</strong> tentang Penerbitan Proses Pengurusan Paspor oleh PPIU tanggal 04 Maret 2014, Kami menyatakan bahwa :
                    </p>

                    <ol className="list-decimal pl-5 space-y-1 text-slate-900 leading-relaxed">
                      <li>
                        Permohonan {selectedLetterForPrint.type === "SURAT_ENDORSEMENT_PASPOR" ? "penambahan / endorsement nama paspor" : selectedLetterForPrint.type === "SURAT_PERPANJANG_PASPOR" ? "perpanjangan / penggantian paspor" : "paspor"} yang diurus adalah Paspor Warga Negara Indonesia yang akan melakukan perjalanan ke Arab Saudi dalam rangka menunaikan Ibadah Umrah.
                      </li>
                      <li>
                        Rombongan calon jama’ah umrah yang diberangkatkan tidak akan melakukan pelanggaran peraturan Keimigrasian berupa penyalahgunaan izin tinggal, dan atau tidak melebihi izin tinggalnya (<em>overstay</em>), memalsukan atau membuat palsu paspor yang diberikan kepadanya maupun bekerja secara illegal.
                      </li>
                      <li>
                        Apabila terjadi pelanggaran sebagaimana dimaksud, maka izin usaha sebagai Penyelenggara Perjalanan Ibadah Umrah bersedia dicabut.
                      </li>
                      <li>
                        Calon Jama’ah tersebut Insya Allah akan berangkat Umrah pada bulan <strong>{formatDate(selectedLetterForPrint.pilgrim?.package?.departureDate, "MMMM yyyy")}</strong>.
                      </li>
                    </ol>

                    <p className="pt-0.5 text-slate-900">
                      Demikian surat pernyataan dan jaminan ini kami sampaikan, apabila kami tidak memenuhi kewajiban sebagaimana tersebut diatas, kami bersedia menerima sanksi sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.
                    </p>

                    <p className="font-semibold text-slate-900">Wassalamu’alaikum Wr. Wb.</p>
                  </div>
                ) : (
                  <div className="pt-4 space-y-3.5 text-xs text-justify leading-relaxed">
                    <p>Dengan hormat,</p>

                    {/* CUSTOM BODY OR DEDICATED TEMPLATE BODY */}
                    {selectedLetterForPrint.customBody ? (
                      <p>{selectedLetterForPrint.customBody}</p>
                    ) : selectedLetterForPrint.type === "SURAT_IZIN_CUTI" ? (
                      <p>
                        Bersama ini kami selaku Pimpinan <strong>{travelSettings.companyName}</strong> memohon kiranya Bapak/Ibu dapat memberikan dispensasi dan izin cuti bagi karyawan/peserta didik yang terdaftar sebagai calon jamaah umroh kami untuk menunaikan ibadah umroh ke Tanah Suci pada tanggal <strong>{formatDate(selectedLetterForPrint.pilgrim?.package?.departureDate, "dd MMMM yyyy")}</strong> s.d. selesai, dengan data diri sebagai berikut :
                      </p>
                    ) : (
                      <p>
                        Bersama ini kami memohon kepada Bapak/Ibu dapat kiranya mempermudah pengurusan{" "}
                        <strong>{getLetterTitle(selectedLetterForPrint)}</strong> jamaah umrah kami, yang terdaftar pada{" "}
                        <strong>{travelSettings.companyName}</strong>, yang akan berangkat pada tanggal{" "}
                        <strong>{formatDate(selectedLetterForPrint.pilgrim?.package?.departureDate, "dd MMMM yyyy")}</strong>{" "}
                        dengan nama sebagai berikut :
                      </p>
                    )}

                    {/* BORDERED TABLE FOR PILGRIM DATA */}
                    <div className="pt-1">
                      <table className="w-full border-collapse border border-slate-900 text-xs text-left">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-900 font-bold text-slate-900 text-center">
                            <th className="border border-slate-900 py-2 px-3">Data Informasi Jamaah</th>
                            <th className="border border-slate-900 py-2 px-3">Rincian Dokumen Resmi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          <tr>
                            <td className="border border-slate-900 py-2 px-3 font-bold text-slate-900 w-1/3">
                              Nama Lengkap Sesuai KTP
                            </td>
                            <td className="border border-slate-900 py-2 px-3 font-bold uppercase text-slate-950">
                              {selectedLetterForPrint.pilgrim?.name || "-"}
                            </td>
                          </tr>

                          <tr>
                            <td className="border border-slate-900 py-2 px-3 font-bold text-slate-900">
                              Nomor Induk Kependudukan (NIK)
                            </td>
                            <td className="border border-slate-900 py-2 px-3 font-mono font-bold text-slate-900">
                              {selectedLetterForPrint.pilgrim?.nik || "-"}
                            </td>
                          </tr>

                          <tr>
                            <td className="border border-slate-900 py-2 px-3 font-bold text-slate-900">
                              Tempat & Tanggal Lahir (TTL)
                            </td>
                            <td className="border border-slate-900 py-2 px-3 uppercase text-slate-900">
                              {selectedLetterForPrint.pilgrim?.placeOfBirth || "INDONESIA"},{" "}
                              {formatDate(selectedLetterForPrint.pilgrim?.dateOfBirth, "dd MMMM yyyy")}
                            </td>
                          </tr>

                          <tr>
                            <td className="border border-slate-900 py-2 px-3 font-bold text-slate-900">
                              Nomor Paspor RI
                            </td>
                            <td className="border border-slate-900 py-2 px-3 font-mono font-bold text-slate-900">
                              {selectedLetterForPrint.pilgrim?.passportNumber ? (
                                <>
                                  {selectedLetterForPrint.pilgrim?.passportNumber}{" "}
                                  {selectedLetterForPrint.pilgrim?.passportExpiry && (
                                    <span className="font-sans font-normal text-slate-600">
                                      (Berlaku s/d {formatDate(selectedLetterForPrint.pilgrim?.passportExpiry, "dd MMM yyyy")})
                                    </span>
                                  )}
                                </>
                              ) : (
                                "Dalam Proses Pembuatan / Perpanjangan"
                              )}
                            </td>
                          </tr>

                          <tr>
                            <td className="border border-slate-900 py-2 px-3 font-bold text-slate-900">
                              Program Paket & Jadwal
                            </td>
                            <td className="border border-slate-900 py-2 px-3 text-slate-900">
                              <strong>{selectedLetterForPrint.pilgrim?.package?.name || "Program Umroh Reguler"}</strong>{" "}
                              (Keberangkatan: {formatDate(selectedLetterForPrint.pilgrim?.package?.departureDate, "dd MMMM yyyy")})
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {selectedLetterForPrint.customNotes &&
                      !selectedLetterForPrint.customNotes.startsWith("Permohonan penambahan nama") &&
                      !selectedLetterForPrint.customNotes.startsWith("Target Nama Endorsement") && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] leading-normal">
                        <strong>Keterangan Tambahan:</strong>
                        <p className="mt-0.5 text-slate-800">{selectedLetterForPrint.customNotes}</p>
                      </div>
                    )}

                    <p className="pt-1">
                      Demikian surat ini kami ajukan kepada Bapak/Ibu dengan harapan Bapak/Ibu berkenan membantu kelancaran proses tersebut. Atas bantuan, perhatian, dan kerjasama yang baik, kami ucapkan terima kasih.
                    </p>
                  </div>
                )}

                {/* 6. SIGNATURE AREA (All on the Left for Immigration Letters with Materai) */}
                {selectedLetterForPrint.type === "SURAT_REKOMENDASI_PASPOR" ||
                selectedLetterForPrint.type === "SURAT_PERPANJANG_PASPOR" ||
                selectedLetterForPrint.type === "SURAT_ENDORSEMENT_PASPOR" ||
                (selectedLetterForPrint.customTitle && /perpanjang.*paspor|paspor.*baru|endorse/i.test(selectedLetterForPrint.customTitle)) ? (
                  <div className="pt-6 sm:pt-8 flex flex-col items-start text-left text-xs space-y-2.5">
                    <p className="font-bold text-slate-950 uppercase tracking-wide">
                      {travelSettings.companyName || "PT. BAROKAH SULTHAN HARAMAIN"}
                    </p>

                    {/* Kotak Meterai Lapang & Ruang TTD/Stempel di Sebelah Kiri */}
                    <div className="flex items-center gap-5 my-2.5 sm:my-3.5">
                      <div className="border-2 border-dashed border-slate-400 rounded-2xl p-2.5 text-center w-36 sm:w-40 h-24 sm:h-26 flex flex-col items-center justify-center bg-slate-50/90 text-[9.5px] text-slate-600 shrink-0 shadow-2xs">
                        <span className="font-bold text-slate-700 tracking-wider uppercase text-[9px]">METERAI TEMPEL</span>
                        <span className="font-black text-slate-950 text-xs my-0.5">Rp 10.000</span>
                        <span className="text-[7.5px] text-slate-500 leading-tight">Tempel di sini & TTD menimpa</span>
                      </div>
                      <div className="h-24 sm:h-26 w-48 sm:w-56 flex items-center">
                        {/* Ruang Bersih & Renggang untuk Tanda Tangan Basah & Cap Stempel Resmi Perusahaan */}
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="font-black text-slate-950 underline text-xs uppercase tracking-wide">
                        {selectedLetterForPrint.generatedBy || travelSettings.directorName || "ATIYATUL AMRA"}
                      </p>
                      <p className="text-[11px] text-slate-800 font-semibold mt-0.5">
                        {travelSettings.directorTitle || "Direktur Utama"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="pt-6 sm:pt-8 flex flex-col items-start text-xs space-y-2">
                    <p className="font-medium text-slate-800">Hormat Kami,</p>
                    <p className="font-bold text-slate-950 uppercase">{travelSettings.companyName}</p>
                    <div className="my-2 h-20 sm:h-24 w-48 sm:w-56">
                      {/* Ruang Bersih untuk Tanda Tangan Fisik & Stempel Resmi Perusahaan */}
                    </div>
                    <div>
                      <p className="font-black text-slate-950 underline text-xs uppercase tracking-wide">
                        {selectedLetterForPrint.generatedBy || travelSettings.directorName || "ATIYATUL AMRA"}
                      </p>
                      <p className="text-[11px] text-slate-800 font-semibold mt-0.5">{travelSettings.directorTitle || "Direktur Utama"}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 7. GEOMETRIC FOOTER DIVIDER (Matching Exact PPIU Reference) */}
              {includeFooter ? (
                <div className="pt-6">
                  <div className="relative w-full h-7 flex items-center overflow-hidden">
                    {/* Left Dark Wedge Block */}
                    <div className="w-24 sm:w-32 h-4 bg-slate-900 -skew-x-25 -ml-3" />

                    {/* Middle Diagonal Slashes */}
                    <div className="flex gap-1 px-2">
                      <div className="w-1.5 h-3.5 bg-amber-400 -skew-x-25" />
                      <div className="w-1.5 h-3.5 bg-amber-400 -skew-x-25" />
                      <div className="w-1.5 h-3.5 bg-amber-400 -skew-x-25" />
                      <div className="w-1.5 h-3.5 bg-amber-400 -skew-x-25" />
                    </div>

                    {/* Right Gold Contact Bar */}
                    <div className="h-4 flex-1 bg-gradient-to-r from-amber-400 to-amber-500 rounded-r flex items-center justify-end px-3 gap-4 text-[9px] font-bold text-slate-950">
                      <span className="flex items-center gap-1">
                        📞 {travelSettings.phone || "0821-6733-9464"}
                      </span>
                      <span className="flex items-center gap-1">
                        ✉️ {travelSettings.email || "barokahsulthanharamain@gmail.com"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-2" />
              )}
            </div>

            {/* ATTACHMENT PAGES (LAMPIRAN DOKUMEN LEGALITAS RESMI PPIU) */}
            {includeLegalAttachments && (
              <div className="space-y-6 print:space-y-0">
                {/* PAGE 2: SK KEMENKUMHAM RI */}
                <div className="print-attachment-page border border-slate-300 p-6 sm:p-8 rounded-2xl bg-white shadow-sm flex flex-col justify-between print:border-none print:shadow-none print:p-0">
                  <div className="space-y-3 w-full">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-slate-800">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                        LAMPIRAN I: SALINAN KEPUTUSAN MENTERI HUKUM REPUBLIK INDONESIA
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        HALAMAN 2 DARI 4
                      </span>
                    </div>
                    <div className="p-1 rounded-xl bg-white border border-slate-200 print:border-none overflow-hidden flex items-center justify-center">
                      <img
                        src="/legal-docs/legalitas-kemenkumham.png"
                        alt="SK Kemenkumham Pengesahan PT Barokah Sulthan Haramain"
                        className="print-attachment-img w-full max-h-[1050px] object-contain mx-auto"
                      />
                    </div>
                  </div>
                </div>

                {/* PAGE 3: NIB HALAMAN 1 */}
                <div className="print-attachment-page border border-slate-300 p-6 sm:p-8 rounded-2xl bg-white shadow-sm flex flex-col justify-between print:border-none print:shadow-none print:p-0">
                  <div className="space-y-3 w-full">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-slate-800">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                        LAMPIRAN II: NOMOR INDUK BERUSAHA (NIB) 1504260072814 - PEMERINTAH RI
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        HALAMAN 3 DARI 4
                      </span>
                    </div>
                    <div className="p-1 rounded-xl bg-white border border-slate-200 print:border-none overflow-hidden flex items-center justify-center">
                      <img
                        src="/legal-docs/legalitas-nib-1.png"
                        alt="NIB PT Barokah Sulthan Haramain"
                        className="print-attachment-img w-full max-h-[1050px] object-contain mx-auto"
                      />
                    </div>
                  </div>
                </div>

                {/* PAGE 4: LAMPIRAN NIB KBLI 79122 (UMROH & HAJI KHUSUS) */}
                <div className="print-attachment-page border border-slate-300 p-6 sm:p-8 rounded-2xl bg-white shadow-sm flex flex-col justify-between print:border-none print:shadow-none print:p-0">
                  <div className="space-y-3 w-full">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-slate-800">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                        LAMPIRAN III: LAMPIRAN NIB KBLI 79122 (BIRO PERJALANAN IBADAH UMROH & HAJI KHUSUS)
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        HALAMAN 4 DARI 4
                      </span>
                    </div>
                    <div className="p-1 rounded-xl bg-white border border-slate-200 print:border-none overflow-hidden flex items-center justify-center">
                      <img
                        src="/legal-docs/legalitas-nib-2.png"
                        alt="Lampiran NIB KBLI 79122 PPIU"
                        className="print-attachment-img w-full max-h-[1050px] object-contain mx-auto"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
