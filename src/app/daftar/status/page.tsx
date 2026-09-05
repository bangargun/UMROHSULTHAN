"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  CreditCard,
  Building,
  Upload,
  ArrowRight,
  Plane,
  FileCheck,
  ShieldCheck,
  Phone,
  Copy,
  ExternalLink,
  AlertTriangle,
  Boxes,
  CheckSquare,
  Square,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  MEN_PACKING_LIST,
  WOMEN_PACKING_LIST,
  getPackingListByGender,
} from "@/lib/packing-list";

export default function RegistrationStatusPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [registration, setRegistration] = useState<any | null>(null);
  const [travelSettings, setTravelSettings] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofBase64, setProofBase64] = useState<string | null>(null);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  // Packing Checklist Interactive State for Android / Mobile Users
  const [packingGender, setPackingGender] = useState<"MALE" | "FEMALE">("FEMALE");
  const [checkedPackingItems, setCheckedPackingItems] = useState<{ [id: string]: boolean }>({});
  const [isPackingOpen, setIsPackingOpen] = useState(true);

  // Read URL query parameter on mount (e.g. ?reg=REG-2608-0001)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const regParam = urlParams.get("reg") || urlParams.get("q");
      if (regParam) {
        setQuery(regParam);
        fetchStatus(regParam);
      }
    }
  }, []);

  const fetchStatus = async (searchKey: string) => {
    if (!searchKey.trim()) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/registrations/status?q=${encodeURIComponent(searchKey.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setRegistration(null);
        setErrorMsg(data.error || "Pendaftaran tidak ditemukan.");
      } else {
        setRegistration(data.registration);
        setTravelSettings(data.travelSettings);
        if (data.registration?.gender) {
          setPackingGender(data.registration.gender === "FEMALE" ? "FEMALE" : "MALE");
        }
        if (typeof window !== "undefined" && data.registration) {
          const saved = localStorage.getItem(`packing_${data.registration.id || data.registration.regNumber}`);
          if (saved) {
            try {
              setCheckedPackingItems(JSON.parse(saved));
            } catch {}
          }
        }
      }
    } catch (err) {
      setErrorMsg("Gagal terhubung ke server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const togglePackingItem = (itemId: string) => {
    setCheckedPackingItems((prev) => {
      const updated = { ...prev, [itemId]: !prev[itemId] };
      if (typeof window !== "undefined" && registration) {
        localStorage.setItem(`packing_${registration.id || registration.regNumber}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Image compressor
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
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setProofPreview(compressed);
      setProofBase64(compressed);
    } catch (err) {
      console.error("Failed to compress proof:", err);
    }
  };

  const submitProof = async () => {
    if (!proofBase64 || !registration) return;
    setUploadingProof(true);
    try {
      const res = await fetch(`/api/registrations/${registration.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transferProofBase64: proofBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal mengunggah bukti bayar");
      } else {
        setRegistration(data.registration);
        alert("Bukti pembayaran berhasil diunggah! Mohon menunggu verifikasi kas masuk.");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setUploadingProof(false);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(label);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  // Lifecycle Step Indicator
  const getStepNumber = (status: string) => {
    switch (status) {
      case "NEW":
        return 1;
      case "VERIFIED":
        return 2;
      case "PAYMENT_PENDING":
        return 3;
      case "PAID":
        return 4;
      default:
        return 1;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 font-sans pb-16">
      {/* Header */}
      <div className="bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white py-10 px-4 border-b border-emerald-800/30">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100/10 text-emerald-300 border border-emerald-300/20 px-3 py-1 rounded-full">
            🔍 Portal Lacak Pendaftaran & Pembayaran DP
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase">
            Cek Status Pendaftaran Umroh
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Masukkan Nomor Registrasi resmi (contoh: REG-2608-0001) atau Nomor WhatsApp Anda saat mendaftar.
          </p>

          {/* Search Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchStatus(query);
            }}
            className="flex gap-2 max-w-md mx-auto pt-3"
          >
            <input
              type="text"
              placeholder="Nomor Registrasi / No. WhatsApp / NIK..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Search className="w-4 h-4" /> {loading ? "Mencari..." : "Cari"}
            </button>
          </form>

          {/* Android APK Download Action */}
          <div className="pt-2 flex items-center justify-center">
            <a
              href="/sulthan-umroh.apk"
              download="sulthan-umroh.apk"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-amber-300 hover:text-white transition-all shadow-xs"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download Aplikasi Android Resmi (.APK)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-3xl mx-auto px-4 -mt-4">
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs flex items-center gap-2 shadow-md">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {registration && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-5">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  Nomor Registrasi:
                </span>
                <h3 className="text-xl font-mono font-black text-emerald-900">
                  {registration.regNumber}
                </h3>
                <p className="text-xs text-slate-600">
                  ID Jamaah: <strong>{registration.idJamaah}</strong> • {registration.fullName}
                </p>
              </div>

              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${
                    registration.status === "PAID"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : registration.status === "PAYMENT_PENDING"
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : registration.status === "VERIFIED"
                      ? "bg-blue-100 text-blue-800 border border-blue-300"
                      : "bg-slate-100 text-slate-700 border border-slate-300"
                  }`}
                >
                  {registration.status === "PAID"
                    ? "✅ LUNAS DP & RESMI TERDAFTAR"
                    : registration.status === "PAYMENT_PENDING"
                    ? "⏳ MENUNGGU VERIFIKASI PEMBAYARAN"
                    : registration.status === "VERIFIED"
                    ? "💳 DIVERIFIKASI - MENUNGGU DP"
                    : "📝 PENDAFTARAN BARU DITERIMA"}
                </span>
              </div>
            </div>

            {/* Stepper Progress Visual */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                {[
                  { step: 1, label: "1. Diterima", statusKey: "NEW" },
                  { step: 2, label: "2. Verifikasi", statusKey: "VERIFIED" },
                  { step: 3, label: "3. Cek Bayar", statusKey: "PAYMENT_PENDING" },
                  { step: 4, label: "4. Lunas DP", statusKey: "PAID" },
                ].map((s) => {
                  const currentStepNum = getStepNumber(registration.status);
                  const isDone = currentStepNum >= s.step;
                  const isCurrent = currentStepNum === s.step;

                  return (
                    <div key={s.step} className="space-y-1.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-black transition-all ${
                          isDone
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-slate-200 text-slate-500"
                        } ${isCurrent ? "ring-4 ring-emerald-600/20" : ""}`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                      </div>
                      <p className={isDone ? "text-emerald-950 font-black" : "text-slate-400"}>
                        {s.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Package & Pilgrim Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Paket Pilihan:</span>
                <h4 className="font-black text-slate-900 text-sm">{registration.package?.name}</h4>
                <p className="text-slate-600">
                  🛫 Berangkat: <strong>{formatDate(registration.package?.departureDate, "dd MMMM yyyy")}</strong>
                </p>
                <p className="text-slate-600">
                  🏨 Hotel: {registration.package?.hotelMakkah} & {registration.package?.hotelMadinah}
                </p>
                <p className="text-slate-600">
                  🛏️ Kamar: <strong>{registration.roomType}</strong> ({formatCurrency(registration.pricePackage)})
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Data Jamaah:</span>
                <p className="text-slate-900 font-bold">{registration.fullName} ({registration.gender === "MALE" ? "Laki-Laki" : "Perempuan"})</p>
                <p className="text-slate-600">NIK: {registration.nik}</p>
                <p className="text-slate-600">WhatsApp: {registration.phone}</p>
                <p className="text-slate-600">Kota: {registration.city || "Tebing Tinggi"}</p>
              </div>
            </div>

            {/* IF STATUS: VERIFIED -> SHOW INVOICE & BANK TRANSFER */}
            {registration.status === "VERIFIED" && (
              <div className="border-2 border-emerald-600 rounded-3xl p-6 bg-gradient-to-br from-emerald-50 to-white space-y-4">
                <div className="flex items-center gap-2 text-emerald-950">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-base font-black uppercase">Instruksi Pembayaran Uang Muka (DP)</h4>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-200 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Nominal Tagihan DP:</span>
                    <h3 className="text-xl font-black text-emerald-800">
                      {formatCurrency(registration.dpAmount || 5000000)}
                    </h3>
                    <p className="text-[10px] text-slate-500">No. Invoice: {registration.invoiceNumber || "INV-DP"}</p>
                  </div>
                  <span className="px-3 py-1 rounded bg-amber-100 text-amber-800 font-bold text-xs">
                    Belum Dibayar
                  </span>
                </div>

                {/* Bank Accounts */}
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-slate-700">Silakan transfer ke salah satu rekening resmi travel kami:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">Bank Mandiri: 107-00-7777-2020</p>
                        <p className="text-[10px] text-slate-500">a.n SULTHAN HARAMAIN</p>
                      </div>
                      <button
                        onClick={() => copyText("1070077772020", "mandiri")}
                        className="p-1.5 text-xs text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        {copiedBank === "mandiri" ? "Disalin!" : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">Bank BSI: 7123-4567-89</p>
                        <p className="text-[10px] text-slate-500">a.n BAROKAH SULTHAN</p>
                      </div>
                      <button
                        onClick={() => copyText("7123456789", "bsi")}
                        className="p-1.5 text-xs text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        {copiedBank === "bsi" ? "Disalin!" : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Upload Bukti Transfer */}
                <div className="pt-2 space-y-3">
                  <label className="font-bold text-slate-900 text-xs block">
                    Upload Foto / Bukti Struk Transfer:
                  </label>
                  {proofPreview && (
                    <div className="max-h-48 overflow-hidden rounded-xl border border-slate-300 bg-black flex items-center justify-center">
                      <img src={proofPreview} alt="Bukti Transfer" className="max-h-48 object-contain" />
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofUpload}
                      className="text-xs file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                    />
                    {proofBase64 && (
                      <button
                        onClick={submitProof}
                        disabled={uploadingProof}
                        className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        {uploadingProof ? "Mengirim..." : "Kirim Bukti Pembayaran"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* IF STATUS: PAYMENT_PENDING */}
            {registration.status === "PAYMENT_PENDING" && (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                  <Clock className="w-5 h-5 text-amber-600 animate-spin" />
                  Bukti Pembayaran Sedang Diverifikasi
                </div>
                <p>
                  Terima kasih! Bukti transfer DP Anda telah tersimpan dan sedang dicek oleh bagian keuangan kantor pusat. Kwitansi resmi lunas DP akan otomatis terbit setelah verifikasi selesai.
                </p>
              </div>
            )}

            {/* INTERACTIVE PACKING CHECKLIST FOR ANDROID / MOBILE USERS */}
            {(() => {
              const items = packingGender === "MALE" ? MEN_PACKING_LIST : WOMEN_PACKING_LIST;
              const totalItems = items.length;
              const doneCount = items.filter((it) => !!checkedPackingItems[it.id]).length;
              const percent = Math.round((doneCount / totalItems) * 100);

              return (
                <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-xs bg-white">
                  {/* Card Header */}
                  <div
                    onClick={() => setIsPackingOpen(!isPackingOpen)}
                    className="p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                        <Boxes className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                          Checklist Packing Bawaan Jamaah
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        </h4>
                        <p className="text-[11px] text-emerald-200">
                          {doneCount} dari {totalItems} item siap ({percent}%) • Simpan otomatis di HP
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="hidden sm:inline text-xs font-black bg-white/10 px-3 py-1 rounded-full border border-white/20">
                        {percent === 100 ? "✅ Siap Berangkat!" : `${percent}% Siap`}
                      </span>
                      {isPackingOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        percent === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-amber-400 to-emerald-600"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {isPackingOpen && (
                    <div className="p-5 space-y-4 text-xs">
                      {/* Gender Selector Switch */}
                      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
                          <button
                            type="button"
                            onClick={() => setPackingGender("FEMALE")}
                            className={`py-1.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                              packingGender === "FEMALE"
                                ? "bg-rose-500 text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            🧕 Perempuan ({WOMEN_PACKING_LIST.length} Item)
                          </button>
                          <button
                            type="button"
                            onClick={() => setPackingGender("MALE")}
                            className={`py-1.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                              packingGender === "MALE"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            👨 Laki-Laki ({MEN_PACKING_LIST.length} Item)
                          </button>
                        </div>

                        {doneCount > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Reset seluruh centang checklist persiapan?")) {
                                setCheckedPackingItems({});
                                if (typeof window !== "undefined" && registration) {
                                  localStorage.removeItem(`packing_${registration.id || registration.regNumber}`);
                                }
                              }
                            }}
                            className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                          >
                            Reset Centang
                          </button>
                        )}
                      </div>

                      {/* Items List (Touch Optimized for Android) */}
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {items.map((it, idx) => {
                          const isChecked = !!checkedPackingItems[it.id];
                          return (
                            <div
                              key={it.id}
                              onClick={() => togglePackingItem(it.id)}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                                isChecked
                                  ? "bg-emerald-50/70 border-emerald-200 text-slate-600"
                                  : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-900"
                              }`}
                            >
                              <button
                                type="button"
                                className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                                  isChecked
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "border-2 border-slate-300 bg-white"
                                }`}
                              >
                                {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`font-bold text-xs ${
                                      isChecked ? "line-through text-slate-400" : "text-slate-900"
                                    }`}
                                  >
                                    {idx + 1}. {it.name}
                                  </span>
                                  {it.isEssential && (
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                      Wajib
                                    </span>
                                  )}
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-600">
                                    {it.category}
                                  </span>
                                </div>
                                {it.notes && (
                                  <p className={`text-[11px] mt-0.5 ${isChecked ? "text-slate-400" : "text-slate-500"}`}>
                                    {it.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Flight Guidelines Callout */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] space-y-1 text-slate-600">
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Plane className="w-3.5 h-3.5 text-emerald-600" />
                          Tips Packing Koper Bandara:
                        </p>
                        <p>• Cairan/skincare/spray &gt; 100 ml <strong>wajib</strong> di Koper Bagasi Besar.</p>
                        <p>• Paspor, buku vaksin, obat pribadi darurat, HP & Powerbank <strong>wajib</strong> di Tas Kabin.</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
