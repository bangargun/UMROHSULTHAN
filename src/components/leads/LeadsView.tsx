"use client";

import React, { useState } from "react";
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
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    source: "INSTAGRAM",
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
      (lead.city && lead.city.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = selectedStatus === "ALL" || lead.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({
          name: "",
          phone: "",
          email: "",
          city: "",
          source: "INSTAGRAM",
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
        // Refresh local selected lead data
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
        alert(`Alhamdulillah! Prospek "${selectedLead.name}" telah berhasil dikonversi menjadi Jamaah Terdaftar dan Invoice DP telah diterbitkan.`);
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

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
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

  const handleDeleteLead = async (id: string, name: string) => {
    if (!confirm(`Hapus prospek "${name}" dari database?`)) return;
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert(`Prospek "${name}" telah dihapus.`);
        onRefresh();
      } else {
        alert("Gagal menghapus prospek.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
    else if (!cleanPhone.startsWith("62")) cleanPhone = "62" + cleanPhone;

    const text = `Assalamu'alaikum Wr. Wb. Bapak/Ibu ${name}, perkenalkan saya dari Tim Marketing Sulthan Haramain Tour & Travel. Mengenai rencana ibadah umroh keluarga, apakah ada informasi paket yang ingin kami bantu jelaskan?`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" />
            Marketing & Pencarian Jamaah (Leads CRM)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan prospek calon jamaah, riwayat follow up, dan konversi ke pendaftaran resmi.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          + Tambah Calon Jamaah
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama calon jamaah, nomor HP, atau kota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {["ALL", "NEW", "CONTACTED", "INTERESTED", "QUOTATION_SENT", "CLOSING_DP", "LOST"].map((status) => {
            const badge = status === "ALL" ? { label: "Semua Status" } : getStatusBadge(status);
            const isActive = selectedStatus === status;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {badge.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leads Structured Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Prospek & Sumber</th>
                <th className="py-3 px-4">Kontak WhatsApp & Kota</th>
                <th className="py-3 px-4">Minat / Estimasi Pax</th>
                <th className="py-3 px-4">Status Pipeline (Tier 1 & 2)</th>
                <th className="py-3 px-4">Agen / Cabang</th>
                <th className="py-3 px-4 text-center">Aksi & Follow Up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Tidak ada data prospek ditemukan
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const badge = getStatusBadge(lead.status);
                  const isConverted = !!lead.pilgrim;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Source */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{lead.name}</p>
                          {isConverted && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                              Jamaah
                            </span>
                          )}
                        </div>
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {lead.source}
                        </span>
                      </td>

                      {/* Contact & City */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{lead.phone}</p>
                        <p className="text-[10px] text-slate-500">{lead.city || "Kota belum diisi"}</p>
                      </td>

                      {/* Interests & Budget */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{lead.estimatedPax} Orang</p>
                        {lead.budget ? (
                          <p className="text-[10px] text-emerald-700 font-bold">{formatCurrency(lead.budget)}</p>
                        ) : (
                          <p className="text-[10px] text-slate-400">Belum ada estimasi budget</p>
                        )}
                        {lead.notes && (
                          <p className="text-[10px] text-slate-500 italic line-clamp-1 max-w-[200px]" title={lead.notes}>
                            {lead.notes}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text} border ${badge.border}`}>
                            {badge.label}
                          </span>
                        </div>
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                          className="mt-1 text-[10px] font-semibold rounded border border-slate-200 bg-white px-1.5 py-0.5 text-slate-700"
                        >
                          <option value="NEW">Lead Baru</option>
                          <option value="CONTACTED">Dihubungi</option>
                          <option value="INTERESTED">Tertarik</option>
                          <option value="QUOTATION_SENT">Penawaran Terkirim</option>
                          <option value="CLOSING_DP">Closing / DP</option>
                          <option value="LOST">Batal / Lost</option>
                        </select>
                      </td>

                      {/* Agent */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{lead.assignedAgent || "Admin Pusat"}</p>
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

                          {!isConverted ? (
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setIsConvertModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shadow-xs"
                              title="Konversi menjadi Jamaah Terdaftar"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Konversi DP
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                              Lunas/DP
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
                  <label className="text-xs font-bold text-slate-700">Sumber Lead</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="INSTAGRAM">Instagram Ads / Feed</option>
                    <option value="TIKTOK">TikTok Marketing</option>
                    <option value="WEBSITE">Website Resmi</option>
                    <option value="REFERRAL">Referral Jamaah / Alumni</option>
                    <option value="AGENT">Agen / Mitra Lapangan</option>
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

      {/* Modal 2: Log Interaksi & Follow-up */}
      {isFollowUpModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Riwayat Follow-up Prospek</h3>
                <p className="text-xs text-slate-500">{selectedLead.name} ({selectedLead.phone})</p>
              </div>
              <button
                onClick={() => setIsFollowUpModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List interaction history */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {selectedLead.interactions?.length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-400">Belum ada catatan follow up</p>
              ) : (
                selectedLead.interactions?.map((item: any) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                        {item.type}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatDate(item.createdAt, "dd/MM/yyyy HH:mm")}</span>
                    </div>
                    <p className="text-slate-700">{item.summary}</p>
                    {item.nextFollowUpDate && (
                      <p className="text-[11px] text-amber-700 font-semibold">
                        🗓 Janji Follow-Up: {formatDate(item.nextFollowUpDate, "dd MMMM yyyy")}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Form tambah follow up */}
            <form onSubmit={handleAddFollowUp} className="space-y-3 pt-3 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-800">Catat Aktivitas Follow-up Baru</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Media Interaksi</label>
                  <select
                    value={followUpData.type}
                    onChange={(e) => setFollowUpData({ ...followUpData, type: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs bg-white"
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="CALL">Panggilan Telepon</option>
                    <option value="MEETING">Tatap Muka / Manasik</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Jadwal Follow-up Selanjutnya</label>
                  <input
                    type="date"
                    value={followUpData.nextFollowUpDate}
                    onChange={(e) => setFollowUpData({ ...followUpData, nextFollowUpDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600">Ringkasan Hasil Pembicaraan *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Jamaah tertarik paket Ramadhan, meminta waktu berdiskusi dengan anak..."
                  value={followUpData.summary}
                  onChange={(e) => setFollowUpData({ ...followUpData, summary: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFollowUpModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border text-xs font-bold text-slate-600"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  {loading ? "Menyimpan..." : "Simpan Catatan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Konversi ke Jamaah Resmi */}
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

              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" /> Otomatisasi Sistem:
                </p>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 text-emerald-800">
                  <li>Data jamaah masuk ke Master Database Jamaah</li>
                  <li>Invoice DP resmi langsung dibuatkan & siap dikirim via WhatsApp</li>
                  <li>Checklist 6 syarat dokumen umroh otomatis dibuat untuk jamaah ini</li>
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
