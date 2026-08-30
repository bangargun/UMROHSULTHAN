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
import SavingsManagementView from "@/components/savings/SavingsManagementView";
import BranchAgentView from "@/components/agents/BranchAgentView";
import AgentPayoutView from "@/components/agents/AgentPayoutView";
import SalesFaqView from "@/components/faq/SalesFaqView";
import ComplianceView from "@/components/compliance/ComplianceView";
import GroundHandlingView from "@/components/ground/GroundHandlingView";
import WhatsAppGatewayView from "@/components/wa/WhatsAppGatewayView";
import PaymentGatewayView from "@/components/payment/PaymentGatewayView";
import PilgrimPortalView from "@/components/portal/PilgrimPortalView";
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
  const [agents, setAgents] = useState<any[]>([]);
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
        agentsRes,
      ] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/leads"),
        fetch("/api/pilgrims"),
        fetch("/api/packages"),
        fetch("/api/invoices"),
        fetch("/api/equipment"),
        fetch("/api/handovers"),
        fetch("/api/letters"),
        fetch("/api/agents"),
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
        agentsData,
      ] = await Promise.all([
        dashRes.json(),
        leadsRes.json(),
        pilgrimsRes.json(),
        packagesRes.json(),
        invoicesRes.json(),
        equipmentRes.json(),
        handoversRes.json(),
        lettersRes.json(),
        agentsRes.json(),
      ]);

      setDashboardData(dashData);
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setPilgrims(Array.isArray(pilgrimsData) ? pilgrimsData : []);
      setPackages(Array.isArray(packagesData) ? packagesData : []);
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      setEquipment(Array.isArray(equipmentData) ? equipmentData : []);
      setHandovers(Array.isArray(handoversData) ? handoversData : []);
      setLetters(Array.isArray(lettersData) ? lettersData : []);
      setAgents(Array.isArray(agentsData) ? agentsData : []);
    } catch (error) {
      console.error("Error fetching ERP data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleNavigateTab = (tab: string, filterTerm: string = "", extraData: any = null) => {
    setActiveTab(tab);
    setActiveSearchFilter(filterTerm);
    if (tab === "letters" && extraData) {
      setActiveLetterPilgrim(extraData);
    } else if (tab !== "letters") {
      setActiveLetterPilgrim(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sulthan_auth_user");
    setAuthUser(null);
    setActiveTab("dashboard");
  };

  if (!authChecked) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-sm font-semibold tracking-wider">Memuat Sistem ERP Sulthan Haramain...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show Login Screen
  if (!authUser) {
    return <LoginView onLoginSuccess={(user) => setAuthUser(user)} />;
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-bold tracking-wider">Menghubungkan Database Travel Umroh...</p>
        </div>
      </div>
    );
  }

  // Calculate badge counts
  const pendingInvoicesCount = invoices.filter((i) => i.status === "PENDING" || i.status === "OVERDUE").length;
  const pendingDocsCount = pilgrims.filter((p) => p.status === "REGISTERED" || p.status === "DP_PAID").length;
  const lowStockCount = equipment.filter((e) => e.availableStock <= e.minStockAlert).length;

  // Dedicated Mobile App Portal for Non-Admin Pilgrim Users
  if (authUser?.role === "PILGRIM") {
    return (
      <div className="min-h-screen bg-slate-900/5 text-slate-900 font-sans p-3 sm:p-6 max-w-4xl mx-auto">
        <PilgrimPortalView
          pilgrims={pilgrims}
          packages={packages}
          invoices={invoices}
          currentUser={authUser}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentUser={authUser}
        onLogout={handleLogout}
      />

      {/* Main Container Layout */}
      <div className="flex flex-1 min-h-[calc(100vh-65px)]">
        {/* Sidebar */}
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

          {activeTab === "portal" && (
            <PilgrimPortalView
              pilgrims={pilgrims}
              packages={packages}
              invoices={invoices}
              currentUser={authUser}
              onLogout={handleLogout}
            />
          )}

          {activeTab === "leads" && (
            <LeadsView
              leads={leads}
              packages={packages}
              onRefresh={fetchAllData}
              onNavigateToPilgrim={() => handleNavigateTab("pilgrims")}
              onNavigateToFaq={() => handleNavigateTab("faq")}
            />
          )}

          {activeTab === "savings" && (
            <SavingsManagementView
              packages={packages}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === "faq" && (
            <SalesFaqView />
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

          {activeTab === "compliance" && (
            <ComplianceView
              packages={packages}
              pilgrims={pilgrims}
            />
          )}

          {activeTab === "ground" && (
            <GroundHandlingView
              packages={packages}
              pilgrims={pilgrims}
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

          {activeTab === "payment-gateway" && (
            <PaymentGatewayView
              invoices={invoices}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === "profit-loss" && (
            <ProfitLossView
              packages={packages}
              onRefreshAll={fetchAllData}
            />
          )}

          {activeTab === "logistics" && (
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
              packages={packages}
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

          {activeTab === "agent-payouts" && (
            <AgentPayoutView
              agents={agents}
              packages={packages}
              onRefreshAll={fetchAllData}
            />
          )}

          {activeTab === "wa-gateway" && (
            <WhatsAppGatewayView
              pilgrims={pilgrims}
              packages={packages}
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
