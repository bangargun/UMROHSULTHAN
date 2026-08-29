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
} from "lucide-react";
import { formatDate } from "@/lib/utils";

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
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedPackageId, setSelectedPackageId] = useState("ALL");
  const [modalPackageFilter, setModalPackageFilter] = useState("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedHandoverForPrint, setSelectedHandoverForPrint] = useState<any | null>(null);

  // Form states
  const [selectedPilgrimId, setSelectedPilgrimId] = useState(pilgrims[0]?.id || "");
  const [officerName, setOfficerName] = useState("Budi Santoso (Logistik)");
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

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-emerald-600" />
            Form Ceklis Serah Terima Perlengkapan (Logistik Handover)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan penyerahan koper, kain ihram, seragam, dan buku doa lengkap dengan Tanda Tangan Digital jamaah.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAddModalOpen(true);
            setTimeout(() => clearCanvas(), 200);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          + Buat Ceklis Serah Terima Baru
        </button>
      </div>

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
                filteredHandovers.map((h) => {
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
      </div>

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
                  <p className="text-slate-600 font-medium">Petugas Logistik / Penyerah</p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-xs font-serif italic text-slate-500">[TTD Petugas]</span>
                  </div>
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block px-4">
                    {selectedHandoverForPrint.officerName}
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
    </div>
  );
}
