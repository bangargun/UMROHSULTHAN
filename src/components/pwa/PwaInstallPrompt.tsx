"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Sparkles, Share2, PlusSquare } from "lucide-react";

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered successfully:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }

    // 2. Check if already installed / running standalone
    if (typeof window !== "undefined") {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);

      if (isStandaloneMode) return; // Don't show if already installed

      // Check if user dismissed prompt recently
      const lastDismissed = localStorage.getItem("pwa_prompt_dismissed");
      if (lastDismissed) {
        const timeDiff = Date.now() - parseInt(lastDismissed, 10);
        // Only show again after 5 days
        if (timeDiff < 5 * 24 * 60 * 60 * 1000) {
          return;
        }
      }

      // Detect iOS Safari
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      const isSafari =
        /safari/.test(userAgent) && !/chrome|crios|crmo/.test(userAgent);
      setIsIOS(isIosDevice && isSafari);

      // 3. Listen for Android / Chrome install prompt
      const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowPrompt(true);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);

      // Listen for custom trigger from app buttons
      const handleCustomTrigger = () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === "accepted") {
              setShowPrompt(false);
            }
            setDeferredPrompt(null);
          });
        } else if (isIosDevice) {
          setShowIOSGuide(true);
        } else {
          alert("Untuk memasang aplikasi: Ketuk titik tiga di pojok kanan atas browser, lalu pilih 'Install Aplikasi' atau 'Tambahkan ke Layar Utama'.");
        }
      };

      window.addEventListener("trigger-pwa-install", handleCustomTrigger);

      // Delayed show for iOS if not dismissed
      if (isIosDevice && isSafari) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        window.removeEventListener("trigger-pwa-install", handleCustomTrigger);
      };
    }
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        console.log("[PWA] User accepted the install prompt");
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem("pwa_prompt_dismissed", Date.now().toString());
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <>
      {/* Floating Bottom PWA Install Banner */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-emerald-500/30 backdrop-blur-md">
          <div className="flex items-start gap-3.5">
            {/* Logo / App Icon */}
            <div className="w-12 h-12 rounded-2xl bg-white p-1 shrink-0 overflow-hidden shadow-md flex items-center justify-center">
              <img
                src="/sulthan-haramain-logo.jpg"
                alt="Sulthan Umroh"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-300/30">
                  📱 Aplikasi Resmi
                </span>
              </div>
              <h4 className="text-sm font-black text-white mt-1 truncate">
                Pasang Aplikasi Sulthan Haramain
              </h4>
              <p className="text-[11px] text-emerald-100/80 line-clamp-2 mt-0.5 leading-snug">
                Akses cepat panduan manasik, doa safar, audio talbiyah, & jadwal ibadah langsung di layar HP Anda.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 py-2 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isIOS ? "Cara Pasang di iPhone" : "Pasang Sekarang (Install)"}
                </button>
                <button
                  onClick={handleDismiss}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div
          onClick={() => setShowIOSGuide(false)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-slate-900 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                Pasang di iPhone / iPad
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <p>
                  Ketuk ikon tombol <strong>Bagikan / Share</strong> (
                  <Share2 className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" />
                  ) di bilah bawah browser Safari Anda.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <p>
                  Gulir ke bawah dan pilih opsi{" "}
                  <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>{" "}
                  (
                  <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 mx-0.5" />
                  ).
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <p>
                  Ketuk <strong>"Tambah" (Add)</strong> di pojok kanan atas. Icon aplikasi Sulthan Umroh akan langsung muncul di layar HP Anda!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
