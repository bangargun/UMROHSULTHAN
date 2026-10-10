"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Receipt,
  FileText,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  FileCheck,
  Send,
  Trash2,
  Pencil,
  X,
  Camera,
  Eye,
  Building2,
  Coins,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Layers,
  ArrowRight,
  Plane,
  Hotel,
  ShieldCheck,
  Bus,
  Utensils,
  Briefcase,
  Gift,
  HelpCircle,
  ListPlus,
} from "lucide-react";
import { formatCurrency, formatDate, terbilang } from "@/lib/utils";
import Pagination from "@/components/common/Pagination";
import { parseProofUrls, compressImageFile, ProofUploadManager } from "@/components/finance/FinanceView";

export interface ExpenseLineItem {
  id?: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  notes?: string;
}

export const EXPENSE_CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: "TIKET_PESAWAT", label: "Tiket Pesawat", icon: "Plane" },
  { id: "HOTEL_SAUDI", label: "Hotel Saudi (Makkah & Madinah)", icon: "Hotel" },
  { id: "VISA_ASURANSI", label: "Visa Umroh & Asuransi", icon: "ShieldCheck" },
  { id: "MUTHAWWIF_HANDLING", label: "Muthawwif & Handling Bandara", icon: "Briefcase" },
  { id: "BUS_TRANSPORT", label: "Bus & Transportasi Darat", icon: "Bus" },
  { id: "KATERING_KONSUMSI", label: "Katering & Konsumsi Jamaah", icon: "Utensils" },
  { id: "PERLENGKAPAN_KOPER", label: "Perlengkapan & Koper", icon: "Briefcase" },
  { id: "TIPS_PORTER", label: "Tips & Porter Saudi", icon: "Gift" },
  { id: "OPERASIONAL_KANTOR", label: "Operasional Kantor & Umum", icon: "Building2" },
  { id: "LAIN_LAIN", label: "Lain-Lain", icon: "HelpCircle" },
];

export const EXPENSE_UNITS = ["Pax", "Tiket", "Kamar", "Malam", "Hari", "Unit", "Paket", "Set", "Pcs", "Orang", "Bulan"];

export const getCategoryLabel = (id: string) => {
  const found = EXPENSE_CATEGORIES.find((c) => c.id === id);
  return found ? found.label : id.replace(/_/g, " ");
};

export const formatSAR = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "SAR 0";
  return `SAR ${new Intl.NumberFormat("id-ID").format(amount)}`;
};

export const parseExpenseItems = (
  raw: string | null | undefined,
  fallbackTitle: string = "",
  fallbackCategory: string = "OPERASIONAL_KANTOR",
  fallbackAmount: number = 0
): ExpenseLineItem[] => {
  if (raw) {
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((it: any) => {
          const qty = Number(it.quantity) || 1;
          const uPrice = it.unitPrice !== undefined && it.unitPrice !== null ? Number(it.unitPrice) : (Number(it.amount) || 0) / qty;
          const tot = it.amount !== undefined && it.amount !== null ? Number(it.amount) : qty * uPrice;
          return {
            description: it.description || it.title || "",
            category: it.category || fallbackCategory,
            quantity: qty,
            unit: it.unit || "Pax",
            unitPrice: uPrice,
            amount: tot,
            notes: it.notes || "",
          };
        });
      }
    } catch (e) {
      // fallback
    }
  }

  // Fallback for single item record
  return [
    {
      description: fallbackTitle || "",
      category: fallbackCategory || "OPERASIONAL_KANTOR",
      quantity: 1,
      unit: "Paket",
      unitPrice: fallbackAmount || 0,
      amount: fallbackAmount || 0,
      notes: "",
    },
  ];
};

interface ExpenseManagementViewProps {
  packages?: any[];
  travelSettings?: any;
}

