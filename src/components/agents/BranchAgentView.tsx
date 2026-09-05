"use client";

import React, { useState, useEffect } from "react";
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
  CreditCard,
  Building,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Pagination from "@/components/common/Pagination";

interface BranchAgentViewProps {
  packages: any[];
  onRefreshAll?: () => void;
}

export default function BranchAgentView({ packages, onRefreshAll }: BranchAgentViewProps) {
  const [activeTab, setActiveTab] = useState<"AGENTS" | "BRANCHES" | "PUBLIC_FORM">("AGENTS");
  const [searchTerm, setSearchTerm] = useState("");
  const [agentPage, setAgentPage] = useState(1);
  const [agentPageSize, setAgentPageSize] = useState(10);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isAddAgentOpen, setIsAddAgentOpen] = useState(false);
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedAgentForPayout, setSelectedAgentForPayout] = useState<any | null>(null);
  const [payoutAmount, setPayoutAmount] = useState("");

  // Cabang Sulthan Haramain
  const [branches, setBranches] = useState<any[]>([]);

  // Agents Freelance
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load from DB
  const loadData = async () => {
    try {
      const [agRes, brRes] = await Promise.all([fetch("/api/agents"), fetch("/api/branches")]);
      if (agRes.ok) {
        const agData = await agRes.json();
        if (Array.isArray(agData)) setAgents(agData);
      }
      if (brRes.ok) {
        const brData = await brRes.json();
        if (Array.isArray(brData)) setBranches(brData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Form input new agent
  const [newAgentForm, setNewAgentForm] = useState({
    name: "",
    phone: "",
    city: "",
    referralCode: "",
    commissionPerPax: "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });

  // Form input new branch
  const [newBranchForm, setNewBranchForm] = useState({
    code: "",
    name: "",
    city: "",
    address: "",
    headName: "",
    phone: "",
    email: "",
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
    referralCode: "",
    dpAmount: "",
  });
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAgentForm),
      });
      if (res.ok) {
        setIsAddAgentOpen(false);
        setNewAgentForm({
          name: "",
          phone: "",
          city: "",
          referralCode: "",
          commissionPerPax: "",
          bankName: "",
          accountNumber: "",
          accountHolder: "",
        });
        alert("Agen freelance baru berhasil ditambahkan!");
        loadData();
        if (onRefreshAll) onRefreshAll();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menambahkan agen");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = async (id: string, name: string) => {
    if (!confirm(`Hapus agen "${name}"?`)) return;
    try {
      const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadData();
        if (onRefreshAll) onRefreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBranchForm),
      });
      if (res.ok) {
        setIsAddBranchOpen(false);
        setNewBranchForm({
          code: "",
          name: "",
          city: "Jakarta",
          address: "",
          headName: "",
          phone: "",
          email: "",
        });
        alert("Kantor cabang baru berhasil ditambahkan!");
        loadData();
        if (onRefreshAll) onRefreshAll();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menambahkan cabang");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async (id: string, name: string) => {
    if (!confirm(`Hapus kantor cabang "${name}"?`)) return;
    try {
      const res = await fetch(`/api/branches/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadData();
        if (onRefreshAll) onRefreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayoutCommissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentForPayout) return;
    const nominal = parseFloat(payoutAmount);
    if (!nominal || nominal <= 0) {
      alert("Nominal pencairan komisi tidak valid");
      return;
    }
    setLoading(true);
    try {
      const newPaid = (selectedAgentForPayout.paidCommission || 0) + nominal;
      const res = await fetch(`/api/agents/${selectedAgentForPayout.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidCommission: newPaid }),
      });
      if (res.ok) {
        // Record Journal Entry for Commission Payout
        const entryNumber = `JU-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
        await fetch("/api/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entryNumber,
            transactionDate: new Date().toISOString().split("T")[0],
            description: `Pencairan Pembayaran Komisi Agen: ${selectedAgentForPayout.name} (${selectedAgentForPayout.city})`,
            sourceModule: "EXPENSE",
            lines: [
              {
                accountCode: "2102",
                accountName: "Hutang Komisi Agen",
                accountCategory: "LIABILITY",
                debit: nominal,
                credit: 0,
                memo: `Pencairan komisi ke ${selectedAgentForPayout.name}`,
              },
              {
                accountCode: "1102",
                accountName: "Bank BSI Utama",
                accountCategory: "ASSET",
                debit: 0,
                credit: nominal,
                memo: `Transfer pembayaran komisi via BSI ${selectedAgentForPayout.accountNumber || ""}`,
              },
            ],
          }),
        });

        setIsPayoutModalOpen(false);
        setSelectedAgentForPayout(null);
        setPayoutAmount("");
        alert(`Pencairan komisi sebesar ${formatCurrency(nominal)} untuk "${selectedAgentForPayout.name}" berhasil dicatat di database dan Jurnal Umum!`);
        loadData();
        if (onRefreshAll) onRefreshAll();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublicBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBooking(true);
    try {
      const refCode = bookingForm.referralCode.trim().toUpperCase();
      const matchedAgent = agents.find((a) => a.referralCode.toUpperCase() === refCode);

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bookingForm.name,
          phone: bookingForm.phone,
          email: bookingForm.email,
          city: bookingForm.city,
          source: matchedAgent ? "AGENT" : "WEBSITE",
          agentName: matchedAgent ? matchedAgent.name : null,
          packageId: bookingForm.packageId || null,
          status: "NEW",
          estimatedPax: 1,
          assignedAgent: matchedAgent ? `Mitra: ${matchedAgent.name}` : "Admin Pusat",
          notes: `Pendaftaran mandiri via Web Portal Sulthan Haramain. Kamar: ${bookingForm.roomType}, Baju: ${bookingForm.uniformSize}`,
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
      (a.city && a.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Reset page when search changes
  useEffect(() => {
    setAgentPage(1);
  }, [searchTerm]);

  const paginatedAgents = filteredAgents.slice((agentPage - 1) * agentPageSize, agentPage * agentPageSize);

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
            Kelola kantor cabang multi-kota, link referral agen freelance, komisi per pax terhubung ke Paket Umroh & Laba Rugi.
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
              Komisi per pax terhubung otomatis ke <strong className="text-emerald-700">Paket Umroh</strong> & <strong className="text-emerald-700">Jurnal Umum Laba Rugi</strong>.
            </p>
          </div>

          {/* Table Daftar Agen Freelance */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Nama Agen & Kota Cabang</th>
                    <th className="py-3 px-4">Kontak & Rekening</th>
                    <th className="py-3 px-4">Kode Referral & Link Web</th>
                    <th className="py-3 px-4 text-center">Closing Pax</th>
                    <th className="py-3 px-4 text-right">Total Komisi</th>
                    <th className="py-3 px-4 text-right">Telah Cair</th>
                    <th className="py-3 px-4 text-right">Sisa Payout</th>
                    <th className="py-3 px-4 text-center">Aksi & Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredAgents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-semibold text-slate-600">Belum ada data agen freelance</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Klik tombol <strong>"+ Tambah Agen Freelance"</strong> di atas untuk mendaftarkan agen baru.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedAgents.map((ag) => (
                      <tr key={ag.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{ag.name}</p>
                          <span className="inline-block text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded mt-0.5">
                            Cabang {ag.city}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800">{ag.phone}</p>
                          {ag.accountNumber && (
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {ag.bankName}: {ag.accountNumber} ({ag.accountHolder || ag.name})
                            </span>
                          )}
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
                          <span className="font-black text-slate-900 text-sm">{ag.totalClosingPax || 0}</span>
                          <span className="text-[10px] text-slate-400 block">Pax Jamaah</span>
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(ag.totalCommissionEarned || 0)}
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          {formatCurrency(ag.paidCommission || 0)}
                        </td>

                        <td className="py-3 px-4 text-right font-black text-amber-800">
                          {formatCurrency(ag.pendingCommission || 0)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedAgentForPayout(ag);
                                setPayoutAmount(String(ag.pendingCommission || 0));
                                setIsPayoutModalOpen(true);
                              }}
                              disabled={!ag.pendingCommission || ag.pendingCommission <= 0}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Cairkan Komisi Agen"
                            >
                              <CreditCard className="w-3 h-3" /> Payout
                            </button>

                            <button
                              onClick={() => handleDeleteAgent(ag.id, ag.name)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                              title="Hapus Agen"
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
            {filteredAgents.length > 0 && (
              <Pagination
                currentPage={agentPage}
                totalItems={filteredAgents.length}
                pageSize={agentPageSize}
                onPageChange={setAgentPage}
                onPageSizeChange={(newSize) => {
                  setAgentPageSize(newSize);
                  setAgentPage(1);
                }}
                itemLabel="agen"
              />
            )}
          </div>
        </div>
      )}

      {/* TAB 2: KANTOR CABANG MULTI-KOTA */}
      {activeTab === "BRANCHES" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Daftar Kantor Cabang Resmi Sulthan Haramain</h3>
              <p className="text-xs text-slate-400">Jaringan perwakilan dan kantor operasional daerah</p>
            </div>
            <button
              onClick={() => setIsAddBranchOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700"
            >
              <Plus className="w-4 h-4" /> + Tambah Cabang
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Kode & Nama Cabang</th>
                    <th className="py-3 px-4">Kota</th>
                    <th className="py-3 px-4">Pimpinan Cabang</th>
                    <th className="py-3 px-4">Alamat Kantor</th>
                    <th className="py-3 px-4">Kontak Telepon</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {branches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-semibold text-slate-600">Belum ada kantor cabang</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Klik "+ Tambah Cabang" untuk mendaftarkan kantor cabang resmi.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    branches.map((br) => (
                      <tr key={br.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <span className="font-mono text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 mr-2 text-[10px]">
                            {br.code}
                          </span>
                          {br.name}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {br.city}
                        </td>

                        <td className="py-3.5 px-4 text-slate-800">
                          {br.headName || "-"}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 max-w-[280px]">
                          {br.address || "-"}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-800">
                          {br.phone || "-"}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                            {br.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDeleteBranch(br.id, br.name)}
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
                  <input
                    type="text"
                    placeholder="Jakarta / Bandung"
                    value={newAgentForm.city}
                    onChange={(e) => setNewAgentForm({ ...newAgentForm, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Bank Pencairan</label>
                  <input
                    type="text"
                    placeholder="BSI / BCA / Mandiri"
                    value={newAgentForm.bankName}
                    onChange={(e) => setNewAgentForm({ ...newAgentForm, bankName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">No Rekening</label>
                  <input
                    type="text"
                    placeholder="8888-xxx-xxx"
                    value={newAgentForm.accountNumber}
                    onChange={(e) => setNewAgentForm({ ...newAgentForm, accountNumber: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono"
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
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700"
                >
                  {loading ? "Menyimpan..." : "Simpan Agen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH CABANG */}
      {isAddBranchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                Tambah Kantor Cabang Baru
              </h3>
              <button onClick={() => setIsAddBranchOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBranch} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Kode Cabang *</label>
                  <input
                    type="text"
                    required
                    placeholder="SULTHAN-BDG"
                    value={newBranchForm.code}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, code: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Kota Cabang *</label>
                  <input
                    type="text"
                    required
                    placeholder="Bandung"
                    value={newBranchForm.city}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Nama Kantor Cabang *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kantor Cabang Bandung Dago"
                  value={newBranchForm.name}
                  onChange={(e) => setNewBranchForm({ ...newBranchForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Kepala Cabang</label>
                  <input
                    type="text"
                    placeholder="H. Ahmad Firdaus"
                    value={newBranchForm.headName}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, headName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">No Telepon Kantor</label>
                  <input
                    type="tel"
                    placeholder="(022) 2501234"
                    value={newBranchForm.phone}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  placeholder="Jl. Ir. H. Juanda No. 120..."
                  value={newBranchForm.address}
                  onChange={(e) => setNewBranchForm({ ...newBranchForm, address: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBranchOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700"
                >
                  {loading ? "Menyimpan..." : "Simpan Cabang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PENCAIRAN KOMISI / PAYOUT */}
      {isPayoutModalOpen && selectedAgentForPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Pencairan Payout Komisi Agen
              </h3>
              <button onClick={() => setIsPayoutModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayoutCommissionSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="font-bold text-slate-900">{selectedAgentForPayout.name} (Cabang {selectedAgentForPayout.city})</p>
                <p className="text-slate-500 font-mono">Kode Referral: {selectedAgentForPayout.referralCode}</p>
                <p className="text-slate-500">
                  Rekening: <strong>{selectedAgentForPayout.bankName} {selectedAgentForPayout.accountNumber || "-"}</strong> a.n {selectedAgentForPayout.accountHolder || selectedAgentForPayout.name}
                </p>
                <p className="text-emerald-700 font-bold pt-1">
                  Sisa Komisi Tertunggak: <span className="font-mono text-base">{formatCurrency(selectedAgentForPayout.pendingCommission || 0)}</span>
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700">Nominal Pencairan Komisi (Rp) *</label>
                <input
                  type="number"
                  required
                  max={selectedAgentForPayout.pendingCommission || 0}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold font-mono text-emerald-800 text-sm focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-900">
                ⚡ Sistem otomatis menerbitkan <strong>Jurnal Pengeluaran Kas (Debet: Hutang Komisi, Kredit: Kas Bank)</strong>.
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  {loading ? "Memproses..." : "Konfirmasi Pembayaran Payout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
