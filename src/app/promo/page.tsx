"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plane,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Phone,
  ArrowRight,
  Clock,
  Building,
  Hotel,
  Calendar,
  Gift,
  Coins,
  FileCheck,
  Tag,
  Check,
  Flame,
  Award,
  AlertCircle,
  HelpCircle,
  HeartHandshake,
  HeartCrack,
  Smile,
  Compass,
  MapPin,
  Users,
  BadgePercent,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PromoSeptemberPage() {
  const [septemberPackage, setSeptemberPackage] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    nik: "",
    gender: "MALE",
    city: "Tebing Tinggi",
    address: "",
    roomType: "QUAD",
    uniformSize: "L",
    umrahExperienceCount: "BELUM_PERNAH",
    isPreviousClient: "TIDAK",
    previousPackageName: "",
    chronicDiseases: [] as string[],
    customChronicDisease: "",
    wheelchairAssistance: false,
    wheelchairNotes: "Bawa kursi roda sendiri",
    ktpBase64: "",
    transferProofBase64: "",
    notes: "",
  });

  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const loadPackageData = async () => {
    try {
      const res = await fetch("/api/packages");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const sept = data.find(
            (p: any) =>
              p.code === "UMR-5734" ||
              p.name.toUpperCase().includes("SEPTEMBER") ||
              new Date(p.departureDate).getMonth() === 8
          );
          if (sept) {
            setSeptemberPackage(sept);
          } else if (data.length > 0) {
            setSeptemberPackage(data[0]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load package:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackageData();
  }, []);

  const handleKtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setKtpPreview(b64);
      setFormData((prev) => ({ ...prev, ktpBase64: b64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setProofPreview(b64);
      setFormData((prev) => ({ ...prev, transferProofBase64: b64 }));
    };
    reader.readAsDataURL(file);
  };

  // Pricing Matrix Promo vs Normal (100% Dinamis dari Database)
  const promoPriceQuad = septemberPackage?.priceQuad || 28700000;
  const normalPriceQuad = promoPriceQuad + 4000000;

  const promoPriceTriple = septemberPackage?.priceTriple || 32700000;
  const normalPriceTriple = promoPriceTriple + 4000000;

  const promoPriceDouble = septemberPackage?.priceDouble || 37700000;
  const normalPriceDouble = promoPriceDouble + 4000000;

  const getSelectedPromoPrice = () => {
    if (formData.roomType === "TRIPLE") return promoPriceTriple;
    if (formData.roomType === "DOUBLE") return promoPriceDouble;
    return promoPriceQuad;
  };

  const getSelectedNormalPrice = () => {
    if (formData.roomType === "TRIPLE") return normalPriceTriple;
    if (formData.roomType === "DOUBLE") return normalPriceDouble;
    return normalPriceQuad;
  };

  const remainingQuota = septemberPackage
    ? Math.max(0, septemberPackage.quota - septemberPackage.bookedCount)
    : 17;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedDiseases = formData.chronicDiseases.includes("LAINNYA") && formData.customChronicDisease
        ? [...formData.chronicDiseases.filter((d) => d !== "LAINNYA"), formData.customChronicDisease]
        : formData.chronicDiseases;

      const previousPkg =
        formData.isPreviousClient === "YA"
          ? formData.previousPackageName
          : null;

      const payload = {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        nik: formData.nik,
        gender: formData.gender,
        city: formData.city,
        address: formData.address,
        packageId: septemberPackage?.id,
        roomType: formData.roomType,
        pricePackage: getSelectedPromoPrice(),
        dpAmount: 5000000,
        uniformSize: formData.uniformSize,
        chronicDiseases: selectedDiseases.length > 0 ? selectedDiseases.join(", ") : "Tidak Ada (Sehat)",
        wheelchairAssistance: formData.wheelchairAssistance,
        wheelchairNotes: formData.wheelchairAssistance ? formData.wheelchairNotes : null,
        umrahExperienceCount: formData.umrahExperienceCount,
        isPreviousClient: formData.isPreviousClient === "YA",
        previousPackageName: previousPkg,
        channel: "PROMO_CAMPAIGN",
        ktpBase64: formData.ktpBase64,
        notes: `[PROMO SPESIAL SEPTEMBER 2026 - DISKON RP 4 JUTA] Harga Promo: ${formatCurrency(getSelectedPromoPrice())} (Normal: ${formatCurrency(getSelectedNormalPrice())}). DP Kunci Seat Rp 5.000.000,-. Sisa pelunasan saat keberangkatan.`,
      };

      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal mengirim formulir pendaftaran promo");
        setSubmitting(false);
        return;
      }

      setSubmitSuccess(data.registration);
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi saat mengirim formulir");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 font-sans pb-24 selection:bg-amber-400 selection:text-slate-950">
      {/* 1. TOP URGENT RIBBON */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 py-2.5 px-4 text-center font-black text-xs tracking-wide shadow-md flex items-center justify-center gap-2 sticky top-0 z-50">
        <Flame className="w-4 h-4 text-red-600 animate-bounce shrink-0" />
        <span>PROMO SPESIAL AKBAR SEPTEMBER 2026 • SISA {remainingQuota} SEAT LAGI!</span>
        <span className="hidden sm:inline bg-slate-950 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-mono">
          DISKON RP 4.000.000,-
        </span>
      </div>

      {/* 2. HERO SECTION (EMOTIONAL & EXCLUSIVE OFFER) */}
      <div className="relative bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 text-white py-16 px-4 border-b border-emerald-800/30 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/80 border border-emerald-400/40 text-emerald-300 text-xs font-black shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400" />
            PT BAROKAH SULTHAN HARAMAIN • Izin Resmi PPIU Kemenag RI
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase text-white leading-tight">
            Rindukah Anda Meneteskan Air Mata<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">
              Di Depan Ka'bah?
            </span>
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
            Kini saatnya menjawab panggilan Baitullah tanpa rasa cemas. Nikmati <strong>Promo Spesial Akbar September 2026</strong> dengan diskon langsung <strong>Rp 4.000.000,-</strong> dan kemudahan bayar yang sangat ringan!
          </p>

          {/* Pricing Highlight Card */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-amber-400/50 shadow-2xl text-center">
              <span className="text-xs text-slate-400 block line-through font-mono font-bold">
                Harga Normal: {formatCurrency(normalPriceQuad)}
              </span>
              <div className="flex items-baseline justify-center gap-2 mt-1">
                <span className="text-xs font-bold text-amber-300">Promo Menjadi:</span>
                <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">
                  {formatCurrency(promoPriceQuad)}
                </span>
              </div>
              <span className="inline-block mt-2 px-3 py-1 bg-red-600 text-white font-black text-xs rounded-full uppercase shadow-xs">
                🔥 Hemat Rp 4.000.000,- / Pax
              </span>
            </div>

            {/* Skema DP Hook */}
            <div className="bg-emerald-900/70 backdrop-blur-md p-6 rounded-3xl border border-emerald-400/30 text-left space-y-2 max-w-sm">
              <div className="flex items-center gap-2 text-emerald-300 font-black text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                KEMUDAHAN SKEMA PEMBAYARAN:
              </div>
              <p className="text-xs text-slate-200">
                ✅ <strong>Cukup DP Rp 5.000.000,-</strong> untuk mengunci seat pesawat & harga promo diskon 4 juta hari ini.
              </p>
              <p className="text-xs text-amber-300 font-bold">
                ✅ <strong>Sisa Pelunasan ({formatCurrency(promoPriceQuad - 5000000)})</strong> dapat dilunasi menjelang keberangkatan umroh!
              </p>
            </div>
          </div>

          <div className="pt-2">
            <a
              href="#form-daftar"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-xl transition-all hover:scale-105"
            >
              <Sparkles className="w-5 h-5" /> Amankan Kursi Promo {formatCurrency(promoPriceQuad)} Sekarang
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6 space-y-10 relative z-20">
        {/* 3. SEKSI STORY TELLING: MASALAH (THE PAIN POINTS) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-[11px] font-black uppercase">
              <HeartCrack className="w-3.5 h-3.5 text-red-600" />
              Apakah Ini yang Sedang Anda Rasakan?
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Niat Sudah Kuat ke Baitullah, Namun Sering Terbentur Kendala Ini:
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-black text-lg">
                💸
              </div>
              <h3 className="font-black text-slate-900 text-sm">Biaya Melambung Tinggi</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Banyak paket umroh saat ini mencapai Rp 33 – 36 Juta per jamaah, membuat impian beribadah bersama keluarga tertunda berkali-kali.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-lg">
                ⌛
              </div>
              <h3 className="font-black text-slate-900 text-sm">Harus Bayar Lunas di Muka</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Banyak travel mewajibkan pembayaran puluhan juta secara tunai di awal pendaftaran, sangat memberatkan jika belum ada dana cair saat ini.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-black text-lg">
                😟
              </div>
              <h3 className="font-black text-slate-900 text-sm">Khawatir Fasilitas & Jadwal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Takut hotel terlalu jauh dari masjid, penerbangan transit melelahkan, atau pembimbing ibadah yang kurang ramah dan tidak membimbing dengan sabar.
              </p>
            </div>
          </div>
        </div>

        {/* 4. SEKSI STORY TELLING: SOLUSI (PT BAROKAH SULTHAN HARAMAIN) */}
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/30 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-black uppercase">
              <Smile className="w-3.5 h-3.5 text-emerald-400" />
              Solusi Penuh Berkah & Ketenangan
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white">
              Sulthan Haramain Hadir Mewujudkan Impian Ibadah Anda Nyaman & Aman!
            </h2>
            <p className="text-xs text-emerald-200/80">
              Kami merancang Program Khusus September 2026 agar setiap keluarga muslim dapat beribadah khusyuk tanpa beban finansial.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm">
                1
              </div>
              <h3 className="font-black text-amber-300 text-sm">Potongan Nyata Rp 4 Juta</h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                Harga terbaik <strong>{formatCurrency(promoPriceQuad)}</strong> tanpa mengurangi kenyamanan hotel, maskapai, maupun konsumsi makanan khas Indonesia.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-400 text-slate-950 flex items-center justify-center font-black text-sm">
                2
              </div>
              <h3 className="font-black text-emerald-300 text-sm">Cukup DP 5 Juta Dulu</h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                Seat pesawat dan hotel Anda sudah terkunci aman. Sisa pelunasan bisa dibayarkan santai menjelang jadwal keberangkatan.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-400 text-slate-950 flex items-center justify-center font-black text-sm">
                3
              </div>
              <h3 className="font-black text-blue-300 text-sm">Bimbingan Sesuai Sunnah</h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                Didampingi Muthawwif berpengalaman & sabar, mulai dari bimbingan manasik di tanah air hingga thawaf, sa'i, dan ziarah Raudhah.
              </p>
            </div>
          </div>
        </div>

        {/* 5. SEKSI DETAIL PAKET & FASILITAS REAL DARI DATABASE */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2.5 py-1 rounded">
                  KODE: {septemberPackage?.code || "UMR-5734"}
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded border border-emerald-300">
                  ✈️ Direct Flight
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">
                {septemberPackage?.name || "UMROH REGULER SEPTEMBER 2026"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                📅 Jadwal Keberangkatan: <strong>{septemberPackage?.departureDate ? formatDate(septemberPackage.departureDate, "dd MMMM yyyy") : "22 September 2026"}</strong> • Durasi: <strong>{septemberPackage?.durationDays || 12} Hari</strong>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 line-through block font-mono">
                {formatCurrency(normalPriceQuad)}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
                {formatCurrency(promoPriceQuad)}
              </span>
              <span className="text-[11px] text-slate-500 block">Kamar Quad (Sekamar Ber-4)</span>
            </div>
          </div>

          {/* Fasilitas Hotel & Maskapai Grid (Dinamis Sesuai Database) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">✈️ Maskapai Penerbangan</span>
              <p className="font-black text-slate-900 text-sm">{septemberPackage?.airline || "LION AIR DIRECT"}</p>
              <p className="text-[11px] text-slate-500">Penerbangan Langsung Tanpa Transit</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1">
              <span className="text-[10px] font-bold text-amber-900 uppercase block">🏨 Hotel Makkah</span>
              <p className="font-black text-slate-900 text-sm">{septemberPackage?.hotelMakkah || "WA DAEFA / DHAIF SYUHADA"}</p>
              <p className="text-[11px] text-slate-600">Akses Mudah ke Pelataran Masjidil Haram</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1">
              <span className="text-[10px] font-bold text-emerald-900 uppercase block">🕌 Hotel Madinah</span>
              <p className="font-black text-slate-900 text-sm">{septemberPackage?.hotelMadinah || "ARKAN GOLDEN"}</p>
              <p className="text-[11px] text-slate-600">Dekat Gerbang Masuk Masjid Nabawi</p>
            </div>
          </div>

          {/* Checklist Fasilitas Lengkap */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200 space-y-3">
            <h4 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-emerald-700" />
              Fasilitas All-Inclusive yang Sudah Anda Dapatkan:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tiket Pesawat PP Internasional ({septemberPackage?.airline || "LION AIR"})</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Visa Umroh Resmi & Asuransi Kesehatan Saudi</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Hotel Makkah & Madinah + Makan Fullboard 3x Sehari</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bus AC Eksekutif Saudi untuk Transportasi & Ziarah</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>1 Set Perlengkapan Lengkap (Koper, Batik, Kain Ihram/Mukena)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bimbingan Muthawwif Bersertifikat & Handling Bandara</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. FORMULIR PENDAFTARAN PROMO */}
        <div id="form-daftar" className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
          {submitSuccess ? (
            <div className="text-center py-10 px-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                Alhamdulillah! Pendaftaran Promo Berhasil Diterima
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Selamat <strong>{submitSuccess.fullName}</strong>! Anda telah berhasil mengamankan <strong>Harga Promo Diskon Rp 4 Juta</strong> untuk Program Keberangkatan September 2026.
              </p>

              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 inline-block font-mono text-xl font-black text-amber-950 tracking-wider">
                {submitSuccess.regNumber}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left max-w-md mx-auto space-y-1.5 font-sans">
                <p className="font-bold text-slate-900">Rincian Paket & Pembayaran:</p>
                <p className="text-slate-600">• Program: <strong>{submitSuccess.package?.name}</strong></p>
                <p className="text-slate-600">• Tipe Kamar: <strong>{submitSuccess.roomType}</strong></p>
                <p className="text-slate-600">• Harga Promo: <strong>{formatCurrency(submitSuccess.pricePackage)}</strong> (Diskon 4 Jt)</p>
                <p className="text-slate-600">• Tagihan DP Kunci Seat: <strong>Rp 5.000.000,-</strong></p>
                <p className="text-slate-600">• Sisa Pelunasan: <strong>{formatCurrency(submitSuccess.pricePackage - 5000000)} (Saat Keberangkatan)</strong></p>
              </div>

              <div className="pt-4 flex flex-wrap justify-center gap-3">
                <Link
                  href={`/daftar/status?reg=${submitSuccess.regNumber}`}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md"
                >
                  Lihat Status & Konfirmasi DP <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] mb-2">
                  <Tag className="w-3.5 h-3.5" /> Formulir Registrasi Khusus Promo September 2026
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  Kunci Kursi Promo {formatCurrency(promoPriceQuad)} Anda Hari Ini
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lengkapi data di bawah ini untuk penguncian kuota seat dan penerbitan invoice resmi.
                </p>
              </div>

              {/* SEKSI 1: PILIHAN TIPE KAMAR PROMO */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-900 block">
                  1. Pilih Tipe Kamar (Semua Diskon Rp 4.000.000,-) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: "QUAD", label: "Quad (Sekamar Ber-4)", normal: normalPriceQuad, promo: promoPriceQuad },
                    { key: "TRIPLE", label: "Triple (Sekamar Ber-3)", normal: normalPriceTriple, promo: promoPriceTriple },
                    { key: "DOUBLE", label: "Double (Sekamar Ber-2)", normal: normalPriceDouble, promo: promoPriceDouble },
                  ].map((r) => {
                    const isSelected = formData.roomType === r.key;
                    return (
                      <div
                        key={r.key}
                        onClick={() => setFormData({ ...formData, roomType: r.key })}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-600/20"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <span className="text-xs font-black text-slate-900 block">{r.label}</span>
                        <span className="text-[11px] text-slate-400 line-through block font-mono mt-1">
                          {formatCurrency(r.normal)}
                        </span>
                        <span className="text-lg font-black text-emerald-700 font-mono block">
                          {formatCurrency(r.promo)}
                        </span>
                        <span className="inline-block mt-1 text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                          Hemat Rp 4 Jt
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEKSI 2: RIWAYAT UMROH & ALUMNI */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-slate-50 border border-emerald-200 space-y-3 text-xs">
                <label className="font-black text-slate-900 block">
                  2. Riwayat Pengalaman Ibadah Umroh Calon Jamaah *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">Berapa kali pernah umroh?</span>
                    <select
                      value={formData.umrahExperienceCount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          umrahExperienceCount: val,
                          isPreviousClient: val === "BELUM_PERNAH" ? "TIDAK" : prev.isPreviousClient,
                        }));
                      }}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-bold bg-white"
                    >
                      <option value="BELUM_PERNAH">Belum Pernah (Pertama Kali)</option>
                      <option value="1_KALI">1 Kali</option>
                      <option value="2_KALI">2 Kali</option>
                      <option value="3_KALI">3 Kali</option>
                      <option value="LEBIH_DARI_3_KALI">Lebih dari 3 Kali</option>
                    </select>
                  </div>

                  {formData.umrahExperienceCount !== "BELUM_PERNAH" && (
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Pernah bersama Sulthan Haramain?</span>
                      <select
                        value={formData.isPreviousClient}
                        onChange={(e) => setFormData({ ...formData, isPreviousClient: e.target.value })}
                        className="w-full rounded-xl border border-emerald-300 p-2.5 font-bold bg-white text-emerald-950"
                      >
                        <option value="YA">✅ Ya, Pernah (Alumni)</option>
                        <option value="TIDAK">❌ Tidak (Travel Lain)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* SEKSI 3: DATA PRIBADI JAMAAH */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-900 block">
                  3. Identitas Lengkap Sesuai KTP *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nama Lengkap (Sesuai KTP) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: MUHAMMAD SYAFI'I"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-bold uppercase bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nomor WhatsApp Aktif *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 082167339464"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-mono bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nomor Induk Kependudukan (NIK) *</label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      placeholder="16 Digit NIK KTP"
                      value={formData.nik}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-mono bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Jenis Kelamin *</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-bold bg-white"
                    >
                      <option value="MALE">Laki-Laki (Ikhwan)</option>
                      <option value="FEMALE">Perempuan (Akhwat)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Kota / Kabupaten Domisili</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Ukuran Baju Seragam Batik *</label>
                    <select
                      value={formData.uniformSize}
                      onChange={(e) => setFormData({ ...formData, uniformSize: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-bold bg-white"
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
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Alamat Lengkap Domisili</label>
                  <textarea
                    rows={2}
                    placeholder="Nama jalan, nomor rumah, RT/RW, kecamatan..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
                  />
                </div>
              </div>

              {/* SEKSI 4: KESEHATAN & KURSI RODA */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <label className="font-black text-slate-900 block">
                  4. Catatan Medis & Kebutuhan Khusus
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="wheel"
                    checked={formData.wheelchairAssistance}
                    onChange={(e) => setFormData({ ...formData, wheelchairAssistance: e.target.checked })}
                    className="rounded text-emerald-600 h-4 w-4"
                  />
                  <label htmlFor="wheel" className="font-bold text-slate-800 cursor-pointer">
                    Membutuhkan Bantuan Kursi Roda / Pendamping Khusus selama di Tanah Suci
                  </label>
                </div>
              </div>

              {/* SEKSI 5: PEMBAYARAN DP & REKENING RESMI */}
              <div className="p-5 rounded-2xl bg-amber-50/80 border-2 border-amber-300 space-y-4 text-xs">
                <div>
                  <h4 className="font-black text-amber-950 text-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                    Skema Pembayaran Promo September 2026:
                  </h4>
                  <p className="text-slate-600 mt-1">
                    Cukup bayar <strong>DP Rp 5.000.000,-</strong> hari ini untuk mengunci diskon Rp 4 Juta dan tiket penerbangan. Sisa pelunasan sebesar <strong>{formatCurrency(getSelectedPromoPrice() - 5000000)}</strong> dapat dibayarkan menjelang keberangkatan.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                  <div className="bg-white p-3.5 rounded-xl border border-amber-300 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-bold block">BANK SYARIAH INDONESIA (BSI)</span>
                    <strong className="text-emerald-900 text-sm block">724-8899-001</strong>
                    <p className="text-[10px] text-slate-500 font-sans">a.n. PT BAROKAH SULTHAN HARAMAIN</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-amber-300 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-bold block">BANK MANDIRI</span>
                    <strong className="text-blue-900 text-sm block">106-00-1899-7788</strong>
                    <p className="text-[10px] text-slate-500 font-sans">a.n. PT BAROKAH SULTHAN HARAMAIN</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Upload Foto KTP (Opsional):</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleKtpChange}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                    />
                    {ktpPreview && (
                      <div className="mt-2 h-16 w-24 rounded-lg overflow-hidden border border-slate-300">
                        <img src={ktpPreview} alt="KTP" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Upload Bukti Transfer DP Rp 5 Juta:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofChange}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                    />
                    {proofPreview && (
                      <div className="mt-2 h-16 w-24 rounded-lg overflow-hidden border border-emerald-300">
                        <img src={proofPreview} alt="Bukti" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer hover:scale-[1.01]"
              >
                {submitting ? "Memproses Pendaftaran..." : "Daftar Sekarang & Amankan Diskon 4 Juta (DP 5 Jt)"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
