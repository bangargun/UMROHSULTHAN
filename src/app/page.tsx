"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import DashboardView from "@/components/dashboard/DashboardView";
import LeadsView from "@/components/leads/LeadsView";
import PilgrimsView from "@/components/pilgrims/PilgrimsView";
import AlumniPilgrimsView from "@/components/pilgrims/AlumniPilgrimsView";
import FinanceView from "@/components/finance/FinanceView";
import ProfitLossView from "@/components/finance/ProfitLossView";
import LogisticsView from "@/components/logistics/LogisticsView";
import HandoverChecklistView from "@/components/handovers/HandoverChecklistView";
import RequirementsChecklistView from "@/components/requirements/RequirementsChecklistView";
import LettersGeneratorView from "@/components/letters/LettersGeneratorView";
import BranchAgentView from "@/components/agents/BranchAgentView";
import MasterDataView from "@/components/master/MasterDataView";
import SettingsView from "@/components/settings/SettingsView";
import LoginView from "@/components/auth/LoginView";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [activeSearchFilter, setActiveSearchFilter] = useState<string>("");
  const [activeLetterPilgrim, setActiveLetterPilgrim] = useState<any | null>(null);

  // Data states
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [pilgrims, setPilgrims] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [handovers, setHandovers] = useState<any[]>([]);
  const [letters, setLetters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync logged in user profile with database
  const syncCurrentUser = async (currentAuth: any) => {
    if (!currentAuth) return;
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const userList = await res.json();
        const found = userList.find((u: any) => u.id === currentAuth.id || u.username === currentAuth.username);
        if (found) {
          const fresh = {
            ...currentAuth,
            name: found.name,
            role: found.role,
            email: found.email,
            phone: found.phone,
          };
          setAuthUser(fresh);
          localStorage.setItem("sulthan_auth_user", JSON.stringify(fresh));
        }
      }
    } catch (e) {
      console.error("Failed to sync current user:", e);
    }
  };

  // Check login session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sulthan_auth_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setAuthUser(parsed);
        syncCurrentUser(parsed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  const fetchAllData = async () => {
    try {
      const [
        dashRes,
        leadsRes,
        pilgrimsRes,
        packagesRes,
        invoicesRes,
        equipmentRes,
        handoversRes,
        lettersRes,
      ] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/leads"),
        fetch("/api/pilgrims"),
        fetch("/api/packages"),
        fetch("/api/invoices"),
        fetch("/api/equipment"),
        fetch("/api/handovers"),
        fetch("/api/letters"),
      ]);

      const [
        dashData,
        leadsData,
        pilgrimsData,
        packagesData,
        invoicesData,
        equipmentData,
        handoversData,
        lettersData,
      ] = await Promise.all([
        dashRes.json(),
        leadsRes.json(),
        pilgrimsRes.json(),
        packagesRes.json(),
        invoicesRes.json(),
        equipmentRes.json(),
        handoversRes.json(),
        lettersRes.json(),
      ]);

      setDashboardData(dashData);
      setLeads(leadsData);
      setPilgrims(pilgrimsData);
      setPackages(packagesData);
      setInvoices(invoicesData);
      setEquipment(equipmentData);
      setHandovers(handoversData);
      setLetters(lettersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateTab = (tab: string, searchFilter?: string, pilgrim?: any) => {
    setActiveSearchFilter(searchFilter || "");
    if (pilgrim) setActiveLetterPilgrim(pilgrim);
    setActiveTab(tab);
  };

  const handleLogout = () => {
    localStorage.removeItem("sulthan_auth_user");
    setAuthUser(null);
  };

  useEffect(() => {
    if (authUser) {
      fetchAllData();
    }
  }, [authUser]);

  const pendingInvoicesCount = invoices.filter((i) => i.status === "PENDING" || i.status === "OVERDUE").length;
  const pendingDocsCount = pilgrims.reduce((acc, p) => {
    const unverified = p.requirements?.filter((r: any) => !r.isVerified).length || 0;
    return acc + (unverified > 0 ? 1 : 0);
  }, 0);
  const lowStockCount = dashboardData?.summary?.lowStockCount || 0;

  if (!authChecked) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // If not logged in, render Papan Login
  if (!authUser) {
    return <LoginView onLoginSuccess={(user) => setAuthUser(user)} />;
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Menyinkronkan Sistem Terpadu Umroh...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar with user profile & logout */}
      <Navbar
        activeTab={activeTab}
        currentUser={authUser}
        onLogout={handleLogout}
      />

      <div className="flex flex-1">
        {/* Admin Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveSearchFilter("");
            setActiveTab(tab);
          }}
          badgeCounts={{
            leads: leads.filter((l) => l.status === "NEW").length,
            pendingInvoices: pendingInvoicesCount,
            pendingDocs: pendingDocsCount,
            lowStock: lowStockCount,
          }}
        />

        {/* Main Content View */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === "dashboard" && (
            <DashboardView
              data={dashboardData}
              onNavigate={(tab) => handleNavigateTab(tab)}
            />
          )}

          {activeTab === "leads" && (
            <LeadsView
              leads={leads}
              packages={packages}
              onRefresh={fetchAllData}
              onNavigateToPilgrim={() => handleNavigateTab("pilgrims")}
            />
          )}

          {activeTab === "pilgrims" && (
            <PilgrimsView
              pilgrims={pilgrims}
              packages={packages}
              onRefresh={fetchAllData}
              onOpenLetterGenerator={(pilgrim) => handleNavigateTab("letters", "", pilgrim)}
              onNavigateTab={(tab, filter) => handleNavigateTab(tab, filter)}
            />
          )}

          {activeTab === "alumni" && (
            <AlumniPilgrimsView
              pilgrims={pilgrims}
              packages={packages}
              onRefresh={fetchAllData}
              onNavigateTab={(tab, filter) => handleNavigateTab(tab, filter)}
            />
          )}

          {activeTab === "finance" && (
            <FinanceView
              invoices={invoices}
              pilgrims={pilgrims}
              onRefresh={fetchAllData}
              initialSearchTerm={activeSearchFilter}
            />
          )}

          {activeTab === "profit-loss" && (
            <ProfitLossView
              packages={packages}
              onRefreshAll={fetchAllData}
            />
          )}

          {activeTab === "inventory" && (
            <LogisticsView
              equipment={equipment}
              onRefresh={fetchAllData}
              onNavigateToHandover={() => handleNavigateTab("handovers")}
            />
          )}

          {activeTab === "handovers" && (
            <HandoverChecklistView
              handovers={handovers}
              pilgrims={pilgrims}
              equipment={equipment}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === "requirements" && (
            <RequirementsChecklistView
              pilgrims={pilgrims}
              onRefresh={fetchAllData}
              initialSearchTerm={activeSearchFilter}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {activeTab === "letters" && (
            <LettersGeneratorView
              letters={letters}
              pilgrims={pilgrims}
              initialPilgrim={activeLetterPilgrim}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === "agents" && (
            <BranchAgentView
              packages={packages}
              onRefreshAll={fetchAllData}
            />
          )}

          {activeTab === "master" && (
            <MasterDataView
              packages={packages}
              equipment={equipment}
              onRefreshAll={fetchAllData}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              currentUser={authUser}
              onUpdateCurrentUser={setAuthUser}
              onRefreshAll={fetchAllData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
