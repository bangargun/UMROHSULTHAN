"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  UserCheck,
  Building2,
  Plus,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  X,
  CreditCard,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface AgentPayoutViewProps {
  agents: any[];
  packages: any[];
  onRefreshAll?: () => void;
}

export default function AgentPayoutView({ agents, packages, onRefreshAll }: AgentPayoutViewProps) {
  const [activeTab, setActiveTab] = useState<"PAYOUTS" | "LEADERBOARD">("PAYOUTS");
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddPayoutOpen, setIsAddPayoutOpen] = useState(false);

  const [payoutForm, setPayoutForm] = useState({
    agentId: agents[0]?.id || "",
    packageId: packages[0]?.id || "",
    amount: "1500000",
    notes: "",
  });

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agents/payouts");
      if (res.ok) setPayouts(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
  }, []);

  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/agents/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payoutForm),
      });
      if (res.ok) {
        setIsAddPayoutOpen(false);
        setPayoutForm({
          agentId: agents[0]?.id || "",
          packageId: packages[0]?.id || "",
          amount: "1500000",
          notes: "",
        });
        loadPayouts();
        if (onRefreshAll) onRefreshAll();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal membuat klaim pencairan.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveAndPay = async (id: string, amount: number) => {
    if (!confirm(`Cairkan komisi sebesar ${formatCurrency(amount)} dan bukukan ke Jurnal Kas Keluar?`)) return;
    try {
      const res = await fetch("/api/agents/payouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: "PAID",
          paymentProof: `Transfer Bank - ${new Date().toISOString().split("T")[0]}`,
        }),
      });
      if (res.ok) {
        alert("Komisi berhasil dicairkan dan dijurnal otomatis!");
        loadPayouts();
        if (onRefreshAll) onRefreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Agent Leaderboard sorting
  const sortedAgents = [...agents].sort((a, b) => (b.paidCommission || 0) - (a.paidCommission || 0));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-100 backdrop-blur-sm">
                <Award className="w-3.5 h-3.5" /> Jaringan Kemitraan & Afiliasi
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Pencairan Komisi Mitra & Leaderboard
            </h2>
            <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl">
              Kelola pencairan komisi per pax agen freelance, verifikasi bukti transfer, dan pantau pemeringkatan mitra terbaik musim ini.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                setPayoutForm((prev) => ({ ...prev, agentId: agents[0]?.id || "" }));
                setIsAddPayoutOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-950 shadow-sm hover:bg-emerald-50 transition-all"
            >
              <Plus className="h-4 w-4 text-emerald-600" /> + Ajukan Pencairan Komisi
            </button>
          </div>
        </div>
      </div>

      {/* SubTabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs">
        <button
          onClick={() => setActiveTab("PAYOUTS")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "PAYOUTS" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <DollarSign className="w-4 h-4" /> Daftar Klaim & Riwayat Pencairan
        </button>

        <button
          onClick={() => setActiveTab("LEADERBOARD")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "LEADERBOARD" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Award className="w-4 h-4" /> Leaderboard & Ranking Mitra
        </button>
      </div>

      {/* TAB 1: PAYOUTS */}
      {activeTab === "PAYOUTS" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Rekor Pencairan Komisi Agen ({payouts.length})
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Auto-Journaling Integration</span>
          </div>

          <div className="overflow-x-auto">
            {payouts.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">Belum Ada Pengajuan Pencairan Komisi</p>
                <p className="text-xs text-slate-400 mt-1">
                  Pencairan komisi dapat diajukan setelah jamaah melakukan pelunasan dan siap diberangkatkan.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-bold">
                    <th className="py-3 px-4">Tanggal Pengajuan</th>
                    <th className="py-3 px-4">Nama Mitra / Agen</th>
                    <th className="py-3 px-4">Nominal Komisi</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Bukti / Jurnal</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {payouts.map((p) => {
                    const agent = agents.find((a) => a.id === p.agentId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {formatDate(p.createdAt, "dd MMM yyyy, HH:mm")}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {agent?.name || "Mitra Lapangan"}
                          <div className="text-[10px] text-slate-400 font-normal">
                            Rek: {agent?.bankName || "BSI"} - {agent?.accountNumber || "-"}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-700">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {p.status === "PAID" ? "✓ Sudah Ditransfer" : "Menunggu Pencairan"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                          {p.paymentProof || "-"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {p.status !== "PAID" ? (
                            <button
                              onClick={() => handleApproveAndPay(p.id, p.amount)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Cairkan & Jurnal
                            </button>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-400 font-mono">
                              TERBUKUKAN
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LEADERBOARD */}
      {activeTab === "LEADERBOARD" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sortedAgents.length === 0 ? (
            <div className="col-span-3 bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Belum Ada Data Mitra Terdaftar</p>
              <p className="text-xs text-slate-400 mt-1">
                Daftarkan mitra/agen pada menu Jaringan Cabang & Agen untuk membangun leaderboard.
              </p>
            </div>
          ) : (
            sortedAgents.map((ag, rank) => (
              <div
                key={ag.id}
                className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-4 bg-white ${
                  rank === 0 ? "border-amber-300 ring-2 ring-amber-300/40" : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                        rank === 0
                          ? "bg-amber-400 text-slate-950 shadow-md"
                          : rank === 1
                          ? "bg-slate-200 text-slate-800"
                          : rank === 2
                          ? "bg-amber-700/20 text-amber-900"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      #{rank + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{ag.name}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">Kode: {ag.referralCode || "-"}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                      rank === 0
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {rank === 0 ? "🏆 TOP PARTNER" : "MITRA ACTIVE"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kota Domisili:</span>
                    <span className="font-bold text-slate-800">{ag.city || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Komisi per Pax:</span>
                    <span className="font-bold text-emerald-700">{formatCurrency(ag.commissionPerPax || 1500000)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-700 font-bold">Total Pencairan:</span>
                    <span className="font-black text-slate-900">{formatCurrency(ag.paidCommission || 0)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Add Payout */}
      {isAddPayoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Pengajuan Pencairan Komisi Mitra</h3>
              <button onClick={() => setIsAddPayoutOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayout} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Agen / Mitra</label>
                <select
                  value={payoutForm.agentId}
                  onChange={(e) => setPayoutForm({ ...payoutForm, agentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  required
                >
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>{ag.name} ({ag.city || "-"})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Komisi (Rp)</label>
                <input
                  type="number"
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-emerald-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Keterangan pencairan komisi pax"
                  value={payoutForm.notes}
                  onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddPayoutOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
