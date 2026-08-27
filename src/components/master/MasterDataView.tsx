"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  Plane,
  Boxes,
  FileCheck2,
  Building2,
  Users2,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Mail,
  ShieldCheck,
  Key,
  Users,
  KeyRound,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface MasterDataViewProps {
  packages: any[];
  equipment: any[];
  onRefreshAll: () => void;
}

export default function MasterDataView({ packages, equipment, onRefreshAll }: MasterDataViewProps) {
  const [activeTab, setActiveTab] = useState<"PACKAGES" | "LETTERS" | "ACCOUNTS" | "EQUIPMENT" | "DOCS" | "SETTINGS" | "STAFF">("PACKAGES");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccountCategory, setSelectedAccountCategory] = useState<string>("ALL");

  // Sub-data states
  const [travelSettings, setTravelSettings] = useState<any>({
    companyName: "PT SULTHAN HARAMAIN TOUR & TRAVEL",
    licenseNumber: "PPIU Kemenag RI No. U.412 Tahun 2022",
    kemenhanLicense: "Izin Khusus Kemenhan RI No. B/108/M/XII/2023",
    address: "Sulthan Haramain Tower, Jl. Prof. Dr. Satrio No. 88, Kuningan, Jakarta Selatan 12940",
    phone: "(021) 5290-8888 / 0811-9876-5432",
    email: "salam@sulthanharamain.com",
    website: "www.sulthanharamain.com",
    directorName: "H. Sulthan Syarif, Lc., M.A.",
    directorTitle: "Direktur Utama",
    bankBSI: "8888-999-123 a.n PT SULTHAN HARAMAIN TOUR & TRAVEL",
    bankBCA: "731-888-9900 a.n PT SULTHAN HARAMAIN TOUR & TRAVEL",
    bankMandiri: "137-00-8888999-1 a.n PT SULTHAN HARAMAIN TOUR & TRAVEL",
  });
  const [reqTemplates, setReqTemplates] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [letterTemplates, setLetterTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [editingPackage, setEditingPackage] = useState<any | null>(null);
  const [isAddPackageOpen, setIsAddPackageOpen] = useState(false);

  const [editingEquipment, setEditingEquipment] = useState<any | null>(null);
  const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);

  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  const [editingLetterTmpl, setEditingLetterTmpl] = useState<any | null>(null);
  const [isAddLetterTmplOpen, setIsAddLetterTmplOpen] = useState(false);

  // Master Hotels & Airlines Catalogs
  const [makkahHotels, setMakkahHotels] = useState<any[]>([]);
  const [madinahHotels, setMadinahHotels] = useState<any[]>([]);
  const [airlines, setAirlines] = useState<any[]>([]);

  // Quick Add Hotel Modal State
  const [isQuickAddHotelOpen, setIsQuickAddHotelOpen] = useState(false);
  const [quickHotelCity, setQuickHotelCity] = useState<"MAKKAH" | "MADINAH">("MAKKAH");
  const [quickHotelForm, setQuickHotelForm] = useState({
    name: "",
    rating: "5",
    distance: "",
  });

  // Quick Add Airline Modal State
  const [isQuickAddAirlineOpen, setIsQuickAddAirlineOpen] = useState(false);
  const [quickAirlineForm, setQuickAirlineForm] = useState({
    name: "",
    code: "",
    routeType: "DIRECT",
  });

  // Letter Template Form State
  const [letterTmplForm, setLetterTmplForm] = useState({
    code: "",
    title: "",
    subject: "",
    defaultDest: "",
    defaultNotes: "",
    bodyTemplate: "",
    isActive: true,
  });

  // Account Form State
  const [accountForm, setAccountForm] = useState({
    code: "",
    name: "",
    category: "HPP_EXPENSE",
    group: "Beban Pokok Penjualan (HPP)",
    normalBalance: "DEBIT",
    description: "",
    isActive: true,
  });

  // Package Form
  const [packageForm, setPackageForm] = useState({
    code: "",
    name: "",
    description: "",
    departureDate: "",
    returnDate: "",
    durationDays: "9",
    hotelMakkah: "Pullman Zamzam Tower (Bintang 5)",
    hotelMadinah: "Dallah Taibah Hotel (Bintang 5)",
    airline: "Saudia Airlines (Direct CGK-JED)",
    priceQuad: "29500000",
    priceTriple: "32500000",
    priceDouble: "36000000",
    quota: "45",
    commissionAgent: "1500000",
    commissionReferral: "500000",
    status: "ACTIVE",
  });

  // Equipment Form
  const [equipmentForm, setEquipmentForm] = useState({
    name: "",
    sku: "",
    category: "AKSESORIS",
    totalStock: "100",
    availableStock: "100",
    unit: "PCS",
    minStockAlert: "20",
    description: "",
  });

  // Requirement Template Form
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    isMandatory: true,
  });

  // Staff & User Form
  const [userForm, setUserForm] = useState({
    name: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    role: "ADMIN_OPERASIONAL",
    isActive: true,
  });

  const fetchExtraMasterData = async () => {
    try {
      const [settingsRes, reqRes, usersRes, accountsRes, lettersRes, makkahRes, madinahRes, airlinesRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/requirements/templates"),
        fetch("/api/users"),
        fetch("/api/accounts"),
        fetch("/api/letters/templates"),
        fetch("/api/master/hotels?city=MAKKAH"),
        fetch("/api/master/hotels?city=MADINAH"),
        fetch("/api/master/airlines"),
      ]);
      const [sData, rData, uData, aData, lData, mData, mdData, alData] = await Promise.all([
        settingsRes.json(),
        reqRes.json(),
        usersRes.json(),
        accountsRes.json(),
        lettersRes.json(),
        makkahRes.json(),
        madinahRes.json(),
        airlinesRes.json(),
      ]);
      if (sData) setTravelSettings(sData);
      if (rData) setReqTemplates(rData);
      if (uData) setStaffUsers(uData);
      if (aData && Array.isArray(aData)) setAccounts(aData);
      if (lData && Array.isArray(lData)) setLetterTemplates(lData);
      if (mData && Array.isArray(mData)) setMakkahHotels(mData);
      if (mdData && Array.isArray(mdData)) setMadinahHotels(mdData);
      if (alData && Array.isArray(alData)) setAirlines(alData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExtraMasterData();
  }, []);

  // Quick Add Hotel Handler
  const handleSaveQuickHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickHotelForm.name.trim()) return;
    setLoading(true);
    try {
      const payload = {
        name: quickHotelForm.name.trim(),
        city: quickHotelCity,
        rating: quickHotelForm.rating,
        distance: quickHotelForm.distance || null,
      };
      const res = await fetch("/api/master/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        if (quickHotelCity === "MAKKAH") {
          setPackageForm((prev) => ({ ...prev, hotelMakkah: created.name }));
        } else {
          setPackageForm((prev) => ({ ...prev, hotelMadinah: created.name }));
        }
        setIsQuickAddHotelOpen(false);
        setQuickHotelForm({ name: "", rating: "5", distance: "" });
        alert(`Hotel "${created.name}" berhasil disimpan ke database Master Hotel & dipilih untuk paket!`);
        fetchExtraMasterData();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan hotel");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Quick Add Airline Handler
  const handleSaveQuickAirline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAirlineForm.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/master/airlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quickAirlineForm),
      });
      if (res.ok) {
        const created = await res.json();
        setPackageForm((prev) => ({ ...prev, airline: created.name }));
        setIsQuickAddAirlineOpen(false);
        setQuickAirlineForm({ name: "", code: "", routeType: "DIRECT" });
        alert(`Maskapai "${created.name}" berhasil disimpan ke database Master Maskapai & dipilih untuk paket!`);
        fetchExtraMasterData();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan maskapai");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Letter Templates & Code Abbreviations
  const handleSaveLetterTmpl = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingLetterTmpl) {
        const res = await fetch(`/api/letters/templates/${editingLetterTmpl.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(letterTmplForm),
        });
        if (res.ok) {
          alert(`Template Surat "${letterTmplForm.code} - ${letterTmplForm.title}" berhasil diperbarui!`);
          setIsAddLetterTmplOpen(false);
          setEditingLetterTmpl(null);
          fetchExtraMasterData();
        } else {
          const err = await res.json();
          alert(`Gagal menyimpan template surat: ${err.error || "Terjadi kesalahan"}`);
        }
      } else {
        const res = await fetch("/api/letters/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(letterTmplForm),
        });
        if (res.ok) {
          alert(`Template Surat "${letterTmplForm.code} - ${letterTmplForm.title}" berhasil ditambahkan!`);
          setIsAddLetterTmplOpen(false);
          setLetterTmplForm({
            code: "",
            title: "",
            subject: "",
            defaultDest: "",
            defaultNotes: "",
            bodyTemplate: "",
            isActive: true,
          });
          fetchExtraMasterData();
        } else {
          const err = await res.json();
          alert(`Gagal menambahkan template surat: ${err.error || "Terjadi kesalahan"}`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLetterTmpl = async (id: string, code: string, title: string) => {
    if (!confirm(`Hapus template / singkatan kode surat "${code} - ${title}"?`)) return;
    try {
      const res = await fetch(`/api/letters/templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert(`Template surat "${code}" berhasil dihapus.`);
        fetchExtraMasterData();
      } else {
        alert("Gagal menghapus template surat.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Accounts (COA)
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAccount) {
        const res = await fetch(`/api/accounts/${editingAccount.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(accountForm),
        });
        if (res.ok) {
          alert(`Akun "${accountForm.code} - ${accountForm.name}" berhasil diperbarui!`);
          setIsAddAccountOpen(false);
          setEditingAccount(null);
          fetchExtraMasterData();
        } else {
          const err = await res.json();
          alert(`Gagal menyimpan akun: ${err.error || "Terjadi kesalahan"}`);
        }
      } else {
        const res = await fetch("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(accountForm),
        });
        if (res.ok) {
          alert(`Akun "${accountForm.code} - ${accountForm.name}" berhasil ditambahkan ke Bagan Akun!`);
          setIsAddAccountOpen(false);
          setAccountForm({
            code: "",
            name: "",
            category: "HPP_EXPENSE",
            group: "Beban Pokok Penjualan (HPP)",
            normalBalance: "DEBIT",
            description: "",
            isActive: true,
          });
          fetchExtraMasterData();
        } else {
          const err = await res.json();
          alert(`Gagal menambahkan akun: ${err.error || "Terjadi kesalahan"}`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (id: string, code: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun "${code} - ${name}" dari Bagan Akun Keuangan?`)) return;
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert(`Akun "${code} - ${name}" berhasil dihapus.`);
        fetchExtraMasterData();
      } else {
        alert("Gagal menghapus akun.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Travel Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(travelSettings),
      });
      if (res.ok) {
        alert("Profil & Rekening Travel berhasil diperbarui!");
        fetchExtraMasterData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Package
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!editingPackage;
      const url = isEdit ? `/api/packages/${editingPackage.id}` : "/api/packages";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(packageForm),
      });

      if (res.ok) {
        setIsAddPackageOpen(false);
        setEditingPackage(null);
        alert(isEdit ? "Paket berhasil diperbarui!" : "Paket baru berhasil ditambahkan!");
        onRefreshAll();
      } else {
        alert("Gagal menyimpan paket");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePackage = async (pkgId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus paket ini?")) return;
    try {
      const res = await fetch(`/api/packages/${pkgId}`, { method: "DELETE" });
      if (res.ok) {
        alert("Paket berhasil dihapus");
        onRefreshAll();
      } else {
        const err = await res.json();
        alert(`Gagal hapus: ${err.error || "Terjadi kesalahan"}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Equipment
  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!editingEquipment;
      const url = isEdit ? `/api/equipment/${editingEquipment.id}` : "/api/equipment";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(equipmentForm),
      });

      if (res.ok) {
        setIsAddEquipmentOpen(false);
        setEditingEquipment(null);
        alert(isEdit ? "Barang logistik berhasil diperbarui!" : "Barang baru berhasil ditambahkan!");
        onRefreshAll();
      } else {
        alert("Gagal menyimpan barang");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEquipment = async (eqId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus barang logistik ini?")) return;
    try {
      const res = await fetch(`/api/equipment/${eqId}`, { method: "DELETE" });
      if (res.ok) {
        alert("Barang berhasil dihapus");
        onRefreshAll();
      } else {
        const err = await res.json();
        alert(`Gagal hapus: ${err.error || "Terjadi kesalahan"}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Requirement Templates
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!editingTemplate;
      const url = "/api/requirements/templates";
      const method = isEdit ? "PUT" : "POST";
      const payload = isEdit ? { ...templateForm, id: editingTemplate.id } : templateForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsAddTemplateOpen(false);
        setEditingTemplate(null);
        alert(isEdit ? "Syarat berhasil diperbarui!" : "Syarat baru berhasil ditambahkan!");
        fetchExtraMasterData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Hapus syarat ini dari template standar?")) return;
    try {
      const res = await fetch(`/api/requirements/templates?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Syarat berhasil dihapus");
        fetchExtraMasterData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Staff & Users
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!editingUser;
      const url = isEdit ? `/api/users/${editingUser.id}` : "/api/users";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });

      if (res.ok) {
        setIsAddUserOpen(false);
        setEditingUser(null);
        alert(isEdit ? "Data petugas berhasil diperbarui!" : "Petugas baru berhasil ditambahkan!");
        fetchExtraMasterData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Hapus user/petugas ini?")) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        alert("Petugas berhasil dihapus");
        fetchExtraMasterData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="h-6 w-6 text-emerald-600" />
          Pusat Data Master & Konfigurasi Rujukan
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Kelola data rujukan utama (Paket Umroh, Katalog Logistik, Template Syarat Berkas, Profil Travel PPIU, dan Akun Petugas) yang otomatis menjadi referensi di seluruh halaman aplikasi.
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "PACKAGES", label: "Master Paket Umroh", icon: Plane, count: packages.length },
          { id: "LETTERS", label: "Master Kode & Format Surat", icon: FileText, count: letterTemplates.length },
          { id: "ACCOUNTS", label: "Bagan Akun & Akuntansi", icon: BookOpen, count: accounts.length },
          { id: "EQUIPMENT", label: "Master Barang Logistik", icon: Boxes, count: equipment.length },
          { id: "DOCS", label: "Master Syarat & Dokumen", icon: FileCheck2, count: reqTemplates.length },
          { id: "SETTINGS", label: "Master Profil Travel & Bank", icon: Building2 },
          { id: "STAFF", label: "Master Agen & Petugas", icon: Users2, count: staffUsers.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                    isActive ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: MASTER PAKET UMROH */}
      {activeTab === "PACKAGES" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/80">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Daftar Paket Umroh & Jadwal</h3>
              <p className="text-xs text-slate-400">Rujukan untuk pendaftaran jamaah, kuota seat, harga, dan manifest</p>
            </div>
            <button
              onClick={() => {
                setEditingPackage(null);
                setPackageForm({
                  code: `UMR-${Date.now().toString().slice(-4)}`,
                  name: "",
                  description: "",
                  departureDate: "",
                  returnDate: "",
                  durationDays: "9",
                  hotelMakkah: "Pullman Zamzam (Bintang 5)",
                  hotelMadinah: "Dallah Taibah (Bintang 5)",
                  airline: "Saudia Airlines",
                  priceQuad: "29500000",
                  priceTriple: "32500000",
                  priceDouble: "36000000",
                  quota: "45",
                  commissionAgent: "1500000",
                  commissionReferral: "500000",
                  status: "ACTIVE",
                });
                setIsAddPackageOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" /> + Tambah Paket Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packages.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {p.code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{p.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      🛫 {formatDate(p.departureDate, "dd MMM yyyy")} s/d {formatDate(p.returnDate, "dd MMM yyyy")} ({p.durationDays} Hari)
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400">Quad (Ber-4)</p>
                    <p className="font-bold text-slate-800">{formatCurrency(p.priceQuad)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Triple (Ber-3)</p>
                    <p className="font-bold text-slate-800">{formatCurrency(p.priceTriple)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Double (Ber-2)</p>
                    <p className="font-bold text-slate-800">{formatCurrency(p.priceDouble)}</p>
                  </div>
                </div>

                {/* Commission Rates Badge */}
                <div className="flex flex-wrap items-center gap-2 p-2 bg-amber-50/60 rounded-xl border border-amber-200/80 text-[11px]">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    🏷️ Komisi Mitra/Agen: <strong className="text-emerald-800 font-mono">{formatCurrency(p.commissionAgent || 1500000)}</strong> /pax
                  </span>
                  <span className="text-amber-400">•</span>
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    Referral Alumni: <strong className="text-emerald-800 font-mono">{formatCurrency(p.commissionReferral || 500000)}</strong> /pax
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <span>✈️ {p.airline} • 🏨 {p.hotelMakkah}</span>
                  <span className="font-bold text-emerald-700">Kuota: {p.bookedCount || 0}/{p.quota} Seat</span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setEditingPackage(p);
                      setPackageForm({
                        code: p.code,
                        name: p.name,
                        description: p.description || "",
                        departureDate: p.departureDate ? new Date(p.departureDate).toISOString().split("T")[0] : "",
                        returnDate: p.returnDate ? new Date(p.returnDate).toISOString().split("T")[0] : "",
                        durationDays: String(p.durationDays),
                        hotelMakkah: p.hotelMakkah,
                        hotelMadinah: p.hotelMadinah,
                        airline: p.airline,
                        priceQuad: String(p.priceQuad),
                        priceTriple: String(p.priceTriple),
                        priceDouble: String(p.priceDouble),
                        quota: String(p.quota),
                        commissionAgent: String(p.commissionAgent || 1500000),
                        commissionReferral: String(p.commissionReferral || 500000),
                        status: p.status,
                      });
                      setIsAddPackageOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Paket
                  </button>
                  <button
                    onClick={() => handleDeletePackage(p.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: MASTER KODE & TEMPLATE SURAT RESMI */}
      {activeTab === "LETTERS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Master Singkatan Kode & Template Surat Resmi</h3>
                <span className="text-[10px] font-bold bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                  {letterTemplates.length} Jenis Surat
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Rujukan format baku penomoran, singkatan kode surat (ENDOS, PASPOR, CUTI, dll), dan instansi tujuan untuk Generator Surat Resmi.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingLetterTmpl(null);
                setLetterTmplForm({
                  code: "",
                  title: "",
                  subject: "",
                  defaultDest: "",
                  defaultNotes: "",
                  bodyTemplate: "",
                  isActive: true,
                });
                setIsAddLetterTmplOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 shadow-xs"
            >
              <Plus className="w-4 h-4" /> + Tambah Jenis / Kode Surat
            </button>
          </div>

          {/* Active Numbering Formula Banner */}
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-purple-200 uppercase bg-purple-800/60 px-2 py-0.5 rounded">
                Format Rumus Penomoran Resmi
              </span>
              <p className="font-mono text-sm md:text-base font-black text-amber-300 mt-1">
                [001..999] / [KODE_SURAT] / SULTHAN / [BULAN_ROMAWI] / [TAHUN]
              </p>
              <p className="text-xs text-purple-200 mt-0.5">
                Otomatis dihitung sekuensial berurutan oleh sistem saat menerbitkan surat resmi untuk jamaah.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3 py-2 rounded-xl text-xs font-mono text-right border border-white/15">
              <span className="text-purple-200 text-[10px] block">Contoh Terbit:</span>
              <strong className="text-amber-300">001/ENDOS/SULTHAN/VIII/2026</strong>
            </div>
          </div>

          {/* Letter Templates Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Singkatan Kode</th>
                    <th className="py-3 px-4">Nama / Judul Surat</th>
                    <th className="py-3 px-4">Perihal Baku</th>
                    <th className="py-3 px-4">Instansi Tujuan Standar</th>
                    <th className="py-3 px-4">Contoh Nomor Terbit</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {letterTemplates
                    .filter((tmpl) => {
                      return (
                        tmpl.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        tmpl.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        tmpl.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        tmpl.defaultDest?.toLowerCase().includes(searchTerm.toLowerCase())
                      );
                    })
                    .map((tmpl) => {
                      return (
                        <tr key={tmpl.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-black text-xs bg-purple-100 text-purple-900 px-2.5 py-1 rounded-md border border-purple-200">
                              {tmpl.code}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{tmpl.title}</p>
                            {tmpl.defaultNotes && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{tmpl.defaultNotes}</p>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {tmpl.subject}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            {tmpl.defaultDest}
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-xs text-indigo-700">
                            001/{tmpl.code}/SULTHAN/VIII/2026
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Aktif
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingLetterTmpl(tmpl);
                                  setLetterTmplForm({
                                    code: tmpl.code,
                                    title: tmpl.title,
                                    subject: tmpl.subject,
                                    defaultDest: tmpl.defaultDest,
                                    defaultNotes: tmpl.defaultNotes || "",
                                    bodyTemplate: tmpl.bodyTemplate || "",
                                    isActive: tmpl.isActive !== false,
                                  });
                                  setIsAddLetterTmplOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                                title="Edit Kode & Format Surat"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteLetterTmpl(tmpl.id, tmpl.code, tmpl.title)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                title="Hapus Template Surat"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: BAGAN AKUN & AKUNTANSI (CHART OF ACCOUNTS) */}
      {activeTab === "ACCOUNTS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Bagan Akun Keuangan & Akuntansi (COA)</h3>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                  {accounts.length} Akun Terdaftar
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Rujukan pencatatan Laporan Laba Rugi, Beban Pokok Penjualan (HPP), Biaya Operasional, dan Kas/Bank Travel Umroh.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingAccount(null);
                setAccountForm({
                  code: "",
                  name: "",
                  category: "HPP_EXPENSE",
                  group: "Beban Pokok Penjualan (HPP)",
                  normalBalance: "DEBIT",
                  description: "",
                  isActive: true,
                });
                setIsAddAccountOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs"
            >
              <Plus className="w-4 h-4" /> + Tambah Akun Akuntansi
            </button>
          </div>

          {/* Quick Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-500 mr-1">Filter Kategori:</span>
            {[
              { id: "ALL", label: "Semua Akun" },
              { id: "REVENUE", label: "Pendapatan Usaha (4xxx)" },
              { id: "HPP_EXPENSE", label: "HPP Paket Umroh (5xxx)" },
              { id: "OPEX_EXPENSE", label: "Beban Operasional (6xxx)" },
              { id: "ASSET", label: "Kas, Bank & Aset (1xxx)" },
              { id: "LIABILITY", label: "Hutang & DP (2xxx)" },
              { id: "EQUITY", label: "Modal & Ekuitas (3xxx)" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedAccountCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedAccountCategory === cat.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Accounts Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Kode Akun</th>
                    <th className="py-3 px-4">Nama Akun & Keterangan</th>
                    <th className="py-3 px-4">Kelompok / Sub-Klasifikasi</th>
                    <th className="py-3 px-4">Kategori Laporan Keuangan</th>
                    <th className="py-3 px-4 text-center">Saldo Normal</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {accounts
                    .filter((acc) => {
                      const matchSearch =
                        acc.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        acc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        acc.group?.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchCat =
                        selectedAccountCategory === "ALL" || acc.category === selectedAccountCategory;
                      return matchSearch && matchCat;
                    })
                    .map((acc) => {
                      let badge = { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", label: acc.category };
                      if (acc.category === "REVENUE") {
                        badge = { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", label: "Pendapatan Usaha" };
                      } else if (acc.category === "HPP_EXPENSE") {
                        badge = { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200", label: "Beban Pokok (HPP)" };
                      } else if (acc.category === "OPEX_EXPENSE") {
                        badge = { bg: "bg-amber-50", text: "text-amber-900", border: "border-amber-200", label: "Beban Operasional (Opex)" };
                      } else if (acc.category === "ASSET") {
                        badge = { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200", label: "Aset / Kas & Bank" };
                      } else if (acc.category === "LIABILITY") {
                        badge = { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", label: "Kewajiban / Hutang" };
                      } else if (acc.category === "EQUITY") {
                        badge = { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-200", label: "Modal & Ekuitas" };
                      }

                      return (
                        <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-black text-slate-900 text-sm">
                            {acc.code}
                          </td>

                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{acc.name}</p>
                            {acc.description && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{acc.description}</p>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {acc.group || "-"}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text} border ${badge.border}`}>
                              {badge.label}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center font-mono font-bold text-xs">
                            <span className={acc.normalBalance === "DEBIT" ? "text-blue-700" : "text-emerald-700"}>
                              {acc.normalBalance}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Aktif
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingAccount(acc);
                                  setAccountForm({
                                    code: acc.code,
                                    name: acc.name,
                                    category: acc.category,
                                    group: acc.group || "",
                                    normalBalance: acc.normalBalance || "DEBIT",
                                    description: acc.description || "",
                                    isActive: acc.isActive !== false,
                                  });
                                  setIsAddAccountOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                                title="Edit Akun"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAccount(acc.id, acc.code, acc.name)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                title="Hapus Akun"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MASTER BARANG LOGISTIK */}
      {activeTab === "EQUIPMENT" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/80">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Katalog Barang Perlengkapan Umroh</h3>
              <p className="text-xs text-slate-400">Rujukan untuk form serah terima logistik dan mutasi stok</p>
            </div>
            <button
              onClick={() => {
                setEditingEquipment(null);
                setEquipmentForm({
                  name: "",
                  sku: `EQ-${Date.now().toString().slice(-4)}`,
                  category: "AKSESORIS",
                  totalStock: "100",
                  availableStock: "100",
                  unit: "PCS",
                  minStockAlert: "20",
                  description: "",
                });
                setIsAddEquipmentOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" /> + Tambah Barang Baru
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Kode SKU</th>
                  <th className="py-3 px-4">Nama Barang</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Stok Tersedia</th>
                  <th className="py-3 px-4">Min. Alert</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {equipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">{eq.sku}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{eq.name}</td>
                    <td className="py-3 px-4 text-slate-500">{eq.category}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{eq.availableStock}</span> {eq.unit}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{eq.minStockAlert} {eq.unit}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingEquipment(eq);
                            setEquipmentForm({
                              name: eq.name,
                              sku: eq.sku,
                              category: eq.category,
                              totalStock: String(eq.totalStock),
                              availableStock: String(eq.availableStock),
                              unit: eq.unit,
                              minStockAlert: String(eq.minStockAlert),
                              description: eq.description || "",
                            });
                            setIsAddEquipmentOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                          title="Edit Barang"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEquipment(eq.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                          title="Hapus Barang"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MASTER SYARAT & DOKUMEN */}
      {activeTab === "DOCS" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/80">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Template Syarat & Dokumen Umroh Standar</h3>
              <p className="text-xs text-slate-400">Daftar syarat yang otomatis muncul pada ceklis dokumen setiap jamaah</p>
            </div>
            <button
              onClick={() => {
                setEditingTemplate(null);
                setTemplateForm({
                  name: "",
                  description: "",
                  isMandatory: true,
                });
                setIsAddTemplateOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" /> + Tambah Syarat Baru
            </button>
          </div>

          <div className="space-y-2">
            {reqTemplates.map((t, idx) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t.name}</p>
                    <p className="text-[11px] text-slate-500">{t.description || "Tidak ada rincian keterangan"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.isMandatory ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {t.isMandatory ? "Wajib" : "Kondisional"}
                  </span>
                  <button
                    onClick={() => {
                      setEditingTemplate(t);
                      setTemplateForm({
                        name: t.name,
                        description: t.description || "",
                        isMandatory: t.isMandatory,
                      });
                      setIsAddTemplateOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(t.id)}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MASTER PROFIL TRAVEL & REKENING BANK */}
      {activeTab === "SETTINGS" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-4xl">
          <div className="pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-900">Profil Legalitas Travel & Rekening Bank PPIU</h3>
            <p className="text-xs text-slate-500">
              Data ini otomatis digunakan sebagai KOP Surat Resmi, Kwitansi, pesan tagihan WhatsApp, dan Berita Acara (BAST).
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700">Nama Perusahaan / Travel Umroh *</label>
                <input
                  type="text"
                  required
                  value={travelSettings.companyName}
                  onChange={(e) => setTravelSettings({ ...travelSettings, companyName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Nomor SK Izin PPIU Kemenag RI *</label>
                <input
                  type="text"
                  required
                  placeholder="PPIU Kemenag RI No. U.412 Tahun 2022"
                  value={travelSettings.licenseNumber}
                  onChange={(e) => setTravelSettings({ ...travelSettings, licenseNumber: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Nomor Izin / Rekomendasi Kemenhan RI</label>
                <input
                  type="text"
                  placeholder="Izin Khusus Kemenhan RI No. B/108/M/XII/2023"
                  value={travelSettings.kemenhanLicense || ""}
                  onChange={(e) => setTravelSettings({ ...travelSettings, kemenhanLicense: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono text-emerald-900"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700">Alamat Kantor Pusat Travel *</label>
              <textarea
                rows={2}
                required
                value={travelSettings.address}
                onChange={(e) => setTravelSettings({ ...travelSettings, address: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700">Nomor Telepon Kantor / Call Center</label>
                <input
                  type="text"
                  value={travelSettings.phone}
                  onChange={(e) => setTravelSettings({ ...travelSettings, phone: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">Email Resmi</label>
                <input
                  type="email"
                  value={travelSettings.email}
                  onChange={(e) => setTravelSettings({ ...travelSettings, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">Website</label>
                <input
                  type="text"
                  value={travelSettings.website}
                  onChange={(e) => setTravelSettings({ ...travelSettings, website: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="font-bold text-slate-700">Nama Pimpinan / Direktur Penandatangan</label>
                <input
                  type="text"
                  value={travelSettings.directorName}
                  onChange={(e) => setTravelSettings({ ...travelSettings, directorName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">Jabatan Penandatangan</label>
                <input
                  type="text"
                  value={travelSettings.directorTitle}
                  onChange={(e) => setTravelSettings({ ...travelSettings, directorTitle: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <p className="font-bold text-slate-900">Rekening Bank Resmi Travel (Untuk Invoice & WhatsApp Follow-up):</p>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Bank Syariah Indonesia (BSI)</label>
                <input
                  type="text"
                  value={travelSettings.bankBSI}
                  onChange={(e) => setTravelSettings({ ...travelSettings, bankBSI: e.target.value })}
                  className="mt-0.5 w-full rounded-xl border border-slate-200 p-2.5 font-mono text-emerald-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Bank Central Asia (BCA)</label>
                <input
                  type="text"
                  value={travelSettings.bankBCA}
                  onChange={(e) => setTravelSettings({ ...travelSettings, bankBCA: e.target.value })}
                  className="mt-0.5 w-full rounded-xl border border-slate-200 p-2.5 font-mono text-blue-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Bank Mandiri</label>
                <input
                  type="text"
                  value={travelSettings.bankMandiri}
                  onChange={(e) => setTravelSettings({ ...travelSettings, bankMandiri: e.target.value })}
                  className="mt-0.5 w-full rounded-xl border border-slate-200 p-2.5 font-mono text-amber-800"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm"
              >
                <Save className="w-4 h-4" /> {loading ? "Menyimpan..." : "Simpan Perubahan Master Travel"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: HAK AKSES & PERMISSION MATRIX (USER MANAGEMENT) */}
      {activeTab === "STAFF" && (
        <div className="space-y-6">
          {/* Top Info & Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Manajemen Pengguna & Aturan Matriks Hak Akses (Permission Matrix)</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi akun staf, peran hak akses (Role-Based Access Control), dan hierarki kewenangan operasional travel.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingUser(null);
                setUserForm({
                  name: "",
                  username: "",
                  password: "1234",
                  email: "",
                  phone: "",
                  role: "ADMIN_OPERASIONAL",
                  isActive: true,
                });
                setIsAddUserOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs"
            >
              <Plus className="w-4 h-4" /> + Tambah Pengguna Baru
            </button>
          </div>

          {/* 1. INTERACTIVE PERMISSION MATRIX TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-3 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-600" />
                  Tabel Matriks Hak Akses Modul (Role Permission Matrix)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Aturan pembagian kewenangan setiap role dalam mengakses dan mengelola fitur aplikasi.
                </p>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                Standar Keamanan Travel PPIU
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Modul & Fitur Aplikasi</th>
                    <th className="py-3 px-3 text-center bg-amber-950 text-amber-200">
                      SUPERADMIN (master)
                    </th>
                    <th className="py-3 px-3 text-center bg-slate-800 text-blue-200">
                      ADMIN OPERASIONAL
                    </th>
                    <th className="py-3 px-3 text-center bg-slate-800 text-emerald-200">
                      ADMIN FINANCE
                    </th>
                    <th className="py-3 px-3 text-center bg-slate-800 text-purple-200">
                      ADMIN MARKETING
                    </th>
                    <th className="py-3 px-3 text-center bg-slate-800 text-teal-200">
                      STAF LOGISTIK
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {[
                    {
                      modul: "Dashboard & Ringkasan Metrik KPI",
                      super: "🟢 Akses Penuh",
                      ops: "🟢 Akses Penuh",
                      fin: "🟢 Akses Penuh",
                      mkt: "🟢 Akses Penuh",
                      log: "🟡 Lihat Ringkasan",
                    },
                    {
                      modul: "Marketing, Leads & Pipeline Prospek",
                      super: "🟢 Akses Penuh",
                      ops: "🟡 Lihat Data",
                      fin: "⚪ Tidak Ada",
                      mkt: "🟢 Akses Penuh (Kelola Leads)",
                      log: "⚪ Tidak Ada",
                    },
                    {
                      modul: "Database Jamaah & Manifest Keberangkatan",
                      super: "🟢 Akses Penuh",
                      ops: "🟢 Akses Penuh (CRUD Jamaah)",
                      fin: "🟡 Lihat & Status Bayar",
                      mkt: "🟡 Lihat Manifest",
                      log: "🟡 Data Perlengkapan",
                    },
                    {
                      modul: "Invoicing, Tagihan & Konfirmasi Pembayaran",
                      super: "🟢 Akses Penuh",
                      ops: "🟡 Buat Tagihan Awal",
                      fin: "🟢 Akses Penuh (Verifikasi Lunas)",
                      mkt: "🟡 Lihat Status DP",
                      log: "⚪ Tidak Ada",
                    },
                    {
                      modul: "Laba Rugi, Akuntansi & Jurnal Umum",
                      super: "🟢 Akses Penuh",
                      ops: "⚪ Dibatasi",
                      fin: "🟢 Akses Penuh (Double-Entry)",
                      mkt: "⚪ Dibatasi",
                      log: "⚪ Dibatasi",
                    },
                    {
                      modul: "Inventaris Logistik Gudang & Mutasi Stok",
                      super: "🟢 Akses Penuh",
                      ops: "🟡 Ceklis Serah Terima",
                      fin: "🟡 Audit Nilai HPP",
                      mkt: "⚪ Tidak Ada",
                      log: "🟢 Akses Penuh (Input Mutasi)",
                    },
                    {
                      modul: "Ceklis Berkas & Syarat Umroh",
                      super: "🟢 Akses Penuh",
                      ops: "🟢 Verifikasi & Validasi",
                      fin: "⚪ Tidak Ada",
                      mkt: "🟡 Upload Berkas Jamaah",
                      log: "⚪ Tidak Ada",
                    },
                    {
                      modul: "Generator Surat Resmi (Paspor/Endos/Cuti)",
                      super: "🟢 Akses Penuh",
                      ops: "🟢 Terbitkan & Cetak PDF",
                      fin: "⚪ Tidak Ada",
                      mkt: "⚪ Tidak Ada",
                      log: "⚪ Tidak Ada",
                    },
                    {
                      modul: "Cabang & Agen Freelance Referral",
                      super: "🟢 Akses Penuh",
                      ops: "🟡 Lihat Agen",
                      fin: "🟢 Komisi & Fee Agen",
                      mkt: "🟢 Akses Penuh (Kelola Agen)",
                      log: "⚪ Tidak Ada",
                    },
                    {
                      modul: "Pusat Data Master, COA & Manajemen User",
                      super: "🟢 Akses Penuh (Master)",
                      ops: "🟡 Lihat Paket & Syarat",
                      fin: "🟡 Master Bagan Akun (COA)",
                      mkt: "🟡 Lihat Brosur & Paket",
                      log: "🟡 Master Barang",
                    },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3.5 font-bold text-slate-900 border-r border-slate-100">
                        {row.modul}
                      </td>
                      <td className="py-2.5 px-3 text-center bg-amber-50/40 font-bold text-amber-900 border-r border-slate-100">
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[11px]">
                          {row.super}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-100 text-[11px]">
                        {row.ops.startsWith("🟢") ? (
                          <span className="text-emerald-700 font-bold">{row.ops}</span>
                        ) : row.ops.startsWith("🟡") ? (
                          <span className="text-blue-700">{row.ops}</span>
                        ) : (
                          <span className="text-slate-400">{row.ops}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-100 text-[11px]">
                        {row.fin.startsWith("🟢") ? (
                          <span className="text-emerald-700 font-bold">{row.fin}</span>
                        ) : row.fin.startsWith("🟡") ? (
                          <span className="text-blue-700">{row.fin}</span>
                        ) : (
                          <span className="text-slate-400">{row.fin}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-100 text-[11px]">
                        {row.mkt.startsWith("🟢") ? (
                          <span className="text-emerald-700 font-bold">{row.mkt}</span>
                        ) : row.mkt.startsWith("🟡") ? (
                          <span className="text-blue-700">{row.mkt}</span>
                        ) : (
                          <span className="text-slate-400">{row.mkt}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center text-[11px]">
                        {row.log.startsWith("🟢") ? (
                          <span className="text-emerald-700 font-bold">{row.log}</span>
                        ) : row.log.startsWith("🟡") ? (
                          <span className="text-blue-700">{row.log}</span>
                        ) : (
                          <span className="text-slate-400">{row.log}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. USER MANAGEMENT LIST */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Daftar Pengguna Aplikasi Terdaftar ({staffUsers.length} Pengguna)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Gunakan username dan password terdaftar untuk login ke dalam sistem.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama Pengguna & Email</th>
                    <th className="py-3 px-4">Username Login</th>
                    <th className="py-3 px-4">Peran Hak Akses (Role)</th>
                    <th className="py-3 px-4 text-center">Status Akun</th>
                    <th className="py-3 px-4 text-center">Terakhir Login</th>
                    <th className="py-3 px-4 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {staffUsers.map((u) => {
                    const isMaster = u.username === "master";
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                {u.name}
                                {isMaster && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                    SUPERADMIN
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-400">{u.email || "-"}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          @{u.username || u.email?.split("@")[0] || "user"}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              u.role === "SUPERADMIN"
                                ? "bg-amber-50 text-amber-900 border-amber-200"
                                : u.role === "ADMIN_OPERASIONAL"
                                ? "bg-blue-50 text-blue-900 border-blue-200"
                                : u.role === "ADMIN_FINANCE"
                                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                                : u.role === "ADMIN_MARKETING"
                                ? "bg-purple-50 text-purple-900 border-purple-200"
                                : "bg-teal-50 text-teal-900 border-teal-200"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {u.isActive !== false ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Aktif
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                              Nonaktif
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-slate-500 text-[11px]">
                          {u.lastLogin ? formatDate(u.lastLogin, "dd MMM yyyy, HH:mm") : "-"}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setUserForm({
                                  name: u.name,
                                  username: u.username || "",
                                  password: u.password || "",
                                  email: u.email || "",
                                  phone: u.phone || "",
                                  role: u.role || "ADMIN_OPERASIONAL",
                                  isActive: u.isActive !== false,
                                });
                                setIsAddUserOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                              title="Edit Pengguna"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {!isMaster && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                title="Hapus Pengguna"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT / TAMBAH PAKET */}
      {isAddPackageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingPackage ? "Edit Master Paket Umroh" : "Tambah Master Paket Umroh"}
              </h3>
              <button onClick={() => setIsAddPackageOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Kode Paket</label>
                  <input
                    type="text"
                    required
                    value={packageForm.code}
                    onChange={(e) => setPackageForm({ ...packageForm, code: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-slate-700">Nama Paket Umroh *</label>
                  <input
                    type="text"
                    required
                    value={packageForm.name}
                    onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Tgl Keberangkatan *</label>
                  <input
                    type="date"
                    required
                    value={packageForm.departureDate}
                    onChange={(e) => setPackageForm({ ...packageForm, departureDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Tgl Kepulangan *</label>
                  <input
                    type="date"
                    required
                    value={packageForm.returnDate}
                    onChange={(e) => setPackageForm({ ...packageForm, returnDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Durasi Hari</label>
                  <input
                    type="number"
                    value={packageForm.durationDays}
                    onChange={(e) => setPackageForm({ ...packageForm, durationDays: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Hotel Makkah */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 text-xs">Hotel Makkah *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickHotelCity("MAKKAH");
                        setQuickHotelForm({ name: "", rating: "5", distance: "" });
                        setIsQuickAddHotelOpen(true);
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> + Tambah Hotel
                    </button>
                  </div>
                  <div className="mt-1 flex gap-1.5">
                    <select
                      value={packageForm.hotelMakkah}
                      onChange={(e) => setPackageForm({ ...packageForm, hotelMakkah: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    >
                      <option value="">-- Pilih Hotel Makkah --</option>
                      {makkahHotels.map((h) => (
                        <option key={h.id} value={h.name}>
                          {h.name} {h.rating ? `(★${h.rating})` : ""} {h.distance ? `• ${h.distance}` : ""}
                        </option>
                      ))}
                      {packageForm.hotelMakkah && !makkahHotels.some((h) => h.name === packageForm.hotelMakkah) && (
                        <option value={packageForm.hotelMakkah}>{packageForm.hotelMakkah} (Kustom)</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Hotel Madinah */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 text-xs">Hotel Madinah *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickHotelCity("MADINAH");
                        setQuickHotelForm({ name: "", rating: "5", distance: "" });
                        setIsQuickAddHotelOpen(true);
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> + Tambah Hotel
                    </button>
                  </div>
                  <div className="mt-1 flex gap-1.5">
                    <select
                      value={packageForm.hotelMadinah}
                      onChange={(e) => setPackageForm({ ...packageForm, hotelMadinah: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    >
                      <option value="">-- Pilih Hotel Madinah --</option>
                      {madinahHotels.map((h) => (
                        <option key={h.id} value={h.name}>
                          {h.name} {h.rating ? `(★${h.rating})` : ""} {h.distance ? `• ${h.distance}` : ""}
                        </option>
                      ))}
                      {packageForm.hotelMadinah && !madinahHotels.some((h) => h.name === packageForm.hotelMadinah) && (
                        <option value={packageForm.hotelMadinah}>{packageForm.hotelMadinah} (Kustom)</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Maskapai Penerbangan */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 text-xs">Maskapai Penerbangan *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickAirlineForm({ name: "", code: "", routeType: "DIRECT" });
                        setIsQuickAddAirlineOpen(true);
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> + Tambah Maskapai
                    </button>
                  </div>
                  <div className="mt-1 flex gap-1.5">
                    <select
                      value={packageForm.airline}
                      onChange={(e) => setPackageForm({ ...packageForm, airline: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    >
                      <option value="">-- Pilih Maskapai Penerbangan --</option>
                      {airlines.map((a) => (
                        <option key={a.id} value={a.name}>
                          ✈️ {a.name} {a.code ? `(${a.code})` : ""}
                        </option>
                      ))}
                      {packageForm.airline && !airlines.some((a) => a.name === packageForm.airline) && (
                        <option value={packageForm.airline}>✈️ {packageForm.airline} (Kustom)</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Kuota Seat */}
                <div>
                  <label className="font-bold text-slate-700 text-xs">Kuota Seat Jamaah *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={packageForm.quota}
                    onChange={(e) => setPackageForm({ ...packageForm, quota: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Harga Quad (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={packageForm.priceQuad}
                    onChange={(e) => setPackageForm({ ...packageForm, priceQuad: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Harga Triple (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={packageForm.priceTriple}
                    onChange={(e) => setPackageForm({ ...packageForm, priceTriple: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Harga Double (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={packageForm.priceDouble}
                    onChange={(e) => setPackageForm({ ...packageForm, priceDouble: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 font-bold"
                  />
                </div>
              </div>

              {/* Setting Komisi Paket */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
                <p className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                  🏷️ Skema Komisi per Pax (Terintegrasi ke Modul Agen & Laba Rugi)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Komisi Mitra / Agen per Pax (Rp) *</label>
                    <input
                      type="number"
                      required
                      placeholder="1500000"
                      value={packageForm.commissionAgent}
                      onChange={(e) => setPackageForm({ ...packageForm, commissionAgent: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2 bg-white text-xs font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Komisi Referral Alumni per Pax (Rp) *</label>
                    <input
                      type="number"
                      required
                      placeholder="500000"
                      value={packageForm.commissionReferral}
                      onChange={(e) => setPackageForm({ ...packageForm, commissionReferral: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2 bg-white text-xs font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPackageOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  {loading ? "Menyimpan..." : "Simpan Paket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT / TAMBAH BARANG LOGISTIK */}
      {isAddEquipmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingEquipment ? "Edit Master Barang" : "Tambah Master Barang"}
              </h3>
              <button onClick={() => setIsAddEquipmentOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEquipment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nama Barang *</label>
                <input
                  type="text"
                  required
                  value={equipmentForm.name}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Kode SKU</label>
                  <input
                    type="text"
                    value={equipmentForm.sku}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, sku: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Kategori</label>
                  <select
                    value={equipmentForm.category}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 bg-white"
                  >
                    <option value="BAGASI">Bagasi & Tas</option>
                    <option value="KAIN">Kain Ihram</option>
                    <option value="SERAGAM">Mukena / Batik</option>
                    <option value="AKSESORIS">Aksesoris & ID Card</option>
                    <option value="DOKUMEN">Buku Doa & Panduan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Stok Tersedia</label>
                  <input
                    type="number"
                    value={equipmentForm.availableStock}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, availableStock: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Satuan</label>
                  <select
                    value={equipmentForm.unit}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, unit: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 bg-white"
                  >
                    <option value="PCS">PCS</option>
                    <option value="SET">SET</option>
                    <option value="LEMBAR">LEMBAR</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Min. Alert</label>
                  <input
                    type="number"
                    value={equipmentForm.minStockAlert}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, minStockAlert: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEquipmentOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  {loading ? "Menyimpan..." : "Simpan Barang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT / TAMBAH TEMPLATE SYARAT */}
      {isAddTemplateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingTemplate ? "Edit Template Syarat" : "Tambah Template Syarat"}
              </h3>
              <button onClick={() => setIsAddTemplateOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nama Syarat & Dokumen *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rekam Biometrik Saudi Visa Bio App"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Deskripsi / Penjelasan Syarat</label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan detail berkas yang dibutuhkan..."
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="mandatoryCheck"
                  checked={templateForm.isMandatory}
                  onChange={(e) => setTemplateForm({ ...templateForm, isMandatory: e.target.checked })}
                  className="h-4 w-4 rounded text-emerald-600"
                />
                <label htmlFor="mandatoryCheck" className="text-xs font-semibold text-slate-700">
                  Syarat Wajib untuk Seluruh Jamaah
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTemplateOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  {loading ? "Menyimpan..." : "Simpan Syarat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT / TAMBAH USER PENGGUNA */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                {editingUser ? "Edit Akun Pengguna" : "Tambah Pengguna Baru"}
              </h3>
              <button onClick={() => setIsAddUserOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nama Lengkap Pengguna *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ustadz Ahmad Fauzi"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Username Login *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. master / admin_ops"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Kata Sandi (Password) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Default: 1234"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Peran Hak Akses (Role) *</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-900"
                >
                  <option value="SUPERADMIN">SUPERADMIN (Akses Penuh 100% Seluruh Modul)</option>
                  <option value="ADMIN_OPERASIONAL">ADMIN OPERASIONAL (Manifest, Berkas, Serah Terima, Surat)</option>
                  <option value="ADMIN_FINANCE">ADMIN FINANCE (Invoicing, Laba Rugi, Jurnal Umum, COA)</option>
                  <option value="ADMIN_MARKETING">ADMIN MARKETING (Leads Prospek & Cabang Agen)</option>
                  <option value="STAF_LOGISTIK">STAF LOGISTIK (Inventaris Logistik Gudang)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Email Pengguna</label>
                  <input
                    type="email"
                    placeholder="user@sulthanharamain.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Nomor HP / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="08123456789"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="userActiveCheck"
                  checked={userForm.isActive}
                  onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="userActiveCheck" className="text-xs font-semibold text-slate-700">
                  Akun Aktif (Dapat Login ke Sistem)
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs"
                >
                  {loading ? "Menyimpan..." : "Simpan Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah & Edit Akun Akuntansi (COA) */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                {editingAccount ? "Edit / Ubah Akun Akuntansi" : "Tambah Akun Akuntansi Baru"}
              </h3>
              <button
                onClick={() => setIsAddAccountOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Kode Akun *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5109 / 6103"
                    value={accountForm.code}
                    onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Kategori Laporan *</label>
                  <select
                    value={accountForm.category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      let defaultGroup = "Beban Pokok Penjualan (HPP)";
                      let defaultBal = "DEBIT";
                      if (newCat === "REVENUE") {
                        defaultGroup = "Pendapatan Operasional";
                        defaultBal = "CREDIT";
                      } else if (newCat === "OPEX_EXPENSE") {
                        defaultGroup = "Beban Operasional & Marketing";
                        defaultBal = "DEBIT";
                      } else if (newCat === "ASSET") {
                        defaultGroup = "Kas & Setara Kas";
                        defaultBal = "DEBIT";
                      } else if (newCat === "LIABILITY") {
                        defaultGroup = "Hutang Usaha";
                        defaultBal = "CREDIT";
                      } else if (newCat === "EQUITY") {
                        defaultGroup = "Modal & Ekuitas";
                        defaultBal = "CREDIT";
                      }
                      setAccountForm({
                        ...accountForm,
                        category: newCat,
                        group: defaultGroup,
                        normalBalance: defaultBal,
                      });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-900"
                  >
                    <option value="REVENUE">4 - Pendapatan Usaha (Revenue)</option>
                    <option value="HPP_EXPENSE">5 - Beban Pokok Pendapatan (HPP)</option>
                    <option value="OPEX_EXPENSE">6 - Beban Operasional (Opex)</option>
                    <option value="ASSET">1 - Aset / Kas & Bank</option>
                    <option value="LIABILITY">2 - Kewajiban / Hutang</option>
                    <option value="EQUITY">3 - Modal & Ekuitas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Nama Akun Akuntansi *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HPP - Visa & Asuransi Saudi / Beban Iklan Meta"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Kelompok / Sub-Klasifikasi *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Beban Pokok Penjualan (HPP)"
                    value={accountForm.group}
                    onChange={(e) => setAccountForm({ ...accountForm, group: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Saldo Normal *</label>
                  <select
                    value={accountForm.normalBalance}
                    onChange={(e) => setAccountForm({ ...accountForm, normalBalance: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-mono font-bold"
                  >
                    <option value="DEBIT">DEBIT (Bertambah di Debet)</option>
                    <option value="CREDIT">CREDIT (Bertambah di Kredit)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Keterangan / Fungsi Akun</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Pos pencatatan seluruh pengeluaran tiket maskapai keberangkatan"
                  value={accountForm.description}
                  onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddAccountOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs"
                >
                  {loading ? "Menyimpan..." : "Simpan Akun Akuntansi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah & Edit Template Kode Surat */}
      {isAddLetterTmplOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                {editingLetterTmpl ? "Edit Kode & Format Surat" : "Tambah Jenis / Kode Surat Baru"}
              </h3>
              <button
                onClick={() => setIsAddLetterTmplOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLetterTmpl} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Singkatan Kode Surat *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ENDOS / VISA / SP"
                    value={letterTmplForm.code}
                    onChange={(e) => setLetterTmplForm({ ...letterTmplForm, code: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono font-black uppercase text-purple-900 bg-purple-50/50"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Muncul di nomor: 001/<strong>{letterTmplForm.code || "KODE"}</strong>/SULTHAN/VIII/2026</p>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Nama / Judul Surat *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Surat Permohonan Endos Nama"
                    value={letterTmplForm.title}
                    onChange={(e) => setLetterTmplForm({ ...letterTmplForm, title: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Perihal Baku (Subject) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Permohonan Penambahan / Endorsement Nama pada Paspor"
                  value={letterTmplForm.subject}
                  onChange={(e) => setLetterTmplForm({ ...letterTmplForm, subject: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Instansi Tujuan Standar *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kepala Kantor Imigrasi Kelas I / II TPI"
                  value={letterTmplForm.defaultDest}
                  onChange={(e) => setLetterTmplForm({ ...letterTmplForm, defaultDest: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Keterangan / Fungsi Dokumen</label>
                <input
                  type="text"
                  placeholder="e.g. Surat resmi untuk persyaratan 3 kata di Paspor Imigrasi"
                  value={letterTmplForm.defaultNotes}
                  onChange={(e) => setLetterTmplForm({ ...letterTmplForm, defaultNotes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Template Paragraf Pembuka / Isi Baku</label>
                <textarea
                  rows={3}
                  placeholder="Bersama ini kami selaku Pimpinan PT SULTHAN HARAMAIN TOUR & TRAVEL mengajukan permohonan..."
                  value={letterTmplForm.bodyTemplate}
                  onChange={(e) => setLetterTmplForm({ ...letterTmplForm, bodyTemplate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddLetterTmplOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-xs"
                >
                  {loading ? "Menyimpan..." : "Simpan Kode & Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QUICK ADD MASTER HOTEL (MAKKAH / MADINAH) */}
      {isQuickAddHotelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Tambah Master Hotel {quickHotelCity === "MAKKAH" ? "Makkah" : "Madinah"}
              </h3>
              <button
                onClick={() => setIsQuickAddHotelOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickHotel} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nama Lengkap Hotel *</label>
                <input
                  type="text"
                  required
                  placeholder={
                    quickHotelCity === "MAKKAH"
                      ? "e.g. Fairmont Makkah Clock Royal Tower"
                      : "e.g. Dar Al Taqwa Hotel Madinah"
                  }
                  value={quickHotelForm.name}
                  onChange={(e) => setQuickHotelForm({ ...quickHotelForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Kelas Bintang Hotel *</label>
                  <select
                    value={quickHotelForm.rating}
                    onChange={(e) => setQuickHotelForm({ ...quickHotelForm, rating: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-amber-900"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ Bintang 5</option>
                    <option value="4">⭐⭐⭐⭐ Bintang 4</option>
                    <option value="3">⭐⭐⭐ Bintang 3</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Kota Lokasi</label>
                  <input
                    type="text"
                    disabled
                    value={quickHotelCity === "MAKKAH" ? "Kota Makkah" : "Kota Madinah"}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-100 font-bold text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Jarak / Lokasi ke Masjid (Opsional)</label>
                <input
                  type="text"
                  placeholder="e.g. Pelataran Depan Masjid / 50m dari Pintu Utama"
                  value={quickHotelForm.distance}
                  onChange={(e) => setQuickHotelForm({ ...quickHotelForm, distance: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                ✨ Hotel baru akan otomatis disimpan ke database Master dan langsung terpilih pada paket umroh.
              </p>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickAddHotelOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs"
                >
                  {loading ? "Menyimpan..." : "Simpan Hotel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QUICK ADD MASTER MASKAPAI */}
      {isQuickAddAirlineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plane className="w-5 h-5 text-emerald-600" />
                Tambah Maskapai Penerbangan Baru
              </h3>
              <button
                onClick={() => setIsQuickAddAirlineOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickAirline} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nama Maskapai Penerbangan *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Garuda Indonesia (Direct CGK - JED)"
                  value={quickAirlineForm.name}
                  onChange={(e) => setQuickAirlineForm({ ...quickAirlineForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Kode IATA (Opsional)</label>
                  <input
                    type="text"
                    placeholder="e.g. GA / SV / EK"
                    value={quickAirlineForm.code}
                    onChange={(e) => setQuickAirlineForm({ ...quickAirlineForm, code: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Tipe Penerbangan</label>
                  <select
                    value={quickAirlineForm.routeType}
                    onChange={(e) => setQuickAirlineForm({ ...quickAirlineForm, routeType: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
                  >
                    <option value="DIRECT">Direct (Langsung)</option>
                    <option value="TRANSIT">Transit (1x Stop)</option>
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                ✨ Maskapai baru akan otomatis tersimpan di database Master dan langsung terpilih pada paket umroh.
              </p>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickAddAirlineOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs"
                >
                  {loading ? "Menyimpan..." : "Simpan Maskapai"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
