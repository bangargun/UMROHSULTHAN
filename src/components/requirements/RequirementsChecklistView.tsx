"use client";

import React, { useState } from "react";
import {
  FileCheck2,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  UserCheck,
  Plane,
  AlertCircle,
  CreditCard,
  Boxes,
  FileText,
  Printer,
  Download,
  Shield,
  ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface RequirementsChecklistViewProps {
  pilgrims: any[];
  onRefresh: () => void;
  initialSearchTerm?: string;
  onNavigateTab?: (tab: string, searchFilter?: string) => void;
}

export default function RequirementsChecklistView({
  pilgrims,
  onRefresh,
  initialSearchTerm = "",
  onNavigateTab,
}: RequirementsChecklistViewProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("ALL");
  const [selectedReadiness, setSelectedReadiness] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Extract unique packages
  const packagesMap = new Map();
  pilgrims.forEach((p) => {
    if (p.package && !packagesMap.has(p.package.id)) {
      packagesMap.set(p.package.id, p.package);
    }
  });
  const packages = Array.from(packagesMap.values());

  // Metrics Calculation
  const totalPilgrims = pilgrims.length;
  const readyPilgrims = pilgrims.filter((p) => {
    const reqs = p.requirements || [];
    return reqs.length > 0 && reqs.every((r: any) => r.isVerified);
  }).length;
  const pendingPilgrims = totalPilgrims - readyPilgrims;
  const passportWarnings = pilgrims.filter((p) => {
    if (!p.passportNumber) return true;
    if (!p.passportExpiry) return true;
    const diff = new Date(p.passportExpiry).getTime() - new Date().getTime();
    return diff < 365 * 24 * 60 * 60 * 1000;
  }).length;

  const filteredPilgrims = pilgrims.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nik.includes(searchTerm) ||
      (p.passportNumber && p.passportNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.phone && p.phone.includes(searchTerm));
    
    const matchPackage = selectedPackageId === "ALL" || p.packageId === selectedPackageId;

    const reqs = p.requirements || [];
    const isAllVerified = reqs.length > 0 && reqs.every((r: any) => r.isVerified);
    const matchReadiness =
      selectedReadiness === "ALL" ||
      (selectedReadiness === "READY" && isAllVerified) ||
      (selectedReadiness === "PENDING" && !isAllVerified);

    return matchSearch && matchPackage && matchReadiness;
  });

  const handleToggleRequirement = async (reqId: string, isSubmitted: boolean, isVerified: boolean) => {
    setUpdatingId(reqId);
    try {
      await fetch("/api/requirements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reqId,
          isSubmitted,
          isVerified,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportCSV = () => {
    const headers = "No,Nama Jamaah,NIK,No Paspor,Status Paspor,Paket Keberangkatan,Syarat Terverifikasi,Status Dokumen\n";
    const rows = filteredPilgrims
      .map((p, idx) => {
        const reqs = p.requirements || [];
        const verified = reqs.filter((r: any) => r.isVerified).length;
        const total = reqs.length;
        const isReady = total > 0 && verified === total;
        return `"${idx + 1}","${p.name}","${p.nik}","${p.passportNumber || "Belum Ada"}","${p.passportExpiry ? formatDate(p.passportExpiry, "yyyy-MM-dd") : "-"}","${p.package?.name}","${verified}/${total}","${isReady ? "SIAP TERBANG" : "BELUM LENGKAP"}"`;
      })
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Manifest_Kesiapan_Dokumen_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="h-6 w-6 text-emerald-600" />
            Pusat Kesiapan Dokumen Keberangkatan & Handling Bandara
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Checklist 8 dokumen wajib keberangkatan umroh (Paspor, E-Visa MoFA, Vaksin ICV, Tiket PP, Voucher Hotel BRN, Asuransi).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Clearance CSV
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all no-print"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Checklist Bandara
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Jamaah Rombongan</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalPilgrims} Pax</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Seluruh kloter terdaftar</p>
        </div>

        <div className="rounded-2xl bg-emerald-50/70 p-4 border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Dokumen Siap Terbang (100%)
          </span>
          <p className="text-2xl font-black text-emerald-950 mt-1">{readyPilgrims} Pax</p>
          <p className="text-[10px] text-emerald-700 mt-0.5">Lengkap & terverifikasi sah</p>
        </div>

        <div className="rounded-2xl bg-amber-50/70 p-4 border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            Dalam Proses Verifikasi
          </span>
          <p className="text-2xl font-black text-amber-950 mt-1">{pendingPilgrims} Pax</p>
          <p className="text-[10px] text-amber-700 mt-0.5">Menunggu penyerahan/sah</p>
        </div>

        <div className="rounded-2xl bg-rose-50/70 p-4 border border-rose-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Perhatian Paspor / Visa
          </span>
          <p className="text-2xl font-black text-rose-950 mt-1">{passportWarnings} Pax</p>
          <p className="text-[10px] text-rose-700 mt-0.5">Belum ada / Exp &lt; 1 tahun</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama jamaah, NIK, atau nomor paspor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="w-full md:w-64">
          <select
            value={selectedPackageId}
            onChange={(e) => setSelectedPackageId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">Semua Paket & Kloter</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} ({formatDate(pkg.departureDate, "dd MMM yyyy")})
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-52">
          <select
            value={selectedReadiness}
            onChange={(e) => setSelectedReadiness(e.target.value)}
            className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
          >
            <option value="ALL">Semua Kesiapan Dokumen</option>
            <option value="READY">✅ Siap Terbang (100%)</option>
            <option value="PENDING">⏳ Belum Lengkap</option>
          </select>
        </div>
      </div>

      {/* Pilgrim Requirements Matrix Cards */}
      <div className="space-y-4">
        {filteredPilgrims.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <FileCheck2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada data jamaah ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter paket.</p>
          </div>
        ) : (
          filteredPilgrims.map((pilgrim) => {
            const reqs = pilgrim.requirements || [];
            const verifiedCount = reqs.filter((r: any) => r.isVerified).length;
            const isReady = reqs.length > 0 && verifiedCount === reqs.length;
            const progress = Math.round((verifiedCount / (reqs.length || 1)) * 100);

            const expDiffDays = pilgrim.passportExpiry
              ? Math.ceil((new Date(pilgrim.passportExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <div
                key={pilgrim.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all space-y-4 ${
                  isReady
                    ? "border-emerald-200 ring-1 ring-emerald-400/20"
                    : "border-slate-200/80 hover:border-slate-300"
                }`}
              >
                {/* Header Jamaah & Quick Status */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">{pilgrim.name}</h3>
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-bold">
                        NIK: {pilgrim.nik}
                      </span>
                      {isReady ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          ✈️ SIAP TERBANG (100% CLEAR)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          ⏳ PROSES DOKUMEN ({progress}%)
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>
                        Paket: <strong className="text-emerald-800">{pilgrim.package?.name}</strong> (🛫 {formatDate(pilgrim.package?.departureDate, "dd MMM yyyy")})
                      </span>
                      <span>•</span>
                      <span>
                        Paspor:{" "}
                        {pilgrim.passportNumber ? (
                          <strong className="text-slate-800 font-mono">{pilgrim.passportNumber}</strong>
                        ) : (
                          <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Belum Ada Paspor
                          </span>
                        )}
                        {expDiffDays !== null && expDiffDays <= 0 && (
                          <span className="ml-1 text-[10px] text-rose-800 font-bold bg-rose-100 px-1.5 py-0.2 rounded border border-rose-300">
                            ⛔ Kadaluarsa
                          </span>
                        )}
                        {expDiffDays !== null && expDiffDays > 0 && expDiffDays <= 180 && (
                          <span className="ml-1 text-[10px] text-rose-800 font-bold bg-rose-100 px-1.5 py-0.2 rounded border border-rose-300 animate-pulse">
                            ⛔ Exp &lt; 6 Bln ({expDiffDays} hr)
                          </span>
                        )}
                        {expDiffDays !== null && expDiffDays > 180 && expDiffDays <= 365 && (
                          <span className="ml-1 text-[10px] text-amber-900 font-bold bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                            ⚠️ Saran Perpanjang (&lt; 1 Thn)
                          </span>
                        )}
                      </span>
                      <span>•</span>
                      <span>
                        Visa:{" "}
                        {pilgrim.visaNumber ? (
                          <strong className="text-emerald-800 font-mono">MoFA #{pilgrim.visaNumber}</strong>
                        ) : (
                          <span className="text-slate-400 font-medium">Belum Terbit</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Kelengkapan Progress & Integrasi Tombol Cepat */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-bold text-slate-700">
                        Kelengkapan: <strong className="text-emerald-700">{verifiedCount} / {reqs.length}</strong> Syarat
                      </span>
                      <div className="w-32 bg-slate-100 h-2.5 rounded-full overflow-hidden mt-1 sm:ml-auto border border-slate-200/50">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isReady ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Integrated Cross-Page Navigation Quick Actions */}
                    {onNavigateTab && (
                      <div className="flex items-center gap-1.5 pt-1 sm:pt-0">
                        <button
                          onClick={() => onNavigateTab("finance", pilgrim.name)}
                          className="p-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-all"
                          title="Cek Pelunasan & Tagihan Invoice"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onNavigateTab("handovers", pilgrim.name)}
                          className="p-2 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-all"
                          title="Ceklis Serah Terima Koper & Perlengkapan"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onNavigateTab("letters", pilgrim.name)}
                          className="p-2 rounded-xl bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-all"
                          title="Buat Surat Rekomendasi Kemenag / Imigrasi"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onNavigateTab("pilgrims", pilgrim.name)}
                          className="p-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-bold transition-all"
                          title="Buka Data Induk Calon Jamaah"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Requirements Grid Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {reqs.map((req: any) => {
                    const isVer = req.isVerified;
                    const isSub = req.isSubmitted;

                    return (
                      <div
                        key={req.id}
                        className={`p-3 rounded-xl border text-xs flex flex-col justify-between space-y-2 transition-all ${
                          isVer
                            ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                            : isSub
                            ? "bg-amber-50/50 border-amber-200 text-amber-950"
                            : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <p className="font-bold text-xs">{req.name}</p>
                            {isVer ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            ) : isSub ? (
                              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {isVer
                              ? `Verifikasi: ${formatDate(req.verifiedAt, "dd/MM/yyyy")}`
                              : isSub
                              ? "Berkas fisik/foto telah diserahkan ke travel"
                              : "Belum diserahkan ke kantor travel"}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60">
                          <button
                            disabled={updatingId === req.id}
                            onClick={() => handleToggleRequirement(req.id, !isSub, isVer && !isSub ? false : isVer)}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              isSub
                                ? "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                                : "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
                            }`}
                          >
                            {isSub ? "Batal Serah" : "+ Tandai Diserahkan"}
                          </button>

                          <button
                            disabled={updatingId === req.id}
                            onClick={() => handleToggleRequirement(req.id, true, !isVer)}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                              isVer
                                ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            }`}
                          >
                            {isVer ? "Batal Verifikasi" : "✓ Verifikasi Sah"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

