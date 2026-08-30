"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Coins,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  FileSpreadsheet,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Gift,
  Building,
  Phone,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

function TabunganStatusContent() {
  const searchParams = useSearchParams();
  const initialAcc = searchParams?.get("acc") || "";

  const [query, setQuery] = useState(initialAcc);
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState<any | null>(null);
  const [selectedTxForPrint, setSelectedTxForPrint] = useState<any | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/savings/status?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Rekening tabungan tidak ditemukan");
        setAccount(null);
        return;
      }
      setAccount(data);
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mencari rekening");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialAcc) {
      handleSearch();
    }
  }, [initialAcc]);

  const percent = account
    ? Math.min(100, Math.round((account.totalBalance / account.targetAmount) * 100))
    : 0;

  const remaining = account
    ? Math.max(0, account.targetAmount - account.totalBalance)
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 font-sans pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white py-10 px-4 border-b border-emerald-800/30 no-print">
        <div className="max-w-3xl mx-auto space-y-3">
          <Link
            href="/tabungan"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200 font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Info Tabungan
          </Link>
          <h1 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Coins className="w-7 h-7 text-amber-400" />
            Portal Cek Saldo Tabungan Umroh Barokah
          </h1>
          <p className="text-xs text-emerald-200/80">
            Pantau progres saldo tabungan Anda dan unduh kuitansi resmi setoran secara transparan.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Masukkan Nomor Rekening (TAB-xxxx), No. WhatsApp, atau NIK..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
            >
              {loading ? "Mencari..." : "Cek Saldo"}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-4 space-y-6">
        {account && (
          <>
            {/* Saldo & Progress Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 no-print">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-md">
                      {account.accountNumber}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      {account.status === "TARGET_REACHED" ? "🎉 Target Tercapai" : "Sedang Menabung"}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1.5">
                    {account.fullName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    📱 {account.phone} • NIK: {account.nik} • 📍 {account.city || "Tebing Tinggi"}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-400 font-bold block">Target Program Paket:</span>
                  <span className="text-xs font-black text-slate-900 block">
                    {account.targetPackageName}
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    Target: {formatCurrency(account.targetAmount)}
                  </span>
                </div>
              </div>

              {/* Progress Bar Ketercapaian */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600">Progres Ketercapaian Dana:</span>
                  <span className="text-emerald-700 font-black text-sm">{percent}%</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000 shadow-sm"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total Saldo Masuk</span>
                  <p className="text-lg font-black text-emerald-950 mt-0.5">
                    {formatCurrency(account.totalBalance)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">Sisa Menuju Target</span>
                  <p className="text-lg font-black text-amber-950 mt-0.5">
                    {formatCurrency(remaining)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-600 uppercase block">Status Perlengkapan</span>
                  <p className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1">
                    🧳 Koper Size {account.uniformSize} (Diterima)
                  </p>
                </div>
              </div>
            </div>

            {/* Riwayat Setoran & Kuitansi */}
            <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 no-print">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Riwayat Setoran & Kuitansi Digital Resmi
              </h3>

              <div className="divide-y divide-slate-100">
                {account.transactions?.map((tx: any) => (
                  <div key={tx.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{tx.receiptNumber}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          Lunas Masuk
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {formatDate(tx.transactionDate, "dd MMMM yyyy HH:mm")} • Petugas: {tx.officerName || "Admin Keuangan"}
                      </p>
                      <p className="text-slate-600 italic mt-0.5">{tx.notes}</p>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="font-black text-emerald-700 text-sm">
                        +{formatCurrency(tx.amount)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedTxForPrint(tx)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl border border-slate-300 text-slate-700 font-bold text-[10px] hover:bg-slate-50 cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-3 h-3 text-emerald-600" /> Cetak Kuitansi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal / Cetak Kuitansi Digital */}
            {selectedTxForPrint && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 no-print">
                    <span className="text-xs font-black text-slate-900">Preview Kuitansi Resmi</span>
                    <button
                      onClick={() => setSelectedTxForPrint(null)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      Tutup [X]
                    </button>
                  </div>

                  {/* Kuitansi Container */}
                  <div className="p-6 rounded-2xl border-2 border-slate-900 bg-white text-slate-900 space-y-4 text-xs font-sans">
                    {/* Header Travel */}
                    <div className="text-center border-b-2 border-slate-900 pb-3 space-y-0.5">
                      <h4 className="font-black text-sm uppercase tracking-tight">PT BAROKAH SULTHAN HARAMAIN</h4>
                      <p className="text-[10px] text-slate-600 font-bold">IZIN PPIU KEMENAG RI NO. 25052200384080005</p>
                      <p className="text-[9px] text-slate-500">Jl. Syekh Beringin Griya Palm Asri, Tebing Tinggi • WA: 0821-6733-9464</p>
                      <div className="pt-2">
                        <span className="inline-block px-3 py-0.5 bg-slate-900 text-white font-black text-[10px] rounded tracking-wider uppercase">
                          KUITANSI SETORAN TABUNGAN UMROH
                        </span>
                      </div>
                    </div>

                    {/* Metadata Kuitansi */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">No. Kuitansi:</span>
                        <strong className="font-mono text-slate-900">{selectedTxForPrint.receiptNumber}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block">Tanggal Setor:</span>
                        <strong className="text-slate-900">{formatDate(selectedTxForPrint.transactionDate, "dd/MM/yyyy HH:mm")}</strong>
                      </div>
                    </div>

                    {/* Identitas Penabung */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nama Penabung:</span>
                        <strong className="text-slate-900">{account.fullName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">No. Rek Tabungan:</span>
                        <strong className="font-mono text-slate-900">{account.accountNumber}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Target Paket:</span>
                        <strong className="text-slate-900">{account.targetPackageName}</strong>
                      </div>
                    </div>

                    {/* Rincian Finansial Transparan */}
                    <div className="border-2 border-emerald-600 p-3 rounded-xl bg-emerald-50/50 space-y-2 text-[11px]">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-emerald-950">JUMLAH SETORAN INI:</span>
                        <strong className="font-black text-emerald-900 text-sm">{formatCurrency(selectedTxForPrint.amount)}</strong>
                      </div>
                      <div className="border-t border-emerald-200 pt-1 flex justify-between text-slate-700">
                        <span>Total Saldo Terkumpul:</span>
                        <strong className="text-emerald-950">{formatCurrency(selectedTxForPrint.currentBalance)}</strong>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Sisa Kekurangan Menuju Target:</span>
                        <strong className="text-amber-800">{formatCurrency(selectedTxForPrint.remainingAmount)}</strong>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 italic text-center">
                      * Perlengkapan koper, kain ihram/mukena, dan batik travel resmi telah diserahkan pada saat setoran awal.
                    </p>

                    {/* TTD & Cap */}
                    <div className="pt-3 flex justify-between items-end text-[10px] border-t border-slate-200">
                      <div className="text-center">
                        <p className="text-slate-500">Penabung,</p>
                        <p className="font-bold text-slate-900 mt-8">({account.fullName})</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500">Petugas Keuangan,</p>
                        <p className="font-black text-slate-900 mt-8">({selectedTxForPrint.officerName || "Admin Keuangan"})</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 no-print">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> Cetak / Simpan PDF
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function TabunganStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-12 text-xs">Memuat Portal Tabungan...</div>}>
      <TabunganStatusContent />
    </Suspense>
  );
}
