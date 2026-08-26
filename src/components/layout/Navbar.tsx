"use client";

import React from "react";
import { Sparkles, ShieldCheck, LogOut, KeyRound } from "lucide-react";

interface NavbarProps {
  activeTab?: string;
  currentUser?: any;
  onLogout?: () => void;
}

export default function Navbar({ activeTab, currentUser, onLogout }: NavbarProps) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return { label: "Superadmin (Akses Penuh)", bg: "bg-amber-100 text-amber-900 border-amber-300" };
      case "ADMIN_OPERASIONAL":
        return { label: "Admin Operasional", bg: "bg-blue-100 text-blue-900 border-blue-300" };
      case "ADMIN_FINANCE":
        return { label: "Admin Keuangan", bg: "bg-emerald-100 text-emerald-900 border-emerald-300" };
      case "ADMIN_MARKETING":
        return { label: "Admin Marketing", bg: "bg-purple-100 text-purple-900 border-purple-300" };
      default:
        return { label: role || "Staf Travel", bg: "bg-slate-100 text-slate-900 border-slate-300" };
    }
  };

  const roleInfo = getRoleBadge(currentUser?.role || "SUPERADMIN");

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur px-4 lg:px-8 py-3.5 shadow-sm no-print">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
          <img
            src="/sulthan-haramain-logo.jpg"
            alt="Sulthan Haramain Logo"
            className="h-full w-full object-contain p-0.5"
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black tracking-tight text-slate-900">
              SULTHAN <span className="text-amber-600">HARAMAIN</span>
            </h1>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200/80">
              <Sparkles className="w-3 h-3 mr-1 text-amber-500" /> TOUR & TRAVEL
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Biro Perjalanan Ibadah Umroh & Haji Khusus</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Status System Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Sistem Terverifikasi PPIU</span>
        </div>

        {/* User profile avatar & Role Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-300 flex items-center justify-center text-white font-black text-xs shadow-xs">
            {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : "MA"}
          </div>
          <div className="hidden md:block text-left">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-slate-900">{currentUser?.name || "Master Superadmin"}</p>
              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${roleInfo.bg}`}>
                {roleInfo.label}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">@{currentUser?.username || "master"}</p>
          </div>

          {onLogout && (
            <button
              onClick={() => {
                if (confirm("Apakah Anda yakin ingin keluar / logout dari sistem?")) {
                  onLogout();
                }
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all ml-1"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
