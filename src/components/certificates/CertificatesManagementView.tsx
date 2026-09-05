"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Printer,
  Share2,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Calendar,
  User,
  Building2,
  Download,
  Eye,
  Trash2,
  ExternalLink,
  Sparkles,
  QrCode,
  ShieldCheck,
  Send,
  Loader2,
  Check,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CertificatesManagementViewProps {
  pilgrims: any[];
  packages: any[];
  onRefresh: () => void;
}

export default function CertificatesManagementView({
  pilgrims = [],
  packages = [],
  onRefresh,
}: CertificatesManagementViewProps) {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [travelSettings, setTravelSettings] = useState<any>({
    companyName: "PT SULTHAN HARAMAIN TOUR & TRAVEL",
    licenseNumber: "12440003512340002",
    directorName: "Attiyatul Amra",
    directorTitle: "Direktur Utama",
    address: "Jl. HR. Soebrantas No. 88, Panam, Pekanbaru, Riau",
    phone: "082167339464",
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPackageFilter, setSelectedPackageFilter] = useState("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedCertForPrint, setSelectedCertForPrint] = useState<any | null>(null);
  const [batchPackageId, setBatchPackageId] = useState(packages[0]?.id || "");
  const [modalPackageId, setModalPackageId] = useState(packages[0]?.id || "ALL");
  const [generating, setGenerating] = useState(false);

  // Single Form State
  const [formData, setFormData] = useState({
    pilgrimId: pilgrims[0]?.id || "",
    muthawwifName: "Ustadz Pembimbing Ibadah",
    directorName: "Attiyatul Amra",
    directorTitle: "Direktur Utama",
    issueDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/certificates");
      if (res.ok) {
        const data = await res.json();
        setCertificates(data);
      }
    } catch (e) {
      console.error("Error fetching certificates:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.companyName) {
          setTravelSettings(data);
          if (data.directorName) {
            setFormData((prev) => ({
              ...prev,
              directorName: data.directorName || "Attiyatul Amra",
              directorTitle: data.directorTitle || "Direktur Utama",
            }));
          }
        }
      })
      .catch((e) => console.error(e));
  }, []);

  // Filtered Certificates
  const filteredCertificates = certificates.filter((c) => {
    const matchSearch =
      c.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.pilgrim?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.pilgrim?.passportNumber && c.pilgrim.passportNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.packageName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchPackage = selectedPackageFilter === "ALL" || c.packageId === selectedPackageFilter;
    return matchSearch && matchPackage;
  });

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const newCert = await res.json();
        setIsAddModalOpen(false);
        fetchCertificates();
        setSelectedCertForPrint(newCert);
        onRefresh();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal membuat sertifikat");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchPackageId) {
      alert("Pilih paket keberangkatan");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch: true,
          packageId: batchPackageId,
          directorName: travelSettings.directorName || "Attiyatul Amra",
          directorTitle: travelSettings.directorTitle || "Direktur Utama",
          issueDate: new Date().toISOString().split("T")[0],
        }),
      });
      if (res.ok) {
        const result = await res.json();
        alert(result.message || "Berhasil menerbitkan sertifikat massal!");
        setIsBatchModalOpen(false);
        fetchCertificates();
        onRefresh();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal membuat sertifikat massal");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus sertifikat ini?")) return;
    try {
      const res = await fetch(`/api/certificates/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCertificates();
        if (selectedCertForPrint?.id === id) setSelectedCertForPrint(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendWA = (cert: any) => {
    const pilgrimPhone = cert.pilgrim?.phone ? cert.pilgrim.phone.replace(/[^0-9]/g, "") : "";
    const validPhone = pilgrimPhone.startsWith("0") ? "62" + pilgrimPhone.slice(1) : pilgrimPhone;

    const message = `Assalamu'alaikum Wr. Wb.

Yth. *${cert.pilgrim?.name}*,

Alhamdulillahirabbil'alamin, segenap pimpinan & manajemen *${travelSettings.companyName || "PT SULTHAN HARAMAIN TOUR & TRAVEL"}* mengucapkan selamat atas terselesaikannya seluruh rangkaian Ibadah Umroh pada program *${cert.packageName}*.

Semoga Allah SWT menerima seluruh amal ibadah dan menjadikannya *Umroh yang Mabrur/Mabruroh* (جَعَلَهُ اللّٰهُ عُمْرَةً مَبْرُوْرَةً).

📜 *Piagam / E-Sertifikat Resmi Anda telah diterbitkan:*
• No. Piagam: *${cert.certificateNumber}*
• Nama Jamaah: *${cert.pilgrim?.name}*
• Direktur Utama: *${cert.directorName || "Attiyatul Amra"}*

Link Verifikasi & E-Sertifikat Digital:
${typeof window !== "undefined" ? window.location.origin : ""}/verifikasi-sertifikat/${encodeURIComponent(cert.certificateNumber)}

Terima kasih atas kepercayaan Bapak/Ibu bersama Sulthan Haramain. Sampai jumpa di Baitullah berikutnya!

Wassalamu'alaikum Wr. Wb.`;

    window.open(`https://wa.me/${validPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <Award className="w-64 h-64 text-amber-300" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/30 border border-amber-300/40 text-amber-200 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Layanan Pasca-Kepulangan Jamaah
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Piagam & Sertifikat Umroh Resmi (Syahadah Al-Umrah)
          </h1>
          <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
            Terbitkan piagam penghargaan ibadah umroh resmi berizin PPIU untuk jamaah yang telah menyelesaikan seluruh rangkaian ibadah di Tanah Suci. Siap cetak A4 Landscape & kirim otomatis via WhatsApp.
          </p>

          <div className="pt-3 flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs shadow-lg transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Terbitkan Massal 1 Kloter
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> + Terbitkan Piagam Baru
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama jamaah, no. paspor, atau no. piagam..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedPackageFilter}
            onChange={(e) => setSelectedPackageFilter(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
          >
            <option value="ALL">Semua Paket Keberangkatan</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} ({formatDate(pkg.departureDate, "dd MMM yyyy")})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
            <p className="text-xs">Memuat data sertifikat umroh...</p>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Belum Ada Piagam yang Diterbitkan</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Klik tombol di atas untuk menerbitkan sertifikat umroh massal untuk 1 rombongan atau per individu jamaah.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-3 px-4">No. Piagam</th>
                  <th className="py-3 px-4">Nama Jamaah</th>
                  <th className="py-3 px-4">Program Paket</th>
                  <th className="py-3 px-4">Tanggal Terbit</th>
                  <th className="py-3 px-4">Tanda Tangan</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-900">
                      {cert.certificateNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-black text-slate-900">{cert.pilgrim?.name}</p>
                      <p className="text-[10px] text-slate-400">
                        Paspor: {cert.pilgrim?.passportNumber || "-"} • HP: {cert.pilgrim?.phone}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{cert.packageName}</p>
                      <p className="text-[10px] text-slate-400">
                        {cert.departureDate ? formatDate(cert.departureDate, "dd MMM") : ""} -{" "}
                        {cert.returnDate ? formatDate(cert.returnDate, "dd MMM yyyy") : ""}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {formatDate(cert.issueDate, "dd MMMM yyyy")}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <p className="font-bold text-slate-900">{cert.directorName || "Attiyatul Amra"}</p>
                      <p className="text-[10px] text-slate-400">{cert.directorTitle || "Direktur Utama"}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedCertForPrint(cert)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1 transition-all"
                          title="Lihat & Cetak Piagam"
                        >
                          <Printer className="w-3.5 h-3.5" /> Cetak
                        </button>
                        <button
                          onClick={() => handleSendWA(cert)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-1 transition-all"
                          title="Kirim Piagam via WhatsApp"
                        >
                          <Send className="w-3.5 h-3.5" /> WA
                        </button>
                        <button
                          onClick={() => handleDelete(cert.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Hapus Sertifikat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Terbitkan Sertifikat Satuan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                Terbitkan Piagam Umroh Baru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSingle} className="space-y-3.5 text-xs">
              {/* 1. Filter Program Paket Umroh */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  1. Pilih Program Paket Umroh *
                </label>
                <select
                  value={modalPackageId}
                  onChange={(e) => {
                    const newPkgId = e.target.value;
                    setModalPackageId(newPkgId);
                    const pFiltered = newPkgId === "ALL" ? pilgrims : pilgrims.filter((p) => p.packageId === newPkgId);
                    setFormData((prev) => ({
                      ...prev,
                      pilgrimId: pFiltered[0]?.id || "",
                    }));
                  }}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="ALL">-- Semua Paket Keberangkatan --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      🛫 {pkg.name} ({formatDate(pkg.departureDate, "dd MMM yyyy")})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Dropdown Nama Jamaah (Otomatis Terfilter) */}
              {(() => {
                const filteredModalPilgrims = modalPackageId === "ALL"
                  ? pilgrims
                  : pilgrims.filter((p) => p.packageId === modalPackageId);

                return (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-800 block">
                        2. Pilih Nama Jamaah *
                      </label>
                      <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                        {filteredModalPilgrims.length} Jamaah Tersedia
                      </span>
                    </div>
                    <select
                      required
                      value={formData.pilgrimId}
                      onChange={(e) => setFormData({ ...formData, pilgrimId: e.target.value })}
                      className="w-full rounded-xl border border-amber-300 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                    >
                      <option value="">-- Pilih Jamaah Terdaftar --</option>
                      {filteredModalPilgrims.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - (Paspor: {p.passportNumber || "-"}) - HP: {p.phone}
                        </option>
                      ))}
                    </select>
                    {filteredModalPilgrims.length === 0 && (
                      <p className="text-[10px] text-amber-700 mt-1">
                        Belum ada jamaah yang terdaftar pada program paket yang dipilih di atas.
                      </p>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Direktur Utama</label>
                  <input
                    type="text"
                    required
                    value={formData.directorName}
                    onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jabatan</label>
                  <input
                    type="text"
                    required
                    value={formData.directorTitle}
                    onChange={(e) => setFormData({ ...formData, directorTitle: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tanggal Terbit Piagam</label>
                <input
                  type="date"
                  required
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="e.g. Kloter 1 Gelombang September"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
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
                  disabled={generating}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                  Terbitkan Piagam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Terbitkan Massal per Paket */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                Terbitkan Piagam Massal 1 Kloter
              </h3>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Paket Keberangkatan *</label>
                <select
                  required
                  value={batchPackageId}
                  onChange={(e) => setBatchPackageId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-900"
                >
                  <option value="">-- Pilih Paket --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({formatDate(pkg.departureDate, "dd MMM yyyy")})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                Sistem akan secara otomatis membuat piagam penghargaan resmi dengan nomor registrasi unik untuk seluruh jamaah terdaftar pada paket ini yang belum memiliki sertifikat.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-md transition-all flex items-center gap-1.5"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Proses Terbitkan Semua
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: LEMBAR PIAGAM MEWAH A4 LANDSCAPE (PRINTABLE CERTIFICATE) */}
      {selectedCertForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-amber-400 overflow-hidden my-auto">
            {/* Action Bar (Not Printed) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-xs sm:text-sm">
                  Pratinjau Piagam Resmi: {selectedCertForPrint.certificateNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendWA(selectedCertForPrint)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" /> Kirim WA
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Printer className="w-4 h-4" /> Cetak A4 Landscape
                </button>
                <button
                  onClick={() => setSelectedCertForPrint(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-base"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* CERTIFICATE CANVAS (A4 Landscape Print Target) */}
            <div
              id="printable-certificate"
              className="bg-[#fcfaf5] p-6 sm:p-10 text-slate-900 relative print:p-8 select-none"
              style={{ minHeight: "600px" }}
            >
              {/* Outer Gold Ornamental Border */}
              <div className="border-[6px] border-double border-[#c59b27] p-6 sm:p-8 rounded-2xl relative bg-[#fffdfa] shadow-inner">
                {/* Corner Decorative Ornaments */}
                <div className="absolute top-2 left-2 text-[#c59b27] text-xl font-serif">❖</div>
                <div className="absolute top-2 right-2 text-[#c59b27] text-xl font-serif">❖</div>
                <div className="absolute bottom-2 left-2 text-[#c59b27] text-xl font-serif">❖</div>
                <div className="absolute bottom-2 right-2 text-[#c59b27] text-xl font-serif">❖</div>

                {/* Inner Thin Border */}
                <div className="border border-[#e2caa0] p-6 rounded-xl space-y-4 sm:space-y-5 text-center relative">
                  {/* 1. PALING ATAS: LOGO PERUSAHAAN SAJA (CENTERED & ELEGAN) */}
                  <div className="flex justify-center pt-1">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 p-1.5 bg-white rounded-2xl border-2 border-[#c59b27]/50 shadow-xs flex items-center justify-center">
                      <img
                        src="/sulthan-haramain-logo.jpg"
                        alt="Logo Sulthan Haramain"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>

                  {/* 2. ARABIC CALLIGRAPHY TITLE */}
                  <div className="pt-1">
                    <p className="font-serif text-2xl sm:text-3xl font-bold text-[#8c6d1f] tracking-widest">
                      شَهَادَةُ إِتْمَامِ مَنَاسِكِ الْعُمْرَةِ
                    </p>
                    <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#c59b27] to-transparent mx-auto mt-1" />
                  </div>

                  {/* 3. MAIN TITLE & CERT NUMBER */}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif font-black tracking-widest text-[#59400f] uppercase">
                      PIAGAM PENGHARGAAN IBADAH UMROH
                    </h2>
                    <p className="font-mono text-[11px] font-bold text-slate-600 mt-0.5">
                      Nomor Registrasi: {selectedCertForPrint.certificateNumber}
                    </p>
                  </div>

                  {/* 4. CERTIFICATE BODY */}
                  <div className="space-y-2 max-w-3xl mx-auto text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <p className="italic text-slate-600">Diberikan dengan penuh rasa syukur dan hormat kepada:</p>
                    
                    <div className="py-2">
                      <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#6d4e11] tracking-wide uppercase underline decoration-[#c59b27] decoration-2 underline-offset-8">
                        {selectedCertForPrint.pilgrim?.name}
                      </h1>
                      {selectedCertForPrint.pilgrim?.passportNumber && (
                        <p className="text-xs font-mono font-bold text-slate-600 mt-2">
                          No. Paspor: {selectedCertForPrint.pilgrim.passportNumber}
                        </p>
                      )}
                    </div>

                    <p className="px-4 text-xs sm:text-sm text-slate-800">
                      Atas terselesaikannya seluruh rangkaian manasik dan pelaksanaan <strong>Ibadah Umroh</strong> di Tanah Suci Makkah Al-Mukarramah serta Ziarah di Madinah Al-Munawwarah pada program:
                    </p>
                    <p className="font-black text-sm sm:text-base text-[#7a5813] uppercase">
                      « {selectedCertForPrint.packageName} »
                    </p>
                    {(selectedCertForPrint.departureDate || selectedCertForPrint.returnDate) && (
                      <p className="text-xs text-slate-600 font-medium">
                        Periode: {selectedCertForPrint.departureDate ? formatDate(selectedCertForPrint.departureDate, "dd MMMM yyyy") : ""} s/d{" "}
                        {selectedCertForPrint.returnDate ? formatDate(selectedCertForPrint.returnDate, "dd MMMM yyyy") : ""}
                      </p>
                    )}
                  </div>

                  {/* 5. ARABIC PRAYER / DOA MABRUR */}
                  <div className="p-3 bg-[#fdfcf7] rounded-xl border border-[#ebd8b7] max-w-2xl mx-auto space-y-1">
                    <p className="font-serif text-base sm:text-lg font-bold text-[#6d4e11]">
                      جَعَلَهُ اللّٰهُ عُمْرَةً مَبْرُوْرَةً وَذَنْبًا مَغْفُوْرًا وَسَعْيًا مَشْكُوْرًا
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-600 italic">
                      "Semoga Allah SWT menerima ibadah umrohnya, mengampuni dosa-dosanya, dan membalasnya dengan sebaik-baik balasan kemabruran."
                    </p>
                  </div>

                  {/* 6. SIGNATURE & SCANNABLE QR CODE (HANYA QR CODE & DIREKTUR UTAMA) */}
                  {(() => {
                    const verificationUrl = typeof window !== "undefined"
                      ? `${window.location.origin}/verifikasi-sertifikat/${encodeURIComponent(selectedCertForPrint.certificateNumber)}`
                      : `https://portalumroh.barokahgroupindonesia.tech/verifikasi-sertifikat/${encodeURIComponent(selectedCertForPrint.certificateNumber)}`;

                    return (
                      <div className="pt-4 flex items-end justify-between max-w-2xl mx-auto text-xs px-4 sm:px-8">
                        {/* QR Code Verifikasi Resmi (Bisa Discan dengan Kamera HP) */}
                        <div className="text-center flex flex-col items-center justify-center space-y-1.5">
                          <a
                            href={verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-white rounded-xl border-2 border-[#c59b27] shadow-sm hover:scale-105 transition-all block group"
                            title="Klik untuk membuka verifikasi keabsahan sertifikat"
                          >
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verificationUrl)}`}
                              alt="QR Code Verifikasi Resmi"
                              className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                            />
                          </a>
                          <div className="text-center">
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider block">
                              ✓ Scan Verifikasi Sah
                            </span>
                            <span className="text-[8px] text-slate-400 font-mono mt-0.5 block">
                              {selectedCertForPrint.certificateNumber}
                            </span>
                          </div>
                        </div>

                        {/* Direktur Utama Signature (Attiyatul Amra) */}
                        <div className="text-center space-y-1 w-64">
                          <p className="text-[11px] text-slate-600 font-medium">
                            {travelSettings.city || "Tebing Tinggi"}, {formatDate(selectedCertForPrint.issueDate, "dd MMMM yyyy")}
                            <br />
                            <strong>{travelSettings.companyName || "PT Sulthan Haramain"}</strong>
                          </p>
                          <div className="h-16 flex items-center justify-center">
                            <span className="font-serif italic text-xs text-slate-400">[Tanda Tangan & Stempel]</span>
                          </div>
                          <p className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                            {selectedCertForPrint.directorName || "ATIYATUL AMRA"}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {selectedCertForPrint.directorTitle || "Direktur Utama"}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 7. FOOTER RESMI DENGAN TULISAN KECIL RAPI DI BAGIAN PALING BAWAH */}
                  <div className="pt-4 border-t border-[#ebd8b7] text-center space-y-0.5 text-[9px] sm:text-[9.5px] text-slate-500 leading-tight">
                    <p className="font-bold text-slate-700 uppercase tracking-wider">
                      {travelSettings.companyName || "PT BAROKAH SULTHAN HARAMAIN"} • BAROKAH GROUP INDONESIA
                    </p>
                    <p>
                      {travelSettings.kemenhanLicense || "Keputusan Menteri Hukum RI NOMOR AHU-0007388.AH.01.01.TAHUN 2026"} • NO. IZIN PPIU KEMENAG RI: {(travelSettings.licenseNumber || "25052200384080005")
                        .replace(/•?\s*NIB[\s\S]*/i, "")
                        .replace(/•?\s*KBLI[\s\S]*/i, "")
                        .replace(/NO\.\s*IZIN\s*PPIU\s*:\s*/i, "")
                        .trim()}
                    </p>
                    <p className="text-[8.5px] text-slate-400">
                      Kantor: {travelSettings.address || "Jl. Pahlawan No.10 J, Ps. Gambir, Kec. Tebing Tinggi Kota, Kota Tebing Tinggi, Sumatera Utara 20631"} • Telp/WA: {travelSettings.phone || "0821-6733-9464"} • Email: {travelSettings.email || "barokahsulthanharamain@gmail.com"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
