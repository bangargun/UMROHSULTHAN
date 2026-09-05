"use client";

import React, { useState, useEffect } from "react";
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Search,
  CheckCircle2,
  Package,
  Clock,
  X,
  Edit,
  Trash2,
  Filter,
  Layers,
  Sparkles,
  Calendar,
  History,
  TrendingUp,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Pagination from "@/components/common/Pagination";

interface LogisticsViewProps {
  equipment: any[];
  onRefresh: () => void;
  onNavigateToHandover?: () => void;
}

export default function LogisticsView({ equipment, onRefresh, onNavigateToHandover }: LogisticsViewProps) {
  const [activeTab, setActiveTab] = useState<"STOCK" | "HISTORY">("STOCK");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [stockPage, setStockPage] = useState(1);
  const [stockPageSize, setStockPageSize] = useState(10);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [movementsHistory, setMovementsHistory] = useState<any[]>([]);
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<any | null>(null);

  // Form states
  const [editForm, setEditForm] = useState({
    name: "",
    sku: "",
    category: "AKSESORIS",
    totalStock: "0",
    availableStock: "0",
    unit: "PCS",
    minStockAlert: "10",
    description: "",
  });

  const [mutationForm, setMutationForm] = useState({
    equipmentId: "",
    movementDate: new Date().toISOString().split("T")[0],
    type: "IN_PURCHASE",
    quantity: "10",
    referenceNo: "",
    notes: "",
    createdBy: "Staf Logistik",
  });

  const [loading, setLoading] = useState(false);

  const fetchMovements = async () => {
    try {
      const res = await fetch("/api/equipment/movement");
      const data = await res.json();
      if (Array.isArray(data)) {
        setMovementsHistory(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const filteredEquipment = equipment.filter((eq) => {
    const matchSearch =
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === "ALL" || eq.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const filteredMovements = movementsHistory.filter((m) => {
    const itemName = m.equipment?.name || "";
    const sku = m.equipment?.sku || "";
    const ref = m.referenceNo || "";
    return (
      itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Reset pagination when search or category changes
  useEffect(() => {
    setStockPage(1);
    setHistoryPage(1);
  }, [searchTerm, categoryFilter]);

  const paginatedEquipment = filteredEquipment.slice((stockPage - 1) * stockPageSize, stockPage * stockPageSize);
  const paginatedMovements = filteredMovements.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);

  const handleOpenEdit = (item: any) => {
    setEditingEquipment(item);
    setEditForm({
      name: item.name,
      sku: item.sku,
      category: item.category,
      totalStock: String(item.totalStock),
      availableStock: String(item.availableStock),
      unit: item.unit,
      minStockAlert: String(item.minStockAlert),
      description: item.description || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipment) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/equipment/${editingEquipment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        alert("Data barang perlengkapan berhasil diperbarui!");
        setIsEditModalOpen(false);
        setEditingEquipment(null);
        onRefresh();
        fetchMovements();
      } else {
        const err = await res.json();
        alert(`Gagal memperbarui barang: ${err.error || "Terjadi kesalahan"}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus barang "${name}" dari inventaris?`)) return;
    try {
      const res = await fetch(`/api/equipment/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert(`Barang "${name}" berhasil dihapus.`);
        onRefresh();
        fetchMovements();
      } else {
        const err = await res.json();
        alert(`Gagal menghapus barang: ${err.error || "Terjadi kesalahan"}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMutation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/equipment/movement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mutationForm),
      });
      if (res.ok) {
        setIsMutationModalOpen(false);
        setMutationForm({
          equipmentId: "",
          movementDate: new Date().toISOString().split("T")[0],
          type: "IN_PURCHASE",
          quantity: "10",
          referenceNo: "",
          notes: "",
          createdBy: "Staf Logistik",
        });
        alert("Mutasi stok logistik berhasil dicatat!");
        onRefresh();
        fetchMovements();
      } else {
        const err = await res.json();
        alert(`Gagal mutasi stok: ${err.error || "Terjadi kesalahan"}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "BAGASI":
      case "LUGGAGE":
        return { label: "Bagasi & Koper", bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" };
      case "KAIN":
        return { label: "Kain Ihram", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" };
      case "SERAGAM":
      case "CLOTHING":
        return { label: "Batik & Mukena", bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" };
      case "DOKUMEN":
      case "BOOK":
        return { label: "Buku Panduan", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" };
      default:
        return { label: "Aksesoris", bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
    }
  };

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case "IN_PURCHASE":
        return { label: "Stok Masuk (Beli / Restock)", bg: "bg-emerald-50 text-emerald-800 border-emerald-200", sign: "+" };
      case "OUT_DISTRIBUTION":
        return { label: "Stok Keluar (Distribusi Jamaah)", bg: "bg-rose-50 text-rose-800 border-rose-200", sign: "-" };
      case "RETURN":
        return { label: "Retur / Pengembalian", bg: "bg-blue-50 text-blue-800 border-blue-200", sign: "+" };
      case "ADJUSTMENT":
        return { label: "Penyesuaian Opname", bg: "bg-amber-50 text-amber-800 border-amber-200", sign: "±" };
      default:
        return { label: type, bg: "bg-slate-50 text-slate-800 border-slate-200", sign: "" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="h-6 w-6 text-emerald-600" />
            Manajemen Inventaris & Keluar Masuk Logistik
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan persediaan koper, seragam batik, kain ihram, mukena, dan perlengkapan manasik dalam format tabel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToHandover && (
            <button
              onClick={onNavigateToHandover}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Ceklis Serah Terima
            </button>
          )}

          <button
            onClick={() => {
              setMutationForm({
                equipmentId: equipment[0]?.id || "",
                movementDate: new Date().toISOString().split("T")[0],
                type: "IN_PURCHASE",
                quantity: "10",
                referenceNo: `PO-${Date.now().toString().slice(-4)}`,
                notes: "",
                createdBy: "Staf Logistik",
              });
              setIsMutationModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all"
          >
            <ArrowDownLeft className="h-4 w-4" />
            + Input Mutasi Stok
          </button>
        </div>
      </div>

      {/* SUB-TABS: DAFTAR BARANG vs RIWAYAT PENANGGALAN MUTASI */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("STOCK")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "STOCK"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Boxes className="w-4 h-4" /> 1. Daftar Stok & Persediaan ({equipment.length})
        </button>

        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "HISTORY"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <History className="w-4 h-4" /> 2. Riwayat Penanggalan Mutasi Masuk/Keluar ({movementsHistory.length})
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === "STOCK"
                ? "Cari nama barang, SKU, atau kategori perlengkapan..."
                : "Cari riwayat mutasi berdasarkan nama barang, SKU, no ref..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50"
          />
        </div>

        {activeTab === "STOCK" && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-700"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="BAGASI">Bagasi & Koper</option>
              <option value="KAIN">Kain Ihram</option>
              <option value="SERAGAM">Batik & Mukena</option>
              <option value="AKSESORIS">Aksesoris</option>
              <option value="DOKUMEN">Buku Dokumen</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: Structured Inventory Table */}
      {activeTab === "STOCK" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">SKU / Kode</th>
                  <th className="py-3 px-4">Nama Barang Perlengkapan</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-center">Stok Tersedia</th>
                  <th className="py-3 px-4 text-center">Total Stok Fisik</th>
                  <th className="py-3 px-4 text-center">Terdistribusi</th>
                  <th className="py-3 px-4 text-center">Min. Alert</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredEquipment.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Tidak ada data barang perlengkapan ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedEquipment.map((item) => {
                    const isLowStock = item.availableStock <= item.minStockAlert;
                    const isOutOfStock = item.availableStock === 0;
                    const badge = getCategoryBadge(item.category);
                    const distributed = item.totalStock - item.availableStock;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-black text-slate-900 text-xs">
                          {item.sku}
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          {item.description && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text} border ${badge.border}`}>
                            {badge.label}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-black text-sm ${
                              isOutOfStock
                                ? "text-rose-600"
                                : isLowStock
                                ? "text-amber-600"
                                : "text-emerald-700"
                            }`}
                          >
                            {item.availableStock}
                          </span>{" "}
                          <span className="text-[10px] text-slate-400 font-semibold">{item.unit}</span>
                        </td>

                        <td className="py-3 px-4 text-center font-semibold text-slate-800">
                          {item.totalStock} <span className="text-[10px] text-slate-400">{item.unit}</span>
                        </td>

                        <td className="py-3 px-4 text-center font-semibold text-slate-600">
                          {distributed} <span className="text-[10px] text-slate-400">{item.unit}</span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {item.minStockAlert} {item.unit}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3" /> Habis
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3" /> Menipis
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Aman
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setMutationForm({
                                   equipmentId: item.id,
                                  movementDate: new Date().toISOString().split("T")[0],
                                  type: "IN_PURCHASE",
                                  quantity: "10",
                                  referenceNo: "",
                                  notes: "",
                                  createdBy: "Staf Logistik",
                                });
                                setIsMutationModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold transition-all"
                              title="Input Mutasi Masuk/Keluar"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" /> Mutasi
                            </button>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-all"
                              title="Edit Barang"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all"
                              title="Hapus Barang"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
          {filteredEquipment.length > 0 && (
            <Pagination
              currentPage={stockPage}
              totalItems={filteredEquipment.length}
              pageSize={stockPageSize}
              onPageChange={setStockPage}
              onPageSizeChange={(newSize) => {
                setStockPageSize(newSize);
                setStockPage(1);
              }}
              itemLabel="barang"
            />
          )}
        </div>
      )}

      {/* TAB 2: RIWAYAT PENANGGALAN MUTASI LOGISTIK */}
      {activeTab === "HISTORY" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tanggal & Waktu Mutasi</th>
                  <th className="py-3 px-4">No. Surat Jalan / Referensi</th>
                  <th className="py-3 px-4">Nama Barang & SKU</th>
                  <th className="py-3 px-4">Jenis Mutasi</th>
                  <th className="py-3 px-4 text-center">Jumlah Mutasi</th>
                  <th className="py-3 px-4">Petugas / PIC</th>
                  <th className="py-3 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      Belum ada riwayat penanggalan mutasi logistik tercatat.
                    </td>
                  </tr>
                ) : (
                  paginatedMovements.map((m) => {
                    const badge = getMovementTypeBadge(m.type);
                    const isPlus = m.type === "IN_PURCHASE" || m.type === "RETURN";

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            {formatDate(m.movementDate || m.createdAt, "dd MMMM yyyy")}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-700 font-bold">
                          {m.referenceNo || "-"}
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{m.equipment?.name}</p>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                            {m.equipment?.sku}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-black text-sm">
                          <span className={isPlus ? "text-emerald-700" : "text-rose-700"}>
                            {badge.sign} {m.quantity} {m.equipment?.unit || "Pcs"}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          {m.createdBy || "Petugas Logistik"}
                        </td>

                        <td className="py-3 px-4 text-[11px] text-slate-500">
                          {m.notes || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredMovements.length > 0 && (
            <Pagination
              currentPage={historyPage}
              totalItems={filteredMovements.length}
              pageSize={historyPageSize}
              onPageChange={setHistoryPage}
              onPageSizeChange={(newSize) => {
                setHistoryPageSize(newSize);
                setHistoryPage(1);
              }}
              itemLabel="riwayat mutasi"
            />
          )}
        </div>
      )}

      {/* Modal: Edit Data Barang */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-600" />
                Edit / Ubah Barang Logistik
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nama Barang / Perlengkapan *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Kode SKU *</label>
                  <input
                    type="text"
                    required
                    value={editForm.sku}
                    onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Kategori</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                  >
                    <option value="BAGASI">Bagasi & Tas</option>
                    <option value="KAIN">Kain Ihram</option>
                    <option value="SERAGAM">Mukena / Batik</option>
                    <option value="AKSESORIS">Aksesoris & ID Card</option>
                    <option value="DOKUMEN">Buku Doa & Panduan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Total Stok</label>
                  <input
                    type="number"
                    value={editForm.totalStock}
                    onChange={(e) => setEditForm({ ...editForm, totalStock: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Tersedia</label>
                  <input
                    type="number"
                    value={editForm.availableStock}
                    onChange={(e) => setEditForm({ ...editForm, availableStock: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Satuan</label>
                  <select
                    value={editForm.unit}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  >
                    <option value="PCS">PCS</option>
                    <option value="SET">SET</option>
                    <option value="LEMBAR">LEMBAR</option>
                    <option value="POTONG">POTONG</option>
                    <option value="BUKU">BUKU</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Min. Alert Stok Menipis</label>
                <input
                  type="number"
                  value={editForm.minStockAlert}
                  onChange={(e) => setEditForm({ ...editForm, minStockAlert: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 shadow-xs"
                >
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Catat Mutasi Masuk / Keluar dengan PENANGGALAN */}
      {isMutationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                Catat Mutasi Stok Logistik
              </h3>
              <button
                onClick={() => setIsMutationModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMutation} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Pilih Barang Logistik *</label>
                <select
                  required
                  value={mutationForm.equipmentId}
                  onChange={(e) => setMutationForm({ ...mutationForm, equipmentId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-emerald-500/20 font-bold"
                >
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} (Tersedia: {eq.availableStock} {eq.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* PENANGGALAN MUTASI (DATE PICKER) */}
              <div>
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Tanggal Mutasi (Penanggalan) *
                </label>
                <input
                  type="date"
                  required
                  value={mutationForm.movementDate}
                  onChange={(e) => setMutationForm({ ...mutationForm, movementDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Jenis Mutasi</label>
                  <select
                    value={mutationForm.type}
                    onChange={(e) => setMutationForm({ ...mutationForm, type: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                  >
                    <option value="IN_PURCHASE">Stok Masuk (Beli / Restock)</option>
                    <option value="OUT_DISTRIBUTION">Stok Keluar (Distribusi)</option>
                    <option value="RETURN">Retur / Pengembalian</option>
                    <option value="ADJUSTMENT">Penyesuaian Opname</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Jumlah Mutasi *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={mutationForm.quantity}
                    onChange={(e) => setMutationForm({ ...mutationForm, quantity: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">No. Surat Jalan / Referensi PO</label>
                <input
                  type="text"
                  placeholder="e.g. PO-VENDOR-2026-089"
                  value={mutationForm.referenceNo}
                  onChange={(e) => setMutationForm({ ...mutationForm, referenceNo: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Catatan Mutasi</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Penerimaan batch 2 koper dari supplier..."
                  value={mutationForm.notes}
                  onChange={(e) => setMutationForm({ ...mutationForm, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMutationModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs"
                >
                  {loading ? "Menyimpan..." : "Simpan Mutasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
