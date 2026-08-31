"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plane,
  Coins,
  Heart,
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
  Star,
  Video,
  Gift,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

type ServiceType = "UMROH_REGULER" | "TABUNGAN_UMROH" | "BADAL_UMROH";

export default function PublicRegistrationPage() {
  const [serviceType, setServiceType] = useState<ServiceType>("UMROH_REGULER");
  const [packages, setPackages] = useState<any[]>([]);
  const [allPackagesList, setAllPackagesList] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // 1. Form State: UMROH REGULER
  const [formData, setFormData] = useState({
    packageId: "",
    roomType: "QUAD",
    umrahExperienceCount: "BELUM_PERNAH", // BELUM_PERNAH, 1_KALI, 2_KALI, 3_KALI, LEBIH_DARI_3_KALI
    isPreviousClient: "TIDAK", // YA / TIDAK
    previousPackageName: "",
    customPreviousPackage: "",
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
    uniformSize: "L", // S, M, L, XL, XXL, XXXL, Custom
    chronicDiseases: [] as string[],
    customChronicDisease: "",
    wheelchairAssistance: false,
    wheelchairNotes: "Bawa kursi roda sendiri",
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

  // 2. Form State: TABUNGAN UMROH
  const [savingsForm, setSavingsForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    nik: "",
    gender: "MALE",
    city: "",
    address: "",
    uniformSize: "L",
    targetPackageId: "",
    targetPackageName: "",
    targetAmount: 31500000,
    initialDeposit: 2000000,
    equipmentReceived: true,
    transferProofBase64: "",
    channel: "DIRECT",
    agentName: "",
    referralName: "",
    notes: "",
  });
  const [savingsProofPreview, setSavingsProofPreview] = useState<string | null>(null);

  // 3. Form State: BADAL UMROH
  const [badalForm, setBadalForm] = useState({
    packageType: "BADAL_BASIC", // BADAL_BASIC, BADAL_PREMIUM, BADAL_WITH_VIDEO
    price: 3500000,
    ordererName: "",
    ordererPhone: "",
    ordererEmail: "",
    ordererNik: "",
    ordererCity: "",
    ordererAddress: "",
    ordererRelation: "ANAK", // ANAK, SUAMI, ISTRI, CUCU, SAUDARA, KEPONAKAN, LAINNYA
    recipientName: "",
    recipientGender: "MALE",
    recipientStatus: "DECEASED", // DECEASED, ALIVE_DISABLED
    recipientBirthPlace: "",
    recipientDateOfBirth: "",
    transferProofBase64: "",
    notes: "",
  });
  const [badalProofPreview, setBadalProofPreview] = useState<string | null>(null);

  const BADAL_PACKAGES_CONFIG: Record<string, { label: string; price: number; icon: any; desc: string }> = {
    BADAL_BASIC: { label: "Badal Basic", price: 3500000, icon: Heart, desc: "Tawaf, Sa'i, Tahallul amanah & Sertifikat Resmi" },
    BADAL_PREMIUM: { label: "Badal Premium + Foto", price: 5000000, icon: Star, desc: "Pelaksanaan + Foto bukti di Masjidil Haram & Sertifikat" },
    BADAL_WITH_VIDEO: { label: "Badal Lengkap + Video", price: 7500000, icon: Video, desc: "Pelaksanaan + Foto & Video dokumentasi + Sertifikat" },
  };

  const RELATION_OPTIONS = ["ANAK", "SUAMI", "ISTRI", "CUCU", "SAUDARA", "KEPONAKAN", "LAINNYA"];

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
          setAllPackagesList(pkgData);
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
            setSavingsForm((prev) => ({
              ...prev,
              targetPackageId: activePkgs[0].id,
              targetPackageName: `${activePkgs[0].name} (QUAD)`,
              targetAmount: activePkgs[0].priceQuad || 31500000,
            }));
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

    // Check query params for service type & agent referral
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const svcParam = (urlParams.get("layanan") || urlParams.get("type") || urlParams.get("service") || urlParams.get("tipe"))?.toLowerCase();
      if (svcParam === "tabungan") setServiceType("TABUNGAN_UMROH");
      else if (svcParam === "badal") setServiceType("BADAL_UMROH");
      else if (svcParam === "umroh") setServiceType("UMROH_REGULER");

      const agenParam = urlParams.get("agen") || urlParams.get("agent") || urlParams.get("ref");
      if (agenParam) {
        setFormData((prev) => ({ ...prev, channel: "AGENT", agentName: agenParam }));
        setSavingsForm((prev) => ({ ...prev, channel: "AGENT", agentName: agenParam }));
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

  const handleSavingsProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setSavingsProofPreview(compressed);
      setSavingsForm((prev) => ({ ...prev, transferProofBase64: compressed }));
    } catch (err) {
      console.error("Failed to compress proof:", err);
    }
  };

  const handleBadalProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setBadalProofPreview(compressed);
      setBadalForm((prev) => ({ ...prev, transferProofBase64: compressed }));
    } catch (err) {
      console.error("Failed to compress proof:", err);
    }
  };

  const selectedPackage = packages.find((p) => p.id === formData.packageId) || packages[0];

  const getPackagePrice = () => {
    if (!selectedPackage) return 0;
    if (formData.roomType === "TRIPLE") return selectedPackage.priceTriple;
    if (formData.roomType === "DOUBLE") return selectedPackage.priceDouble;
    return selectedPackage.priceQuad;
  };

  // 1. SUBMIT: UMROH REGULER
  const handleUmrohSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedDiseases = formData.chronicDiseases.includes("LAINNYA") && formData.customChronicDisease
        ? [...formData.chronicDiseases.filter((d) => d !== "LAINNYA"), formData.customChronicDisease]
        : formData.chronicDiseases;

      const previousPkg =
        formData.isPreviousClient === "YA"
          ? (formData.previousPackageName === "LAINNYA" ? formData.customPreviousPackage : formData.previousPackageName)
          : null;

      const payload = {
        ...formData,
        umrahExperienceCount: formData.umrahExperienceCount,
        isPreviousClient: formData.isPreviousClient === "YA",
        previousPackageName: previousPkg,
        chronicDiseases: selectedDiseases.length > 0 ? selectedDiseases.join(", ") : "Tidak Ada (Sehat)",
        wheelchairNotes: formData.wheelchairAssistance ? formData.wheelchairNotes : null,
      };

      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal mengirim pendaftaran");
        setSubmitting(false);
        return;
      }

      setSubmitSuccess({
        type: "UMROH_REGULER",
        ...data.registration,
      });
    } catch (err) {
      console.error("Submit error:", err);
      alert("Terjadi kesalahan koneksi saat mengirim pendaftaran");
    } finally {
      setSubmitting(false);
    }
  };

  // 2. SUBMIT: TABUNGAN UMROH
  const handleSavingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(savingsForm),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal membuka rekening tabungan");
        setSubmitting(false);
        return;
      }

      setSubmitSuccess({
        type: "TABUNGAN_UMROH",
        ...data.account,
        receiptNumber: data.transaction?.receiptNumber,
      });
    } catch (err) {
      console.error("Savings submit error:", err);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. SUBMIT: BADAL UMROH
  const handleBadalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...badalForm,
        price: BADAL_PACKAGES_CONFIG[badalForm.packageType]?.price || 3500000,
      };

      const res = await fetch("/api/badal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal mendaftarkan pesanan badal umroh");
        setSubmitting(false);
        return;
      }

      setSubmitSuccess({
        type: "BADAL_UMROH",
        ...data.order,
      });
    } catch (err) {
      console.error("Badal submit error:", err);
      alert("Terjadi kesalahan koneksi");
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
          <p className="text-sm font-semibold text-slate-300">Memuat Portal Layanan Resmi Sulthan Haramain...</p>
        </div>
      </div>
    );
  }

  // ─── TAMPILAN SUKSES PENDAFTARAN (TAILORED PER SERVICE) ─────────────────────────
  if (submitSuccess) {
    if (submitSuccess.type === "TABUNGAN_UMROH") {
      const trackingUrl = `/tabungan/status?acc=${submitSuccess.accountNumber}`;
      const waText = encodeURIComponent(
        `Assalamu'alaikum Admin PT Barokah Sulthan Haramain, saya telah membuka Rekening Tabungan Umroh Online.\n\n*Nama:* ${submitSuccess.fullName}\n*No. Rekening Tabungan:* ${submitSuccess.accountNumber}\n*Program Target:* ${submitSuccess.targetPackageName}\n*Setoran Awal (DP):* Rp 2.000.000,-\n\nMohon verifikasi & informasi pengambilan perlengkapan/koper umroh saya. Terima kasih.`
      );
      const waUrl = `https://wa.me/6282167339464?text=${waText}`;

      return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 py-12 px-4 flex items-center justify-center">
          <div className="max-w-xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-200/40 text-center space-y-6">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-inner">
              <Coins className="w-12 h-12" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-widest bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                Tabungan Umroh Berhasil Dibuka
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-2">
                Alhamdulillah, {submitSuccess.fullName}!
              </h1>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                Rekening tabungan umroh Anda telah terbit. Anda berhak langsung membawa pulang <strong>Koper & Perlengkapan Umroh Lengkap</strong>!
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-5 rounded-2xl space-y-3 text-left">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider">
                    Nomor Rekening Tabungan
                  </p>
                  <h3 className="text-xl font-mono font-black text-amber-400">
                    {submitSuccess.accountNumber}
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded">
                  DP Rp 2 Jt Bawa Koper
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/10 pt-2">
                <div>
                  <span className="text-slate-400 text-[10px]">Target Paket:</span>
                  <p className="font-bold truncate">{submitSuccess.targetPackageName}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Saldo Awal Terbuka:</span>
                  <p className="font-mono font-bold text-emerald-300">{formatCurrency(submitSuccess.totalBalance || 2000000)}</p>
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(submitSuccess.accountNumber)}
                className="w-full mt-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all text-emerald-200"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? "Nomor Rekening Disalin!" : "Salin No. Rekening Tabungan"}
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <a
                href={trackingUrl}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Pantau Saldo & Catatan Setoran Tabungan
              </a>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-300 transition-all"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                Konfirmasi WA & Klaim Koper Umroh (0821-6733-9464)
              </a>
            </div>
          </div>
        </div>
      );
    }

    if (submitSuccess.type === "BADAL_UMROH") {
      const waText = encodeURIComponent(
        `Assalamu'alaikum Admin PT Barokah Sulthan Haramain, saya telah mendaftar Badal Umroh Online.\n\n*No. Pesanan:* ${submitSuccess.orderNumber}\n*Pemesan:* ${submitSuccess.ordererName}\n*Almarhum/ah:* ${submitSuccess.recipientName}\n*Paket:* ${BADAL_PACKAGES_CONFIG[submitSuccess.packageType]?.label || "Badal Umroh"}\n*Biaya:* ${formatCurrency(submitSuccess.price)}\n\nMohon informasi jadwal & verifikasi pelaksanaan badal. Terima kasih.`
      );
      const waUrl = `https://wa.me/6282167339464?text=${waText}`;

      return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-rose-950 py-12 px-4 flex items-center justify-center">
          <div className="max-w-xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-rose-200/40 text-center space-y-6">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600 shadow-inner">
              <Heart className="w-12 h-12" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-widest bg-rose-100 text-rose-900 px-3 py-1 rounded-full border border-rose-300">
                Pendaftaran Badal Umroh Diterima
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-2">
                Jazakallahu Khairan, {submitSuccess.ordererName}!
              </h1>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                Amanah ibadah badal umroh atas nama <strong>{submitSuccess.recipientName}</strong> telah tercatat di sistem kami dan akan dijadwalkan pelaksanaannya di Masjidil Haram.
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-rose-950 text-white p-5 rounded-2xl space-y-3 text-left">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-rose-300 uppercase font-bold tracking-wider">
                    Nomor Pesanan Badal
                  </p>
                  <h3 className="text-xl font-mono font-black text-amber-400">
                    {submitSuccess.orderNumber}
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30 px-2 py-0.5 rounded">
                  Sertifikat Resmi
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/10 pt-2">
                <div>
                  <span className="text-slate-400 text-[10px]">Yang Dibadalkan:</span>
                  <p className="font-bold uppercase text-amber-300 truncate">{submitSuccess.recipientName}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Total Biaya Paket:</span>
                  <p className="font-mono font-bold">{formatCurrency(submitSuccess.price)}</p>
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(submitSuccess.orderNumber)}
                className="w-full mt-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all text-rose-200"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? "Nomor Pesanan Disalin!" : "Salin No. Pesanan Badal"}
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
              >
                <Phone className="w-4 h-4" />
                Konfirmasi Pembayaran & Jadwal ke WhatsApp (0821-6733-9464)
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Default: UMROH REGULER
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

  // ─── MAIN PORTAL REGISTRATION FORM ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 font-sans pb-16">
      {/* Top Banner Hero */}
      <div className="relative bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white py-10 px-4 border-b border-emerald-800/30">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Portal Pendaftaran Resmi 1447H / 2026M
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight uppercase text-white">
            Formulir Pendaftaran Online
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/90 max-w-xl mx-auto">
            PT BAROKAH SULTHAN HARAMAIN • Izin PPIU No. 25052200384080005<br />
            Silakan pilih jenis layanan di bawah ini sesuai kebutuhan ibadah Anda.
          </p>

          {/* 🌟 3-WAY SERVICE SELECTOR TABS */}
          <div className="pt-2 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-emerald-700/40">
              {/* Tab 1: Umroh Reguler */}
              <button
                type="button"
                onClick={() => {
                  setServiceType("UMROH_REGULER");
                  setCurrentStep(1);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                  serviceType === "UMROH_REGULER"
                    ? "bg-emerald-600 text-white shadow-lg font-bold ring-2 ring-amber-400"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Plane className="w-4 h-4 text-amber-300" />
                  <span className="text-xs font-black">1. Umroh Reguler</span>
                </div>
                <span className="text-[10px] opacity-80 mt-0.5">Keberangkatan Pasti</span>
              </button>

              {/* Tab 2: Tabungan Umroh */}
              <button
                type="button"
                onClick={() => {
                  setServiceType("TABUNGAN_UMROH");
                  setCurrentStep(1);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                  serviceType === "TABUNGAN_UMROH"
                    ? "bg-amber-500 text-slate-950 shadow-lg font-bold ring-2 ring-amber-300"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-950" />
                  <span className="text-xs font-black">2. Tabungan Umroh</span>
                </div>
                <span className="text-[10px] opacity-80 mt-0.5">DP 2 Jt Bawa Koper</span>
              </button>

              {/* Tab 3: Badal Umroh */}
              <button
                type="button"
                onClick={() => {
                  setServiceType("BADAL_UMROH");
                  setCurrentStep(1);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                  serviceType === "BADAL_UMROH"
                    ? "bg-rose-600 text-white shadow-lg font-bold ring-2 ring-amber-400"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-amber-300" />
                  <span className="text-xs font-black">3. Badal Umroh</span>
                </div>
                <span className="text-[10px] opacity-80 mt-0.5">Almarhum / Uzur</span>
              </button>
            </div>
          </div>

          {/* Stepper Navigation (Only for Umroh Reguler multi-step) */}
          {serviceType === "UMROH_REGULER" && (
            <div className="flex items-center justify-center gap-2 sm:gap-4 pt-3 max-w-lg mx-auto">
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
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
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
          )}
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {/* ══════════════════════════════════════════════════════════════════════════
            FORM 1: UMROH REGULER (TERSTRUKTUR 4 LANGKAH LENGKAP)
        ══════════════════════════════════════════════════════════════════════════ */}
        {serviceType === "UMROH_REGULER" && (
          <form
            onSubmit={handleUmrohSubmit}
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
                    Lengkapi riwayat pengalaman umroh Anda, lalu tentukan paket keberangkatan & kamar yang diinginkan.
                  </p>
                </div>

                {/* 1.1 RIWAYAT PENGALAMAN UMROH */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Riwayat Pengalaman Ibadah Umroh Calon Jamaah *
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: "BELUM_PERNAH", label: "Belum Pernah (Perdana)" },
                      { id: "1_KALI", label: "1 Kali" },
                      { id: "2_KALI", label: "2 Kali" },
                      { id: "3_KALI", label: "3 Kali" },
                      { id: "LEBIH_DARI_3_KALI", label: "> 3 Kali (Sering)" },
                    ].map((exp) => (
                      <button
                        key={exp.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, umrahExperienceCount: exp.id })}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                          formData.umrahExperienceCount === exp.id
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {exp.label}
                      </button>
                    ))}
                  </div>

                  {formData.umrahExperienceCount !== "BELUM_PERNAH" && (
                    <div className="pt-2 border-t border-slate-200/80 space-y-3">
                      <label className="text-xs font-bold text-slate-800 block">
                        Apakah Anda sebelumnya pernah berangkat bersama Sulthan Haramain?
                      </label>
                      <div className="flex gap-3">
                        {["YA", "TIDAK"].map((choice) => (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => setFormData({ ...formData, isPreviousClient: choice })}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              formData.isPreviousClient === choice
                                ? "bg-emerald-700 text-white border-emerald-700"
                                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            {choice === "YA" ? "Ya, Saya Alumni Sulthan Haramain" : "Tidak, Bersama Travel Lain"}
                          </button>
                        ))}
                      </div>

                      {formData.isPreviousClient === "YA" && (
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            Pilih Program Umroh Sebelumnya yang Pernah Diikuti:
                          </label>
                          <select
                            value={formData.previousPackageName}
                            onChange={(e) => setFormData({ ...formData, previousPackageName: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-500/20"
                          >
                            <option value="">-- Pilih Program Sebelumnya --</option>
                            {allPackagesList.map((p) => (
                              <option key={p.id} value={p.name}>
                                {p.name} ({formatDate(p.departureDate)})
                              </option>
                            ))}
                            <option value="LAINNYA">Program Lainnya / Tahun Lalu</option>
                          </select>

                          {formData.previousPackageName === "LAINNYA" && (
                            <input
                              type="text"
                              placeholder="Tuliskan nama program / tahun keberangkatan sebelumnya..."
                              value={formData.customPreviousPackage}
                              onChange={(e) => setFormData({ ...formData, customPreviousPackage: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 1.2 PILIH PAKET */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-900 block">
                    Pilih Jadwal & Paket Keberangkatan Umroh *
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {packages.map((pkg) => {
                      const isSelected = formData.packageId === pkg.id;
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => setFormData({ ...formData, packageId: pkg.id })}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-600/20"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                  {pkg.code}
                                </span>
                                <h4 className="font-black text-slate-900 text-sm sm:text-base">
                                  {pkg.name}
                                </h4>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                                <span>📅 {formatDate(pkg.departureDate, "dd MMMM yyyy")}</span>
                                <span>•</span>
                                <span>⏱️ {pkg.durationDays || 9} Hari</span>
                                <span>•</span>
                                <span>✈️ {pkg.airline || "Saudia Airlines"}</span>
                              </p>
                            </div>
                            <div className="text-left sm:text-right">
                              <span className="text-[10px] text-slate-400 block">Mulai dari (Quad):</span>
                              <span className="text-base font-black text-emerald-700 font-mono">
                                {formatCurrency(pkg.priceQuad)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 1.3 PILIH TIPE KAMAR */}
                {selectedPackage && (
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-black text-slate-900 block">
                      Pilih Tipe Kamar Hotel *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { type: "QUAD", label: "Quad (Sekamar Ber-4)", price: selectedPackage.priceQuad, desc: "Paling hemat & ekonomis" },
                        { type: "TRIPLE", label: "Triple (Sekamar Ber-3)", price: selectedPackage.priceTriple, desc: "Kenyamanan ekstra keluarga" },
                        { type: "DOUBLE", label: "Double (Sekamar Ber-2)", price: selectedPackage.priceDouble, desc: "Privat untuk suami-istri" },
                      ].map((room) => (
                        <div
                          key={room.type}
                          onClick={() => setFormData({ ...formData, roomType: room.type })}
                          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                            formData.roomType === room.type
                              ? "border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-600/20"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <p className="font-bold text-slate-900 text-xs">{room.label}</p>
                          <p className="font-mono font-black text-emerald-700 text-sm mt-1">
                            {formatCurrency(room.price)}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">{room.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    Lanjut ke Data Calon Jamaah <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DATA CALON JAMAAH */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-600" />
                    Langkah 2: Data Lengkap Calon Jamaah
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pastikan nama sesuai dengan KTP & Paspor Anda untuk keperluan visa dan tiket pesawat.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700">Nama Lengkap (Sesuai KTP / Paspor) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AHMAD GEVIN RICH DAMANIK"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value.toUpperCase() })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">Nomor WhatsApp Aktif *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 082167339464"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">Alamat Email</label>
                    <input
                      type="email"
                      placeholder="e.g. jamaah@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">Nomor Induk Kependudukan (NIK) *</label>
                    <input
                      type="text"
                      required
                      placeholder="16 Digit NIK KTP"
                      maxLength={16}
                      value={formData.nik}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">Jenis Kelamin *</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="MALE">Laki-laki</option>
                      <option value="FEMALE">Perempuan</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">Tempat Lahir *</label>
                    <input
                      type="text"
                      placeholder="e.g. Medan"
                      value={formData.placeOfBirth}
                      onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">Tanggal Lahir *</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">Ukuran Seragam / Batik Travel *</label>
                    <select
                      value={formData.uniformSize}
                      onChange={(e) => setFormData({ ...formData, uniformSize: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold"
                    >
                      {["S", "M", "L", "XL", "XXL", "XXXL", "CUSTOM"].map((sz) => (
                        <option key={sz} value={sz}>Ukuran {sz}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">Kota / Kabupaten *</label>
                    <input
                      type="text"
                      placeholder="e.g. Tebing Tinggi"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700">Alamat Lengkap KTP</label>
                    <textarea
                      rows={2}
                      placeholder="Jl. Nama Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan..."
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                </div>

                {/* Paspor (Opsional jika belum ada) */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-emerald-600" />
                      Informasi Dokumen Paspor (Boleh dikosongkan jika sedang proses buat)
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700">Nomor Paspor</label>
                      <input
                        type="text"
                        placeholder="e.g. C1234567"
                        value={formData.passportNumber}
                        onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value.toUpperCase() })}
                        className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700">Masa Berlaku Paspor</label>
                      <input
                        type="date"
                        value={formData.passportExpiry}
                        onChange={(e) => setFormData({ ...formData, passportExpiry: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" /> Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.fullName || !formData.phone || !formData.nik) {
                        alert("Mohon lengkapi Nama Lengkap, No WhatsApp, dan NIK terlebih dahulu!");
                        return;
                      }
                      setCurrentStep(3);
                    }}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    Lanjut ke Jalur Pendaftaran <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: JALUR PENDAFTARAN & AGEN */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    Langkah 3: Jalur Pendaftaran & Perwakilan Agen
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih apakah Anda mendaftar langsung ke kantor pusat atau melalui agen / perwakilan resmi kami.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setFormData({ ...formData, channel: "DIRECT", agentName: "", referralName: "" })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.channel === "DIRECT"
                        ? "border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-600/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-emerald-700" />
                      <h4 className="font-bold text-slate-900 text-sm">Pendaftaran Mandiri / Kantor Pusat</h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Mendaftar langsung ke kantor pusat PT Barokah Sulthan Haramain tanpa perantara.
                    </p>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, channel: "AGENT" })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.channel === "AGENT"
                        ? "border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-600/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-700" />
                      <h4 className="font-bold text-slate-900 text-sm">Melalui Cabang / Agen / Referral</h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Mendaftar atas rekomendasi perwakilan agen atau cabang resmi Sulthan Haramain.
                    </p>
                  </div>
                </div>

                {formData.channel === "AGENT" && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <label className="font-bold text-slate-800 block">
                      Pilih Nama Agen / Cabang Terdaftar:
                    </label>
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
                      <option value="">-- Pilih Agen Resmi --</option>
                      {agents.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name} ({ag.city || "Cabang"})
                        </option>
                      ))}
                      <option value="CUSTOM">Agen / Rekan Lainnya (Tulis Manual)</option>
                    </select>

                    {formData.agentId === "CUSTOM" && (
                      <input
                        type="text"
                        placeholder="Tuliskan nama agen atau perujuk Anda..."
                        value={formData.agentName}
                        onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 p-2.5"
                      />
                    )}
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" /> Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    Lanjut ke Upload Dokumen & Review <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: DOKUMEN & REVIEW */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-emerald-600" />
                    Langkah 4: Upload Dokumen & Ringkasan Tagihan
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload foto KTP dan Paspor (jika ada). Dokumen juga dapat diserahkan menyusul ke kantor.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Upload KTP */}
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center space-y-2 hover:border-emerald-500 transition-colors">
                    <p className="text-xs font-bold text-slate-800">Foto KTP Asli</p>
                    {ktpPreview ? (
                      <div className="space-y-2">
                        <img src={ktpPreview} alt="Preview KTP" className="h-28 mx-auto rounded-lg object-contain border" />
                        <label className="text-[10px] text-emerald-600 font-bold cursor-pointer block">Ganti Foto KTP</label>
                      </div>
                    ) : (
                      <div className="py-4 space-y-1">
                        <Upload className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-[11px] text-slate-500">Format JPG/PNG (Maks 5MB)</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleKtpUpload} className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" />
                  </div>

                  {/* Upload Paspor */}
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center space-y-2 hover:border-emerald-500 transition-colors">
                    <p className="text-xs font-bold text-slate-800">Foto Halaman Depan Paspor</p>
                    {passportPreview ? (
                      <div className="space-y-2">
                        <img src={passportPreview} alt="Preview Paspor" className="h-28 mx-auto rounded-lg object-contain border" />
                        <label className="text-[10px] text-emerald-600 font-bold cursor-pointer block">Ganti Foto Paspor</label>
                      </div>
                    ) : (
                      <div className="py-4 space-y-1">
                        <Upload className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-[11px] text-slate-500">Boleh menyusul jika belum ada</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handlePassportUpload} className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" />
                  </div>
                </div>

                {/* Box Rincian Rekening Bank Mandiri */}
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-950">Total Biaya Paket ({formData.roomType}):</span>
                    <strong className="text-sm font-mono text-emerald-900">{formatCurrency(getPackagePrice())}</strong>
                  </div>
                  <div className="flex justify-between items-center border-t border-amber-200 pt-2">
                    <span className="font-bold text-amber-950">Tagihan DP Kunci Seat Hari Ini:</span>
                    <strong className="text-sm font-mono text-emerald-900">Rp 5.000.000,-</strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-amber-300 space-y-1 font-mono">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Rekening Resmi Penerimaan (Bank Mandiri):</span>
                    <strong className="text-blue-900 text-base block">106-00-1899-7788</strong>
                    <p className="text-[11px] text-slate-700 font-sans font-bold">a.n. PT BAROKAH SULTHAN HARAMAIN (Cabang Tebing Tinggi)</p>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" /> Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition-all disabled:opacity-60"
                  >
                    {submitting ? "Memproses Pendaftaran..." : "✅ Kirim Formulir Pendaftaran Umroh"}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════
            FORM 2: TABUNGAN UMROH (DP 2 JT LANGSUNG DAPAT KOPER)
        ══════════════════════════════════════════════════════════════════════════ */}
        {serviceType === "TABUNGAN_UMROH" && (
          <form
            onSubmit={handleSavingsSubmit}
            className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
                <Gift className="w-3.5 h-3.5" /> Program Spesial: DP Rp 2 Juta Langsung Bawa Pulang Koper!
              </div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Coins className="w-6 h-6 text-amber-600" />
                Formulir Buka Rekening Tabungan Umroh
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Menabung fleksibel tanpa batasan waktu. Begitu setor DP Rp 2 Juta, koper & perlengkapan umroh langsung jadi milik Anda.
              </p>
            </div>

            {/* 1. TARGET PAKET */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-900 block">
                1. Pilih Target Program Paket Umroh *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {packages.map((pkg) => {
                  const isSelected = savingsForm.targetPackageId === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() =>
                        setSavingsForm({
                          ...savingsForm,
                          targetPackageId: pkg.id,
                          targetPackageName: `${pkg.name} (QUAD)`,
                          targetAmount: pkg.priceQuad || 31500000,
                        })
                      }
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-amber-500 bg-amber-50/60 shadow-md ring-2 ring-amber-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <p className="font-bold text-slate-900 text-xs">{pkg.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Target: <strong className="font-mono text-emerald-800">{formatCurrency(pkg.priceQuad)}</strong></p>
                      <span className="inline-block mt-2 text-[9px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                        Setoran Awal: Rp 2.000.000
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. DATA PENABUNG (TIDAK BUTUH PASPOR/VISA/KESEHATAN) */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-900 block">
                2. Data Lengkap Calon Jamaah Penabung *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700">Nama Lengkap Penabung (Sesuai KTP) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SURAKHMAD"
                    value={savingsForm.fullName}
                    onChange={(e) => setSavingsForm({ ...savingsForm, fullName: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Nomor WhatsApp Aktif *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 081234567890"
                    value={savingsForm.phone}
                    onChange={(e) => setSavingsForm({ ...savingsForm, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Nomor Induk Kependudukan (NIK) *</label>
                  <input
                    type="text"
                    required
                    placeholder="16 Digit NIK KTP"
                    maxLength={16}
                    value={savingsForm.nik}
                    onChange={(e) => setSavingsForm({ ...savingsForm, nik: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Jenis Kelamin</label>
                  <select
                    value={savingsForm.gender}
                    onChange={(e) => setSavingsForm({ ...savingsForm, gender: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  >
                    <option value="MALE">Laki-laki</option>
                    <option value="FEMALE">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Ukuran Seragam / Batik (Untuk Koper) *</label>
                  <select
                    value={savingsForm.uniformSize}
                    onChange={(e) => setSavingsForm({ ...savingsForm, uniformSize: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold"
                  >
                    {["S", "M", "L", "XL", "XXL", "XXXL", "CUSTOM"].map((sz) => (
                      <option key={sz} value={sz}>Ukuran {sz}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700">Kota / Alamat Tempat Tinggal</label>
                  <input
                    type="text"
                    placeholder="e.g. Tebing Tinggi / Jl. Pahlawan..."
                    value={savingsForm.address}
                    onChange={(e) => setSavingsForm({ ...savingsForm, address: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
              </div>
            </div>

            {/* 3. REKENING & BUKTI SETORAN AWAL */}
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-amber-300 space-y-1 font-mono">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Rekening Resmi Pembayaran DP Tabungan:</span>
                <strong className="text-blue-900 text-base block">106-00-1899-7788</strong>
                <p className="text-[11px] text-slate-700 font-sans font-bold">a.n. PT BAROKAH SULTHAN HARAMAIN (Bank Mandiri)</p>
                <p className="text-[10px] text-emerald-800 font-sans mt-1">
                  💡 Nominal Setoran Awal: <strong>Rp 2.000.000,-</strong> (Sudah termasuk hak koper & paket perlengkapan).
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Upload Bukti Transfer DP Rp 2 Jt (Opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSavingsProofUpload}
                  className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer"
                />
                {savingsProofPreview && (
                  <img src={savingsProofPreview} alt="Bukti Transfer" className="h-20 mt-2 rounded border" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all disabled:opacity-60"
            >
              {submitting ? "Membuka Rekening..." : "🪙 Buka Rekening Tabungan & Ambil Koper"}
            </button>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════
            FORM 3: BADAL UMROH (AMANAH ALMARHUM / UZUR)
        ══════════════════════════════════════════════════════════════════════════ */}
        {serviceType === "BADAL_UMROH" && (
          <form
            onSubmit={handleBadalSubmit}
            className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-bold mb-2">
                <Heart className="w-3.5 h-3.5 text-rose-600" /> Amanah Ibadah Badal Sesuai Sunnah
              </div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Heart className="w-6 h-6 text-rose-600" />
                Formulir Pendaftaran Badal Umroh
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ibadah umroh dibadalkan oleh muthawwif terpercaya di Makkah atas nama orang tua / kerabat almarhum atau yang uzur fisik.
              </p>
            </div>

            {/* 1. PILIH PAKET BADAL */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-900 block">
                1. Pilih Paket Badal Umroh *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(BADAL_PACKAGES_CONFIG).map(([key, pkg]) => {
                  const Icon = pkg.icon;
                  const isSelected = badalForm.packageType === key;
                  return (
                    <div
                      key={key}
                      onClick={() => setBadalForm({ ...badalForm, packageType: key, price: pkg.price })}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-rose-600 bg-rose-50/60 shadow-md ring-2 ring-rose-600/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1 ${isSelected ? "text-rose-600" : "text-slate-400"}`} />
                      <p className="font-bold text-slate-900 text-xs">{pkg.label}</p>
                      <p className="font-mono font-black text-emerald-700 text-sm mt-1">{formatCurrency(pkg.price)}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{pkg.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. DATA PEMESAN (AHLI WARIS / KELUARGA) */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-900 block">
                2. Data Pemesan (Ahli Waris / Keluarga) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Nama Lengkap Pemesan *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BUDI SANTOSO"
                    value={badalForm.ordererName}
                    onChange={(e) => setBadalForm({ ...badalForm, ordererName: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Nomor WhatsApp Aktif *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0812xxxxxxxx"
                    value={badalForm.ordererPhone}
                    onChange={(e) => setBadalForm({ ...badalForm, ordererPhone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Hubungan dengan Almarhum/ah *</label>
                  <select
                    value={badalForm.ordererRelation}
                    onChange={(e) => setBadalForm({ ...badalForm, ordererRelation: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold"
                  >
                    {RELATION_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Kota Domisili</label>
                  <input
                    type="text"
                    placeholder="e.g. Tebing Tinggi"
                    value={badalForm.ordererCity}
                    onChange={(e) => setBadalForm({ ...badalForm, ordererCity: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
              </div>
            </div>

            {/* 3. DATA YANG DIBADALKAN (ALMARHUM / UZUR) */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-900 block">
                3. Data Almarhum / Yang Diniatkan untuk Badal *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700">Nama Lengkap Almarhum/ah *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. H. MUHAMMAD SALIM BIN AHMAD"
                    value={badalForm.recipientName}
                    onChange={(e) => setBadalForm({ ...badalForm, recipientName: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Jenis Kelamin</label>
                  <select
                    value={badalForm.recipientGender}
                    onChange={(e) => setBadalForm({ ...badalForm, recipientGender: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  >
                    <option value="MALE">Laki-laki (Bin)</option>
                    <option value="FEMALE">Perempuan (Binti)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Kondisi</label>
                  <select
                    value={badalForm.recipientStatus}
                    onChange={(e) => setBadalForm({ ...badalForm, recipientStatus: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold"
                  >
                    <option value="DECEASED">Almarhum / Wafat</option>
                    <option value="ALIVE_DISABLED">Masih Hidup (Uzur Sakit Permanen)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700">Pesan Khusus / Titipan Doa di Ka'bah</label>
                  <textarea
                    rows={2}
                    placeholder="Tuliskan doa khusus yang ingin dipanjatkan saat pelaksanaan badal di depan Ka'bah..."
                    value={badalForm.notes}
                    onChange={(e) => setBadalForm({ ...badalForm, notes: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
              </div>
            </div>

            {/* 4. REKENING & BUKTI TRANSFER */}
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-rose-300 space-y-1 font-mono">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Rekening Resmi Pembayaran Badal (Bank Mandiri):</span>
                <strong className="text-blue-900 text-base block">106-00-1899-7788</strong>
                <p className="text-[11px] text-slate-700 font-sans font-bold">a.n. PT BAROKAH SULTHAN HARAMAIN</p>
                <p className="text-[10px] text-emerald-800 font-sans mt-1">
                  Biaya Paket Badal Dipilih: <strong>{formatCurrency(BADAL_PACKAGES_CONFIG[badalForm.packageType]?.price || 3500000)}</strong>
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Upload Bukti Transfer (Opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBadalProofUpload}
                  className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-rose-100 file:text-rose-900 hover:file:bg-rose-200 cursor-pointer"
                />
                {badalProofPreview && (
                  <img src={badalProofPreview} alt="Bukti Transfer" className="h-20 mt-2 rounded border" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-xl shadow-rose-600/20 transition-all disabled:opacity-60"
            >
              {submitting ? "Mendaftarkan Badal..." : "❤️ Daftarkan Badal Umroh & Terbitkan Sertifikat"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
