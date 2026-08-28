"use client";

import React, { useState, useEffect } from "react";
import {
  Plane,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  Upload,
  Phone,
  User,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  Share2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PublicRegistrationPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    packageId: "",
    roomType: "QUAD",
    fullName: "",
    phone: "",
    email: "",
    nik: "",
    passportNumber: "",
    passportExpiry: "",
    placeOfBirth: "",
    dateOfBirth: "",
    gender: "MALE",
    address: "",
    city: "",
    province: "",
    channel: "DIRECT", // DIRECT or AGENT
    agentId: "",
    agentName: "",
    referralName: "",
    ktpBase64: "",
    passportBase64: "",
    notes: "",
  });

  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);

  // Fetch Packages & Agents on load
  useEffect(() => {
    async function loadData() {
      try {
        const [pkgRes, agentRes] = await Promise.all([
          fetch("/api/packages"),
          fetch("/api/agents").catch(() => null),
        ]);

        if (pkgRes.ok) {
          const pkgData = await pkgRes.json();
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

          const activePkgs = pkgData
            .map((p: any) => {
              const depDate = new Date(p.departureDate);
              const diffTime = depDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return {
                ...p,
                daysUntilDeparture: diffDays,
                daysUntilCutoff: diffDays - 10,
                registrationOpen: diffDays >= 10,
              };
            })
            .filter((p: any) => p.status === "ACTIVE" && p.registrationOpen);

          setPackages(activePkgs);
          if (activePkgs.length > 0) {
            setFormData((prev) => ({ ...prev, packageId: activePkgs[0].id }));
          }
        }

        if (agentRes && agentRes.ok) {
          const agentData = await agentRes.json();
          setAgents(agentData);
        }
      } catch (err) {
        console.error("Failed to load packages/agents:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Check query params for agent referral
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const agenParam = urlParams.get("agen") || urlParams.get("agent") || urlParams.get("ref");
      if (agenParam) {
        setFormData((prev) => ({
          ...prev,
          channel: "AGENT",
          agentName: agenParam,
        }));
      }
    }
  }, []);

  // Client-side image compression to WebP (<250KB)
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 1280;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to WebP / JPEG with 0.75 quality
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
          resolve(compressedDataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setKtpPreview(compressed);
      setFormData((prev) => ({ ...prev, ktpBase64: compressed }));
    } catch (err) {
      console.error("Failed to compress KTP:", err);
    }
  };

  const handlePassportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setPassportPreview(compressed);
      setFormData((prev) => ({ ...prev, passportBase64: compressed }));
    } catch (err) {
      console.error("Failed to compress Passport:", err);
    }
  };

  const selectedPackage = packages.find((p) => p.id === formData.packageId) || packages[0];

  const getPackagePrice = () => {
    if (!selectedPackage) return 0;
    if (formData.roomType === "TRIPLE") return selectedPackage.priceTriple;
    if (formData.roomType === "DOUBLE") return selectedPackage.priceDouble;
    return selectedPackage.priceQuad;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal mengirim pendaftaran");
        setSubmitting(false);
        return;
      }

      setSubmitSuccess(data.registration);
    } catch (err) {
      console.error("Submit error:", err);
      alert("Terjadi kesalahan koneksi saat mengirim pendaftaran");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Memuat Formulir Pendaftaran Resmi...</p>
        </div>
      </div>
    );
  }

  // Tampilan Sukses Pendaftaran
  if (submitSuccess) {
    const trackingUrl = `/daftar/status?reg=${submitSuccess.regNumber}`;
    const waText = encodeURIComponent(
      `Assalamu'alaikum Admin PT Barokah Sulthan Haramain, saya telah mendaftar online.\n\n*Nama:* ${submitSuccess.fullName}\n*No. Registrasi:* ${submitSuccess.regNumber}\n*ID Jamaah:* ${submitSuccess.idJamaah}\n*Paket:* ${selectedPackage?.name || "Umroh"}\n\nMohon informasi verifikasi pendaftarannya. Terima kasih.`
    );
    const waUrl = `https://wa.me/6282167339464?text=${waText}`;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 py-12 px-4 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-200/40 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div>
            <span className="text-[11px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
              Pendaftaran Berhasil Diterima
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Alhamdulillah, {submitSuccess.fullName}!
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
              Data pendaftaran Anda telah berhasil dicatat di sistem kami dan sedang menunggu verifikasi dokumen oleh tim operasional.
            </p>
          </div>

          {/* Registration Code Card */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-5 rounded-2xl space-y-3 text-left relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider">
                  Nomor Registrasi Resmi
                </p>
                <h3 className="text-xl font-mono font-black text-amber-400">
                  {submitSuccess.regNumber}
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-300/30 px-2 py-0.5 rounded">
                STATUS: NEW
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/10 pt-2">
              <div>
                <span className="text-slate-400 text-[10px]">ID Jamaah:</span>
                <p className="font-mono font-bold">{submitSuccess.idJamaah}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Paket Pilihan:</span>
                <p className="font-bold truncate">{selectedPackage?.name}</p>
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(submitSuccess.regNumber)}
              className="w-full mt-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all text-emerald-200"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Nomor Berhasil Disalin!" : "Salin Nomor Registrasi"}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <a
              href={trackingUrl}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Pantau Status Pendaftaran & Pembayaran DP
            </a>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-300 transition-all"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              Konfirmasi ke WhatsApp Admin Travel (0821-6733-9464)
            </a>
          </div>

          <p className="text-[10px] text-slate-400">
            Simpan nomor registrasi Anda untuk mengecek status dan melakukan konfirmasi pembayaran DP.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 font-sans pb-16">
      {/* Top Banner Hero */}
      <div className="relative bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white py-12 px-4 border-b border-emerald-800/30">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Pendaftaran Online Resmi 1447H / 2026M
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight uppercase text-white">
            Formulir Pendaftaran Ibadah Umroh
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/90 max-w-xl mx-auto">
            PT BAROKAH SULTHAN HARAMAIN • Izin PPIU No. 25052200384080005<br />
            Daftar mandiri atau melalui perwakilan agen resmi kami dengan mudah, cepat, dan aman.
          </p>

          {/* Stepper Navigation */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 pt-6 max-w-lg mx-auto">
            {[
              { step: 1, label: "1. Paket" },
              { step: 2, label: "2. Data Jamaah" },
              { step: 3, label: "3. Jalur / Agen" },
              { step: 4, label: "4. Dokumen" },
            ].map((item) => (
              <button
                key={item.step}
                type="button"
                onClick={() => currentStep > item.step && setCurrentStep(item.step)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  currentStep === item.step
                    ? "bg-amber-400 text-slate-950 shadow-md font-black"
                    : currentStep > item.step
                    ? "bg-emerald-800 text-white cursor-pointer"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6"
        >
          {/* STEP 1: PILIH PAKET & TIPE KAMAR */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Plane className="w-5 h-5 text-emerald-600" />
                  Langkah 1: Pilih Program Paket & Tipe Kamar
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan paket keberangkatan dan jenis kamar yang Anda inginkan.
                </p>
              </div>

              {/* Package Selection Cards */}
              {packages.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-amber-900 space-y-2">
                  <Clock className="w-8 h-8 text-amber-600 mx-auto opacity-70" />
                  <p className="text-sm font-black">Pendaftaran Online Sedang Ditutup</p>
                  <p className="text-xs text-amber-800/80 max-w-md mx-auto">
                    Saat ini belum ada paket umroh dengan masa pendaftaran aktif (minimal H-10 sebelum jadwal keberangkatan). Silakan hubungi CS kami untuk info pembukaan jadwal program berikutnya.
                  </p>
                  <a
                    href="https://wa.me/6282167339464?text=Assalamu%27alaikum%20Admin%20Sulthan%20Haramain,%20saya%20ingin%20info%20jadwal%20paket%20umroh%20berikutnya."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" /> Tanya Jadwal ke WhatsApp CS
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packages.map((pkg) => {
                    const isSelected = formData.packageId === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setFormData({ ...formData, packageId: pkg.id })}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-600/20"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                                {pkg.code}
                              </span>
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                                ⏳ Sisa {pkg.daysUntilCutoff} Hari Lagi
                              </span>
                            </div>
                            <h4 className="text-base font-black text-slate-900 mt-1.5">{pkg.name}</h4>
                            <p className="text-xs text-slate-600">
                              Durasi: <strong>{pkg.durationDays} Hari</strong> • ✈️ {pkg.airline}
                            </p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-1 text-xs text-slate-600">
                          <p className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            Berangkat: <strong>{formatDate(pkg.departureDate, "dd MMM yyyy")}</strong>
                            <span className="text-[10px] text-slate-400">({pkg.daysUntilDeparture} hari lagi)</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                            Hotel: {pkg.hotelMakkah} & {pkg.hotelMadinah}
                          </p>
                        </div>

                        <div className="mt-4 flex justify-between items-end bg-white p-3 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Mulai dari:</span>
                            <span className="text-sm font-black text-emerald-700">
                              {formatCurrency(pkg.priceQuad)}
                            </span>
                            <span className="text-[10px] text-slate-500"> /pax (Quad)</span>
                          </div>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Sisa {pkg.quota - pkg.bookedCount} Seat
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Room Type Selector */}
              {selectedPackage && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-900 block">
                    Pilih Jenis Kamar Hotel (Quad / Triple / Double):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: "QUAD", label: "Quad (Sekamar Ber-4)", price: selectedPackage.priceQuad },
                      { key: "TRIPLE", label: "Triple (Sekamar Ber-3)", price: selectedPackage.priceTriple },
                      { key: "DOUBLE", label: "Double (Sekamar Ber-2)", price: selectedPackage.priceDouble },
                    ].map((room) => (
                      <div
                        key={room.key}
                        onClick={() => setFormData({ ...formData, roomType: room.key })}
                        className={`p-3 rounded-xl border cursor-pointer transition-all text-center ${
                          formData.roomType === room.key
                            ? "border-emerald-600 bg-white shadow-xs font-bold text-emerald-900 ring-1 ring-emerald-600"
                            : "border-slate-200 bg-slate-100/60 text-slate-600 hover:bg-white"
                        }`}
                      >
                        <p className="text-xs">{room.label}</p>
                        <p className="text-xs font-black text-emerald-700 mt-1">
                          {formatCurrency(room.price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md"
                >
                  Lanjut ke Data Jamaah <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DATA IDENTITAS JAMAAH */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  Langkah 2: Data Identitas Calon Jamaah
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Masukkan data sesuai dengan Kartu Tanda Penduduk (KTP) dan Paspor asli.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Nama Lengkap (Sesuai KTP/Paspor) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SITI NURBAITI"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold uppercase bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Nomor WhatsApp Aktif *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 082167339464"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Nomor Induk Kependudukan (NIK KTP) *</label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="16 Digit NIK KTP"
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Email (Opsional)</label>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Jenis Kelamin *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold"
                  >
                    <option value="MALE">Laki-Laki (Ikhwan)</option>
                    <option value="FEMALE">Perempuan (Akhwat)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Tempat Lahir</label>
                  <input
                    type="text"
                    placeholder="Kota Lahir"
                    value={formData.placeOfBirth}
                    onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Kota / Kabupaten Domisili</label>
                  <input
                    type="text"
                    placeholder="Contoh: Tebing Tinggi / Medan"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  placeholder="Nama jalan, nomor rumah, RT/RW, kecamatan, kode pos..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
                />
              </div>

              {/* Data Paspor (Opsional) */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
                <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Data Paspor (Jika sudah memiliki paspor aktif):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700">Nomor Paspor</label>
                    <input
                      type="text"
                      placeholder="Contoh: X1234567"
                      value={formData.passportNumber}
                      onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2 bg-white font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Masa Berlaku Paspor (Expiry)</label>
                    <input
                      type="date"
                      value={formData.passportExpiry}
                      onChange={(e) => setFormData({ ...formData, passportExpiry: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Kembali
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.fullName || !formData.phone || !formData.nik) {
                      alert("Nama lengkap, nomor WhatsApp, dan NIK wajib diisi!");
                      return;
                    }
                    setCurrentStep(3);
                  }}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md"
                >
                  Lanjut ke Jalur Pendaftaran <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: JALUR PENDAFTARAN & REFERRAL AGEN */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Langkah 3: Jalur Pendaftaran & Perwakilan Agen
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Apakah Anda mendaftar mandiri atau melalui rekomendasi agen/mitra resmi kami?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setFormData({ ...formData, channel: "DIRECT", agentId: "", agentName: "" })}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.channel === "DIRECT"
                      ? "border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-600/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">Pendaftaran Mandiri</h4>
                      <p className="text-xs text-slate-500">Mendaftar langsung ke kantor pusat travel</p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, channel: "AGENT" })}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.channel === "AGENT"
                      ? "border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-600/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">Melalui Agen / Mitra Referral</h4>
                      <p className="text-xs text-slate-500">Direkomendasikan oleh agen / alumni jamaah</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Agent Form Details */}
              {formData.channel === "AGENT" && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                  <label className="text-xs font-bold text-amber-950 block">
                    Nama Agen / Mitra / Kode Referral:
                  </label>
                  {agents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <select
                          value={formData.agentId}
                          onChange={(e) => {
                            const ag = agents.find((a) => a.id === e.target.value);
                            setFormData({
                              ...formData,
                              agentId: e.target.value,
                              agentName: ag ? ag.name : "",
                            });
                          }}
                          className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold"
                        >
                          <option value="">-- Pilih Agen Terdaftar --</option>
                          {agents.map((ag) => (
                            <option key={ag.id} value={ag.id}>
                              {ag.name} ({ag.city || "Mitra"}) - {ag.referralCode}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Atau ketik nama agen / perujuk manual"
                          value={formData.agentName}
                          onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Masukkan nama agen atau nomor HP perujuk..."
                      value={formData.agentName}
                      onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white font-bold"
                    />
                  )}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Kembali
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md"
                >
                  Lanjut ke Upload Dokumen <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: UPLOAD DOKUMEN & SUBMIT */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-600" />
                  Langkah 4: Upload Foto Berkas (KTP & Paspor)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Foto dokumen otomatis dikompres menjadi format ringan & tersinkronisasi aman ke Google Drive.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Upload KTP */}
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center space-y-3 bg-slate-50/50 hover:bg-slate-50 transition-all">
                  <p className="text-xs font-black text-slate-900 uppercase">Foto KTP Asli</p>
                  {ktpPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-40 flex items-center justify-center bg-black">
                      <img src={ktpPreview} alt="Preview KTP" className="max-h-40 object-contain" />
                    </div>
                  ) : (
                    <div className="py-4">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <span className="text-[11px] text-slate-500">Ambil foto KTP yang jelas & tidak silau</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleKtpUpload}
                    className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                  />
                </div>

                {/* Upload Paspor */}
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center space-y-3 bg-slate-50/50 hover:bg-slate-50 transition-all">
                  <p className="text-xs font-black text-slate-900 uppercase">Foto Halaman Paspor (Opsional)</p>
                  {passportPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-40 flex items-center justify-center bg-black">
                      <img src={passportPreview} alt="Preview Paspor" className="max-h-40 object-contain" />
                    </div>
                  ) : (
                    <div className="py-4">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <span className="text-[11px] text-slate-500">Halaman identitas paspor (bisa menyusul)</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePassportUpload}
                    className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                  />
                </div>
              </div>

              {/* Summary Rincian Pendaftaran */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2 text-xs">
                <h4 className="font-black text-emerald-950 uppercase">Ringkasan Pendaftaran:</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <p>Nama: <strong>{formData.fullName}</strong></p>
                  <p>WhatsApp: <strong>{formData.phone}</strong></p>
                  <p>Paket: <strong>{selectedPackage?.name}</strong></p>
                  <p>Kamar: <strong>{formData.roomType}</strong></p>
                  <p>Estimasi Biaya Paket: <strong>{formatCurrency(getPackagePrice())}</strong></p>
                  <p>Uang Muka (DP): <strong>{formatCurrency(5000000)}</strong></p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Kembali
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center gap-2 transition-all shadow-xl shadow-emerald-600/30 cursor-pointer"
                >
                  {submitting ? "Memproses Pendaftaran..." : "Kirim Pendaftaran Sekarang 🚀"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
