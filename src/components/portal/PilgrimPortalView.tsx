"use client";

import React, { useState, useEffect } from "react";
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
  CreditCard,
  QrCode,
  Download,
  Calendar,
  LogOut,
  Sparkles,
  Share2,
  HelpCircle,
  FileText,
  BadgeCheck,
  Shirt,
  Utensils,
  ChevronRight,
  Luggage,
  RotateCcw,
  CheckSquare,
  Square,
  Filter,
  Info,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { MEN_PACKING_LIST, WOMEN_PACKING_LIST, PackingItem } from "@/lib/packing-list";

interface PilgrimPortalViewProps {
  pilgrims: any[];
  packages: any[];
  currentUser?: any;
  onLogout?: () => void;
  invoices?: any[];
}

export default function PilgrimPortalView({
  pilgrims,
  packages,
  currentUser,
  onLogout,
  invoices = [],
}: PilgrimPortalViewProps) {
  const [activeTab, setActiveTab] = useState<"TIMELINE" | "MANASIK" | "PACKING" | "CARD" | "FINANCE" | "SOS">("TIMELINE");
  const [selectedPilgrimId, setSelectedPilgrimId] = useState<string>(
    currentUser?.pilgrimId || pilgrims[0]?.id || ""
  );
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [showPwaInstallPrompt, setShowPwaInstallPrompt] = useState(true);

  // Dynamic Itinerary State
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [loadingItinerary, setLoadingItinerary] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  // Packing Checklist State
  const [packingGender, setPackingGender] = useState<"MALE" | "FEMALE">("MALE");
  const [checkedPackingItems, setCheckedPackingItems] = useState<Record<string, boolean>>({});
  const [packingCategoryFilter, setPackingCategoryFilter] = useState<string>("ALL");

  // Auto-sync if currentUser has specific pilgrimId
  useEffect(() => {
    if (currentUser?.pilgrimId) {
      setSelectedPilgrimId(currentUser.pilgrimId);
    } else if (currentUser?.username) {
      const match = pilgrims.find(
        (p) =>
          p.name?.toLowerCase().replace(/\s+/g, "_") === currentUser.username.replace(/^@/, "").toLowerCase()
      );
      if (match) setSelectedPilgrimId(match.id);
    }
  }, [currentUser, pilgrims]);

  // Pilgrim lookup
  const currentPilgrim = pilgrims.find((p) => p.id === selectedPilgrimId) || pilgrims[0];

  // Auto-detect gender for packing
  useEffect(() => {
    if (currentPilgrim?.gender) {
      setPackingGender(currentPilgrim.gender === "FEMALE" ? "FEMALE" : "MALE");
    }
  }, [currentPilgrim?.gender, currentPilgrim?.id]);

  // Load packing items from localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && currentPilgrim?.id) {
      const saved = localStorage.getItem(`packing_portal_${currentPilgrim.id}`);
      if (saved) {
        try {
          setCheckedPackingItems(JSON.parse(saved));
        } catch (e) {
          console.error("Error reading saved packing list:", e);
        }
      } else {
        setCheckedPackingItems({});
      }
    }
  }, [currentPilgrim?.id]);

  const togglePackingItem = (id: string) => {
    setCheckedPackingItems((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (typeof window !== "undefined" && currentPilgrim?.id) {
        localStorage.setItem(`packing_portal_${currentPilgrim.id}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const resetPackingList = () => {
    if (confirm("Reset centang checklist perlengkapan koper Anda?")) {
      setCheckedPackingItems({});
      if (typeof window !== "undefined" && currentPilgrim?.id) {
        localStorage.removeItem(`packing_portal_${currentPilgrim.id}`);
      }
    }
  };

  // Fetch package itinerary
  useEffect(() => {
    if (currentPilgrim?.packageId) {
      fetchPackageItinerary(currentPilgrim.packageId);
    }
  }, [currentPilgrim?.packageId]);

  const fetchPackageItinerary = async (pkgId: string) => {
    setLoadingItinerary(true);
    try {
      const res = await fetch(`/api/packages/${pkgId}/itinerary`);
      const data = await res.json();
      if (res.ok && data.itineraries) {
        setItineraries(data.itineraries);
        // Default expand today's day or day 1
        const curDay = calculateCurrentDay(data.package?.departureDate, data.itineraries.length);
        setExpandedDay(curDay || 1);
      }
    } catch (err) {
      console.error("Error fetching portal itinerary:", err);
    } finally {
      setLoadingItinerary(false);
    }
  };

  const calculateCurrentDay = (departureDateStr?: string, totalDays: number = 9) => {
    if (!departureDateStr) return null;
    const dep = new Date(departureDateStr).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);
    const diff = Math.floor((today - dep) / (1000 * 60 * 60 * 24)) + 1;
    if (diff >= 1 && diff <= totalDays) return diff;
    return null;
  };

  const currentActiveDayNumber = calculateCurrentDay(
    currentPilgrim?.package?.departureDate,
    itineraries.length || currentPilgrim?.package?.durationDays || 9
  );

  // Invoices for current pilgrim
  const pilgrimInvoices = invoices.filter((i) => i.pilgrimId === currentPilgrim?.id);

  // Manasik & Doa Catalog with full Arabic, Latin, and Indonesian Translation
  const doaList = [
    {
      id: "doa-1",
      title: "1. Niat Ihram Umroh & Talbiyah",
      arabic: "لَبَّيْكَ اللَّهُمَّ عُمْرَةً • لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ لَا شَرِيكَ لَكَ",
      latin: "Labbaikallaahumma 'umratan. Labbaikallaahumma labbaaik, labbaika laa syariika laka labbaaik, innal hamda wan ni'mata laka wal mulk, laa syariika lak.",
      meaning: "Aku penuhi panggilan-Mu ya Allah untuk berumroh. Aku penuhi panggilan-Mu ya Allah, tiada sekutu bagi-Mu. Sesungguhnya segala puji, kenikmatan, dan kekuasaan hanyalah bagi-Mu, tiada sekutu bagi-Mu.",
      category: "MIQAT & IHRAM",
    },
    {
      id: "doa-2",
      title: "2. Doa Masuk Kota Suci Makkah & Masjidil Haram",
      arabic: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ فَحَيِّنَا رَبَّنَا بِالسَّلَامِ وَأَدْخِلْنَا الْجَنَّةَ دَارَ السَّلَامِ تَبَارَكْتَ وَتَعَالَيْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ",
      latin: "Allaahumma antas salaam wa minkas salaam fa hayyinaa rabbanaa bis salaam wa adkhilnal jannata daaras salaam tabaarakta wa ta'aalaita yaa dzal jalaali wal ikraam.",
      meaning: "Ya Allah, Engkau adalah sumber keselamatan, dari-Mu lah keselamatan, maka hidupkanlah kami dengan keselamatan, masukkanlah kami ke surga tempat keselamatan. Maha Suci Engkau wahai Pemilik Keagungan dan Kemuliaan.",
      category: "MASJIDIL HARAM",
    },
    {
      id: "doa-3",
      title: "3. Doa Tawaf & Istilam Hajar Aswad",
      arabic: "بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ • اللَّهُمَّ إِيمَانًا بِكَ وَتَصْدِيقًا بِكِتَابِكَ وَوَفَاءً بِعَهْدِكَ وَاتِّبَاعًا لِسُنَّةِ نَبِيِّكَ مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ",
      latin: "Bismillaahi wallaahu akbar. Allaahumma iimaanan bika wa tashdiiqan bikitaabika wa wafaa-an bi'ahdika wattibaa'an lisunnati nabiyyika Muhammadin shallallaahu 'alaihi wa sallam.",
      meaning: "Dengan nama Allah, dan Allah Maha Besar. Ya Allah, demi keimanan kepada-Mu, pembenaran atas Kitab-Mu, menepati janji-Mu, dan mengikuti Sunnah Nabi-Mu Muhammad SAW.",
      category: "TAWAF",
    },
    {
      id: "doa-4",
      title: "4. Doa Antara Rukun Yamani & Hajar Aswad (Doa Sapu Jagad)",
      arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
      latin: "Rabbanaa aatinaa fid dunyaa hasanah wa fil aakhirati hasanah wa qinaa 'adzaaban naar.",
      meaning: "Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat serta lindungilah kami dari siksa api neraka.",
      category: "TAWAF",
    },
    {
      id: "doa-5",
      title: "5. Doa Minum Air Zamzam",
      arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ وَسَقَمٍ بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ",
      latin: "Allaahumma innii as-aluka 'ilman naafi'an wa rizqan waasi'an wa syifaa-an min kulli daa-in wa saqamin birahmatika yaa arhamar raahimiin.",
      meaning: "Ya Allah, aku memohon kepada-Mu ilmu yang bermanfaat, rezeki yang lapang, dan kesembuhan dari segala penyakit dengan rahmat-Mu wahai Dzat Yang Maha Pengasih.",
      category: "ZAMZAM",
    },
    {
      id: "doa-6",
      title: "6. Doa Sa'i di Bukit Shafa Menghadap Ka'bah",
      arabic: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ • لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
      latin: "Innash shafaa wal marwata min sya'aa-irillaah. Laa ilaaha illallaahu wahdahu laa syariika lah, lahul mulku wa lahul hamdu wa huwa 'alaa kulli syai-in qadiir.",
      meaning: "Sesungguhnya Shafa dan Marwah adalah sebagian dari syiar Allah. Tiada Tuhan selain Allah Yang Maha Esa, tiada sekutu bagi-Nya, milik-Nya segala kerajaan dan pujian, dan Dia Maha Kuasa atas segala sesuatu.",
      category: "SA'I",
    },
    {
      id: "doa-7",
      title: "7. Doa Tahallul (Gunting Rambut Penutup Umroh)",
      arabic: "اللَّهُمَّ اجْعَلْ لِكُلِّ شَعْرَةٍ نُورًا يَوْمَ الْقِيَامَةِ وَاغْفِرْ لِي ذُنُوبِي يَا غَفُورُ",
      latin: "Allaahummaj'al likulli sya'ratin nuuran yaumal qiyaamah, waghfir lii dzunuubii yaa Ghafuur.",
      meaning: "Ya Allah, jadikanlah untuk setiap helai rambut ini cahaya pada hari kiamat dan ampunilah dosa-dosaku wahai Dzat Yang Maha Pengampun.",
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
    const text = `🚨 *PANGGILAN DARURAT SOS JAMAAH SULTHAN HARAMAIN*\n\nNama Jamaah: *${currentPilgrim?.name || "Jamaah"}*\nNo. Paspor: *${currentPilgrim?.passportNumber || "-"}*\nPaket: *${currentPilgrim?.package?.name || "Umroh"}*\nHotel Makkah: *${currentPilgrim?.package?.hotelMakkah || "Pullman Zamzam"}*\nHotel Madinah: *${currentPilgrim?.package?.hotelMadinah || "Dallah Taibah"}*\n\n_Assalamu'alaikum Tour Leader / Muthawwif, saya terpisah dari rombongan / membutuhkan pertolongan darurat. Mohon segera hubungi saya._`;
    const url = `https://wa.me/6282167339464?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // Calculate days remaining to departure
  const getDaysRemaining = () => {
    if (!currentPilgrim?.package?.departureDate) return null;
    const dep = new Date(currentPilgrim.package.departureDate).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((dep - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Mobile App Header (PWA / APK Header) */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-300/40 p-1 flex items-center justify-center shrink-0">
              <img
                src="/sulthan-haramain-logo.jpg"
                alt="Logo Sulthan Haramain"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                  📱 Mobile Portal Jamaah
                </span>
                <span className="text-[10px] text-emerald-200">
                  PT Barokah Sulthan Haramain
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                Ahlan Wa Sahlan, {currentPilgrim?.name || "Jamaah Umroh"}
              </h2>
              <p className="text-xs text-emerald-100/80 font-mono">
                Paspor: {currentPilgrim?.passportNumber || "Belum Ada"} • {currentPilgrim?.package?.name || "Paket Umroh"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Pilgrim Selector for Family / Group */}
            {pilgrims.length > 1 && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20">
                <User className="w-4 h-4 text-amber-300 shrink-0" />
                <select
                  value={selectedPilgrimId}
                  onChange={(e) => setSelectedPilgrimId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                >
                  {pilgrims.map((p) => (
                    <option key={p.id} value={p.id} className="text-slate-900">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 text-xs font-bold flex items-center gap-1 transition-all"
                title="Keluar Akun"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )}
          </div>
        </div>

        {/* PWA & APK Android Install Callout Banner */}
        {showPwaInstallPrompt && (
          <div className="mt-4 pt-3.5 border-t border-emerald-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-100">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                <strong>Aplikasi Android Resmi:</strong> Pasang di layar utama HP Anda untuk akses offline doa & audio manasik di Saudi.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/sulthan-umroh.apk"
                download="sulthan-umroh.apk"
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download File APK (Android)
              </a>
              <button
                onClick={() => setShowPwaInstallPrompt(false)}
                className="text-emerald-300 hover:text-white text-[10px]"
              >
                ✕ Tutup
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top / Mobile Tab Bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setActiveTab("TIMELINE")}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "TIMELINE"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span className="text-[10px] sm:text-xs">Itinerary</span>
        </button>

        <button
          onClick={() => setActiveTab("MANASIK")}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "MANASIK"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[10px] sm:text-xs">Doa Audio</span>
        </button>

        <button
          onClick={() => setActiveTab("PACKING")}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "PACKING"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Luggage className="w-4 h-4" />
          <span className="text-[10px] sm:text-xs">Packing</span>
        </button>

        <button
          onClick={() => setActiveTab("CARD")}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "CARD"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span className="text-[10px] sm:text-xs">ID Card</span>
        </button>

        <button
          onClick={() => setActiveTab("FINANCE")}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "FINANCE"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span className="text-[10px] sm:text-xs">Kwitansi</span>
        </button>

        <button
          onClick={() => setActiveTab("SOS")}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "SOS"
              ? "bg-rose-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-rose-50"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500 group-hover:text-rose-600" />
          <span className="text-[10px] sm:text-xs">SOS Darurat</span>
        </button>
      </div>

      {/* TAB 1: TIMELINE & PERJALANAN */}
      {activeTab === "TIMELINE" && (
        <div className="space-y-6">
          {/* Countdown & Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Countdown */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl p-6 text-white shadow-md flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-emerald-100">
                  Hitung Mundur Keberangkatan
                </span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black">
                    {daysRemaining !== null ? (daysRemaining > 0 ? daysRemaining : 0) : "-"}
                  </span>
                  <span className="text-sm font-bold text-emerald-100">Hari Menuju Tanah Suci</span>
                </div>
              </div>
              <p className="text-xs text-emerald-100/90 mt-4 pt-3 border-t border-white/20">
                Jadwal Terbang:{" "}
                <strong>
                  {currentPilgrim?.package?.departureDate
                    ? formatDate(currentPilgrim.package.departureDate, "dd MMMM yyyy")
                    : "Menunggu Rilis Manifes"}
                </strong>
              </p>
            </div>

            {/* Card 2: Hotel Mekkah */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    🕋 Hotel Makkah
                  </span>
                  <span className="text-xs font-bold text-amber-700">★★★★★</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 mt-2">
                  {currentPilgrim?.package?.hotelMakkah || "Pullman Zamzam Tower Makkah"}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Pelataran Depan Masjidil Haram • Tipe Kamar: <strong>{currentPilgrim?.roomType || "QUAD"}</strong>
                </p>
              </div>
              <a
                href="https://maps.google.com/?q=Pullman+Zamzam+Makkah"
                target="_blank"
                rel="noreferrer"
                className="mt-3 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5" /> Buka Peta Hotel Makkah <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Card 3: Hotel Madinah */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    🕌 Hotel Madinah
                  </span>
                  <span className="text-xs font-bold text-emerald-700">★★★★★</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 mt-2">
                  {currentPilgrim?.package?.hotelMadinah || "Dallah Taibah Hotel Madinah"}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Gerbang Utama Masjid Nabawi • Tipe Kamar: <strong>{currentPilgrim?.roomType || "QUAD"}</strong>
                </p>
              </div>
              <a
                href="https://maps.google.com/?q=Dallah+Taibah+Hotel+Madinah"
                target="_blank"
                rel="noreferrer"
                className="mt-3 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5" /> Buka Peta Hotel Madinah <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Detailed Pilgrim Profile & Document Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Identity & Flight Summary */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Plane className="w-4 h-4 text-emerald-600" /> Penerbangan & Data Manifes
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Nama Jamaah:</span>
                  <span className="font-bold text-slate-900">{currentPilgrim?.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Nomor Paspor:</span>
                  <span className="font-mono font-bold text-emerald-800">{currentPilgrim?.passportNumber || "Dalam Proses"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Maskapai Penerbangan:</span>
                  <span className="font-bold text-slate-900">{currentPilgrim?.package?.airline || "Garuda Indonesia / Saudia Airlines"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Kota Domisili:</span>
                  <span className="font-bold text-slate-900">{currentPilgrim?.city || "Tebing Tinggi"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Mahram / Pendamping:</span>
                  <span className="font-bold text-slate-900">{currentPilgrim?.mahramName || "Mandiri"}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Ukuran Seragam Batik:</span>
                  <span className="font-bold text-slate-900 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
                    Size {currentPilgrim?.uniformSize || "L"}
                  </span>
                </div>
              </div>
            </div>

            {/* Document Verification Matrix */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-emerald-600" /> Status Verifikasi Dokumen PPIU
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-emerald-950">Paspor Asli & Visa Umroh</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 font-mono">TERVERIFIKASI</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-emerald-950">Sertifikat Vaksin Meningitis (ICV)</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 font-mono">LENGKAP</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-emerald-950">Gelang & ID Card SISKOPATUH</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 font-mono">SIAP DIGUNAKAN</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-emerald-950">Koper Bagasi & Kain Ihram/Mukena</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 font-mono">SUDAH DITERIMA</span>
                </div>
              </div>
            </div>
          </div>
          {/* Day-by-Day Interactive Itinerary Timeline */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    🕋 Rundown Ibadah Harian
                  </span>
                  {currentActiveDayNumber && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white px-2.5 py-0.5 rounded-full animate-pulse">
                      📍 Hari Ini: Hari Ke-{currentActiveDayNumber}
                    </span>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 mt-1">
                  Itinerary & Jadwal Kegiatan ({itineraries.length || currentPilgrim?.package?.durationDays || 9} Hari)
                </h3>
                <p className="text-xs text-slate-500">
                  Panduan waktu kumpul, titik lokasi, pakaian seragam, dan agenda ibadah harian jamaah.
                </p>
              </div>

              <button
                onClick={() => {
                  let waText = `🕋 *JADWAL ITINERARY SULTHAN HARAMAIN*\n`;
                  waText += `Jamaah: *${currentPilgrim?.name}*\n`;
                  waText += `Paket: *${currentPilgrim?.package?.name}*\n\n`;
                  itineraries.forEach((d) => {
                    waText += `📅 *Hari ${d.dayNumber}* (${d.date ? formatDate(d.date, "dd MMM") : ""}): ${d.title}\n`;
                    if (d.time) waText += `⏰ ${d.time} | 📍 ${d.location || "-"}\n`;
                    if (d.dresscode) waText += `👔 Pakaian: ${d.dresscode}\n\n`;
                  });
                  window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, "_blank");
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 transition-all self-start sm:self-auto cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Bagikan Jadwal ke WA</span>
              </button>
            </div>

            {loadingItinerary ? (
              <div className="py-8 text-center text-slate-400">
                <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                <p className="text-xs font-bold">Memuat jadwal perjalanan...</p>
              </div>
            ) : itineraries.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Jadwal harian belum dirilis oleh tim operasional.
              </div>
            ) : (
              <div className="space-y-3">
                {itineraries.map((day) => {
                  const isToday = currentActiveDayNumber === day.dayNumber;
                  const isExpanded = expandedDay === day.dayNumber;

                  return (
                    <div
                      key={day.dayNumber}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isToday
                          ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30 shadow-xs"
                          : isExpanded
                          ? "bg-slate-50/80 border-slate-300 shadow-2xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* Day Clickable Header */}
                      <button
                        onClick={() => setExpandedDay(isExpanded ? null : day.dayNumber)}
                        className="w-full p-4 text-left flex items-start sm:items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <span
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                              isToday
                                ? "bg-amber-500 text-white"
                                : "bg-emerald-600 text-white"
                            }`}
                          >
                            H-{day.dayNumber}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-black text-slate-900">
                                Hari Ke-{day.dayNumber}
                              </span>
                              {day.date && (
                                <span className="text-[11px] text-slate-500 font-medium">
                                  • {formatDate(day.date, "EEEE, dd MMM yyyy")}
                                </span>
                              )}
                              {isToday && (
                                <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full">
                                  📍 Hari Ini
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                              {day.title}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 text-slate-400">
                          {isExpanded ? (
                            <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">Tutup</span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 hidden sm:inline">Rincian</span>
                          )}
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90 text-slate-700" : ""}`}
                          />
                        </div>
                      </button>

                      {/* Day Expanded Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-200/60 space-y-3 text-xs bg-white/70">
                          {/* Badges Info */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                            {day.time && (
                              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                                <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <div>
                                  <p className="text-[9px] font-bold uppercase text-slate-400">Waktu Kumpul</p>
                                  <p className="font-bold">{day.time}</p>
                                </div>
                              </div>
                            )}

                            {day.location && (
                              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <div>
                                  <p className="text-[9px] font-bold uppercase text-slate-400">Lokasi Kegiatan</p>
                                  <p className="font-bold line-clamp-1">{day.location}</p>
                                </div>
                              </div>
                            )}

                            {day.dresscode && (
                              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                                <Shirt className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <div>
                                  <p className="text-[9px] font-bold uppercase text-slate-400">Pakaian / Seragam</p>
                                  <p className="font-bold">{day.dresscode}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Description */}
                          {day.description && (
                            <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-slate-800 leading-relaxed">
                              <p className="text-[10px] font-black uppercase text-emerald-800 mb-1">
                                Rincian Agenda & Ibadah:
                              </p>
                              <p className="text-xs text-slate-700">{day.description}</p>
                            </div>
                          )}

                          {/* Tips / Notes */}
                          {day.notes && (
                            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs">
                              <span className="shrink-0">💡</span>
                              <p className="text-[11px] italic">
                                <strong>Tips Muthawwif:</strong> {day.notes}
                              </p>
                            </div>
                          )}

                          {/* Prayer Audio Quick Jump */}
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => setActiveTab("MANASIK")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-2xs transition-all cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5" /> Putar Audio Doa Manasik &rarr;
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MANASIK & AUDIO DOA */}
      {activeTab === "MANASIK" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>
                <strong>Panduan Manasik & Doa Umroh Interaktif:</strong> Dengarkan bacaan audio talbiyah dan doa tahallul resmi saat pelaksanaan ibadah di Masjidil Haram & Nabawi.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doaList.map((doa) => (
              <div key={doa.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900">{doa.title}</h4>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {doa.category}
                  </span>
                </div>

                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 text-right">
                  <p className="font-serif text-xl leading-loose text-emerald-950 font-bold">
                    {doa.arabic}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="font-bold text-slate-800 italic">{doa.latin}</p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{doa.meaning}</p>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                  <button
                    onClick={() => handleToggleAudio(doa.id)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      isPlayingAudio === doa.id
                        ? "bg-emerald-700 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {isPlayingAudio === doa.id ? (
                      <>
                        <Pause className="w-3.5 h-3.5" /> Jeda Audio
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" /> Putar Audio Doa
                      </>
                    )}
                  </button>

                  {isPlayingAudio === doa.id && (
                    <span className="text-[10px] font-black text-emerald-700 animate-pulse font-mono flex items-center gap-1">
                      ▶ AUDIO AKTIF
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: CHECKLIST PACKING PERLENGKAPAN KOPER JAMAAH */}
      {activeTab === "PACKING" && (
        <div className="space-y-5">
          {(() => {
            const currentItems = packingGender === "MALE" ? MEN_PACKING_LIST : WOMEN_PACKING_LIST;
            const totalItems = currentItems.length;
            const completedCount = currentItems.filter((it) => !!checkedPackingItems[it.id]).length;
            const percent = Math.round((completedCount / totalItems) * 100);

            const filteredItems =
              packingCategoryFilter === "ALL"
                ? currentItems
                : currentItems.filter((it) => it.category === packingCategoryFilter);

            const categories = [
              { id: "ALL", label: "Semua" },
              { id: "PAKAIAN", label: "Pakaian" },
              { id: "IBADAH", label: "Ibadah" },
              { id: "PRIBADI", label: "Pribadi" },
              { id: "ELEKTRONIK", label: "Elektronik" },
              { id: "KESEHATAN", label: "Kesehatan" },
              { id: "LAUNDRY", label: "Laundry" },
              { id: "AKSESORIS", label: "Aksesoris" },
            ];

            return (
              <div className="space-y-5">
                {/* Header Progress Card */}
                <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shrink-0">
                        <Luggage className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded border border-amber-400/30">
                          🧳 Panduan Koper Jamaah
                        </span>
                        <h3 className="text-lg font-black text-white mt-1">
                          Checklist Perlengkapan Umroh
                        </h3>
                        <p className="text-xs text-emerald-200">
                          Tersimpan otomatis di HP Anda. Centang saat memasukkan barang ke koper.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={resetPackingList}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 border border-white/20 transition-all"
                        title="Reset Checklist"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-emerald-200">
                        Kelengkapan Koper: <strong className="text-white">{completedCount}</strong> dari {totalItems} Item
                      </span>
                      <span className={percent === 100 ? "text-emerald-300 font-black" : "text-amber-300 font-black"}>
                        {percent}% {percent === 100 ? "🎉 Siap Berangkat!" : "Sedang Packing"}
                      </span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-3 p-0.5 overflow-hidden border border-white/10">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Gender Toggle Selector */}
                <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-2 border border-slate-200">
                  <button
                    onClick={() => setPackingGender("FEMALE")}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      packingGender === "FEMALE"
                        ? "bg-rose-600 text-white shadow-md"
                        : "text-slate-600 hover:bg-white/60"
                    }`}
                  >
                    <span>🧕 Perlengkapan Wanita</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      packingGender === "FEMALE" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    }`}>
                      24 Item
                    </span>
                  </button>

                  <button
                    onClick={() => setPackingGender("MALE")}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      packingGender === "MALE"
                        ? "bg-emerald-700 text-white shadow-md"
                        : "text-slate-600 hover:bg-white/60"
                    }`}
                  >
                    <span>👨 Perlengkapan Pria</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      packingGender === "MALE" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    }`}>
                      22 Item
                    </span>
                  </button>
                </div>

                {/* Important Rules / Airline Notice */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1">
                    <span className="font-black text-amber-900 flex items-center gap-1.5 text-[11px]">
                      🧴 Skincare & Cairan &lt; 100ml
                    </span>
                    <p className="text-[11px] text-amber-800 leading-tight">
                      Cairan di kabin max 100ml/botol dalam kantong transparan. Botol spray wudhu 100ml sangat praktis di saf masjid.
                    </p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1">
                    <span className="font-black text-emerald-900 flex items-center gap-1.5 text-[11px]">
                      🧳 Koper Bagasi (25-30 kg)
                    </span>
                    <p className="text-[11px] text-emerald-800 leading-tight">
                      Gamis, baju ganti, hanger, laundry, cairan &gt; 100ml, dan perlengkapan mandi masuk ke koper bagasi besar.
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 space-y-1">
                    <span className="font-black text-blue-900 flex items-center gap-1.5 text-[11px]">
                      🎒 Tas Paspor & Jinjing (&lt; 7 kg)
                    </span>
                    <p className="text-[11px] text-blue-800 leading-tight">
                      Paspor, tiket, dompet, charger/adaptor kaki 3, obat pribadi darurat, & 1 set kain ihram/gamis cadangan.
                    </p>
                  </div>
                </div>

                {/* Category Filters */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setPackingCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        packingCategoryFilter === cat.id
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Item List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredItems.map((item, idx) => {
                    const isChecked = !!checkedPackingItems[item.id];

                    return (
                      <div
                        key={item.id}
                        onClick={() => togglePackingItem(item.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isChecked
                            ? "bg-emerald-50/80 border-emerald-300 text-slate-500 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-xs hover:shadow-sm"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isChecked ? (
                            <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-lg border-2 border-slate-300 hover:border-emerald-500 bg-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span
                              className={`text-xs font-bold ${
                                isChecked ? "line-through text-slate-400" : "text-slate-900"
                              }`}
                            >
                              {item.name}
                            </span>
                            {item.isEssential && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                                Wajib
                              </span>
                            )}
                          </div>

                          {item.notes && (
                            <p
                              className={`text-[11px] mt-0.5 ${
                                isChecked ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              {item.notes}
                            </p>
                          )}

                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                              {item.category}
                            </span>
                            {isChecked && (
                              <span className="text-[10px] font-black text-emerald-700">
                                ✓ Sudah Masuk Koper
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 3: DIGITAL ID CARD & QR SISKOPATUH */}
      {activeTab === "CARD" && (
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 rounded-3xl p-6 text-white shadow-2xl border border-emerald-700/50 space-y-5 text-center relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <div className="flex items-center gap-2 text-left">
                <img src="/sulthan-haramain-logo.jpg" alt="Logo" className="w-9 h-9 rounded-xl object-contain bg-white p-0.5" />
                <div>
                  <h4 className="text-xs font-black tracking-wide">PT BAROKAH SULTHAN HARAMAIN</h4>
                  <p className="text-[9px] text-emerald-200">PPIU Kemenag No. 25052200384080005</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                SISKOPATUH
              </span>
            </div>

            {/* Pilgrim Avatar & Details */}
            <div className="space-y-2">
              <div className="w-20 h-20 rounded-2xl bg-amber-400/20 border-2 border-amber-300 flex items-center justify-center mx-auto text-amber-300 font-black text-2xl">
                {currentPilgrim?.name?.charAt(0) || "J"}
              </div>
              <h3 className="text-base font-black uppercase text-white tracking-wide">
                {currentPilgrim?.name}
              </h3>
              <p className="text-xs font-mono font-bold text-amber-300">
                PASPOR: {currentPilgrim?.passportNumber || "PROSES"}
              </p>
              <p className="text-[11px] text-emerald-200">
                {currentPilgrim?.package?.name || "Paket Umroh Reguler"}
              </p>
            </div>

            {/* QR Code Placeholder for Scanner */}
            <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-md">
              <div className="w-32 h-32 bg-slate-900 rounded-xl p-2 flex flex-col items-center justify-center text-white">
                <QrCode className="w-20 h-20 text-white" />
                <span className="text-[8px] font-mono font-bold mt-1 text-slate-300">
                  {currentPilgrim?.nik || "1218080000000000"}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-emerald-200/90 pt-2 border-t border-white/20 space-y-0.5">
              <p>Hotline PPIU Saudi: +62 821-6733-9464</p>
              <p>Tunjukkan kartu digital ini kepada Muthawwif atau Petugas Bandara</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TAGIHAN & KWITANSI */}
      {activeTab === "FINANCE" && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" /> Ringkasan Pembayaran & Invoice
            </h3>

            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Total Biaya Paket:</span>
                <span className="font-black text-slate-900">
                  {formatCurrency(currentPilgrim?.package?.price || 32000000)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Status Pembayaran:</span>
                <span className="font-bold text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded text-[10px]">
                  {currentPilgrim?.status === "PAID_IN_FULL" ? "LUNAS (100%)" : "DP TERBAYAR"}
                </span>
              </div>
            </div>

            {/* Bank Transfer Information */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Rekening Resmi PPIU:</span>
              <p className="font-bold text-slate-900">Bank Mandiri: 107-00-7777-2020</p>
              <p className="text-slate-600">Atas Nama: <strong>SULTHAN HARAMAIN</strong></p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TOMBOL SOS & PANDUAN PETA */}
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
              className="w-full py-4 rounded-2xl bg-white hover:bg-rose-50 text-rose-800 font-black text-sm shadow-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
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
