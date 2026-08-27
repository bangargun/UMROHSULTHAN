"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Zap,
  Calculator,
  CheckCircle2,
  DollarSign,
  RefreshCw,
  Save,
  Key,
  ShieldCheck,
  Building,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PaymentGatewayViewProps {
  invoices: any[];
  onRefresh: () => void;
}

export default function PaymentGatewayView({ invoices, onRefresh }: PaymentGatewayViewProps) {
  const [activeTab, setActiveTab] = useState<"SETTINGS" | "WEBHOOK" | "CALCULATOR">("SETTINGS");
  const [config, setConfig] = useState<any>({
    provider: "MIDTRANS",
    merchantId: "",
    clientKey: "",
    serverKey: "",
    isSandbox: true,
    activeChannelsJson: JSON.stringify(["BSI_VA", "MANDIRI_VA", "BCA_VA", "QRIS"]),
  });
  const [isSaving, setIsSaving] = useState(false);

  // Webhook Simulator State
  const [simInvoiceNumber, setSimInvoiceNumber] = useState("");
  const [simPaymentType, setSimPaymentType] = useState("BSI_VA");
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [isTriggering, setIsTriggering] = useState(false);

  // Multi-Currency Calculator State
  const [sarRate, setSarRate] = useState("4250"); // 1 SAR = Rp 4.250
  const [usdRate, setUsdRate] = useState("16200"); // 1 USD = Rp 16.200

  // Cost items per pax
  const [hotelMakkahSar, setHotelMakkahSar] = useState("1800");
  const [hotelMadinahSar, setHotelMadinahSar] = useState("1200");
  const [busHandlingSar, setBusHandlingSar] = useState("450");
  const [mutawwifSar, setMutawwifSar] = useState("150");
  const [visaUsd, setVisaUsd] = useState("280");
  const [flightTicketIdr, setFlightTicketIdr] = useState("13500000");

  const loadConfig = async () => {
    try {
      const res = await fetch("/api/payment-gateway/settings");
      if (res.ok) {
        setConfig(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/payment-gateway/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        alert("Konfigurasi Payment Gateway berhasil disimpan!");
        loadConfig();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerWebhook = async () => {
    if (!simInvoiceNumber) {
      alert("Pilih nomor invoice terlebih dahulu.");
      return;
    }
    setIsTriggering(true);
    try {
      const res = await fetch("/api/payment-gateway/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: simInvoiceNumber,
          transactionStatus: "settlement",
          paymentType: simPaymentType,
          settlementTime: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      setWebhookLogs((prev) => [
        {
          time: new Date().toLocaleTimeString(),
          invoice: simInvoiceNumber,
          channel: simPaymentType,
          status: res.ok ? "SUCCESS_PAID" : "FAILED",
          msg: data.message || data.error,
        },
        ...prev,
      ]);
      if (res.ok) {
        alert(data.message || "Pembayaran berhasil diproses dan dijurnal otomatis!");
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTriggering(false);
    }
  };

  // Calculations
  const rateSar = parseFloat(sarRate) || 0;
  const rateUsd = parseFloat(usdRate) || 0;

  const totalSar =
    (parseFloat(hotelMakkahSar) || 0) +
    (parseFloat(hotelMadinahSar) || 0) +
    (parseFloat(busHandlingSar) || 0) +
    (parseFloat(mutawwifSar) || 0);

  const totalSarInIdr = totalSar * rateSar;
  const totalVisaInIdr = (parseFloat(visaUsd) || 0) * rateUsd;
  const ticketIdr = parseFloat(flightTicketIdr) || 0;
  const totalHppPerPax = totalSarInIdr + totalVisaInIdr + ticketIdr;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-100 backdrop-blur-sm">
                <CreditCard className="w-3.5 h-3.5" /> Fintech & Payment Gateway
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Virtual Account & Rekonsiliasi Otomatis
            </h2>
            <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl">
              Penerimaan pembayaran DP & Pelunasan via Virtual Account Bank Syariah (BSI, BCA, Mandiri, QRIS) dengan pencatatan jurnal umum otomatis.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/30">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-100">
              Auto-Reconciliation: Aktif
            </span>
          </div>
        </div>
      </div>

      {/* SubTabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs">
        <button
          onClick={() => setActiveTab("SETTINGS")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "SETTINGS" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <CreditCard className="w-4 h-4" /> Pengaturan Gateway & VA
        </button>
        <button
          onClick={() => setActiveTab("WEBHOOK")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "WEBHOOK" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Zap className="w-4 h-4" /> Uji Coba Webhook Real-Time
        </button>
        <button
          onClick={() => setActiveTab("CALCULATOR")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "CALCULATOR" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Calculator className="w-4 h-4" /> Kalkulator Multi-Currency SAR/USD
        </button>
      </div>

      {/* TAB 1: SETTINGS */}
      {activeTab === "SETTINGS" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs max-w-2xl">
          <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-600" />
            Konfigurasi Midtrans / Xendit Gateway
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Provider Gateway</label>
              <select
                value={config.provider}
                onChange={(e) => setConfig({ ...config, provider: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                <option value="MIDTRANS">Midtrans Payment Gateway</option>
                <option value="XENDIT">Xendit Syariah Gateway</option>
                <option value="DUITKU">Duitku VA Direct</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Merchant ID</label>
                <input
                  type="text"
                  placeholder="G-XXXXXX"
                  value={config.merchantId || ""}
                  onChange={(e) => setConfig({ ...config, merchantId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Client Key</label>
                <input
                  type="password"
                  placeholder="SB-Mid-client-XXXXX"
                  value={config.clientKey || ""}
                  onChange={(e) => setConfig({ ...config, clientKey: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Server Key / Secret</label>
              <input
                type="password"
                placeholder="SB-Mid-server-XXXXX"
                value={config.serverKey || ""}
                onChange={(e) => setConfig({ ...config, serverKey: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                id="isSandbox"
                checked={config.isSandbox}
                onChange={(e) => setConfig({ ...config, isSandbox: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <label htmlFor="isSandbox" className="text-xs font-bold text-slate-800 cursor-pointer">
                Mode Sandbox / Testing (Gunakan untuk simulasi pembayaran tanpa uang riil)
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> Simpan Pengaturan Gateway
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: WEBHOOK SIMULATOR */}
      {activeTab === "WEBHOOK" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              Simulasi Penerimaan Webhook Pembayaran
            </h3>
            <p className="text-xs text-slate-500">
              Uji coba rekonsiliasi instan: Saat webhook diterima, invoice otomatis Lunas dan tercatat di Jurnal Kas Masuk.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Tagihan / Invoice</label>
              <select
                value={simInvoiceNumber}
                onChange={(e) => setSimInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                <option value="">-- Pilih Invoice Jamaah --</option>
                {invoices
                  .filter((i) => i.status === "PENDING")
                  .map((inv) => (
                    <option key={inv.id} value={inv.invoiceNumber}>
                      {inv.invoiceNumber} - {inv.pilgrim?.name} ({formatCurrency(inv.amount)})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Saluran Pembayaran</label>
              <select
                value={simPaymentType}
                onChange={(e) => setSimPaymentType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                <option value="BSI_VA">BSI Virtual Account</option>
                <option value="MANDIRI_VA">Mandiri Virtual Account</option>
                <option value="BCA_VA">BCA Virtual Account</option>
                <option value="QRIS">QRIS Syariah</option>
              </select>
            </div>

            <button
              onClick={handleTriggerWebhook}
              disabled={isTriggering}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" /> Eksekusi Webhook Settlement (Pelunasan Otomatis)
            </button>
          </div>

          {/* Webhook Logs */}
          <div className="bg-slate-900 rounded-2xl p-6 shadow-xs text-white space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-emerald-400">Webhook Live Audit Logs</span>
              <span className="text-[10px] text-slate-500">Auto-Reconciliation</span>
            </div>

            {webhookLogs.length === 0 ? (
              <p className="text-slate-500 italic text-[11px] pt-4 text-center">
                Belum ada simulasi webhook yang dijalankan.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {webhookLogs.map((log, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-amber-400 font-bold">{log.invoice}</span>
                      <span className="text-slate-400">{log.time}</span>
                    </div>
                    <p className="text-[11px] text-emerald-300">{log.msg}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CALCULATOR MULTI-CURRENCY */}
      {activeTab === "CALCULATOR" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Kurs Acuan & Komponen Biaya Tanah Suci
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kurs SAR (Saudi Riyal)</label>
                <div className="flex items-center border border-slate-200 rounded-xl px-3 py-2">
                  <span className="text-xs text-slate-400 mr-2">Rp</span>
                  <input
                    type="number"
                    value={sarRate}
                    onChange={(e) => setSarRate(e.target.value)}
                    className="w-full text-xs font-bold outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kurs USD (Dollar AS)</label>
                <div className="flex items-center border border-slate-200 rounded-xl px-3 py-2">
                  <span className="text-xs text-slate-400 mr-2">Rp</span>
                  <input
                    type="number"
                    value={usdRate}
                    onChange={(e) => setUsdRate(e.target.value)}
                    className="w-full text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Hotel Makkah (SAR)</label>
                  <input
                    type="number"
                    value={hotelMakkahSar}
                    onChange={(e) => setHotelMakkahSar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Hotel Madinah (SAR)</label>
                  <input
                    type="number"
                    value={hotelMadinahSar}
                    onChange={(e) => setHotelMadinahSar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Bus & Handling (SAR)</label>
                  <input
                    type="number"
                    value={busHandlingSar}
                    onChange={(e) => setBusHandlingSar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Muthawwif/TL (SAR)</label>
                  <input
                    type="number"
                    value={mutawwifSar}
                    onChange={(e) => setMutawwifSar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Visa Umroh (USD)</label>
                  <input
                    type="number"
                    value={visaUsd}
                    onChange={(e) => setVisaUsd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Tiket Pesawat (IDR)</label>
                  <input
                    type="number"
                    value={flightTicketIdr}
                    onChange={(e) => setFlightTicketIdr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-emerald-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 rounded-2xl p-6 shadow-lg text-white flex flex-col justify-between space-y-4 border border-emerald-900">
            <div>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                ESTIMASI REALISASI HPP PER PAX
              </span>
              <h3 className="text-2xl font-black text-white mt-1">
                {formatCurrency(totalHppPerPax)}
              </h3>
              <p className="text-xs text-emerald-200/80 mt-1">
                Total Biaya Pokok Penjualan Realisasi per Jamaah (Quad)
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl space-y-2 text-xs border border-white/10">
              <div className="flex justify-between">
                <span className="text-emerald-100">Subtotal Saudi (SAR {totalSar.toLocaleString()}):</span>
                <span className="font-bold">{formatCurrency(totalSarInIdr)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-100">Subtotal Visa (${visaUsd} USD):</span>
                <span className="font-bold">{formatCurrency(totalVisaInIdr)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-100">Tiket Penerbangan:</span>
                <span className="font-bold">{formatCurrency(ticketIdr)}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 text-center">
              Perhitungan dinamis berdasarkan fluktuasi kurs SAR dan USD harian
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
