"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Shirt,
  Utensils,
  Plus,
  Trash2,
  Save,
  Printer,
  Copy,
  Check,
  Sparkles,
  X,
  Hotel,
  Plane,
  ChevronDown,
  ChevronUp,
  FileText,
  Share2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ItineraryDayItem {
  id?: string;
  dayNumber: number;
  date?: string | Date;
  title: string;
  time?: string;
  location?: string;
  dresscode?: string;
  mealPlan?: string;
  description?: string;
  notes?: string;
}

interface PackageItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: any;
  onRefresh?: () => void;
}

export default function PackageItineraryModal({
  isOpen,
  onClose,
  pkg,
  onRefresh,
}: PackageItineraryModalProps) {
  const [days, setDays] = useState<ItineraryDayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);

  // Fetch or initialize itinerary for package
  useEffect(() => {
    if (isOpen && pkg?.id) {
      fetchItinerary();
    }
  }, [isOpen, pkg]);

  const fetchItinerary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/packages/${pkg.id}/itinerary`);
      const data = await res.json();
      if (res.ok && data.itineraries) {
        setDays(data.itineraries);
      }
    } catch (err) {
      console.error("Error loading itinerary:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async (templateType: "DAYS_9" | "DAYS_12") => {
    if (!confirm(`Terapkan preset rundown standar ${templateType === "DAYS_12" ? "12 Hari (+ Thaif & Kereta Cepat)" : "9 Hari"} untuk paket ini?`)) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/packages/${pkg.id}/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateType }),
      });
      const data = await res.json();
      if (res.ok && data.itineraries) {
        setDays(data.itineraries);
        alert(data.message || "Template berhasil diterapkan!");
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menerapkan template");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/packages/${pkg.id}/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: days }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("✅ Jadwal Itinerary berhasil disimpan!");
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || "Gagal menyimpan itinerary");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleAddDay = () => {
    const nextDayNum = days.length + 1;
    const itemDate = new Date(pkg.departureDate);
    itemDate.setDate(itemDate.getDate() + (nextDayNum - 1));

    setDays([
      ...days,
      {
        dayNumber: nextDayNum,
        date: itemDate,
        title: `Hari ${nextDayNum}: Agenda Ibadah & Ziarah`,
        time: "08:00 WSA",
        location: `Makkah / Madinah`,
        dresscode: "Batik Travel Resmi",
        mealPlan: "Fullboard Hotel",
        description: "Rundown kegiatan ibadah bersama pembimbing/muthawwif.",
        notes: "Kumpul di lobby hotel tepat waktu.",
      },
    ]);
  };

  const handleDeleteDay = (index: number) => {
    if (!confirm(`Hapus agenda Hari ke-${days[index].dayNumber}?`)) return;
    const updated = days.filter((_, i) => i !== index).map((item, i) => ({
      ...item,
      dayNumber: i + 1,
    }));
    setDays(updated);
  };

  const handleUpdateDayField = (index: number, field: keyof ItineraryDayItem, value: any) => {
    setDays((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleCopyWhatsapp = () => {
    let text = `🕋 *RUNDOWN ITINERARY RESMI PERJALANAN UMROH*\n`;
    text += `*PT BAROKAH SULTHAN HARAMAIN*\n`;
    text += `Program: *${pkg.name}* (${pkg.durationDays || days.length} Hari)\n`;
    text += `Keberangkatan: *${formatDate(pkg.departureDate, "dd MMMM yyyy")}*\n`;
    text += `Maskapai: *${pkg.airline}* | Hotel: *${pkg.hotelMakkah}* & *${pkg.hotelMadinah}*\n`;
    text += `-------------------------------------------\n\n`;

    days.forEach((d) => {
      const dateFormatted = d.date ? formatDate(d.date, "dd MMM yyyy") : "";
      text += `📅 *HARI ${d.dayNumber}* (${dateFormatted})\n`;
      text += `✨ *${d.title}*\n`;
      if (d.time) text += `⏰ Waktu: ${d.time}\n`;
      if (d.location) text += `📍 Lokasi: ${d.location}\n`;
      if (d.dresscode) text += `👔 Pakaian: ${d.dresscode}\n`;
      if (d.description) text += `📝 Kegiatan: ${d.description}\n`;
      if (d.notes) text += `💡 Tips: _${d.notes}_\n`;
      text += `\n`;
    });

    text += `_Konsultasi & Pendaftaran: PT Barokah Sulthan Haramain (0821-6733-9464)_`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 p-5 sm:p-6 text-white shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded border border-amber-300/30">
                🗓️ Manajemen Itinerary Terpadu
              </span>
              <span className="text-xs text-emerald-200">
                {pkg.durationDays || days.length} Hari Program
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black mt-1 text-white">
              {pkg.name}
            </h2>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              🛫 {formatDate(pkg.departureDate, "dd MMMM yyyy")} s/d {formatDate(pkg.returnDate, "dd MMMM yyyy")} • ✈️ {pkg.airline}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopyWhatsapp}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Salin Rundown untuk WhatsApp"
            >
              {copied ? <Check className="w-4 h-4 text-amber-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Tersalin ke WA!" : "Salin WA"}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500 text-[11px]">Terapkan Preset Cepat:</span>
            <button
              onClick={() => handleApplyTemplate("DAYS_9")}
              disabled={saving}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 shadow-2xs transition-all flex items-center gap-1 text-[11px]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Preset 9 Hari (Madinah - Makkah)
            </button>
            <button
              onClick={() => handleApplyTemplate("DAYS_12")}
              disabled={saving}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 shadow-2xs transition-all flex items-center gap-1 text-[11px]"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Preset 12 Hari (+ Thaif & Kereta Cepat)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddDay}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> + Tambah Hari
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>

        {/* Itinerary Days List (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-slate-100/60">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
              <p className="text-xs font-bold">Memuat data itinerary paket...</p>
            </div>
          ) : days.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-black text-slate-800">Belum Ada Rundown Terjadwal</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Gunakan tombol preset di atas untuk langsung mengisi template standar umroh 9 hari atau 12 hari secara instan.
              </p>
            </div>
          ) : (
            days.map((day, idx) => {
              const dayDate = day.date ? formatDate(day.date, "dd MMMM yyyy") : "";

              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs transition-all space-y-4 hover:border-slate-300"
                >
                  {/* Top Day Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                        H-{day.dayNumber}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">
                            Hari Ke-{day.dayNumber}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            • {dayDate}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={day.title}
                          onChange={(e) => handleUpdateDayField(idx, "title", e.target.value)}
                          placeholder="Judul Agenda Hari Ini (contoh: Ziarah Raudhah & Masjid Nabawi)"
                          className="font-bold text-slate-900 text-sm mt-0.5 w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none py-0.5"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteDay(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-all self-end sm:self-auto cursor-pointer"
                      title="Hapus Hari Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Grid Fields: Waktu, Lokasi, Dresscode, Meal */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {/* Waktu & Jam */}
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" /> Jam / Waktu Kumpul
                      </label>
                      <input
                        type="text"
                        value={day.time || ""}
                        onChange={(e) => handleUpdateDayField(idx, "time", e.target.value)}
                        placeholder="Contoh: 07:30 WSA"
                        className="mt-1 w-full rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-900 focus:bg-white font-semibold"
                      />
                    </div>

                    {/* Lokasi / Titik Kumpul */}
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" /> Lokasi / Titik Kumpul
                      </label>
                      <input
                        type="text"
                        value={day.location || ""}
                        onChange={(e) => handleUpdateDayField(idx, "location", e.target.value)}
                        placeholder="Contoh: Lobby Hotel Dallah Taibah"
                        className="mt-1 w-full rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-900 focus:bg-white font-semibold"
                      />
                    </div>

                    {/* Dresscode / Seragam */}
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <Shirt className="w-3 h-3 text-emerald-600" /> Seragam / Pakaian
                      </label>
                      <input
                        type="text"
                        value={day.dresscode || ""}
                        onChange={(e) => handleUpdateDayField(idx, "dresscode", e.target.value)}
                        placeholder="Contoh: Batik Travel / Kain Ihram"
                        className="mt-1 w-full rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-900 focus:bg-white font-semibold"
                      />
                    </div>
                  </div>

                  {/* Description / Detail Rundown */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Rincian Kegiatan & Panduan Ibadah:
                    </label>
                    <textarea
                      rows={2}
                      value={day.description || ""}
                      onChange={(e) => handleUpdateDayField(idx, "description", e.target.value)}
                      placeholder="Jelaskan alur kegiatan, ziarah, rute, atau panduan pelaksanaan ibadah hari ini..."
                      className="mt-1 w-full rounded-2xl border border-slate-200 p-2.5 bg-slate-50 text-slate-900 text-xs focus:bg-white leading-relaxed"
                    />
                  </div>

                  {/* Notes / Tips */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Catatan Tour Leader / Tips Ibadah Jamaah:
                    </label>
                    <input
                      type="text"
                      value={day.notes || ""}
                      onChange={(e) => handleUpdateDayField(idx, "notes", e.target.value)}
                      placeholder="Contoh: Bawa sandal di tas serut, jaga wudhu, dan siapkan paspor/tasreh."
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-800 text-xs focus:bg-white italic"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500 font-mono">
            Total {days.length} hari kegiatan terkonfigurasi.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              {saving ? "Menyimpan..." : "Simpan Itinerary"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
