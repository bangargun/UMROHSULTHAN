"use client";

import React, { useState } from "react";
import {
  Smartphone,
  BookOpen,
  MapPin,
  AlertTriangle,
  Play,
  Pause,
  Compass,
  CheckCircle2,
  Phone,
  Hotel,
  Plane,
  Clock,
  User,
  ShieldAlert,
  Volume2,
  ExternalLink,
  Search,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface PilgrimPortalViewProps {
  pilgrims: any[];
  packages: any[];
}

export default function PilgrimPortalView({ pilgrims, packages }: PilgrimPortalViewProps) {
  const [activeTab, setActiveTab] = useState<"TIMELINE" | "MANASIK" | "SOS">("TIMELINE");
  const [selectedPilgrimId, setSelectedPilgrimId] = useState<string>(pilgrims[0]?.id || "");
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);

  // Pilgrim lookup
  const currentPilgrim = pilgrims.find((p) => p.id === selectedPilgrimId) || pilgrims[0];

  // Manasik & Doa Catalog
  const doaList = [
    {
      id: "doa-1",
      title: "1. Niat Ihram Umroh & Talbiyah",
      arabic: "لَبَّيْكَ اللَّهُمَّ عُمْرَةً • لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ",
      latin: "Labbaikallaahumma 'umratan. Labbaikallaahumma labbaaik, labbaika laa syariika laka labbaaik...",
      meaning: "Aku penuhi panggilan-Mu ya Allah untuk berumroh. Aku penuhi panggilan-Mu ya Allah, tiada sekutu bagi-Mu...",
      category: "IHRAM",
    },
    {
      id: "doa-2",
      title: "2. Doa Memasuki Masjidil Haram",
      arabic: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ فَحَيِّنَا رَبَّنَا بِالسَّلَامِ",
      latin: "Allaahumma antas salaam wa minkas salaam fa hayyinaa rabbanaa bis salaam...",
      meaning: "Ya Allah, Engkau adalah sumber keselamatan, dan dari-Mu lah keselamatan, maka hidupkanlah kami dengan keselamatan...",
      category: "MAKKAH",
    },
    {
      id: "doa-3",
      title: "3. Doa Tawaf & Melihat Hajar Aswad",
      arabic: "بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ",
      latin: "Bismillaahi wallaahu akbar...",
      meaning: "Dengan nama Allah, dan Allah Maha Besar...",
      category: "TAWAF",
    },
    {
      id: "doa-4",
      title: "4. Doa Antara Rukun Yamani & Hajar Aswad",
      arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
      latin: "Rabbanaa aatinaa fid dunyaa hasanah wa fil aakhirati hasanah wa qinaa 'adzaaban naar.",
      meaning: "Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat dan peliharalah kami dari siksa neraka.",
      category: "TAWAF",
    },
    {
      id: "doa-5",
      title: "5. Doa Minum Air Zamzam",
      arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ",
      latin: "Allaahumma innii as-aluka 'ilman naafi'an wa rizqan waasi'an wa syifaa-an min kulli daa-in.",
      meaning: "Ya Allah, aku memohon kepada-Mu ilmu yang bermanfaat, rezeki yang luas, dan kesembuhan dari segala penyakit.",
      category: "ZAMZAM",
    },
    {
      id: "doa-6",
      title: "6. Doa Sa'i di Bukit Shafa & Marwah",
      arabic: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ",
      latin: "Innash shafaa wal marwata min sya'aa-irillaah...",
      meaning: "Sesungguhnya Shafa dan Marwah adalah sebagian dari syiar-syiar Allah...",
      category: "SAI",
    },
    {
      id: "doa-7",
      title: "7. Doa Tahallul (Potong Rambut)",
      arabic: "اللَّهُمَّ اجْعَلْ لِكُلِّ شَعْرَةٍ نُورًا يَوْمَ الْقِيَامَةِ",
      latin: "Allaahummaj'al likulli sya'ratin nuuran yaumal qiyaamah.",
      meaning: "Ya Allah, jadikanlah setiap helai rambut ini cahaya pada hari kiamat kelak.",
      category: "TAHALLUL",
    },
  ];

  const handleToggleAudio = (id: string) => {
    if (isPlayingAudio === id) {
      setIsPlayingAudio(null);
    } else {
      setIsPlayingAudio(id);
    }
  };

  const handleSendSos = () => {
    const text = `🚨 *PANGGILAN DARURAT SOS JAMAAH UMROH*\n\nNama: *${currentPilgrim?.name || "Jamaah"}*\nNo. Paspor: *${currentPilgrim?.passportNumber || "-"}*\nPaket: *${currentPilgrim?.package?.name || "Umroh"}*\nHotel: *${currentPilgrim?.package?.hotelMakkah || "Pullman Zamzam"}*\n\n_Assalamu'alaikum Tour Leader / Muthawwif, saya terpisah dari rombongan di sekitar pelataran Masjidil Haram. Mohon bantuan dan hubungi saya segera._`;
    const url = `https://wa.me/6282167339464?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-850 via-teal-900 to-slate-950 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-100 backdrop-blur-sm">
                <Smartphone className="w-3.5 h-3.5" /> Portal Mandiri Jamaah (PWA)
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Buku Saku Manasik, Doa & Tombol SOS
            </h2>
            <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl">
              Akses panduan ibadah digital interaktif, audio talbiyah, rincian hotel Makkah/Madinah, dan tombol bantuan darurat saat di Tanah Suci.
            </p>
          </div>

          {/* Quick Pilgrim Selector */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-2.5 rounded-2xl border border-white/20">
            <User className="w-4 h-4 text-emerald-300 shrink-0" />
            <select
              value={selectedPilgrimId}
              onChange={(e) => setSelectedPilgrimId(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
            >
              {pilgrims.length === 0 ? (
                <option value="" className="text-slate-900">Belum Ada Jamaah</option>
              ) : (
                pilgrims.map((p) => (
                  <option key={p.id} value={p.id} className="text-slate-900">
                    {p.name} ({p.passportNumber || "No Paspor"})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* SubTabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs">
        <button
          onClick={() => setActiveTab("TIMELINE")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "TIMELINE" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Smartphone className="w-4 h-4" /> Status & Itinerary Perjalanan
        </button>

        <button
          onClick={() => setActiveTab("MANASIK")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "MANASIK" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Panduan Doa & Manasik Audio
        </button>

        <button
          onClick={() => setActiveTab("SOS")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "SOS" ? "bg-rose-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Tombol Darurat SOS & Pin Maps
        </button>
      </div>

      {/* TAB 1: TIMELINE & DETAILS */}
      {activeTab === "TIMELINE" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pilgrim Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-black text-lg">
                {currentPilgrim?.name?.charAt(0) || "J"}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  {currentPilgrim?.name || "Nama Jamaah"}
                </h3>
                <p className="text-xs font-mono font-bold text-emerald-700">
                  Paspor: {currentPilgrim?.passportNumber || "Dalam Proses"}
                </p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 mt-1">
                  Status: {currentPilgrim?.status || "REGISTERED"}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Program Paket:</span>
                <span className="font-bold text-slate-800">{currentPilgrim?.package?.name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Keberangkatan:</span>
                <span className="font-bold text-slate-800">
                  {currentPilgrim?.package?.departureDate ? formatDate(currentPilgrim.package.departureDate, "dd MMMM yyyy") : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tipe Kamar:</span>
                <span className="font-bold text-slate-800">{currentPilgrim?.roomType || "QUAD"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Maskapai:</span>
                <span className="font-bold text-slate-800">{currentPilgrim?.package?.airline || "-"}</span>
              </div>
            </div>
          </div>

          {/* Hotel Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Hotel className="w-4 h-4 text-emerald-600" /> Akomodasi Hotel Tanah Suci
            </h4>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-black text-amber-700 uppercase">Makkah Al-Mukarramah</span>
              <p className="text-xs font-bold text-slate-900">
                {currentPilgrim?.package?.hotelMakkah || "Pullman Zamzam Tower (Bintang 5)"}
              </p>
              <p className="text-[10px] text-slate-500">Depan Pelataran Masjidil Haram</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-black text-emerald-700 uppercase">Madinah Al-Munawwarah</span>
              <p className="text-xs font-bold text-slate-900">
                {currentPilgrim?.package?.hotelMadinah || "Dallah Taibah Hotel (Bintang 5)"}
              </p>
              <p className="text-[10px] text-slate-500">Dekat Pintu Gerbang Masjid Nabawi</p>
            </div>
          </div>

          {/* Document & Preparation Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Kesiapan Dokumen & Logistik
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="font-bold text-emerald-950">Paspor Asli & Visa Umroh</span>
                <span className="text-[10px] font-bold text-emerald-700 font-mono">✓ TERVERIFIKASI</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="font-bold text-emerald-950">Vaksin Meningitis (ICV)</span>
                <span className="text-[10px] font-bold text-emerald-700 font-mono">✓ LENGKAP</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="font-bold text-emerald-950">Koper & Seragam Batik</span>
                <span className="text-[10px] font-bold text-emerald-700 font-mono">✓ SUDAH DIAMBIL</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANASIK & AUDIO DOA */}
      {activeTab === "MANASIK" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doaList.map((doa) => (
              <div key={doa.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900">{doa.title}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {doa.category}
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 text-right">
                  <p className="font-serif text-lg leading-loose text-emerald-950 font-bold">
                    {doa.arabic}
                  </p>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-slate-800 italic">{doa.latin}</p>
                  <p className="text-[11px] text-slate-500 leading-normal">{doa.meaning}</p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    onClick={() => handleToggleAudio(doa.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isPlayingAudio === doa.id
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isPlayingAudio === doa.id ? (
                      <>
                        <Pause className="w-3.5 h-3.5" /> Jeda Audio
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> Putar Audio Doa
                      </>
                    )}
                  </button>

                  {isPlayingAudio === doa.id && (
                    <span className="text-[10px] font-bold text-emerald-600 animate-pulse font-mono">
                      ▶ Memutar Audio Panduan...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TOMBOL SOS & PANDUAN PETA */}
      {activeTab === "SOS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Emergency SOS Trigger */}
          <div className="bg-gradient-to-br from-rose-600 to-rose-900 rounded-3xl p-6 text-white shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto animate-bounce">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>

            <div>
              <h3 className="text-xl font-black uppercase">Panggilan Darurat / Terpisah Dari Rombongan</h3>
              <p className="text-xs text-rose-100 mt-2 max-w-sm mx-auto">
                Tekan tombol di bawah jika Anda terpisah atau memerlukan bantuan darurat. Pesan otomatis beserta koordinat identitas Anda akan langsung dikirim ke WhatsApp Muthawwif & Tour Leader.
              </p>
            </div>

            <button
              onClick={handleSendSos}
              className="w-full py-4 rounded-2xl bg-white hover:bg-rose-50 text-rose-800 font-black text-sm shadow-2xl flex items-center justify-center gap-2 transition-all"
            >
              <Phone className="w-5 h-5" /> KIRIM SINYAL SOS KE MUTHAWWIF
            </button>

            <p className="text-[10px] text-rose-200 font-mono">
              Emergency Center PPIU: 0821-6733-9464
            </p>
          </div>

          {/* Hotel Maps & Landmark Directions */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-600" />
              Titik Kumpul & Lokasi Hotel di Google Maps
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Hotel Makkah (Zamzam Tower)</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Pelataran Haram
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Patokan: Menara Jam Zamzam Tower, langsung menghadap Pintu King Abdulaziz.
              </p>
              <a
                href="https://maps.google.com/?q=Pullman+Zamzam+Makkah"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 pt-1"
              >
                <MapPin className="w-3.5 h-3.5" /> Buka Navigasi Google Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Hotel Madinah (Dallah Taibah)</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Gerbang Nabawi
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Patokan: Pintu Gerbang Masjid Nabawi No. 25 (Pintu Utama Masuk Pria/Wanita).
              </p>
              <a
                href="https://maps.google.com/?q=Dallah+Taibah+Hotel+Madinah"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 pt-1"
              >
                <MapPin className="w-3.5 h-3.5" /> Buka Navigasi Google Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
