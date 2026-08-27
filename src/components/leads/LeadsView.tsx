"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Phone,
  MessageSquare,
  Building,
  Calendar,
  DollarSign,
  UserCheck,
  ChevronRight,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Trash2,
  Pencil,
  X,
  Send,
  UserPlus,
  Tag,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusBadge } from "@/lib/utils";

interface LeadsViewProps {
  leads: any[];
  packages: any[];
  onRefresh: () => void;
  onNavigateToPilgrim?: () => void;
}

export default function LeadsView({ leads, packages, onRefresh, onNavigateToPilgrim }: LeadsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  // References from database
  const [agents, setAgents] = useState<any[]>([]);
  const [pilgrims, setPilgrims] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/agents")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAgents(data);
      })
      .catch((e) => console.error(e));

    fetch("/api/pilgrims")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPilgrims(data);
      })
      .catch((e) => console.error(e));
  }, []);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    source: "INSTAGRAM",
    agentName: "",
    referralPilgrimName: "",
    packageId: "",
    budget: "",
    estimatedPax: "1",
    assignedAgent: "Siti Rahmawati (Marketing)",
    notes: "",
  });

  const [followUpData, setFollowUpData] = useState({
    type: "WHATSAPP",
    summary: "",
    nextFollowUpDate: "",
  });

  const [convertData, setConvertData] = useState({
    packageId: packages[0]?.id || "",
    roomType: "QUAD",
    uniformSize: "L",
    dpAmount: "10000000",
    dpDueDate: "",
    gender: "MALE",
  });

  const [loading, setLoading] = useState(false);

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      (lead.city && lead.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.agentName && lead.agentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.referralPilgrimName && lead.referralPilgrimName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = selectedStatus === "ALL" || lead.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  // Calculate metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "NEW").length;
  const contactedLeads = leads.filter((l) => l.status === "CONTACTED" || l.status === "INTERESTED").length;
  const closingLeads = leads.filter((l) => l.status === "CLOSING_DP").length;
  const conversionRate = totalLeads > 0 ? ((closingLeads / totalLeads) * 100).toFixed(1) : "0";

  // Selected package for commission preview
  const activePackage = packages.find((p) => p.id === (formData.packageId || packages[0]?.id));
  const agentCommissionPerPax = activePackage?.commissionAgent ?? 1500000;
  const referralCommissionPerPax = activePackage?.commissionReferral ?? 500000;

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        agentName: formData.source === "AGENT" ? formData.agentName : null,
        referralPilgrimName: formData.source === "REFERRAL" ? formData.referralPilgrimName : null,
        packageId: formData.packageId || null,
      };

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({
          name: "",
          phone: "",
          email: "",
          city: "",
          source: "INSTAGRAM",
          agentName: "",
          referralPilgrimName: "",
          packageId: "",
          budget: "",
          estimatedPax: "1",
          assignedAgent: "Siti Rahmawati (Marketing)",
          notes: "",
        });
        onRefresh();
      } else {
        alert("Gagal menambahkan prospek baru.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditLead = (lead: any) => {
    setSelectedLead(lead);
    setFormData({
      name: lead.name,
      phone: lead.phone,
      email: lead.email || "",
      city: lead.city || "",
      source: lead.source || "INSTAGRAM",
      agentName: lead.agentName || "",
      referralPilgrimName: lead.referralPilgrimName || "",
      packageId: lead.packageId || "",
      budget: lead.budget ? String(lead.budget) : "",
      estimatedPax: String(lead.estimatedPax || 1),
      assignedAgent: lead.assignedAgent || "Siti Rahmawati (Marketing)",
      notes: lead.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setLoading(true);
    try {
      const payload = {
        ...formData,
        agentName: formData.source === "AGENT" ? formData.agentName : null,
        referralPilgrimName: formData.source === "REFERRAL" ? formData.referralPilgrimName : null,
        packageId: formData.packageId || null,
      };

      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        setSelectedLead(null);
        alert("Data prospek berhasil diperbarui!");
        onRefresh();
      } else {
        alert("Gagal memperbarui prospek.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(followUpData),
      });
      if (res.ok) {
        setIsFollowUpModalOpen(false);
        setFollowUpData({ type: "WHATSAPP", summary: "", nextFollowUpDate: "" });
        onRefresh();
        const leadRes = await fetch(`/api/leads/${selectedLead.id}`);
        const updated = await leadRes.json();
        setSelectedLead(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(convertData),
      });
      if (res.ok) {
        setIsConvertModalOpen(false);
        setSelectedLead(null);
        alert(`Alhamdulillah! Prospek "${selectedLead.name}" telah berhasil didaftarkan sebagai Jamaah. Akrual komisi dan pos jurnal umum telah otomatis tercatat.`);
        onRefresh();
        if (onNavigateToPilgrim) onNavigateToPilgrim();
      } else {
        const error = await res.json();
        alert(`Gagal konversi: ${error.error || "Terjadi kesalahan"}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLead = async (leadId: string, leadName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data prospek "${leadName}"?`)) return;
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
    const msg = encodeURIComponent(
      `Assalamu'alaikum Warahmatullahi Wabarakatuh, Bapak/Ibu ${name}. Kami dari Sulthan Haramain Tour & Travel...`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Marketing & Pencarian Jamaah (Leads CRM)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan prospek calon jamaah, sumber perujuk (Mitra Agen/Alumni), follow-up WhatsApp, dan konversi pendaftaran.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              name: "",
              phone: "",
              email: "",
              city: "",
              source: "INSTAGRAM",
              agentName: "",
              referralPilgrimName: "",
              packageId: packages[0]?.id || "",
              budget: "",
              estimatedPax: "1",
              assignedAgent: "Siti Rahmawati (Marketing)",
              notes: "",
            });
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          + Tambah Calon Jamaah
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Prospek</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{totalLeads}</p>
          <p className="text-[11px] text-slate-400 mt-1">Semua prospek terdaftar</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600">Prospek Baru</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-black text-blue-600 mt-2">{newLeads}</p>
          <p className="text-[11px] text-blue-400 mt-1">Belum di-follow up</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600">Sedang Negosiasi</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-black text-amber-600 mt-2">{contactedLeads}</p>
          <p className="text-[11px] text-amber-500 mt-1">Follow up & penawaran</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Closing DP / Jamaah</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-black text-emerald-600 mt-2">{closingLeads}</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">Tingkat Konversi: {conversionRate}%</p>
        </div>
      </div>

      {/* Filters & Pipeline Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, No HP, kota, agen, atau alumni..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {["ALL", "NEW", "CONTACTED", "INTERESTED", "QUOTATION_SENT", "CLOSING_DP", "LOST"].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                  selectedStatus === st
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st === "ALL"
                  ? "Semua"
                  : st === "NEW"
                  ? "Baru"
                  : st === "CONTACTED"
                  ? "Dihubungi"
                  : st === "INTERESTED"
                  ? "Tertarik"
                  : st === "QUOTATION_SENT"
                  ? "Penawaran Terkirim"
                  : st === "CLOSING_DP"
                  ? "Closing / DP"
                  : "Batal / Lost"}
              </button>
            ))}
          </div>
        </div>

        {/* Leads Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Nama Prospek & Sumber</th>
                <th className="py-3 px-4">Kontak (WhatsApp)</th>
                <th className="py-3 px-4">Kota / Rombongan</th>
                <th className="py-3 px-4">Status Pipeline</th>
                <th className="py-3 px-4">Agen / Alumni Perujuk</th>
                <th className="py-3 px-4 text-center">Aksi & Follow Up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">Belum ada data calon jamaah</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Klik tombol "+ Tambah Calon Jamaah" di atas untuk menambahkan prospek baru.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isConverted = lead.status === "CLOSING_DP" || Boolean(lead.pilgrim);
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Source */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{lead.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              lead.source === "AGENT"
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : lead.source === "REFERRAL"
                                ? "bg-blue-100 text-blue-900 border border-blue-300"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {lead.source === "AGENT"
                              ? "Mitra / Agen"
                              : lead.source === "REFERRAL"
                              ? "Referral Alumni"
                              : lead.source}
                          </span>
                          {lead.budget && (
                            <span className="text-[10px] text-slate-400">
                              Budget: {formatCurrency(lead.budget)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-900 font-semibold">{lead.phone}</div>
                        {lead.email && <div className="text-[10px] text-slate-400">{lead.email}</div>}
                      </td>

                      {/* City & Pax */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{lead.city || "-"}</div>
                        <div className="text-[11px] text-emerald-700 font-bold">{lead.estimatedPax || 1} Pax</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <select
                          value={lead.status}
                          disabled={isConverted}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition-all ${
                            lead.status === "NEW"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : lead.status === "CONTACTED"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : lead.status === "INTERESTED"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : lead.status === "QUOTATION_SENT"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : lead.status === "CLOSING_DP"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-black"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                        >
                          <option value="NEW">Baru</option>
                          <option value="CONTACTED">Dihubungi</option>
                          <option value="INTERESTED">Tertarik</option>
                          <option value="QUOTATION_SENT">Penawaran Terkirim</option>
                          <option value="CLOSING_DP">Closing / DP</option>
                          <option value="LOST">Batal / Lost</option>
                        </select>
                      </td>

                      {/* Agent / Referral Source */}
                      <td className="py-3 px-4">
                        {lead.source === "AGENT" ? (
                          <div>
                            <span className="font-bold text-amber-900 flex items-center gap-1">
                              🏷️ {lead.agentName || "Mitra Lapangan"}
                            </span>
                            <span className="text-[10px] text-amber-600 font-medium">Agen Lapangan Terhubung</span>
                          </div>
                        ) : lead.source === "REFERRAL" ? (
                          <div>
                            <span className="font-bold text-blue-900 flex items-center gap-1">
                              👥 {lead.referralPilgrimName || "Alumni Jamaah"}
                            </span>
                            <span className="text-[10px] text-blue-600 font-medium">Referral Jamaah/Alumni</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-semibold text-slate-800">{lead.assignedAgent || "Admin Pusat"}</span>
                            <span className="text-[10px] text-slate-400 block">Direct Inquiry</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openWhatsApp(lead.phone, lead.name)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            title="Chat WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsFollowUpModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                            title="Riwayat Follow-up"
                          >
                            <Clock className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEditLead(lead)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                            title="Edit Data Prospek"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {!isConverted ? (
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setConvertData({
                                  packageId: lead.packageId || packages[0]?.id || "",
                                  roomType: "QUAD",
                                  uniformSize: "L",
                                  dpAmount: "10000000",
                                  dpDueDate: "",
                                  gender: "MALE",
                                });
                                setIsConvertModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shadow-xs"
                              title="Konversi menjadi Jamaah Terdaftar"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Konversi DP
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                              Lunas / DP
                            </span>
                          )}

                          <button
                            onClick={() => handleDeleteLead(lead.id, lead.name)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                            title="Hapus Prospek"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Input Prospek Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Tambah Calon Jamaah (Lead Prospek)
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLead} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Nama Calon Jamaah *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. H. Bambang Sulistyo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Nomor WhatsApp / HP *</label>
                  <input
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Kota Asal</label>
                  <input
                    type="text"
                    placeholder="e.g. Jakarta Selatan"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Sumber Lead *</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="AGENT">Agen / Mitra Lapangan</option>
                    <option value="REFERRAL">Referral Jamaah / Alumni</option>
                    <option value="INSTAGRAM">Instagram Ads / Feed</option>
                    <option value="TIKTOK">TikTok Marketing</option>
                    <option value="WEBSITE">Website Resmi</option>
                    <option value="WALK_IN">Walk-In (Datang ke Kantor)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Estimasi Rombongan (Pax)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.estimatedPax}
                    onChange={(e) => setFormData({ ...formData, estimatedPax: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Conditional 1: Nama Agen / Mitra Lapangan */}
              {formData.source === "AGENT" && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2 animate-in fade-in">
                  <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-600" /> Nama Agen / Mitra Lapangan *
                  </label>
                  <div className="space-y-1">
                    <input
                      type="text"
                      list="add-agent-list"
                      required
                      placeholder="Ketik nama atau pilih agen terdaftar..."
                      value={formData.agentName}
                      onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                    <datalist id="add-agent-list">
                      {agents.map((ag) => (
                        <option key={ag.id} value={ag.name}>
                          {ag.name} - {ag.city} ({ag.referralCode})
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <p className="text-[11px] text-amber-700 font-medium">
                    🏷️ Komisi paket: <strong className="font-mono">{formatCurrency(agentCommissionPerPax)}</strong> /pax (otomatis terhubung ke Modul Agen, Jurnal Umum, & Laporan Laba Rugi).
                  </p>
                </div>
              )}

              {/* Conditional 2: Nama Jamaah / Alumni Perujuk */}
              {formData.source === "REFERRAL" && (
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2 animate-in fade-in">
                  <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Nama Jamaah / Alumni Perujuk *
                  </label>
                  <div className="space-y-1">
                    <input
                      type="text"
                      list="add-pilgrim-list"
                      required
                      placeholder="Ketik nama atau pilih alumni perujuk..."
                      value={formData.referralPilgrimName}
                      onChange={(e) => setFormData({ ...formData, referralPilgrimName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <datalist id="add-pilgrim-list">
                      {pilgrims.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} - {p.city || "Jamaah"}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <p className="text-[11px] text-blue-700 font-medium">
                    👥 Komisi referral: <strong className="font-mono">{formatCurrency(referralCommissionPerPax)}</strong> /pax (otomatis dicatat di Jurnal Umum & Laba Rugi).
                  </p>
                </div>
              )}

              {/* Pilihan Paket Umroh */}
              <div>
                <label className="text-xs font-bold text-slate-700">Pilihan Paket Umroh yang Diminati</label>
                <select
                  value={formData.packageId}
                  onChange={(e) => setFormData({ ...formData, packageId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">-- Pilih Paket (Opsional) --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - {formatCurrency(pkg.priceQuad)} (Komisi Agen: {formatCurrency(pkg.commissionAgent || 1500000)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Estimasi Anggaran / Budget (Rp)</label>
                <input
                  type="number"
                  placeholder="e.g. 70000000"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Catatan Khusus / Keinginan Paket</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Ingin berangkat bulan Ramadhan kamar berdua dengan istri, hotel bintang 5 dekat masjid..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : "Simpan Prospek"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Prospek */}
      {isEditModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-600" />
                Edit Data Calon Jamaah
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLead} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Nama Calon Jamaah *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Nomor WhatsApp / HP *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Kota Asal</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Sumber Lead *</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="AGENT">Agen / Mitra Lapangan</option>
                    <option value="REFERRAL">Referral Jamaah / Alumni</option>
                    <option value="INSTAGRAM">Instagram Ads / Feed</option>
                    <option value="TIKTOK">TikTok Marketing</option>
                    <option value="WEBSITE">Website Resmi</option>
                    <option value="WALK_IN">Walk-In (Datang ke Kantor)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Estimasi Rombongan (Pax)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.estimatedPax}
                    onChange={(e) => setFormData({ ...formData, estimatedPax: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Conditional 1: Nama Agen / Mitra Lapangan */}
              {formData.source === "AGENT" && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2 animate-in fade-in">
                  <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-600" /> Nama Agen / Mitra Lapangan *
                  </label>
                  <div className="space-y-1">
                    <input
                      type="text"
                      list="edit-agent-list"
                      required
                      placeholder="Ketik nama atau pilih agen terdaftar..."
                      value={formData.agentName}
                      onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                    <datalist id="edit-agent-list">
                      {agents.map((ag) => (
                        <option key={ag.id} value={ag.name}>
                          {ag.name} - {ag.city} ({ag.referralCode})
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <p className="text-[11px] text-amber-700 font-medium">
                    🏷️ Komisi paket: <strong className="font-mono">{formatCurrency(agentCommissionPerPax)}</strong> /pax (otomatis terhubung ke Modul Agen, Jurnal Umum, & Laporan Laba Rugi).
                  </p>
                </div>
              )}

              {/* Conditional 2: Nama Jamaah / Alumni Perujuk */}
              {formData.source === "REFERRAL" && (
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2 animate-in fade-in">
                  <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Nama Jamaah / Alumni Perujuk *
                  </label>
                  <div className="space-y-1">
                    <input
                      type="text"
                      list="edit-pilgrim-list"
                      required
                      placeholder="Ketik nama atau pilih alumni perujuk..."
                      value={formData.referralPilgrimName}
                      onChange={(e) => setFormData({ ...formData, referralPilgrimName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <datalist id="edit-pilgrim-list">
                      {pilgrims.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} - {p.city || "Jamaah"}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <p className="text-[11px] text-blue-700 font-medium">
                    👥 Komisi referral: <strong className="font-mono">{formatCurrency(referralCommissionPerPax)}</strong> /pax (otomatis dicatat di Jurnal Umum & Laba Rugi).
                  </p>
                </div>
              )}

              {/* Pilihan Paket Umroh */}
              <div>
                <label className="text-xs font-bold text-slate-700">Pilihan Paket Umroh yang Diminati</label>
                <select
                  value={formData.packageId}
                  onChange={(e) => setFormData({ ...formData, packageId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">-- Pilih Paket (Opsional) --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - {formatCurrency(pkg.priceQuad)} (Komisi Agen: {formatCurrency(pkg.commissionAgent || 1500000)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Estimasi Anggaran / Budget (Rp)</label>
                <input
                  type="number"
                  placeholder="e.g. 70000000"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Catatan Khusus / Keinginan Paket</label>
                <textarea
                  rows={3}
                  placeholder="Catatan kebutuhan jamaah..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-amber-600 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Catat Follow-up / Interaksi */}
      {isFollowUpModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  Riwayat & Catatan Follow-up
                </h3>
                <p className="text-xs text-slate-500">Prospek: {selectedLead.name} ({selectedLead.phone})</p>
              </div>
              <button
                onClick={() => setIsFollowUpModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Riwayat Interaksi */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <h4 className="text-xs font-bold text-slate-700">Riwayat Komunikasi Sebelumnya:</h4>
              {selectedLead.interactions && selectedLead.interactions.length > 0 ? (
                selectedLead.interactions.map((it: any) => (
                  <div key={it.id} className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-emerald-600" /> {it.type}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatDate(it.createdAt, "dd MMM yyyy, HH:mm")}</span>
                    </div>
                    <p className="text-slate-600">{it.summary}</p>
                    {it.nextFollowUpDate && (
                      <p className="text-[10px] text-amber-700 font-semibold">
                        📅 Jadwal Follow-up Berikutnya: {formatDate(it.nextFollowUpDate, "dd MMM yyyy")}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada riwayat follow-up yang dicatat.</p>
              )}
            </div>

            <form onSubmit={handleAddFollowUp} className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700">Tambah Catatan Follow-up Baru:</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Channel</label>
                  <select
                    value={followUpData.type}
                    onChange={(e) => setFollowUpData({ ...followUpData, type: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs bg-white"
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="CALL">Telepon Langsung</option>
                    <option value="MEETING">Tatap Muka / Kantor</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Jadwal Follow-up Lagi</label>
                  <input
                    type="date"
                    value={followUpData.nextFollowUpDate}
                    onChange={(e) => setFollowUpData({ ...followUpData, nextFollowUpDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Ringkasan Hasil Pembicaraan *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Sudah dikirimkan brosur paket Ramadhan. Tertarik ambil sekamar ber-2, minta di-follow up 2 hari lagi..."
                  value={followUpData.summary}
                  onChange={(e) => setFollowUpData({ ...followUpData, summary: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFollowUpModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  {loading ? "Menyimpan..." : "Simpan Catatan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Konversi Prospek ke Jamaah Resmi */}
      {isConvertModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  Konversi Prospek ke Jamaah Resmi
                </h3>
                <p className="text-xs text-slate-500">Mendaftarkan "{selectedLead.name}" ke database & terbitkan Invoice DP</p>
              </div>
              <button
                onClick={() => setIsConvertModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConvertLead} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Pilih Paket Keberangkatan *</label>
                <select
                  required
                  value={convertData.packageId}
                  onChange={(e) => setConvertData({ ...convertData, packageId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {formatDate(p.departureDate, "dd MMM yyyy")} ({formatCurrency(p.priceQuad)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Tipe Kamar</label>
                  <select
                    value={convertData.roomType}
                    onChange={(e) => setConvertData({ ...convertData, roomType: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
                  >
                    <option value="QUAD">Quad (Sekamar Ber-4)</option>
                    <option value="TRIPLE">Triple (Sekamar Ber-3)</option>
                    <option value="DOUBLE">Double (Sekamar Ber-2)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Ukuran Seragam / Batik</label>
                  <select
                    value={convertData.uniformSize}
                    onChange={(e) => setConvertData({ ...convertData, uniformSize: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
                  >
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="XXXL">XXXL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Nominal DP Booking (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={convertData.dpAmount}
                    onChange={(e) => setConvertData({ ...convertData, dpAmount: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Jatuh Tempo DP</label>
                  <input
                    type="date"
                    value={convertData.dpDueDate}
                    onChange={(e) => setConvertData({ ...convertData, dpDueDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
              </div>

              {/* Commission auto-journal preview */}
              {(selectedLead.source === "AGENT" || selectedLead.source === "REFERRAL") && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5">
                    🏷️ Akrual Komisi Otomatis:
                  </p>
                  <p className="text-amber-800 text-[11px]">
                    Sistem akan otomatis mencatat jurnal umum:
                    <br />
                    <strong>Debet</strong> Beban Komisi (HPP) & <strong>Kredit</strong> Hutang Komisi sebesar{" "}
                    <span className="font-mono font-bold text-emerald-800">
                      {formatCurrency(
                        (selectedLead.source === "AGENT" ? agentCommissionPerPax : referralCommissionPerPax) *
                          (selectedLead.estimatedPax || 1)
                      )}
                    </span>{" "}
                    untuk {selectedLead.source === "AGENT" ? `Mitra "${selectedLead.agentName || "-"}"` : `Alumni "${selectedLead.referralPilgrimName || "-"}"`}.
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" /> Otomatisasi Sistem:
                </p>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 text-emerald-800">
                  <li>Data jamaah masuk ke Master Database Jamaah</li>
                  <li>Invoice DP resmi langsung dibuatkan & siap dikirim via WhatsApp</li>
                  <li>Checklist 6 syarat dokumen umroh otomatis dibuat untuk jamaah ini</li>
                  <li>Jurnal akuntansi dan beban laba rugi terupdate otomatis</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  {loading ? "Memproses..." : "Konfirmasi Pendaftaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
