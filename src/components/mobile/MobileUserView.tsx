"use client";

import React, { useState } from "react";
import {
  Smartphone,
  Plane,
  CreditCard,
  FileCheck2,
  Boxes,
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  Phone,
  MessageSquare,
  Sparkles,
  Download,
  BookOpen,
  User,
  Shield,
  ArrowRight,
  Plus,
  Compass,
  MapPin,
  Volume2,
  VolumeX,
  AlertTriangle,
  Send,
  Navigation,
  Headphones,
  Hotel,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusBadge } from "@/lib/utils";

interface MobileUserViewProps {
  pilgrims: any[];
  packages: any[];
  equipment: any[];
  onRefresh: () => void;
}

export default function MobileUserView({ pilgrims, packages, equipment, onRefresh }: MobileUserViewProps) {
  const [selectedPilgrimId, setSelectedPilgrimId] = useState(pilgrims[0]?.id || "");
  const [activeMobileTab, setActiveMobileTab] = useState<"HOME" | "HOLY_LAND" | "PAYMENT" | "DOCS" | "LOGISTICS" | "MARKETING">("HOME");
  const [deviceFrame, setDeviceFrame] = useState(true);

  // Holy Land states
  const [playingDoaId, setPlayingDoaId] = useState<string | null>(null);
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [activeCityTab, setActiveCityTab] = useState<"MAKKAH" | "MADINAH">("MAKKAH");

  // Marketing fast lead form
  const [leadForm, setLeadForm] = useState({
    name: "",
    phone: "",
    city: "",
    notes: "",
  });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  const currentPilgrim = pilgrims.find((p) => p.id === selectedPilgrimId) || pilgrims[0];
  const pkg = currentPilgrim?.package;

  // Calculate days to departure
  const departureDate = pkg?.departureDate ? new Date(pkg.departureDate) : new Date();
  const diffDays = Math.ceil((departureDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const invoices = currentPilgrim?.invoices || [];
  const reqs = currentPilgrim?.requirements || [];
  const handovers = currentPilgrim?.handovers || [];

  const totalInvoiced = invoices.reduce((acc: number, item: any) => acc + item.amount, 0);
  const totalPaid = invoices.filter((i: any) => i.status === "PAID").reduce((acc: number, item: any) => acc + item.amount, 0);
  const totalRemaining = totalInvoiced - totalPaid;

  // Doa Manasik Audio List
  const doaList = [
    {
      id: "doa-1",
      title: "1. Niat Ihram Umroh di Miqat",
      arab: "لَبَّيْكَ اللَّهُمَّ عُمْرَةً",
      latin: "Labbaikallaahumma 'umratan",
      arti: "Aku penuhi panggilan-Mu ya Allah untuk melaksanakan ibadah umroh.",
      duration: "0:45",
    },
    {
      id: "doa-2",
      title: "2. Doa Talbiyah Sepanjang Perjalanan",
      arab: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ لَا شَرِيكَ لَكَ",
      latin: "Labbaikallaahumma labbaik, labbaika laa syariika laka labbaik...",
      arti: "Aku datang memenuhi panggilan-Mu ya Allah, tidak ada sekutu bagi-Mu...",
      duration: "1:30",
    },
    {
      id: "doa-3",
      title: "3. Doa Masuk Masjidil Haram & Melihat Ka'bah",
      arab: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، فَحَيِّنَا رَبَّنَا بِالسَّلَامِ",
      latin: "Allaahumma antas salaam wa minkas salaam fa hayyinaa rabbanaa bis salaam...",
      arti: "Ya Allah, Engkaulah sumber keselamatan, hidupkanlah kami dengan keselamatan.",
      duration: "1:15",
    },
    {
      id: "doa-4",
      title: "4. Doa Tawaf Putaran 1 - 7 (Di antara Rukun Yamani & Hajar Aswad)",
      arab: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
      latin: "Rabbanaa aatinaa fid dunyaa hasanah wa fil aakhirati hasanah wa qinaa 'adzaaban naar.",
      arti: "Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat, dan lindungilah kami dari siksa neraka.",
      duration: "2:10",
    },
    {
      id: "doa-5",
      title: "5. Doa Sai di Bukit Shafa & Marwah",
      arab: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ، أَبْدَأُ بِمَا بَدَأَ اللَّهُ بِهِ",
      latin: "Innash shafaa wal marwata min sya'aa'irillaah, abda'u bimaa bada'allaahu bih.",
      arti: "Sesungguhnya Shafa dan Marwah adalah sebagian dari syiar Allah...",
      duration: "1:40",
    },
    {
      id: "doa-6",
      title: "6. Doa Minum Air Zamzam",
      arab: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ",
      latin: "Allaahumma inni as'aluka 'ilman naafi'an wa rizqan waasi'an wa syifaa'an min kulli daa'.",
      arti: "Ya Allah, aku memohon kepada-Mu ilmu yang bermanfaat, rezeki yang luas, dan kesembuhan dari segala penyakit.",
      duration: "0:50",
    },
  ];

  const handleTogglePlayDoa = (id: string) => {
    if (playingDoaId === id) {
      setPlayingDoaId(null);
    } else {
      setPlayingDoaId(id);
    }
  };

  const handleSendSOS = () => {
    const muthawwifPhone = "6281234567890";
    const text = encodeURIComponent(
      `🚨 *PANGGILAN DARURAT (SOS) JAMAAH SULTHAN HARAMAIN*\n\n` +
      `👤 *Nama Jamaah*: ${currentPilgrim?.name || "Jamaah"}\n` +
      `🆔 *NIK / Paspor*: ${currentPilgrim?.passportNumber || currentPilgrim?.nik}\n` +
      `📦 *Paket*: ${pkg?.name}\n` +
      `🏨 *Hotel*: ${activeCityTab === "MAKKAH" ? pkg?.hotelMakkah : pkg?.hotelMadinah}\n` +
      `📍 *Status Lokasi*: Terpisah dari rombongan di sekitar Masjidil Haram/Nabawi.\n\n` +
      `Mohon bantuan penjemputan dari Tour Leader / Muthawwif segera!`
    );
    window.open(`https://wa.me/${muthawwifPhone}?text=${text}`, "_blank");
  };

  const handleCreateFastLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLead(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...leadForm,
          source: "AGENT",
          assignedAgent: "Aplikasi Mobile Agent",
        }),
      });
      if (res.ok) {
        alert("Prospek baru berhasil disimpan dari Mobile App!");
        setLeadForm({ name: "", phone: "", city: "", notes: "" });
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingLead(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs no-print">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Portal Mobile Jamaah & Agen (Android / iOS)</h3>
            <p className="text-xs text-slate-500">Aplikasi pendamping jamaah sebelum berangkat hingga di Tanah Suci</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Simulasi Jamaah:</span>
            <select
              value={selectedPilgrimId}
              onChange={(e) => setSelectedPilgrimId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800"
            >
              {pilgrims.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.package?.name?.slice(0, 20)}...)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setDeviceFrame(!deviceFrame)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            {deviceFrame ? "Layar Penuh" : "Bingkai Smartphone"}
          </button>
        </div>
      </div>

      {/* Smartphone Simulator */}
      <div className="flex justify-center items-center py-4">
        <div
          className={`w-full max-w-[390px] bg-slate-900 rounded-[44px] p-3.5 shadow-2xl border-4 border-slate-800 transition-all ${
            deviceFrame ? "ring-12 ring-slate-900/10" : ""
          }`}
        >
          {/* Smartphone Screen Canvas */}
          <div className="w-full bg-slate-50 rounded-[36px] overflow-hidden min-h-[720px] flex flex-col justify-between relative shadow-inner">
            
            {/* Top Status Bar & Notch */}
            <div className="bg-slate-900 text-white pt-2.5 px-6 pb-2 flex justify-between items-center text-[10px] font-semibold">
              <span>09:41</span>
              <div className="h-4 w-28 bg-slate-800 rounded-full mx-auto -mt-1 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
              </div>
              <span className="flex items-center gap-1">5G 100%</span>
            </div>

            {/* Mobile Header Sulthan Haramain */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white p-4 pb-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-white p-0.5 overflow-hidden flex items-center justify-center">
                    <img
                      src="/sulthan-haramain-logo.jpg"
                      alt="Logo Sulthan Haramain"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-black tracking-tight text-white">
                      SULTHAN <span className="text-amber-400">HARAMAIN</span>
                    </h4>
                    <p className="text-[9px] text-amber-200/80 font-medium">Biro Perjalanan Umroh & Haji</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSOSModalOpen(true)}
                  className="px-2.5 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black tracking-wider flex items-center gap-1 shadow-md animate-bounce"
                >
                  <AlertTriangle className="w-3 h-3" /> SOS
                </button>
              </div>

              {/* Pilgrim Active Card */}
              <div className="mt-3 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-amber-200 uppercase font-bold tracking-wider">Jamaah Terdaftar</span>
                  <p className="text-xs font-black text-white">{currentPilgrim?.name}</p>
                  <p className="text-[10px] text-slate-300 font-mono">No. Paspor: {currentPilgrim?.passportNumber || "Proses Berkas"}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400 text-slate-950">
                    {currentPilgrim?.status === "FULLY_PAID" ? "Siap Terbang" : currentPilgrim?.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Body Content */}
            <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto max-h-[510px]">
              
              {/* TAB 1: HOME (Dashboard & Countdown) */}
              {activeMobileTab === "HOME" && (
                <div className="space-y-3">
                  {/* Countdown Keberangkatan */}
                  <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
                    <div className="relative z-10">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-100 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Hitung Mundur Keberangkatan
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <h2 className="text-3xl font-black">{diffDays > 0 ? diffDays : 0}</h2>
                        <span className="text-xs font-bold text-amber-100">Hari Menuju Tanah Suci</span>
                      </div>
                      <p className="text-[11px] text-amber-100/90 mt-1 font-medium">
                        🛫 {pkg?.name} ({formatDate(pkg?.departureDate, "dd MMM yyyy")})
                      </p>
                    </div>
                  </div>

                  {/* Mode Tanah Suci Quick Access Banner */}
                  <button
                    onClick={() => setActiveMobileTab("HOLY_LAND")}
                    className="w-full bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-3 rounded-2xl flex items-center justify-between shadow-sm hover:opacity-95"
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
                        <Compass className="w-4 h-4 text-amber-300" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">Panduan Ibadah di Tanah Suci</p>
                        <p className="text-[10px] text-emerald-200">Audio Doa Tawaf, Peta Hotel & SOS</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-300" />
                  </button>

                  {/* Quick Status Cards Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Status Keuangan */}
                    <div
                      onClick={() => setActiveMobileTab("PAYMENT")}
                      className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-amber-400"
                    >
                      <div className="flex items-center justify-between text-amber-600 mb-1">
                        <CreditCard className="w-4 h-4" />
                        <span className="text-[9px] font-bold uppercase">Tagihan</span>
                      </div>
                      <p className="font-bold text-slate-900">
                        {totalRemaining <= 0 ? "Lunas 100%" : formatCurrency(totalRemaining)}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        {totalRemaining <= 0 ? "Pembayaran selesai" : "Sisa pelunasan"}
                      </p>
                    </div>

                    {/* Status Dokumen */}
                    <div
                      onClick={() => setActiveMobileTab("DOCS")}
                      className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-amber-400"
                    >
                      <div className="flex items-center justify-between text-teal-600 mb-1">
                        <FileCheck2 className="w-4 h-4" />
                        <span className="text-[9px] font-bold uppercase">Dokumen</span>
                      </div>
                      <p className="font-bold text-slate-900">
                        {reqs.filter((r: any) => r.isVerified).length} / {reqs.length || 6}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Syarat terverifikasi</p>
                    </div>
                  </div>

                  {/* Fasilitas Hotel & Maskapai */}
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
                    <h5 className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                      <Hotel className="w-3.5 h-3.5 text-amber-600" /> Fasilitas Paket Sulthan Haramain
                    </h5>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between bg-slate-50 p-2 rounded-xl">
                        <span className="text-slate-500">Makkah:</span>
                        <span className="font-bold text-slate-800">{pkg?.hotelMakkah}</span>
                      </div>
                      <div className="flex justify-between bg-slate-50 p-2 rounded-xl">
                        <span className="text-slate-500">Madinah:</span>
                        <span className="font-bold text-slate-800">{pkg?.hotelMadinah}</span>
                      </div>
                      <div className="flex justify-between bg-slate-50 p-2 rounded-xl">
                        <span className="text-slate-500">Penerbangan:</span>
                        <span className="font-bold text-slate-800">{pkg?.airline}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MODE TANAH SUCI (AUDIO DOA, PETA HOTEL & KIBLAT) */}
              {activeMobileTab === "HOLY_LAND" && (
                <div className="space-y-3 text-xs">
                  {/* City Switcher */}
                  <div className="flex rounded-xl bg-slate-200 p-1">
                    <button
                      onClick={() => setActiveCityTab("MAKKAH")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeCityTab === "MAKKAH" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      🕋 Makkah Al-Mukarramah
                    </button>
                    <button
                      onClick={() => setActiveCityTab("MADINAH")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeCityTab === "MADINAH" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      🕌 Madinah Al-Munawwarah
                    </button>
                  </div>

                  {/* Lokasi Hotel & Navigasi */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] font-bold uppercase text-amber-600">Hotel Menginap Anda</span>
                        <h4 className="font-black text-slate-900 text-xs mt-0.5">
                          {activeCityTab === "MAKKAH" ? pkg?.hotelMakkah : pkg?.hotelMadinah}
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          {activeCityTab === "MAKKAH" ? "Jarak ± 50m ke Pelataran Masjidil Haram" : "Jarak ± 80m ke Pintu 25 Masjid Nabawi"}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        Kamar {currentPilgrim?.roomType}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href={activeCityTab === "MAKKAH" ? "https://maps.google.com/?q=Pullman+Zamzam+Makkah" : "https://maps.google.com/?q=Dallah+Taibah+Madinah"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 bg-amber-500 text-slate-950 font-bold py-2 px-3 rounded-xl text-[11px] shadow-xs"
                      >
                        <Navigation className="w-3.5 h-3.5" /> Peta Navigasi Pulang
                      </a>
                      <button
                        onClick={() => setIsSOSModalOpen(true)}
                        className="inline-flex items-center justify-center gap-1.5 bg-rose-600 text-white font-bold py-2 px-3 rounded-xl text-[11px] shadow-xs"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Tombol SOS Tersesat
                      </button>
                    </div>
                  </div>

                  {/* Audio Doa Manasik Umroh */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Headphones className="w-4 h-4 text-emerald-600" /> Audio Panduan Doa Manasik
                      </h4>
                      <span className="text-[10px] text-slate-400">Teks Arab & Audio</span>
                    </div>

                    <div className="space-y-2">
                      {doaList.map((doa) => {
                        const isPlaying = playingDoaId === doa.id;
                        return (
                          <div
                            key={doa.id}
                            className={`p-2.5 rounded-xl border transition-all ${
                              isPlaying
                                ? "bg-amber-50/80 border-amber-300 ring-1 ring-amber-400"
                                : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 text-[11px]">{doa.title}</span>
                              <button
                                onClick={() => handleTogglePlayDoa(doa.id)}
                                className={`p-1.5 rounded-full ${
                                  isPlaying ? "bg-amber-500 text-slate-950" : "bg-emerald-600 text-white"
                                }`}
                              >
                                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                              </button>
                            </div>

                            <p className="font-serif text-right text-sm font-bold text-slate-900 my-1.5 leading-relaxed">
                              {doa.arab}
                            </p>
                            <p className="text-[10px] text-emerald-800 font-semibold italic">{doa.latin}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">{doa.arti}</p>

                            {isPlaying && (
                              <div className="mt-2 pt-1 border-t border-amber-200 flex items-center justify-between text-[9px] text-amber-800 font-bold">
                                <span className="flex items-center gap-1">
                                  <Volume2 className="w-3 h-3 animate-pulse" /> Memutar Audio Bimbingan Doa...
                                </span>
                                <span>{doa.duration}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TAGIHAN & PEMBAYARAN */}
              {activeMobileTab === "PAYMENT" && (
                <div className="space-y-3 text-xs">
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Ringkasan Biaya Paket</span>
                    <div className="flex justify-between items-center text-sm font-black text-slate-900 border-b pb-2">
                      <span>Total Biaya:</span>
                      <span className="text-emerald-700">{formatCurrency(totalInvoiced)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Sudah Dibayar:</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Sisa Pelunasan:</span>
                      <span className="font-bold text-amber-700">{formatCurrency(totalRemaining)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-800 text-[11px]">Riwayat Invoice Tagihan</h5>
                    {invoices.map((inv: any) => (
                      <div key={inv.id} className="bg-white p-3 rounded-2xl border border-slate-200 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[10px] font-bold text-slate-500">{inv.invoiceNumber}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              inv.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {inv.status === "PAID" ? "Lunas" : "Menunggu Bayar"}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 text-xs">{inv.title}</p>
                        <p className="text-emerald-700 font-extrabold text-xs">{formatCurrency(inv.amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: CEKLIS BERKAS DOKUMEN */}
              {activeMobileTab === "DOCS" && (
                <div className="space-y-3 text-xs">
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
                    <h5 className="font-bold text-slate-900 text-xs">Status Berkas Paspor & Visa</h5>
                    <p className="text-[10px] text-slate-500">Pastikan seluruh dokumen diserahkan ke kantor cabang sebelum batas H-30</p>
                  </div>

                  <div className="space-y-2">
                    {reqs.map((req: any) => (
                      <div key={req.id} className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{req.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {req.isVerified ? "Sudah diverifikasi tim pusat" : req.isSubmitted ? "Menunggu verifikasi" : "Belum diterima"}
                          </p>
                        </div>
                        <span
                          className={`p-1 rounded-full ${
                            req.isVerified
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: INPUT PROSPEK BARU OLEH AGEN MOBILE */}
              {activeMobileTab === "MARKETING" && (
                <div className="space-y-3 text-xs">
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                    <h5 className="font-bold text-slate-900 text-xs">Input Prospek Cepat (Agen Mobile)</h5>
                    <p className="text-[10px] text-slate-500">Daftarkan peminat umroh langsung dari lapangan</p>
                  </div>

                  <form onSubmit={handleCreateFastLead} className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                    <div>
                      <label className="font-bold text-slate-700 text-[10px]">Nama Calon Jamaah *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. H. Hendra Setiawan"
                        value={leadForm.name}
                        onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 text-[10px]">Nomor WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        placeholder="08123456789"
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 text-[10px]">Kota Domisili</label>
                      <input
                        type="text"
                        placeholder="e.g. Bandung / Surabaya"
                        value={leadForm.city}
                        onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 text-[10px]">Catatan Minat</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Minat paket Ramadhan kamar double 2 orang"
                        value={leadForm.notes}
                        onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingLead}
                      className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-sm hover:bg-amber-400"
                    >
                      {isSubmittingLead ? "Menyimpan..." : "Simpan Prospek ke Pipeline Pusat"}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="bg-white border-t border-slate-200 px-3 py-2 flex justify-between items-center text-[9px] font-bold text-slate-500">
              <button
                onClick={() => setActiveMobileTab("HOME")}
                className={`flex flex-col items-center gap-0.5 ${
                  activeMobileTab === "HOME" ? "text-amber-600" : "text-slate-400"
                }`}
              >
                <Smartphone className="w-4 h-4" /> Beranda
              </button>

              <button
                onClick={() => setActiveMobileTab("HOLY_LAND")}
                className={`flex flex-col items-center gap-0.5 ${
                  activeMobileTab === "HOLY_LAND" ? "text-amber-600 font-black" : "text-slate-400"
                }`}
              >
                <Compass className="w-4 h-4 text-emerald-600" /> Tanah Suci
              </button>

              <button
                onClick={() => setActiveMobileTab("PAYMENT")}
                className={`flex flex-col items-center gap-0.5 ${
                  activeMobileTab === "PAYMENT" ? "text-amber-600" : "text-slate-400"
                }`}
              >
                <CreditCard className="w-4 h-4" /> Tagihan
              </button>

              <button
                onClick={() => setActiveMobileTab("DOCS")}
                className={`flex flex-col items-center gap-0.5 ${
                  activeMobileTab === "DOCS" ? "text-amber-600" : "text-slate-400"
                }`}
              >
                <FileCheck2 className="w-4 h-4" /> Dokumen
              </button>

              <button
                onClick={() => setActiveMobileTab("MARKETING")}
                className={`flex flex-col items-center gap-0.5 ${
                  activeMobileTab === "MARKETING" ? "text-amber-600" : "text-slate-400"
                }`}
              >
                <Plus className="w-4 h-4 text-amber-500" /> Input Agen
              </button>
            </div>

            {/* Home Indicator */}
            <div className="bg-white pb-2 flex justify-center">
              <div className="h-1 w-32 bg-slate-300 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* SOS EMERGENCY MODAL */}
      {isSOSModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border-2 border-rose-500">
            <div className="text-center space-y-2">
              <div className="h-14 w-14 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center animate-bounce">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-rose-600">PANGGILAN DARURAT (SOS)</h3>
              <p className="text-xs text-slate-600">
                Gunakan fitur ini jika Anda <strong>terpisah dari rombongan atau tersesat</strong> di Masjidil Haram / Nabawi.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1.5 border border-slate-200">
              <p><strong>Nama:</strong> {currentPilgrim?.name}</p>
              <p><strong>Hotel:</strong> {activeCityTab === "MAKKAH" ? pkg?.hotelMakkah : pkg?.hotelMadinah}</p>
              <p><strong>Tour Leader:</strong> Ustadz Ahmad Fauzi (0812-3456-7890)</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleSendSOS}
                className="w-full py-3 rounded-2xl bg-rose-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 hover:bg-rose-700"
              >
                <Send className="w-4 h-4" /> Kirim Lokasi Darurat via WhatsApp
              </button>

              <button
                onClick={() => setIsSOSModalOpen(false)}
                className="w-full py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Tutup & Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
