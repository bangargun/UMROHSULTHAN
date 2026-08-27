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
  Zap,
  Wand2,
  Send,
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

  // AI Generator Modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiActiveSubTab, setAiActiveSubTab] = useState<"STANDARD" | "CUSTOM">("STANDARD");

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

  // Generate All Standard Mandatory Catalog via AI Engine
  const handleGenerateAllMandatory = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch("/api/faqs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generateAllMandatory: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsAiModalOpen(false);
        alert(data.message || "Materi Mandatory Standar PPIU berhasil dibuat!");
        loadFaqs();
      } else {
        alert(data.error || "Gagal men-generate materi AI.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Generate Custom Prompt via AI Engine
  const handleGenerateCustomPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiCustomPrompt.trim()) return;
    setIsGeneratingAi(true);
    try {
      const res = await fetch("/api/faqs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customPrompt: aiCustomPrompt }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsAiModalOpen(false);
        setAiCustomPrompt("");
        alert("Materi playbook dan skrip AI baru berhasil dibuat dan disimpan!");
        loadFaqs();
      } else {
        alert(data.error || "Gagal men-generate skrip AI.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAi(false);
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

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          {/* AI Generator Trigger */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md transition-all animate-pulse"
          >
            <Sparkles className="w-4 h-4 text-slate-950" /> ✨ AI Generator Playbook
          </button>

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
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 no-print shadow-xs">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari pertanyaan, kendala, kata kunci keberatan (misal: mahal, paspor, koper, refund, wanita)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
            />
          </div>

          <div className="text-xs text-slate-500 font-semibold self-end md:self-center shrink-0">
            Menampilkan <span className="font-bold text-slate-900">{filteredFaqs.length}</span> panduan materi
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { id: "ALL", label: "✨ Semua Panduan" },
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
          <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-5 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Belum Ada Materi Playbook di Sistem</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                Gunakan fitur AI Generator untuk langsung membuat seluruh katalog skrip sales closing, SOP komplain, dan ketentuan resmi berstandar PPIU Kemenag RI dalam 1 klik.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleGenerateAllMandatory}
                disabled={isGeneratingAi}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs shadow-lg transition-all"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                {isGeneratingAi ? "Membuat Materi AI..." : "⚡ Generate 8 Materi Mandatory Standar PPIU (1-Klik)"}
              </button>

              <button
                onClick={() => {
                  setAiActiveSubTab("CUSTOM");
                  setIsAiModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all"
              >
                <Wand2 className="w-4 h-4 text-emerald-600" />
                Tulis Prompt AI Kustom
              </button>
            </div>
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

                    {/* Section 2: Copyable WhatsApp Chat Script */}
                    {faq.waScript && (
                      <div className="bg-emerald-950 rounded-2xl p-4 md:p-5 text-white space-y-3 shadow-sm border border-emerald-900">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs">
                              WA
                            </span>
                            <span className="text-xs font-bold text-emerald-200">
                              Skrip Chat WhatsApp (Siap Kirim ke Konsumen)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyScript(faq.id, faq.waScript || "")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all"
                            >
                              {copiedId === faq.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-200" /> Tersalin!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" /> Salin Skrip
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleOpenWhatsAppDirect(faq.waScript || "")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 font-bold text-xs border border-white/15 transition-all"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Buka di WA
                            </button>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-emerald-900/60 border border-emerald-800/80 font-sans text-xs text-emerald-50 leading-relaxed whitespace-pre-wrap select-all">
                          {faq.waScript}
                        </div>

                        <p className="text-[10px] text-emerald-300/70 italic">
                          *Tips: Ganti variabel {"{NAMA}"} dengan nama panggilan calon jamaah sebelum menekan tombol kirim.
                        </p>
                      </div>
                    )}

                    {/* Section 3: Tags & Actions Bar */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        {faq.tags ? (
                          faq.tags.split(",").map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg bg-slate-200/70 text-slate-700 text-[10px] font-semibold"
                            >
                              #{t.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400">Umum</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditFaq(faq)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 font-bold text-xs"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFaq(faq.id, faq.title)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-bold text-xs"
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

      {/* MODAL: AI GENERATOR PLAYBOOK */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">AI Playbook & Script Generator</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Engine Kecerdasan Buatan Khusus Penjualan & Layanan Umroh PPIU
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SubTabs */}
            <div className="flex border-b border-slate-100 bg-slate-100/70 rounded-2xl p-1">
              <button
                type="button"
                onClick={() => setAiActiveSubTab("STANDARD")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  aiActiveSubTab === "STANDARD" ? "bg-white text-slate-950 shadow-xs" : "text-slate-600"
                }`}
              >
                ⚡ Standar Mandatory PPIU (1-Klik)
              </button>
              <button
                type="button"
                onClick={() => setAiActiveSubTab("CUSTOM")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  aiActiveSubTab === "CUSTOM" ? "bg-white text-slate-950 shadow-xs" : "text-slate-600"
                }`}
              >
                ✍️ Prompt AI Kustom
              </button>
            </div>

            {/* TAB 1: STANDARD CATALOG GENERATOR */}
            {aiActiveSubTab === "STANDARD" && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-2">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4" /> Paket Materi Standar PPIU Kemenag RI
                  </p>
                  <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                    Men-generate 8 materi utama: Objection Handling Harga, Legalitas Anti-Gagal Berangkat, Wanita Tanpa Mahram & Paspor 1 Kata, SOP Koper Tertinggal di Hotel, SOP Jamaah Sakit/Kursi Roda, Regulasi Vaksin & Paspor 8 Bulan, Penjelasan Kamar Quad/Double, dan Kebijakan Refund Resmi.
                  </p>
                </div>

                <button
                  onClick={handleGenerateAllMandatory}
                  disabled={isGeneratingAi}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  {isGeneratingAi ? "Sedang Men-generate..." : "Generate 8 Materi Standar Sekarang (1-Klik)"}
                </button>
              </div>
            )}

            {/* TAB 2: CUSTOM PROMPT STUDIO */}
            {aiActiveSubTab === "CUSTOM" && (
              <form onSubmit={handleGenerateCustomPrompt} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Situasi Keberatan Konsumen / Komplain yang Ingin Dibuatkan Skrip:
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Contoh: Jamaah ragu mendaftar karena jadwal keberangkatan masih 6 bulan lagi dan takut uangnya tidak aman..."
                    value={aiCustomPrompt}
                    onChange={(e) => setAiCustomPrompt(e.target.value)}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    AI akan otomatis merumuskan judul, SOP penjelasan teknis, dan skrip ramah WhatsApp.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isGeneratingAi}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isGeneratingAi ? "Sedang Memproses AI..." : "Generate Skrip AI"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD MANUAL FAQ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">+ Tambah Panduan & Skrip Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddFaq} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Panduan</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  <option value="CLOSING_OBJECTION">🎯 Closing & Objection Handling</option>
                  <option value="COMPLAINT_HANDLING">🛡️ SOP Komplain & Emergency</option>
                  <option value="SYARAT_VISA">🛂 Syarat Paspor, Visa & Mahram</option>
                  <option value="FASILITAS_HOTEL">🏨 Fasilitas, Hotel & Pesawat</option>
                  <option value="REFUND_KEUANGAN">💳 Pembayaran, DP & Refund</option>
                  <option value="FAQ_UMUM">💡 Tips Ibadah & FAQ Umum</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Ringkas</label>
                <input
                  type="text"
                  placeholder="Contoh: Objection: Biaya Paket Lebih Mahal"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pertanyaan / Keluhan Konsumen</label>
                <textarea
                  rows={2}
                  placeholder="Pertanyaan spesifik yang sering ditanyakan..."
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Penjelasan Teknis (Internal SOP)</label>
                <textarea
                  rows={3}
                  placeholder="Panduan bagi admin mengenai dasar regulasi / alasan teknis..."
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Skrip Chat WhatsApp Siap Salin</label>
                <textarea
                  rows={4}
                  placeholder="Assalamu'alaikum Bpk/Ibu {NAMA}..."
                  value={formData.waScript}
                  onChange={(e) => setFormData({ ...formData, waScript: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kata Kunci Tag (Pisahkan Koma)</label>
                <input
                  type="text"
                  placeholder="harga, mahal, promo, paspor"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  Simpan Panduan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT FAQ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Edit Panduan FAQ & Skrip</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditFaq} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Panduan</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  <option value="CLOSING_OBJECTION">🎯 Closing & Objection Handling</option>
                  <option value="COMPLAINT_HANDLING">🛡️ SOP Komplain & Emergency</option>
                  <option value="SYARAT_VISA">🛂 Syarat Paspor, Visa & Mahram</option>
                  <option value="FASILITAS_HOTEL">🏨 Fasilitas, Hotel & Pesawat</option>
                  <option value="REFUND_KEUANGAN">💳 Pembayaran, DP & Refund</option>
                  <option value="FAQ_UMUM">💡 Tips Ibadah & FAQ Umum</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Ringkas</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pertanyaan / Keluhan Konsumen</label>
                <textarea
                  rows={2}
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Penjelasan Teknis (Internal SOP)</label>
                <textarea
                  rows={3}
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Skrip Chat WhatsApp Siap Salin</label>
                <textarea
                  rows={4}
                  value={formData.waScript}
                  onChange={(e) => setFormData({ ...formData, waScript: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kata Kunci Tag (Pisahkan Koma)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
