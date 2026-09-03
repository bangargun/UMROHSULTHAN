"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Sparkles,
  Plus,
  Search,
  Filter,
  Printer,
  Copy,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building,
  ShieldCheck,
  Award,
  Users,
  Heart,
  CreditCard,
  Phone,
  Plane,
  RotateCcw,
  Download,
  X,
  Eye,
  Check,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SopDocument {
  id: string;
  code: string;
  category: string;
  title: string;
  purpose: string | null;
  scope: string | null;
  responsibleRole: string | null;
  version: string;
  effectiveDate: string | null;
  contentMarkdown: string;
  tags: string | null;
  isMandatory: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { id: "ALL", label: "Semua Dokumen", icon: Layers, count: 0 },
  { id: "OPERASIONAL_UMROH", label: "SOP Operasional Umroh", icon: Plane, count: 0 },
  { id: "LEGALITAS_PERUSAHAAN", label: "Peraturan & Visi Misi", icon: Building, count: 0 },
  { id: "MITIGASI_DARURAT", label: "Mitigasi & Darurat", icon: AlertCircle, count: 0 },
  { id: "KEUANGAN_REFUND", label: "Keuangan & Refund", icon: CreditCard, count: 0 },
  { id: "SDM_KODE_ETIK", label: "Kode Etik & SDM", icon: Users, count: 0 },
];

