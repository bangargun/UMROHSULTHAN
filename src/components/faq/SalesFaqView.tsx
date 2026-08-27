"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  HelpCircle,
  ShieldAlert,
  Target,
  MessageSquare,
  Copy,
  CheckCircle2,
  Search,
  Plus,
  Edit,
  Trash2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  Share2,
  FileText,
  X,
  PhoneCall,
  Check,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

interface FaqItem {
  id: string;
  category: string;
  title: string;
  question: string;
  answer: string;
  waScript: string | null;
  tags: string | null;
  isMandatory: boolean;
  orderIndex: number;
}

export default function SalesFaqView() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);

  const [formData, setFormData] = useState({
    category: "CLOSING_OBJECTION",
    title: "",
    question: "",
    answer: "",
    waScript: "",
    tags: "",
    isMandatory: true,
  });

  const loadFaqs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/faqs");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setFaqs(data);
          if (data.length > 0 && !expandedFaqId) {
            setExpandedFaqId(data[0].id);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  const handleCopyScript = (id: string, scriptText: string) => {
    navigator.clipboard.writeText(scriptText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleOpenWhatsAppDirect = (scriptText: string) => {
    const encoded = encodeURIComponent(scriptText);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const handleSaveAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({
          category: "CLOSING_OBJECTION",
          title: "",
          question: "",
          answer: "",
          waScript: "",
          tags: "",
          isMandatory: true,
        });
        alert("Panduan FAQ & Script baru berhasil ditambahkan!");
        loadFaqs();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menambah FAQ");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditFaq = (item: FaqItem) => {
    setEditingFaq(item);
    setFormData({
      category: item.category,
      title: item.title,
      question: item.question,
      answer: item.answer,
      waScript: item.waScript || "",
      tags: item.tags || "",
      isMandatory: item.isMandatory,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/faqs/${editingFaq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        setEditingFaq(null);
        alert("Panduan FAQ berhasil diperbarui!");
        loadFaqs();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal memperbarui FAQ");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFaq = async (id: string, title: string) => {
    if (!confirm(`Hapus panduan / FAQ "${title}"?`)) return;
    try {
      const res = await fetch(`/api/faqs/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadFaqs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter FAQs
  const filteredFaqs = faqs.filter((faq) => {
    const matchCategory = selectedCategory === "ALL" || faq.category === selectedCategory;
    const matchSearch =
      faq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (faq.tags && faq.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (faq.waScript && faq.waScript.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "CLOSING_OBJECTION":
        return { label: "🎯 Closing & Objection", bg: "bg-emerald-50 text-emerald-800 border-emerald-200" };
      case "COMPLAINT_HANDLING":
        return { label: "🛡️ SOP Komplain & Recovery", bg: "bg-rose-50 text-rose-800 border-rose-200" };
      case "SYARAT_VISA":
        return { label: "🛂 Syarat Paspor & Visa", bg: "bg-blue-50 text-blue-800 border-blue-200" };
      case "FASILITAS_HOTEL":
        return { label: "🏨 Fasilitas, Hotel & Tiket", bg: "bg-purple-50 text-purple-800 border-purple-200" };
      case "REFUND_KEUANGAN":
        return { label: "💳 Pembayaran, DP & Refund", bg: "bg-amber-50 text-amber-800 border-amber-200" };
      case "FAQ_UMUM":
        return { label: "💡 Tips Ibadah & FAQ Umum", bg: "bg-slate-100 text-slate-800 border-slate-200" };
      default:
        return { label: cat, bg: "bg-slate-100 text-slate-800 border-slate-200" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl shadow-md no-print">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Playbook Penjualan & Customer Care Resmi PPIU</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            Panduan Mandatory FAQ, Sales Closing & Complaint Handling
          </h2>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl">
            Panduan resmi standar operasional bagi seluruh admin marketing & customer service. Lengkap dengan skrip chat WhatsApp 1-klik salin untuk mengatasi keraguan calon jamaah dan penanganan komplain darurat.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all shadow-xs"
          >
            <FileText className="w-4 h-4" /> Cetak Buku Panduan
          </button>
          <button
            onClick={() => {
              setFormData({
                category: "CLOSING_OBJECTION",
                title: "",
                question: "",
                answer: "",
                waScript: "",
                tags: "",
                isMandatory: true,
              });
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> + Tambah Panduan / Skrip
          </button>
        </div>
      </div>

      {/* KPI Highlight Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 no-print">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Topik Playbook</span>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{faqs.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Panduan siap pakai</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Skrip Sales Closing</span>
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">
            {faqs.filter((f) => f.category === "CLOSING_OBJECTION").length}
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Objection handling jurus closing</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-700">
            <span>SOP Penanganan Komplain</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">
            {faqs.filter((f) => f.category === "COMPLAINT_HANDLING").length}
          </p>
          <p className="text-[11px] text-rose-600 mt-0.5">Solusi darurat & recovery service</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-700">
            <span>Regulasi Syarat & Visa</span>
            <HelpCircle className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">
            {faqs.filter((f) => f.category === "SYARAT_VISA").length}
          </p>
          <p className="text-[11px] text-blue-600 mt-0.5">Ketentuan Imigrasi & MoFA Saudi</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 no-print">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pertanyaan, kendala, kata kunci keberatan (misal: mahal, tunda, paspor, koper)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Menampilkan <strong>{filteredFaqs.length}</strong> panduan materi
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
          {[
            { id: "ALL", label: "🌟 Semua Panduan" },
            { id: "CLOSING_OBJECTION", label: "🎯 Closing & Objection Handling" },
            { id: "COMPLAINT_HANDLING", label: "🛡️ SOP Komplain & Emergency" },
            { id: "SYARAT_VISA", label: "🛂 Syarat Paspor, Visa & Mahram" },
            { id: "FASILITAS_HOTEL", label: "🏨 Fasilitas, Hotel & Pesawat" },
            { id: "REFUND_KEUANGAN", label: "💳 Pembayaran, DP & Refund" },
            { id: "FAQ_UMUM", label: "💡 Tips Ibadah & FAQ Umum" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ & Playbook List Items */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Tidak ada materi panduan yang cocok</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Coba gunakan kata kunci pencarian lain atau klik tombol "+ Tambah Panduan / Skrip" untuk membuat panduan baru.
            </p>
          </div>
        ) : (
          filteredFaqs.map((faq, index) => {
            const isExpanded = expandedFaqId === faq.id;
            const badge = getCategoryBadge(faq.category);
            const isClosing = faq.category === "CLOSING_OBJECTION";
            const isComplaint = faq.category === "COMPLAINT_HANDLING";

            return (
              <div
                key={faq.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                  isExpanded ? "border-emerald-500/80 ring-2 ring-emerald-500/10" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Collapsible Header */}
                <div
                  onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                  className="p-4 md:p-5 flex items-start justify-between gap-4 cursor-pointer select-none bg-white hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                        isClosing
                          ? "bg-emerald-100 text-emerald-800"
                          : isComplaint
                          ? "bg-rose-100 text-rose-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        {faq.isMandatory && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                            Mandatory SOP
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm md:text-base font-bold text-slate-900 pt-0.5">{faq.title}</h3>
                      <p className="text-xs text-slate-500 italic flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        "{faq.question}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50/40 space-y-5">
                    {/* Section 1: Internal Knowledge / SOP Explanation */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        <span>Penjelasan Teknis & Edukasi untuk Admin Sales:</span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line pl-6">
                        {faq.answer}
                      </p>
                    </div>

                    {/* Section 2: Ready-to-Copy WhatsApp Script */}
                    {faq.waScript && (
                      <div className="bg-emerald-50/80 border border-emerald-300/80 rounded-2xl p-4 md:p-5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200/60">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                              WA
                            </span>
                            <span className="text-xs font-bold text-emerald-950">
                              Skrip Chat WhatsApp (Siap Kirim ke Konsumen)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyScript(faq.id, faq.waScript || "")}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs ${
                                copiedId === faq.id
                                  ? "bg-slate-900 text-white"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
                              }`}
                            >
                              {copiedId === faq.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                                  <span>Tersalin ke Clipboard!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Salin Skrip WhatsApp</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleOpenWhatsAppDirect(faq.waScript || "")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300 transition-all shadow-xs"
                              title="Buka WhatsApp Web"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Buka WA</span>
                            </button>
                          </div>
                        </div>

                        {/* WhatsApp text box */}
                        <div className="bg-white rounded-xl p-3.5 border border-emerald-200 text-xs font-sans text-slate-800 leading-relaxed whitespace-pre-wrap shadow-inner">
                          {faq.waScript}
                        </div>

                        <p className="text-[10px] text-emerald-800 font-medium italic">
                          💡 Tips: Ganti placeholder seperti <code>[NAMA_JAMAAH]</code>, <code>[TGL_BERANGKAT]</code> dengan data riil prospek sebelum mengirim.
                        </p>
                      </div>
                    )}

                    {/* Tags and Admin Management */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        {faq.tags ? (
                          faq.tags.split(",").map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                            >
                              #{tag.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400">Tanpa tag</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 no-print">
                        <button
                          onClick={() => handleOpenEditFaq(faq)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit Materi
                        </button>
                        <button
                          onClick={() => handleDeleteFaq(faq.id, faq.title)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL TAMBAH FAQ BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Tambah Panduan FAQ & Skrip Penjualan Baru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddFaq} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Kategori Panduan *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-800"
                  >
                    <option value="CLOSING_OBJECTION">🎯 Closing & Objection Handling</option>
                    <option value="COMPLAINT_HANDLING">🛡️ SOP Komplain & Recovery</option>
                    <option value="SYARAT_VISA">🛂 Syarat Paspor & Visa</option>
                    <option value="FASILITAS_HOTEL">🏨 Fasilitas, Hotel & Maskapai</option>
                    <option value="REFUND_KEUANGAN">💳 Pembayaran, DP & Refund</option>
                    <option value="FAQ_UMUM">💡 Tips Ibadah & FAQ Umum</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Status Panduan</label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isMandatoryAdd"
                      checked={formData.isMandatory}
                      onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <label htmlFor="isMandatoryAdd" className="text-xs font-semibold text-slate-700">
                      Wajib / Mandatory SOP
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Judul Topik / Kasus *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Objection: Harga Paket Terlalu Mahal Dibanding Travel Lain"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Pertanyaan / Kalimat Keberatan Konsumen *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kenapa harganya lebih mahal ya? Travel sebelah ada yang 22 jutaan."
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 italic text-slate-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Penjelasan Teknis & Edukasi untuk Admin *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Penjelasan poin-poin penting yang harus dipahami admin..."
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-emerald-800 flex items-center justify-between">
                  <span>Template Skrip WhatsApp (Siap Copy-Paste):</span>
                  <span className="text-[10px] text-slate-400 font-normal">Gunakan *bold*, emoji, dan [NAMA_JAMAAH]</span>
                </label>
                <textarea
                  rows={6}
                  placeholder="Assalamu'alaikum Warahmatullahi Wabarakatuh Bapak/Ibu [NAMA_JAMAAH]..."
                  value={formData.waScript}
                  onChange={(e) => setFormData({ ...formData, waScript: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-emerald-300 bg-emerald-50/40 p-2.5 font-sans"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Kata Kunci / Tag Pencarian (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  placeholder="e.g. harga mahal, bintang 5, komplain, diskon"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
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
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs"
                >
                  {loading ? "Menyimpan..." : "Simpan Panduan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT FAQ */}
      {isEditModalOpen && editingFaq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-600" />
                Edit Panduan FAQ & Skrip Penjualan
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditFaq} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Kategori Panduan *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-800"
                  >
                    <option value="CLOSING_OBJECTION">🎯 Closing & Objection Handling</option>
                    <option value="COMPLAINT_HANDLING">🛡️ SOP Komplain & Recovery</option>
                    <option value="SYARAT_VISA">🛂 Syarat Paspor & Visa</option>
                    <option value="FASILITAS_HOTEL">🏨 Fasilitas, Hotel & Maskapai</option>
                    <option value="REFUND_KEUANGAN">💳 Pembayaran, DP & Refund</option>
                    <option value="FAQ_UMUM">💡 Tips Ibadah & FAQ Umum</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Status Panduan</label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isMandatoryEdit"
                      checked={formData.isMandatory}
                      onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <label htmlFor="isMandatoryEdit" className="text-xs font-semibold text-slate-700">
                      Wajib / Mandatory SOP
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Judul Topik / Kasus *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Pertanyaan / Kalimat Keberatan Konsumen *</label>
                <input
                  type="text"
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 italic text-slate-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Penjelasan Teknis & Edukasi untuk Admin *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-emerald-800 flex items-center justify-between">
                  <span>Template Skrip WhatsApp (Siap Copy-Paste):</span>
                  <span className="text-[10px] text-slate-400 font-normal">Gunakan *bold*, emoji, dan [NAMA_JAMAAH]</span>
                </label>
                <textarea
                  rows={6}
                  value={formData.waScript}
                  onChange={(e) => setFormData({ ...formData, waScript: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-emerald-300 bg-emerald-50/40 p-2.5 font-sans"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Kata Kunci / Tag Pencarian (Pisahkan dengan koma)</label>
                <input
                  type="text"
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
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 shadow-xs"
                >
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
