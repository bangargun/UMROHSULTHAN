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
  BookOpen,
  ShieldCheck,
  Smartphone,
  Hotel,
  DollarSign,
  Zap,
  MessageSquare,
  Coins,
  Heart,
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

interface MenuGroup {
  groupTitle: string;
  items: {
    id: string;
    label: string;
    icon: any;
    desc: string;
    badge?: number;
    badgeColor?: string;
  }[];
}

export default function Sidebar({ activeTab, onSelectTab, badgeCounts }: SidebarProps) {
  const menuGroups: MenuGroup[] = [
    {
      groupTitle: "Ikhtisar Utama",
      items: [
        {
          id: "dashboard",
          label: "Dashboard & Analitik",
          icon: LayoutDashboard,
          desc: "Ringkasan metrik & KPI bisnis",
        },
        {
          id: "portal",
          label: "Portal Mandiri Jamaah",
          icon: Smartphone,
          desc: "Doa, Audio Manasik & SOS",
        },
      ],
    },
    {
      groupTitle: "Marketing & Penjualan",
      items: [
        {
          id: "leads",
          label: "Marketing & Pipeline Prospek",
          icon: Users,
          desc: "CRM prospek calon jamaah",
          badge: badgeCounts?.leads,
          badgeColor: "bg-blue-100 text-blue-800",
        },
        {
          id: "savings",
          label: "Tabungan Umroh (DP 2 Jt)",
          icon: Coins,
          desc: "Nabung fleksibel & koper awal",
        },
        {
          id: "badal",
          label: "Badal Umroh",
          icon: Heart,
          desc: "Layanan badal untuk almarhum & uzur",
        },
        {
          id: "faq",
          label: "Playbook & FAQ Closing",
          icon: BookOpen,
          desc: "Skrip closing & SOP komplain",
        },
        {
          id: "agents",
          label: "Jaringan Cabang & Agen",
          icon: Building2,
          desc: "Kantor cabang & mitra referral",
        },
        {
          id: "agent-payouts",
          label: "Komisi & Leaderboard Mitra",
          icon: Award,
          desc: "Pencairan komisi & ranking",
        },
      ],
    },
    {
      groupTitle: "Operasional Jamaah",
      items: [
        {
          id: "pilgrims",
          label: "Database Calon Jamaah",
          icon: UserCheck,
          desc: "Manifest & manifes kamar hotel",
        },
        {
          id: "compliance",
          label: "SISKOPATUH & ID Card QR",
          icon: ShieldCheck,
          desc: "Standar Kemenag & Gelang QR",
        },
        {
          id: "ground",
          label: "Ground Handling Saudi",
          icon: Hotel,
          desc: "Rooming list, Bus & Absensi",
        },
        {
          id: "requirements",
          label: "Ceklis Syarat & Paspor",
          icon: FileCheck2,
          desc: "Verifikasi paspor, visa & vaksin",
          badge: badgeCounts?.pendingDocs,
          badgeColor: "bg-teal-100 text-teal-800",
        },
        {
          id: "letters",
          label: "Generator Surat Resmi",
          icon: FileText,
          desc: "Surat endos, izin & Kemenag",
        },
        {
          id: "handovers",
          label: "Ceklis Serah Terima",
          icon: ClipboardList,
          desc: "Distribusi logistik & TTD digital",
        },
        {
          id: "alumni",
          label: "Riwayat Jamaah & Alumni",
          icon: Award,
          desc: "Arsip kepulangan & CRM alumni",
        },
      ],
    },
    {
      groupTitle: "Keuangan & Akuntansi",
      items: [
        {
          id: "finance",
          label: "Invoicing & Kas Masuk",
          icon: CreditCard,
          desc: "Tagihan DP, pelunasan & kuitansi",
          badge: badgeCounts?.pendingInvoices,
          badgeColor: "bg-amber-100 text-amber-900",
        },
        {
          id: "payment-gateway",
          label: "Virtual Account & Webhook",
          icon: Zap,
          desc: "Auto-reconcile & SAR converter",
        },
        {
          id: "profit-loss",
          label: "Laba Rugi & Jurnal Umum",
          icon: TrendingUp,
          desc: "Laporan laba bersih & HPP paket",
        },
      ],
    },
    {
      groupTitle: "Logistik & Perlengkapan",
      items: [
        {
          id: "logistics",
          label: "Inventaris & Gudang Logistik",
          icon: Boxes,
          desc: "Stok keluar-masuk perlengkapan",
          badge: badgeCounts?.lowStock,
          badgeColor: "bg-rose-100 text-rose-800",
        },
      ],
    },
    {
      groupTitle: "Sistem & Konfigurasi",
      items: [
        {
          id: "wa-gateway",
          label: "WhatsApp Automation",
          icon: MessageSquare,
          desc: "Otomasi notifikasi & reminder",
        },
        {
          id: "master",
          label: "Pusat Data Master",
          icon: Database,
          desc: "Paket, format surat, COA & hotel",
        },
        {
          id: "settings",
          label: "Pengaturan & Hak Akses",
          icon: Settings,
          desc: "Profil PPIU, user & permission",
        },
      ],
    },
  ];

  return (
    <aside className="w-68 flex-shrink-0 border-r border-slate-200 bg-white p-3.5 hidden md:flex flex-col justify-between min-h-[calc(100vh-65px)] no-print overflow-y-auto">
      <div className="space-y-4">
        <nav className="space-y-3.5">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="flex items-center justify-between px-2.5 py-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {group.groupTitle}
                </span>
                <span className="text-[10px] font-medium text-slate-300 font-mono">
                  0{gIdx + 1}
                </span>
              </div>

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full group flex items-center justify-between rounded-xl px-2.5 py-2 text-left transition-all ${
                        isActive
                          ? "bg-emerald-600 text-white font-semibold shadow-xs"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className={`truncate text-xs ${isActive ? "font-bold text-white" : "font-semibold text-slate-900"}`}>
                            {item.label}
                          </p>
                          <p className={`truncate text-[10px] ${isActive ? "text-emerald-100 font-normal" : "text-slate-400 font-normal"}`}>
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      {item.badge !== undefined && item.badge > 0 ? (
                        <span
                          className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                            isActive ? "bg-white text-emerald-900" : item.badgeColor
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : isActive ? (
                        <ChevronRight className="h-3.5 w-3.5 text-emerald-200" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Status Box */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-1 text-left">
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Sistem Operasional PPIU</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            Database Terintegrasi • Zero Mock Policy
          </p>
          <div className="flex items-center gap-1.5 pt-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-700 font-mono">
              Status Server: Aktif Normal
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
