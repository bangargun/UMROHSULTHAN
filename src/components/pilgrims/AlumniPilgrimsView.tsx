"use client";

import React, { useState, useMemo } from "react";
import {
  Award,
  Search,
  Filter,
  Calendar,
  Plane,
  Building2,
  Phone,
  Printer,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  Download,
  Eye,
  FileText,
  UserCheck,
  ShieldCheck,
  X,
  QrCode,
  MapPin,
  HelpCircle,
  Plus,
  ArrowRight,
  RefreshCw,
  Users,
  Info,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AlumniPilgrimsViewProps {
  pilgrims: any[];
  packages: any[];
  onRefresh: () => void;
  onNavigateTab?: (tab: string, filter?: string) => void;
}

export default function AlumniPilgrimsView({
  pilgrims,
  packages,
  onRefresh,
  onNavigateTab,
}: AlumniPilgrimsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [selectedPilgrimForCert, setSelectedPilgrimForCert] = useState<any | null>(null);
  const [selectedPilgrimForWA, setSelectedPilgrimForWA] = useState<any | null>(null);
  const [waMessageType, setWaMessageType] = useState<"MABRUR" | "TESTIMONI" | "REPEAT_ORDER">("MABRUR");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isAddAlumniOpen, setIsAddAlumniOpen] = useState(false);

  // Form state for manual alumni entry
  const [alumniForm, setAlumniForm] = useState({
    name: "",
    nik: "",
    passportNumber: "",
    phone: "",
    city: "",
    gender: "MALE",
    packageId: "",
    status: "RETURNED",
  });

  // Filter only departed and returned / past pilgrims
  const alumniPilgrims = useMemo(() => {
    return pilgrims.filter((p) => {
      const isStatusDeparted = p.status === "DEPARTED" || p.status === "RETURNED";
      const isPastDate = p.package?.departureDate && new Date(p.package.departureDate) < new Date();
      return isStatusDeparted || isPastDate;
    });
  }, [pilgrims]);

  // Extract unique years from departure dates
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    alumniPilgrims.forEach((p) => {
      if (p.package?.departureDate) {
        years.add(new Date(p.package.departureDate).getFullYear().toString());
      }
    });
    return Array.from(years).sort().reverse();
  }, [alumniPilgrims]);

  // Filter logic
  const filteredPilgrims = useMemo(() => {
    return alumniPilgrims.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nik.includes(searchTerm) ||
        (p.passportNumber && p.passportNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.city && p.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.phone.includes(searchTerm);

      if (!matchSearch) return false;

      if (selectedStatus !== "ALL") {
        if (selectedStatus === "DEPARTED" && p.status !== "DEPARTED") return false;
        if (selectedStatus === "RETURNED" && p.status !== "RETURNED" && p.status === "DEPARTED") return false;
      }

      if (selectedPackageId !== "ALL" && p.packageId !== selectedPackageId) return false;

      if (selectedYear !== "ALL") {
        if (!p.package?.departureDate) return false;
        const year = new Date(p.package.departureDate).getFullYear().toString();
        if (year !== selectedYear) return false;
      }

      return true;
    });
  }, [alumniPilgrims, searchTerm, selectedYear, selectedPackageId, selectedStatus]);

  // KPI Metrics
  const totalAlumni = alumniPilgrims.filter((p) => p.status === "RETURNED" || !p.status || p.status !== "DEPARTED").length;
  const totalInHolyLand = alumniPilgrims.filter((p) => p.status === "DEPARTED").length;
  const uniquePackagesCount = new Set(alumniPilgrims.map((p) => p.packageId)).size;
  const uniqueCitiesCount = new Set(alumniPilgrims.map((p) => p.city).filter(Boolean)).size;

  // Handle Status Change
  const handleUpdateStatus = async (pilgrimId: string, newStatus: string) => {
    setUpdatingId(pilgrimId);
    try {
      const res = await fetch(`/api/pilgrims/${pilgrimId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onRefresh();
      } else {
        alert("Gagal memperbarui status keberangkatan");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan");
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper to determine passport expiry status (< 1 year or < 6 months)
  const getPassportExpiryStatus = (expiryDateStr: string | null | undefined) => {
    if (!expiryDateStr) return null;
    const expDate = new Date(expiryDateStr);
    if (isNaN(expDate.getTime())) return null;

    const targetDate = new Date();
    const diffDays = Math.ceil((expDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        badgeClass: "bg-rose-100 text-rose-900 border-rose-300 font-bold",
        shortBadge: "⛔ Kadaluarsa",
      };
    } else if (diffDays <= 180) {
      return {
        badgeClass: "bg-rose-100 text-rose-900 border-rose-300 font-black animate-pulse",
        shortBadge: `⛔ Exp < 6 Bln (${diffDays} hr)`,
      };
    } else if (diffDays <= 365) {
      return {
        badgeClass: "bg-amber-100 text-amber-950 border-amber-300 font-bold",
        shortBadge: `⚠️ Saran Perpanjang (< 1 Thn)`,
      };
    }

    return null;
  };

  // Handle manual alumni submission
  const handleSaveAlumni = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alumniForm.packageId && packages.length > 0) {
      alumniForm.packageId = packages[0].id;
    }

    try {
      const res = await fetch("/api/pilgrims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alumniForm),
      });

      if (res.ok) {
        alert(`Data alumni "${alumniForm.name}" berhasil ditambahkan ke arsip!`);
        setIsAddAlumniOpen(false);
        setAlumniForm({
          name: "",
          nik: "",
          passportNumber: "",
          phone: "",
          city: "",
          gender: "MALE",
          packageId: "",
          status: "RETURNED",
        });
        onRefresh();
      } else {
        const err = await res.json();
        alert(`Gagal menambah data: ${err.error || "Terjadi kesalahan"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan data alumni");
    }
  };

  // Generate WhatsApp Message Link
  const getWhatsAppLink = (p: any, type: string) => {
    const cleanPhone = p.phone.replace(/[^0-9]/g, "").replace(/^0/, "62");
    let message = "";

    if (type === "MABRUR") {
      message = `Assalamu'alaikum Warahmatullahi Wabarakatuh, Bapak/Ibu *${p.name}*.\n\nAlhamdulillah, segenap pimpinan & staf *PT SULTHAN HARAMAIN TOUR & TRAVEL* mengucapkan selamat atas terselesaikannya ibadah Umroh bersama program *${p.package?.name || "Umroh Sulthan"}*.\n\nSemoga Allah SWT menerima seluruh amal ibadah, tawaf, sa'i, serta doa-doa Bapak/Ibu, dan menganugerahkan predikat *Umroh yang Mabrur/Mabrurah*. Aamiin Ya Rabbal 'Alamin 🤲🕋\n\nJazakumullah Khairan Katsiran atas kepercayaannya.`;
    } else if (type === "TESTIMONI") {
      message = `Assalamu'alaikum Warahmatullahi Wabarakatuh, Bapak/Ibu *${p.name}*.\n\nBagaimana kabar Bapak/Ibu pasca kepulangan dari Tanah Suci bersama *Sulthan Haramain Travel*?\n\nKami sangat berterima kasih atas kebersamaan dalam program *${p.package?.name}*. Demi peningkatan kualitas pelayanan kami, mohon berkenan memberikan ulasan/testimoni singkat serta saran melalui balasan pesan ini.\n\nTerima kasih banyak atas dukungannya! 🙏✨`;
    } else {
      message = `Assalamu'alaikum Warahmatullahi Wabarakatuh, Bapak/Ibu *${p.name}* (Alumni Jamaah Sulthan Haramain).\n\nKabar gembira khusus untuk Alumni & Keluarga! PT Sulthan Haramain Tour & Travel membuka pendaftaran *Program Umroh Musim Baru & Haji Khusus* dengan diskon khusus alumni dan kemudahan fasilitas VIP.\n\nApakah ada kerabat atau keluarga yang berencana menunaikan ibadah umroh dalam waktu dekat? Silakan hubungi kami untuk mendapatkan kuota terbaik. Terima kasih! 🕋✨`;
    }

    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
            <Award className="w-3.5 h-3.5" /> ARSIP & DATABASE ALUMNI KEBERANGKATAN
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-1">
            Database Jamaah Sudah Berangkat & Alumni
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Arsip lengkap riwayat seluruh jamaah yang telah menunaikan ibadah Umroh dan Haji bersama PT Sulthan Haramain Tour & Travel. Rujukan CRM, repeat order, penerbitan piagam sertifikat, dan silaturahmi alumni.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 z-10">
          <button
            onClick={() => setIsAddAlumniOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> + Input Arsip Jamaah
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all"
          >
            <Printer className="w-4 h-4" /> Cetak Manifest
          </button>
        </div>
      </div>

      {/* EXPLANATION BOX: DARI MANA DATA INI MASUK? */}
      {showInfoBanner && (
        <div className="bg-gradient-to-r from-amber-50 via-emerald-50/40 to-blue-50/50 p-5 rounded-3xl border border-amber-200/80 shadow-xs relative">
          <button
            onClick={() => setShowInfoBanner(false)}
            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60"
            title="Tutup Panduan"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-2 text-xs flex-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                💡 Dari Mana Sumber Data di Halaman Ini Masuk?
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Halaman ini adalah <strong>arsip historis</strong> khusus bagi jamaah yang telah diberangkatkan. Data masuk ke halaman ini melalui 3 cara:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="bg-white/80 p-3 rounded-2xl border border-amber-200/60 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                    <span className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center text-[10px]">1</span>
                    <span>Otomatis via Hari Keberangkatan</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Calon jamaah yang tanggal keberangkatan / kepulangan paketnya telah berlalu otomatis masuk ke arsip alumni.
                  </p>
                </div>

                <div className="bg-white/80 p-3 rounded-2xl border border-emerald-200/60 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <span className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px]">2</span>
                    <span>Pembaruan Status Jamaah</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Di menu <strong>"Database Calon Jamaah"</strong>, saat status diubah menjadi <em>"Di Tanah Suci (DEPARTED)"</em> atau <em>"Selesai / Pulang (RETURNED)"</em>.
                  </p>
                </div>

                <div className="bg-white/80 p-3 rounded-2xl border border-blue-200/60 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-blue-800 font-bold">
                    <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">3</span>
                    <span>Input Data Jamaah Lampau</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Gunakan tombol <strong>"+ Input Arsip Jamaah"</strong> di atas untuk memasukkan data kepulangan atau arsip jamaah alumni secara manual.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Alumni Selesai Umroh</p>
            <p className="text-xl font-black text-slate-900">{totalAlumni} <span className="text-xs font-normal text-slate-400">Pax</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Sedang di Arab Saudi</p>
            <p className="text-xl font-black text-amber-800">{totalInHolyLand} <span className="text-xs font-normal text-slate-400">Pax</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Kloter / Rombongan</p>
            <p className="text-xl font-black text-purple-900">{uniquePackagesCount} <span className="text-xs font-normal text-slate-400">Paket</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Jangkauan Kota Asal</p>
            <p className="text-xl font-black text-blue-900">{uniqueCitiesCount} <span className="text-xs font-normal text-slate-400">Kota</span></p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama, NIK, paspor, kota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-700"
            >
              <option value="ALL">Semua Status Keberangkatan</option>
              <option value="RETURNED">🕋 Sudah Selesai & Alumni Mabrur</option>
              <option value="DEPARTED">✈️ Sedang di Tanah Suci (Berangkat)</option>
            </select>
          </div>

          {/* Filter Year */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-700"
            >
              <option value="ALL">Semua Tahun Keberangkatan</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Package */}
          <div>
            <select
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-700 truncate"
            >
              <option value="ALL">Semua Paket & Kloter</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.code} - {pkg.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <p>
            Menampilkan <strong>{filteredPilgrims.length}</strong> data alumni jamaah dari total {alumniPilgrims.length} riwayat keberangkatan.
          </p>
          {(searchTerm || selectedYear !== "ALL" || selectedPackageId !== "ALL" || selectedStatus !== "ALL") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedYear("ALL");
                setSelectedPackageId("ALL");
                setSelectedStatus("ALL");
              }}
              className="text-emerald-600 font-bold hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">1. Nama Jamaah & NIK</th>
                <th className="py-3.5 px-4">2. Program Paket & Tanggal</th>
                <th className="py-3.5 px-4">3. Paspor & TTL</th>
                <th className="py-3.5 px-4">4. Kamar & Seragam</th>
                <th className="py-3.5 px-4 text-center">5. Status Keberangkatan</th>
                <th className="py-3.5 px-4 text-center w-36">6. Aksi Khusus Alumni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredPilgrims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
                      <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Award className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 text-sm">Belum Ada Data Jamaah Alumni</p>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Data akan otomatis terisi saat calon jamaah telah selesai melaksanakan ibadah, atau Anda dapat menginput arsip jamaah lampau secara manual.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => setIsAddAlumniOpen(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" /> + Input Arsip Manual
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPilgrims.map((p) => {
                  const isDeparted = p.status === "DEPARTED";
                  const expInfo = getPassportExpiryStatus(p.passportExpiry);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. NAMA JAMAAH & NIK */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{p.name}</p>
                            <p className="font-mono text-[11px] text-slate-500">NIK: {p.nik}</p>
                            <p className="text-[10px] text-slate-400">
                              {p.gender === "MALE" ? "Laki-laki" : "Perempuan"} • {p.phone}
                            </p>
                            {p.city && (
                              <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] bg-slate-100 text-slate-600 font-bold">
                                📍 {p.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. PROGRAM PAKET & TANGGAL */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-mono text-[10px] font-bold bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200">
                            {p.package?.code || "PAKET"}
                          </span>
                          <p className="font-bold text-slate-900 text-xs mt-1">{p.package?.name || "-"}</p>
                          <p className="text-[11px] text-slate-600">
                            🗓️ {p.package?.departureDate ? formatDate(p.package.departureDate, "dd MMM yyyy") : "-"} s/d {p.package?.returnDate ? formatDate(p.package.returnDate, "dd MMM yyyy") : "-"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            ✈️ {p.package?.airline || "-"} • 🏨 {p.package?.hotelMakkah?.split(" ")[0] || "-"}
                          </p>
                        </div>
                      </td>

                      {/* 3. PASPOR & TTL */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-slate-900">
                              {p.passportNumber || <span className="text-slate-400">-</span>}
                            </span>
                            {expInfo && (
                              <span className={`inline-flex items-center text-[9px] px-1.5 py-0.2 rounded border ${expInfo.badgeClass}`}>
                                {expInfo.shortBadge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Exp: {p.passportExpiry ? formatDate(p.passportExpiry, "dd/MM/yyyy") : "-"}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {p.placeOfBirth || "-"}, {p.dateOfBirth ? formatDate(p.dateOfBirth, "dd/MM/yyyy") : "-"}
                          </p>
                        </div>
                      </td>

                      {/* 4. KAMAR & SERAGAM */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                            Room {p.roomType || "QUAD"}
                          </span>
                          <div>
                            <span className="text-[10px] text-slate-500">
                              Size: <strong>{p.uniformSize || "L"}</strong> • Goldar: {p.bloodType === "TIDAK_TAHU" ? "Tidak Tahu" : (p.bloodType || "-")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 5. STATUS KEBERANGKATAN */}
                      <td className="py-3.5 px-4 text-center">
                        {isDeparted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 animate-pulse">
                            <Plane className="w-3 h-3 text-amber-600" /> Sedang di Tanah Suci
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <Award className="w-3 h-3 text-emerald-600" /> Alumni Umroh Mabrur
                          </span>
                        )}

                        {/* Quick Toggle Status */}
                        <div className="mt-1.5">
                          <button
                            disabled={updatingId === p.id}
                            onClick={() => handleUpdateStatus(p.id, isDeparted ? "RETURNED" : "DEPARTED")}
                            className="text-[9px] font-bold text-slate-500 hover:text-emerald-700 underline"
                          >
                            {isDeparted ? "Tandai Telah Pulang (Alumni)" : "Tandai Sedang di Arab Saudi"}
                          </button>
                        </div>
                      </td>

                      {/* 6. AKSI KHUSUS ALUMNI */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Cetak Sertifikat */}
                          <button
                            onClick={() => setSelectedPilgrimForCert(p)}
                            className="p-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 transition-all shadow-xs"
                            title="Cetak Piagam Sertifikat Umroh Mabrur"
                          >
                            <Award className="w-4 h-4 text-amber-700" />
                          </button>

                          {/* Kirim Pesan WA */}
                          <button
                            onClick={() => setSelectedPilgrimForWA(p)}
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-all shadow-xs"
                            title="Kirim Pesan Silaturahmi / Testimoni WhatsApp"
                          >
                            <Send className="w-4 h-4 text-emerald-700" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: INPUT ARSIP JAMAAH LAMPAU */}
      {isAddAlumniOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">
                  Input Arsip Jamaah Lampau / Alumni
                </h3>
              </div>
              <button
                onClick={() => setIsAddAlumniOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAlumni} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nama Lengkap Jamaah *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. H. Ahmad Sudirman, S.H."
                  value={alumniForm.name}
                  onChange={(e) => setAlumniForm({ ...alumniForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">NIK (KTP) *</label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="16 digit NIK"
                    value={alumniForm.nik}
                    onChange={(e) => setAlumniForm({ ...alumniForm, nik: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Nomor Paspor</label>
                  <input
                    type="text"
                    placeholder="e.g. C1234567"
                    value={alumniForm.passportNumber}
                    onChange={(e) => setAlumniForm({ ...alumniForm, passportNumber: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">No. WhatsApp / HP *</label>
                  <input
                    type="tel"
                    required
                    placeholder="08123456789"
                    value={alumniForm.phone}
                    onChange={(e) => setAlumniForm({ ...alumniForm, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Kota Domisili</label>
                  <input
                    type="text"
                    placeholder="e.g. Jakarta Selatan"
                    value={alumniForm.city}
                    onChange={(e) => setAlumniForm({ ...alumniForm, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Jenis Kelamin</label>
                  <select
                    value={alumniForm.gender}
                    onChange={(e) => setAlumniForm({ ...alumniForm, gender: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                  >
                    <option value="MALE">Laki-laki</option>
                    <option value="FEMALE">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Status Arsip</label>
                  <select
                    value={alumniForm.status}
                    onChange={(e) => setAlumniForm({ ...alumniForm, status: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-emerald-800"
                  >
                    <option value="RETURNED">🕋 Sudah Selesai (Alumni Mabrur)</option>
                    <option value="DEPARTED">✈️ Sedang Berangkat di Arab Saudi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Pilih Paket / Kloter Riwayat</label>
                <select
                  value={alumniForm.packageId}
                  onChange={(e) => setAlumniForm({ ...alumniForm, packageId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.code} - {pkg.name} ({formatDate(pkg.departureDate, "dd MMM yyyy")})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddAlumniOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-xs"
                >
                  Simpan ke Arsip Alumni
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: PREVIEW & PRINT PIAGAM SERTIFIKAT UMROH MABRUR */}
      {selectedPilgrimForCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 no-print">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">
                  Piagam Sertifikat Penghargaan Ibadah Umroh
                </h3>
              </div>
              <button
                onClick={() => setSelectedPilgrimForCert(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PRINTABLE CERTIFICATE CARD */}
            <div className="p-8 border-8 border-double border-amber-600/60 rounded-2xl bg-radial from-amber-50/40 via-white to-amber-50/20 text-center space-y-5 relative shadow-inner">
              {/* Corner Ornaments */}
              <div className="absolute top-3 left-3 text-amber-600 text-xl">۞</div>
              <div className="absolute top-3 right-3 text-amber-600 text-xl">۞</div>
              <div className="absolute bottom-3 left-3 text-amber-600 text-xl">۞</div>
              <div className="absolute bottom-3 right-3 text-amber-600 text-xl">۞</div>

              {/* Header Logo */}
              <div className="space-y-1">
                <img
                  src="/sulthan-haramain-logo.jpg"
                  alt="Logo Sulthan Haramain"
                  className="h-16 mx-auto object-contain"
                />
                <h2 className="text-xl font-black text-slate-900 tracking-wider uppercase mt-2">
                  PT SULTHAN HARAMAIN TOUR & TRAVEL
                </h2>
                <p className="text-[10px] text-amber-800 font-bold">
                  IZIN RESMI PPIU KEMENAG RI NO. U.412 TAHUN 2022
                </p>
              </div>

              {/* Title */}
              <div className="py-2 border-y border-amber-300 max-w-md mx-auto">
                <h1 className="text-2xl font-serif font-black tracking-widest text-amber-900 uppercase">
                  SERTIFIKAT UMROH
                </h1>
                <p className="text-[10px] text-slate-500 font-mono">
                  NOMOR: SH/ALM/{new Date().getFullYear()}/{selectedPilgrimForCert.id.slice(0, 8).toUpperCase()}
                </p>
              </div>

              {/* Recipient */}
              <div className="space-y-1.5">
                <p className="text-xs text-slate-600 italic">Diberikan dengan penuh rasa syukur kepada:</p>
                <h3 className="text-2xl font-serif font-bold text-slate-900 underline decoration-amber-500 underline-offset-4">
                  {selectedPilgrimForCert.name}
                </h3>
                <p className="text-xs font-mono text-slate-500">
                  Nomor Paspor: {selectedPilgrimForCert.passportNumber || "-"} • NIK: {selectedPilgrimForCert.nik}
                </p>
              </div>

              {/* Body Text */}
              <p className="text-xs text-slate-700 max-w-lg mx-auto leading-relaxed">
                Telah menyelesaikan seluruh rangkaian ibadah Umroh dan Ziarah di Tanah Suci Makkah Al-Mukarramah & Madinah Al-Munawwarah bersama program <strong>{selectedPilgrimForCert.package?.name}</strong> pada tanggal <strong>{selectedPilgrimForCert.package?.departureDate ? formatDate(selectedPilgrimForCert.package.departureDate, "dd MMMM yyyy") : "-"}</strong>.
              </p>
              <p className="text-xs font-serif italic text-amber-900 font-bold">
                "Semoga Allah SWT menerima amal ibadah dan mengaruniakan Umroh yang Mabrur/Mabrurah."
              </p>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <p className="text-slate-500 text-[10px]">Pembimbing Ibadah (Muthawwif)</p>
                  <div className="h-14 flex items-end justify-center">
                    <p className="font-serif font-bold text-slate-900 border-b border-slate-400 pb-0.5 px-4">
                      Ustadz Ahmad Fauzi, Lc.
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px]">Direktur Utama Travel</p>
                  <div className="h-14 flex items-end justify-center">
                    <p className="font-serif font-bold text-slate-900 border-b border-slate-400 pb-0.5 px-4">
                      H. Sulthan Syarif, Lc., M.A.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 no-print">
              <button
                onClick={() => setSelectedPilgrimForCert(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm"
              >
                <Printer className="w-4 h-4" /> Cetak Piagam Sertifikat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: WHATSAPP SILATURAHMI & REPEAT ORDER */}
      {selectedPilgrimForWA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Kirim Pesan WhatsApp ke Alumni
                </h3>
              </div>
              <button onClick={() => setSelectedPilgrimForWA(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <p className="font-bold text-slate-900">{selectedPilgrimForWA.name}</p>
              <p className="text-slate-500 font-mono">📱 {selectedPilgrimForWA.phone}</p>
              <p className="text-slate-500">Program: {selectedPilgrimForWA.package?.name}</p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700">Pilih Template Pesan:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "MABRUR", label: "🤲 Doa Mabrur" },
                  { id: "TESTIMONI", label: "⭐ Ulasan/Review" },
                  { id: "REPEAT_ORDER", label: "🕋 Promo Umroh Baru" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setWaMessageType(item.id as any)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                      waMessageType === item.id
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedPilgrimForWA(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Batal
              </button>
              <a
                href={getWhatsAppLink(selectedPilgrimForWA, waMessageType)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> Buka di WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
