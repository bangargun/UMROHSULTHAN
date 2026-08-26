"use client";

import React, { useState } from "react";
import {
  Building2,
  Users,
  Plus,
  Search,
  ExternalLink,
  Copy,
  CheckCircle2,
  DollarSign,
  Share2,
  MapPin,
  Phone,
  Award,
  X,
  FileCheck,
  Send,
  Trash2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BranchAgentViewProps {
  packages: any[];
  onRefreshAll?: () => void;
}

export default function BranchAgentView({ packages, onRefreshAll }: BranchAgentViewProps) {
  const [activeTab, setActiveTab] = useState<"AGENTS" | "BRANCHES" | "PUBLIC_FORM">("AGENTS");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isAddAgentOpen, setIsAddAgentOpen] = useState(false);

  // Cabang Sulthan Haramain
  const [branches, setBranches] = useState<any[]>([]);

  // Agents Freelance
  const [agents, setAgents] = useState<any[]>([]);

  // Form input new agent
  const [newAgentForm, setNewAgentForm] = useState({
    name: "",
    phone: "",
    city: "Jakarta",
    referralCode: "",
    commissionPerPax: "1500000",
  });

  // Public Booking Form Simulator
  const [bookingForm, setBookingForm] = useState({
    packageId: packages[0]?.id || "",
    name: "",
    nik: "",
    phone: "",
    email: "",
    city: "",
    roomType: "QUAD",
    uniformSize: "L",
    referralCode: "SULTHAN-BDG01",
    dpAmount: "10000000",
  });
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    const newAg = {
      id: `ag-${Date.now()}`,
      name: newAgentForm.name,
      phone: newAgentForm.phone,
      city: newAgentForm.city,
      referralCode: newAgentForm.referralCode || `SULTHAN-${newAgentForm.city.slice(0, 3).toUpperCase()}${Math.floor(10 + Math.random() * 90)}`,
      commissionPerPax: parseFloat(newAgentForm.commissionPerPax) || 1500000,
      closingPax: 0,
      totalEarned: 0,
      paidCommission: 0,
      pendingCommission: 0,
      status: "ACTIVE",
    };
    setAgents([...agents, newAg]);
    setIsAddAgentOpen(false);
    setNewAgentForm({ name: "", phone: "", city: "Jakarta", referralCode: "", commissionPerPax: "1500000" });
    alert("Agen freelance baru berhasil ditambahkan!");
  };

  const handlePublicBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBooking(true);
    try {
      // 1. Submit lead to CRM with agent source
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bookingForm.name,
          phone: bookingForm.phone,
          email: bookingForm.email,
          city: bookingForm.city,
          source: "WEBSITE",
          status: "NEW",
          estimatedPax: 1,
          assignedAgent: `Agen Referral (${bookingForm.referralCode || "Kantor Pusat"})`,
          notes: `Pendaftaran mandiri via Web Portal Sulthan Haramain. Pilihan Kamar: ${bookingForm.roomType}, Baju: ${bookingForm.uniformSize}`,
        }),
      });

      if (res.ok) {
        alert(
          `Alhamdulillah! Pendaftaran mandiri atas nama "${bookingForm.name}" telah berhasil masuk ke antrean sistem Sulthan Haramain Tour & Travel.`
        );
        setBookingForm({
          packageId: packages[0]?.id || "",
          name: "",
          nik: "",
          phone: "",
          email: "",
          city: "",
          roomType: "QUAD",
          uniformSize: "L",
          referralCode: "",
          dpAmount: "10000000",
        });
        if (onRefreshAll) onRefreshAll();
      } else {
        alert("Gagal melakukan pendaftaran.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.referralCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-amber-600" />
            Jaringan Kantor Cabang & Agen Freelance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola kantor cabang multi-kota, link referral agen freelance, komisi per pax, dan formulir pendaftaran online mandiri.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("PUBLIC_FORM")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-bold text-amber-900 shadow-xs hover:bg-amber-100 transition-all"
          >
            <ExternalLink className="h-4 w-4 text-amber-700" />
            Formulir Pendaftaran Online Mandiri
          </button>

          <button
            onClick={() => setIsAddAgentOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            + Tambah Agen Freelance
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3 no-print">
        <button
          onClick={() => setActiveTab("AGENTS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "AGENTS"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Users className="w-4 h-4" /> Daftar Agen & Referral Link ({agents.length})
        </button>

        <button
          onClick={() => setActiveTab("BRANCHES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "BRANCHES"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Building2 className="w-4 h-4" /> Kantor Cabang Multi-Kota ({branches.length})
        </button>

        <button
          onClick={() => setActiveTab("PUBLIC_FORM")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "PUBLIC_FORM"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileCheck className="w-4 h-4" /> Portal Pendaftaran Mandiri (Public Link)
        </button>
      </div>

      {/* TAB 1: DAFTAR AGEN & REFERRAL LINK */}
      {activeTab === "AGENTS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari agen, kota, atau kode referral..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Komisi Standar: <strong>Rp 1.500.000 / Pax Jamaah Berangkat</strong>
            </p>
          </div>

          {/* Table Daftar Agen Freelance */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama Agen & Kota Cabang</th>
                    <th className="py-3 px-4">Kontak WhatsApp</th>
                    <th className="py-3 px-4">Kode Referral & Link Web</th>
                    <th className="py-3 px-4 text-center">Closing Pax</th>
                    <th className="py-3 px-4 text-right">Total Komisi</th>
                    <th className="py-3 px-4 text-right">Telah Cair</th>
                    <th className="py-3 px-4 text-right">Sisa Payout</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredAgents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        Belum ada data agen freelance. Klik <strong>"+ Tambah Agen Freelance"</strong> untuk menambahkan.
                      </td>
                    </tr>
                  ) : (
                    filteredAgents.map((ag) => (
                      <tr key={ag.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{ag.name}</p>
                          <span className="inline-block text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded mt-0.5">
                            Cabang {ag.city}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {ag.phone}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-amber-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {ag.referralCode}
                            </span>
                            <button
                              onClick={() => handleCopyLink(ag.referralCode)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold shadow-xs"
                              title="Salin Link Pendaftaran Web"
                            >
                              {copiedCode === ag.referralCode ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-slate-950" /> Tersalin!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> Salin Link
                                </>
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="font-black text-slate-900 text-sm">{ag.closingPax}</span>
                          <span className="text-[10px] text-slate-400 block">Jamaah</span>
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(ag.totalEarned)}
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          {formatCurrency(ag.paidCommission)}
                        </td>

                        <td className="py-3 px-4 text-right font-black text-amber-800">
                          {formatCurrency(ag.pendingCommission)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm(`Hapus agen "${ag.name}"?`)) {
                                setAgents(agents.filter((item) => item.id !== ag.id));
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                            title="Hapus Agen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KANTOR CABANG MULTI-KOTA */}
      {activeTab === "BRANCHES" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Kota Cabang</th>
                  <th className="py-3 px-4">Pimpinan Cabang</th>
                  <th className="py-3 px-4">Alamat Kantor</th>
                  <th className="py-3 px-4">Kontak Telepon</th>
                  <th className="py-3 px-4 text-center">Agen Aktif</th>
                  <th className="py-3 px-4 text-right">Total Jamaah Berangkat</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {branches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Belum ada data kantor cabang terdaftar.
                    </td>
                  </tr>
                ) : (
                  branches.map((br) => (
                    <tr key={br.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {br.city}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {br.head}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-[280px]">
                        {br.address}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-800">
                        {br.phone}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {br.agentsCount} Agen
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-emerald-800 text-sm">
                        {br.totalPax} Pax
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Hapus cabang "${br.city}"?`)) {
                              setBranches(branches.filter((item) => item.id !== br.id));
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                          title="Hapus Cabang"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PUBLIC BOOKING PORTAL SIMULATOR */}
      {activeTab === "PUBLIC_FORM" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2 border-b border-slate-100 pb-5">
            <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 mx-auto p-1 shadow-xs flex items-center justify-center">
              <img
                src="/sulthan-haramain-logo.jpg"
                alt="Sulthan Haramain"
                className="h-full w-full object-contain"
              />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Formulir Pendaftaran Umroh Online Mandiri
            </h3>
            <p className="text-xs text-slate-500">
              PT Sulthan Haramain Tour & Travel • Penyelenggara Resmi Ibadah Umroh
            </p>
          </div>

          <form onSubmit={handlePublicBookingSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-800">1. Pilih Jadwal & Program Paket Umroh *</label>
              <select
                required
                value={bookingForm.packageId}
                onChange={(e) => setBookingForm({ ...bookingForm, packageId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - Berangkat {formatDate(pkg.departureDate, "dd MMM yyyy")} ({formatCurrency(pkg.priceQuad)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-800">Tipe Kamar Hotel *</label>
                <select
                  value={bookingForm.roomType}
                  onChange={(e) => setBookingForm({ ...bookingForm, roomType: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                >
                  <option value="QUAD">Kamar Quad (Ber-4)</option>
                  <option value="TRIPLE">Kamar Triple (Ber-3)</option>
                  <option value="DOUBLE">Kamar Double (Ber-2)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800">Ukuran Baju Seragam / Batik *</label>
                <select
                  value={bookingForm.uniformSize}
                  onChange={(e) => setBookingForm({ ...bookingForm, uniformSize: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                >
                  <option value="S">S (Small)</option>
                  <option value="M">M (Medium)</option>
                  <option value="L">L (Large)</option>
                  <option value="XL">XL (Extra Large)</option>
                  <option value="XXL">XXL (Double Extra Large)</option>
                  <option value="XXXL">XXXL</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-800">Nama Lengkap Jamaah (Sesuai KTP/Paspor) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. H. Muhammad Farhan"
                  value={bookingForm.name}
                  onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800">Nomor WhatsApp Aktif *</label>
                <input
                  type="tel"
                  required
                  placeholder="081234567890"
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-800">Email Jamaah</label>
                <input
                  type="email"
                  placeholder="jamaah@gmail.com"
                  value={bookingForm.email}
                  onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800">Kota Domisili Tinggal</label>
                <input
                  type="text"
                  placeholder="e.g. Bandung / Surabaya"
                  value={bookingForm.city}
                  onChange={(e) => setBookingForm({ ...bookingForm, city: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-800">Kode Referral Agen / Rekomendasi (Opsional)</label>
              <input
                type="text"
                placeholder="e.g. SULTHAN-BDG01"
                value={bookingForm.referralCode}
                onChange={(e) => setBookingForm({ ...bookingForm, referralCode: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono uppercase text-amber-800"
              />
            </div>

            {/* Payment info DP */}
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-2">
              <span className="font-bold text-amber-900 block text-xs">Informasi Pembayaran DP Seat:</span>
              <p className="text-[11px] text-slate-600">
                Nominal DP Penguncian Seat: <strong>Rp 10.000.000 / Pax</strong>
              </p>
              <p className="text-[11px] text-slate-600">
                Rekening Resmi: <strong>Bank Syariah Indonesia (BSI) Rek: 8888-999-123 a.n PT Sulthan Haramain Tour & Travel</strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmittingBooking}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmittingBooking ? "Mengirim Pendaftaran..." : "Kirim Formulir Pendaftaran Umroh Mandiri"}
            </button>
          </form>
        </div>
      )}

      {/* MODAL TAMBAH AGEN BARU */}
      {isAddAgentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                Tambah Agen Freelance Baru
              </h3>
              <button onClick={() => setIsAddAgentOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAgent} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nama Lengkap Agen *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ustadz Abdullah"
                  value={newAgentForm.name}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Nomor WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="08123456789"
                    value={newAgentForm.phone}
                    onChange={(e) => setNewAgentForm({ ...newAgentForm, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Kota Cabang</label>
                  <select
                    value={newAgentForm.city}
                    onChange={(e) => setNewAgentForm({ ...newAgentForm, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  >
                    <option value="Jakarta">Jakarta</option>
                    <option value="Bandung">Bandung</option>
                    <option value="Surabaya">Surabaya</option>
                    <option value="Makassar">Makassar</option>
                    <option value="Medan">Medan</option>
                    <option value="Solo">Solo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Kode Referral (Custom)</label>
                  <input
                    type="text"
                    placeholder="Auto Generated"
                    value={newAgentForm.referralCode}
                    onChange={(e) => setNewAgentForm({ ...newAgentForm, referralCode: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Komisi per Pax (Rp)</label>
                  <input
                    type="number"
                    value={newAgentForm.commissionPerPax}
                    onChange={(e) => setNewAgentForm({ ...newAgentForm, commissionPerPax: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAgentOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700"
                >
                  Simpan Agen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
