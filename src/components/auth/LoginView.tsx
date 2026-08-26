"use client";

import React, { useState } from "react";
import {
  Lock,
  User,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Building2,
  Plane,
} from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        // Save session to localStorage
        localStorage.setItem("sulthan_auth_user", JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.error || "Username atau password salah.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menghubungi server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSuperadmin = () => {
    setUsername("master");
    setPassword("1234");
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Islamic Geometric Ambient Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-white p-1.5 shadow-lg border border-slate-700 flex items-center justify-center">
            <img
              src="/sulthan-haramain-logo.jpg"
              alt="Logo Sulthan Haramain"
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-amber-400" /> SULTHAN HARAMAIN TRAVEL
            </div>
            <h2 className="text-xl font-black text-white tracking-tight mt-1.5">
              Papan Masuk Web Admin
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sistem Terpadu Manifest, Akuntansi, Logistik & PPIU
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Gagal Masuk</p>
              <p className="text-[11px] text-rose-300/80 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              Username Pengguna *
            </label>
            <div className="relative mt-1.5">
              <input
                type="text"
                required
                placeholder="Masukkan username (e.g. master)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl bg-slate-800/90 border border-slate-700 p-3 text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Kata Sandi (Password) *
            </label>
            <div className="relative mt-1.5">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-slate-800/90 border border-slate-700 p-3 text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi Akun...
              </>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Superadmin Access Box */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/60 flex items-center justify-between">
            <div className="text-[11px]">
              <p className="font-bold text-slate-300 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Kredensial Superadmin:
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Username: <strong className="text-amber-300">master</strong> • Password: <strong className="text-amber-300">1234</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={handleQuickSuperadmin}
              className="px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30 transition-all"
            >
              Autofill
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Hak Akses Penuh: Superadmin, Operasional, Finance & Marketing</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <p className="mt-6 text-center text-xs text-slate-600">
        © 2026 PT Sulthan Haramain Tour & Travel • All Rights Reserved
      </p>
    </div>
  );
}
