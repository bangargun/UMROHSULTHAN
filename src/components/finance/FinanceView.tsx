"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Printer,
  DollarSign,
  Send,
  X,
  FileCheck,
  Building,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusBadge, generateWhatsAppReminderUrl, formatRupiahWithWords } from "@/lib/utils";

interface FinanceViewProps {
  invoices: any[];
  pilgrims: any[];
  onRefresh: () => void;
  initialSearchTerm?: string;
}

export default function FinanceView({ invoices, pilgrims, onRefresh, initialSearchTerm = "" }: FinanceViewProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<any | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any | null>(null);
  const [travelSettings, setTravelSettings] = useState<any>({
    companyName: "PT TRAVEL UMROH BERKAH NUSANTARA",
    licenseNumber: "SK Kemenag RI No. 892 Tahun 2021",
    address: "Jl. KH. Abdullah Syafei No. 45, Tebet, Jakarta Selatan 12810",
    phone: "(021) 7890-1234 / 0812-3456-7890",
    email: "info@travelumroh.id",
    directorName: "Ustadz Ahmad Fauzi, Lc.",
    directorTitle: "Direktur Utama",
    bankBSI: "7123-4567-89 a.n PT TRAVEL UMROH BERKAH NUSANTARA",
    bankBCA: "731-008-899 a.n PT TRAVEL UMROH BERKAH NUSANTARA",
    bankMandiri: "137-00-9876543-2 a.n PT TRAVEL UMROH BERKAH NUSANTARA",
  });

  React.useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.companyName) setTravelSettings(data);
      })
      .catch((e) => console.error(e));
  }, []);

  // Form states
  const [formData, setFormData] = useState({
    pilgrimId: pilgrims[0]?.id || "",
    isMultiPilgrim: false,
    selectedPilgrimIds: [] as string[],
    allocations: {} as Record<string, string>,
    type: "INSTALLMENT",
    title: "Pelunasan Biaya Paket Umroh",
    amount: "",
    dueDate: "",
    payerName: "",
    payerPhone: "",
    notes: "",
  });

  const [paymentData, setPaymentData] = useState({
    paymentMethod: "BANK_TRANSFER",
    paymentDate: new Date().toISOString().split("T")[0],
    payerName: "",
    payerPhone: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  // Financial calculations helper for single or multi-pilgrim
  const getPilgrimFinancials = (p: any) => {
    if (!p) return { pkgPrice: 0, totalPaid: 0, remaining: 0 };
    let pkgPrice = p.package ? (p.package.priceQuad || 0) : 0;
    if (p.roomType === "TRIPLE" && p.package?.priceTriple) pkgPrice = p.package.priceTriple;
    if (p.roomType === "DOUBLE" && p.package?.priceDouble) pkgPrice = p.package.priceDouble;

    const paidInvoices = (p.invoices || []).filter((inv: any) => inv.status === "PAID");
    const totalPaid = paidInvoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
    const remaining = Math.max(0, pkgPrice - totalPaid);
    return { pkgPrice, totalPaid, remaining };
  };

  // Financial calculations
  let totalRevenue = 0;
  let totalPending = 0;
  let totalOverdue = 0;

  invoices.forEach((inv) => {
    if (inv.status === "PAID") totalRevenue += inv.amount;
    else if (inv.status === "PENDING") totalPending += inv.amount;
    else if (inv.status === "OVERDUE") totalOverdue += inv.amount;
  });

  // Filter
  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.pilgrim?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.payerName && inv.payerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      inv.pilgrim?.phone.includes(searchTerm);
    const matchStatus = selectedStatus === "ALL" || inv.status === selectedStatus;
    const matchType = selectedType === "ALL" || inv.type === selectedType;
    return matchSearch && matchStatus && matchType;
  });

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let payload: any = { ...formData };

      if (formData.isMultiPilgrim) {
        const pList = pilgrims.filter((p) => formData.selectedPilgrimIds.includes(p.id));
        if (pList.length === 0) {
          alert("Pilih minimal 1 jamaah untuk pembayaran multi-jamaah");
          setLoading(false);
          return;
        }

        const totalAmt = parseFloat(formData.amount || "0");
        if (totalAmt <= 0) {
          alert("Nominal tagihan harus lebih dari 0");
          setLoading(false);
          return;
        }

        // Build allocations array per pilgrim
        const allocationsArray = pList.map((p) => {
          const allocVal = parseFloat(formData.allocations[p.id] || "0");
          const finalAmount = allocVal > 0 ? allocVal : (totalAmt / pList.length);
          return {
            pilgrimId: p.id,
            amount: finalAmount,
            title: `${formData.title} (${p.name})`,
          };
        }).filter((a) => a.amount > 0);

        if (allocationsArray.length === 0) {
          alert("Minimal ada 1 alokasi pembayaran untuk jamaah terpilih (> Rp 0)");
          setLoading(false);
          return;
        }

        payload = {
          ...formData,
          allocations: allocationsArray,
        };
      }

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({
          pilgrimId: pilgrims[0]?.id || "",
          isMultiPilgrim: false,
          selectedPilgrimIds: [],
          allocations: {},
          type: "INSTALLMENT",
          title: "Pelunasan Biaya Paket Umroh",
          amount: "",
          dueDate: "",
          payerName: "",
          payerPhone: "",
          notes: "",
        });
        onRefresh();
      } else {
        const errData = await res.json();
        alert(errData.error || "Gagal membuat invoice");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${selectedInvoiceForPayment.id}/pay`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });
      if (res.ok) {
        setIsInvoicePaymentModal(false);
        setSelectedInvoiceForPayment(null);
        alert("Pembayaran berhasil dicatat!");
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setIsInvoicePaymentModal = (open: boolean) => {
    if (!open) setSelectedInvoiceForPayment(null);
  };

  const handleSendWhatsApp = (inv: any) => {
    const url = generateWhatsAppReminderUrl({
      phone: inv.pilgrim?.phone || "",
      pilgrimName: inv.pilgrim?.name || "Jamaah",
      invoiceNumber: inv.invoiceNumber,
      title: inv.title,
      amount: inv.amount,
      dueDate: inv.dueDate,
    });
    window.open(url, "_blank");
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Financial KPI Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 no-print">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-md">
          <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Total Kas Diterima</p>
          <h3 className="text-2xl font-black mt-1">{formatCurrency(totalRevenue)}</h3>
          <p className="text-[11px] text-emerald-200 mt-1">Pembayaran DP & Pelunasan yang telah lunas</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tagihan Tertunda (Pending)</p>
          <h3 className="text-2xl font-black text-amber-600 mt-1">{formatCurrency(totalPending)}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Menunggu pembayaran sebelum jatuh tempo</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Seluruh Tagihan</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalRevenue + totalPending)}</h3>
          <p className="text-[11px] text-slate-400 mt-1">{invoices.length} Faktur / Invoice Diterbitkan</p>
        </div>
      </div>

      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-emerald-600" />
            Manajemen Invoicing & Follow-up Pembayaran
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan DP, pelunasan, kirim pengingat tagihan via WhatsApp, dan kwitansi resmi.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          + Buat Tagihan / Invoice Baru
        </button>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs no-print">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor invoice, nama jamaah, atau no HP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {["ALL", "PENDING", "PAID", "OVERDUE"].map((status) => {
            const badge = status === "ALL" ? { label: "Semua Status" } : getStatusBadge(status);
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedStatus === status
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {badge.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Invoice & Jenis</th>
                <th className="py-3 px-4">Nama Jamaah & Paket</th>
                <th className="py-3 px-4">Nominal</th>
                <th className="py-3 px-4">Jatuh Tempo / Bayar</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Tindakan Follow-Up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Tidak ada data invoice ditemukan
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const badge = getStatusBadge(inv.status);
                  const isPaid = inv.status === "PAID";

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</p>
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {inv.type === "DP" ? "Uang Muka (DP)" : inv.type === "FULL_PAYMENT" ? "Pelunasan" : "Cicilan"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{inv.pilgrim?.name}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{inv.pilgrim?.package?.name}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <p className="font-black text-slate-900 text-sm">{formatCurrency(inv.amount)}</p>
                          {(inv.notes?.toLowerCase().includes("promo") || inv.notes?.toLowerCase().includes("diskon") || inv.title?.toLowerCase().includes("promo")) && (
                            <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                              Diskon 4 Jt
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">{inv.title}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        {isPaid ? (
                          <div>
                            <p className="text-emerald-700 font-bold">Lunas: {formatDate(inv.paymentDate, "dd/MM/yyyy")}</p>
                            <p className="text-[10px] text-slate-500">Via {inv.paymentMethod}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-bold text-amber-700">Tempo: {formatDate(inv.dueDate, "dd/MM/yyyy")}</p>
                            <p className="text-[10px] text-slate-400">Belum dibayar</p>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text} border ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Follow-up WA Reminder */}
                          {!isPaid && (
                            <button
                              onClick={() => handleSendWhatsApp(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors"
                              title="Kirim Tagihan via WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              WA Tagihan
                            </button>
                          )}

                          {/* Record Payment */}
                          {!isPaid ? (
                            <button
                              onClick={() => setSelectedInvoiceForPayment(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                              title="Konfirmasi Pembayaran Diterima"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Bayar
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedInvoiceForReceipt(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                              title="Cetak Kwitansi Pembayaran"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Kwitansi
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Form Buat Invoice Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Buat Tagihan / Invoice Umroh Baru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddInvoice} className="space-y-3.5 text-xs">
              {/* Opsi Tipe Tagihan: Tunggal vs Multi-Jamaah (Keluarga) */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isMultiPilgrim: false, selectedPilgrimIds: [] })}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    !formData.isMultiPilgrim ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-emerald-600" /> 1 Jamaah Tunggal
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isMultiPilgrim: true, selectedPilgrimIds: formData.pilgrimId ? [formData.pilgrimId] : [] })}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    formData.isMultiPilgrim ? "bg-white text-emerald-700 shadow-xs ring-1 ring-emerald-500/30" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-amber-600" /> Multi-Jamaah (2+ Sekaligus)
                </button>
              </div>

              {!formData.isMultiPilgrim ? (
                <div>
                  <label className="font-bold text-slate-700">Pilih Jamaah *</label>
                  <select
                    required
                    value={formData.pilgrimId}
                    onChange={(e) => {
                      const pId = e.target.value;
                      const sel = pilgrims.find((p) => p.id === pId);
                      setFormData({
                        ...formData,
                        pilgrimId: pId,
                        payerName: formData.payerName === "Hamba Allah" ? "Hamba Allah" : (sel?.name || ""),
                      });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">-- Pilih Jamaah Terdaftar --</option>
                    {pilgrims.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ({p.package?.name || "Belum Pilih Paket"}) - HP: {p.phone}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2 bg-amber-50/60 p-3 rounded-2xl border border-amber-200">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-amber-950">Pilih Jamaah Rombongan / Keluarga (Pilih 2 atau lebih) *</label>
                    <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                      {formData.selectedPilgrimIds.length} Jamaah Terpilih
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {pilgrims.map((p) => {
                      const isChecked = formData.selectedPilgrimIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                            isChecked ? "bg-emerald-50 border-emerald-500 shadow-2xs" : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const newSelected = e.target.checked
                                ? [...formData.selectedPilgrimIds, p.id]
                                : formData.selectedPilgrimIds.filter((id) => id !== p.id);
                              setFormData({ ...formData, selectedPilgrimIds: newSelected });
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{p.package?.name || "Tanpa Paket"} • {p.phone}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Box Info Pembayar / Donatur (Hamba Allah / Suami / Sponsor) */}
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    Pihak Penyetor / Pembayar (Opsional / Donatur)
                  </label>
                  <span className="text-[10px] text-slate-500">Kwitansi akan mencatat nama ini</span>
                </div>

                <div>
                  <div className="flex gap-1.5 mb-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const sel = pilgrims.find((p) => p.id === formData.pilgrimId);
                        setFormData({ ...formData, payerName: sel?.name || "", payerPhone: sel?.phone || "" });
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Sesuai Jamaah
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payerName: "Hamba Allah", payerPhone: "" })}
                      className="px-2 py-0.5 rounded-lg bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-900 hover:bg-amber-200"
                    >
                      ✨ Hamba Allah
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payerName: "Keluarga / Suami", payerPhone: "" })}
                      className="px-2 py-0.5 rounded-lg bg-blue-100 border border-blue-300 text-[10px] font-bold text-blue-900 hover:bg-blue-200"
                    >
                      👨‍👩‍👧 Suami / Keluarga
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payerName: "Donatur / Sponsor Perusahaan", payerPhone: "" })}
                      className="px-2 py-0.5 rounded-lg bg-purple-100 border border-purple-300 text-[10px] font-bold text-purple-900 hover:bg-purple-200"
                    >
                      🏢 Sponsor / Donatur
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nama Penyetor (e.g. Hamba Allah / Bambang)"
                      value={formData.payerName}
                      onChange={(e) => setFormData({ ...formData, payerName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2 bg-white font-medium"
                    />
                    <input
                      type="tel"
                      placeholder="No HP Pembayar (Opsional)"
                      value={formData.payerPhone}
                      onChange={(e) => setFormData({ ...formData, payerPhone: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Smart Financial Indicator Box (Supports Single & Multi-Jamaah Aggregation) */}
              {(() => {
                if (formData.isMultiPilgrim) {
                  const selPilgrims = pilgrims.filter((p) => formData.selectedPilgrimIds.includes(p.id));
                  if (selPilgrims.length === 0) return null;

                  let totalPkgPrice = 0;
                  let totalPaid = 0;
                  let totalRemaining = 0;

                  selPilgrims.forEach((p) => {
                    const fin = getPilgrimFinancials(p);
                    totalPkgPrice += fin.pkgPrice;
                    totalPaid += fin.totalPaid;
                    totalRemaining += fin.remaining;
                  });

                  return (
                    <div className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-2xl space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                        <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-amber-700" />
                          Ringkasan Tagihan Gabungan ({selPilgrims.length} Jamaah Terpilih)
                        </span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                          Multi-Jamaah
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-600 block">Total Harga Paket ({selPilgrims.length} Org):</span>
                          <span className="font-mono font-bold text-slate-900 text-xs">{formatCurrency(totalPkgPrice)}</span>
                        </div>
                        <div>
                          <span className="text-slate-600 block">Total Sudah Terbayar (DP):</span>
                          <span className="font-mono font-bold text-emerald-700 text-xs">{formatCurrency(totalPaid)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-amber-200">
                        <div>
                          <span className="font-black text-amber-950 block">Total Kekurangan Pelunasan ({selPilgrims.length} Jamaah):</span>
                          <span className="font-mono font-black text-amber-700 text-sm">{formatCurrency(totalRemaining)}</span>
                        </div>
                        {totalRemaining > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newAlloc: Record<string, string> = {};
                              selPilgrims.forEach((p) => {
                                const fin = getPilgrimFinancials(p);
                                newAlloc[p.id] = String(fin.remaining);
                              });
                              setFormData({
                                ...formData,
                                amount: String(totalRemaining),
                                type: "FULL_PAYMENT",
                                title: `Pelunasan Akhir Biaya Paket Umroh (${selPilgrims.length} Jamaah)`,
                                allocations: newAlloc,
                              });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 shadow-md transition-all flex items-center gap-1"
                          >
                            ✨ Pakai Total Sisa ({formatCurrency(totalRemaining)})
                          </button>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  const selPilgrim = pilgrims.find((p) => p.id === formData.pilgrimId);
                  if (!selPilgrim) return null;

                  const { pkgPrice, totalPaid, remaining } = getPilgrimFinancials(selPilgrim);

                  return (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Harga Paket ({selPilgrim.roomType || "QUAD"}):</span>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(pkgPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Sudah Dibayar (DP):</span>
                        <span className="font-mono font-bold text-emerald-700">{formatCurrency(totalPaid)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200">
                        <span className="font-bold text-amber-900">Kekurangan Pelunasan:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-amber-700 text-xs">{formatCurrency(remaining)}</span>
                          {remaining > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  amount: String(remaining),
                                  type: "FULL_PAYMENT",
                                  title: `Pelunasan Akhir Biaya Paket Umroh - ${selPilgrim.name}`,
                                })
                              }
                              className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 shadow-2xs"
                            >
                              Pakai Sisa
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Jenis Tagihan</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  >
                    <option value="DP">Uang Muka (DP)</option>
                    <option value="INSTALLMENT">Cicilan Bertahap</option>
                    <option value="FULL_PAYMENT">Pelunasan Akhir</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">
                    {formData.isMultiPilgrim ? "Total Nominal Disetor / Dibayarkan (Rp) *" : "Nominal Tagihan (Rp) *"}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 10000000"
                    value={formData.amount}
                    onChange={(e) => {
                      const newTotal = e.target.value;
                      setFormData({ ...formData, amount: newTotal });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold text-emerald-800 text-sm"
                  />
                </div>
              </div>

              {/* KOLOM PEMBAGIAN ALOKASI PEMBAYARAN PER JAMAAH (MULTI-JAMAAH) */}
              {formData.isMultiPilgrim && formData.selectedPilgrimIds.length > 0 && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        Pembagian Alokasi Pembayaran Per Jamaah Terpilih
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Atur berapa porsi nominal yang dibayarkan untuk masing-masing jamaah dari total {formatCurrency(parseFloat(formData.amount || "0"))}.
                      </p>
                    </div>

                    {/* Tombol Distribusi Cepat */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const total = parseFloat(formData.amount || "0");
                          const sel = pilgrims.filter((p) => formData.selectedPilgrimIds.includes(p.id));
                          if (sel.length === 0 || total <= 0) return;
                          const perPerson = Math.floor(total / sel.length);
                          const remainder = total - (perPerson * sel.length);
                          const newAlloc: Record<string, string> = {};
                          sel.forEach((p, idx) => {
                            newAlloc[p.id] = String(perPerson + (idx === 0 ? remainder : 0));
                          });
                          setFormData({ ...formData, allocations: newAlloc });
                        }}
                        className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px] hover:bg-emerald-200"
                        title="Bagi rata nominal total ke semua jamaah terpilih"
                      >
                        ⚖️ Bagi Rata
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          let pool = parseFloat(formData.amount || "0");
                          const sel = pilgrims.filter((p) => formData.selectedPilgrimIds.includes(p.id));
                          const newAlloc: Record<string, string> = {};
                          sel.forEach((p) => {
                            const fin = getPilgrimFinancials(p);
                            const allocate = Math.min(pool, fin.remaining);
                            newAlloc[p.id] = String(allocate);
                            pool -= allocate;
                          });
                          setFormData({ ...formData, allocations: newAlloc });
                        }}
                        className="px-2 py-1 rounded-lg bg-blue-100 text-blue-900 border border-blue-300 font-bold text-[10px] hover:bg-blue-200"
                        title="Alokasikan penuh sesuai sisa kekurangan urut dari jamaah pertama"
                      >
                        🎯 Prioritas Sisa
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, allocations: {} });
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold text-[10px] hover:bg-slate-300"
                      >
                        🔄 Reset
                      </button>
                    </div>
                  </div>

                  {/* List Item Input Alokasi Per Jamaah */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {pilgrims
                      .filter((p) => formData.selectedPilgrimIds.includes(p.id))
                      .map((p) => {
                        const fin = getPilgrimFinancials(p);
                        const currentAlloc = formData.allocations[p.id] !== undefined ? formData.allocations[p.id] : "";

                        return (
                          <div
                            key={p.id}
                            className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 truncate">{p.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                <span>Kamar: <strong className="text-slate-700">{p.roomType || "QUAD"}</strong></span>
                                <span>•</span>
                                <span>Sisa Hutang: <strong className="text-amber-700 font-mono">{formatCurrency(fin.remaining)}</strong></span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 sm:w-64">
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">Rp</span>
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={currentAlloc}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updated = { ...formData.allocations, [p.id]: val };
                                    setFormData({ ...formData, allocations: updated });
                                  }}
                                  className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = { ...formData.allocations, [p.id]: String(fin.remaining) };
                                  setFormData({ ...formData, allocations: updated });
                                }}
                                className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-600 text-[10px] font-bold border border-slate-200 flex-shrink-0"
                                title="Isi dengan sisa hutang jamaah ini"
                              >
                                Sisa
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Allocation Balance Live Validation Bar */}
                  {(() => {
                    const selList = pilgrims.filter((p) => formData.selectedPilgrimIds.includes(p.id));
                    const totalAllocated = selList.reduce((sum, p) => {
                      const val = parseFloat(formData.allocations[p.id] || "0");
                      return sum + (isNaN(val) ? 0 : val);
                    }, 0);
                    const targetTotal = parseFloat(formData.amount || "0") || 0;
                    const diff = targetTotal - totalAllocated;

                    return (
                      <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600">Total Terbagi: <strong className="font-mono font-bold text-slate-900">{formatCurrency(totalAllocated)}</strong></span>
                          <span>/</span>
                          <span className="text-slate-600">Disetor: <strong className="font-mono font-bold text-emerald-700">{formatCurrency(targetTotal)}</strong></span>
                        </div>

                        <div>
                          {Math.abs(diff) < 1 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Alokasi Pas 100%
                            </span>
                          ) : diff > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                                ⚠️ Sisa Belum Terbagi: {formatCurrency(diff)}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
                                ⛔ Kelebihan: {formatCurrency(Math.abs(diff))}
                              </span>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, amount: String(totalAllocated) })}
                                className="text-[10px] underline text-blue-700 font-bold hover:text-blue-900"
                              >
                                Sesuaikan Total
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700">Judul Tagihan *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pelunasan Biaya Paket Ramadhan Kamar Double"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Tanggal Jatuh Tempo *</label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Batas pelunasan 14 hari sebelum keberangkatan untuk penerbitan tiket & visa..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  {loading ? "Menerbitkan..." : "Terbitkan Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Konfirmasi Pembayaran Masuk */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Catat Pembayaran Masuk
              </h3>
              <button
                onClick={() => setIsInvoicePaymentModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs space-y-1">
              <p className="text-slate-500">Invoice: <strong className="text-slate-800">{selectedInvoiceForPayment.invoiceNumber}</strong></p>
              <p className="text-slate-500">Jamaah: <strong className="text-slate-800">{selectedInvoiceForPayment.pilgrim?.name}</strong></p>
              <p className="text-slate-500">Nominal: <strong className="text-emerald-700 text-sm font-black">{formatCurrency(selectedInvoiceForPayment.amount)}</strong></p>
            </div>

            <form onSubmit={handlePayInvoice} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Metode Pembayaran</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                >
                  <option value="BANK_TRANSFER">Transfer Bank (BSI / BCA / Mandiri)</option>
                  <option value="CASH">Tunai di Kantor Travel</option>
                  <option value="QRIS">QRIS / EDC</option>
                </select>
              </div>

              {/* Pihak Penyetor / Donatur / Hamba Allah */}
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
                <label className="font-bold text-slate-800 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  Nama Penyetor / Pembayar (Tercantum di Kwitansi)
                </label>
                <div className="flex gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPaymentData({ ...paymentData, payerName: selectedInvoiceForPayment.pilgrim?.name || "" })}
                    className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Sesuai Jamaah
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentData({ ...paymentData, payerName: "Hamba Allah" })}
                    className="px-2 py-0.5 rounded-lg bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-900 hover:bg-amber-200"
                  >
                    ✨ Hamba Allah
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentData({ ...paymentData, payerName: "Keluarga / Suami" })}
                    className="px-2 py-0.5 rounded-lg bg-blue-100 border border-blue-300 text-[10px] font-bold text-blue-900 hover:bg-blue-200"
                  >
                    👨‍👩‍👧 Keluarga / Suami
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentData({ ...paymentData, payerName: "Donatur / Sponsor Perusahaan" })}
                    className="px-2 py-0.5 rounded-lg bg-purple-100 border border-purple-300 text-[10px] font-bold text-purple-900 hover:bg-purple-200"
                  >
                    🏢 Sponsor
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Nama Penyetor (e.g. Hamba Allah / Bambang Sulistyo)"
                  value={paymentData.payerName}
                  onChange={(e) => setPaymentData({ ...paymentData, payerName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2 bg-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Tanggal Pembayaran Diterima</label>
                <input
                  type="date"
                  value={paymentData.paymentDate}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Catatan / Referensi Transfer</label>
                <input
                  type="text"
                  placeholder="e.g. Rekening BCA a.n Bambang Sulistyo"
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInvoicePaymentModal(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  {loading ? "Menyimpan..." : "Simpan Pembayaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Kwitansi Resmi Siap Cetak (Printable Receipt) */}
      {selectedInvoiceForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 no-print">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Dokumen Resmi Kwitansi
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReceipt}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  <Printer className="w-4 h-4" /> Cetak Kwitansi
                </button>
                <button
                  onClick={() => setSelectedInvoiceForReceipt(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Template */}
            <div className="border border-slate-300 p-8 rounded-2xl bg-white text-slate-900 relative space-y-4">
              {/* Header Travel */}
              <div className="flex items-center justify-between gap-4 pb-1">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 flex-shrink-0 flex items-center justify-center p-0.5">
                    <img
                      src="/sulthan-haramain-logo.jpg"
                      alt="Logo Sulthan Haramain"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
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
                <div className="text-right flex-shrink-0">
                  <span className="inline-block bg-slate-900 text-white font-bold text-xs px-3 py-1 rounded">
                    KWITANSI PEMBAYARAN
                  </span>
                  <p className="font-mono text-xs font-bold text-amber-900 mt-1">
                    No: KW-{selectedInvoiceForReceipt.invoiceNumber}
                  </p>
                </div>
              </div>

              {/* Geometric Header Divider */}
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

              {/* Receipt Body */}
              <div className="py-5 space-y-3.5 text-xs">
                <div className="flex items-start">
                  <span className="w-36 text-slate-500 font-semibold pt-0.5">Telah Terima Dari:</span>
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedInvoiceForReceipt.payerName || selectedInvoiceForReceipt.pilgrim?.name}
                    </span>
                    {selectedInvoiceForReceipt.payerName && selectedInvoiceForReceipt.payerName.toLowerCase().includes("hamba allah") && (
                      <span className="ml-2 inline-block bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-300">
                        ✨ Donatur Hamba Allah
                      </span>
                    )}
                    {selectedInvoiceForReceipt.payerName && !selectedInvoiceForReceipt.payerName.toLowerCase().includes("hamba allah") && selectedInvoiceForReceipt.payerName !== selectedInvoiceForReceipt.pilgrim?.name && (
                      <span className="ml-2 inline-block bg-blue-100 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-200">
                        Penyetor / Donatur
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <span className="w-36 text-slate-500 font-semibold pt-1">Uang Sejumlah:</span>
                  <span className="flex-1 font-bold text-slate-900 bg-emerald-50/90 p-2.5 rounded-xl border border-emerald-200 text-xs sm:text-sm leading-relaxed">
                    "{formatRupiahWithWords(selectedInvoiceForReceipt.amount)}"
                  </span>
                </div>

                <div className="flex">
                  <span className="w-36 text-slate-500 font-semibold">Untuk Pembayaran:</span>
                  <span className="flex-1 text-slate-800">
                    {selectedInvoiceForReceipt.title}
                    {selectedInvoiceForReceipt.pilgrim && (
                      <span className="font-semibold text-emerald-950"> — Jamaah: {selectedInvoiceForReceipt.pilgrim.name} ({selectedInvoiceForReceipt.pilgrim.package?.name || "Program Umroh"})</span>
                    )}
                  </span>
                </div>

                {/* Keterangan Potongan Harga / Diskon Promo Resmi */}
                {(selectedInvoiceForReceipt.notes?.toLowerCase().includes("promo") || selectedInvoiceForReceipt.notes?.toLowerCase().includes("diskon") || selectedInvoiceForReceipt.title?.toLowerCase().includes("promo")) && (
                  <div className="flex items-start">
                    <span className="w-36 text-slate-500 font-semibold pt-1">Keterangan Diskon:</span>
                    <div className="flex-1 bg-amber-50 p-2.5 rounded-xl border border-amber-300 text-xs space-y-1">
                      <p className="font-bold text-amber-950 flex items-center gap-1">
                        🏷️ {selectedInvoiceForReceipt.notes || "Program Promo Spesial Keberangkatan September 2026 - Diskon Tunai Rp 4.000.000,-"}
                      </p>
                      <p className="text-[10px] text-slate-600">
                        Potongan harga resmi telah diperhitungkan secara sah dalam total nilai tagihan / pelunasan kuitansi ini.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex">
                  <span className="w-36 text-slate-500 font-semibold">Metode & Tanggal:</span>
                  <span className="flex-1 text-slate-800">
                    {selectedInvoiceForReceipt.paymentMethod} • {formatDate(selectedInvoiceForReceipt.paymentDate, "dd MMMM yyyy")}
                  </span>
                </div>
              </div>

              {/* Signature Footer */}
              <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
                <div className="text-[11px] text-slate-500">
                  <p className="font-bold text-emerald-800">STATUS: LUNAS / SAH</p>
                  <p>Dicetak otomatis via Sistem ERP Umroh</p>
                </div>

                <div className="text-center w-48">
                  <p className="text-xs text-slate-600">Tebing Tinggi, {formatDate(selectedInvoiceForReceipt.paymentDate || new Date(), "dd MMMM yyyy")}</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">Bagian Keuangan / Pimpinan,</p>
                  <div className="h-14 flex items-center justify-center">
                    <span className="font-serif italic text-xs text-emerald-700 font-bold border-b border-emerald-400 pb-0.5">
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
