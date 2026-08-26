"use client";

import React from "react";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CreditCard,
  Package,
  FileCheck2,
  FileText,
  Boxes,
  ClipboardList,
  ChevronRight,
  Plane,
  Database,
  TrendingUp,
  Building2,
  Award,
  Settings,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  badgeCounts?: {
    leads?: number;
    pendingInvoices?: number;
    pendingDocs?: number;
    lowStock?: number;
  };
}

export default function Sidebar({ activeTab, onSelectTab, badgeCounts }: SidebarProps) {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard & Analitik",
      icon: LayoutDashboard,
      desc: "Ringkasan metrik & KPI",
    },
    {
      id: "leads",
      label: "Marketing & Pencarian",
      icon: Users,
      desc: "Pipeline prospek jamaah",
      badge: badgeCounts?.leads,
      badgeColor: "bg-blue-100 text-blue-700",
    },
    {
      id: "pilgrims",
      label: "Database Calon Jamaah",
      icon: UserCheck,
      desc: "Manifest & persiapan berangkat",
    },
    {
      id: "alumni",
      label: "Jamaah Berangkat / Alumni",
      icon: Award,
      desc: "Riwayat keberangkatan & alumni",
    },
    {
      id: "finance",
      label: "Invoicing & Kas Masuk",
      icon: CreditCard,
      desc: "DP, Pelunasan & WA Follow Up",
      badge: badgeCounts?.pendingInvoices,
      badgeColor: "bg-amber-100 text-amber-800",
    },
    {
      id: "profit-loss",
      label: "Laba Rugi & Keuangan",
      icon: TrendingUp,
      desc: "Pendapatan, HPP & Laba Bersih",
    },
    {
      id: "logistics",
      label: "Inventaris Logistik",
      icon: Boxes,
      desc: "Stok keluar-masuk perlengkapan",
      badge: badgeCounts?.lowStock,
      badgeColor: "bg-rose-100 text-rose-700",
    },
    {
      id: "handovers",
      label: "Ceklis Serah Terima",
      icon: ClipboardList,
      desc: "Form logistik + Tanda Tangan",
    },
    {
      id: "requirements",
      label: "Ceklis Syarat Umroh",
      icon: FileCheck2,
      desc: "Paspor, vaksin, buku nikah",
      badge: badgeCounts?.pendingDocs,
      badgeColor: "bg-teal-100 text-teal-800",
    },
    {
      id: "letters",
      label: "Generator Surat Resmi",
      icon: FileText,
      desc: "Izin cuti, paspor & Kemenag",
    },
    {
      id: "agents",
      label: "Cabang & Agen Freelance",
      icon: Building2,
      desc: "Referral & pendaftaran online",
    },
    {
      id: "master",
      label: "Pusat Data Master",
      icon: Database,
      desc: "Paket, barang, syarat, PPIU",
    },
    {
      id: "settings",
      label: "Pengaturan & Hak Akses",
      icon: Settings,
      desc: "User & permission matriks",
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white p-4 hidden md:flex flex-col justify-between min-h-[calc(100vh-65px)] no-print">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Menu Operasional
          </p>
          <nav className="mt-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full group flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-800 font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                        isActive
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">{item.label}</p>
                      <p className="truncate text-[10px] text-slate-400 font-normal">{item.desc}</p>
                    </div>
                  </div>

                  {item.badge !== undefined && item.badge > 0 ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  ) : isActive ? (
                    <ChevronRight className="h-3.5 w-3.5 text-emerald-600" />
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Info Card */}
      <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50/40 p-3.5">
        <div className="flex items-center gap-2 mb-1.5">
          <Plane className="h-4 w-4 text-emerald-600" />
          <p className="text-xs font-bold text-emerald-900">Keberangkatan Terdekat</p>
        </div>
        <p className="text-xs font-semibold text-slate-700">Paket Ramadhan 1447H</p>
        <p className="text-[11px] text-slate-500">15 September 2026 (28 Pax)</p>
      </div>
    </aside>
  );
}
