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
  Calculator,
  Wallet,
  Coins,
  Receipt,
  ArrowRight,
  Pencil,
  Trash2,
  Tag,
  Percent,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusBadge, generateWhatsAppReminderUrl, formatRupiahWithWords } from "@/lib/utils";
import Pagination from "@/components/common/Pagination";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<any | null>(null);
  const [multiReceiptInvoices, setMultiReceiptInvoices] = useState<any[] | null>(null);
  const [receiptViewMode, setReceiptViewMode] = useState<"GROUP" | "INDIVIDUAL">("GROUP");
  const [selectedIndividualIndex, setSelectedIndividualIndex] = useState<number>(0);
  const [printAllIndividual, setPrintAllIndividual] = useState<boolean>(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any | null>(null);
  const [selectedInvoiceForEdit, setSelectedInvoiceForEdit] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    pilgrimId: "",
    type: "INSTALLMENT",
    title: "",
    amount: "",
    dueDate: new Date().toISOString().split("T")[0],
    status: "PAID",
    paymentMethod: "BANK_TRANSFER",
    paymentDate: new Date().toISOString().split("T")[0],
    payerName: "",
    payerPhone: "",
    notes: "",
    discountAmount: "",
    discountReason: "",
    hasDiscount: false,
  });
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
    dueDate: new Date().toISOString().split("T")[0],
    payerName: "",
    payerPhone: "",
    notes: "",
    isDirectPayment: true,
    paymentMethod: "BANK_TRANSFER",
    paymentDate: new Date().toISOString().split("T")[0],
    discountAmount: "",
    discountReason: "",
    hasDiscount: false,
  });

  const [paymentData, setPaymentData] = useState({
    paymentMethod: "BANK_TRANSFER",
    paymentDate: new Date().toISOString().split("T")[0],
    payerName: "",
    payerPhone: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  interface PilgrimFinancials {
    grossPrice: number;
    discountAmount: number;
    discountReason: string;
    netPrice: number;
    pkgPrice: number;
    totalPaid: number;
    remaining: number;
    paidInvoicesCount: number;
    isDiscounted: boolean;
  }

  // Financial calculations helper for single or multi-pilgrim with discount support
  const getPilgrimFinancials = (p: any, customDiscount?: number): PilgrimFinancials => {
    if (!p) {
      return {
        grossPrice: 0,
        discountAmount: 0,
        discountReason: "",
        netPrice: 0,
        pkgPrice: 0,
        totalPaid: 0,
        remaining: 0,
        paidInvoicesCount: 0,
        isDiscounted: false,
      };
    }
    let grossPrice = p.package ? (p.package.priceQuad || 0) : 0;
    if (p.roomType === "TRIPLE" && p.package?.priceTriple) grossPrice = p.package.priceTriple;
    if (p.roomType === "DOUBLE" && p.package?.priceDouble) grossPrice = p.package.priceDouble;

    const discountAmount = customDiscount !== undefined ? customDiscount : (p.discountAmount || 0);
    const discountReason = p.discountReason || "";
    const netPrice = Math.max(0, grossPrice - discountAmount);

    const pilgrimInvoices = p.invoices && p.invoices.length > 0 ? p.invoices : invoices.filter((inv: any) => inv.pilgrimId === p.id);
    const paidInvoices = pilgrimInvoices.filter((inv: any) => inv.status === "PAID");
    const totalPaid = paidInvoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
    const remaining = Math.max(0, netPrice - totalPaid);
    return {
      grossPrice,
      discountAmount,
      discountReason,
      netPrice,
      pkgPrice: netPrice, // backward compatibility
      totalPaid,
      remaining,
      paidInvoicesCount: paidInvoices.length,
      isDiscounted: discountAmount > 0,
    };
  };

  // Detailed breakdown helper for a specific invoice and pilgrim with discount support
  const getInvoiceBreakdown = (inv: any) => {
    if (!inv) return null;
    const pilgrim = pilgrims.find((p) => p.id === inv.pilgrimId) || inv.pilgrim;
    if (!pilgrim) return null;

    let grossPrice = pilgrim.package ? (pilgrim.package.priceQuad || 0) : 0;
    if (pilgrim.roomType === "TRIPLE" && pilgrim.package?.priceTriple) grossPrice = pilgrim.package.priceTriple;
    if (pilgrim.roomType === "DOUBLE" && pilgrim.package?.priceDouble) grossPrice = pilgrim.package.priceDouble;

    const discountAmount = inv.discountAmount !== undefined && inv.discountAmount !== null && inv.discountAmount > 0
      ? inv.discountAmount
      : (pilgrim.discountAmount || 0);
    const discountReason = inv.discountReason || pilgrim.discountReason || "";
    const netPrice = Math.max(0, grossPrice - discountAmount);

    const pInvoices = pilgrim.invoices && pilgrim.invoices.length > 0 ? pilgrim.invoices : invoices.filter((i: any) => i.pilgrimId === pilgrim.id);
    const allPaidInvoices = pInvoices.filter((i: any) => i.status === "PAID");
    const totalPaidAll = allPaidInvoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);

    if (inv.status === "PAID") {
      const isIncluded = allPaidInvoices.some((i: any) => i.id === inv.id);
      const priorPaid = isIncluded ? Math.max(0, totalPaidAll - inv.amount) : totalPaidAll;
      const totalAfterThis = priorPaid + inv.amount;
      const finalRemaining = Math.max(0, netPrice - totalAfterThis);
      return {
        grossPrice,
        discountAmount,
        discountReason,
        netPrice,
        pkgPrice: netPrice,
        priorPaid,
        currentAmount: inv.amount,
        totalAfterThis,
        finalRemaining,
        isFullySettled: finalRemaining === 0 && netPrice > 0,
        progressPercent: netPrice > 0 ? Math.min(100, Math.round((totalAfterThis / netPrice) * 100)) : 100,
        isDiscounted: discountAmount > 0,
      };
    } else {
      const priorPaid = totalPaidAll;
      const totalAfterThis = priorPaid + inv.amount;
      const finalRemaining = Math.max(0, netPrice - totalAfterThis);
      return {
        grossPrice,
        discountAmount,
        discountReason,
        netPrice,
        pkgPrice: netPrice,
        priorPaid,
        currentAmount: inv.amount,
        totalAfterThis,
        finalRemaining,
        isFullySettled: finalRemaining === 0 && netPrice > 0,
        progressPercent: netPrice > 0 ? Math.min(100, Math.round((priorPaid / netPrice) * 100)) : 0,
        isDiscounted: discountAmount > 0,
      };
    }
  };

  // Helper to find related invoices created in the same multi-payment or batch
  const findRelatedInvoices = (targetInv: any) => {
    if (!targetInv) return [];
    const targetTime = new Date(targetInv.createdAt || targetInv.paymentDate || new Date()).getTime();
    const related = invoices.filter((i) => {
      if (i.id === targetInv.id) return true;
      const iTime = new Date(i.createdAt || i.paymentDate || new Date()).getTime();
      const timeDiff = Math.abs(targetTime - iTime);
      const samePayer = targetInv.payerName && i.payerName && targetInv.payerName.trim().toLowerCase() === i.payerName.trim().toLowerCase();
      const sameStatus = targetInv.status === i.status;
      
      // Matched if same payer and same status created within 15 minutes of each other
      if (samePayer && sameStatus && timeDiff <= 15 * 60 * 1000) return true;
      return false;
    });
    return related.length > 0 ? related : [targetInv];
  };

  const openReceiptModal = (inv: any, customGroupInvoices?: any[]) => {
    const group = (customGroupInvoices && customGroupInvoices.length > 0) ? customGroupInvoices : findRelatedInvoices(inv);
    setMultiReceiptInvoices(group);
    setSelectedInvoiceForReceipt(inv);
    setReceiptViewMode(group.length > 1 ? "GROUP" : "INDIVIDUAL");
    const idx = group.findIndex((i: any) => i.id === inv.id);
    setSelectedIndividualIndex(idx >= 0 ? idx : 0);
    setPrintAllIndividual(false);
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

  // Reset page when search or filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedType]);

  // Paginated invoices
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let payload: any = {
        ...formData,
        discountAmount: formData.hasDiscount && formData.discountAmount ? parseFloat(formData.discountAmount) : 0,
        discountReason: formData.hasDiscount ? formData.discountReason : null,
        isPaid: formData.isDirectPayment,
        paymentMethod: formData.isDirectPayment ? formData.paymentMethod : undefined,
        paymentDate: formData.isDirectPayment ? formData.paymentDate : undefined,
      };

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
          ...payload,
          allocations: allocationsArray,
        };
      }

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setIsAddModalOpen(false);
        const createdInvList = data.invoices && Array.isArray(data.invoices) && data.invoices.length > 0
          ? data.invoices
          : (data.invoice ? [data.invoice] : (Array.isArray(data) ? data : [data]));
        const createdInv = createdInvList[0];

        // If direct payment is checked, immediately show printable Kwitansi!
        if (formData.isDirectPayment && createdInv) {
          openReceiptModal(createdInv, createdInvList);
        }

        setFormData({
          pilgrimId: pilgrims[0]?.id || "",
          isMultiPilgrim: false,
          selectedPilgrimIds: [],
          allocations: {},
          type: "INSTALLMENT",
          title: "Pelunasan Biaya Paket Umroh",
          amount: "",
          dueDate: new Date().toISOString().split("T")[0],
          payerName: "",
          payerPhone: "",
          notes: "",
          isDirectPayment: true,
          paymentMethod: "BANK_TRANSFER",
          paymentDate: new Date().toISOString().split("T")[0],
          discountAmount: "",
          discountReason: "",
          hasDiscount: false,
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
        const updatedInvoice = await res.json();
        setIsInvoicePaymentModal(false);
        setSelectedInvoiceForPayment(null);
        alert("Pembayaran berhasil dicatat!");
        onRefresh();
        // Immediately show printable Kwitansi!
        openReceiptModal(updatedInvoice);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForEdit) return;
    setLoading(true);
    try {
      const payload = {
        ...editFormData,
        discountAmount: editFormData.hasDiscount && editFormData.discountAmount ? parseFloat(editFormData.discountAmount) : 0,
        discountReason: editFormData.hasDiscount ? editFormData.discountReason : null,
      };
      const res = await fetch(`/api/invoices/${selectedInvoiceForEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("Data invoice berhasil diperbarui / dikoreksi!");
        setSelectedInvoiceForEdit(null);
        onRefresh();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal mengupdate invoice");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (id: string, invoiceNumber: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus invoice ${invoiceNumber}? Tindakan ini akan menghapus tagihan secara permanen.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert(`Invoice ${invoiceNumber} berhasil dihapus.`);
        onRefresh();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menghapus invoice");
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
    const discAmt = inv.discountAmount || inv.pilgrim?.discountAmount || 0;
    const discReason = inv.discountReason || inv.pilgrim?.discountReason || "";
    const url = generateWhatsAppReminderUrl({
      phone: inv.pilgrim?.phone || "",
      pilgrimName: inv.pilgrim?.name || "Jamaah",
      invoiceNumber: inv.invoiceNumber,
      title: inv.title,
      amount: inv.amount,
      dueDate: inv.dueDate,
      discountAmount: discAmt,
      discountReason: discReason,
      companyName: travelSettings.companyName,
      bankBSI: travelSettings.bankBSI,
      bankBCA: travelSettings.bankBCA,
      bankMandiri: travelSettings.bankMandiri,
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
                paginatedInvoices.map((inv) => {
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
                        {(() => {
                          const pFin = inv.pilgrim ? getPilgrimFinancials(inv.pilgrim) : null;
                          if (!pFin || pFin.pkgPrice === 0) return null;
                          return (
                            <div className="flex items-center gap-1 mt-0.5">
                              {pFin.remaining === 0 ? (
                                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                                  ✨ Lunas Penuh
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                                  Sisa Paket: {formatCurrency(pFin.remaining)}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-black text-slate-900 text-sm">{formatCurrency(inv.amount)}</p>
                          {(() => {
                            const discAmt = inv.discountAmount || inv.pilgrim?.discountAmount || 0;
                            const discReason = inv.discountReason || inv.pilgrim?.discountReason || "";
                            if (discAmt > 0) {
                              return (
                                <span
                                  className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded uppercase"
                                  title={discReason ? `Diskon Khusus: ${discReason} (${formatCurrency(discAmt)})` : `Diskon: ${formatCurrency(discAmt)}`}
                                >
                                  🏷️ Diskon {formatCurrency(discAmt)}
                                </span>
                              );
                            }
                            return null;
                          })()}
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
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Follow-up WA Reminder */}
                          {!isPaid && (
                            <button
                              onClick={() => handleSendWhatsApp(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                              title="Kirim Tagihan via WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              WA Tagihan
                            </button>
                          )}

                          {/* Print Invoice / Tagihan (Pending) */}
                          {!isPaid && (
                            <button
                              onClick={() => openReceiptModal(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                              title="Cetak Surat Tagihan / Invoice"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                              Tagihan
                            </button>
                          )}

                          {/* Record Payment */}
                          {!isPaid ? (
                            <button
                              onClick={() => setSelectedInvoiceForPayment(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                              title="Konfirmasi Pembayaran Diterima"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Bayar
                            </button>
                          ) : (
                            <button
                              onClick={() => openReceiptModal(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                              title="Cetak Kwitansi Pembayaran Sah"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-600" />
                              Kwitansi
                            </button>
                          )}

                          {/* Edit / Koreksi Data Invoice */}
                          <button
                            onClick={() => {
                              const invDisc = (inv.discountAmount !== undefined && inv.discountAmount !== null && inv.discountAmount > 0)
                                ? inv.discountAmount
                                : (inv.pilgrim?.discountAmount || 0);
                              const invReason = inv.discountReason || inv.pilgrim?.discountReason || "";
                              setSelectedInvoiceForEdit(inv);
                              setEditFormData({
                                pilgrimId: inv.pilgrimId,
                                type: inv.type,
                                title: inv.title,
                                amount: String(inv.amount),
                                dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                                status: inv.status,
                                paymentMethod: inv.paymentMethod || "BANK_TRANSFER",
                                paymentDate: inv.paymentDate ? new Date(inv.paymentDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                                payerName: inv.payerName || "",
                                payerPhone: inv.payerPhone || "",
                                notes: inv.notes || "",
                                hasDiscount: invDisc > 0,
                                discountAmount: invDisc > 0 ? String(invDisc) : "",
                                discountReason: invReason,
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-colors cursor-pointer"
                            title="Koreksi / Edit Data Tagihan & Pembayaran"
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-700" />
                            Edit
                          </button>

                          {/* Hapus Invoice */}
                          <button
                            onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                            title="Hapus Invoice / Tagihan"
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
        <Pagination
          currentPage={currentPage}
          totalItems={filteredInvoices.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          itemLabel="invoice"
        />
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
                      const pDisc = sel?.discountAmount || 0;
                      const pReason = sel?.discountReason || "";
                      setFormData({
                        ...formData,
                        pilgrimId: pId,
                        payerName: formData.payerName === "Hamba Allah" ? "Hamba Allah" : (sel?.name || ""),
                        hasDiscount: pDisc > 0,
                        discountAmount: pDisc > 0 ? String(pDisc) : formData.discountAmount,
                        discountReason: pReason || formData.discountReason,
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

              {/* Box Opsi Potongan Harga / Diskon Khusus */}
              <div className="p-3 bg-amber-50/70 border border-amber-300/80 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.hasDiscount}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData({
                          ...formData,
                          hasDiscount: checked,
                          discountAmount: checked ? (formData.discountAmount || "4000000") : "",
                          discountReason: checked ? (formData.discountReason || "Promo Spesial Keberangkatan") : "",
                        });
                      }}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-700" />
                      Berikan Potongan Harga / Diskon Khusus Jamaah
                    </span>
                  </label>
                  {formData.hasDiscount && (
                    <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                      Diskon Aktif
                    </span>
                  )}
                </div>

                {formData.hasDiscount && (
                  <div className="space-y-2 pt-1 border-t border-amber-200">
                    {/* Preset Chips */}
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block mb-1">Pilihan Cepat Diskon Promo:</span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, discountAmount: "4000000", discountReason: "Promo Spesial Keberangkatan" })}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            formData.discountAmount === "4000000"
                              ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                              : "bg-white text-slate-700 border-amber-200 hover:bg-amber-100"
                          }`}
                        >
                          🔥 Promo Rp 4 Jt
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, discountAmount: "3000000", discountReason: "Diskon Khusus Tokoh / Ustadz" })}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            formData.discountAmount === "3000000"
                              ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                              : "bg-white text-slate-700 border-amber-200 hover:bg-amber-100"
                          }`}
                        >
                          👳 Tokoh / Ustadz Rp 3 Jt
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, discountAmount: "2000000", discountReason: "Diskon Keluarga / Mitra" })}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            formData.discountAmount === "2000000"
                              ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                              : "bg-white text-slate-700 border-amber-200 hover:bg-amber-100"
                          }`}
                        >
                          👨‍👩‍👧 Keluarga Rp 2 Jt
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, discountAmount: "1000000", discountReason: "Early Bird / Booking Awal" })}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            formData.discountAmount === "1000000"
                              ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                              : "bg-white text-slate-700 border-amber-200 hover:bg-amber-100"
                          }`}
                        >
                          ⚡ Early Bird Rp 1 Jt
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Nominal Potongan Diskon (Rp) *</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                          <input
                            type="number"
                            placeholder="4000000"
                            value={formData.discountAmount}
                            onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                            className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-amber-300 font-bold text-amber-900 bg-white text-xs focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Keterangan / Alasan Diskon *</label>
                        <input
                          type="text"
                          placeholder="e.g. Promo Spesial Keberangkatan"
                          value={formData.discountReason}
                          onChange={(e) => setFormData({ ...formData, discountReason: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 font-medium text-slate-800 bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

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

              {/* Smart Financial Indicator Box (Supports Single & Multi-Jamaah Aggregation with Discount Support) */}
              {(() => {
                if (formData.isMultiPilgrim) {
                  const selPilgrims = pilgrims.filter((p) => formData.selectedPilgrimIds.includes(p.id));
                  if (selPilgrims.length === 0) return null;

                  let totalGrossPrice = 0;
                  let totalProfileDiscount = 0;
                  let totalPaid = 0;

                  selPilgrims.forEach((p) => {
                    let gross = p.package ? (p.package.priceQuad || 0) : 0;
                    if (p.roomType === "TRIPLE" && p.package?.priceTriple) gross = p.package.priceTriple;
                    if (p.roomType === "DOUBLE" && p.package?.priceDouble) gross = p.package.priceDouble;
                    totalGrossPrice += gross;
                    totalProfileDiscount += (p.discountAmount || 0);

                    const pilgrimInvoices = p.invoices && p.invoices.length > 0 ? p.invoices : invoices.filter((inv: any) => inv.pilgrimId === p.id);
                    const paidInvoices = pilgrimInvoices.filter((inv: any) => inv.status === "PAID");
                    totalPaid += paidInvoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
                  });

                  // Effective discount: If form discount is toggled on, use the form input; otherwise sum profile discounts
                  const formDiscount = formData.hasDiscount && formData.discountAmount ? (parseFloat(formData.discountAmount) || 0) : 0;
                  const totalDiscount = formData.hasDiscount ? formDiscount : totalProfileDiscount;
                  const totalNetPrice = Math.max(0, totalGrossPrice - totalDiscount);
                  const totalRemaining = Math.max(0, totalNetPrice - totalPaid);

                  const currentTotalInput = parseFloat(formData.amount || "0") || 0;
                  const projectedTotalRemaining = Math.max(0, totalRemaining - currentTotalInput);

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
                      <div className={`grid gap-2 text-[11px] ${totalDiscount > 0 ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-3"}`}>
                        <div className="p-2 bg-white rounded-xl border border-amber-200">
                          <span className="text-slate-600 block text-[10px]">Total Normal:</span>
                          <span className="font-mono font-bold text-slate-900 text-xs">{formatCurrency(totalGrossPrice)}</span>
                        </div>
                        {totalDiscount > 0 && (
                          <div className="p-2 bg-amber-100/70 rounded-xl border border-amber-300">
                            <span className="text-amber-900 block text-[10px] font-bold">Diskon Khusus:</span>
                            <span className="font-mono font-bold text-amber-800 text-xs">- {formatCurrency(totalDiscount)}</span>
                          </div>
                        )}
                        {totalDiscount > 0 && (
                          <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-300">
                            <span className="text-emerald-900 block text-[10px] font-bold">Kewajiban Bersih:</span>
                            <span className="font-mono font-bold text-emerald-800 text-xs">{formatCurrency(totalNetPrice)}</span>
                          </div>
                        )}
                        <div className="p-2 bg-white rounded-xl border border-amber-200">
                          <span className="text-slate-600 block text-[10px]">Total Terbayar:</span>
                          <span className="font-mono font-bold text-emerald-700 text-xs">{formatCurrency(totalPaid)}</span>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-amber-200">
                          <span className="text-slate-600 block text-[10px]">Sisa Pelunasan:</span>
                          <span className="font-mono font-bold text-amber-800 text-xs">{formatCurrency(totalRemaining)}</span>
                        </div>
                      </div>

                      {/* Live Dynamic Simulation Banner for Multi-Jamaah */}
                      {currentTotalInput > 0 && (
                        <div className="p-2.5 bg-white rounded-xl border border-amber-300 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-semibold">Total Nominal Yang Disetor:</span>
                            <span className="font-mono font-bold text-emerald-700">{formatCurrency(currentTotalInput)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                            <span className="font-black text-amber-950">Sisa Tagihan Setelah Pembayaran Ini:</span>
                            <span className="font-mono font-black text-amber-700 text-sm">{formatCurrency(projectedTotalRemaining)}</span>
                          </div>
                          {currentTotalInput === totalRemaining && totalRemaining > 0 && (
                            <p className="text-[10px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                              🎉 Pembayaran ini akan melunasi seluruh kewajiban bersih ke-{selPilgrims.length} jamaah terpilih!
                            </p>
                          )}
                        </div>
                      )}

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
                              const perPilgrimDiscount = totalDiscount > 0 ? (totalDiscount / selPilgrims.length) : 0;
                              selPilgrims.forEach((p) => {
                                const fin = getPilgrimFinancials(p, perPilgrimDiscount);
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

                  const customDisc = formData.hasDiscount && formData.discountAmount ? parseFloat(formData.discountAmount) : 0;
                  const { grossPrice, discountAmount, discountReason, netPrice, totalPaid, remaining } = getPilgrimFinancials(selPilgrim, customDisc);
                  const currentInputAmt = parseFloat(formData.amount || "0") || 0;
                  const projectedRemaining = Math.max(0, remaining - currentInputAmt);
                  const isExactSettle = currentInputAmt === remaining && remaining > 0;
                  const isOverpaid = currentInputAmt > remaining && remaining > 0;
                  const currentPercent = netPrice > 0 ? Math.min(100, Math.round(((totalPaid + currentInputAmt) / netPrice) * 100)) : 100;

                  return (
                    <div className="p-3.5 bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-emerald-200/80 rounded-2xl space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <Calculator className="w-4 h-4 text-emerald-600" />
                          Kalkulator Sisa Pembayaran ({selPilgrim.name})
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                          Kamar: {selPilgrim.roomType || "QUAD"}
                        </span>
                      </div>

                      {/* Breakdown Kartu Dinamis */}
                      <div className={`grid gap-2 text-[11px] ${discountAmount > 0 ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-3"}`}>
                        <div className="p-2 bg-white rounded-xl border border-slate-200">
                          <span className="text-slate-500 block text-[10px]">Harga Normal:</span>
                          <span className="font-mono font-bold text-slate-900 text-xs">{formatCurrency(grossPrice)}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="p-2 bg-amber-50 rounded-xl border border-amber-300">
                            <span className="text-amber-900 block text-[10px] font-bold">Diskon Khusus:</span>
                            <span className="font-mono font-bold text-amber-800 text-xs">- {formatCurrency(discountAmount)}</span>
                          </div>
                        )}
                        {discountAmount > 0 && (
                          <div className="p-2 bg-emerald-50/50 rounded-xl border border-emerald-200">
                            <span className="text-slate-600 block text-[10px]">Kewajiban Bersih:</span>
                            <span className="font-mono font-bold text-emerald-800 text-xs">{formatCurrency(netPrice)}</span>
                          </div>
                        )}
                        <div className="p-2 bg-white rounded-xl border border-slate-200">
                          <span className="text-slate-500 block text-[10px]">Sudah Terbayar:</span>
                          <span className="font-mono font-bold text-emerald-700 text-xs">{formatCurrency(totalPaid)}</span>
                        </div>
                        <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
                          <span className="text-amber-900 block text-[10px] font-bold">Sisa Kewajiban:</span>
                          <span className="font-mono font-black text-amber-700 text-xs">{formatCurrency(remaining)}</span>
                        </div>
                      </div>

                      {/* Live Dynamic Reaction */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-semibold flex items-center gap-1">
                            <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                            Nominal Tagihan Ini:
                          </span>
                          <span className="font-mono font-black text-emerald-700 text-sm">
                            {currentInputAmt > 0 ? formatCurrency(currentInputAmt) : "Rp 0 (Ketik nominal di bawah)"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                          <span className="font-black text-slate-900">
                            Estimasi Sisa Setelah Pembayaran Ini:
                          </span>
                          <span className={`font-mono font-black text-sm ${projectedRemaining === 0 && netPrice > 0 ? "text-emerald-700" : "text-amber-700"}`}>
                            {projectedRemaining === 0 && netPrice > 0 ? "🎉 LUNAS 100% (Rp 0)" : formatCurrency(projectedRemaining)}
                          </span>
                        </div>

                        {/* Progres Pelunasan */}
                        {netPrice > 0 && (
                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Progres Pelunasan Paket</span>
                              <span className="font-bold text-slate-700">{currentPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${currentPercent >= 100 ? "bg-emerald-500" : "bg-emerald-600"}`}
                                style={{ width: `${Math.min(100, currentPercent)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Informative Status Badges */}
                        {isExactSettle && (
                          <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            Tagihan ini akan MELUNASI 100% seluruh biaya paket jamaah!
                          </div>
                        )}
                        {isOverpaid && (
                          <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-300 text-[10px] font-bold text-amber-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            Nominal melebihi sisa kekurangan sebesar {formatCurrency(currentInputAmt - remaining)}
                          </div>
                        )}
                        {remaining === 0 && netPrice > 0 && (
                          <div className="p-1.5 rounded-lg bg-emerald-100 text-[10px] font-bold text-emerald-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            Jamaah ini sudah Lunas Penuh (100%).
                          </div>
                        )}
                      </div>

                      {/* Tombol Cepat (Quick Fill Actions) */}
                      {remaining > 0 && (
                        <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-500 font-semibold">Tombol Cepat:</span>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                amount: String(remaining),
                                type: "FULL_PAYMENT",
                                title: discountAmount > 0
                                  ? `Pelunasan Biaya Paket (${discountReason || "Diskon"}) - ${selPilgrim.name}`
                                  : `Pelunasan Akhir Biaya Paket Umroh - ${selPilgrim.name}`,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 shadow-2xs transition-all flex items-center gap-1"
                          >
                            🌟 Lunas Penuh ({formatCurrency(remaining)})
                          </button>
                          {remaining > 5000000 && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  amount: "5000000",
                                  type: totalPaid === 0 ? "DP" : "INSTALLMENT",
                                  title: totalPaid === 0 ? `Uang Muka (DP) Paket Umroh - ${selPilgrim.name}` : `Cicilan Tahap Biaya Paket Umroh - ${selPilgrim.name}`,
                                })
                              }
                              className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-[10px] hover:bg-slate-50"
                            >
                              ⚡ DP Rp 5 Jt
                            </button>
                          )}
                          {remaining > 10000000 && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  amount: "10000000",
                                  type: totalPaid === 0 ? "DP" : "INSTALLMENT",
                                  title: totalPaid === 0 ? `Uang Muka (DP) Paket Umroh - ${selPilgrim.name}` : `Cicilan Tahap Biaya Paket Umroh - ${selPilgrim.name}`,
                                })
                              }
                              className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-[10px] hover:bg-slate-50"
                            >
                              ⚡ DP Rp 10 Jt
                            </button>
                          )}
                          {remaining > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const half = Math.round(remaining / 2);
                                setFormData({
                                  ...formData,
                                  amount: String(half),
                                  type: "INSTALLMENT",
                                  title: `Cicilan 50% Sisa Biaya Paket Umroh - ${selPilgrim.name}`,
                                });
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[10px] hover:bg-slate-200"
                            >
                              ⚡ 50% Sisa ({formatCurrency(Math.round(remaining / 2))})
                            </button>
                          )}
                        </div>
                      )}
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
                          const formPerPilgrimDiscount = formData.hasDiscount && formData.discountAmount ? ((parseFloat(formData.discountAmount) || 0) / (sel.length || 1)) : undefined;
                          const newAlloc: Record<string, string> = {};
                          sel.forEach((p) => {
                            const fin = getPilgrimFinancials(p, formPerPilgrimDiscount);
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
                    {(() => {
                      const sel = pilgrims.filter((p) => formData.selectedPilgrimIds.includes(p.id));
                      const formPerPilgrimDiscount = formData.hasDiscount && formData.discountAmount ? ((parseFloat(formData.discountAmount) || 0) / (sel.length || 1)) : undefined;

                      return sel.map((p) => {
                        const fin = getPilgrimFinancials(p, formPerPilgrimDiscount);
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
                                <span>Kewajiban: <strong className="text-slate-700 font-mono">{formatCurrency(fin.netPrice)}</strong></span>
                                <span>•</span>
                                <span>Sisa: <strong className="text-amber-700 font-mono">{formatCurrency(fin.remaining)}</strong></span>
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
                      });
                    })()}
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

              {/* Opsi Langsung Terima Pembayaran & Cetak Kwitansi */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isDirectPayment}
                    onChange={(e) => setFormData({ ...formData, isDirectPayment: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="font-bold text-emerald-950 text-xs">
                    ✅ Langsung Tandai Lunas & Buka Kwitansi Sah
                  </span>
                </label>

                {formData.isDirectPayment && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">
                        Metode Pembayaran:
                      </label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white font-bold text-slate-900"
                      >
                        <option value="BANK_TRANSFER">🏦 Transfer Bank (Mandiri / BSI)</option>
                        <option value="CASH">💵 Tunai / Kas Kantor</option>
                        <option value="EDC">💳 Kartu Debit / EDC</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">
                        Tanggal Diterima:
                      </label>
                      <input
                        type="date"
                        value={formData.paymentDate}
                        onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white font-bold text-slate-900"
                      />
                    </div>
                  </div>
                )}
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md flex items-center gap-1.5"
                >
                  {loading ? "Memproses..." : (formData.isDirectPayment ? "Terbitkan & Buka Kwitansi" : "Terbitkan Invoice")}
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

      {/* Modal 3: Kwitansi Resmi Siap Cetak (Printable Receipt - Dual Mode: Single / Group) */}
      {selectedInvoiceForReceipt && (() => {
        const renderSingleReceiptContent = (inv: any, isBatchView: boolean = false) => {
          if (!inv) return null;
          const invPilgrim = inv.pilgrim || pilgrims.find((p) => p.id === inv.pilgrimId);
          const breakdown = getInvoiceBreakdown(inv);
          const isDisc = (breakdown && breakdown.isDiscounted) ||
            (inv.discountAmount && inv.discountAmount > 0) ||
            (inv.notes?.toLowerCase().includes("promo") || inv.notes?.toLowerCase().includes("diskon") || inv.title?.toLowerCase().includes("promo"));
          const discAmt = breakdown?.discountAmount || inv.discountAmount || 0;
          const discReason = breakdown?.discountReason || inv.discountReason || inv.notes || "Program Promo Spesial Diskon Khusus";

          return (
            <div className={`border border-slate-300 p-6 sm:p-8 rounded-2xl bg-white text-slate-900 relative space-y-4 ${isBatchView ? "print-sheet" : ""}`}>
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
                  <span className={`inline-block text-white font-bold text-xs px-3 py-1 rounded ${
                    inv.status === "PAID" ? "bg-slate-900" : "bg-amber-700"
                  }`}>
                    {inv.status === "PAID" ? "KWITANSI PEMBAYARAN" : "SURAT TAGIHAN (INVOICE)"}
                  </span>
                  <p className="font-mono text-xs font-bold text-amber-900 mt-1">
                    {inv.status === "PAID" ? `No: KW-${inv.invoiceNumber}` : `No: ${inv.invoiceNumber}`}
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

              {/* Receipt / Invoice Body */}
              <div className="py-4 space-y-3 text-xs">
                <div className="flex items-start">
                  <span className="w-36 text-slate-500 font-semibold pt-0.5">
                    {inv.status === "PAID" ? "Telah Terima Dari:" : "Ditagihkan Kepada:"}
                  </span>
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 text-sm">
                      {inv.payerName || invPilgrim?.name}
                    </span>
                    {inv.payerName && inv.payerName.toLowerCase().includes("hamba allah") && (
                      <span className="ml-2 inline-block bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-300">
                        ✨ Donatur Hamba Allah
                      </span>
                    )}
                    {inv.payerName && !inv.payerName.toLowerCase().includes("hamba allah") && inv.payerName !== invPilgrim?.name && (
                      <span className="ml-2 inline-block bg-blue-100 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-200">
                        Penyetor / Penanggung Jawab
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <span className="w-36 text-slate-500 font-semibold pt-1">
                    {inv.status === "PAID" ? "Uang Sejumlah:" : "Nominal Tagihan:"}
                  </span>
                  <span className="flex-1 font-bold text-slate-900 bg-emerald-50/90 p-2.5 rounded-xl border border-emerald-200 text-xs sm:text-sm leading-relaxed">
                    "{formatRupiahWithWords(inv.amount)}"
                  </span>
                </div>

                <div className="flex">
                  <span className="w-36 text-slate-500 font-semibold">
                    {inv.status === "PAID" ? "Untuk Pembayaran:" : "Peruntukan Tagihan:"}
                  </span>
                  <span className="flex-1 text-slate-800">
                    {inv.title}
                    {invPilgrim && (
                      <span className="font-semibold text-emerald-950"> — Jamaah: {invPilgrim.name} ({invPilgrim.package?.name || "Program Umroh"})</span>
                    )}
                  </span>
                </div>

                {/* Keterangan Potongan Harga / Diskon Promo Resmi */}
                {isDisc && (
                  <div className="flex items-start">
                    <span className="w-36 text-slate-500 font-semibold pt-1">Keterangan Diskon:</span>
                    <div className="flex-1 bg-amber-50 p-2.5 rounded-xl border border-amber-300 text-xs space-y-1">
                      <p className="font-bold text-amber-950 flex items-center gap-1">
                        🏷️ {discReason} ({formatCurrency(discAmt)})
                      </p>
                      <p className="text-[10px] text-slate-600">
                        Potongan harga khusus telah dikurangkan dari harga paket normal ({formatCurrency(breakdown?.grossPrice || 0)}) sehingga total kewajiban bersih menjadi {formatCurrency(breakdown?.netPrice || 0)}.
                      </p>
                    </div>
                  </div>
                )}

                {/* Rincian Akumulasi Finansial & Sisa Pembayaran Paket */}
                {breakdown && (breakdown.pkgPrice > 0 || breakdown.grossPrice > 0) && (
                  <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 pb-1.5 border-b border-slate-200">
                      <span className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                        Rincian Status Finansial & Sisa Pembayaran Paket
                      </span>
                      <span className="font-mono text-emerald-700 text-[10.5px]">
                        Progres Pelunasan: {breakdown.progressPercent}%
                      </span>
                    </div>

                    <div className={`grid gap-2 text-center ${breakdown.isDiscounted ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"}`}>
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[9.5px] text-slate-500 block uppercase font-semibold">Harga Normal</span>
                        <span className="font-mono font-black text-slate-900 text-xs">{formatCurrency(breakdown.grossPrice)}</span>
                      </div>
                      {breakdown.isDiscounted && (
                        <div className="p-2 bg-amber-50 rounded-xl border border-amber-300 shadow-2xs">
                          <span className="text-[9.5px] text-amber-900 block uppercase font-bold">Diskon Khusus</span>
                          <span className="font-mono font-bold text-amber-800 text-xs">- {formatCurrency(breakdown.discountAmount)}</span>
                        </div>
                      )}
                      <div className="p-2 bg-emerald-50/50 rounded-xl border border-emerald-200 shadow-2xs">
                        <span className="text-[9.5px] text-slate-600 block uppercase font-semibold">
                          {breakdown.isDiscounted ? "Kewajiban Bersih" : "Terbayar Sblmnya"}
                        </span>
                        <span className="font-mono font-black text-slate-700 text-xs">
                          {breakdown.isDiscounted ? formatCurrency(breakdown.netPrice) : formatCurrency(breakdown.priorPaid)}
                        </span>
                      </div>
                      {breakdown.isDiscounted && (
                        <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[9.5px] text-slate-500 block uppercase font-semibold">Terbayar Sblmnya</span>
                          <span className="font-mono font-black text-slate-700 text-xs">{formatCurrency(breakdown.priorPaid)}</span>
                        </div>
                      )}
                      <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-300 shadow-2xs">
                        <span className="text-[9.5px] text-emerald-900 block uppercase font-black">
                          {inv.status === "PAID" ? "Kwitansi Ini" : "Invoice Ini"}
                        </span>
                        <span className="font-mono font-black text-emerald-800 text-xs">{formatCurrency(breakdown.currentAmount)}</span>
                      </div>
                      <div className={`p-2 rounded-xl border shadow-2xs ${breakdown.finalRemaining === 0 ? "bg-emerald-100 border-emerald-400" : "bg-amber-50 border-amber-300"}`}>
                        <span className={`text-[9.5px] block uppercase font-black ${breakdown.finalRemaining === 0 ? "text-emerald-950" : "text-amber-950"}`}>
                          {breakdown.finalRemaining === 0 ? "Status Akhir" : "Sisa Tagihan"}
                        </span>
                        <span className={`font-mono font-black text-xs ${breakdown.finalRemaining === 0 ? "text-emerald-800" : "text-amber-800"}`}>
                          {breakdown.finalRemaining === 0 ? "✨ LUNAS (Rp 0)" : formatCurrency(breakdown.finalRemaining)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex">
                  <span className="w-36 text-slate-500 font-semibold">
                    {inv.status === "PAID" ? "Metode & Tanggal:" : "Jatuh Tempo:"}
                  </span>
                  <span className="flex-1 text-slate-800">
                    {inv.status === "PAID" ? (
                      <>{inv.paymentMethod || "TRANSFER BANK"} • {formatDate(inv.paymentDate, "dd MMMM yyyy")}</>
                    ) : (
                      <span className="font-bold text-amber-800">Wajib dilunasi sebelum: {formatDate(inv.dueDate, "dd MMMM yyyy")}</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Signature Footer */}
              <div className="pt-5 border-t border-slate-200 flex justify-between items-end">
                <div className="text-[11px] text-slate-500">
                  <p className={`font-bold ${inv.status === "PAID" ? "text-emerald-800" : "text-amber-800"}`}>
                    {inv.status === "PAID" ? "STATUS: LUNAS / SAH" : "STATUS: MENUNGGU PEMBAYARAN"}
                  </p>
                  <p>Dicetak otomatis via Sistem ERP Umroh</p>
                </div>

                <div className="text-center w-48">
                  <p className="text-xs text-slate-600">Tebing Tinggi, {formatDate(inv.paymentDate || inv.createdAt || new Date(), "dd MMMM yyyy")}</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">Bagian Keuangan / Pimpinan,</p>
                  <div className="h-12 flex items-center justify-center">
                    <span className="font-serif italic text-xs text-emerald-700 font-bold border-b border-emerald-400 pb-0.5">
                      [Tanda Tangan & Stempel Resmi]
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">{travelSettings.directorName || "ATIYATUL AMRA"}</p>
                  <p className="text-[10px] text-slate-400">{travelSettings.directorTitle || "Direktur Utama"}</p>
                </div>
              </div>
            </div>
          );
        };

        const renderGroupReceiptContent = (groupInvoices: any[]) => {
          if (!groupInvoices || groupInvoices.length === 0) return null;
          const firstInv = groupInvoices[0];
          const groupTotalAmount = groupInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
          const groupPayerName = firstInv.payerName || firstInv.pilgrim?.name || "Penanggung Jawab Rombongan";
          const groupPaymentMethod = firstInv.paymentMethod || "TRANSFER BANK";
          const groupPaymentDate = firstInv.paymentDate || firstInv.createdAt || new Date();
          const isAllPaid = groupInvoices.every((i) => i.status === "PAID");

          let groupGrossTotal = 0;
          let groupDiscountTotal = 0;
          let groupNetTotal = 0;
          let groupRemainingTotal = 0;

          const groupBreakdowns = groupInvoices.map((inv) => {
            const bd = getInvoiceBreakdown(inv);
            if (bd) {
              groupGrossTotal += bd.grossPrice;
              groupDiscountTotal += bd.discountAmount;
              groupNetTotal += bd.netPrice;
              groupRemainingTotal += bd.finalRemaining;
            }
            return { inv, bd };
          });

          return (
            <div className="border border-slate-300 p-6 sm:p-8 rounded-2xl bg-white text-slate-900 relative space-y-4 print-sheet">
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
                  <span className={`inline-block text-white font-bold text-xs px-3 py-1 rounded ${
                    isAllPaid ? "bg-slate-900" : "bg-amber-700"
                  }`}>
                    {isAllPaid ? "KWITANSI GABUNGAN ROMBONGAN" : "SURAT TAGIHAN GABUNGAN"}
                  </span>
                  <p className="font-mono text-xs font-bold text-amber-900 mt-1">
                    {isAllPaid ? `No: KW-GRP-${firstInv.invoiceNumber?.replace('INV-', '')}` : `No: ${firstInv.invoiceNumber}`}
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

              {/* Receipt / Invoice Body */}
              <div className="py-4 space-y-3 text-xs">
                <div className="flex items-start">
                  <span className="w-36 text-slate-500 font-semibold pt-0.5">
                    {isAllPaid ? "Telah Terima Dari:" : "Ditagihkan Kepada:"}
                  </span>
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 text-sm">
                      {groupPayerName}
                    </span>
                    <span className="ml-2 inline-block bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-300">
                      👨‍👩‍👧 Penanggung Jawab Rombongan ({groupInvoices.length} Jamaah)
                    </span>
                  </div>
                </div>

                <div className="flex items-start">
                  <span className="w-36 text-slate-500 font-semibold pt-1">
                    {isAllPaid ? "Uang Sejumlah:" : "Nominal Tagihan:"}
                  </span>
                  <span className="flex-1 font-bold text-slate-900 bg-emerald-50/90 p-2.5 rounded-xl border border-emerald-200 text-xs sm:text-sm leading-relaxed">
                    "{formatRupiahWithWords(groupTotalAmount)}"
                  </span>
                </div>

                <div className="flex">
                  <span className="w-36 text-slate-500 font-semibold">
                    {isAllPaid ? "Untuk Pembayaran:" : "Peruntukan Tagihan:"}
                  </span>
                  <span className="flex-1 text-slate-800 font-semibold">
                    {firstInv.title?.replace(/\s*\([^)]*\)/g, "") || "Pelunasan Biaya Paket Umroh"} — Rombongan ({groupInvoices.length} Jamaah)
                  </span>
                </div>

                {/* Rincian Tabel Jamaah Rombongan */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                    <span className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      Rincian Jamaah, Alokasi Setoran & Sisa Tagihan Rombongan
                    </span>
                    <span className="font-mono text-emerald-700 text-[10.5px]">
                      Total Jamaah: {groupInvoices.length} Orang
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-100/90 text-slate-800 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-2 text-center w-7">No</th>
                          <th className="py-2 px-2.5">Nama Jamaah</th>
                          <th className="py-2 px-2.5">Paket & Kamar</th>
                          <th className="py-2 px-2 text-right">Harga Normal</th>
                          <th className="py-2 px-2 text-right">Diskon</th>
                          <th className="py-2 px-2 text-right">Kewajiban</th>
                          <th className="py-2 px-2.5 text-right text-emerald-900 bg-emerald-50/80">Setoran Ini</th>
                          <th className="py-2 px-2.5 text-right">Sisa Tagihan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {groupBreakdowns.map(({ inv, bd }, idx) => {
                          const pilgrim = inv.pilgrim || pilgrims.find((p) => p.id === inv.pilgrimId);
                          const roomBadge = pilgrim?.roomType === "DOUBLE" ? "Double" : pilgrim?.roomType === "TRIPLE" ? "Triple" : "Quad";
                          return (
                            <tr key={inv.id || idx} className="hover:bg-slate-50/50">
                              <td className="py-2 px-2 text-center font-bold text-slate-600">{idx + 1}</td>
                              <td className="py-2 px-2.5 font-bold text-slate-900">
                                {pilgrim?.name || "Jamaah"}
                              </td>
                              <td className="py-2 px-2.5 text-slate-600">
                                <span className="font-medium text-slate-800">{pilgrim?.package?.name || "Paket Umroh"}</span>
                                <span className="text-[9.5px] text-slate-500 block">Kamar {roomBadge}</span>
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-slate-700">
                                {formatCurrency(bd?.grossPrice || 0)}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-amber-700">
                                {bd && bd.discountAmount > 0 ? `- ${formatCurrency(bd.discountAmount)}` : "-"}
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-semibold text-slate-900">
                                {formatCurrency(bd?.netPrice || 0)}
                              </td>
                              <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-800 bg-emerald-50/50">
                                {formatCurrency(inv.amount)}
                              </td>
                              <td className="py-2 px-2.5 text-right font-mono font-bold">
                                {bd && bd.finalRemaining === 0 ? (
                                  <span className="text-emerald-700 font-black">✨ LUNAS</span>
                                ) : (
                                  <span className="text-amber-800">{formatCurrency(bd?.finalRemaining || 0)}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-900">
                        <tr>
                          <td colSpan={3} className="py-2.5 px-2.5 text-right uppercase tracking-wider text-[10.5px]">
                            Total Rombongan:
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(groupGrossTotal)}</td>
                          <td className="py-2.5 px-2 text-right font-mono text-amber-800">
                            {groupDiscountTotal > 0 ? `- ${formatCurrency(groupDiscountTotal)}` : "-"}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(groupNetTotal)}</td>
                          <td className="py-2.5 px-2.5 text-right font-mono text-emerald-900 bg-emerald-100/70 text-xs">
                            {formatCurrency(groupTotalAmount)}
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-mono text-xs">
                            {groupRemainingTotal === 0 ? (
                              <span className="text-emerald-800 font-black">✨ SEMUA LUNAS</span>
                            ) : (
                              <span className="text-amber-900">{formatCurrency(groupRemainingTotal)}</span>
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="flex pt-1">
                  <span className="w-36 text-slate-500 font-semibold">
                    {isAllPaid ? "Metode & Tanggal:" : "Jatuh Tempo:"}
                  </span>
                  <span className="flex-1 text-slate-800">
                    {isAllPaid ? (
                      <>{groupPaymentMethod} • {formatDate(groupPaymentDate, "dd MMMM yyyy")}</>
                    ) : (
                      <span className="font-bold text-amber-800">Wajib dilunasi sebelum: {formatDate(firstInv.dueDate, "dd MMMM yyyy")}</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Signature Footer */}
              <div className="pt-5 border-t border-slate-200 flex justify-between items-end">
                <div className="text-[11px] text-slate-500">
                  <p className={`font-bold ${isAllPaid ? "text-emerald-800" : "text-amber-800"}`}>
                    {isAllPaid ? "STATUS: LUNAS / SAH" : "STATUS: MENUNGGU PEMBAYARAN"}
                  </p>
                  <p>Dicetak otomatis via Sistem ERP Umroh</p>
                </div>

                <div className="text-center w-48">
                  <p className="text-xs text-slate-600">Tebing Tinggi, {formatDate(groupPaymentDate, "dd MMMM yyyy")}</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">Bagian Keuangan / Pimpinan,</p>
                  <div className="h-12 flex items-center justify-center">
                    <span className="font-serif italic text-xs text-emerald-700 font-bold border-b border-emerald-400 pb-0.5">
                      [Tanda Tangan & Stempel Resmi]
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">{travelSettings.directorName || "ATIYATUL AMRA"}</p>
                  <p className="text-[10px] text-slate-400">{travelSettings.directorTitle || "Direktur Utama"}</p>
                </div>
              </div>
            </div>
          );
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[95vh] overflow-y-auto printable-modal-content">
              {/* Modal Header & Options Toolbar (no-print) */}
              <div className="space-y-3 pb-3 border-b border-slate-100 no-print">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Mode Switcher Tabs if multi */}
                  {multiReceiptInvoices && multiReceiptInvoices.length > 1 ? (
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptViewMode("GROUP");
                          setPrintAllIndividual(false);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          receiptViewMode === "GROUP"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        Kwitansi Gabungan ({multiReceiptInvoices.length} Jamaah)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptViewMode("INDIVIDUAL");
                          setPrintAllIndividual(false);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          receiptViewMode === "INDIVIDUAL"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        Kwitansi Per Jamaah (Satu per Satu)
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                      {selectedInvoiceForReceipt.status === "PAID" ? "Dokumen Resmi Kwitansi Pembayaran" : "Dokumen Resmi Surat Tagihan (Invoice)"}
                    </span>
                  )}

                  {/* Print Buttons & Close */}
                  <div className="flex items-center gap-2">
                    {receiptViewMode === "GROUP" && multiReceiptInvoices && multiReceiptInvoices.length > 1 ? (
                      <button
                        onClick={() => {
                          setPrintAllIndividual(false);
                          setTimeout(() => window.print(), 50);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                      >
                        <Printer className="w-4 h-4" /> Cetak Kwitansi Gabungan (1 Lembar)
                      </button>
                    ) : receiptViewMode === "INDIVIDUAL" && multiReceiptInvoices && multiReceiptInvoices.length > 1 ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setPrintAllIndividual(false);
                            setTimeout(() => window.print(), 50);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                          title="Cetak lembar kwitansi untuk jamaah yang sedang dipilih"
                        >
                          <Printer className="w-3.5 h-3.5" /> Cetak Jamaah Ini
                        </button>
                        <button
                          onClick={() => {
                            setPrintAllIndividual(true);
                            setTimeout(() => window.print(), 50);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-900 cursor-pointer"
                          title="Cetak semua kwitansi jamaah satu per satu dalam 1 kali perintah cetak"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" /> Cetak Semua ({multiReceiptInvoices.length} Lembar)
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setPrintAllIndividual(false);
                          setTimeout(() => window.print(), 50);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                      >
                        <Printer className="w-4 h-4" /> {selectedInvoiceForReceipt.status === "PAID" ? "Cetak Kwitansi (Print/PDF)" : "Cetak Invoice (Print/PDF)"}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedInvoiceForReceipt(null);
                        setMultiReceiptInvoices(null);
                        setPrintAllIndividual(false);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Sub-tabs for Pilgrim Selection in INDIVIDUAL mode */}
                {receiptViewMode === "INDIVIDUAL" && multiReceiptInvoices && multiReceiptInvoices.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
                    <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap mr-1">Pilih Jamaah:</span>
                    {multiReceiptInvoices.map((inv, idx) => {
                      const pilgrim = inv.pilgrim || pilgrims.find((p) => p.id === inv.pilgrimId);
                      const pName = pilgrim?.name || `Jamaah #${idx + 1}`;
                      const isActive = selectedIndividualIndex === idx;
                      return (
                        <button
                          key={inv.id || idx}
                          type="button"
                          onClick={() => {
                            setSelectedIndividualIndex(idx);
                            setSelectedInvoiceForReceipt(inv);
                            setPrintAllIndividual(false);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                            isActive
                              ? "bg-slate-900 text-amber-400 border border-slate-900 shadow-xs"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full bg-slate-200/50 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          {pName} ({formatCurrency(inv.amount)})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Document Body */}
              {receiptViewMode === "GROUP" && multiReceiptInvoices && multiReceiptInvoices.length > 1 ? (
                renderGroupReceiptContent(multiReceiptInvoices)
              ) : printAllIndividual && multiReceiptInvoices && multiReceiptInvoices.length > 1 ? (
                <div className="space-y-6">
                  {multiReceiptInvoices.map((inv, idx) => (
                    <div key={inv.id || idx} className={idx > 0 ? "page-break pt-4" : ""}>
                      {renderSingleReceiptContent(inv, true)}
                    </div>
                  ))}
                </div>
              ) : (
                renderSingleReceiptContent(selectedInvoiceForReceipt)
              )}
            </div>
          </div>
        );
      })()}

      {/* Modal 4: Form Koreksi / Edit Invoice & Pembayaran */}
      {selectedInvoiceForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-amber-600" />
                  Koreksi & Edit Data Tagihan
                </h3>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  No. Invoice: <strong className="text-slate-800">{selectedInvoiceForEdit.invoiceNumber}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoiceForEdit(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditInvoice} className="space-y-3.5 text-xs">
              {/* Pilih Jamaah */}
              <div>
                <label className="font-bold text-slate-700">Jamaah Pemilik Tagihan *</label>
                <select
                  required
                  value={editFormData.pilgrimId}
                  onChange={(e) => setEditFormData({ ...editFormData, pilgrimId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">-- Pilih Jamaah --</option>
                  {pilgrims.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ({p.package?.name || "Tanpa Paket"}) - HP: {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Box Diskon Khusus di Edit Modal */}
              <div className="p-3 bg-amber-50/70 border border-amber-300/80 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editFormData.hasDiscount}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setEditFormData({
                          ...editFormData,
                          hasDiscount: checked,
                          discountAmount: checked ? (editFormData.discountAmount || "4000000") : "",
                          discountReason: checked ? (editFormData.discountReason || "Promo Spesial Keberangkatan") : "",
                        });
                      }}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-700" />
                      Diskon Khusus / Potongan Harga Tagihan
                    </span>
                  </label>
                  {editFormData.hasDiscount && (
                    <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                      Diskon Aktif
                    </span>
                  )}
                </div>

                {editFormData.hasDiscount && (
                  <div className="space-y-2 pt-1 border-t border-amber-200">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, discountAmount: "4000000", discountReason: "Promo Spesial Keberangkatan" })}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                          editFormData.discountAmount === "4000000"
                            ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                            : "bg-white text-slate-700 border-amber-200 hover:bg-amber-100"
                        }`}
                      >
                        🔥 Promo Rp 4 Jt
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, discountAmount: "3000000", discountReason: "Diskon Khusus Tokoh / Ustadz" })}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                          editFormData.discountAmount === "3000000"
                            ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                            : "bg-white text-slate-700 border-amber-200 hover:bg-amber-100"
                        }`}
                      >
                        👳 Tokoh Rp 3 Jt
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, discountAmount: "2000000", discountReason: "Diskon Keluarga / Mitra" })}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                          editFormData.discountAmount === "2000000"
                            ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                            : "bg-white text-slate-700 border-amber-200 hover:bg-amber-100"
                        }`}
                      >
                        👨‍👩‍👧 Keluarga Rp 2 Jt
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, discountAmount: "1000000", discountReason: "Early Bird / Booking Awal" })}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                          editFormData.discountAmount === "1000000"
                            ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                            : "bg-white text-slate-700 border-amber-200 hover:bg-amber-100"
                        }`}
                      >
                        ⚡ Early Bird Rp 1 Jt
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Nominal Potongan (Rp) *</label>
                        <input
                          type="number"
                          value={editFormData.discountAmount}
                          onChange={(e) => setEditFormData({ ...editFormData, discountAmount: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 font-bold text-amber-900 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Alasan / Jenis Diskon *</label>
                        <input
                          type="text"
                          value={editFormData.discountReason}
                          onChange={(e) => setEditFormData({ ...editFormData, discountReason: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 font-medium text-slate-800 bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Financial Calculator saat Edit */}
              {(() => {
                const targetPilgrim = pilgrims.find((p) => p.id === editFormData.pilgrimId);
                if (!targetPilgrim) return null;

                const customDisc = editFormData.hasDiscount && editFormData.discountAmount ? parseFloat(editFormData.discountAmount) : 0;
                const { grossPrice, discountAmount, discountReason, netPrice, totalPaid, remaining } = getPilgrimFinancials(targetPilgrim, customDisc);

                return (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-950 border-b border-amber-200 pb-1">
                      <span className="flex items-center gap-1">
                        <Calculator className="w-3.5 h-3.5 text-amber-700" />
                        Status Keuangan: {targetPilgrim.name}
                      </span>
                      <span>Kamar: {targetPilgrim.roomType || "QUAD"}</span>
                    </div>

                    <div className={`grid gap-2 text-[10.5px] ${discountAmount > 0 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
                      <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[9.5px]">Harga Normal:</span>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(grossPrice)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="bg-amber-100 p-1.5 rounded-lg border border-amber-300">
                          <span className="text-amber-900 block text-[9.5px] font-bold">Diskon Khusus:</span>
                          <span className="font-mono font-bold text-amber-900">- {formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[9.5px]">Total Terbayar:</span>
                        <span className="font-mono font-bold text-emerald-700">{formatCurrency(totalPaid)}</span>
                      </div>
                      <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[9.5px]">Sisa Hutang:</span>
                        <span className="font-mono font-bold text-amber-800">{formatCurrency(remaining)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Jenis Tagihan *</label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                  >
                    <option value="DP">Uang Muka (DP)</option>
                    <option value="INSTALLMENT">Cicilan Bertahap</option>
                    <option value="FULL_PAYMENT">Pelunasan Akhir</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Nominal Tagihan (Rp) *</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono font-black text-emerald-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Judul / Keterangan Tagihan *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pembayaran DP Paket Umroh Reguler"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              {/* Status Pembayaran */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Status Pembayaran Tagihan *</label>
                  <span className="text-[10px] text-slate-500">Ubah sesuai kondisi riil</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 font-bold text-slate-900 bg-white"
                  >
                    <option value="PAID">✅ Lunas (PAID)</option>
                    <option value="PENDING">⏳ Belum Bayar (PENDING)</option>
                    <option value="OVERDUE">⚠️ Jatuh Tempo (OVERDUE)</option>
                    <option value="CANCELLED">❌ Dibatalkan (CANCELLED)</option>
                  </select>

                  {editFormData.status === "PAID" ? (
                    <select
                      value={editFormData.paymentMethod}
                      onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold bg-white"
                    >
                      <option value="BANK_TRANSFER">🏦 Transfer Bank</option>
                      <option value="CASH">💵 Tunai Kantor</option>
                      <option value="EDC">💳 Kartu Debit / EDC</option>
                      <option value="QRIS">📱 QRIS</option>
                    </select>
                  ) : (
                    <input
                      type="date"
                      value={editFormData.dueDate}
                      onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white"
                      title="Tanggal Jatuh Tempo"
                    />
                  )}
                </div>

                {editFormData.status === "PAID" && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">
                      Tanggal Pembayaran Diterima:
                    </label>
                    <input
                      type="date"
                      value={editFormData.paymentDate}
                      onChange={(e) => setEditFormData({ ...editFormData, paymentDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Pihak Penyetor */}
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    Pihak Penyetor / Donatur
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const targetP = pilgrims.find((p) => p.id === editFormData.pilgrimId);
                        setEditFormData({ ...editFormData, payerName: targetP?.name || "", payerPhone: targetP?.phone || "" });
                      }}
                      className="text-[9px] font-bold bg-white border border-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      Sesuai Jamaah
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, payerName: "Hamba Allah", payerPhone: "" })}
                      className="text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded hover:bg-amber-200 cursor-pointer"
                    >
                      Hamba Allah
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nama Penyetor (Kwitansi)"
                    value={editFormData.payerName}
                    onChange={(e) => setEditFormData({ ...editFormData, payerName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                  />
                  <input
                    type="tel"
                    placeholder="No HP Pembayar"
                    value={editFormData.payerPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, payerPhone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Catatan / Keterangan Promo / Rekening</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Koreksi nominal DP dan catatan potongan diskon..."
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForEdit(null)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {loading ? "Menyimpan..." : "Simpan Koreksi Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
