"use client";

import React, { useState, useEffect } from "react";
import {
  Coins,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Building,
  Phone,
  Sparkles,
  X,
  UserCheck,
  Send,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface SavingsManagementViewProps {
  packages: any[];
  onRefresh?: () => void;
}

export default function SavingsManagementView({ packages, onRefresh }: SavingsManagementViewProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAccountForDeposit, setSelectedAccountForDeposit] = useState<any | null>(null);
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<any | null>(null);
  const [selectedAccountForConvert, setSelectedAccountForConvert] = useState<any | null>(null);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<{ account: any; tx: any } | null>(null);

  // Form New Account
  const [createForm, setCreateForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    nik: "",
    gender: "MALE",
    city: "Tebing Tinggi",
    address: "",
    uniformSize: "L",
    targetPackageId: packages[0]?.id || "",
    targetPackageName: packages[0] ? `${packages[0].name} (QUAD)` : "UMROH REGULER (ESTIMASI)",
    targetAmount: packages[0]?.priceQuad || 31500000,
    initialDeposit: 2000000,
    equipmentReceived: true,
    notes: "",
  });

  // Form Deposit
  const [depositAmount, setDepositAmount] = useState<number>(1000000);
  const [depositMethod, setDepositMethod] = useState("BANK_TRANSFER");
  const [depositNotes, setDepositNotes] = useState("Setoran Tabungan Umroh Barokah");
  const [depositOfficer, setDepositOfficer] = useState("Admin Keuangan");
  const [actionLoading, setActionLoading] = useState(false);

  // Form Convert
  const [convertPackageId, setConvertPackageId] = useState(packages[0]?.id || "");
  const [convertRoomType, setConvertRoomType] = useState("QUAD");

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/savings");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error("Failed to load savings accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal membuat rekening tabungan");
        return;
      }
      setIsCreateModalOpen(false);
      fetchAccounts();
      if (data.account?.transactions?.[0]) {
        setSelectedTxForReceipt({
          account: data.account,
          tx: data.account.transactions[0],
        });
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountForDeposit) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/savings/${selectedAccountForDeposit.id}/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: depositAmount,
          paymentMethod: depositMethod,
          notes: depositNotes,
          officerName: depositOfficer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal mencatat setoran");
        return;
      }
      setSelectedAccountForDeposit(null);
      fetchAccounts();
      setSelectedTxForReceipt({
        account: data.account,
        tx: data.transaction,
      });
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountForConvert) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/savings/${selectedAccountForConvert.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: convertPackageId,
          roomType: convertRoomType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal mengkonversi penabung");
        return;
      }
      alert(data.message || "Penabung berhasil dikonversi ke Manifest!");
      setSelectedAccountForConvert(null);
      fetchAccounts();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    const matchSearch =
      acc.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.phone.includes(searchTerm) ||
      acc.nik.includes(searchTerm);

    const matchStatus = statusFilter === "ALL" || acc.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // KPI Metrics
  const totalSavingsBalance = accounts.reduce((acc, curr) => acc + (curr.totalBalance || 0), 0);
  const targetReachedCount = accounts.filter((acc) => acc.status === "TARGET_REACHED").length;
  const activeCount = accounts.filter((acc) => acc.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-black text-amber-300 border border-amber-300/30">
                <Sparkles className="w-3.5 h-3.5" /> Program Tabungan Umroh Barokah (DP Rp 2 Jt)
              </span>
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">
              Manajemen Tabungan Umroh & Kuitansi Transparan
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-emerald-100/90 max-w-2xl">
              Pencatatan rekening penabung, penyerahan koper di awal (DP Rp 2 Jt), setoran bertahap, kuitansi digital otomatis, dan konversi ke manifest saat lunas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-400 hover:bg-amber-300 px-5 py-3 text-xs font-black text-slate-950 shadow-lg transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Buka Rekening Penabung Baru
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Dana Tabungan Terhimpun</span>
          <p className="text-2xl font-black text-emerald-700">{formatCurrency(totalSavingsBalance)}</p>
          <p className="text-[11px] text-slate-400">Dari {accounts.length} Akun Penabung Terdaftar</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Penabung Aktif Menabung</span>
          <p className="text-2xl font-black text-slate-900">{activeCount} Penabung</p>
          <p className="text-[11px] text-slate-400">Perlengkapan Koper & Seragam Sudah Diserahkan</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Tercapai / Siap Berangkat</span>
          <p className="text-2xl font-black text-amber-600">{targetReachedCount} Jamaah</p>
          <p className="text-[11px] text-slate-400">Saldo tabungan telah memenuhi harga target paket</p>
        </div>
      </div>

      {/* Toolbar & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama penabung, nomor rekening TAB-xxxx, WA, atau NIK..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Status Tabungan</option>
            <option value="ACTIVE">Sedang Menabung (Aktif)</option>
            <option value="TARGET_REACHED">Target Tercapai (Siap Berangkat)</option>
            <option value="CONVERTED_TO_PILGRIM">Sudah Masuk Manifest Resmi</option>
          </select>
        </div>
      </div>

      {/* Tabel Penabung */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Rekening & Tgl Buka</th>
                <th className="py-3.5 px-4">Identitas Penabung</th>
                <th className="py-3.5 px-4">Target Paket Umroh</th>
                <th className="py-3.5 px-4">Saldo Terkumpul & Progres</th>
                <th className="py-3.5 px-4">Sisa Kekurangan</th>
                <th className="py-3.5 px-4">Koper & Status</th>
                <th className="py-3.5 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Memuat data tabungan umroh...
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada data penabung umroh. Klik tombol "+ Buka Rekening Penabung Baru" untuk memulai.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const percent = Math.min(100, Math.round((acc.totalBalance / acc.targetAmount) * 100));
                  const remaining = Math.max(0, acc.targetAmount - acc.totalBalance);

                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{acc.accountNumber}</span>
                        <span className="text-[10px] text-slate-400">{formatDate(acc.createdAt, "dd/MM/yyyy")}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-black text-slate-900">{acc.fullName}</p>
                        <p className="text-[11px] text-slate-500">📱 {acc.phone} • NIK: {acc.nik}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 line-clamp-1">{acc.targetPackageName}</p>
                        <p className="text-[11px] text-slate-500">Target: {formatCurrency(acc.targetAmount)}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <strong className="text-emerald-700 font-black">{formatCurrency(acc.totalBalance)}</strong>
                            <span className="font-bold text-slate-500">{percent}%</span>
                          </div>
                          <div className="h-2 w-28 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <strong className="text-amber-800 font-black">{formatCurrency(remaining)}</strong>
                      </td>

                      <td className="py-3.5 px-4 space-y-1">
                        <span className="inline-block text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                          🧳 Koper Size {acc.uniformSize}
                        </span>
                        <div>
                          {acc.status === "TARGET_REACHED" ? (
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              Lunas / Siap
                            </span>
                          ) : acc.status === "CONVERTED_TO_PILGRIM" ? (
                            <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                              Masuk Manifest
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              Aktif Nabung
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAccountForDeposit(acc);
                              setDepositAmount(1000000);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Setor
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedAccountForDetail(acc)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg cursor-pointer"
                          >
                            Mutasi ({acc.transactions?.length || 0})
                          </button>

                          {acc.status !== "CONVERTED_TO_PILGRIM" && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAccountForConvert(acc);
                                setConvertPackageId(acc.targetPackageId || packages[0]?.id || "");
                              }}
                              className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] rounded-lg shadow-2xs cursor-pointer"
                            >
                              Konversi 🛫
                            </button>
                          )}
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

      {/* MODAL 1: BUKA REKENING PENABUNG BARU */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-600" />
                Buka Rekening Tabungan Umroh Baru (DP Rp 2 Juta)
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Penabung *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sesuai KTP"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold uppercase bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor WhatsApp Aktif *</label>
                  <input
                    type="tel"
                    required
                    placeholder="082167339464"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">NIK KTP *</label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="16 Digit NIK"
                    value={createForm.nik}
                    onChange={(e) => setCreateForm({ ...createForm, nik: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kota Domisili</label>
                  <input
                    type="text"
                    value={createForm.city}
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Program Paket Umroh</label>
                <select
                  value={createForm.targetPackageId}
                  onChange={(e) => {
                    const pkg = packages.find((p) => p.id === e.target.value);
                    if (pkg) {
                      setCreateForm({
                        ...createForm,
                        targetPackageId: pkg.id,
                        targetPackageName: `${pkg.name} (QUAD)`,
                        targetAmount: pkg.priceQuad || 31500000,
                      });
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 p-2.5 bg-white font-bold text-slate-800"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      🛫 {pkg.name} — {formatCurrency(pkg.priceQuad)} (Kamar Quad)
                    </option>
                  ))}
                  <option value="">Program Estimasi Umum (Rp 31.500.000,-)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ukuran Seragam Batik Koper *</label>
                  <select
                    value={createForm.uniformSize}
                    onChange={(e) => setCreateForm({ ...createForm, uniformSize: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold"
                  >
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="XXXL">XXXL</option>
                    <option value="CUSTOM">Khusus / Custom</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Setoran Awal (DP Koper)</label>
                  <input
                    type="number"
                    value={createForm.initialDeposit}
                    onChange={(e) => setCreateForm({ ...createForm, initialDeposit: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold font-mono bg-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="equip"
                  checked={createForm.equipmentReceived}
                  onChange={(e) => setCreateForm({ ...createForm, equipmentReceived: e.target.checked })}
                  className="rounded text-emerald-600 h-4 w-4"
                />
                <label htmlFor="equip" className="font-bold cursor-pointer">
                  1 Set Perlengkapan Umroh (Koper, Batik, Kain Ihram/Mukena) langsung diserahkan hari ini
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm cursor-pointer"
                >
                  {actionLoading ? "Memproses..." : "Buka Rekening & Terbitkan Kuitansi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INPUT SETORAN CEPAT */}
      {selectedAccountForDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Input Setoran Tabungan</h3>
                <p className="text-[11px] text-slate-500">{selectedAccountForDeposit.fullName} ({selectedAccountForDeposit.accountNumber})</p>
              </div>
              <button onClick={() => setSelectedAccountForDeposit(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeposit} className="space-y-4 text-xs">
              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>Saldo Saat Ini:</span>
                  <strong className="text-emerald-950 font-black">{formatCurrency(selectedAccountForDeposit.totalBalance)}</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Target Paket:</span>
                  <strong className="text-slate-900">{formatCurrency(selectedAccountForDeposit.targetAmount)}</strong>
                </div>
                <div className="flex justify-between text-slate-700 pt-1 border-t border-emerald-200">
                  <span>Sisa Sebelum Setoran:</span>
                  <strong className="text-amber-800 font-black">{formatCurrency(Math.max(0, selectedAccountForDeposit.targetAmount - selectedAccountForDeposit.totalBalance))}</strong>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nominal Setoran Masuk (Rp) *</label>
                <input
                  type="number"
                  required
                  min={10000}
                  step={50000}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-black text-sm text-emerald-800 font-mono bg-white"
                />

                <div className="flex gap-1.5 pt-2">
                  {[500000, 1000000, 2500000, 5000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold"
                    >
                      +{amt / 1000}rb
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulasi Saldo Baru */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Total Saldo Setelah Setor:</span>
                  <strong className="text-emerald-700 font-black">{formatCurrency(selectedAccountForDeposit.totalBalance + depositAmount)}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Sisa Kekurangan Baru:</span>
                  <strong className="text-amber-700 font-black">{formatCurrency(Math.max(0, selectedAccountForDeposit.targetAmount - (selectedAccountForDeposit.totalBalance + depositAmount)))}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Metode Pembayaran</label>
                  <select
                    value={depositMethod}
                    onChange={(e) => setDepositMethod(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 font-bold"
                  >
                    <option value="BANK_TRANSFER">Transfer Bank</option>
                    <option value="CASH">Tunai / Kasir</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Petugas Keuangan</label>
                  <input
                    type="text"
                    value={depositOfficer}
                    onChange={(e) => setDepositOfficer(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedAccountForDeposit(null)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm cursor-pointer"
                >
                  {actionLoading ? "Menyimpan..." : "Simpan & Cetak Kuitansi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RIWAYAT MUTASI LENGKAP PENABUNG */}
      {selectedAccountForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Buku Tabungan & Riwayat Mutasi</h3>
                <p className="text-xs text-slate-500">{selectedAccountForDetail.fullName} • No. Rek: {selectedAccountForDetail.accountNumber}</p>
              </div>
              <button onClick={() => setSelectedAccountForDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {selectedAccountForDetail.transactions?.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Belum ada transaksi</p>
              ) : (
                selectedAccountForDetail.transactions.map((tx: any) => (
                  <div key={tx.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{tx.receiptNumber}</span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                          +{formatCurrency(tx.amount)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {formatDate(tx.transactionDate, "dd MMMM yyyy HH:mm")} • Saldo: {formatCurrency(tx.currentBalance)} • Sisa: {formatCurrency(tx.remainingAmount)}
                      </p>
                      <p className="text-[11px] text-slate-600 italic mt-0.5">{tx.notes}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTxForReceipt({ account: selectedAccountForDetail, tx })}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-[10px] font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3 text-emerald-600" /> Cetak
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAccountForDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: KONVERSI PENABUNG KE MANIFEST RESMI */}
      {selectedAccountForConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Konversi ke Manifest Jamaah</h3>
                <p className="text-xs text-slate-500">{selectedAccountForConvert.fullName}</p>
              </div>
              <button onClick={() => setSelectedAccountForConvert(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConvert} className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-1">
                <p>Total Saldo Tabungan: <strong>{formatCurrency(selectedAccountForConvert.totalBalance)}</strong></p>
                <p className="text-[11px] text-slate-600">
                  Penabung ini akan didaftarkan sebagai Jamaah Sah di tabel Pilgrim dengan status pembayaran sesuai total saldo yang telah disetor.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Paket Keberangkatan Resmi *</label>
                <select
                  value={convertPackageId}
                  onChange={(e) => setConvertPackageId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-bold"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      🛫 {pkg.name} ({formatDate(pkg.departureDate, "dd MMM yyyy")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tipe Kamar</label>
                <select
                  value={convertRoomType}
                  onChange={(e) => setConvertRoomType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-bold"
                >
                  <option value="QUAD">Quad (Sekamar Ber-4)</option>
                  <option value="TRIPLE">Triple (Sekamar Ber-3)</option>
                  <option value="DOUBLE">Double (Sekamar Ber-2)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedAccountForConvert(null)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-md cursor-pointer"
                >
                  {actionLoading ? "Memproses..." : "Konfirmasi Masuk Manifest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: PREVIEW & CETAK KUITANSI DIGITAL RESMI */}
      {selectedTxForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 no-print">
              <span className="text-xs font-black text-slate-900">Kuitansi Setoran Resmi Tabungan</span>
              <button onClick={() => setSelectedTxForReceipt(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Kuitansi Container */}
            <div className="p-6 rounded-2xl border-2 border-slate-900 bg-white text-slate-900 space-y-4 text-xs font-sans">
              <div className="text-center border-b-2 border-slate-900 pb-3 space-y-0.5">
                <h4 className="font-black text-sm uppercase tracking-tight">PT BAROKAH SULTHAN HARAMAIN</h4>
                <p className="text-[10px] text-slate-600 font-bold">IZIN PPIU KEMENAG RI NO. 25052200384080005</p>
                <p className="text-[9px] text-slate-500">Jl. Syekh Beringin Griya Palm Asri, Tebing Tinggi • WA: 0821-6733-9464</p>
                <div className="pt-2">
                  <span className="inline-block px-3 py-0.5 bg-slate-900 text-white font-black text-[10px] rounded tracking-wider uppercase">
                    KUITANSI RESMI SETORAN TABUNGAN UMROH
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">No. Kuitansi:</span>
                  <strong className="font-mono text-slate-900">{selectedTxForReceipt.tx.receiptNumber}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Tanggal Setor:</span>
                  <strong className="text-slate-900">{formatDate(selectedTxForReceipt.tx.transactionDate, "dd/MM/yyyy HH:mm")}</strong>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Penabung:</span>
                  <strong className="text-slate-900">{selectedTxForReceipt.account.fullName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Rek Tabungan:</span>
                  <strong className="font-mono text-slate-900">{selectedTxForReceipt.account.accountNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Paket:</span>
                  <strong className="text-slate-900">{selectedTxForReceipt.account.targetPackageName}</strong>
                </div>
              </div>

              <div className="border-2 border-emerald-600 p-3 rounded-xl bg-emerald-50/50 space-y-2 text-[11px]">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-emerald-950">JUMLAH SETORAN INI:</span>
                  <strong className="font-black text-emerald-900 text-sm">{formatCurrency(selectedTxForReceipt.tx.amount)}</strong>
                </div>
                <div className="border-t border-emerald-200 pt-1 flex justify-between text-slate-700">
                  <span>Total Saldo Terkumpul:</span>
                  <strong className="text-emerald-950">{formatCurrency(selectedTxForReceipt.tx.currentBalance)}</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Sisa Kekurangan Menuju Target:</span>
                  <strong className="text-amber-800">{formatCurrency(selectedTxForReceipt.tx.remainingAmount)}</strong>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 italic text-center">
                * 1 Set Perlengkapan Umroh (Koper, Kain Ihram/Mukena, Batik) telah diserahkan pada setoran awal DP Rp 2.000.000,-.
              </p>

              <div className="pt-3 flex justify-between items-end text-[10px] border-t border-slate-200">
                <div className="text-center">
                  <p className="text-slate-500">Penabung,</p>
                  <p className="font-bold text-slate-900 mt-8">({selectedTxForReceipt.account.fullName})</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500">Petugas Keuangan,</p>
                  <p className="font-black text-slate-900 mt-8">({selectedTxForReceipt.tx.officerName || "Admin Keuangan"})</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Cetak Kuitansi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
