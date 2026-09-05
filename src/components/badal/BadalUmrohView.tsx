"use client";

import React, { useState, useEffect } from "react";
import {
  Heart,
  Plus,
  Printer,
  RefreshCw,
  X,
  CheckCircle2,
  Clock,
  Search,
  ChevronDown,
  Star,
  Video,
  FileText,
  Phone,
  User,
  Calendar,
  MapPin,
  Package,
} from "lucide-react";
import Pagination from "@/components/common/Pagination";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(v: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v);
}

function formatDate(d: any, fmt = "dd/MM/yyyy") {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  const day = String(dt.getDate()).padStart(2, "0");
  const mon = String(dt.getMonth() + 1).padStart(2, "0");
  const yr = dt.getFullYear();
  const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  if (fmt === "dd MMMM yyyy") return `${day} ${months[dt.getMonth()]} ${yr}`;
  return `${day}/${mon}/${yr}`;
}

const STATUS_FLOW = [
  { key: "PENDING_PAYMENT", label: "Menunggu Pembayaran", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { key: "PAYMENT_RECEIVED", label: "Pembayaran Diterima", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { key: "SCHEDULED", label: "Dijadwalkan", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  { key: "IN_PROGRESS", label: "Sedang Dilaksanakan", color: "bg-orange-100 text-orange-800 border-orange-300" },
  { key: "COMPLETED", label: "Selesai Dilaksanakan", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { key: "CERTIFICATE_ISSUED", label: "Sertifikat Diterbitkan", color: "bg-teal-100 text-teal-800 border-teal-300" },
];

const PACKAGE_INFO: Record<string, { label: string; icon: any; price: number; desc: string }> = {
  BADAL_BASIC: { label: "Badal Basic", icon: Heart, price: 3500000, desc: "Pelaksanaan tawaf & sa'i, tanpa dokumentasi foto/video" },
  BADAL_PREMIUM: { label: "Badal Premium", icon: Star, price: 5000000, desc: "Pelaksanaan + foto bukti di Masjidil Haram" },
  BADAL_WITH_VIDEO: { label: "Badal + Video", icon: Video, price: 7500000, desc: "Pelaksanaan + foto & video dokumentasi lengkap" },
};

const RELATION_OPTIONS = ["ANAK", "SUAMI", "ISTRI", "CUCU", "SAUDARA", "KEPONAKAN", "LAINNYA"];

function getStatusBadge(status: string) {
  return STATUS_FLOW.find((s) => s.key === status) || STATUS_FLOW[0];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BadalUmrohView() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedForCert, setSelectedForCert] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [travelSettings, setTravelSettings] = useState<any>({});

  // Form state
  const emptyForm = {
    ordererName: "", ordererPhone: "", ordererEmail: "", ordererNik: "",
    ordererAddress: "", ordererCity: "", ordererRelation: "ANAK",
    recipientName: "", recipientGender: "MALE", recipientStatus: "DECEASED",
    recipientBirthPlace: "", recipientDateOfBirth: "",
    packageType: "BADAL_BASIC", notes: "",
  };
  const [form, setForm] = useState(emptyForm);

  // Update-status form state
  const [updateForm, setUpdateForm] = useState<any>({});

  // Fetch
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/badal");
      if (res.ok) setOrders(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) setTravelSettings(await res.json());
    } catch {}
  };

  useEffect(() => { fetchOrders(); fetchSettings(); }, []);

  // Filter
  const filtered = orders.filter((o) => {
    const matchSearch =
      o.ordererName?.toLowerCase().includes(search.toLowerCase()) ||
      o.recipientName?.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.ordererPhone?.includes(search);
    const matchStatus = filterStatus === "ALL" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Reset page when search or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

  // Paginated orders
  const paginatedOrders = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Stats
  const totalRevenue = orders.filter((o) => o.status !== "PENDING_PAYMENT").reduce((s, o) => s + o.price, 0);
  const pending = orders.filter((o) => o.status === "PENDING_PAYMENT").length;
  const completed = orders.filter((o) => ["COMPLETED", "CERTIFICATE_ISSUED"].includes(o.status)).length;

  // Handlers
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/badal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setIsAddOpen(false);
        setForm(emptyForm);
        fetchOrders();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal mendaftarkan pesanan badal");
      }
    } catch { alert("Terjadi kesalahan koneksi"); }
    finally { setSubmitting(false); }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/badal/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateForm),
      });
      if (res.ok) {
        setSelectedOrder(null);
        setUpdateForm({});
        fetchOrders();
      } else {
        alert("Gagal memperbarui data");
      }
    } catch { alert("Kesalahan koneksi"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus pesanan badal untuk ${name}?`)) return;
    await fetch(`/api/badal/${id}`, { method: "DELETE" });
    fetchOrders();
  };

  const handlePrintCertificate = () => window.print();

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500" />
            Layanan Badal Umroh
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ibadah umroh yang dilaksanakan atas nama almarhum / yang uzur — dengan sertifikat resmi
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> + Daftar Badal Baru
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Pesanan", value: orders.length, sub: "Semua status", color: "from-slate-700 to-slate-800" },
          { label: "Menunggu Bayar", value: pending, sub: "Perlu konfirmasi", color: "from-amber-500 to-amber-600" },
          { label: "Selesai Dilaksanakan", value: completed, sub: "Alhamdulillah", color: "from-emerald-600 to-teal-700" },
          { label: "Total Pendapatan", value: formatCurrency(totalRevenue), sub: "Pembayaran diterima", color: "from-rose-600 to-rose-700", isText: true },
        ].map((kpi, i) => (
          <div key={i} className={`bg-gradient-to-br ${kpi.color} rounded-2xl p-4 text-white shadow-sm`}>
            <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">{kpi.label}</p>
            <p className={`font-black mt-1 ${kpi.isText ? "text-lg" : "text-2xl"}`}>{kpi.value}</p>
            <p className="text-[10px] opacity-70 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-2 no-print">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pemesan, nama almarhum, nomor pesanan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 bg-white"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-semibold"
        >
          <option value="ALL">Semua Status</option>
          {STATUS_FLOW.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <button onClick={fetchOrders} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wide text-[10px]">
                <th className="py-3 px-4 text-left">No. Pesanan</th>
                <th className="py-3 px-4 text-left">Pemesan (Ahli Waris)</th>
                <th className="py-3 px-4 text-left">Yang Dibadalkan</th>
                <th className="py-3 px-4 text-left">Paket & Harga</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-400">Memuat data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Heart className="w-10 h-10 text-rose-200" />
                      <p className="font-semibold text-sm">Belum ada pesanan Badal Umroh</p>
                      <p className="text-xs">Klik tombol <strong>+ Daftar Badal Baru</strong> untuk menambahkan pesanan pertama</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((o) => {
                  const badge = getStatusBadge(o.status);
                  const pkg = PACKAGE_INFO[o.packageType];
                  const isCompleted = ["COMPLETED", "CERTIFICATE_ISSUED"].includes(o.status);
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors font-medium text-slate-700">
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-slate-900">{o.orderNumber}</p>
                        <p className="text-[10px] text-slate-400">{formatDate(o.createdAt)}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{o.ordererName}</p>
                        <p className="text-[10px] text-slate-500">{o.ordererPhone} • {o.ordererRelation}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{o.recipientName}</p>
                        <p className="text-[10px] text-slate-500">
                          {o.recipientStatus === "DECEASED" ? "🕌 Almarhum/ah" : "🏥 Uzur / Sakit Permanen"} • {o.recipientGender === "MALE" ? "Laki-laki" : "Perempuan"}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{pkg?.label || o.packageType}</p>
                        <p className="font-mono font-black text-emerald-700">{formatCurrency(o.price)}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                          {badge.label}
                        </span>
                        {o.scheduledDate && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            📅 {formatDate(o.scheduledDate)}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => { setSelectedOrder(o); setUpdateForm({ status: o.status, executorName: o.executorName || "", executorPhone: o.executorPhone || "", scheduledDate: o.scheduledDate ? o.scheduledDate.slice(0, 10) : "", notes: o.notes || "" }); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                          >
                            <ChevronDown className="w-3.5 h-3.5" /> Update
                          </button>
                          {isCompleted && (
                            <button
                              onClick={() => setSelectedForCert(o)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
                            >
                              <Printer className="w-3.5 h-3.5" /> Sertifikat
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(o.id, o.recipientName)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            itemLabel="pesanan badal"
          />
        )}
      </div>

      {/* ── Modal 1: Form Pendaftaran Badal Baru ── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                Daftarkan Pesanan Badal Umroh Baru
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              {/* Pilihan Paket */}
              <div>
                <label className="font-black text-slate-800 block mb-2">1. Pilih Paket Badal *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {Object.entries(PACKAGE_INFO).map(([key, pkg]) => {
                    const Icon = pkg.icon;
                    return (
                      <div
                        key={key}
                        onClick={() => setForm({ ...form, packageType: key })}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${form.packageType === key ? "border-rose-500 bg-rose-50" : "border-slate-200 hover:border-slate-300"}`}
                      >
                        <Icon className={`w-5 h-5 mb-1 ${form.packageType === key ? "text-rose-600" : "text-slate-400"}`} />
                        <p className="font-bold text-slate-900">{pkg.label}</p>
                        <p className="font-mono font-black text-emerald-700">{formatCurrency(pkg.price)}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{pkg.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Pemesan */}
              <div>
                <label className="font-black text-slate-800 block mb-2">2. Data Pemesan / Ahli Waris *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: "Nama Lengkap Pemesan *", key: "ordererName", required: true, placeholder: "e.g. BUDI SANTOSO" },
                    { label: "Nomor WhatsApp *", key: "ordererPhone", required: true, placeholder: "e.g. 0821xxxxxxxx", type: "tel" },
                    { label: "Email", key: "ordererEmail", placeholder: "e.g. budi@gmail.com" },
                    { label: "NIK (KTP)", key: "ordererNik", placeholder: "16 digit NIK" },
                    { label: "Alamat", key: "ordererAddress", placeholder: "Alamat lengkap" },
                    { label: "Kota / Kabupaten", key: "ordererCity", placeholder: "e.g. Tebing Tinggi" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="font-bold text-slate-700">{f.label}</label>
                      <input
                        type={f.type || "text"}
                        required={f.required}
                        placeholder={f.placeholder}
                        value={(form as any)[f.key]}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-rose-500/20"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="font-bold text-slate-700">Hubungan dengan Almarhum *</label>
                    <select
                      required
                      value={form.ordererRelation}
                      onChange={(e) => setForm({ ...form, ordererRelation: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    >
                      {RELATION_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Data yang Dibadalkan */}
              <div>
                <label className="font-black text-slate-800 block mb-2">3. Data Almarhum / Yang Dibadalkan *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700">Nama Lengkap Almarhum/ah *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. H. MUHAMMAD SALIM BIN AHMAD"
                      value={form.recipientName}
                      onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Jenis Kelamin</label>
                    <select
                      value={form.recipientGender}
                      onChange={(e) => setForm({ ...form, recipientGender: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    >
                      <option value="MALE">Laki-laki</option>
                      <option value="FEMALE">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Kondisi</label>
                    <select
                      value={form.recipientStatus}
                      onChange={(e) => setForm({ ...form, recipientStatus: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    >
                      <option value="DECEASED">Almarhum / Almarhumah (Wafat)</option>
                      <option value="ALIVE_DISABLED">Masih Hidup, Uzur / Sakit Permanen</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Tempat Lahir</label>
                    <input
                      type="text"
                      placeholder="e.g. Tebing Tinggi"
                      value={form.recipientBirthPlace}
                      onChange={(e) => setForm({ ...form, recipientBirthPlace: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={form.recipientDateOfBirth}
                      onChange={(e) => setForm({ ...form, recipientDateOfBirth: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="font-bold text-slate-700">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Pesan khusus dari keluarga, doa yang ingin dipanjatkan, dll..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              {/* Rekening Pembayaran */}
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 text-xs space-y-1">
                <p className="font-black text-amber-950">💳 Rekening Pembayaran Badal Umroh:</p>
                <p className="font-mono font-bold text-blue-900 text-base">106-00-1899-7788</p>
                <p className="text-slate-700 font-bold">a.n. PT BAROKAH SULTHAN HARAMAIN • Bank Mandiri Cabang Tebing Tinggi</p>
                <p className="text-slate-600">Harga Paket: <strong className="text-emerald-700">{formatCurrency(PACKAGE_INFO[form.packageType]?.price || 3500000)}</strong></p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-colors disabled:opacity-60"
              >
                {submitting ? "Menyimpan..." : "✅ Simpan Pesanan Badal Umroh"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Update Status ── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" /> Update Status Badal
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Summary */}
            <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 space-y-1 text-xs">
              <p className="font-bold text-rose-900">{selectedOrder.orderNumber}</p>
              <p>Dibadalkan untuk: <strong>{selectedOrder.recipientName}</strong></p>
              <p>Pemesan: <strong>{selectedOrder.ordererName}</strong> ({selectedOrder.ordererRelation})</p>
              <p>Paket: <strong>{PACKAGE_INFO[selectedOrder.packageType]?.label}</strong> • {formatCurrency(selectedOrder.price)}</p>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3 text-xs">
              {/* Status Pipeline */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Status Terkini</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {STATUS_FLOW.map((s) => (
                    <button
                      type="button"
                      key={s.key}
                      onClick={() => setUpdateForm({ ...updateForm, status: s.key })}
                      className={`p-2 rounded-xl border-2 text-left text-[10px] font-bold transition-all ${updateForm.status === s.key ? "border-indigo-500 bg-indigo-50 text-indigo-900" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                    >
                      {s.key === updateForm.status ? "✓ " : ""}{s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Nama Pelaksana Badal (di Saudi)</label>
                  <input
                    type="text"
                    placeholder="Nama muthawwif / mitra Saudi"
                    value={updateForm.executorName || ""}
                    onChange={(e) => setUpdateForm({ ...updateForm, executorName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">HP Pelaksana</label>
                  <input
                    type="tel"
                    placeholder="No. HP pelaksana"
                    value={updateForm.executorPhone || ""}
                    onChange={(e) => setUpdateForm({ ...updateForm, executorPhone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Tanggal Jadwal Pelaksanaan</label>
                  <input
                    type="date"
                    value={updateForm.scheduledDate || ""}
                    onChange={(e) => setUpdateForm({ ...updateForm, scheduledDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Metode Pembayaran</label>
                  <select
                    value={updateForm.paymentMethod || "BANK_TRANSFER"}
                    onChange={(e) => setUpdateForm({ ...updateForm, paymentMethod: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Tunai</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Catatan Update</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan perubahan status..."
                  value={updateForm.notes || ""}
                  onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm"
              >
                {submitting ? "Menyimpan..." : "💾 Simpan Perubahan Status"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 3: Sertifikat Badal Umroh ── */}
      {selectedForCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 no-print">
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Sertifikat Resmi Badal Umroh</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintCertificate}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700"
                >
                  <Printer className="w-4 h-4" /> Cetak Sertifikat
                </button>
                <button onClick={() => setSelectedForCert(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Certificate */}
            <div className="border-4 border-double border-amber-400 p-8 rounded-2xl bg-white text-slate-900 space-y-5 relative">
              {/* Background Ornament */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
                <Heart className="w-64 h-64 text-rose-400" />
              </div>

              {/* Header */}
              <div className="text-center space-y-2 relative z-10">
                <div className="flex justify-center">
                  <img
                    src="/sulthan-haramain-logo.jpg"
                    alt="Sulthan Haramain"
                    style={{ maxHeight: "60px", objectFit: "contain" }}
                  />
                </div>
                <p className="text-[10px] font-semibold text-slate-500 tracking-widest uppercase">
                  {travelSettings.companyName || "PT BAROKAH SULTHAN HARAMAIN"} — PPIU Resmi Kemenag RI
                </p>
                <div className="relative w-full h-5 flex items-center overflow-hidden my-1">
                  <div className="h-1.5 flex-1 bg-gradient-to-r from-amber-400 to-amber-500 rounded-l" />
                  <Heart className="w-5 h-5 text-rose-500 mx-2" />
                  <div className="h-1.5 flex-1 bg-gradient-to-l from-amber-400 to-amber-500 rounded-r" />
                </div>
                <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">
                  Sertifikat Badal Umroh
                </h1>
                <p className="text-xs text-slate-500 font-semibold">No: {selectedForCert.orderNumber}</p>
              </div>

              {/* Body */}
              <div className="text-center space-y-3 relative z-10">
                <p className="text-sm text-slate-600">Dengan Rahmat Allah Subhanahu wa Ta'ala,</p>
                <p className="text-sm text-slate-700">Kami menerangkan bahwa ibadah <strong>Umroh</strong> telah dilaksanakan oleh:</p>

                <div className="bg-slate-50 rounded-xl p-3.5 text-left space-y-1.5 text-xs border border-slate-200">
                  <div className="flex gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span><span className="text-slate-500">Pelaksana Badal:</span> <strong>{selectedForCert.executorName || "Muthawwif Sulthan Haramain"}</strong></span>
                  </div>
                  {selectedForCert.scheduledDate && (
                    <div className="flex gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span><span className="text-slate-500">Tanggal Pelaksanaan:</span> <strong>{formatDate(selectedForCert.scheduledDate, "dd MMMM yyyy")}</strong></span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span><span className="text-slate-500">Lokasi:</span> <strong>Masjidil Haram, Makkah Al-Mukarramah, Arab Saudi</strong></span>
                  </div>
                  <div className="flex gap-2">
                    <Package className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span><span className="text-slate-500">Jenis Badal:</span> <strong>Tawaf, Sa'i di Shafa-Marwa, Tahallul</strong></span>
                  </div>
                </div>

                <p className="text-sm text-slate-700">Atas nama / diniatkan untuk:</p>
                <div className="bg-amber-50 rounded-2xl py-4 px-6 border-2 border-amber-400 space-y-1">
                  <p className="text-2xl font-black text-slate-900 uppercase tracking-wide">{selectedForCert.recipientName}</p>
                  <p className="text-xs text-slate-600">
                    {selectedForCert.recipientGender === "MALE" ? "Bin" : "Binti"} —
                    {selectedForCert.recipientStatus === "DECEASED" ? " Almarhum/ah, Semoga Allah merahmati beliau" : " Dalam keadaan uzur / sakit permanen"}
                    {selectedForCert.recipientBirthPlace ? `, lahir di ${selectedForCert.recipientBirthPlace}` : ""}
                  </p>
                </div>

                <p className="text-xs text-slate-600 italic">
                  Dipesan oleh: <strong>{selectedForCert.ordererName}</strong> ({selectedForCert.ordererRelation.toLowerCase()} dari yang bersangkutan)
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Semoga Allah ﷻ menerima amal ibadah ini sebagai hadiah yang tulus ikhlas,
                  mengampuni segala dosa, melapangkan kubur, dan memasukkan ke dalam Surga-Nya.
                  <span className="font-bold text-slate-700"> Aamiin Yaa Rabbal 'Aalamiin.</span>
                </p>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-amber-200 flex justify-between items-end relative z-10">
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <p className="font-bold text-emerald-800">Status: SAH & RESMI</p>
                  <p>Diterbitkan: {formatDate(selectedForCert.certificateIssuedAt || new Date(), "dd MMMM yyyy")}</p>
                  <p className="text-[9px]">No. Izin PPIU: {travelSettings.licenseNumber || "25052200384080005"}</p>
                </div>
                <div className="text-center w-44">
                  <p className="text-xs text-slate-600">
                    Tebing Tinggi, {formatDate(selectedForCert.completedAt || new Date(), "dd MMMM yyyy")}
                  </p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">Pimpinan / Direktur,</p>
                  <div className="h-12 flex items-center justify-center">
                    <span className="font-serif italic text-xs text-teal-700 font-bold border-b border-teal-400 pb-0.5">
                      [Tanda Tangan & Stempel Resmi]
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">{travelSettings.directorName || "ATIYATUL AMRA"}</p>
                  <p className="text-[10px] text-slate-400">{travelSettings.directorTitle || "Direktur Utama"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