export default function ExpenseManagementView({
  packages = [],
  travelSettings = {},
}: ExpenseManagementViewProps) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterDocType, setFilterDocType] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPackageId, setFilterPackageId] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Form Modal (Tambah / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    documentType: "BKK" as "BKK" | "VENDOR_INVOICE",
    voucherNumber: "",
    packageId: "",
    category: "OPERASIONAL_KANTOR",
    title: "",
    amount: "0",
    currency: "IDR" as "IDR" | "SAR",
    amountForeign: "0",
    exchangeRate: "4250",
    expenseDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    status: "PAID" as "PAID" | "PENDING",
    paymentMethod: "BANK_TRANSFER",
    recipientVendor: "",
    recipientPhone: "",
    approvedBy: travelSettings.directorName || "ATIYATUL AMRA",
    paidBy: "Kasir / Bagian Keuangan",
    notes: "",
    proofUrls: [] as string[],
    items: [
      {
        description: "",
        category: "OPERASIONAL_KANTOR",
        quantity: 1,
        unit: "Pax",
        unitPrice: 0,
        amount: 0,
        notes: "",
      },
    ] as ExpenseLineItem[],
  });

  // Print Preview Modal
  const [selectedExpenseForPrint, setSelectedExpenseForPrint] = useState<any | null>(null);
  const [includeMeterai, setIncludeMeterai] = useState<boolean>(false);
  const [showProofInPrint, setShowProofInPrint] = useState<boolean>(true);

  // Image Preview Modal
  const [previewProofModal, setPreviewProofModal] = useState<{
    isOpen: boolean;
    urls: string[];
    activeIndex: number;
    title: string;
  }>({
    isOpen: false,
    urls: [],
    activeIndex: 0,
    title: "",
  });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/expenses");
      if (res.ok) {
        const data = await res.json();
        setExpenses(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Gagal memuat pengeluaran:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Filter calculation
  const filteredExpenses = expenses.filter((item) => {
    const matchSearch =
      (item.voucherNumber && item.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.recipientVendor && item.recipientVendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.package?.name && item.package.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.items && item.items.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchDocType = filterDocType === "ALL" || item.documentType === filterDocType;
    const matchCategory = filterCategory === "ALL" || item.category === filterCategory;
    const matchStatus = filterStatus === "ALL" || item.status === filterStatus;
    const matchPackage =
      filterPackageId === "ALL" ||
      (filterPackageId === "NON_PACKAGE" && !item.packageId) ||
      item.packageId === filterPackageId;

    return matchSearch && matchDocType && matchCategory && matchStatus && matchPackage;
  });

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDocType, filterCategory, filterStatus, filterPackageId]);

  const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // KPI Calculations
  let totalExpensesPaidIDR = 0;
  let totalExpensesPendingIDR = 0;
  let totalExpensesPaidSAR = 0;

  expenses.forEach((item) => {
    const amtIDR = item.amount || 0;
    if (item.status === "PAID") {
      totalExpensesPaidIDR += amtIDR;
      if (item.currency === "SAR" && item.amountForeign) {
        totalExpensesPaidSAR += item.amountForeign;
      }
    } else {
      totalExpensesPendingIDR += amtIDR;
    }
  });

  // Recalculate Totals from Multi-Items
  const calculateItemsTotal = (
    items: ExpenseLineItem[],
    currency: "IDR" | "SAR",
    exchangeRate: string
  ) => {
    const totalItemAmount = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    const rate = parseFloat(exchangeRate) || 0;

    if (currency === "SAR") {
      const calcIDR = rate > 0 ? Math.round(totalItemAmount * rate) : totalItemAmount;
      return {
        amountForeign: String(totalItemAmount),
        amount: String(calcIDR),
      };
    } else {
      return {
        amountForeign: "0",
        amount: String(totalItemAmount),
      };
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingExpenseId(null);
    setFormData({
      documentType: "BKK",
      voucherNumber: "",
      packageId: "",
      category: "OPERASIONAL_KANTOR",
      title: "",
      amount: "0",
      currency: "IDR",
      amountForeign: "0",
      exchangeRate: "4250",
      expenseDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      status: "PAID",
      paymentMethod: "BANK_TRANSFER",
      recipientVendor: "",
      recipientPhone: "",
      approvedBy: travelSettings.directorName || "ATIYATUL AMRA",
      paidBy: "Kasir / Bagian Keuangan",
      notes: "",
      proofUrls: [],
      items: [
        {
          description: "",
          category: "OPERASIONAL_KANTOR",
          quantity: 1,
          unit: "Pax",
          unitPrice: 0,
          amount: 0,
          notes: "",
        },
      ],
    });
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: any) => {
    setEditingExpenseId(item.id);
    const parsedItems = parseExpenseItems(item.items, item.title, item.category, item.amount);

    setFormData({
      documentType: item.documentType || "BKK",
      voucherNumber: item.voucherNumber || "",
      packageId: item.packageId || "",
      category: item.category || "OPERASIONAL_KANTOR",
      title: item.title || "",
      amount: item.amount ? String(item.amount) : "0",
      currency: (item.currency as "IDR" | "SAR") || "IDR",
      amountForeign: item.amountForeign ? String(item.amountForeign) : "0",
      exchangeRate: item.exchangeRate ? String(item.exchangeRate) : "4250",
      expenseDate: item.expenseDate ? new Date(item.expenseDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split("T")[0] : "",
      status: (item.status as "PAID" | "PENDING") || "PAID",
      paymentMethod: item.paymentMethod || "BANK_TRANSFER",
      recipientVendor: item.recipientVendor || "",
      recipientPhone: item.recipientPhone || "",
      approvedBy: item.approvedBy || travelSettings.directorName || "ATIYATUL AMRA",
      paidBy: item.paidBy || "Kasir / Bagian Keuangan",
      notes: item.notes || "",
      proofUrls: parseProofUrls(item.proofUrl),
      items: parsedItems,
    });
    setIsFormModalOpen(true);
  };

  // Multi-item operations
  const handleAddLineItem = () => {
    const newItem: ExpenseLineItem = {
      description: "",
      category: formData.category || "OPERASIONAL_KANTOR",
      quantity: 1,
      unit: "Pax",
      unitPrice: 0,
      amount: 0,
      notes: "",
    };
    const updatedItems = [...formData.items, newItem];
    const totals = calculateItemsTotal(updatedItems, formData.currency, formData.exchangeRate);
    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      ...totals,
    }));
  };

  const handleRemoveLineItem = (index: number) => {
    if (formData.items.length <= 1) {
      // Clear single item instead of removing
      const resetItems: ExpenseLineItem[] = [
        {
          description: "",
          category: formData.category || "OPERASIONAL_KANTOR",
          quantity: 1,
          unit: "Pax",
          unitPrice: 0,
          amount: 0,
          notes: "",
        },
      ];
      setFormData((prev) => ({
        ...prev,
        items: resetItems,
        amount: "0",
        amountForeign: "0",
      }));
      return;
    }
    const updatedItems = formData.items.filter((_, i) => i !== index);
    const totals = calculateItemsTotal(updatedItems, formData.currency, formData.exchangeRate);
    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      ...totals,
    }));
  };

  const handleLineItemChange = (
    index: number,
    field: keyof ExpenseLineItem,
    value: any
  ) => {
    const updatedItems = [...formData.items];
    const current = { ...updatedItems[index], [field]: value };

    if (field === "quantity" || field === "unitPrice") {
      const q = field === "quantity" ? Number(value) || 0 : Number(current.quantity) || 0;
      const p = field === "unitPrice" ? Number(value) || 0 : Number(current.unitPrice) || 0;
      current.amount = Math.round(q * p);
    } else if (field === "amount") {
      current.amount = Number(value) || 0;
      const q = Number(current.quantity) || 1;
      current.unitPrice = q > 0 ? Math.round(current.amount / q) : current.amount;
    }

    updatedItems[index] = current;
    const totals = calculateItemsTotal(updatedItems, formData.currency, formData.exchangeRate);

    // If first item description changes and main title is empty, sync title
    let newTitle = formData.title;
    if (index === 0 && field === "description" && (!formData.title || formData.title === updatedItems[0].description)) {
      newTitle = String(value);
    }

    setFormData((prev) => ({
      ...prev,
      title: newTitle,
      items: updatedItems,
      ...totals,
    }));
  };

  // Currency / Rate Change
  const handleCurrencyChange = (newCurrency: "IDR" | "SAR") => {
    const totals = calculateItemsTotal(formData.items, newCurrency, formData.exchangeRate);
    setFormData((prev) => ({
      ...prev,
      currency: newCurrency,
      ...totals,
    }));
  };

  const handleRateChange = (newRate: string) => {
    const totals = calculateItemsTotal(formData.items, formData.currency, newRate);
    setFormData((prev) => ({
      ...prev,
      exchangeRate: newRate,
      ...totals,
    }));
  };

  // Submit Handler (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const validItems = formData.items.filter((it) => it.description.trim().length > 0 || it.amount > 0);
    if (validItems.length === 0) {
      alert("Silakan masukkan minimal 1 baris item pengeluaran dengan nama uraian dan nominal yang valid.");
      return;
    }

    const calculatedTotalIDR = parseFloat(formData.amount);
    if (isNaN(calculatedTotalIDR) || calculatedTotalIDR <= 0) {
      alert("Total pengeluaran harus lebih besar dari 0.");
      return;
    }

    const mainTitle = formData.title.trim() || validItems[0].description.trim() || "Pengeluaran Operasional";
    const mainCategory = validItems[0]?.category || formData.category;

    setLoading(true);
    try {
      const payload: any = {
        documentType: formData.documentType,
        packageId: formData.packageId ? formData.packageId : null,
        category: mainCategory,
        title: mainTitle,
        amount: calculatedTotalIDR,
        currency: formData.currency,
        amountForeign: formData.currency === "SAR" && formData.amountForeign ? parseFloat(formData.amountForeign) : null,
        exchangeRate: formData.currency === "SAR" && formData.exchangeRate ? parseFloat(formData.exchangeRate) : null,
        expenseDate: formData.expenseDate,
        dueDate: formData.status === "PENDING" && formData.dueDate ? formData.dueDate : null,
        status: formData.status,
        paymentMethod: formData.paymentMethod,
        recipientVendor: formData.recipientVendor.trim() || null,
        recipientPhone: formData.recipientPhone.trim() || null,
        approvedBy: formData.approvedBy.trim() || null,
        paidBy: formData.paidBy.trim() || null,
        notes: formData.notes.trim() || null,
        items: JSON.stringify(validItems),
        proofUrl: formData.proofUrls.length > 0 ? JSON.stringify(formData.proofUrls) : null,
      };

      if (formData.voucherNumber.trim()) {
        payload.voucherNumber = formData.voucherNumber.trim();
      }

      let res;
      if (editingExpenseId) {
        res = await fetch(`/api/expenses/${editingExpenseId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const savedData = await res.json();
        setIsFormModalOpen(false);
        await fetchExpenses();

        if (!editingExpenseId && window.confirm("Pengeluaran berhasil dicatat. Buka dokumen cetak sekarang?")) {
          setSelectedExpenseForPrint(savedData);
        }
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan pengeluaran");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Handler
  const handleDeleteExpense = async (id: string, voucherNumber: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus pengeluaran #${voucherNumber}? Data ini akan dihapus permanen.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchExpenses();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menghapus pengeluaran");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp Share Handler
  const handleSendWhatsAppExpense = (item: any) => {
    if (!item.recipientPhone) {
      alert("Nomor WhatsApp penerima / vendor belum diisi pada pengeluaran ini.");
      return;
    }
    const cleanPhone = item.recipientPhone.replace(/[^0-9]/g, "");
    const phoneWithCountry = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
    const docLabel = item.documentType === "VENDOR_INVOICE" ? "INVOICE TAGIHAN VENDOR" : "BUKTI KAS KELUAR (BKK)";
    const lineItems = parseExpenseItems(item.items, item.title, item.category, item.amount);

    let itemsText = "";
    lineItems.forEach((it, idx) => {
      const itemSubtotal = item.currency === "SAR" ? formatSAR(it.amount) : formatCurrency(it.amount);
      itemsText += `\n${idx + 1}. *${it.description}* (${it.quantity} ${it.unit}): ${itemSubtotal}`;
    });

    const message =
      `*${docLabel} - ${travelSettings.companyName || "PT BAROKAH SULTHAN HARAMAIN"}*\n` +
      `No. Dokumen: *${item.voucherNumber}*\n` +
      `Tanggal: ${formatDate(item.expenseDate, "dd MMMM yyyy")}\n` +
      `Penerima / Vendor: *${item.recipientVendor || "-"}*\n` +
      `Peruntukan: *${item.title}*\n` +
      (item.package?.name ? `Paket Umroh: ${item.package.name}\n` : "") +
      `\n*Rincian Item Pengeluaran:*${itemsText}\n\n` +
      `*TOTAL PEMBAYARAN: ${formatCurrency(item.amount)}*` +
      (item.currency === "SAR" && item.amountForeign ? ` (${formatSAR(item.amountForeign)} @ Kurs Rp ${new Intl.NumberFormat("id-ID").format(item.exchangeRate || 0)})` : "") +
      `\nStatus: *${item.status === "PAID" ? "LUNAS (TELAH DIBAYARKAN)" : "MENUNGGU PEMBAYARAN"}*\n` +
      `Metode Bayar: ${item.paymentMethod.replace(/_/g, " ")}\n\n` +
      `Terima kasih atas kerja samanya.\n` +
      `_Pemberitahuan resmi sistem keuangan ${travelSettings.companyName || "PT Barokah Sulthan Haramain"}_`;

    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* KPI Pengeluaran */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 no-print">
        <div className="bg-gradient-to-br from-rose-600 to-amber-700 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-rose-100 uppercase tracking-wider">Total Kas Keluar (Lunas)</p>
            <TrendingDown className="w-5 h-5 text-rose-200" />
          </div>
          <h3 className="text-2xl font-black mt-1">{formatCurrency(totalExpensesPaidIDR)}</h3>
          {totalExpensesPaidSAR > 0 ? (
            <p className="text-[11px] text-amber-200 mt-1 font-semibold">
              Termasuk {formatSAR(totalExpensesPaidSAR)} di Tanah Suci
            </p>
          ) : (
            <p className="text-[11px] text-rose-200 mt-1">Biaya operasional & vendor yang telah dibayarkan</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tagihan Vendor Tertunda</p>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-amber-600 mt-1">{formatCurrency(totalExpensesPendingIDR)}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Menunggu jatuh tempo pelunasan ke vendor</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Seluruh Pengeluaran</p>
            <Coins className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalExpensesPaidIDR + totalExpensesPendingIDR)}</h3>
          <p className="text-[11px] text-slate-400 mt-1">{expenses.length} Bukti Kas Keluar & Tagihan Vendor tercatat</p>
        </div>
      </div>

      {/* Header Actions & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-rose-600" />
            Pencatatan Kas Keluar (BKK) & Invoice Vendor
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dukung <strong>multi-item rincian pengeluaran</strong> dalam 1 voucher, mata uang IDR & SAR, cetak A4 ber-Kop resmi & opsi materai Rp 10.000.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          + Catat Pengeluaran Baru
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor BKK/Voucher, uraian item, vendor, atau paket..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <select
              value={filterDocType}
              onChange={(e) => setFilterDocType(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
            >
              <option value="ALL">Semua Jenis Dokumen</option>
              <option value="BKK">Bukti Kas Keluar (BKK)</option>
              <option value="VENDOR_INVOICE">Invoice Tagihan Vendor</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
            >
              <option value="ALL">Semua Status Bayar</option>
              <option value="PAID">Lunas (Sudah Dibayar)</option>
              <option value="PENDING">Menunggu Bayar (Pending)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kategori Biaya</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            >
              <option value="ALL">Semua Kategori Biaya</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Paket Umroh Terkait</label>
            <select
              value={filterPackageId}
              onChange={(e) => setFilterPackageId(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            >
              <option value="ALL">Semua Pengeluaran (Paket & Operasional Umum)</option>
              <option value="NON_PACKAGE">Hanya Operasional Umum (Tanpa Paket)</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  Paket: {pkg.name} ({formatDate(pkg.departureDate, "dd MMM yyyy")})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Pengeluaran */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5">No. Dokumen</th>
                <th className="px-4 py-3.5">Peruntukan & Rincian Item</th>
                <th className="px-4 py-3.5">Kategori Utama</th>
                <th className="px-4 py-3.5">Penerima / Vendor</th>
                <th className="px-4 py-3.5">Total Nominal (IDR & SAR)</th>
                <th className="px-4 py-3.5">Status & Tanggal</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Belum ada data pengeluaran kas atau tagihan vendor.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Klik tombol <strong>+ Catat Pengeluaran Baru</strong> untuk menginput Bukti Kas Keluar atau Tagihan Vendor multi-item.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((item) => {
                  const proofList = parseProofUrls(item.proofUrl);
                  const lineItems = parseExpenseItems(item.items, item.title, item.category, item.amount);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-slate-900">{item.voucherNumber}</div>
                        <div className="mt-0.5">
                          <span
                            className={`inline-block text-[9.5px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                              item.documentType === "VENDOR_INVOICE"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-rose-100 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {item.documentType === "VENDOR_INVOICE" ? "Invoice Vendor" : "Kas Keluar (BKK)"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 max-w-sm">
                        <div className="font-bold text-slate-900 leading-snug">{item.title}</div>
                        
                        {/* Multi-Item Badge & List Preview */}
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                            <Layers className="w-3 h-3" />
                            {lineItems.length} Item
                          </span>
                          {lineItems.slice(0, 2).map((it, idx) => (
                            <span key={idx} className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[150px]">
                              {it.description} ({it.quantity} {it.unit})
                            </span>
                          ))}
                          {lineItems.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              +{lineItems.length - 2} lainnya
                            </span>
                          )}
                        </div>

                        {item.package ? (
                          <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                            <span>📦 {item.package.name}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 mt-1">Operasional Umum / Non-Paket</div>
                        )}
                        {item.notes && <p className="text-[10px] text-slate-500 italic mt-0.5 truncate">{item.notes}</p>}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {getCategoryLabel(item.category)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">{item.recipientVendor || "-"}</div>
                        {item.recipientPhone && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.recipientPhone}</div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-extrabold text-slate-900 text-sm">{formatCurrency(item.amount)}</div>
                        {item.currency === "SAR" && item.amountForeign && (
                          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                            {formatSAR(item.amountForeign)} @ Rp {new Intl.NumberFormat("id-ID").format(item.exchangeRate || 0)}
                          </div>
                        )}
                        {proofList.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewProofModal({
                                isOpen: true,
                                urls: proofList,
                                activeIndex: 0,
                                title: `Nota / Bukti Struk - ${item.voucherNumber}`,
                              })
                            }
                            className="inline-flex items-center gap-1 text-[10px] text-rose-600 hover:text-rose-800 font-semibold mt-1 cursor-pointer"
                          >
                            <Camera className="w-3 h-3" />
                            {proofList.length} Foto Struk
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.status === "PAID" ? "Lunas" : "Menunggu Bayar"}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-slate-500 mt-1">
                          {formatDate(item.expenseDate, "dd MMM yyyy")}
                        </div>
                        {item.status === "PENDING" && item.dueDate && (
                          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                            Tempo: {formatDate(item.dueDate, "dd MMM yyyy")}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedExpenseForPrint(item);
                              setIncludeMeterai(false);
                              setShowProofInPrint(true);
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                            title="Cetak Bukti Kas Keluar / Invoice A4"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {item.recipientPhone && (
                            <button
                              onClick={() => handleSendWhatsAppExpense(item)}
                              className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer"
                              title="Kirim Notifikasi via WhatsApp"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                            title="Edit Data Pengeluaran"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteExpense(item.id, item.voucherNumber)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                            title="Hapus Pengeluaran"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {filteredExpenses.length > pageSize && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredExpenses.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="pengeluaran"
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL FORM: CATAT / EDIT MULTI-ITEM PENGELUARAN          */}
      {/* ======================================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto no-print">
          <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[94vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-rose-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  {editingExpenseId ? "Edit Catatan Pengeluaran" : "Catat Pengeluaran Baru (Multi-Item)"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Jenis Dokumen & Nomor Voucher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Jenis Dokumen Pencatatan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value as "BKK" | "VENDOR_INVOICE" })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold"
                  >
                    <option value="BKK">Bukti Kas Keluar (BKK) / Kwitansi Pengeluaran</option>
                    <option value="VENDOR_INVOICE">Faktur / Invoice Tagihan Vendor</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nomor Dokumen / Voucher <span className="text-slate-400 font-normal">(Otomatis jika kosong)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: BKK/BSH/202610/001"
                    value={formData.voucherNumber}
                    onChange={(e) => setFormData({ ...formData, voucherNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Hubungan Paket Umroh & Judul / Peruntukan Umum */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Hubungkan ke Paket Umroh <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <select
                    value={formData.packageId}
                    onChange={(e) => setFormData({ ...formData, packageId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium"
                  >
                    <option value="">Operasional Umum Kantor (Tanpa Paket)</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ({formatDate(pkg.departureDate, "dd MMM yyyy")})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Judul / Peruntukan Keseluruhan Voucher <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pelunasan Tiket, Hotel & Handling Group 45 Pax..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Pilihan Mata Uang & Kalkulasi Kurs Otomatis */}
              <div className="p-4 bg-gradient-to-r from-slate-50 via-slate-50 to-amber-50/40 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                      Pilihan Mata Uang Transaksi
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Pilih <strong>IDR (Rupiah)</strong> untuk pengeluaran di tanah air, atau <strong>SAR (Saudi Riyal)</strong> untuk biaya di Tanah Suci.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleCurrencyChange("IDR")}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formData.currency === "IDR"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <span>🇮🇩 IDR (Rupiah)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCurrencyChange("SAR")}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formData.currency === "SAR"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <span>🇸🇦 SAR (Saudi Riyal)</span>
                    </button>
                  </div>
                </div>

                {/* Box Khusus Kurs Otomatis jika memilih SAR */}
                {formData.currency === "SAR" && (
                  <div className="p-3.5 bg-amber-100/70 rounded-xl border-2 border-amber-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-200 rounded-lg text-amber-900">
                        <Coins className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-amber-950 block">
                          Kurs Ditetapkan (Dapat Disesuaikan / Diisi)
                        </span>
                        <p className="text-[11px] text-amber-900 leading-tight">
                          Item pengeluaran di bawah diisi dalam SAR, dan sistem secara otomatis mengonversikannya ke Rupiah (IDR).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-bold text-amber-950 whitespace-nowrap">1 SAR =</span>
                      <div className="relative w-36">
                        <span className="absolute left-3 top-2 text-xs text-slate-500 font-bold">Rp</span>
                        <input
                          type="number"
                          value={formData.exchangeRate}
                          onChange={(e) => handleRateChange(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 rounded-xl border-2 border-amber-400 bg-white text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                          placeholder="4250"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* =================================================== */}
              {/* TABEL RINCIAN MULTI-ITEM PENGELUARAN                */}
              {/* =================================================== */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ListPlus className="w-4 h-4 text-rose-600" />
                      Rincian Item Pengeluaran ({formData.items.length} Baris Item)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Anda dapat memasukkan beberapa rincian biaya sekaligus (misal tiket, hotel, visa, muthawwif, dll) dalam 1 invoice/kwitansi.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Tambah Baris Item
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2 w-10 text-center">No</th>
                          <th className="px-3 py-2 min-w-[200px]">Uraian Item Pengeluaran *</th>
                          <th className="px-3 py-2 min-w-[140px]">Kategori</th>
                          <th className="px-3 py-2 w-20 text-center">Qty</th>
                          <th className="px-3 py-2 w-24">Satuan</th>
                          <th className="px-3 py-2 min-w-[130px] text-right">
                            Harga Satuan ({formData.currency})
                          </th>
                          <th className="px-3 py-2 min-w-[140px] text-right">
                            Subtotal ({formData.currency === "SAR" ? "SAR & IDR" : "Rp"})
                          </th>
                          <th className="px-2 py-2 w-10 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {formData.items.map((item, idx) => {
                          const rateVal = parseFloat(formData.exchangeRate) || 0;
                          const eqIDR = formData.currency === "SAR" ? Math.round(item.amount * rateVal) : item.amount;

                          return (
                            <tr key={idx} className="hover:bg-slate-50/60">
                              <td className="px-3 py-2 text-center font-bold text-slate-400">
                                {idx + 1}
                              </td>

                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  placeholder={`Item #${idx + 1} (misal: Tiket Saudia, Sewa Bus, Katering...)`}
                                  value={item.description}
                                  onChange={(e) => handleLineItemChange(idx, "description", e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-rose-500 font-medium"
                                  required
                                />
                              </td>

                              <td className="px-3 py-2">
                                <select
                                  value={item.category}
                                  onChange={(e) => handleLineItemChange(idx, "category", e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                                >
                                  {EXPENSE_CATEGORIES.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.label}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="1"
                                  step="any"
                                  value={item.quantity}
                                  onChange={(e) => handleLineItemChange(idx, "quantity", e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-center font-bold"
                                />
                              </td>

                              <td className="px-3 py-2">
                                <input
                                  list={`units-list-${idx}`}
                                  type="text"
                                  value={item.unit}
                                  onChange={(e) => handleLineItemChange(idx, "unit", e.target.value)}
                                  placeholder="Pax"
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                                />
                                <datalist id={`units-list-${idx}`}>
                                  {EXPENSE_UNITS.map((u) => (
                                    <option key={u} value={u} />
                                  ))}
                                </datalist>
                              </td>

                              <td className="px-3 py-2 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={item.unitPrice || ""}
                                  onChange={(e) => handleLineItemChange(idx, "unitPrice", e.target.value)}
                                  placeholder="0"
                                  className={`w-full px-2 py-1.5 rounded-lg border text-xs text-right font-bold ${
                                    formData.currency === "SAR"
                                      ? "border-amber-300 text-amber-900 bg-amber-50/20"
                                      : "border-slate-200 text-slate-800"
                                  }`}
                                />
                              </td>

                              <td className="px-3 py-2 text-right">
                                {formData.currency === "SAR" ? (
                                  <div>
                                    <div className="font-black text-amber-800 text-xs">
                                      {formatSAR(item.amount)}
                                    </div>
                                    <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                                      ≈ {formatCurrency(eqIDR)}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="font-black text-rose-700 text-xs">
                                    {formatCurrency(item.amount)}
                                  </div>
                                )}
                              </td>

                              <td className="px-2 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLineItem(idx)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Hapus baris item ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Ringkasan Subtotal / Grand Total Footer */}
                  <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">
                        Total {formData.items.length} Rincian Item Pengeluaran
                      </span>
                      {formData.currency === "SAR" && (
                        <span className="text-[11px] text-amber-800 font-semibold">
                          Kurs Ditetapkan: 1 SAR = Rp {new Intl.NumberFormat("id-ID").format(parseFloat(formData.exchangeRate) || 0)}
                        </span>
                      )}
                    </div>

                    <div className="text-right space-y-1">
                      {formData.currency === "SAR" && (
                        <div className="text-xs font-black text-amber-800">
                          Total Riyal: {formatSAR(parseFloat(formData.amountForeign) || 0)}
                        </div>
                      )}
                      <div className="text-sm font-black text-rose-700">
                        {formData.currency === "SAR" ? "Grand Total Setara (IDR): " : "Grand Total: "}
                        {formatCurrency(parseFloat(formData.amount) || 0)}
                      </div>
                      <div className="text-[10.5px] text-slate-500 italic">
                        &ldquo;{terbilang(parseFloat(formData.amount) || 0)}&rdquo;
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Penerima / Vendor & No WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nama Penerima Dana / Vendor / Maskapai
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Saudia Airlines / Hotel Pulman Zamzam / Ustadz Hasan"
                    value={formData.recipientVendor}
                    onChange={(e) => setFormData({ ...formData, recipientVendor: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    No. WhatsApp / HP Penerima <span className="text-slate-400 font-normal">(Untuk kirim BKK)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={formData.recipientPhone}
                    onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Tanggal, Status & Jatuh Tempo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tanggal Pengeluaran</label>
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Status Pembayaran</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "PAID" | "PENDING" })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold"
                  >
                    <option value="PAID">Lunas (Telah Dibayar)</option>
                    <option value="PENDING">Menunggu Bayar (Pending)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Metode Pembayaran</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold"
                  >
                    <option value="BANK_TRANSFER">Transfer Bank</option>
                    <option value="CASH">Tunai / Kas</option>
                    <option value="PETTY_CASH">Kas Kecil (Petty Cash)</option>
                    <option value="CREDIT_CARD">Kartu Kredit / Debit</option>
                  </select>
                </div>
              </div>

              {formData.status === "PENDING" && (
                <div>
                  <label className="text-xs font-bold text-rose-700 block mb-1">
                    Tanggal Jatuh Tempo Pembayaran Vendor
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full rounded-xl border border-rose-300 p-2.5 text-xs bg-rose-50/30"
                  />
                </div>
              )}

              {/* Tanda Tangan: Disetujui Oleh & Dibayar Oleh */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Disetujui Oleh (Pimpinan / Direktur)</label>
                  <input
                    type="text"
                    value={formData.approvedBy}
                    onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Dibayar Oleh (Kasir / Keuangan)</label>
                  <input
                    type="text"
                    value={formData.paidBy}
                    onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Catatan / Keterangan Tambahan */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan nomor resi transfer, rincian kamar, kode booking tiket..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                />
              </div>

              {/* Lampiran Bukti Foto / Struk Pembelian Multi-Foto */}
              <ProofUploadManager
                urls={formData.proofUrls}
                onChange={(newUrls: string[]) => setFormData({ ...formData, proofUrls: newUrls })}
                onPreview={(urls: string[], idx: number) =>
                  setPreviewProofModal({
                    isOpen: true,
                    urls,
                    activeIndex: idx,
                    title: "Lampiran Struk / Nota Pengeluaran",
                  })
                }
                label="Lampiran Bukti Nota / Kwitansi / Struk Belanja"
                description="Bisa unggah lebih dari 1 foto (struk invoice hotel, tiket pesawat, nota katering, bukti transfer bank, dll)"
              />

              {/* Tombol Aksi Form */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border text-slate-600 font-bold text-xs cursor-pointer hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 cursor-pointer shadow-xs"
                >
                  {loading ? "Menyimpan..." : editingExpenseId ? "Simpan Perubahan" : "Simpan Pengeluaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CETAK LEMBAR A4 RESMI: BUKTI KAS KELUAR & INVOICE  */}
      {/* ======================================================== */}
      {selectedExpenseForPrint && (() => {
        const lineItems = parseExpenseItems(
          selectedExpenseForPrint.items,
          selectedExpenseForPrint.title,
          selectedExpenseForPrint.category,
          selectedExpenseForPrint.amount
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
            <div className="relative w-full max-w-4xl rounded-2xl bg-slate-100 shadow-2xl flex flex-col my-4 max-h-[96vh] overflow-hidden">
              {/* Header Toolbar Modal Cetak */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-200 no-print">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-rose-600" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Pratinjau Lembar Cetak A4:{" "}
                      {selectedExpenseForPrint.documentType === "VENDOR_INVOICE"
                        ? "Faktur / Invoice Tagihan Vendor"
                        : "Bukti Kas Keluar (BKK)"}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {selectedExpenseForPrint.voucherNumber} ({lineItems.length} Item Rincian)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Toggle Lampiran Foto Struk */}
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer select-none transition-colors">
                    <input
                      type="checkbox"
                      checked={showProofInPrint}
                      onChange={(e) => setShowProofInPrint(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <Camera className="w-3.5 h-3.5 text-rose-600" />
                    <span>Sertakan Foto Nota</span>
                  </label>

                  {/* Toggle Materai Rp 10.000 */}
                  <label
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer select-none transition-all ${
                      includeMeterai
                        ? "bg-amber-50 border-amber-300 text-amber-900 shadow-2xs"
                        : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                    }`}
                    title="Centang untuk menyematkan kolom materai tempel Rp 10.000 pada area tanda tangan penerima"
                  >
                    <input
                      type="checkbox"
                      checked={includeMeterai}
                      onChange={(e) => setIncludeMeterai(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <FileCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>Gunakan Materai (Rp 10.000)</span>
                  </label>

                  {/* Tombol Cetak */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Cetak Lembar Dokumen (Print/PDF)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedExpenseForPrint(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Area Pratinjau Kertas A4 */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-200/70">
                <div
                  className="bg-white border border-slate-300 shadow-lg p-6 sm:p-8 rounded-lg text-slate-900 relative space-y-4 print-sheet"
                  style={{ width: "100%", maxWidth: "800px", minHeight: "297mm" }}
                >
                  {/* KOP SURAT RESMI */}
                  <div className="flex items-center justify-between gap-4 pb-2 border-b-2 border-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-16 flex-shrink-0 flex items-center justify-center p-0.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
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
                        <p className="text-[7.5px] sm:text-[8px] font-semibold text-slate-600 tracking-wide mt-0.5 uppercase">
                          NO. IZIN PPIU INDUK USAHA PT. GRAND RESTU HARAMAN : {(travelSettings.licenseNumber || "25052200384080005")
                            .replace(/•?\s*NIB[\s\S]*/i, "")
                            .replace(/•?\s*KBLI[\s\S]*/i, "")
                            .replace(/NO\.\s*IZIN\s*PPIU\s*:\s*/i, "")
                            .trim()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                        NO. DOKUMEN:
                      </span>
                      <span className="text-xs font-mono font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 block">
                        {selectedExpenseForPrint.voucherNumber}
                      </span>
                      <span className="text-[9px] text-slate-500 mt-1 block">
                        Tgl: {formatDate(selectedExpenseForPrint.expenseDate, "dd MMMM yyyy")}
                      </span>
                    </div>
                  </div>

                  {/* JUDUL DOKUMEN */}
                  <div className="text-center py-1">
                    <h2 className="text-base sm:text-lg font-black tracking-wider uppercase text-slate-900 underline decoration-2 underline-offset-4">
                      {selectedExpenseForPrint.documentType === "VENDOR_INVOICE"
                        ? "FAKTUR / INVOICE TAGIHAN VENDOR"
                        : "BUKTI KAS KELUAR (PAYMENT VOUCHER)"}
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                      Peruntukan: {selectedExpenseForPrint.title} • Status:{" "}
                      {selectedExpenseForPrint.status === "PAID" ? "LUNAS (TELAH DIBAYAR)" : "MENUNGGU PEMBAYARAN"}
                    </p>
                  </div>

                  {/* INFORMASI UTAMA DOKUMEN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="space-y-1">
                      <div className="flex">
                        <span className="w-32 font-bold text-slate-600">Dibayarkan Kepada</span>
                        <span className="font-extrabold text-slate-900">: {selectedExpenseForPrint.recipientVendor || "-"}</span>
                      </div>
                      <div className="flex">
                        <span className="w-32 text-slate-500">No. WhatsApp / HP</span>
                        <span className="text-slate-800 font-mono">: {selectedExpenseForPrint.recipientPhone || "-"}</span>
                      </div>
                      <div className="flex">
                        <span className="w-32 text-slate-500">Metode Bayar</span>
                        <span className="text-slate-800 font-semibold">: {selectedExpenseForPrint.paymentMethod.replace(/_/g, " ")}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex">
                        <span className="w-32 text-slate-500">Paket Terkait</span>
                        <span className="font-bold text-emerald-800">: {selectedExpenseForPrint.package?.name || "Operasional Umum"}</span>
                      </div>
                      <div className="flex">
                        <span className="w-32 text-slate-500">Tanggal Pengeluaran</span>
                        <span className="text-slate-800">: {formatDate(selectedExpenseForPrint.expenseDate, "dd MMMM yyyy")}</span>
                      </div>
                      {selectedExpenseForPrint.dueDate && (
                        <div className="flex">
                          <span className="w-32 text-slate-500">Jatuh Tempo</span>
                          <span className="text-rose-600 font-bold">: {formatDate(selectedExpenseForPrint.dueDate, "dd MMMM yyyy")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TABEL RINCIAN MULTI-ITEM */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[9.5px]">
                        <tr>
                          <th className="px-3.5 py-2.5 w-10 text-center">No</th>
                          <th className="px-3.5 py-2.5">Uraian / Rincian Pengeluaran</th>
                          <th className="px-3.5 py-2.5 w-32">Kategori</th>
                          <th className="px-3.5 py-2.5 w-20 text-center">Qty</th>
                          <th className="px-3.5 py-2.5 w-28 text-right">Harga Satuan</th>
                          <th className="px-3.5 py-2.5 w-36 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lineItems.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-3.5 py-2.5 text-center font-bold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="px-3.5 py-2.5">
                              <p className="font-extrabold text-slate-900">{it.description}</p>
                              {it.notes && (
                                <p className="text-[10px] text-slate-500 mt-0.5">{it.notes}</p>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-600">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-semibold">
                                {getCategoryLabel(it.category)}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-center font-bold text-slate-700">
                              {it.quantity} {it.unit}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-medium text-slate-800">
                              {selectedExpenseForPrint.currency === "SAR"
                                ? formatSAR(it.unitPrice)
                                : formatCurrency(it.unitPrice)}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-black text-slate-900">
                              {selectedExpenseForPrint.currency === "SAR"
                                ? formatSAR(it.amount)
                                : formatCurrency(it.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200">
                        {selectedExpenseForPrint.currency === "SAR" && selectedExpenseForPrint.amountForeign && (
                          <tr>
                            <td colSpan={5} className="px-3.5 py-2 font-bold text-right uppercase text-[10.5px] text-slate-600">
                              Total Pengeluaran (SAR) @ Kurs Rp {new Intl.NumberFormat("id-ID").format(selectedExpenseForPrint.exchangeRate || 0)}:
                            </td>
                            <td className="px-3.5 py-2 font-extrabold text-right text-xs text-amber-800">
                              {formatSAR(selectedExpenseForPrint.amountForeign)}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td colSpan={5} className="px-3.5 py-2.5 font-bold text-right uppercase text-[11px] text-slate-800">
                            TOTAL KESELURUHAN (IDR):
                          </td>
                          <td className="px-3.5 py-2.5 font-black text-right text-sm text-rose-700">
                            {formatCurrency(selectedExpenseForPrint.amount)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* TERBILANG RUPIAH */}
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 text-xs">
                    <span className="font-bold text-amber-900 block text-[10px] uppercase tracking-wider">
                      Terbilang Nominal Uang:
                    </span>
                    <p className="font-bold italic text-slate-800 mt-0.5">
                      &ldquo;{terbilang(selectedExpenseForPrint.amount)}&rdquo;
                    </p>
                  </div>

                  {/* LAMPIRAN BUKTI NOTA / STRUK (JIKA ADA & DICENTANG) */}
                  {showProofInPrint && (() => {
                    const pUrls = parseProofUrls(selectedExpenseForPrint.proofUrl);
                    if (pUrls.length === 0) return null;
                    return (
                      <div className="pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Camera className="w-3.5 h-3.5 text-slate-600" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            Lampiran Struk / Nota Fisik Pembelian ({pUrls.length} Lembar):
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {pUrls.map((u, i) => (
                            <div key={i} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={u} alt={`Nota #${i + 1}`} className="w-full h-32 object-contain" />
                              <div className="text-center py-0.5 text-[8.5px] font-mono text-slate-500 bg-white border-t border-slate-100">
                                Lampiran Dokumen #{i + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 3 AREA TANDA TANGAN RESMI */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="text-right text-[11px] text-slate-600 mb-2">
                      Tebing Tinggi, {formatDate(selectedExpenseForPrint.expenseDate, "dd MMMM yyyy")}
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center text-xs">
                      {/* Disetujui Oleh */}
                      <div>
                        <p className="font-semibold text-slate-600 text-[11px]">Disetujui Oleh,</p>
                        <p className="font-bold text-slate-800 text-[11px] mb-12 sm:mb-14">Pimpinan / Direktur</p>
                        <p className="font-extrabold text-slate-900 underline">
                          {selectedExpenseForPrint.approvedBy || travelSettings.directorName || "ATIYATUL AMRA"}
                        </p>
                        <p className="text-[9.5px] text-slate-500">Direktur Utama</p>
                      </div>

                      {/* Dibayar Oleh */}
                      <div>
                        <p className="font-semibold text-slate-600 text-[11px]">Dibayarkan Oleh,</p>
                        <p className="font-bold text-slate-800 text-[11px] mb-12 sm:mb-14">Kasir / Bag Keuangan</p>
                        <p className="font-extrabold text-slate-900 underline">
                          {selectedExpenseForPrint.paidBy || "Bagian Keuangan"}
                        </p>
                        <p className="text-[9.5px] text-slate-500">Staff Keuangan</p>
                      </div>

                      {/* Diterima Oleh (Dengan Opsi Materai) */}
                      <div>
                        <p className="font-semibold text-slate-600 text-[11px]">Diterima Oleh,</p>
                        <p className="font-bold text-slate-800 text-[11px] mb-2 sm:mb-2">Penerima Dana / Vendor</p>

                        {includeMeterai ? (
                          <div className="py-1 flex items-center justify-center">
                            <div
                              className="border border-dashed border-slate-400 rounded-md p-1 text-center flex flex-col items-center justify-center bg-slate-50 leading-tight select-none shadow-2xs"
                              style={{ width: "94px", height: "58px" }}
                            >
                              <span className="font-bold uppercase tracking-wider text-[7px] text-slate-600">METERAI TEMPEL</span>
                              <span className="font-black text-[10px] text-slate-900 my-0.5">Rp 10.000</span>
                              <span className="text-[6.5px] text-slate-500">Ttd & Cap Menimpa</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-12 flex items-center justify-center">
                            <span className="font-serif italic text-xs text-slate-400 font-bold border-b border-slate-300 pb-0.5">
                              [Tanda Tangan & Cap]
                            </span>
                          </div>
                        )}

                        <p className="font-extrabold text-slate-900 underline mt-1">
                          {selectedExpenseForPrint.recipientVendor || "..............................."}
                        </p>
                        <p className="text-[9.5px] text-slate-500">Penerima Dana</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* MODAL ZOOM PREVIEW BUKTI MULTI-FOTO                      */}
      {/* ======================================================== */}
      {previewProofModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md no-print">
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between p-4 bg-slate-800 text-white border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm text-slate-100">{previewProofModal.title}</h4>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono">
                  Foto {previewProofModal.activeIndex + 1} dari {previewProofModal.urls.length}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewProofModal({ isOpen: false, urls: [], activeIndex: 0, title: "" })}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 flex items-center justify-center p-4 bg-black overflow-hidden min-h-[350px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewProofModal.urls[previewProofModal.activeIndex]}
                alt={`Preview Bukti ${previewProofModal.activeIndex + 1}`}
                className="max-h-[68vh] max-w-full object-contain rounded-xl shadow-lg"
              />

              {previewProofModal.urls.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewProofModal((prev) => ({
                      ...prev,
                      activeIndex: prev.activeIndex > 0 ? prev.activeIndex - 1 : prev.urls.length - 1,
                    }))
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white cursor-pointer shadow-lg transition-transform hover:scale-110"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {previewProofModal.urls.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewProofModal((prev) => ({
                      ...prev,
                      activeIndex: prev.activeIndex < prev.urls.length - 1 ? prev.activeIndex + 1 : 0,
                    }))
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white cursor-pointer shadow-lg transition-transform hover:scale-110"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {previewProofModal.urls.length > 1 && (
              <div className="p-3 bg-slate-800/90 border-t border-slate-700 flex items-center gap-2 overflow-x-auto justify-center">
                {previewProofModal.urls.map((u, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPreviewProofModal((prev) => ({ ...prev, activeIndex: i }))}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      previewProofModal.activeIndex === i ? "border-emerald-400 scale-105 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt={`Thumb ${i + 1}`} className="w-14 h-14 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
