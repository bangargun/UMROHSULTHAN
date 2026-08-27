"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Settings,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Phone,
  Key,
  Layers,
  Sparkles,
  Copy,
  ExternalLink,
  Save,
  Radio,
  Zap,
} from "lucide-react";

interface WhatsAppGatewayViewProps {
  pilgrims: any[];
  packages: any[];
}

export default function WhatsAppGatewayView({ pilgrims, packages }: WhatsAppGatewayViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"SETTINGS" | "TEMPLATES" | "SIMULATOR">("SETTINGS");
  const [config, setConfig] = useState<any>({
    provider: "FONNTE",
    apiKey: "",
    senderPhone: "",
    isConnected: false,
    autoRemindersEnabled: true,
    templatesJson: "{}",
  });
  const [templates, setTemplates] = useState<any>({
    WELCOME_LEAD: "Assalamu'alaikum Wr. Wb. Bpk/Ibu *{NAMA}*, terima kasih telah menghubungi PT BAROKAH SULTHAN HARAMAIN. Kami siap melayani rencana ibadah Umroh Anda untuk program *{PAKET}*.",
    DP_INVOICE_SENT: "Assalamu'alaikum Bpk/Ibu *{NAMA}*, berikut tagihan pembayaran DP pendaftaran Umroh *{PAKET}* sebesar *{NOMINAL}*. Silakan transfer ke rekening BSI 8888-999-123 a.n PT BAROKAH SULTHAN HARAMAIN.",
    PAYMENT_CONFIRMED: "Alhamdulillah, pembayaran sebesar *{NOMINAL}* untuk Bpk/Ibu *{NAMA}* telah kami terima. Kuitansi resmi telah tercatat di sistem kami.",
    DUE_DATE_REMINDER: "Pengingat Ibadah: Assalamu'alaikum Bpk/Ibu *{NAMA}*, kami menginfokan batas waktu pelunasan program *{PAKET}* jatuh tempo pada *{TANGGAL}* sebesar *{NOMINAL}*.",
    DEPARTURE_INFO: "Pemberitahuan Keberangkatan: Assalamu'alaikum Bpk/Ibu *{NAMA}*, keberangkatan grup *{PAKET}* dijadwalkan pada *{TANGGAL}* di Bandara Soekarno Hatta Terminal 3.",
  });

  // Simulator Form
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("WELCOME_LEAD");
  const [simPhone, setSimPhone] = useState("");
  const [simName, setSimName] = useState("");
  const [simPackage, setSimPackage] = useState(packages[0]?.name || "Program Umroh Reguler");
  const [simNominal, setSimNominal] = useState("Rp 10.000.000");
  const [simDate, setSimDate] = useState("15 September 2026");
  const [compiledMessage, setCompiledMessage] = useState("");
  const [dispatchStatus, setDispatchStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadConfig = async () => {
    try {
      const res = await fetch("/api/wa/settings");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        if (data.templatesJson) {
          try {
            setTemplates(JSON.parse(data.templatesJson));
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Update compiled message in simulator
  useEffect(() => {
    const raw = templates[selectedTemplateKey] || "";
    const compiled = raw
      .replace(/{NAMA}/g, simName || "[Nama Jamaah]")
      .replace(/{PAKET}/g, simPackage || "[Nama Paket]")
      .replace(/{NOMINAL}/g, simNominal || "[Nominal]")
      .replace(/{TANGGAL}/g, simDate || "[Tanggal]");
    setCompiledMessage(compiled);
  }, [selectedTemplateKey, simName, simPackage, simNominal, simDate, templates]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/wa/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          templatesJson: JSON.stringify(templates),
        }),
      });
      if (res.ok) {
        alert("Konfigurasi WhatsApp Gateway berhasil disimpan!");
        loadConfig();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDispatchSimulator = async () => {
    if (!simPhone) {
      alert("Masukkan nomor WhatsApp penerima.");
      return;
    }
    setLoading(true);
    setDispatchStatus(null);
    try {
      const res = await fetch("/api/wa/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: simPhone,
          message: compiledMessage,
        }),
      });
      const data = await res.json();
      setDispatchStatus(data);
      if (data.waUrl) {
        window.open(data.waUrl, "_blank");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-100 backdrop-blur-sm">
                <MessageSquare className="w-3.5 h-3.5" /> Otomasi Komunikasi Jamaah
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              WhatsApp Automation Gateway & Notifikasi
            </h2>
            <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl">
              Integrasi pesan instan otomatis untuk tagihan DP, kuitansi pelunasan, jadwal manasik, dan broadcast info keberangkatan.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/30">
            <span
              className={`h-2.5 w-2.5 rounded-full ${config.isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}
            />
            <span className="text-xs font-bold text-emerald-100">
              {config.isConnected ? "Gateway Terhubung (Online)" : "Mode Link Web WhatsApp"}
            </span>
          </div>
        </div>
      </div>

      {/* SubTabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs">
        <button
          onClick={() => setActiveSubTab("SETTINGS")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === "SETTINGS" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Settings className="w-4 h-4" /> Pengaturan Gateway & API
        </button>

        <button
          onClick={() => setActiveSubTab("TEMPLATES")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === "TEMPLATES" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Layers className="w-4 h-4" /> Template Pesan Otomatis
        </button>

        <button
          onClick={() => setActiveSubTab("SIMULATOR")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === "SIMULATOR" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Zap className="w-4 h-4" /> Simulator & Kirim Cepat
        </button>
      </div>

      {/* TAB 1: SETTINGS */}
      {activeSubTab === "SETTINGS" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs max-w-2xl">
          <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-600" />
            Konfigurasi Provider WhatsApp API
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Penyedia Gateway</label>
              <select
                value={config.provider}
                onChange={(e) => setConfig({ ...config, provider: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                <option value="FONNTE">Fonnte API (Official Indonesian WA Gateway)</option>
                <option value="WABA">WhatsApp Cloud API (Meta Official)</option>
                <option value="CUSTOM">Custom Webhook / Link Engine</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">API Key / Token</label>
              <input
                type="password"
                placeholder="Masukkan API Token Gateway Anda"
                value={config.apiKey || ""}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Jika dikosongkan, sistem tetap dapat mengirim pesan via 1-Click WhatsApp Web / Desktop.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Pengirim Terdaftar</label>
              <input
                type="text"
                placeholder="Contoh: 082167339464"
                value={config.senderPhone || ""}
                onChange={(e) => setConfig({ ...config, senderPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                id="autoReminders"
                checked={config.autoRemindersEnabled}
                onChange={(e) => setConfig({ ...config, autoRemindersEnabled: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <label htmlFor="autoReminders" className="text-xs font-bold text-slate-800 cursor-pointer">
                Aktifkan Pengingat Pelunasan Otomatis H-30 & H-14
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

      {/* TAB 2: TEMPLATES */}
      {activeSubTab === "TEMPLATES" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(templates).map(([key, val]: any) => (
              <div key={key} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-700 uppercase bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Template ID: {key}</span>
                </div>

                <textarea
                  rows={4}
                  value={val}
                  onChange={(e) => setTemplates({ ...templates, [key]: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-sans text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
                />

                <div className="text-[10px] text-slate-400 flex flex-wrap gap-1.5">
                  <span className="font-bold text-slate-600">Variabel Dinamis:</span>
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-700 font-mono">{"{NAMA}"}</code>
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-700 font-mono">{"{PAKET}"}</code>
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-700 font-mono">{"{NOMINAL}"}</code>
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-700 font-mono">{"{TANGGAL}"}</code>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
            >
              <Save className="w-4 h-4" /> Simpan Seluruh Template
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SIMULATOR */}
      {activeSubTab === "SIMULATOR" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              Parameter Pengujian Pesan
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Jenis Notifikasi</label>
              <select
                value={selectedTemplateKey}
                onChange={(e) => setSelectedTemplateKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                {Object.keys(templates).map((k) => (
                  <option key={k} value={k}>{k.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp Tujuan</label>
              <input
                type="text"
                placeholder="Contoh: 082167339464"
                value={simPhone}
                onChange={(e) => setSimPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Jamaah</label>
                <input
                  type="text"
                  placeholder="Nama Jamaah"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal</label>
                <input
                  type="text"
                  placeholder="Rp 10.000.000"
                  value={simNominal}
                  onChange={(e) => setSimNominal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Program Paket</label>
              <input
                type="text"
                placeholder="Nama Paket Umroh"
                value={simPackage}
                onChange={(e) => setSimPackage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
              <input
                type="text"
                placeholder="Tanggal Jatuh Tempo / Berangkat"
                value={simDate}
                onChange={(e) => setSimDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <button
              onClick={handleDispatchSimulator}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Kirim / Buka WhatsApp Sekarang
            </button>
          </div>

          {/* Live Phone Preview */}
          <div className="bg-slate-900 rounded-3xl p-6 shadow-xl text-white flex flex-col justify-between max-w-sm mx-auto w-full border-4 border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-black text-xs">
                  BS
                </div>
                <div>
                  <h4 className="text-xs font-bold">PT Barokah Sulthan Haramain</h4>
                  <p className="text-[9px] text-emerald-400 font-mono">Official WhatsApp</p>
                </div>
              </div>
            </div>

            {/* Bubble Chat */}
            <div className="my-6 bg-emerald-950/80 border border-emerald-800/60 p-4 rounded-2xl rounded-tl-xs shadow-inner space-y-2 text-xs leading-relaxed text-emerald-50">
              <p className="whitespace-pre-wrap">{compiledMessage}</p>
              <div className="text-[9px] text-emerald-400/80 text-right font-mono">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • ✓✓
              </div>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-2xl text-[10px] text-center text-slate-400">
              Pratinjau tampilan pesan di ponsel jamaah
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
