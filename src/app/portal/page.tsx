"use client";

import React, { useState, useEffect } from "react";
import PilgrimPortalView from "@/components/portal/PilgrimPortalView";
import { Loader2, Search, Sparkles, UserCheck, Smartphone } from "lucide-react";

export default function PortalPage() {
  const [pilgrims, setPilgrims] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePilgrim, setActivePilgrim] = useState<any | null>(null);

  useEffect(() => {
    fetchPortalData();
  }, []);

  const fetchPortalData = async () => {
    try {
      const [pilRes, pkgRes, invRes] = await Promise.all([
        fetch("/api/pilgrims"),
        fetch("/api/packages"),
        fetch("/api/invoices"),
      ]);

      const [pilData, pkgData, invData] = await Promise.all([
        pilRes.json(),
        pkgRes.json(),
        invRes.json(),
      ]);

      setPilgrims(Array.isArray(pilData) ? pilData : []);
      setPackages(Array.isArray(pkgData) ? pkgData : []);
      setInvoices(Array.isArray(invData) ? invData : []);

      // Check if user has previously selected a pilgrim profile stored in localStorage
      const savedPilgrimId = localStorage.getItem("sulthan_portal_pilgrim_id");
      if (savedPilgrimId && Array.isArray(pilData)) {
        const found = pilData.find((p) => p.id === savedPilgrimId);
        if (found) setActivePilgrim(found);
      }
    } catch (err) {
      console.error("Error fetching portal data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPilgrim = (p: any) => {
    setActivePilgrim(p);
    localStorage.setItem("sulthan_portal_pilgrim_id", p.id);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-400" />
          <p className="text-sm font-bold tracking-wider text-emerald-100">
            Membuka Mobile Portal Jamaah Sulthan Haramain...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950/5 font-sans p-2 sm:p-4 md:p-6 max-w-4xl mx-auto pb-12">
      <PilgrimPortalView
        pilgrims={pilgrims}
        packages={packages}
        invoices={invoices}
        currentUser={activePilgrim ? { pilgrimId: activePilgrim.id, name: activePilgrim.name } : undefined}
      />
    </div>
  );
}
