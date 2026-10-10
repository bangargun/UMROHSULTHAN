"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Award,
  Search,
  CheckCircle2,
  AlertTriangle,
  Plane,
  Calendar,
  CreditCard,
  User,
  ShieldCheck,
  X,
  FileText,
  Sparkles,
  Phone,
  ArrowRight,
  RefreshCw,
  Building2,
  Tag,
  DollarSign,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ReEnrollAlumniModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  packages: any[];
  preSelectedPilgrim?: any | null;
}

export default function ReEnrollAlumniModal({
  isOpen,
  onClose,
  onSuccess,
  packages,
  preSelectedPilgrim,
}: ReEnrollAlumniModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [alumniList, setAlumniList] = useState<any[]>([]);
  const [isLoadingAlumni, setIsLoadingAlumni] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState<any | null>(null);

  // Form Fields
  const [targetPackageId, setTargetPackageId] = useState("");
  const [roomType, setRoomType] = useState("QUAD");
  const [uniformSize, setUniformSize] = useState("L");
  const [alumniDiscount, setAlumniDiscount] = useState<number>(1000000);
  const [initialDpAmount, setInitialDpAmount] = useState<number>(10000000);
  const [isDpPaidNow, setIsDpPaidNow] = useState(true);
  const [specialNotes, setSpecialNotes] = useState("");

  // Passport update form (if needed)
  const [isUpdatePassport, setIsUpdatePassport] = useState(false);
  const [newPassportNumber, setNewPassportNumber] = useState("");
  const [newPassportExpiry, setNewPassportExpiry] = useState("");
  const [newPassportIssuedCity, setNewPassportIssuedCity] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load alumni when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (preSelectedPilgrim) {
      setSelectedAlumni(preSelectedPilgrim);
      setRoomType(preSelectedPilgrim.roomType || "QUAD");
      setUniformSize(preSelectedPilgrim.uniformSize || "L");
      if (preSelectedPilgrim.passportNumber) {
        setNewPassportNumber(preSelectedPilgrim.passportNumber);
      }
      if (preSelectedPilgrim.passportExpiry) {
        setNewPassportExpiry(
          new Date(preSelectedPilgrim.passportExpiry).toISOString().split("T")[0]
        );
      }
    } else {
      setSelectedAlumni(null);
      fetchAlumni("");
    }

    if (packages.length > 0 && !targetPackageId) {
      // Prioritize packages with open quota
      const availablePkg = packages.find((p) => p.bookedCount < p.quota) || packages[0];
      setTargetPackageId(availablePkg.id);
    }
  }, [isOpen, preSelectedPilgrim, packages]);

  const fetchAlumni = async (query: string) => {
    setIsLoadingAlumni(true);
    try {
      const res = await fetch(`/api/pilgrims/re-enroll?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setAlumniList(data);
      }
    } catch (e) {
      console.error("Failed to fetch alumni:", e);
    } finally {
      setIsLoadingAlumni(false);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    fetchAlumni(val);
  };

  const handleSelectAlumni = (alumni: any) => {
    setSelectedAlumni(alumni);
    setRoomType(alumni.roomType || "QUAD");
    setUniformSize(alumni.uniformSize || "L");
    if (alumni.passportNumber) {
      setNewPassportNumber(alumni.passportNumber);
    }
    if (alumni.passportExpiry) {
      setNewPassportExpiry(
        new Date(alumni.passportExpiry).toISOString().split("T")[0]
      );
    }
    setIsUpdatePassport(false);
  };

  // Selected Target Package Details
  const selectedPackage = useMemo(() => {
    return packages.find((p) => p.id === targetPackageId);
  }, [packages, targetPackageId]);

  // Smart Passport Expiry Audit
  const passportAudit = useMemo(() => {
    if (!selectedAlumni || !selectedPackage?.departureDate) return null;

    const expiryToUse = isUpdatePassport && newPassportExpiry
      ? new Date(newPassportExpiry)
      : selectedAlumni.passportExpiry
      ? new Date(selectedAlumni.passportExpiry)
      : null;

    if (!expiryToUse || isNaN(expiryToUse.getTime())) {
      return {
        status: "NO_PASSPORT",
        message: "Nomor atau masa berlaku paspor belum tercatat.",
        isWarning: true,
      };
    }

    const departureDate = new Date(selectedPackage.departureDate);
    const diffDays = Math.ceil((expiryToUse.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24));
    const diffMonths = (expiryToUse.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

    if (diffDays <= 0) {
      return {
        status: "EXPIRED",
        message: `Paspor sudah kedaluwarsa sebelum tanggal keberangkatan! (${formatDate(expiryToUse, "dd MMM yyyy")})`,
        isWarning: true,
      };
    } else if (diffMonths < 6) {
      return {
        status: "LESS_THAN_6_MONTHS",
        message: `Masa berlaku paspor tersisa ${Math.round(diffMonths)} bulan (${diffDays} hari) dari jadwal keberangkatan (${formatDate(selectedPackage.departureDate, "dd MMM yyyy")}). Imigrasi Saudi mewajibkan minimal 6 bulan!`,
        isWarning: true,
      };
    } else {
      return {
        status: "VALID",
        message: `Masa berlaku paspor aman (${Math.round(diffMonths)} bulan dari jadwal keberangkatan, berlaku hingga ${formatDate(expiryToUse, "dd MMM yyyy")}).`,
        isWarning: false,
      };
    }
  }, [selectedAlumni, selectedPackage, isUpdatePassport, newPassportExpiry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlumni || !targetPackageId) {
      setErrorMessage("Silakan pilih jamaah alumni dan paket umroh tujuan.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const payload: any = {
        alumniPilgrimId: selectedAlumni.id,
        newPackageId: targetPackageId,
        roomType,
        uniformSize,
        alumniDiscount,
        initialDpAmount: isDpPaidNow ? initialDpAmount : 0,
        specialNotes,
      };

      if (isUpdatePassport && newPassportNumber) {
        payload.newPassportNumber = newPassportNumber;
        payload.newPassportExpiry = newPassportExpiry || null;
        payload.newPassportIssuedCity = newPassportIssuedCity || null;
      }

      const res = await fetch("/api/pilgrims/re-enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Gagal memproses pendaftaran ulang alumni.");
        setIsSubmitting(false);
        return;
      }

      alert(data.message || "Pendaftaran alumni berhasil diselesaikan!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Terjadi kesalahan jaringan saat mendaftarkan alumni.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto border border-slate-100">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">
                  Daftarkan Alumni ke Paket Baru
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  Repeat Order
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Replikasi instan data SISKOPATUH & dokumen tanpa perlu input ulang dari awal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: PILIH ALUMNI JAMAAH */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[10px]">
                  1
                </span>
                Pilih Calon Jamaah Alumni
              </label>
              {selectedAlumni && !preSelectedPilgrim && (
                <button
                  type="button"
                  onClick={() => setSelectedAlumni(null)}
                  className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Ganti Jamaah
                </button>
              )}
            </div>

            {!selectedAlumni ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan Nama Lengkap, NIK, No. Paspor, atau No. WhatsApp..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Hasil Pencarian Alumni */}
                <div className="border border-slate-200 rounded-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
                  {isLoadingAlumni ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Memuat daftar alumni...
                    </div>
                  ) : alumniList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      {searchTerm
                        ? "Tidak ditemukan data jamaah yang cocok dengan pencarian."
                        : "Ketik kata kunci untuk mencari data jamaah yang pernah terdaftar."}
                    </div>
                  ) : (
                    alumniList.map((alumni) => (
                      <div
                        key={alumni.id}
                        onClick={() => handleSelectAlumni(alumni)}
                        className="p-3.5 hover:bg-amber-50/70 transition-colors cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center font-black text-xs shrink-0">
                            {alumni.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">
                                {alumni.name}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900">
                                {alumni.tripHistory?.length > 1
                                  ? `${alumni.tripHistory.length}x Berangkat`
                                  : "Alumni"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              NIK: {alumni.nik} • Paspor: {alumni.passportNumber || "-"}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Paket Terakhir: {alumni.package?.name || "-"} (
                              {alumni.package?.departureDate
                                ? formatDate(alumni.package.departureDate, "dd MMM yyyy")
                                : "-"}
                              )
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs"
                        >
                          Pilih <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Kartu Detail Alumni Terpilih */
              <div className="bg-gradient-to-r from-amber-50/80 via-white to-slate-50 border border-amber-200 rounded-2xl p-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                      {selectedAlumni.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 text-sm">
                          {selectedAlumni.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                          Terverifikasi SISKOPATUH
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[11px] text-slate-600 mt-1">
                        <div>
                          NIK: <span className="font-mono font-bold">{selectedAlumni.nik}</span>
                        </div>
                        <div>
                          No WA: <span className="font-bold">{selectedAlumni.phone}</span>
                        </div>
                        <div>
                          Ayah Kandung: <span className="font-bold">{selectedAlumni.fatherName || "-"}</span>
                        </div>
                        <div>
                          Kota/Domisili: <span className="font-bold">{selectedAlumni.city || "-"}</span>
                        </div>
                        <div>
                          Gol. Darah: <span className="font-bold">{selectedAlumni.bloodType || "-"}</span>
                        </div>
                        <div>
                          Kontak Darurat: <span className="font-bold">{selectedAlumni.emergencyContactPhone || "-"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Dokumen Tersimpan */}
                <div className="mt-3 pt-3 border-t border-amber-200/60 flex items-center gap-3 flex-wrap text-[10px]">
                  <span className="text-slate-500 font-bold">Berkas Tersimpan:</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${selectedAlumni.ktpFileUrl ? "bg-emerald-100 text-emerald-900 font-bold" : "bg-slate-100 text-slate-400"}`}>
                    <CheckCircle2 className="w-3 h-3" /> KTP
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${selectedAlumni.familyCardFileUrl ? "bg-emerald-100 text-emerald-900 font-bold" : "bg-slate-100 text-slate-400"}`}>
                    <CheckCircle2 className="w-3 h-3" /> KK
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${selectedAlumni.vaccineCardFileUrl ? "bg-emerald-100 text-emerald-900 font-bold" : "bg-slate-100 text-slate-400"}`}>
                    <CheckCircle2 className="w-3 h-3" /> Sertifikat Vaksin
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${selectedAlumni.marriageBookFileUrl ? "bg-emerald-100 text-emerald-900 font-bold" : "bg-slate-100 text-slate-400"}`}>
                    <CheckCircle2 className="w-3 h-3" /> Buku Nikah
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: PILIH PAKET BARU & AUDIT PASPOR */}
          {selectedAlumni && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[10px]">
                  2
                </span>
                Pilih Paket Umroh Baru & Audit Paspor
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dropdown Paket Baru */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Program Paket Umroh Baru
                  </label>
                  <select
                    value={targetPackageId}
                    onChange={(e) => setTargetPackageId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    {packages.map((pkg) => {
                      const isFull = pkg.bookedCount >= pkg.quota;
                      return (
                        <option key={pkg.id} value={pkg.id} disabled={isFull}>
                          [{pkg.code}] {pkg.name} • {pkg.departureDate ? formatDate(pkg.departureDate, "dd MMM yyyy") : "-"} ({pkg.bookedCount}/{pkg.quota} pax) {isFull ? "(PENUH)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Detail Paket Terpilih */}
                {selectedPackage && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-slate-900">{selectedPackage.name}</p>
                    <p className="text-[11px] text-slate-600">
                      🗓️ {selectedPackage.departureDate ? formatDate(selectedPackage.departureDate, "dd MMM yyyy") : "-"} s/d {selectedPackage.returnDate ? formatDate(selectedPackage.returnDate, "dd MMM yyyy") : "-"}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      ✈️ {selectedPackage.airline || "-"} • 🏨 {selectedPackage.hotelMakkah?.split(" ")[0] || "-"}
                    </p>
                  </div>
                )}
              </div>

              {/* AUDIT PASPOR OTOMATIS */}
              {passportAudit && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-2 ${
                    passportAudit.isWarning
                      ? "bg-rose-50 border-rose-200 text-rose-900"
                      : "bg-emerald-50 border-emerald-200 text-emerald-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold">
                      {passportAudit.isWarning ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      <span>Audit Validitas Paspor Imigrasi Saudi</span>
                    </div>
                    <span className="font-mono text-[11px]">
                      No: {isUpdatePassport && newPassportNumber ? newPassportNumber : (selectedAlumni.passportNumber || "-")}
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed">
                    {passportAudit.message}
                  </p>

                  {/* Toggle Update Paspor Baru */}
                  <div className="pt-2 border-t border-current/20 flex items-center justify-between">
                    <span className="text-[11px] font-medium">
                      Jamaah sudah memperpanjang / membuat paspor baru?
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsUpdatePassport(!isUpdatePassport)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white text-slate-900 border border-slate-300 shadow-xs hover:bg-slate-100"
                    >
                      {isUpdatePassport ? "Batal Update Paspor" : "+ Update Data Paspor Baru"}
                    </button>
                  </div>

                  {isUpdatePassport && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                      <div>
                        <label className="text-[10px] font-bold block mb-0.5">
                          Nomor Paspor Baru
                        </label>
                        <input
                          type="text"
                          value={newPassportNumber}
                          onChange={(e) => setNewPassportNumber(e.target.value.toUpperCase())}
                          placeholder="misal: X1234567"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs uppercase font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold block mb-0.5">
                          Tanggal Habis Berlaku
                        </label>
                        <input
                          type="date"
                          value={newPassportExpiry}
                          onChange={(e) => setNewPassportExpiry(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold block mb-0.5">
                          Kantor Imigrasi Penerbit
                        </label>
                        <input
                          type="text"
                          value={newPassportIssuedCity}
                          onChange={(e) => setNewPassportIssuedCity(e.target.value)}
                          placeholder="misal: Jakarta Selatan"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: KONFIGURASI KAMAR, SERAGAM & BENEFIT ALUMNI */}
          {selectedAlumni && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[10px]">
                  3
                </span>
                Kamar, Perlengkapan & Loyalty Benefit
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Tipe Kamar */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tipe Kamar Hotel
                  </label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="QUAD">QUAD (Sekamar Ber-4)</option>
                    <option value="TRIPLE">TRIPLE (Sekamar Ber-3)</option>
                    <option value="DOUBLE">DOUBLE (Sekamar Ber-2)</option>
                  </select>
                </div>

                {/* Ukuran Seragam */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Ukuran Seragam / Batik
                  </label>
                  <select
                    value={uniformSize}
                    onChange={(e) => setUniformSize(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="S">S (Small)</option>
                    <option value="M">M (Medium)</option>
                    <option value="L">L (Large)</option>
                    <option value="XL">XL (Extra Large)</option>
                    <option value="XXL">XXL (Double XL)</option>
                    <option value="XXXL">XXXL (Triple XL)</option>
                  </select>
                </div>

                {/* Diskon Loyalitas Alumni */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    Diskon Khusus Alumni (Rp)
                  </label>
                  <input
                    type="number"
                    step="100000"
                    value={alumniDiscount}
                    onChange={(e) => setAlumniDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-amber-50/50"
                  />
                  <div className="flex gap-1 mt-1">
                    {[500000, 1000000, 1500000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAlumniDiscount(preset)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-amber-100 font-bold text-slate-700"
                      >
                        {(preset / 1000).toLocaleString("id-ID")}k
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status DP & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-3.5 border border-slate-200 rounded-2xl bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800">
                      Pembayaran DP Booking Seat
                    </label>
                    <label className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isDpPaidNow}
                        onChange={(e) => setIsDpPaidNow(e.target.checked)}
                        className="rounded text-emerald-600"
                      />
                      DP Sudah Dibayar Langsung
                    </label>
                  </div>

                  <input
                    type="number"
                    step="500000"
                    disabled={!isDpPaidNow}
                    value={initialDpAmount}
                    onChange={(e) => setInitialDpAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Nominal DP (Rp)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 disabled:opacity-50 bg-white"
                  />
                  <p className="text-[10px] text-slate-500">
                    {isDpPaidNow
                      ? "Invoice DP otomatis berstatus LUNAS (PAID)"
                      : "Invoice DP otomatis dibuat berstatus PENDING (Menunggu Pelunasan)"}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Catatan Tambahan (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="Contoh: Berangkat bersama pasangan / minta sekamar dengan keluarga..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedAlumni}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-black shadow-lg shadow-amber-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Mendaftarkan Ulang...
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  Daftarkan Alumni ke Paket Baru
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
