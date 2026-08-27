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
} from "lucide-react";
import { formatDate } from "@/lib/utils";

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(!!initialPilgrim);
  const [selectedLetterForPrint, setSelectedLetterForPrint] = useState<any | null>(null);
  const [includeLegalAttachments, setIncludeLegalAttachments] = useState(true);
  const [travelSettings, setTravelSettings] = useState<any>({
    companyName: "PT SULTHAN HARAMAIN TOUR & TRAVEL",
    licenseNumber: "PPIU Kemenag RI No. U.412 Tahun 2022",
    kemenhanLicense: "Izin Khusus Kemenhan RI No. B/108/M/XII/2023",
    address: "Sulthan Haramain Tower, Jl. Prof. Dr. Satrio No. 88, Kuningan, Jakarta Selatan 12940",
    phone: "(021) 5290-8888 / 0811-9876-5432",
    email: "salam@sulthanharamain.com",
    directorName: "H. Sulthan Syarif, Lc., M.A.",
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
    endorsedTargetName: "",
    customNotes: "Permohonan penambahan nama 3 kata pada halaman pengesahan paspor untuk syarat Visa Umroh.",
    generatedBy: "H. Sulthan Syarif, Lc., M.A.",
  });

  const [loading, setLoading] = useState(false);

  // Auto-sync selected pilgrim details when pilgrimId changes
  useEffect(() => {
    const p = pilgrims.find((item) => item.id === formData.pilgrimId) || initialPilgrim;
    if (p) {
      if (formData.type === "SURAT_ENDORSEMENT_PASPOR" && !formData.endorsedTargetName) {
        // Suggest 3-word name if mahram/father name available
        const currentName = p.name || "";
        const words = currentName.split(" ");
        if (words.length < 3 && p.mahramName) {
          setFormData((prev) => ({
            ...prev,
            endorsedTargetName: `${currentName} ${p.mahramName}`.toUpperCase(),
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            endorsedTargetName: currentName.toUpperCase(),
          }));
        }
      }
    }
  }, [formData.pilgrimId, formData.type, pilgrims, initialPilgrim]);

  const filteredLetters = letters.filter((l) =>
    l.letterNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.pilgrim?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.destinationInstitution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.customTitle && l.customTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
      defaultDest = "Kepala Kantor Imigrasi Kelas I / II TPI";
      defaultSubject = "Permohonan Rekomendasi Pembuatan Paspor Baru";
      defaultNote = "Untuk keperluan kelengkapan pembuatan paspor perjalanan ibadah Umroh.";
      defaultCustomTitle = "Surat Rekomendasi Pembuatan Paspor";
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
      // If endorsement, append target name to notes if not yet present
      let finalNotes = formData.customNotes;
      if (formData.type === "SURAT_ENDORSEMENT_PASPOR" && formData.endorsedTargetName) {
        finalNotes = `Target Nama Endorsement (3 Kata): ${formData.endorsedTargetName}. ${formData.customNotes}`;
      }

      const res = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
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

  const getLetterTitle = (letter: any) => {
    if (letter?.customTitle) return letter.customTitle;
    const type = typeof letter === "string" ? letter : letter?.type;
    switch (type) {
      case "SURAT_ENDORSEMENT_PASPOR":
        return "Surat Permohonan Endos Nama di Paspor";
      case "SURAT_REKOMENDASI_PASPOR":
        return "Surat Rekomendasi Pembuatan Paspor";
      case "SURAT_IZIN_CUTI":
        return "Surat Permohonan Izin Cuti Umroh";
      case "SURAT_PENGANTAR_KEMENAG":
        return "Surat Pengantar Rekomendasi Kemenag";
      case "SURAT_KETERANGAN_JAMAAH":
        return "Surat Keterangan Terdaftar Jamaah";
      case "SURAT_MAHRAM":
        return "Surat Keterangan Mahram & Pendamping";
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 no-print">
        <button
          onClick={() => {
            handleTypeChange("SURAT_ENDORSEMENT_PASPOR");
            setIsAddModalOpen(true);
          }}
          className="p-2.5 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 text-left transition-all group shadow-2xs"
        >
          <span className="text-[10px] font-bold text-amber-800 uppercase block">Imigrasi</span>
          <p className="text-xs font-bold text-slate-900 group-hover:text-amber-700 line-clamp-1 mt-0.5">
            Endos Nama Paspor
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
                filteredLetters.map((l) => (
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
                  onChange={(e) => setFormData({ ...formData, pilgrimId: e.target.value })}
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
                      <option value="SURAT_IZIN_CUTI">Surat Permohonan Izin Cuti Kerja / Kuliah / Sekolah</option>
                      <option value="SURAT_PENGANTAR_KEMENAG">Surat Pengantar Rekomendasi Kemenag Kab/Kota</option>
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
                <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Detail Endorsement Nama (Syarat Visa Saudi Min. 3 Suku Kata)
                  </div>
                  <div>
                    <label className="font-bold text-slate-800">
                      Target Nama Lengkap 3 Kata yang Diajukan di Halaman Endorsement *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SULTHAN SYARIF ABDULLAH"
                      value={formData.endorsedTargetName}
                      onChange={(e) => setFormData({ ...formData, endorsedTargetName: e.target.value.toUpperCase() })}
                      className="mt-1 w-full rounded-xl border border-amber-300 p-2.5 bg-white font-bold text-slate-900 uppercase"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Format umum Imigrasi: [Nama Depan] [Nama Tengah] [Nama Ayah Kandung / Bin ...]
                    </span>
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

              {/* DESTINATION INSTITUTION */}
              <div>
                <label className="font-bold text-slate-700">Tujuan Surat / Nama Instansi & Pejabat *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kepala Kantor Imigrasi Kelas I TPI Jakarta Selatan"
                  value={formData.destinationInstitution}
                  onChange={(e) => setFormData({ ...formData, destinationInstitution: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
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

      {/* Modal 2: Tampilan Dokumen Surat Resmi Siap Cetak (A4 Standard Print View) */}
      {selectedLetterForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[95vh] overflow-y-auto">
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all"
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

            {/* Legal Document Attachment Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50/90 p-3.5 rounded-2xl border border-amber-200 no-print">
              <label className="flex items-center gap-2.5 text-xs font-bold text-amber-950 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeLegalAttachments}
                  onChange={(e) => setIncludeLegalAttachments(e.target.checked)}
                  className="rounded border-amber-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span>Lampirkan Salinan Dokumen Legalitas Resmi (SK Kemenkumham RI & NIB Berbasis Risiko)</span>
              </label>
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded-full border border-amber-300">
                {includeLegalAttachments ? "📄 Total 4 Halaman Siap Cetak" : "📄 1 Halaman Surat Saja"}
              </span>
            </div>

            {/* Official Letter A4 Template (Matching Exact Geometric PPIU Reference) */}
            <div className="border border-slate-300 p-8 sm:p-10 rounded-2xl bg-white text-slate-900 font-sans leading-relaxed text-xs space-y-6 shadow-sm min-h-[840px] flex flex-col justify-between">
              <div>
                {/* 1. KOP SURAT */}
                <div className="flex items-center gap-4 pb-2">
                  <div className="h-16 w-16 flex-shrink-0 flex items-center justify-center p-1">
                    <img
                      src="/sulthan-haramain-logo.jpg"
                      alt="Logo Sulthan Haramain"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                      {travelSettings.companyName || "PT. SULTHAN HARAMAIN TOUR & TRAVEL"}
                    </h1>
                    <p className="text-[11px] font-black text-slate-800 tracking-wide mt-0.5">
                      NO. IZIN PPIU : {travelSettings.licenseNumber || "PPIU Kemenag RI No. U.412 Tahun 2022"}
                      {travelSettings.kemenhanLicense && ` • ${travelSettings.kemenhanLicense}`}
                    </p>
                    <p className="text-[10px] text-slate-600 leading-tight mt-0.5">
                      {travelSettings.address || "Sulthan Haramain Tower, Jl. Prof. Dr. Satrio No. 88, Kuningan, Jakarta Selatan"}
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

                {/* 3. DATE & LETTER NUMBER */}
                <div className="pt-4 text-xs flex justify-between items-start">
                  <div>
                    <p className="font-mono text-slate-900">
                      <strong>Nomor :</strong> {selectedLetterForPrint.letterNumber || "001/ENDOS/SULTHAN/VIII/2026"}
                    </p>
                    <p className="text-slate-900 mt-0.5">
                      <strong>Perihal :</strong>{" "}
                      <span className="font-bold underline">
                        {selectedLetterForPrint.customSubject ||
                          (selectedLetterForPrint.type === "SURAT_ENDORSEMENT_PASPOR"
                            ? "Permohonan Penambahan / Endorsement Nama pada Paspor"
                            : getLetterTitle(selectedLetterForPrint))}
                      </span>
                    </p>
                  </div>
                  <p className="text-slate-900">
                    Jakarta, {formatDate(selectedLetterForPrint.issueDate, "dd MMMM yyyy")}
                  </p>
                </div>

                {/* 4. RECIPIENT */}
                <div className="pt-4 text-xs space-y-0.5">
                  <p>Kepada Yth :</p>
                  <p className="font-bold text-slate-950">{selectedLetterForPrint.destinationInstitution}</p>
                  <p>Di</p>
                  <p>Tempat</p>
                </div>

                {/* 5. LETTER BODY */}
                <div className="pt-4 space-y-3.5 text-xs text-justify leading-relaxed">
                  <p>Dengan hormat,</p>

                  {/* CUSTOM BODY OR DEDICATED TEMPLATE BODY */}
                  {selectedLetterForPrint.customBody ? (
                    <p>{selectedLetterForPrint.customBody}</p>
                  ) : selectedLetterForPrint.type === "SURAT_ENDORSEMENT_PASPOR" ? (
                    <p>
                      Bersama ini kami selaku Pimpinan <strong>{travelSettings.companyName}</strong> (Izin Penyelenggara Perjalanan Ibadah Umrah No. {travelSettings.licenseNumber}) mengajukan permohonan kepada Bapak/Ibu kiranya berkenan melakukan <strong>Penambahan / Endorsement Nama</strong> pada Halaman Pengesahan (Endorsement Page) paspor calon jamaah umroh kami menjadi <strong>3 (tiga) suku kata</strong> guna memenuhi persyaratan penerbitan Visa Umroh dari Kementerian Haji dan Umrah Kerajaan Arab Saudi, atas nama jamaah berikut :
                    </p>
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

                        {selectedLetterForPrint.type === "SURAT_ENDORSEMENT_PASPOR" && selectedLetterForPrint.customNotes && (
                          <tr className="bg-amber-50/50">
                            <td className="border border-slate-900 py-2 px-3 font-bold text-slate-900">
                              Nama Pengajuan Endorsement (3 Kata)
                            </td>
                            <td className="border border-slate-900 py-2 px-3 font-black text-slate-950 underline uppercase">
                              {selectedLetterForPrint.customNotes.replace(/.*Nama 3 Kata:\s*/i, "").split("\n")[0] || selectedLetterForPrint.pilgrim?.name}
                            </td>
                          </tr>
                        )}

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

                  {selectedLetterForPrint.customNotes && !selectedLetterForPrint.customNotes.startsWith("Permohonan penambahan nama") && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] leading-normal">
                      <strong>Keterangan Tambahan:</strong>
                      <p className="mt-0.5 text-slate-800">{selectedLetterForPrint.customNotes}</p>
                    </div>
                  )}

                  <p className="pt-1">
                    Demikian surat ini kami ajukan kepada Bapak/Ibu dengan harapan Bapak/Ibu berkenan membantu kelancaran proses tersebut. Atas bantuan, perhatian, dan kerjasama yang baik, kami ucapkan terima kasih.
                  </p>
                </div>

                {/* 6. SIGNATURE AREA (Clean without fake stamp) */}
                <div className="pt-8 flex flex-col items-start text-xs">
                  <p>Hormat Kami,</p>
                  <p className="font-bold text-slate-900">{travelSettings.companyName}</p>
                  <div className="my-3 h-14 w-40 flex items-center justify-center">
                    <span className="font-serif italic text-blue-900 font-bold text-base rotate-[-3deg]">
                      {selectedLetterForPrint.generatedBy || travelSettings.directorName}
                    </span>
                  </div>
                  <p className="font-bold text-slate-950 underline text-xs">
                    {selectedLetterForPrint.generatedBy || travelSettings.directorName}
                  </p>
                  <p className="text-[11px] text-slate-700">{travelSettings.directorTitle || "Direktur Utama"}</p>
                </div>
              </div>

              {/* 7. GEOMETRIC FOOTER DIVIDER (Matching Exact PPIU Reference) */}
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
                      📞 {travelSettings.phone || "0811-9876-5432"}
                    </span>
                    <span className="flex items-center gap-1">
                      ✉️ {travelSettings.email || "barokahsulthanharamain@gmail.com"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ATTACHMENT PAGES (LAMPIRAN DOKUMEN LEGALITAS RESMI PPIU) */}
            {includeLegalAttachments && (
              <div className="space-y-6">
                {/* PAGE 2: SK KEMENKUMHAM RI */}
                <div className="print:page-break border border-slate-300 p-6 sm:p-8 rounded-2xl bg-white shadow-sm flex flex-col justify-between print:border-none print:shadow-none print:p-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-slate-800">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                        LAMPIRAN I: SALINAN KEPUTUSAN MENTERI HUKUM REPUBLIK INDONESIA
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        HALAMAN 2 DARI 4
                      </span>
                    </div>
                    <div className="p-1 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center">
                      <img
                        src="/legal-docs/legalitas-kemenkumham.png"
                        alt="SK Kemenkumham Pengesahan PT Barokah Sulthan Haramain"
                        className="w-full max-h-[1050px] object-contain mx-auto"
                      />
                    </div>
                  </div>
                </div>

                {/* PAGE 3: NIB HALAMAN 1 */}
                <div className="print:page-break border border-slate-300 p-6 sm:p-8 rounded-2xl bg-white shadow-sm flex flex-col justify-between print:border-none print:shadow-none print:p-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-slate-800">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                        LAMPIRAN II: NOMOR INDUK BERUSAHA (NIB) 1504260072814 - PEMERINTAH RI
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        HALAMAN 3 DARI 4
                      </span>
                    </div>
                    <div className="p-1 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center">
                      <img
                        src="/legal-docs/legalitas-nib-1.png"
                        alt="NIB PT Barokah Sulthan Haramain"
                        className="w-full max-h-[1050px] object-contain mx-auto"
                      />
                    </div>
                  </div>
                </div>

                {/* PAGE 4: LAMPIRAN NIB KBLI 79122 (UMROH & HAJI KHUSUS) */}
                <div className="print:page-break border border-slate-300 p-6 sm:p-8 rounded-2xl bg-white shadow-sm flex flex-col justify-between print:border-none print:shadow-none print:p-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-slate-800">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                        LAMPIRAN III: LAMPIRAN NIB KBLI 79122 (BIRO PERJALANAN IBADAH UMROH & HAJI KHUSUS)
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        HALAMAN 4 DARI 4
                      </span>
                    </div>
                    <div className="p-1 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center">
                      <img
                        src="/legal-docs/legalitas-nib-2.png"
                        alt="Lampiran NIB KBLI 79122 PPIU"
                        className="w-full max-h-[1050px] object-contain mx-auto"
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
