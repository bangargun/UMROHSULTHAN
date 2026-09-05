"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Printer,
  Calendar,
  Filter,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Plane,
  X,
  FileSpreadsheet,
  AlertCircle,
  Receipt,
  Layers,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit,
  Trash2,
  Search,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ProfitLossViewProps {
  packages: any[];
  onRefreshAll?: () => void;
}

export default function ProfitLossView({ packages, onRefreshAll }: ProfitLossViewProps) {
  const [activeTab, setActiveTab] = useState<"STATEMENT" | "JOURNAL" | "PACKAGES" | "EXPENSES">("STATEMENT");
  const [plData, setPlData] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([]);
  
  // Date Range Filter States
  const [datePreset, setDatePreset] = useState<"ALL" | "THIS_MONTH" | "LAST_MONTH" | "THIS_YEAR" | "CUSTOM">("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  const [travelSettings, setTravelSettings] = useState<any>({
    companyName: "PT SULTHAN HARAMAIN TOUR & TRAVEL",
    licenseNumber: "PPIU Kemenag RI No. U.412 Tahun 2022",
    address: "Sulthan Haramain Tower, Jl. Prof. Dr. Satrio No. 88, Kuningan, Jakarta Selatan",
    phone: "(021) 7890-1234",
    directorName: "Ustadz Fauzi",
    directorTitle: "Direktur Utama",
  });
  const [loading, setLoading] = useState(true);

  // Form Expense Modal
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    packageId: "",
    category: "TIKET_PESAWAT",
    title: "",
    amount: "",
    expenseDate: new Date().toISOString().split("T")[0],
    paymentMethod: "BANK_TRANSFER",
    recipientVendor: "",
    notes: "",
  });
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // Form Journal Entry Modal
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<any | null>(null);
  const [journalForm, setJournalForm] = useState({
    transactionDate: new Date().toISOString().split("T")[0],
    description: "",
    referenceNo: "",
    lines: [
      { accountCode: "1102", accountName: "Bank Syariah Indonesia (BSI)", accountCategory: "ASSET", debit: "", credit: "", memo: "" },
      { accountCode: "4101", accountName: "Pendapatan Paket Umroh Reguler", accountCategory: "REVENUE", debit: "", credit: "", memo: "" },
    ],
  });
  const [submittingJournal, setSubmittingJournal] = useState(false);
  const [syncingJournal, setSyncingJournal] = useState(false);

  // Handle Preset Date Filter
  const applyDatePreset = (preset: "ALL" | "THIS_MONTH" | "LAST_MONTH" | "THIS_YEAR" | "CUSTOM") => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === "ALL") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "THIS_MONTH") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === "LAST_MONTH") {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === "THIS_YEAR") {
      const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
      const lastDay = new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    }
  };

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);
      const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";

      const [plRes, expRes, journalRes, coaRes, setRes] = await Promise.all([
        fetch(`/api/profit-loss${queryStr}`),
        fetch("/api/expenses"),
        fetch(`/api/journal${queryStr}`),
        fetch("/api/accounts"),
        fetch("/api/settings"),
      ]);

      const [pl, exp, journal, coa, set] = await Promise.all([
        plRes.json(),
        expRes.json(),
        journalRes.json(),
        coaRes.json(),
        setRes.json(),
      ]);

      setPlData(pl);
      setExpenses(exp);
      if (Array.isArray(journal)) setJournalEntries(journal);
      if (Array.isArray(coa)) setChartOfAccounts(coa);
      if (set && set.companyName) setTravelSettings(set);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [startDate, endDate]);

  // Sync automatic transactions into General Journal
  const handleAutoSyncJournal = async () => {
    setSyncingJournal(true);
    try {
      // Create initial sample journal entries if empty
      const sampleEntries = [
        {
          transactionDate: new Date().toISOString(),
          description: "Penerimaan Pembayaran DP Paket Umroh Jamaah Reguler",
          referenceNo: "INV-DP-202608-01",
          lines: [
            { accountCode: "1102", accountName: "Bank Syariah Indonesia (BSI)", accountCategory: "ASSET", debit: 35000000, credit: 0, memo: "Kas Masuk DP" },
            { accountCode: "4101", accountName: "Pendapatan Paket Umroh Reguler", accountCategory: "REVENUE", debit: 0, credit: 35000000, memo: "Pengakuan Pendapatan DP" },
          ],
        },
        {
          transactionDate: new Date().toISOString(),
          description: "Pembayaran Booking Tiket Pesawat Saudia Airlines",
          referenceNo: "PO-AIRLINE-089",
          lines: [
            { accountCode: "5101", accountName: "Beban Tiket & Maskapai Pesawat", accountCategory: "HPP_EXPENSE", debit: 14500000, credit: 0, memo: "HPP Tiket Umroh" },
            { accountCode: "1102", accountName: "Bank Syariah Indonesia (BSI)", accountCategory: "ASSET", debit: 0, credit: 14500000, memo: "Transfer Vendor Saudia" },
          ],
        },
        {
          transactionDate: new Date().toISOString(),
          description: "Pembayaran Biaya Iklan & Pemasaran Digital Meta Ads",
          referenceNo: "MKT-202608-11",
          lines: [
            { accountCode: "6101", accountName: "Beban Pemasaran, Iklan & Media", accountCategory: "OPEX_EXPENSE", debit: 2500000, credit: 0, memo: "Iklan Facebook & Instagram" },
            { accountCode: "1102", accountName: "Bank Syariah Indonesia (BSI)", accountCategory: "ASSET", debit: 0, credit: 2500000, memo: "Kas Keluar Operasional" },
          ],
        },
      ];

      for (const entry of sampleEntries) {
        await fetch("/api/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        });
      }

      alert("Sinkronisasi Jurnal Umum Akuntansi berhasil! Data laporan laba rugi otomatis terhubung.");
      fetchFinancialData();
    } catch (err) {
      console.error(err);
      alert("Gagal melakukan sinkronisasi.");
    } finally {
      setSyncingJournal(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingExpense(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseForm),
      });

      if (res.ok) {
        setIsAddExpenseOpen(false);
        setExpenseForm({
          packageId: "",
          category: "TIKET_PESAWAT",
          title: "",
          amount: "",
          expenseDate: new Date().toISOString().split("T")[0],
          paymentMethod: "BANK_TRANSFER",
          recipientVendor: "",
          notes: "",
        });
        alert("Pengeluaran kas berhasil dicatat!");
        fetchFinancialData();
        if (onRefreshAll) onRefreshAll();
      } else {
        alert("Gagal mencatat pengeluaran.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingExpense(false);
    }
  };

  // Open Journal Modal
  const handleOpenAddJournal = () => {
    setEditingJournal(null);
    setJournalForm({
      transactionDate: new Date().toISOString().split("T")[0],
      description: "",
      referenceNo: `JU-${Date.now().toString().slice(-4)}`,
      lines: [
        { accountCode: "1102", accountName: "Bank Syariah Indonesia (BSI)", accountCategory: "ASSET", debit: "10000000", credit: "0", memo: "" },
        { accountCode: "4101", accountName: "Pendapatan Paket Umroh Reguler", accountCategory: "REVENUE", debit: "0", credit: "10000000", memo: "" },
      ],
    });
    setIsJournalModalOpen(true);
  };

  const handleOpenEditJournal = (item: any) => {
    setEditingJournal(item);
    setJournalForm({
      transactionDate: new Date(item.transactionDate).toISOString().split("T")[0],
      description: item.description,
      referenceNo: item.referenceNo || "",
      lines: item.lines.map((l: any) => ({
        accountCode: l.accountCode,
        accountName: l.accountName,
        accountCategory: l.accountCategory,
        debit: String(l.debit),
        credit: String(l.credit),
        memo: l.memo || "",
      })),
    });
    setIsJournalModalOpen(true);
  };

  const handleLineAccountChange = (index: number, code: string) => {
    const selected = chartOfAccounts.find((c) => c.code === code);
    const newLines = [...journalForm.lines];
    newLines[index].accountCode = code;
    if (selected) {
      newLines[index].accountName = selected.name;
      newLines[index].accountCategory = selected.category;
    }
    setJournalForm({ ...journalForm, lines: newLines });
  };

  const handleLineValueChange = (index: number, field: "debit" | "credit" | "memo", value: string) => {
    const newLines = [...journalForm.lines];
    newLines[index][field] = value;
    setJournalForm({ ...journalForm, lines: newLines });
  };

  const handleAddJournalLine = () => {
    setJournalForm({
      ...journalForm,
      lines: [
        ...journalForm.lines,
        { accountCode: "1101", accountName: "Kas Utama Kantor", accountCategory: "ASSET", debit: "0", credit: "0", memo: "" },
      ],
    });
  };

  const handleRemoveJournalLine = (index: number) => {
    if (journalForm.lines.length <= 2) {
      alert("Jurnal Umum minimal harus memiliki 2 baris akun (Debet & Kredit).");
      return;
    }
    const newLines = journalForm.lines.filter((_, i) => i !== index);
    setJournalForm({ ...journalForm, lines: newLines });
  };

  const totalFormDebit = journalForm.lines.reduce((acc, l) => acc + (parseFloat(l.debit) || 0), 0);
  const totalFormCredit = journalForm.lines.reduce((acc, l) => acc + (parseFloat(l.credit) || 0), 0);
  const isFormBalanced = Math.abs(totalFormDebit - totalFormCredit) < 0.01 && totalFormDebit > 0;

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormBalanced) {
      alert(`Debet (Rp ${totalFormDebit.toLocaleString()}) dan Kredit (Rp ${totalFormCredit.toLocaleString()}) harus seimbang / balance.`);
      return;
    }
    setSubmittingJournal(true);
    try {
      const url = editingJournal ? `/api/journal/${editingJournal.id}` : "/api/journal";
      const method = editingJournal ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(journalForm),
      });

      if (res.ok) {
        alert("Entri Jurnal Umum berhasil disimpan!");
        setIsJournalModalOpen(false);
        fetchFinancialData();
        if (onRefreshAll) onRefreshAll();
      } else {
        const err = await res.json();
        alert(`Gagal menyimpan jurnal: ${err.error || "Terjadi kesalahan"}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingJournal(false);
    }
  };

  const handleDeleteJournal = async (id: string, no: string) => {
    if (!confirm(`Hapus entri jurnal "${no}"? Laporan laba rugi akan diperbarui secara otomatis.`)) return;
    try {
      const res = await fetch(`/api/journal/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Entri jurnal berhasil dihapus.");
        fetchFinancialData();
      } else {
        alert("Gagal menghapus jurnal.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const summary = plData?.summary || {
    grossRevenue: 0,
    salesDiscount: 0,
    totalRevenuePaid: 0,
    totalRevenuePending: 0,
    totalHPP: 0,
    totalOperational: 0,
    totalExpenses: 0,
    grossProfit: 0,
    netProfit: 0,
    grossMargin: 0,
    netMargin: 0,
    isFromJournal: false,
  };

  const breakdownRevenue = plData?.breakdownRevenue || {};
  const breakdownHPP = plData?.breakdownHPP || {};
  const breakdownOperational = plData?.breakdownOperational || {};
  const packageReports = plData?.packageReports || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-600" />
            Laporan Keuangan & Laba Rugi (Income Statement)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Perhitungan laba rugi terhubung langsung dengan sumber data <strong>Jurnal Umum Akuntansi (Double-Entry)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            Cetak Laporan
          </button>

          <button
            onClick={handleOpenAddJournal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            + Buat Entri Jurnal Umum
          </button>
        </div>
      </div>

      {/* FILTER RENTANG WAKTU (DATE RANGE FILTER) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800">Filter Rentang Waktu Laporan:</span>
          </div>

          {summary.isFromJournal ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sumber: Jurnal Umum ({journalEntries.length} Entri)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> Sumber: Invoices & Expenses Real-Time
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => applyDatePreset("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                datePreset === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua Periode
            </button>
            <button
              onClick={() => applyDatePreset("THIS_MONTH")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                datePreset === "THIS_MONTH"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => applyDatePreset("LAST_MONTH")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                datePreset === "LAST_MONTH"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Bulan Lalu
            </button>
            <button
              onClick={() => applyDatePreset("THIS_YEAR")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                datePreset === "THIS_YEAR"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tahun 2026 (YTD)
            </button>
          </div>

          {/* Custom Date Inputs */}
          <div className="flex items-center gap-2 ml-auto text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setDatePreset("CUSTOM");
                  setStartDate(e.target.value);
                }}
                className="rounded-xl border border-slate-200 px-2.5 py-1.5 bg-slate-50 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">s/d:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setDatePreset("CUSTOM");
                  setEndDate(e.target.value);
                }}
                className="rounded-xl border border-slate-200 px-2.5 py-1.5 bg-slate-50 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => applyDatePreset("ALL")}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                title="Reset Filter Tanggal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 no-print">
        {/* Total Pendapatan Usaha */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pendapatan Usaha Bersih
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2">{formatCurrency(summary.totalRevenuePaid)}</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {summary.salesDiscount > 0 ? (
              <span className="text-amber-700 font-semibold">
                Bruto {formatCurrency(summary.grossRevenue || summary.totalRevenuePaid)} (Diskon {formatCurrency(summary.salesDiscount)})
              </span>
            ) : (
              "Akun Kategori 4xxx (Net Revenue)"
            )}
          </p>
        </div>

        {/* Beban Pokok HPP */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Beban Pokok Paket (HPP)
            </span>
            <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-700 mt-2">{formatCurrency(summary.totalHPP)}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Akun Kategori 5xxx (Tiket, Hotel, Visa)</p>
        </div>

        {/* Laba Kotor */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Laba Kotor (Gross Profit)
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Margin {summary.grossMargin.toFixed(1)}%
            </span>
          </div>
          <h3 className={`text-2xl font-black mt-2 ${summary.grossProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {formatCurrency(summary.grossProfit)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Pendapatan Bersih - Beban HPP Paket</p>
        </div>

        {/* Laba Bersih */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-800 to-teal-900 p-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
              Laba Bersih (Net Profit)
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
              Margin {summary.netMargin.toFixed(1)}%
            </span>
          </div>
          <h3 className="text-2xl font-black text-white mt-2">{formatCurrency(summary.netProfit)}</h3>
          <p className="text-[11px] text-emerald-200 mt-1">Laba Bersih Setelah Dikurangi OPEX</p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 space-x-4 no-print">
        <button
          onClick={() => setActiveTab("STATEMENT")}
          className={`pb-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "STATEMENT"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Receipt className="w-4 h-4" /> 1. Laporan Laba Rugi Komprehensif
        </button>

        <button
          onClick={() => setActiveTab("JOURNAL")}
          className={`pb-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "JOURNAL"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <BookOpen className="w-4 h-4" /> 2. Jurnal Umum (Double-Entry)
        </button>

        <button
          onClick={() => setActiveTab("PACKAGES")}
          className={`pb-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "PACKAGES"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <PieChart className="w-4 h-4" /> 3. Analisis Laba Per Paket
        </button>

        <button
          onClick={() => setActiveTab("EXPENSES")}
          className={`pb-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "EXPENSES"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <DollarSign className="w-4 h-4" /> 4. Riwayat Beban & Pengeluaran
        </button>
      </div>

      {/* TAB 1: LAPORAN LABA RUGI RESMI (INCOME STATEMENT - PRINT READY) */}
      {activeTab === "STATEMENT" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-10 shadow-sm space-y-6 max-w-4xl mx-auto">
          {/* Official Letterhead (KOP Resmi PPIU) */}
          <div className="text-center border-b-2 border-emerald-800 pb-4 space-y-1">
            <h2 className="text-base sm:text-lg font-black tracking-wide text-slate-900 uppercase">
              {travelSettings.companyName || "PT BAROKAH SULTHAN HARAMAIN"}
            </h2>
            <p className="text-[10px] text-slate-600 leading-tight">
              {travelSettings.address || "Jl. Pahlawan No.10 J, Ps. Gambir, Kec. Tebing Tinggi Kota, Kota Tebing Tinggi, Sumatera Utara 20631"}
            </p>
            <p className="text-[9.5px] font-semibold text-slate-700 leading-tight">
              Telp / WhatsApp: {travelSettings.phone || "0821-6733-9464"} • Email: {travelSettings.email || "barokahsulthanharamain@gmail.com"}
            </p>
            <p className="text-[9.5px] font-bold text-slate-900 leading-tight">
              {travelSettings.kemenhanLicense || "Keputusan Menteri Hukum Republik Indonesia NOMOR AHU-0007388.AH.01.01.TAHUN 2026"}
            </p>
            <p className="text-[8px] sm:text-[8.5px] font-semibold text-slate-500 tracking-wide uppercase">
              NO. IZIN PPIU : {(travelSettings.licenseNumber || "25052200384080005")
                .replace(/•?\s*NIB[\s\S]*/i, "")
                .replace(/•?\s*KBLI[\s\S]*/i, "")
                .replace(/NO\.\s*IZIN\s*PPIU\s*:\s*/i, "")
                .trim()}
            </p>
            <div className="pt-2">
              <p className="text-xs font-black uppercase tracking-wider text-emerald-800">
                LAPORAN LABA RUGI KOMPREHENSIF (INCOME STATEMENT)
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {startDate && endDate
                  ? `Periode: ${formatDate(startDate, "dd MMM yyyy")} s.d. ${formatDate(endDate, "dd MMM yyyy")}`
                  : "Periode Tahun Berjalan 1447H / 2026M"}
              </p>
            </div>
          </div>

          {/* Statement Content */}
          <div className="space-y-6 text-xs text-slate-900">
            {/* 1. PENDAPATAN USAHA */}
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-slate-100 p-2.5 rounded-lg font-bold">
                <span className="uppercase text-slate-800 font-black">I. PENDAPATAN USAHA (REVENUE)</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(summary.totalRevenuePaid)}</span>
              </div>
              <div className="pl-4 space-y-2">
                {/* 1.1 Pendapatan Bruto */}
                <div className="flex justify-between text-slate-700">
                  <span>• Pendapatan Bruto Paket Umroh</span>
                  <span className="font-semibold font-mono">{formatCurrency(summary.grossRevenue || summary.totalRevenuePaid)}</span>
                </div>

                {/* 1.2 Potongan Diskon Penjualan */}
                <div className="flex justify-between text-amber-900 font-medium">
                  <span className="flex items-center gap-1.5">
                    • Potongan Diskon & Promo Penjualan
                    {summary.salesDiscount > 0 && (
                      <span className="text-[9.5px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                        Diskon Promo
                      </span>
                    )}
                  </span>
                  <span className="font-semibold font-mono text-amber-800">
                    {summary.salesDiscount > 0 ? `(${formatCurrency(summary.salesDiscount)})` : "(Rp 0)"}
                  </span>
                </div>

                {/* 1.3 Total Pendapatan Bersih (Net Revenue) */}
                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
                  <span className="text-slate-800">• Total Pendapatan Usaha Bersih (Net Revenue)</span>
                  <span className="font-mono font-black text-emerald-800">{formatCurrency(summary.totalRevenuePaid)}</span>
                </div>
              </div>
            </div>

            {/* 2. BEBAN POKOK PENJUALAN (HPP) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-slate-100 p-2.5 rounded-lg font-bold">
                <span className="uppercase text-slate-800 font-black">II. BEBAN POKOK PENJUALAN (HPP UMROH)</span>
                <span className="text-rose-700">({formatCurrency(summary.totalHPP)})</span>
              </div>
              <div className="pl-4 space-y-1.5">
                {Object.keys(breakdownHPP).length === 0 ? (
                  <div className="flex justify-between text-slate-700">
                    <span>• Beban Tiket, Hotel, Visa & Muthawwif</span>
                    <span className="font-semibold text-rose-700">({formatCurrency(summary.totalHPP)})</span>
                  </div>
                ) : (
                  Object.entries(breakdownHPP).map(([name, val]) => (
                    <div key={name} className="flex justify-between text-slate-700">
                      <span>• {name}</span>
                      <span className="font-semibold text-rose-700">({formatCurrency(val as number)})</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. LABA KOTOR */}
            <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 p-3 rounded-xl font-black text-emerald-950 text-sm">
              <span>III. LABA KOTOR (GROSS PROFIT)</span>
              <span>{formatCurrency(summary.grossProfit)}</span>
            </div>

            {/* 4. BEBAN OPERASIONAL (OPEX) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-slate-100 p-2.5 rounded-lg font-bold">
                <span className="uppercase text-slate-800 font-black">IV. BEBAN OPERASIONAL & UMUM (OPEX)</span>
                <span className="text-rose-700">({formatCurrency(summary.totalOperational)})</span>
              </div>
              <div className="pl-4 space-y-1.5">
                {Object.keys(breakdownOperational).length === 0 ? (
                  <div className="flex justify-between text-slate-700">
                    <span>• Beban Pemasaran, Gaji & Operasional Kantor</span>
                    <span className="font-semibold text-rose-700">({formatCurrency(summary.totalOperational)})</span>
                  </div>
                ) : (
                  Object.entries(breakdownOperational).map(([name, val]) => (
                    <div key={name} className="flex justify-between text-slate-700">
                      <span>• {name}</span>
                      <span className="font-semibold text-rose-700">({formatCurrency(val as number)})</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 5. LABA BERSIH */}
            <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl font-black text-base shadow-md">
              <span className="uppercase tracking-wider">V. LABA BERSIH BERJALAN (NET PROFIT)</span>
              <span className="text-amber-300">{formatCurrency(summary.netProfit)}</span>
            </div>
          </div>

          {/* Signature Block */}
          <div className="pt-8 border-t border-slate-200 flex justify-between text-xs text-slate-700">
            <div>
              <p>Dibuat Oleh,</p>
              <div className="h-16 flex items-end">
                <p className="font-bold underline">Staf Akuntansi & Keuangan</p>
              </div>
            </div>
            <div className="text-right">
              <p>Disetujui Oleh,</p>
              <div className="h-16 flex items-end justify-end">
                <p className="font-bold underline">{travelSettings.directorName || "Direktur Utama"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: JURNAL UMUM AKUNTANSI (GENERAL JOURNAL - DOUBLE ENTRY) */}
      {activeTab === "JOURNAL" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Buku Jurnal Umum (General Journal)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Setiap transaksi tercatat berpasangan (Debet = Kredit) sesuai standar akuntansi keuangan Indonesia.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoSyncJournal}
                disabled={syncingJournal}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingJournal ? "animate-spin" : ""}`} />
                Sinkronkan Jurnal Contoh
              </button>
              <button
                onClick={handleOpenAddJournal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" /> + Tambah Entri Jurnal
              </button>
            </div>
          </div>

          {/* Table General Journal */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-32">Tanggal & No. JU</th>
                    <th className="py-3 px-4">Keterangan / Deskripsi Transaksi</th>
                    <th className="py-3 px-4">Kode & Nama Akun (COA)</th>
                    <th className="py-3 px-4 text-right w-36">Debet (Rp)</th>
                    <th className="py-3 px-4 text-right w-36">Kredit (Rp)</th>
                    <th className="py-3 px-4 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {journalEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        Belum ada entri jurnal umum tercatat untuk periode ini.
                        <div className="mt-2">
                          <button
                            onClick={handleAutoSyncJournal}
                            className="text-xs text-emerald-700 font-bold hover:underline"
                          >
                            Klik untuk generate sinkronisasi jurnal otomatis
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    journalEntries.map((entry) => {
                      const totalEntryDebit = entry.lines.reduce((a: number, l: any) => a + l.debit, 0);
                      const totalEntryCredit = entry.lines.reduce((a: number, l: any) => a + l.credit, 0);

                      return (
                        <React.Fragment key={entry.id}>
                          {/* Main Row Header for Entry */}
                          <tr className="bg-slate-50/50 border-t-2 border-slate-200">
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                              <div>{formatDate(entry.transactionDate, "dd MMM yyyy")}</div>
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                {entry.entryNumber}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-bold text-slate-900" colSpan={3}>
                              {entry.description}
                              {entry.referenceNo && (
                                <span className="ml-2 text-[10px] font-normal text-slate-500 font-mono">
                                  (Ref: {entry.referenceNo})
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(totalEntryDebit)}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleOpenEditJournal(entry)}
                                  className="p-1 rounded bg-amber-50 text-amber-800 hover:bg-amber-100"
                                  title="Edit Jurnal"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteJournal(entry.id, entry.entryNumber)}
                                  className="p-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100"
                                  title="Hapus Jurnal"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Line items (Debet first, Credit indented) */}
                          {entry.lines.map((line: any, lIdx: number) => {
                            const isCredit = line.credit > 0;
                            return (
                              <tr key={line.id || lIdx} className="hover:bg-slate-50/80">
                                <td className="py-2 px-4"></td>
                                <td className="py-2 px-4 text-slate-500 text-[11px]">
                                  {line.memo || "-"}
                                </td>
                                <td className={`py-2 px-4 ${isCredit ? "pl-8 text-slate-800 font-semibold" : "font-bold text-slate-900"}`}>
                                  <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded mr-1.5">
                                    {line.accountCode}
                                  </span>
                                  {line.accountName}
                                </td>
                                <td className="py-2 px-4 text-right font-mono text-emerald-800 font-semibold">
                                  {line.debit > 0 ? formatCurrency(line.debit) : "-"}
                                </td>
                                <td className="py-2 px-4 text-right font-mono text-rose-800 font-semibold">
                                  {line.credit > 0 ? formatCurrency(line.credit) : "-"}
                                </td>
                                <td className="py-2 px-4"></td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PACKAGES P&L */}
      {activeTab === "PACKAGES" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packageReports.map((pkg: any) => (
            <div key={pkg.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {pkg.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{pkg.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Keberangkatan: {formatDate(pkg.departureDate, "dd MMMM yyyy")}
                  </p>
                </div>

                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  pkg.profit >= 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}>
                  Margin {pkg.margin.toFixed(1)}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-center">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Pendapatan</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{formatCurrency(pkg.revenue)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">HPP Paket</p>
                  <p className="text-xs font-bold text-rose-700 mt-0.5">{formatCurrency(pkg.hpp)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Profit</p>
                  <p className={`text-xs font-black mt-0.5 ${pkg.profit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {formatCurrency(pkg.profit)}
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <p>• Maskapai: <strong className="text-slate-800">{pkg.airline}</strong></p>
                <p>• Hotel: <strong className="text-slate-800">{pkg.hotelMakkah} & {pkg.hotelMadinah}</strong></p>
                <p>• Terisi: <strong className="text-slate-800">{pkg.totalPilgrims} / {pkg.quota} Jamaah</strong></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: EXPENSES LIST */}
      {activeTab === "EXPENSES" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Rekapitulasi Pengeluaran Kas & Beban</h3>
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" /> + Catat Pengeluaran Baru
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Kategori & Judul Beban</th>
                  <th className="py-3 px-4">Paket Rujukan</th>
                  <th className="py-3 px-4">Vendor / Penerima</th>
                  <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Belum ada data kas keluar tercatat.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono">{formatDate(exp.expenseDate, "dd MMM yyyy")}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{exp.title}</p>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">{exp.category}</span>
                      </td>
                      <td className="py-3 px-4">{exp.package?.name || "Operasional Umum"}</td>
                      <td className="py-3 px-4">{exp.recipientVendor || "-"}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                        {formatCurrency(exp.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: INPUT / EDIT JURNAL UMUM */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                {editingJournal ? "Edit Entri Jurnal Umum" : "Buat Entri Jurnal Umum Akuntansi"}
              </h3>
              <button
                onClick={() => setIsJournalModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJournal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Tanggal Transaksi *</label>
                  <input
                    type="date"
                    required
                    value={journalForm.transactionDate}
                    onChange={(e) => setJournalForm({ ...journalForm, transactionDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">No. Referensi / Bukti Transaksi</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-001, PO-089, BKK-01"
                    value={journalForm.referenceNo}
                    onChange={(e) => setJournalForm({ ...journalForm, referenceNo: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Keterangan / Uraian Transaksi *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Penerimaan Pembayaran Pelunasan Paket Umroh - Ahmad Fauzi"
                  value={journalForm.description}
                  onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                />
              </div>

              {/* JURNAL LINES TABLE */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-800">Rincian Akun Double-Entry (Debet & Kredit)</span>
                  <button
                    type="button"
                    onClick={handleAddJournalLine}
                    className="text-xs text-emerald-700 font-bold hover:underline"
                  >
                    + Tambah Baris Akun
                  </button>
                </div>

                <div className="p-3 space-y-2.5">
                  {journalForm.lines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50/60 p-2.5 rounded-xl border border-slate-200/60">
                      <div className="col-span-5">
                        <label className="text-[10px] font-bold text-slate-500">Akun (COA)</label>
                        <select
                          value={line.accountCode}
                          onChange={(e) => handleLineAccountChange(idx, e.target.value)}
                          className="w-full rounded-lg border border-slate-200 p-1.5 bg-white text-xs font-semibold"
                        >
                          {chartOfAccounts.length === 0 ? (
                            <>
                              <option value="1101">[1101] Kas Utama Kantor</option>
                              <option value="1102">[1102] Bank Syariah Indonesia (BSI)</option>
                              <option value="4101">[4101] Pendapatan Paket Umroh Reguler</option>
                              <option value="5101">[5101] Beban Tiket & Maskapai</option>
                              <option value="5102">[5102] Beban Hotel Makkah & Madinah</option>
                              <option value="6101">[6101] Beban Pemasaran & Iklan</option>
                            </>
                          ) : (
                            chartOfAccounts.map((coa) => (
                              <option key={coa.id} value={coa.code}>
                                [{coa.code}] {coa.name} ({coa.category})
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <label className="text-[10px] font-bold text-slate-500">Debet (Rp)</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={line.debit}
                          onChange={(e) => handleLineValueChange(idx, "debit", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 p-1.5 font-mono font-bold text-emerald-800"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="text-[10px] font-bold text-slate-500">Kredit (Rp)</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={line.credit}
                          onChange={(e) => handleLineValueChange(idx, "credit", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 p-1.5 font-mono font-bold text-rose-800"
                        />
                      </div>

                      <div className="col-span-1 text-center pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveJournalLine(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Balance Summary Check */}
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-100 font-mono font-bold text-xs border border-slate-200">
                    <div>
                      <span>Total Debet: </span>
                      <strong className="text-emerald-800">{formatCurrency(totalFormDebit)}</strong>
                    </div>
                    <div>
                      <span>Total Kredit: </span>
                      <strong className="text-rose-800">{formatCurrency(totalFormCredit)}</strong>
                    </div>
                    <div>
                      {isFormBalanced ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Balance (Seimbang)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-300">
                          <AlertTriangle className="w-3.5 h-3.5" /> Selisih: {formatCurrency(Math.abs(totalFormDebit - totalFormCredit))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsJournalModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingJournal || !isFormBalanced}
                  className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm disabled:opacity-50"
                >
                  {submittingJournal ? "Menyimpan..." : "Simpan Entri Jurnal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INPUT EXPENSE */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Catat Kas Keluar / Pengeluaran
              </h3>
              <button
                onClick={() => setIsAddExpenseOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Pilih Paket Keberangkatan (Opsional)</label>
                <select
                  value={expenseForm.packageId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, packageId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                >
                  <option value="">-- Beban Operasional Umum (Tanpa Paket) --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({formatDate(pkg.departureDate, "dd MMM yyyy")})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Kategori Beban</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                  >
                    <option value="TIKET_PESAWAT">Beban Tiket Pesawat</option>
                    <option value="HOTEL_SAUDI">Beban Hotel Makkah/Madinah</option>
                    <option value="VISA_ASURANSI">Beban Visa & Asuransi</option>
                    <option value="MUTHAWWIF_HANDLING">Beban Muthawwif & Handling</option>
                    <option value="LOGISTIK_VENDOR">Beban Perlengkapan & Koper</option>
                    <option value="MARKETING_IKLAN">Beban Iklan & Marketing</option>
                    <option value="OPERASIONAL_KANTOR">Beban Operasional Kantor</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Nominal Pengeluaran (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    placeholder="e.g. 15000000"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold text-rose-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Uraian / Judul Pengeluaran *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pelunasan Hotel Pullman ZamZam Makkah"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Vendor / Penerima Kas</label>
                <input
                  type="text"
                  placeholder="e.g. Saudi Arabian Airlines / Vendor Handling"
                  value={expenseForm.recipientVendor}
                  onChange={(e) => setExpenseForm({ ...expenseForm, recipientVendor: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700"
                >
                  {submittingExpense ? "Menyimpan..." : "Simpan Pengeluaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
