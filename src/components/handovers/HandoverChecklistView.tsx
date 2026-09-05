"use client";

import React, { useState, useRef } from "react";
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  Printer,
  X,
  Sparkles,
  UserCheck,
  Boxes,
  Eraser,
  MessageSquare,
  Send,
  User,
  Share2,
  CheckSquare,
  Square,
  AlertTriangle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Pagination from "@/components/common/Pagination";
import {
  MEN_PACKING_LIST,
  WOMEN_PACKING_LIST,
  getPackingListByGender,
  generatePackingWhatsAppText,
} from "@/lib/packing-list";

interface HandoverChecklistViewProps {
  handovers: any[];
  pilgrims: any[];
  equipment: any[];
  packages?: any[];
  onRefresh: () => void;
  initialSearchTerm?: string;
}

export default function HandoverChecklistView({
  handovers,
  pilgrims,
  equipment,
  packages = [],
  onRefresh,
  initialSearchTerm = "",
}: HandoverChecklistViewProps) {
  const [activeTab, setActiveTab] = useState<"HANDOVER_BAST" | "PACKING_GUIDE">("HANDOVER_BAST");
  const [packingGender, setPackingGender] = useState<"MALE" | "FEMALE">("FEMALE");
  const [isPrintPackingModalOpen, setIsPrintPackingModalOpen] = useState(false);
  const [isSendWaModalOpen, setIsSendWaModalOpen] = useState(false);
  const [waSelectedPilgrimId, setWaSelectedPilgrimId] = useState<string>(pilgrims[0]?.id || "");
  const [waCustomPhone, setWaCustomPhone] = useState("");
  const [waCustomName, setWaCustomName] = useState("");
  const [waCustomGender, setWaCustomGender] = useState<"MALE" | "FEMALE">("FEMALE");

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedPackageId, setSelectedPackageId] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalPackageFilter, setModalPackageFilter] = useState("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedHandoverForPrint, setSelectedHandoverForPrint] = useState<any | null>(null);

  // Form states
  const [selectedPilgrimId, setSelectedPilgrimId] = useState(pilgrims[0]?.id || "");
  const [officerName, setOfficerName] = useState("Tim Admin");
  const [recipientName, setRecipientName] = useState("");
  const [notes, setNotes] = useState("Perlengkapan diserahkan lengkap dalam kondisi baru dan baik.");
  const [checklistItems, setChecklistItems] = useState<{ [eqId: string]: boolean }>({});

  // Canvas signature state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize checklist items when equipment loads
  React.useEffect(() => {
    const initial: { [eqId: string]: boolean } = {};
    equipment.forEach((eq) => {
      initial[eq.id] = true; // default all checked
    });
    setChecklistItems(initial);
  }, [equipment]);

  const [travelSettings, setTravelSettings] = useState<any>({
    companyName: "PT SULTHAN HARAMAIN TOUR & TRAVEL",
    licenseNumber: "PPIU Kemenag RI No. U.412 Tahun 2022",
    address: "Sulthan Haramain Tower, Jl. Prof. Dr. Satrio No. 88, Jakarta Selatan",
    phone: "0811-9876-5432",
    email: "salam@sulthanharamain.com",
    directorName: "H. Sulthan Syarif, Lc., M.A.",
    directorTitle: "Direktur Utama",
  });

  React.useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setTravelSettings(data);
      })
      .catch((err) => console.error(err));
  }, []);

  // Update recipient name when pilgrim changes
  React.useEffect(() => {
    const p = pilgrims.find((item) => item.id === selectedPilgrimId);
    if (p) {
      setRecipientName(p.name);
    }
  }, [selectedPilgrimId, pilgrims]);

  const filteredHandovers = handovers.filter((h) => {
    const matchSearch =
      h.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.officerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.pilgrim?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.pilgrim?.package?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPkg = selectedPackageId === "ALL" || h.pilgrim?.packageId === selectedPackageId;
    return matchSearch && matchPkg;
  });

  // Reset page when search or package filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedPackageId]);

  // Paginated handovers
  const paginatedHandovers = filteredHandovers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const modalPilgrims = pilgrims.filter(
    (p) => modalPackageFilter === "ALL" || p.packageId === modalPackageFilter
  );

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = "#064e3b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleToggleCheck = (eqId: string) => {
    setChecklistItems((prev) => ({
      ...prev,
      [eqId]: !prev[eqId],
    }));
  };

  const handleSubmitHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let signatureUrl = "";
    if (canvasRef.current && hasSignature) {
      signatureUrl = canvasRef.current.toDataURL("image/png");
    }

    const itemsPayload = equipment.map((eq) => ({
      equipmentId: eq.id,
      quantity: 1,
      isGiven: !!checklistItems[eq.id],
      notes: checklistItems[eq.id] ? "Diserahkan" : "Belum diambil",
    }));

    try {
      const res = await fetch("/api/handovers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pilgrimId: selectedPilgrimId,
          officerName,
          recipientName: recipientName || "Jamaah",
          signatureUrl,
          notes,
          items: itemsPayload,
        }),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        clearCanvas();
        alert("Ceklis serah terima perlengkapan berhasil disimpan!");
        onRefresh();
      } else {
        alert("Gagal menyimpan serah terima.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentPackingItems = packingGender === "MALE" ? MEN_PACKING_LIST : WOMEN_PACKING_LIST;

  const handleOpenSendWa = (pilgrim?: any) => {
    if (pilgrim) {
      setWaSelectedPilgrimId(pilgrim.id);
      setWaCustomName(pilgrim.name);
      setWaCustomPhone(pilgrim.phone);
      setWaCustomGender(pilgrim.gender === "FEMALE" ? "FEMALE" : "MALE");
    } else {
      const p = pilgrims[0];
      setWaSelectedPilgrimId(p?.id || "");
      setWaCustomName(p?.name || "");
      setWaCustomPhone(p?.phone || "");
      setWaCustomGender(p?.gender === "FEMALE" ? "FEMALE" : "MALE");
    }
    setIsSendWaModalOpen(true);
  };

  const handleSendWaSubmit = () => {
    let targetPhone = waCustomPhone;
    let targetName = waCustomName;
    let targetGender = waCustomGender;
    let targetPkgName = "";
    let targetDepDate = "";

    const selectedP = pilgrims.find((p) => p.id === waSelectedPilgrimId);
    if (selectedP && waSelectedPilgrimId) {
      targetPhone = selectedP.phone;
      targetName = selectedP.name;
      targetGender = selectedP.gender === "FEMALE" ? "FEMALE" : "MALE";
      targetPkgName = selectedP.package?.name || "";
      targetDepDate = selectedP.package?.departureDate ? formatDate(selectedP.package.departureDate, "dd MMMM yyyy") : "";
    }

    if (!targetPhone) {
      alert("Nomor WhatsApp belum diisi!");
      return;
    }

    let cleanPhone = targetPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
    else if (!cleanPhone.startsWith("62")) cleanPhone = "62" + cleanPhone;

    const msg = generatePackingWhatsAppText({
      pilgrimName: targetName,
      gender: targetGender,
      packageName: targetPkgName,
      departureDate: targetDepDate,
      companyName: travelSettings.companyName,
      phone: travelSettings.phone,
    });

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    setIsSendWaModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-emerald-600" />
            Manajemen Logistik & Panduan Perlengkapan Jamaah
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Berita Acara Serah Terima (BAST), Tanda Tangan Digital, dan Panduan Checklist Packing Bawaan Jamaah (Laki-laki / Perempuan).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "HANDOVER_BAST" ? (
            <button
              onClick={() => {
                setIsAddModalOpen(true);
                setTimeout(() => clearCanvas(), 200);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              + Buat Ceklis BAST Baru
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrintPackingModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4 text-amber-400" />
                Cetak Lembar Panduan A4
              </button>
              <button
                onClick={() => handleOpenSendWa()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                Kirim WA ke Jamaah
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 no-print">
        <button
          onClick={() => setActiveTab("HANDOVER_BAST")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "HANDOVER_BAST"
              ? "bg-white text-emerald-950 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ClipboardList className="w-4 h-4 text-emerald-600" />
          1. Berita Acara Serah Terima (BAST Travel)
        </button>

        <button
          onClick={() => setActiveTab("PACKING_GUIDE")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "PACKING_GUIDE"
              ? "bg-white text-emerald-950 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Boxes className="w-4 h-4 text-amber-600" />
          2. Panduan & Checklist Packing Jamaah (Laki-laki / Perempuan)
        </button>
      </div>

      {/* TAB 1: BAST LIST & SEARCH */}
      {activeTab === "HANDOVER_BAST" && (
        <div className="space-y-6">
          {/* Search & Package Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs no-print flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama penerima, jamaah, paket, atau petugas logistik..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                <option value="ALL">📂 Semua Paket Keberangkatan ({handovers.length} BAST)</option>
                {packages.map((pkg) => {
                  const count = handovers.filter((h) => h.pilgrim?.packageId === pkg.id).length;
                  return (
                    <option key={pkg.id} value={pkg.id}>
                      🛫 {pkg.name} ({count} BAST)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

      {/* Handover List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tanggal Penyerahan</th>
                <th className="py-3 px-4">Nama Jamaah & Paket</th>
                <th className="py-3 px-4">Nama Penerima & Petugas</th>
                <th className="py-3 px-4">Rincian Item Diserahkan</th>
                <th className="py-3 px-4">Status & TTD</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredHandovers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Belum ada riwayat serah terima perlengkapan
                  </td>
                </tr>
              ) : (
                paginatedHandovers.map((h) => {
                  const givenCount = h.items?.filter((i: any) => i.isGiven).length || 0;
                  const totalItems = h.items?.length || 0;

                  return (
                    <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{formatDate(h.handoverDate, "dd/MM/yyyy")}</p>
                        <p className="text-[10px] text-slate-400">Pukul {formatDate(h.handoverDate, "HH:mm")}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{h.pilgrim?.name}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{h.pilgrim?.package?.name}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">Penerima: {h.recipientName}</p>
                        <p className="text-[10px] text-slate-500">Petugas: {h.officerName}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {givenCount} / {totalItems} Item Diterima
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {h.signatureUrl ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              ✍️ Bertanda Tangan
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Tanpa TTD Digital</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedHandoverForPrint(h)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors"
                          title="Cetak Berita Acara Serah Terima (BAST)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Cetak BAST
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredHandovers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredHandovers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            itemLabel="serah terima"
          />
        )}
      </div>
      </div>
      )}

      {/* TAB 2: PANDUAN & CHECKLIST PACKING JAMAAH */}
      {activeTab === "PACKING_GUIDE" && (
        <div className="space-y-6">
          {/* Top Control Bar: Gender Switch & Actions */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                onClick={() => setPackingGender("FEMALE")}
                className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  packingGender === "FEMALE"
                    ? "bg-rose-500 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🧕 Perempuan / Muslimah ({WOMEN_PACKING_LIST.length} Item)
              </button>

              <button
                onClick={() => setPackingGender("MALE")}
                className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  packingGender === "MALE"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                👨 Laki-Laki / Ikhwan ({MEN_PACKING_LIST.length} Item)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrintPackingModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                Cetak Format A4 (PDF)
              </button>

              <button
                onClick={() => handleOpenSendWa()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
                Kirim WA ke Jamaah
              </button>
            </div>
          </div>

          {/* Guidelines & Safety Rules Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Aturan Skincare & Cairan
              </div>
              <p className="text-amber-950 text-[11px] leading-relaxed">
                Cairan/spray di <strong>Tas Kabin</strong> maksimal <strong>100 ml/botol</strong> (wajib botol kecil spray wudhu). Cairan lebih dari 100 ml <strong>WAJIB</strong> masuk ke <strong>Koper Bagasi Besar</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-blue-900">
                <Boxes className="w-4 h-4 text-blue-600 shrink-0" />
                Koper Bagasi (25 - 30 Kg)
              </div>
              <p className="text-blue-950 text-[11px] leading-relaxed">
                Pakaian ganti harian, gamis, daster/baju tidur, deterjen, hanger, gunting kuku/cukur dimasukkan ke Koper Besar yang masuk bagasi pesawat.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Tas Paspor / Kabin (Maks 7 Kg)
              </div>
              <p className="text-emerald-950 text-[11px] leading-relaxed">
                Paspor asli, Buku Kuning Vaksin, 1 set pakaian ihram cadangan, obat pribadi penting, sajadah lipat, HP & Powerbank (maks 20.000 mAh).
              </p>
            </div>
          </div>

          {/* Packing Items Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-600" />
                  Daftar Checklist Perlengkapan Umroh {packingGender === "MALE" ? "Laki-Laki" : "Perempuan"}
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar {currentPackingItems.length} item perlengkapan pribadi yang wajib disiapkan jamaah di koper.
                </p>
              </div>
              <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                {currentPackingItems.length} Item Total
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-3 px-4 text-center w-12">No</th>
                    <th className="py-3 px-4">Nama Barang Perlengkapan</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Catatan & Rekomendasi Khusus</th>
                    <th className="py-3 px-4 text-center">Prioritas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {currentPackingItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 text-xs">{item.name}</p>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.category === "PAKAIAN"
                            ? "bg-purple-50 text-purple-800 border border-purple-200"
                            : item.category === "IBADAH"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : item.category === "ELEKTRONIK"
                            ? "bg-blue-50 text-blue-800 border border-blue-200"
                            : item.category === "KESEHATAN"
                            ? "bg-rose-50 text-rose-800 border border-rose-200"
                            : item.category === "LAUNDRY"
                            ? "bg-cyan-50 text-cyan-800 border border-cyan-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {item.notes || "-"}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {item.isEssential ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            ★ Wajib / Esensial
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                            Standar
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Form Ceklis Serah Terima & Canvas TTD Digital */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-600" />
                Formulir Serah Terima Perlengkapan Umroh
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitHandover} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Filter Paket Keberangkatan</label>
                  <select
                    value={modalPackageFilter}
                    onChange={(e) => {
                      const nextPkg = e.target.value;
                      setModalPackageFilter(nextPkg);
                      const filtered = pilgrims.filter(
                        (p) => nextPkg === "ALL" || p.packageId === nextPkg
                      );
                      if (filtered.length > 0) {
                        setSelectedPilgrimId(filtered[0].id);
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-semibold"
                  >
                    <option value="ALL">📂 Semua Paket Keberangkatan</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        🛫 {pkg.name} ({formatDate(pkg.departureDate, "dd MMM yyyy")})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Pilih Jamaah Penerima *</label>
                  <select
                    required
                    value={selectedPilgrimId}
                    onChange={(e) => setSelectedPilgrimId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {modalPilgrims.length === 0 ? (
                      <option value="">Tidak ada jamaah di paket ini</option>
                    ) : (
                      modalPilgrims.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - ({p.package?.name})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Nama Penerima (Jika Diwakilkan)</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Nama Petugas / Tim Admin Penyerah *</label>
                  <input
                    type="text"
                    required
                    placeholder="Tim Admin"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
                  />
                </div>
              </div>

              {/* Checklist Barang Perlengkapan */}
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 space-y-2">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-emerald-600" />
                  Ceklis Item Perlengkapan yang Diserahkan (Centang):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {equipment.map((eq) => {
                    const isChecked = !!checklistItems[eq.id];
                    return (
                      <label
                        key={eq.id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? "bg-white border-emerald-300 shadow-xs"
                            : "bg-slate-100/60 border-slate-200 opacity-60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCheck(eq.id)}
                          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 truncate">{eq.name}</p>
                          <p className="text-[10px] text-slate-400">Stok: {eq.availableStock} {eq.unit}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Canvas Tanda Tangan Digital */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">
                    ✍️ Tanda Tangan Digital Penerima (Goreskan di Kotak):
                  </label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700"
                  >
                    <Eraser className="w-3.5 h-3.5" /> Hapus / Ulangi
                  </button>
                </div>
                <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-white p-1 relative overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={580}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-32 touch-none cursor-crosshair bg-slate-50/50 rounded-xl"
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs">
                      Tanda tangan di sini dengan Mouse / Jari Sentuh Layar HP
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Catatan Serah Terima</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  {loading ? "Menyimpan..." : "Konfirmasi & Simpan Serah Terima"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Lembar Berita Acara Serah Terima (BAST Siap Cetak) */}
      {selectedHandoverForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 no-print">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Berita Acara Serah Terima Perlengkapan
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  <Printer className="w-4 h-4" /> Cetak BAST
                </button>
                <button
                  onClick={() => setSelectedHandoverForPrint(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* BAST Document Template (Matching Official Letterhead) */}
            <div className="border border-slate-300 p-8 rounded-2xl bg-white text-slate-900 space-y-4 text-xs">
              {/* 1. Header KOP */}
              <div className="flex items-center gap-4 pb-1">
                <div className="h-14 w-14 flex-shrink-0 flex items-center justify-center p-0.5">
                  <img
                    src="/sulthan-haramain-logo.jpg"
                    alt="Logo Sulthan Haramain"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1 text-left">
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-950 uppercase leading-none">
                    {travelSettings.companyName || "PT BAROKAH SULTHAN HARAMAIN"}
                  </h1>
                  <p className="text-[9.5px] text-slate-700 leading-tight mt-1">
                    {travelSettings.address || "Jl. Pahlawan No.10 J, Ps. Gambir, Kec. Tebing Tinggi Kota, Kota Tebing Tinggi, Sumatera Utara 20631"}
                  </p>
                  <p className="text-[9px] font-semibold text-slate-700 leading-tight mt-0.5">
                    Telp / WhatsApp: {travelSettings.phone || "0821-6733-9464"} • Email: {travelSettings.email || "barokahsulthanharamain@gmail.com"}
                  </p>
                  <p className="text-[9px] font-bold text-slate-900 leading-tight mt-0.5 tracking-tight">
                    {travelSettings.kemenhanLicense || "Keputusan Menteri Hukum Republik Indonesia NOMOR AHU-0007388.AH.01.01.TAHUN 2026"}
                  </p>
                  <p className="text-[7.5px] sm:text-[8px] font-semibold text-slate-500 tracking-wide mt-0.5 uppercase">
                    NO. IZIN PPIU : {(travelSettings.licenseNumber || "25052200384080005")
                      .replace(/•?\s*NIB[\s\S]*/i, "")
                      .replace(/•?\s*KBLI[\s\S]*/i, "")
                      .replace(/NO\.\s*IZIN\s*PPIU\s*:\s*/i, "")
                      .trim()}
                  </p>
                </div>
              </div>

              {/* 2. Geometric Header Divider */}
              <div className="relative w-full h-4 flex items-center my-0.5 overflow-hidden">
                <div className="h-2 flex-1 bg-gradient-to-r from-amber-400 to-amber-500 rounded-l" />
                <div className="flex gap-1 px-2">
                  <div className="w-1.5 h-3 bg-amber-400 -skew-x-25" />
                  <div className="w-1.5 h-3 bg-amber-400 -skew-x-25" />
                  <div className="w-1.5 h-3 bg-amber-400 -skew-x-25" />
                  <div className="w-1.5 h-3 bg-amber-400 -skew-x-25" />
                </div>
                <div className="w-20 h-3 bg-slate-900 -skew-x-25 -mr-3" />
              </div>

              {/* Title */}
              <div className="text-center pt-1">
                <h2 className="text-xs font-black uppercase text-slate-900 underline">
                  BERITA ACARA SERAH TERIMA PERLENGKAPAN UMROH (BAST)
                </h2>
                <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                  Nomor Dokumen: BAST-LOG-{selectedHandoverForPrint.id.slice(0, 8).toUpperCase()}
                </p>
              </div>

              {/* Pilgrim Info */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <p><strong>Nama Jamaah:</strong> {selectedHandoverForPrint.pilgrim?.name}</p>
                  <p><strong>Nama Penerima:</strong> {selectedHandoverForPrint.recipientName}</p>
                  <p><strong>Paket Umroh:</strong> {selectedHandoverForPrint.pilgrim?.package?.name}</p>
                  <p><strong>Tanggal Serah Terima:</strong> {formatDate(selectedHandoverForPrint.handoverDate, "dd MMMM yyyy")}</p>
                </div>
              </div>

              {/* Checklist Table */}
              <div>
                <p className="font-bold text-slate-900 mb-1.5">Rincian Barang yang Diterima:</p>
                <table className="w-full border-collapse border border-slate-300 text-left">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="border border-slate-300 p-2 text-center w-10">No</th>
                      <th className="border border-slate-300 p-2">Nama Barang / Perlengkapan</th>
                      <th className="border border-slate-300 p-2 text-center w-16">Jumlah</th>
                      <th className="border border-slate-300 p-2 text-center w-24">Status Cek</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedHandoverForPrint.items?.map((item: any, idx: number) => (
                      <tr key={item.id}>
                        <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 font-medium">{item.equipment?.name}</td>
                        <td className="border border-slate-300 p-2 text-center font-bold">{item.quantity} {item.equipment?.unit}</td>
                        <td className="border border-slate-300 p-2 text-center font-bold text-emerald-800">
                          {item.isGiven ? "✓ Diterima" : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-slate-600 italic">
                Catatan: {selectedHandoverForPrint.notes || "Semua barang dalam kondisi baik dan lengkap."}
              </p>

              {/* Signatures */}
              <div className="pt-4 grid grid-cols-2 gap-4 text-center border-t border-slate-200">
                <div>
                  <p className="text-slate-600 font-medium">Tim Admin / Penyerah</p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-xs font-serif italic text-slate-500">[TTD Tim Admin]</span>
                  </div>
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block px-4">
                    {selectedHandoverForPrint.officerName || "Tim Admin"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-600 font-medium">Jamaah / Penerima Barang</p>
                  <div className="h-16 flex items-center justify-center">
                    {selectedHandoverForPrint.signatureUrl ? (
                      <img
                        src={selectedHandoverForPrint.signatureUrl}
                        alt="Tanda Tangan Digital"
                        className="max-h-14 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs font-serif italic text-slate-500">[Tanda Tangan]</span>
                    )}
                  </div>
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block px-4">
                    {selectedHandoverForPrint.recipientName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Cetak Lembar Panduan Packing A4 */}
      {isPrintPackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 no-print">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  Dokumen Panduan Manasik & Packing Koper
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Cetak Checklist Perlengkapan Umroh {packingGender === "MALE" ? "Laki-Laki" : "Perempuan"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-400" /> Cetak Lembar (Print/PDF)
                </button>
                <button
                  onClick={() => setIsPrintPackingModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="border border-slate-300 p-8 rounded-2xl bg-white text-slate-900 space-y-4 text-xs">
              {/* 1. Header KOP */}
              <div className="flex items-center gap-4 pb-1">
                <div className="h-14 w-14 flex-shrink-0 flex items-center justify-center p-0.5">
                  <img
                    src="/sulthan-haramain-logo.jpg"
                    alt="Logo Sulthan Haramain"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1 text-left">
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-950 uppercase leading-none">
                    {travelSettings.companyName || "PT BAROKAH SULTHAN HARAMAIN"}
                  </h1>
                  <p className="text-[9.5px] text-slate-700 leading-tight mt-1">
                    {travelSettings.address || "Jl. Pahlawan No.10 J, Ps. Gambir, Kec. Tebing Tinggi Kota, Kota Tebing Tinggi, Sumatera Utara 20631"}
                  </p>
                  <p className="text-[9px] font-semibold text-slate-700 leading-tight mt-0.5">
                    Telp / WhatsApp: {travelSettings.phone || "0821-6733-9464"} • Email: {travelSettings.email || "barokahsulthanharamain@gmail.com"}
                  </p>
                  <p className="text-[9px] font-bold text-slate-900 leading-tight mt-0.5 tracking-tight">
                    {travelSettings.kemenhanLicense || "Keputusan Menteri Hukum Republik Indonesia NOMOR AHU-0007388.AH.01.01.TAHUN 2026"}
                  </p>
                  <p className="text-[7.5px] sm:text-[8px] font-semibold text-slate-500 tracking-wide mt-0.5 uppercase">
                    NO. IZIN PPIU : {(travelSettings.licenseNumber || "25052200384080005")
                      .replace(/•?\s*NIB[\s\S]*/i, "")
                      .replace(/•?\s*KBLI[\s\S]*/i, "")
                      .replace(/NO\.\s*IZIN\s*PPIU\s*:\s*/i, "")
                      .trim()}
                  </p>
                </div>
              </div>

              {/* 2. Geometric Header Divider */}
              <div className="relative w-full h-4 flex items-center my-0.5 overflow-hidden">
                <div className="h-2 flex-1 bg-gradient-to-r from-amber-400 to-amber-500 rounded-l" />
                <div className="flex gap-1 px-2">
                  <div className="w-1.5 h-3 bg-amber-400 -skew-x-25" />
                  <div className="w-1.5 h-3 bg-amber-400 -skew-x-25" />
                  <div className="w-1.5 h-3 bg-amber-400 -skew-x-25" />
                  <div className="w-1.5 h-3 bg-amber-400 -skew-x-25" />
                </div>
                <div className="w-20 h-3 bg-slate-900 -skew-x-25 -mr-3" />
              </div>

              {/* Title */}
              <div className="text-center pt-1">
                <h2 className="text-xs font-black uppercase text-slate-900 underline">
                  PANDUAN CHECKLIST PERSIAPAN PERLENGKAPAN UMROH ({packingGender === "MALE" ? "LAKI-LAKI" : "PEREMPUAN"})
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Lampiran Wajib Bawaan Koper Jamaah • Harap diceklis (✓) sebelum keberangkatan
                </p>
              </div>

              {/* Table of items */}
              <div>
                <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="border border-slate-300 p-1.5 text-center w-8">Cek</th>
                      <th className="border border-slate-300 p-1.5 text-center w-8">No</th>
                      <th className="border border-slate-300 p-1.5">Nama Barang Perlengkapan</th>
                      <th className="border border-slate-300 p-1.5">Catatan / Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPackingItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="border border-slate-300 p-1.5 text-center font-bold text-slate-400 font-mono">
                          [ &nbsp; ]
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-semibold text-slate-600">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-300 p-1.5 font-bold text-slate-900">
                          {item.name}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-slate-600 text-[10px]">
                          {item.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Flight & Luggage Notice */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10px] space-y-1 text-slate-700">
                <p className="font-bold text-slate-900">⚠️ Catatan Penting Bagasi & Penerbangan:</p>
                <p>1. <strong>Koper Bagasi Besar:</strong> Maksimal berat 25-30 kg per jamaah. Masukkan cairan/skincare lebih dari 100 ml, gunting kuku, dan pisau cukur ke koper bagasi.</p>
                <p>2. <strong>Tas Kabin / Tas Paspor:</strong> Paspor asli, buku kuning meningitis, obat pribadi harian, sajadah lipat, HP & Powerbank (maks 20.000 mAh). Dilarang membawa cairan &gt; 100 ml di kabin.</p>
              </div>

              {/* Footer */}
              <div className="pt-3 flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-200">
                <p>Semoga ibadah umroh Bapak/Ibu lancar dan meraih predikat Umroh yang Mabrur.</p>
                <p className="font-bold text-slate-900">Bagian Operasional & Logistik Sulthan Haramain</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Kirim WhatsApp Panduan Packing */}
      {isSendWaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                Kirim Panduan Packing via WhatsApp
              </h3>
              <button
                onClick={() => setIsSendWaModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Opsi Pilih Jamaah Terdaftar */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Pilih Jamaah Terdaftar:
                </label>
                <select
                  value={waSelectedPilgrimId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setWaSelectedPilgrimId(id);
                    const p = pilgrims.find((item) => item.id === id);
                    if (p) {
                      setWaCustomName(p.name);
                      setWaCustomPhone(p.phone);
                      setWaCustomGender(p.gender === "FEMALE" ? "FEMALE" : "MALE");
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Masukkan Nomor Manual di Bawah --</option>
                  {pilgrims.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gender === "FEMALE" ? "Perempuan" : "Laki-Laki"}) - {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data Manual / Edit */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Jamaah:</label>
                  <input
                    type="text"
                    value={waCustomName}
                    onChange={(e) => setWaCustomName(e.target.value)}
                    placeholder="Nama Lengkap Jamaah"
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor WhatsApp:</label>
                  <input
                    type="tel"
                    value={waCustomPhone}
                    onChange={(e) => setWaCustomPhone(e.target.value)}
                    placeholder="0821xxxxxxxx"
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Gender Switch */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Kategori Checklist:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setWaCustomGender("FEMALE")}
                    className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      waCustomGender === "FEMALE"
                        ? "bg-rose-500 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    🧕 Perempuan ({WOMEN_PACKING_LIST.length} Item)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaCustomGender("MALE")}
                    className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      waCustomGender === "MALE"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    👨 Laki-Laki ({MEN_PACKING_LIST.length} Item)
                  </button>
                </div>
              </div>

              {/* Preview Message Box */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Preview Teks WhatsApp:</label>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-44 overflow-y-auto text-[11px] font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {generatePackingWhatsAppText({
                    pilgrimName: waCustomName || "Bapak / Ibu Jamaah",
                    gender: waCustomGender,
                    companyName: travelSettings.companyName,
                    phone: travelSettings.phone,
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSendWaModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendWaSubmit}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" /> Buka WhatsApp & Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