export default function SopManagementView() {
  const [documents, setDocuments] = useState<SopDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<SopDocument | null>(null);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // Form State for Add/Edit
  const [formData, setFormData] = useState({
    id: "",
    code: "",
    category: "OPERASIONAL_UMROH",
    title: "",
    purpose: "",
    scope: "",
    responsibleRole: "Admin Operasional",
    version: "1.0",
    effectiveDate: new Date().toISOString().split("T")[0],
    contentMarkdown: "",
    tags: "",
    isMandatory: true,
  });

  // Travel Settings for Official Header
  const [travelSettings, setTravelSettings] = useState<any>({
    companyName: "PT BAROKAH SULTHAN HARAMAIN",
    licenseNumber: "SK Kemenkumham RI No. AHU-0007388.AH.01.01.TAHUN 2026",
    kemenhanLicense: "NIB: 1504260072814 • KBLI 79122",
    phone: "0821-6733-9464",
    email: "barokahsulthanharamain@gmail.com",
    address: "Jl. Syekh Beringin Griya Palm Asri Tebing Tinggi, Sumut",
    directorName: "H. Argun Barokah, S.Kom., M.M.",
    directorTitle: "Direktur Utama",
  });

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sop");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
        if (data.length > 0 && !selectedDoc) {
          setSelectedDoc(data[0]);
        } else if (selectedDoc) {
          const fresh = data.find((d: SopDocument) => d.id === selectedDoc.id);
          if (fresh) setSelectedDoc(fresh);
        }
      }
    } catch (e) {
      console.error("Failed to fetch SOPs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.companyName) setTravelSettings(data);
      })
      .catch((e) => console.error(e));
  }, []);

  // Filter Documents
  const filteredDocs = documents.filter((doc) => {
    const matchCat = selectedCategory === "ALL" || doc.category === selectedCategory;
    const matchSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.tags && doc.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.responsibleRole && doc.responsibleRole.toLowerCase().includes(searchTerm.toLowerCase())) ||
      doc.contentMarkdown.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  // Calculate Category Counts
  const getCategoryCount = (catId: string) => {
    if (catId === "ALL") return documents.length;
    return documents.filter((d) => d.category === catId).length;
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData({
      id: "",
      code: "",
      category: selectedCategory === "ALL" ? "OPERASIONAL_UMROH" : selectedCategory,
      title: "",
      purpose: "",
      scope: "",
      responsibleRole: "Admin Operasional",
      version: "1.0",
      effectiveDate: new Date().toISOString().split("T")[0],
      contentMarkdown: `### 1. TUJUAN & RUANG LINGKUP\n- **Tujuan:** ...\n- **Ruang Lingkup:** ...\n\n---\n\n### 2. PIHAK YANG BERTANGGUNG JAWAB\n- ...\n\n---\n\n### 3. TAHAPAN & PROSEDUR PELAKSANAAN\n1. **Tahap 1:** ...\n2. **Tahap 2:** ...\n\n---\n\n### 4. DOKUMEN & FORMULIR TERKAIT\n- ...`,
      tags: "sop, umroh, operasional",
      isMandatory: true,
    });
    setIsEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (doc: SopDocument) => {
    setFormData({
      id: doc.id,
      code: doc.code,
      category: doc.category,
      title: doc.title,
      purpose: doc.purpose || "",
      scope: doc.scope || "",
      responsibleRole: doc.responsibleRole || "Admin Operasional",
      version: doc.version,
      effectiveDate: doc.effectiveDate ? doc.effectiveDate.split("T")[0] : new Date().toISOString().split("T")[0],
      contentMarkdown: doc.contentMarkdown,
      tags: doc.tags || "",
      isMandatory: doc.isMandatory,
    });
    setIsEditModalOpen(true);
  };

  // Save SOP (Create or Update)
  const handleSaveSop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        // Update
        const res = await fetch(`/api/sop/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const updated = await res.json();
          setIsEditModalOpen(false);
          fetchDocuments();
          setSelectedDoc(updated);
        } else {
          alert("Gagal memperbarui dokumen SOP");
        }
      } else {
        // Create
        const res = await fetch("/api/sop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const created = await res.json();
          setIsEditModalOpen(false);
          fetchDocuments();
          setSelectedDoc(created);
        } else {
          alert("Gagal membuat dokumen SOP baru");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem saat menyimpan SOP");
    }
  };

  // Delete SOP
  const handleDeleteSop = async (id: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus dokumen "${title}"?`)) return;
    try {
      const res = await fetch(`/api/sop/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDocuments();
        if (selectedDoc?.id === id) {
          setSelectedDoc(null);
        }
      } else {
        alert("Gagal menghapus dokumen SOP");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // AI Generator: Sync Official PPIU Catalog
  const handleGenerateOfficialCatalog = async () => {
    if (
      !confirm(
        "Apakah Anda ingin men-generate & mensinkronisasi seluruh Katalog Standar SOP Resmi PPIU (Operasional Umroh, Peraturan Perusahaan, Visi Misi, Mitigasi Darurat, dan Tata Kelola)?"
      )
    )
      return;

    setAiGenerating(true);
    try {
      const res = await fetch("/api/sop/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generateAllOfficialCatalog: true }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Katalog Standar SOP PPIU Berhasil Disinkronisasi!");
        fetchDocuments();
      } else {
        alert(data.error || "Gagal men-generate katalog SOP");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat memanggil engine AI");
    } finally {
      setAiGenerating(false);
    }
  };

  // AI Generator: Custom Prompt
  const handleGenerateCustomPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setAiGenerating(true);
    try {
      const res = await fetch("/api/sop/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customPrompt: aiPrompt }),
      });
      const data = await res.json();
      if (res.ok && data.document) {
        setIsAiModalOpen(false);
        setAiPrompt("");
        fetchDocuments();
        setSelectedDoc(data.document);
        alert("SOP Kustom Cerdas berhasil digenerate oleh AI!");
      } else {
        alert(data.error || "Gagal men-generate SOP kustom");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat memanggil AI");
    } finally {
      setAiGenerating(false);
    }
  };

  // Copy Text
  const handleCopyText = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Print Document
  const handlePrint = () => {
    window.print();
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "OPERASIONAL_UMROH":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Operasional Umroh</span>;
      case "LEGALITAS_PERUSAHAAN":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Peraturan & Visi Misi</span>;
      case "MITIGASI_DARURAT":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Mitigasi & Darurat</span>;
      case "KEUANGAN_REFUND":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">Keuangan & Refund</span>;
      case "SDM_KODE_ETIK":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Kode Etik & SDM</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">Umum</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Standar Operasional Prosedur (SOP) & Tata Kelola PPIU
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Kompilasi Dokumen Mutu ISO, Alur Layanan Ibadah Umroh, Peraturan Perusahaan & Mitigasi Risiko
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleGenerateOfficialCatalog}
            disabled={aiGenerating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
            title="Generate & Update Seluruh Katalog Resmi Baku PPIU Kemenag"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            {aiGenerating ? "Memproses AI..." : "Sync Katalog SOP Baku PPIU"}
          </button>

          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            Buat SOP via AI
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            + Tambah Dokumen Manual
          </button>
        </div>
      </div>

      {/* Category Tabs & Quick Stats Bar */}
      <div className="flex flex-wrap items-center gap-2 pb-1 overflow-x-auto no-print">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          const count = getCategoryCount(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of SOPs (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-3 no-print">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari SOP, kode, nomor, atau kata kunci..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* SOP List Cards */}
          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Memuat Dokumen SOP...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-700">Belum ada dokumen SOP</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Klik tombol <b>Sync Katalog SOP Baku PPIU</b> di atas untuk meng-generate seluruh katalog standar Kemenag RI.
                  </p>
                </div>
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left space-y-2 ${
                      isSelected
                        ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-900 text-white">
                        {doc.code}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">v{doc.version}</span>
                    </div>

                    <h4
                      className={`text-xs font-bold line-clamp-2 leading-relaxed ${
                        isSelected ? "text-emerald-950" : "text-slate-900"
                      }`}
                    >
                      {doc.title}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="truncate max-w-[140px]">PJ: {doc.responsibleRole || "Semua Divisi"}</span>
                      {doc.isMandatory && (
                        <span className="flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Wajib Kemenag
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Document Reader & Print Preview (8 cols on lg) */}
        <div className="lg:col-span-8">
          {selectedDoc ? (
            <div className="space-y-4">
              {/* Document Header & Action Bar */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 no-print">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                      {selectedDoc.code}
                    </span>
                    {getCategoryBadge(selectedDoc.category)}
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-600">
                      Versi {selectedDoc.version}
                    </span>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyText(selectedDoc.contentMarkdown)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all"
                      title="Salin Isi Dokumen"
                    >
                      {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copySuccess ? "Tersalin!" : "Salin"}</span>
                    </button>

                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-xs"
                      title="Cetak Berkop & Lembar Pengesahan"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cetak / PDF</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(selectedDoc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition-all shadow-xs"
                      title="Edit Isi SOP"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit SOP</span>
                    </button>

                    <button
                      onClick={() => handleDeleteSop(selectedDoc.id, selectedDoc.title)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all"
                      title="Hapus SOP"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title & Metadata Details */}
                <div className="space-y-3">
                  <h2 className="text-lg font-black text-slate-900 leading-snug">
                    {selectedDoc.title}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Penanggung Jawab:</span>
                      <span className="font-bold text-slate-800">{selectedDoc.responsibleRole || "Semua Divisi"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Tanggal Efektif:</span>
                      <span className="font-bold text-slate-800">
                        {selectedDoc.effectiveDate ? formatDate(selectedDoc.effectiveDate) : "Berlaku Tetap"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Status Regulasi:</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Standar Mutu PPIU
                      </span>
                    </div>
                  </div>

                  {selectedDoc.purpose && (
                    <div className="text-xs text-slate-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                      <span className="font-bold text-emerald-900">Tujuan Dokumen: </span>
                      {selectedDoc.purpose}
                    </div>
                  )}
                </div>
              </div>

              {/* DOCUMENT CONTENT / PRINTABLE PAPER SHEET */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
                {/* Official Letterhead (Print Only or Visible Header) */}
                <div className="border-b-2 border-slate-900 pb-4 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-xl tracking-tighter">
                        SH
                      </div>
                      <div>
                        <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">
                          {travelSettings.companyName}
                        </h3>
                        <p className="text-[11px] font-bold text-emerald-700">
                          {travelSettings.licenseNumber}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {travelSettings.kemenhanLicense} • Telp: {travelSettings.phone}
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[10px] text-slate-500 hidden sm:block">
                      <div className="font-bold text-slate-900">DOKUMEN MUTU PPIU</div>
                      <div>No: {selectedDoc.code}</div>
                      <div>Rev: {selectedDoc.version}</div>
                    </div>
                  </div>
                </div>

                {/* ISO Meta Table */}
                <div className="border border-slate-300 rounded-xl overflow-hidden text-[11px] grid grid-cols-2 sm:grid-cols-4 bg-slate-50">
                  <div className="p-2.5 border-b sm:border-b-0 border-r border-slate-200">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Kode Dokumen</span>
                    <span className="font-mono font-bold text-slate-900">{selectedDoc.code}</span>
                  </div>
                  <div className="p-2.5 border-b sm:border-b-0 sm:border-r border-slate-200">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Klasifikasi</span>
                    <span className="font-bold text-slate-900">{selectedDoc.category.replace(/_/g, " ")}</span>
                  </div>
                  <div className="p-2.5 border-r border-slate-200">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Tgl Berlaku</span>
                    <span className="font-bold text-slate-900">
                      {selectedDoc.effectiveDate ? formatDate(selectedDoc.effectiveDate) : "-"}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Penanggung Jawab</span>
                    <span className="font-bold text-slate-900 truncate block">{selectedDoc.responsibleRole}</span>
                  </div>
                </div>

                {/* Document Main Markdown Body */}
                <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-4">
                  <h1 className="text-base sm:text-lg font-black text-slate-900 pb-2 border-b border-slate-200 uppercase tracking-tight">
                    {selectedDoc.title}
                  </h1>

                  <div className="whitespace-pre-wrap font-sans text-slate-800 space-y-3 leading-relaxed">
                    {selectedDoc.contentMarkdown.split("\n\n").map((paragraph, pIdx) => {
                      if (paragraph.startsWith("### ")) {
                        return (
                          <h3 key={pIdx} className="text-sm font-black text-slate-900 mt-4 mb-2 uppercase tracking-wide flex items-center gap-2">
                            <span className="w-1.5 h-3.5 bg-emerald-600 rounded-xs inline-block" />
                            {paragraph.replace("### ", "")}
                          </h3>
                        );
                      }
                      if (paragraph.startsWith("#### ")) {
                        return (
                          <h4 key={pIdx} className="text-xs font-bold text-slate-900 mt-3 mb-1">
                            {paragraph.replace("#### ", "")}
                          </h4>
                        );
                      }
                      if (paragraph.startsWith("---")) {
                        return <hr key={pIdx} className="my-3 border-slate-200" />;
                      }
                      return (
                        <p key={pIdx} className="text-xs text-slate-700 leading-relaxed">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                </div>

                {/* Lembar Pengesahan Resmi (ISO Signature Box) */}
                <div className="pt-8 border-t border-slate-300 mt-8 grid grid-cols-3 gap-4 text-center text-xs">
                  <div className="space-y-12">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Dipersiapkan Oleh:</span>
                    <div>
                      <p className="font-bold text-slate-900 underline">{selectedDoc.responsibleRole || "Staf Operasional"}</p>
                      <p className="text-[10px] text-slate-500">Penanggung Jawab Teknis</p>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Diperiksa Oleh:</span>
                    <div>
                      <p className="font-bold text-slate-900 underline">Kepala Divisi Kepatuhan</p>
                      <p className="text-[10px] text-slate-500">Tim Mutu & Akreditasi</p>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Disahkan Oleh:</span>
                    <div>
                      <p className="font-bold text-slate-900 underline">{travelSettings.directorName}</p>
                      <p className="text-[10px] text-slate-500">{travelSettings.directorTitle}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Pilih salah satu dokumen SOP dari daftar di sebelah kiri</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD / EDIT SOP FORM */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                {formData.id ? "Edit Dokumen SOP / Tata Kelola" : "Tambah Dokumen SOP Baru"}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSop} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Kode Dokumen</label>
                  <input
                    type="text"
                    placeholder="e.g. SOP-OPS-001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Kategori Dokumen *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold"
                  >
                    <option value="OPERASIONAL_UMROH">SOP Operasional Umroh</option>
                    <option value="LEGALITAS_PERUSAHAAN">Peraturan Perusahaan & Visi Misi</option>
                    <option value="MITIGASI_DARURAT">Mitigasi Risiko & Darurat</option>
                    <option value="KEUANGAN_REFUND">Keuangan, Tagihan & Refund</option>
                    <option value="SDM_KODE_ETIK">Kode Etik TL, Muthawwif & SDM</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Versi Revisi</label>
                  <input
                    type="text"
                    placeholder="e.g. 1.0"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Judul Dokumen / SOP *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SOP Penanganan Jamaah Sakit di Makkah & Rawat Inap RS Saudi"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Penanggung Jawab (Role / Divisi) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tour Leader, Muthawwif, Admin Operasional"
                    value={formData.responsibleRole}
                    onChange={(e) => setFormData({ ...formData, responsibleRole: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Tanggal Efektif</label>
                  <input
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Tujuan Dokumen</label>
                <input
                  type="text"
                  placeholder="e.g. Menjamin penanganan medis cepat dan klaim asuransi visa tanpa kendala."
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Isi Prosedur & Ketentuan Lengkap (Markdown / Bab / Pasal) *</label>
                <textarea
                  rows={10}
                  required
                  placeholder="Ketik isi SOP, langkah alur prosedur, pasal peraturan perusahaan..."
                  value={formData.contentMarkdown}
                  onChange={(e) => setFormData({ ...formData, contentMarkdown: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-mono text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Tags Pencarian (pisahkan dengan koma)</label>
                <input
                  type="text"
                  placeholder="e.g. paspor, mofa, siskopatuh, hotel, komplain"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs"
                >
                  Simpan Dokumen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AI CUSTOM SOP GENERATOR */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Custom SOP Generator
              </h3>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateCustomPrompt} className="space-y-3.5 text-xs">
              <p className="text-slate-600">
                Ketikkan topik atau instruksi SOP/Peraturan yang ingin Anda buat. AI akan otomatis meracik struktur SOP ISO baku berstandar PPIU Kementerian Agama.
              </p>

              <div>
                <label className="font-bold text-slate-700">Topik / Permintaan SOP *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Contoh: Buat SOP Penanganan Jamaah Disabilitas / Pengguna Kursi Roda saat Tawaf dan Sa'i di Masjidil Haram..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-[11px] text-purple-900 space-y-1">
                <p className="font-bold">✨ Contoh prompt cepat yang bisa Anda coba:</p>
                <ul className="list-disc list-inside space-y-0.5 text-purple-800">
                  <li>"SOP Penanganan Bagasi Tertukar atau Rusak oleh Maskapai"</li>
                  <li>"Peraturan Perusahaan Tentang Skema Bonus dan Komisi Agen Cabang"</li>
                  <li>"SOP Bimbingan Ibadah Bagi Jamaah Uzur dan Risti"</li>
                </ul>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={aiGenerating || !aiPrompt.trim()}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {aiGenerating ? "Meracik SOP..." : "Generate SOP via AI"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
