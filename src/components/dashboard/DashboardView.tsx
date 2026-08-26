"use client";

import React from "react";
import {
  Users,
  UserCheck,
  CreditCard,
  AlertTriangle,
  Plane,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Sparkles,
  CheckCircle2,
  FileText,
  Boxes,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusBadge } from "@/lib/utils";

interface DashboardViewProps {
  data: any;
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ data, onNavigate }: DashboardViewProps) {
  const summary = data?.summary || {
    totalLeads: 0,
    totalPilgrims: 0,
    totalRevenue: 0,
    totalPending: 0,
    totalOverdue: 0,
    lowStockCount: 0,
  };

  const upcomingPackages = data?.upcomingPackages || [];
  const recentLeads = data?.recentLeads || [];
  const recentInvoices = data?.recentInvoices || [];
  const lowStockItems = data?.lowStockItems || [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-100 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5" /> Musim Umroh 1447H / 2026M
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Dashboard Manajemen & Penjualan Umroh
            </h2>
            <p className="mt-1 text-sm text-emerald-100/90 max-w-xl">
              Pantau arus prospek marketing, status pelunasan DP & invoice, logistik perlengkapan, serta penerbitan surat jamaah secara real-time.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate("leads")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-900 shadow-sm transition-all hover:bg-emerald-50 hover:shadow"
            >
              <Users className="h-4 w-4 text-emerald-600" />
              + Input Prospek Baru
            </button>
            <button
              onClick={() => onNavigate("handovers")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white border border-emerald-400/40 backdrop-blur-sm transition-all"
            >
              <CheckCircle2 className="h-4 w-4" />
              Ceklis Serah Terima
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Prospek Marketing */}
        <div
          onClick={() => onNavigate("leads")}
          className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <span className="flex items-center text-xs font-semibold text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> Pipeline CRM
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500">Total Prospek / Leads</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{summary.totalLeads} Prospek</h3>
            <p className="text-[11px] text-slate-400 mt-1">Calon jamaah dalam tahap penjajakan</p>
          </div>
        </div>

        {/* Database Jamaah Terdaftar */}
        <div
          onClick={() => onNavigate("pilgrims")}
          className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <span className="flex items-center text-xs font-semibold text-emerald-600">
              Manifest Aktif
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500">Database Jamaah Terdaftar</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{summary.totalPilgrims} Jamaah</h3>
            <p className="text-[11px] text-slate-400 mt-1">Siap berangkat & terdata lengkap</p>
          </div>
        </div>

        {/* Total Pembayaran Masuk */}
        <div
          onClick={() => onNavigate("finance")}
          className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-emerald-600">Kas Masuk</span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500">Total Pembayaran (DP & Lunas)</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">{formatCurrency(summary.totalRevenue)}</h3>
            <p className="text-[11px] text-amber-600 font-medium mt-1">
              Tertunda: {formatCurrency(summary.totalPending)}
            </p>
          </div>
        </div>

        {/* Status Logistik & Stok */}
        <div
          onClick={() => onNavigate("logistics")}
          className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Boxes className="h-5 w-5" />
            </div>
            <span className={`text-xs font-bold ${summary.lowStockCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {summary.lowStockCount > 0 ? `${summary.lowStockCount} Menipis` : "Stok Aman"}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500">Inventaris Perlengkapan</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">7 Jenis Item</h3>
            <p className="text-[11px] text-slate-400 mt-1">Koper, Ihram, Batik & Aksesoris</p>
          </div>
        </div>
      </div>

      {/* Main Row: Upcoming Departure & Recent Leads */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming Packages (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900">Jadwal Keberangkatan Terdekat</h3>
            </div>
            <button
              onClick={() => onNavigate("pilgrims")}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              Lihat Manifest <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {upcomingPackages.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">Belum ada jadwal paket aktif</p>
            ) : (
              upcomingPackages.map((pkg: any) => {
                const bookedPct = Math.round((pkg._count.pilgrims / pkg.quota) * 100);
                return (
                  <div
                    key={pkg.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-slate-50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {pkg.code}
                          </span>
                          <h4 className="text-sm font-bold text-slate-800">{pkg.name}</h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          ✈️ {pkg.airline} • 🏨 {pkg.hotelMakkah}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="inline-block text-xs font-bold text-slate-800">
                          {formatDate(pkg.departureDate, "dd MMM yyyy")}
                        </span>
                        <p className="text-[11px] text-slate-500">Durasi {pkg.durationDays} Hari</p>
                      </div>
                    </div>

                    {/* Progress Bar Kuota */}
                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-medium">
                          Terisi: <strong className="text-slate-900">{pkg._count.pilgrims}</strong> / {pkg.quota} Seat
                        </span>
                      </div>
                      <span className="font-bold text-emerald-600">{bookedPct}% Terisi</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(bookedPct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Prospek Leads Pipeline (1 Col) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-slate-900">Prospek Terbaru</h3>
            </div>
            <button
              onClick={() => onNavigate("leads")}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              Semua <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {recentLeads.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">Belum ada prospek</p>
            ) : (
              recentLeads.map((lead: any) => {
                const badge = getStatusBadge(lead.status);
                return (
                  <div
                    key={lead.id}
                    className="flex items-start justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{lead.name}</p>
                      <p className="text-[11px] text-slate-500">{lead.city || "Kota belum diisi"} • {lead.phone}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Via {lead.source}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text} border ${badge.border}`}>
                      {badge.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Second Row: Invoices & Fast Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Invoices (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-teal-600" />
              <h3 className="font-bold text-slate-900">Tagihan & Invoicing Terkini</h3>
            </div>
            <button
              onClick={() => onNavigate("finance")}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              Lihat Kas & WA Follow Up <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">No Invoice</th>
                  <th className="py-2.5 px-3">Nama Jamaah</th>
                  <th className="py-2.5 px-3">Nominal</th>
                  <th className="py-2.5 px-3">Jatuh Tempo</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInvoices.map((inv: any) => {
                  const badge = getStatusBadge(inv.status);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{inv.pilgrim?.name}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{formatCurrency(inv.amount)}</td>
                      <td className="py-3 px-3 text-slate-500">{formatDate(inv.dueDate, "dd/MM/yyyy")}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text} border ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Tools Shortcuts (1 Col) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 pb-3 border-b border-slate-100">Akses Cepat Dokumen & Ceklis</h3>
            <div className="mt-3 space-y-2">
              <button
                onClick={() => onNavigate("letters")}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200 p-3 text-left hover:border-emerald-300 hover:bg-emerald-50/40 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Cetak Surat Rekomendasi Paspor</p>
                    <p className="text-[10px] text-slate-400">Untuk Kantor Imigrasi</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate("letters")}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200 p-3 text-left hover:border-emerald-300 hover:bg-emerald-50/40 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Cetak Surat Izin Cuti Kerja</p>
                    <p className="text-[10px] text-slate-400">Untuk Perusahaan / Instansi</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate("requirements")}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200 p-3 text-left hover:border-emerald-300 hover:bg-emerald-50/40 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Ceklis Dokumen & Syarat Umroh</p>
                    <p className="text-[10px] text-slate-400">Verifikasi berkas jamaah</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
