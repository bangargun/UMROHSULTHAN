"use client";

import React, { useState, useEffect } from "react";
import {
  X,
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
  Eye,
  Trash2,
  Check,
  Sparkles,
  Users,
  FolderOpen,
  Image as ImageIcon,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface RegistrationsAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshPilgrims?: () => void;
}

export default function RegistrationsAdminModal({
  isOpen,
  onClose,
  onRefreshPilgrims,
}: RegistrationsAdminModalProps) {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReg, setSelectedReg] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/registrations");
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data);
      }
    } catch (err) {
      console.error("Failed to load registrations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRegistrations();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesStatus = selectedStatus === "ALL" || reg.status === selectedStatus;
    const matchesSearch =
      reg.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.idJamaah.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.phone.includes(searchTerm) ||
      reg.nik.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  // Action: Admin Verifies Registration
  const handleVerify = async (regId: string) => {
    if (!confirm("Verifikasi data pendaftaran dan terbitkan invoice DP?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/registrations/${regId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dpAmount: 5000000 }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal verifikasi pendaftaran");
      } else {
        alert(data.message);
        fetchRegistrations();
        if (selectedReg && selectedReg.id === regId) {
          setSelectedReg(data.registration);
        }
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Admin Confirms Payment -> Mark PAID & Create Pilgrim
  const handleConfirmPayment = async (regId: string) => {
    if (!confirm("Konfirmasi penerimaan pembayaran DP? Jamaah akan otomatis resmi terdaftar di database manifest.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/registrations/${regId}/confirm-payment`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal konfirmasi pembayaran");
      } else {
        alert(data.message);
        fetchRegistrations();
        if (onRefreshPilgrims) onRefreshPilgrims();
        if (selectedReg && selectedReg.id === regId) {
          setSelectedReg(data.registration);
        }
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Delete Registration
  const handleDelete = async (regId: string) => {
    if (!confirm("Hapus data pendaftaran ini?")) return;
    try {
      const res = await fetch(`/api/registrations/${regId}`, { method: "DELETE" });
      if (res.ok) {
        fetchRegistrations();
        if (selectedReg && selectedReg.id === regId) setSelectedReg(null);
      }
    } catch (err) {
      alert("Gagal menghapus pendaftaran.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 p-5 sm:p-6 text-white shrink-0 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded border border-amber-300/30">
                📥 Antrean Pendaftaran Online
              </span>
              <span className="text-xs text-emerald-200">
                Total {registrations.length} Pendaftar
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black mt-1 text-white">
              Manajemen Pendaftaran Mandiri & Agen
            </h2>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              Verifikasi berkas, terbitkan invoice DP, validasi bukti transfer, dan masukkan ke manifest resmi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://drive.google.com/drive/folders/${selectedReg?.googleDriveFolderId || "161j-oTJ8WgbCYRKsxXCST3wE7CAHU3XY"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-emerald-200 transition-all border border-white/10"
            >
              <FolderOpen className="w-3.5 h-3.5" /> Buka Google Drive
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: "ALL", label: `Semua (${registrations.length})` },
              { key: "NEW", label: `Baru (${registrations.filter((r) => r.status === "NEW").length})` },
              { key: "VERIFIED", label: `Menunggu DP (${registrations.filter((r) => r.status === "VERIFIED").length})` },
              { key: "PAYMENT_PENDING", label: `Cek Bayar (${registrations.filter((r) => r.status === "PAYMENT_PENDING").length})` },
              { key: "PAID", label: `Lunas DP (${registrations.filter((r) => r.status === "PAID").length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedStatus(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedStatus === tab.key
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama, no reg, WA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Main List & Details Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List Column (2 Cols on Large) */}
          <div className="lg:col-span-2 space-y-3">
            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">Tidak Ada Antrean Pendaftaran</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pendaftaran dari halaman publik (/daftar) akan muncul secara realtime di sini.
                </p>
              </div>
            ) : (
              filteredRegistrations.map((reg) => {
                const isSelected = selectedReg?.id === reg.id;
                return (
                  <div
                    key={reg.id}
                    onClick={() => setSelectedReg(reg)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-600/30"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                            {reg.regNumber}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            {reg.idJamaah}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                              reg.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : reg.status === "PAYMENT_PENDING"
                                ? "bg-amber-100 text-amber-800"
                                : reg.status === "VERIFIED"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {reg.status}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-slate-900 mt-1.5">
                          {reg.fullName}
                        </h4>
                        <p className="text-xs text-slate-500">
                          📱 {reg.phone} • NIK: {reg.nik} • 📍 {reg.city || "Tebing Tinggi"}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs font-black text-slate-900 block">
                          {reg.package?.name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Kamar: <strong>{reg.roomType}</strong> ({formatCurrency(reg.pricePackage)})
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Daftar: {formatDate(reg.createdAt, "dd MMM yyyy HH:mm")}
                        </p>
                      </div>
                    </div>

                    {/* Channel & Quick Action Badges */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold text-slate-500">
                        Jalur:{" "}
                        <strong className="text-slate-800">
                          {reg.channel === "AGENT"
                            ? `Mitra Agen (${reg.agentName || "Agen"})`
                            : "Mandiri Langsung"}
                        </strong>
                      </span>

                      <div className="flex items-center gap-2">
                        {reg.status === "NEW" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerify(reg.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                          >
                            <Check className="w-3 h-3" /> Verifikasi & Terbitkan Invoice
                          </button>
                        )}
                        {reg.status === "PAYMENT_PENDING" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmPayment(reg.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Konfirmasi Bayar DP
                          </button>
                        )}
                        {reg.status === "PAID" && (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Resmi Terdaftar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Details & Document Viewer Column */}
          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200 space-y-4">
            {selectedReg ? (
              <div className="space-y-4 text-xs">
                <div className="border-b border-slate-200 pb-3 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Detail Pendaftar</span>
                    <h3 className="text-base font-black text-slate-900">{selectedReg.fullName}</h3>
                    <p className="text-[10px] font-mono text-emerald-800 font-bold">
                      {selectedReg.regNumber} • {selectedReg.idJamaah}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(selectedReg.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                    title="Hapus Data"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Documents & Photos */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 block">Dokumen Unggahan (Google Drive):</span>
                  <div className="grid grid-cols-2 gap-2">
                    {/* KTP */}
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 block">Foto KTP</span>
                      {selectedReg.ktpFileUrl ? (
                        <div
                          onClick={() => setPreviewImage(selectedReg.ktpFileUrl)}
                          className="h-20 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-all"
                        >
                          <img src={selectedReg.ktpFileUrl} alt="KTP" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic block py-4">Belum Ada</span>
                      )}
                    </div>

                    {/* Paspor */}
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 block">Foto Paspor</span>
                      {selectedReg.passportFileUrl ? (
                        <div
                          onClick={() => setPreviewImage(selectedReg.passportFileUrl)}
                          className="h-20 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-all"
                        >
                          <img src={selectedReg.passportFileUrl} alt="Paspor" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic block py-4">Menyusul</span>
                      )}
                    </div>
                  </div>

                  {/* Bukti Bayar */}
                  {selectedReg.transferProofUrl && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-1.5 mt-2">
                      <span className="text-[10px] font-bold text-amber-900 block">Bukti Transfer DP</span>
                      <div
                        onClick={() => setPreviewImage(selectedReg.transferProofUrl)}
                        className="h-24 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-all"
                      >
                        <img src={selectedReg.transferProofUrl} alt="Bukti Transfer" className="h-full w-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Info Paket & Kamar */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900">{selectedReg.package?.name}</p>
                    {selectedReg.notes?.includes("PROMO") && (
                      <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        🔥 PROMO DISKON 4 JT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span>Kamar: <strong>{selectedReg.roomType}</strong></span>
                    <span>•</span>
                    <span>Harga: <strong className="text-emerald-700 font-bold">{formatCurrency(selectedReg.pricePackage)}</strong></span>
                    <span>•</span>
                    <span>Baju: <strong className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">Size {selectedReg.uniformSize || "L"}</strong></span>
                  </div>
                  <p className="text-slate-600">
                    Tagihan DP: <strong>{formatCurrency(selectedReg.dpAmount)}</strong> • Invoice: <strong>{selectedReg.invoiceNumber || "-"}</strong>
                  </p>

                  {/* Keterangan Rincian Potongan Harga */}
                  {selectedReg.notes?.includes("PROMO") && (
                    <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-300 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-950 flex items-center gap-1">
                          🏷️ Rincian Potongan Harga:
                        </span>
                        <span className="font-mono font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                          Diskon -Rp 4.000.000,-
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600">
                        Harga Normal: <span className="line-through font-mono">{formatCurrency(selectedReg.pricePackage + 4000000)}</span> ➔ Tagihan Bersih Paket: <strong className="font-mono text-emerald-800">{formatCurrency(selectedReg.pricePackage)}</strong>
                      </p>
                    </div>
                  )}
                </div>

                {/* Info Riwayat Pengalaman Umroh */}
                <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 space-y-1 text-[11px]">
                  <p className="font-bold text-emerald-950 flex items-center gap-1">
                    🕋 Pengalaman Ibadah Umroh:
                  </p>
                  <p className="text-slate-700">
                    Frekuensi: <strong className="text-emerald-900">
                      {selectedReg.umrahExperienceCount === "BELUM_PERNAH"
                        ? "Belum Pernah (Jamaah Perdana)"
                        : selectedReg.umrahExperienceCount?.replace(/_/g, " ")}
                    </strong>
                  </p>
                  {selectedReg.umrahExperienceCount !== "BELUM_PERNAH" && (
                    <p className="text-slate-700">
                      Status Alumni:{" "}
                      <strong className={selectedReg.isPreviousClient ? "text-emerald-800" : "text-slate-600"}>
                        {selectedReg.isPreviousClient
                          ? `✅ Pernah bersama Sulthan Haramain (${selectedReg.previousPackageName || "Program Sebelumnya"})`
                          : "❌ Belum (Travel Lain)"}
                      </strong>
                    </p>
                  )}
                </div>

                {/* Info Riwayat Kesehatan & Kursi Roda */}
                <div className="bg-slate-100/80 p-3 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                  <p className="font-bold text-slate-800">Catatan Medis & Kebutuhan Khusus:</p>
                  <p className="text-slate-600">
                    🩺 Penyakit Kronis: <strong className="text-slate-900">{selectedReg.chronicDiseases || "Tidak Ada (Sehat)"}</strong>
                  </p>
                  <p className="text-slate-600">
                    ♿ Kursi Roda:{" "}
                    <strong className={selectedReg.wheelchairAssistance ? "text-amber-800" : "text-slate-700"}>
                      {selectedReg.wheelchairAssistance ? `Ya (${selectedReg.wheelchairNotes || "Perlu Bantuan"})` : "Tidak"}
                    </strong>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  {selectedReg.status === "NEW" && (
                    <button
                      onClick={() => handleVerify(selectedReg.id)}
                      disabled={actionLoading}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      {actionLoading ? "Memproses..." : "Verifikasi & Terbitkan Tagihan DP"}
                    </button>
                  )}

                  {(selectedReg.status === "VERIFIED" || selectedReg.status === "PAYMENT_PENDING") && (
                    <button
                      onClick={() => handleConfirmPayment(selectedReg.id)}
                      disabled={actionLoading}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {actionLoading ? "Memproses..." : "Konfirmasi Pembayaran DP (Set Lunas)"}
                    </button>
                  )}

                  <a
                    href={`https://wa.me/${selectedReg.phone.replace(/^0/, "62")}?text=${encodeURIComponent(
                      `Assalamu'alaikum Yth. Bapak/Ibu ${selectedReg.fullName},\n\nKami dari PT Barokah Sulthan Haramain menginformasikan update status pendaftaran umroh Anda (No. Reg: ${selectedReg.regNumber}).\nStatus: *${selectedReg.status}*.\n\nLink pantau status: https://portalumroh.barokahgroupindonesia.tech/daftar/status?reg=${selectedReg.regNumber}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" /> Chat WhatsApp Jamaah
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Pilih salah satu pendaftaran di sebelah kiri untuk melihat detail dokumen & verifikasi.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Full Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] p-2 bg-white rounded-2xl">
            <img src={previewImage} alt="Preview" className="max-h-[80vh] w-auto object-contain rounded-xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-black text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
