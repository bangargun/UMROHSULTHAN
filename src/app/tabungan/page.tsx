"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Phone,
  ArrowRight,
  Calculator,
  Gift,
  Coins,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  Search,
  Lock,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TabunganUmrohPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any | null>(null);

  // Simulation Calculator State
  const [simTargetAmount, setSimTargetAmount] = useState(31500000);
  const [simMonths, setSimMonths] = useState(12);

  // Registration Form State
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    nik: "",
    gender: "MALE",
    city: "",
    address: "",
    uniformSize: "L",
    targetPackageId: "",
    targetPackageName: "UMROH REGULER (ESTIMASI)",
    targetAmount: 31500000,
    initialDeposit: 2000000,
    equipmentReceived: true,
    transferProofBase64: "",
    notes: "",
  });

  const [proofPreview, setProofPreview] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/packages")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPackages(data);
          if (data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              targetPackageId: data[0].id,
              targetPackageName: `${data[0].name} (QUAD)`,
              targetAmount: data[0].priceQuad || 31500000,
            }));
            setSimTargetAmount(data[0].priceQuad || 31500000);
          }
        }
      })
      .catch((err) => console.error("Failed to load packages:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const b64 = uploadEvent.target?.result as string;
      setProofPreview(b64);
      setFormData((prev) => ({ ...prev, transferProofBase64: b64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal mendaftarkan rekening tabungan");
        setSubmitting(false);
        return;
      }
      setSubmitSuccess(data.account);
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi saat mengirim formulir");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculator computations
  const sisaTargetSim = Math.max(0, simTargetAmount - 2000000);
  const monthlySim = Math.round(sisaTargetSim / simMonths);
  const dailySim = Math.round(monthlySim / 30);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 font-sans pb-20">
      {/* Top Banner Hero */}
      <div className="relative bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white py-14 px-4 border-b border-emerald-800/30">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          {/* Logo Resmi Sulthan Haramain */}
          <div className="flex justify-center">
            <div className="bg-white px-6 py-3 rounded-2xl border-2 border-amber-400 shadow-xl inline-flex items-center justify-center">
              <img
                src="/sulthan-haramain-logo.jpg"
                alt="Sulthan Haramain Tour & Travel"
                style={{ maxHeight: "65px", width: "auto", objectFit: "contain" }}
                className="h-12 sm:h-16 w-auto object-contain"
              />
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase text-white leading-tight">
            Niatkan Umroh Hari Ini,<br />
            <span className="text-amber-400">Setor Awal Rp 2 Juta</span> Langsung Bawa Pulang Koper!
          </h1>

          <p className="text-xs sm:text-sm text-emerald-200/90 max-w-2xl mx-auto">
            PT BAROKAH SULTHAN HARAMAIN • Izin PPIU No. 25052200384080005<br />
            Menabung fleksibel tanpa batasan waktu. Setiap setoran menerima kuitansi resmi bertanda tangan digital dengan laporan sisa tagihan transparan realtime.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#form-daftar"
              className="px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4" /> Buka Rekening Tabungan Sekarang
            </a>
            <Link
              href="/tabungan/status"
              className="px-6 py-3 rounded-2xl bg-emerald-900/60 hover:bg-emerald-800 text-white border border-emerald-500/40 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all"
            >
              <Search className="w-4 h-4 text-emerald-300" /> Cek Saldo Penabung
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6 space-y-8">
        {/* 3 Keuntungan Utama Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xl space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-lg">
              🧳
            </div>
            <h3 className="font-black text-slate-900 text-sm">Langsung Dapat Perlengkapan</h3>
            <p className="text-xs text-slate-600">
              Cukup setoran awal <strong>Rp 2.000.000,-</strong>, koper bagasi, kain ihram/mukena, batik resmi, dan tas paspor langsung diserahkan ke rumah Anda.
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xl space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-lg">
              📅
            </div>
            <h3 className="font-black text-slate-900 text-sm">Bebas Tanpa Batas Waktu</h3>
            <p className="text-xs text-slate-600">
              Menabung kapan saja ada rezeki lebih (bulanan/mingguan). Tidak ada denda atau pinalti jika terlambat menabung.
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xl space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg">
              🧾
            </div>
            <h3 className="font-black text-slate-900 text-sm">Kuitansi Resmi & Transparan</h3>
            <p className="text-xs text-slate-600">
              Setiap kali Anda transfer, sistem otomatis menerbitkan kuitansi digital: total saldo terkumpul dan sisa uang menuju target paket.
            </p>
          </div>
        </div>

        {/* Interactive Savings Simulator */}
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl border border-emerald-500/30 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Simulasi Ringan Tabungan Umroh Barokah
              </h3>
              <p className="text-xs text-emerald-200/80">
                Hitung estimasi kemampuan menabung harian & bulanan Anda menuju Baitullah.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-5 rounded-2xl border border-white/10">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-emerald-200 block mb-1">
                  Pilih Target Program Umroh:
                </label>
                <select
                  value={simTargetAmount}
                  onChange={(e) => setSimTargetAmount(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl p-2.5 text-xs font-bold text-white outline-none"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.priceQuad}>
                      {pkg.name} — {formatCurrency(pkg.priceQuad)}
                    </option>
                  ))}
                  <option value={31500000}>Estimasi Program Reguler (Rp 31.500.000)</option>
                  <option value={36500000}>Estimasi Program VIP (Rp 36.500.000)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-emerald-200 mb-1">
                  <span>Rencana Waktu Menabung:</span>
                  <span className="text-amber-400 font-black">{simMonths} Bulan ({Math.round(simMonths / 12 * 10) / 10} Tahun)</span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={36}
                  step={3}
                  value={simMonths}
                  onChange={(e) => setSimMonths(parseInt(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 pt-1 font-mono">
                  <span>6 Bulan</span>
                  <span>12 Bulan</span>
                  <span>24 Bulan</span>
                  <span>36 Bulan</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-2xl border border-emerald-500/30 flex flex-col justify-center space-y-3">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-white/10">
                <span className="text-slate-300">Setoran Awal (Dapat Koper):</span>
                <span className="font-bold text-amber-400">Rp 2.000.000,-</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-white/10">
                <span className="text-slate-300">Sisa yang Ditabung:</span>
                <span className="font-bold text-white">{formatCurrency(sisaTargetSim)}</span>
              </div>
              <div className="pt-1">
                <span className="text-[11px] text-emerald-300 block">Cukup Sisihkan per Bulan:</span>
                <p className="text-xl sm:text-2xl font-black text-amber-400">{formatCurrency(monthlySim)} <span className="text-xs text-white font-normal">/ bulan</span></p>
                <p className="text-[11px] text-slate-400 mt-0.5">atau setara hanya <strong>{formatCurrency(dailySim)}</strong> / hari</p>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Form Card */}
        <div id="form-daftar" className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
          {submitSuccess ? (
            <div className="text-center py-10 px-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                Alhamdulillah! Rekening Tabungan Berhasil Dibuka
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Terima kasih <strong>{submitSuccess.fullName}</strong>. Rekening Tabungan Umroh Barokah Anda telah aktif dengan nomor rekening:
              </p>

              <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 inline-block font-mono text-xl font-black text-emerald-900 tracking-wider">
                {submitSuccess.accountNumber}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left max-w-md mx-auto space-y-1.5">
                <p className="font-bold text-slate-900">Rincian Tabungan:</p>
                <p className="text-slate-600">• Setoran Awal: <strong>Rp {submitSuccess.initialDeposit.toLocaleString("id-ID")}</strong></p>
                <p className="text-slate-600">• Target Program: <strong>{submitSuccess.targetPackageName}</strong></p>
                <p className="text-slate-600">• Sisa Tabungan: <strong>Rp {(submitSuccess.targetAmount - submitSuccess.totalBalance).toLocaleString("id-ID")}</strong></p>
                <p className="text-slate-600">• Koper & Seragam: <strong>Size {submitSuccess.uniformSize} (Diterima)</strong></p>
              </div>

              <div className="pt-4 flex flex-wrap justify-center gap-3">
                <Link
                  href={`/tabungan/status?acc=${submitSuccess.accountNumber}`}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md"
                >
                  Lihat Buku Tabungan & Kuitansi Digital <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-600" />
                  Formulir Pembukaan Rekening Tabungan Umroh (DP Rp 2 Juta)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Isi data calon jamaah penabung di bawah ini sesuai KTP asli.
                </p>
              </div>

              {/* Data Identitas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Sesuai KTP *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: AHMAD SUBARI"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold uppercase bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor WhatsApp Aktif *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 082167339464"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Induk Kependudukan (NIK KTP) *</label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="16 Digit NIK KTP"
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jenis Kelamin *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold bg-white"
                  >
                    <option value="MALE">Laki-Laki (Ikhwan)</option>
                    <option value="FEMALE">Perempuan (Akhwat)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kota / Kabupaten Domisili</label>
                  <input
                    type="text"
                    placeholder="Contoh: Tebing Tinggi / Medan"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email (Opsional)</label>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Alamat Lengkap Domisili</label>
                <textarea
                  rows={2}
                  placeholder="Nama jalan, nomor rumah, RT/RW, kecamatan..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
                />
              </div>

              {/* Ukuran Seragam Koper */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div>
                  <label className="text-xs font-black text-slate-900 block">
                    👕 Ukuran Baju Seragam Batik & Koper Umroh (Diterima saat Setor Awal Rp 2 Jt) *
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pilih ukuran seragam batik & mukena/kain ihram yang akan kami siapkan di dalam koper Anda.
                  </p>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 text-xs font-black">
                  {["S", "M", "L", "XL", "XXL", "XXXL", "CUSTOM"].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setFormData({ ...formData, uniformSize: sz })}
                      className={`py-2 px-3 rounded-xl transition-all ${
                        formData.uniformSize === sz
                          ? "bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-700/30"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {sz === "CUSTOM" ? "Khusus" : sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pilihan Target Program */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <label className="font-black text-slate-900 block">
                  🎯 Target Paket Keberangkatan yang Dituju *
                </label>
                <select
                  value={formData.targetPackageId}
                  onChange={(e) => {
                    const pkgId = e.target.value;
                    const pkg = packages.find((p) => p.id === pkgId);
                    if (pkg) {
                      setFormData({
                        ...formData,
                        targetPackageId: pkg.id,
                        targetPackageName: `${pkg.name} (QUAD)`,
                        targetAmount: pkg.priceQuad || 31500000,
                      });
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 p-2.5 bg-white font-bold text-slate-800"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      🛫 {pkg.name} — {formatCurrency(pkg.priceQuad)} (Kamar Quad)
                    </option>
                  ))}
                  <option value="">Paket Estimasi Standar (Rp 31.500.000,-)</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  * Target paket dapat disesuaikan kembali dengan jadwal musim keberangkatan saat saldo tabungan Anda telah mencukupi.
                </p>
              </div>

              {/* Setoran Awal & Instruksi Rekening */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 text-xs">
                <p className="font-black text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Rekening Resmi Pembayaran Setoran Awal Rp 2.000.000,-
                </p>
                <div className="font-mono">
                  <div className="bg-white p-4 rounded-2xl border-2 border-emerald-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block uppercase tracking-wider">REKENING RESMI PENERIMAAN (BANK MANDIRI)</span>
                      <strong className="text-blue-900 text-lg sm:text-xl block tracking-wider font-mono">106-00-1899-7788</strong>
                      <p className="text-xs text-slate-700 font-sans font-bold">a.n. PT BAROKAH SULTHAN HARAMAIN</p>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg self-start sm:self-center font-sans">
                      Mandiri Cabang Tebing Tinggi
                    </span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Unggah Bukti Transfer Setoran Awal (Opsional / Bisa Menyusul):
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProofChange}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                  />
                  {proofPreview && (
                    <div className="mt-2 h-20 w-32 rounded-lg overflow-hidden border border-emerald-300">
                      <img src={proofPreview} alt="Bukti" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                {submitting ? "Memproses..." : "Buka Rekening Tabungan & Terima Koper Umroh"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
