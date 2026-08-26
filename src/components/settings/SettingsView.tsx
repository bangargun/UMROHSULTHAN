"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Key,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  X,
  UserCheck,
  Eye,
  Download,
  AlertCircle,
  Layers,
  HelpCircle,
  Filter,
  CreditCard,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface UserItem {
  id: string;
  name: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

interface AppRoleItem {
  id: string;
  key: string;
  name: string;
  description: string | null;
  badgeColor: string;
  isSystem: boolean;
  orderIndex: number;
}

interface ModuleItem {
  key: string;
  name: string;
  desc: string;
}

interface PermissionItem {
  id?: string;
  roleKey: string;
  moduleKey: string;
  moduleName?: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

interface SettingsViewProps {
  onRefreshAll?: () => void;
}

export default function SettingsView({ onRefreshAll }: SettingsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"users" | "permissions" | "company">("permissions");

  // State: Users
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const [userFormData, setUserFormData] = useState({
    name: "",
    username: "",
    password: "1234",
    email: "",
    phone: "",
    role: "ADMIN_OPERASIONAL",
    isActive: true,
  });

  // State: Permissions & Roles
  const [roles, setRoles] = useState<AppRoleItem[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);
  const [selectedRoleForDetail, setSelectedRoleForDetail] = useState<string>("ADMIN_OPERASIONAL");
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleData, setNewRoleData] = useState({
    roleKey: "",
    roleName: "",
    description: "",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
  });

  // State: Travel Settings
  const [travelSettings, setTravelSettings] = useState({
    companyName: "PT SULTHAN HARAMAIN TOUR & TRAVEL",
    licenseNumber: "PPIU Kemenag RI No. U.412 Tahun 2022",
    kemenhanLicense: "Izin Khusus Kemenhan RI No. B/108/M/XII/2023",
    directorName: "H. Sulthan Syarif, Lc., M.A.",
    directorTitle: "Direktur Utama",
    address: "Sulthan Haramain Tower, Jl. Prof. Dr. Satrio No. 88, Kuningan, Jakarta Selatan 12940",
    phone: "(021) 5290-8888 / 0811-9876-5432",
    email: "salam@sulthanharamain.com",
    website: "www.sulthanharamain.com",
    bankBSI: "8888-999-123 a.n PT SULTHAN HARAMAIN TOUR & TRAVEL",
    bankBCA: "731-888-9900 a.n PT SULTHAN HARAMAIN TOUR & TRAVEL",
    bankMandiri: "137-00-8888999-1 a.n PT SULTHAN HARAMAIN TOUR & TRAVEL",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Fetch Users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Permissions & Roles
  const fetchPermissions = async () => {
    setLoadingPerms(true);
    try {
      const res = await fetch("/api/permissions");
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
        setModules(data.modules || []);
        setPermissions(data.permissions || []);
      }
    } catch (err) {
      console.error("Failed to load permissions:", err);
    } finally {
      setLoadingPerms(false);
    }
  };

  // Fetch Travel Settings
  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data && data.companyName) {
          setTravelSettings(data);
        }
      }
    } catch (err) {
      console.error("Failed to load travel settings:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPermissions();
    fetchSettings();
  }, []);

  // Helper to get permission
  const getPermission = (roleKey: string, moduleKey: string): PermissionItem => {
    const found = permissions.find((p) => p.roleKey === roleKey && p.moduleKey === moduleKey);
    if (found) return found;
    return {
      roleKey,
      moduleKey,
      canView: roleKey === "SUPERADMIN",
      canCreate: roleKey === "SUPERADMIN",
      canEdit: roleKey === "SUPERADMIN",
      canDelete: roleKey === "SUPERADMIN",
      canExport: roleKey === "SUPERADMIN",
    };
  };

  // Update a single cell permission in local state
  const handleTogglePermission = (
    roleKey: string,
    moduleKey: string,
    action: "canView" | "canCreate" | "canEdit" | "canDelete" | "canExport"
  ) => {
    if (roleKey === "SUPERADMIN") {
      alert("Role SUPERADMIN memiliki hak akses penuh permanen (Protected Superadmin).");
      return;
    }

    setPermissions((prev) => {
      const index = prev.findIndex((p) => p.roleKey === roleKey && p.moduleKey === moduleKey);
      if (index >= 0) {
        const updated = [...prev];
        const current = updated[index];
        const newVal = !current[action];

        // If disabling canView, disable create/edit/delete/export too
        let newPerm = { ...current, [action]: newVal };
        if (action === "canView" && !newVal) {
          newPerm = { ...newPerm, canCreate: false, canEdit: false, canDelete: false, canExport: false };
        }
        // If enabling create/edit/delete/export, auto-enable canView
        if (action !== "canView" && newVal) {
          newPerm = { ...newPerm, canView: true };
        }

        updated[index] = newPerm;
        return updated;
      } else {
        // Create new
        const newPerm: PermissionItem = {
          roleKey,
          moduleKey,
          canView: action === "canView" ? true : false,
          canCreate: action === "canCreate" ? true : false,
          canEdit: action === "canEdit" ? true : false,
          canDelete: action === "canDelete" ? true : false,
          canExport: action === "canExport" ? true : false,
        };
        if (action !== "canView" && newPerm[action]) {
          newPerm.canView = true;
        }
        return [...prev, newPerm];
      }
    });
  };

  // Bulk set permissions for a module in a role
  const handleSetRowPermissions = (roleKey: string, moduleKey: string, preset: "ALL" | "READ_ONLY" | "NONE") => {
    if (roleKey === "SUPERADMIN") return;

    setPermissions((prev) => {
      const index = prev.findIndex((p) => p.roleKey === roleKey && p.moduleKey === moduleKey);
      const newValues =
        preset === "ALL"
          ? { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true }
          : preset === "READ_ONLY"
          ? { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: true }
          : { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false };

      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...newValues };
        return updated;
      } else {
        return [...prev, { roleKey, moduleKey, ...newValues }];
      }
    });
  };

  // Save All Permissions
  const handleSavePermissions = async () => {
    setSavingPerms(true);
    try {
      const res = await fetch("/api/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
      });
      if (res.ok) {
        alert("✅ Matriks Hak Akses berhasil disimpan dan langsung diterapkan ke seluruh sistem!");
        fetchPermissions();
      } else {
        alert("Gagal menyimpan hak akses.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi saat menyimpan.");
    } finally {
      setSavingPerms(false);
    }
  };

  // Reset to PPIU Standard
  const handleResetToStandard = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin mereset seluruh matriks hak akses ke Standar Rekomendasi Resmi PPIU Kemenag?\n\nSemua kustomisasi hak akses peran akan disesuaikan kembali ke konfigurasi baku."
      )
    ) {
      return;
    }
    setSavingPerms(true);
    try {
      const res = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET_TO_DEFAULT" }),
      });
      if (res.ok) {
        alert("✅ Matriks Hak Akses berhasil dikembalikan ke Standar Rekomendasi PPIU!");
        fetchPermissions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPerms(false);
    }
  };

  // Add Custom Role
  const handleAddCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRoleData),
      });
      if (res.ok) {
        setIsAddRoleModalOpen(false);
        setNewRoleData({
          roleKey: "",
          roleName: "",
          description: "",
          badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
        });
        alert(`Peran baru "${newRoleData.roleName}" berhasil dibuat!`);
        fetchPermissions();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal membuat peran baru");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userFormData),
      });
      if (res.ok) {
        setIsAddUserModalOpen(false);
        setUserFormData({
          name: "",
          username: "",
          password: "1234",
          email: "",
          phone: "",
          role: "ADMIN_OPERASIONAL",
          isActive: true,
        });
        alert("Pengguna baru berhasil ditambahkan!");
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menambah pengguna");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit User
  const handleOpenEditUser = (u: UserItem) => {
    setEditingUser(u);
    setUserFormData({
      name: u.name,
      username: u.username,
      password: "",
      email: u.email || "",
      phone: u.phone || "",
      role: u.role,
      isActive: u.isActive,
    });
    setIsEditUserModalOpen(true);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userFormData),
      });
      if (res.ok) {
        setIsEditUserModalOpen(false);
        setEditingUser(null);
        alert("Data pengguna berhasil diperbarui!");
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal memperbarui pengguna");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete User
  const handleDeleteUser = async (u: UserItem) => {
    if (u.username === "master") {
      alert("Akun Superadmin 'master' dilindungi dan tidak dapat dihapus.");
      return;
    }
    if (!confirm(`Hapus pengguna "${u.name}" (@${u.username})?`)) return;
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Pengguna berhasil dihapus.");
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Travel Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(travelSettings),
      });
      if (res.ok) {
        alert("Profil Biro Travel & Pengaturan PPIU berhasil disimpan!");
        if (onRefreshAll) onRefreshAll();
      } else {
        alert("Gagal menyimpan profil travel.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-emerald-600" />
            Pusat Pengaturan Sistem & Manajemen Hak Akses
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi akun pengguna, permission matrix interaktif yang dapat diedit, dan profil biro travel PPIU.
          </p>
        </div>

        {/* Action Header Button based on tab */}
        {activeSubTab === "permissions" && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToStandard}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
              title="Kembalikan ke standar rekomendasi Kemenag"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Reset Standar PPIU
            </button>
            <button
              onClick={() => setIsAddRoleModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              + Tambah Peran Baru
            </button>
            <button
              onClick={handleSavePermissions}
              disabled={savingPerms}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all shadow-emerald-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              {savingPerms ? "Menyimpan..." : "Simpan Perubahan Matriks"}
            </button>
          </div>
        )}

        {activeSubTab === "users" && (
          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            + Tambah Pengguna Baru
          </button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 bg-white px-4 pt-2 rounded-t-2xl border border-slate-200/80 shadow-2xs">
        <button
          onClick={() => setActiveSubTab("permissions")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeSubTab === "permissions"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Shield className="w-4 h-4" />
          Matriks Hak Akses (Editable Permission Matrix)
        </button>

        <button
          onClick={() => setActiveSubTab("users")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeSubTab === "users"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" />
          Manajemen Pengguna & Password ({users.length})
        </button>

        <button
          onClick={() => setActiveSubTab("company")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeSubTab === "company"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Profil Biro Travel & Dokumen PPIU
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PERMISSION MATRIX (EDITABLE) */}
      {/* ========================================================================= */}
      {activeSubTab === "permissions" && (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Matriks Hak Akses Dinamis & Real-Time
              </div>
              <h3 className="text-lg font-black text-amber-300">
                Kontrol Akses Multi-Peran (Role-Based Access Control)
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl">
                Centang atau hilangkan centang pada hak akses <strong>Lihat</strong>, <strong>Tambah</strong>, <strong>Ubah</strong>, <strong>Hapus</strong>, dan <strong>Ekspor</strong> untuk setiap peran dan modul. Setelah selesai mengedit, klik tombol <strong>Simpan Perubahan Matriks</strong>.
              </p>
            </div>

            <button
              onClick={handleSavePermissions}
              disabled={savingPerms}
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 shadow-lg shrink-0 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              {savingPerms ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>

          {/* Quick Role Selector Tabs for Focused Editing */}
          <div className="flex flex-wrap gap-2 items-center bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-bold text-slate-600 mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter Peran:
            </span>
            {roles.map((r) => (
              <button
                key={r.key}
                onClick={() => setSelectedRoleForDetail(r.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedRoleForDetail === r.key
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {r.name.split("(")[0].trim()}
              </button>
            ))}
          </div>

          {/* EDITABLE PERMISSION TABLE (THE MATRIX) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Matriks Izin Modul untuk:{" "}
                  <span className="text-emerald-700 font-bold">
                    {roles.find((r) => r.key === selectedRoleForDetail)?.name || selectedRoleForDetail}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {roles.find((r) => r.key === selectedRoleForDetail)?.description || "Pengaturan akses per fitur"}
                </p>
              </div>

              {selectedRoleForDetail !== "SUPERADMIN" && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-medium mr-1">Preset Cepat:</span>
                  <button
                    type="button"
                    onClick={() => {
                      modules.forEach((m) => handleSetRowPermissions(selectedRoleForDetail, m.key, "ALL"));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold hover:bg-emerald-100"
                  >
                    Pilih Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      modules.forEach((m) => handleSetRowPermissions(selectedRoleForDetail, m.key, "READ_ONLY"));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold hover:bg-blue-100"
                  >
                    Hanya Lihat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      modules.forEach((m) => handleSetRowPermissions(selectedRoleForDetail, m.key, "NONE"));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold hover:bg-slate-200"
                  >
                    Kosongkan
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Modul & Fitur Aplikasi</th>
                    <th className="py-3.5 px-4 text-center w-28">
                      <span className="inline-flex items-center gap-1">👁️ Lihat (View)</span>
                    </th>
                    <th className="py-3.5 px-4 text-center w-28">
                      <span className="inline-flex items-center gap-1">➕ Tambah (Create)</span>
                    </th>
                    <th className="py-3.5 px-4 text-center w-28">
                      <span className="inline-flex items-center gap-1">✏️ Ubah (Edit)</span>
                    </th>
                    <th className="py-3.5 px-4 text-center w-28">
                      <span className="inline-flex items-center gap-1">🗑️ Hapus (Delete)</span>
                    </th>
                    <th className="py-3.5 px-4 text-center w-28">
                      <span className="inline-flex items-center gap-1">📥 Ekspor (Export)</span>
                    </th>
                    <th className="py-3.5 px-4 text-center w-36">Preset Baris</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modules.map((m, idx) => {
                    const perm = getPermission(selectedRoleForDetail, m.key);
                    const isSuper = selectedRoleForDetail === "SUPERADMIN";

                    return (
                      <tr key={m.key} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{m.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{m.desc}</p>
                        </td>

                        {/* View Checkbox */}
                        <td className="py-3.5 px-4 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              disabled={isSuper}
                              checked={perm.canView}
                              onChange={() => handleTogglePermission(selectedRoleForDetail, m.key, "canView")}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-70"
                            />
                          </label>
                        </td>

                        {/* Create Checkbox */}
                        <td className="py-3.5 px-4 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              disabled={isSuper}
                              checked={perm.canCreate}
                              onChange={() => handleTogglePermission(selectedRoleForDetail, m.key, "canCreate")}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-70"
                            />
                          </label>
                        </td>

                        {/* Edit Checkbox */}
                        <td className="py-3.5 px-4 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              disabled={isSuper}
                              checked={perm.canEdit}
                              onChange={() => handleTogglePermission(selectedRoleForDetail, m.key, "canEdit")}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-70"
                            />
                          </label>
                        </td>

                        {/* Delete Checkbox */}
                        <td className="py-3.5 px-4 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              disabled={isSuper}
                              checked={perm.canDelete}
                              onChange={() => handleTogglePermission(selectedRoleForDetail, m.key, "canDelete")}
                              className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer disabled:opacity-70"
                            />
                          </label>
                        </td>

                        {/* Export Checkbox */}
                        <td className="py-3.5 px-4 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              disabled={isSuper}
                              checked={perm.canExport}
                              onChange={() => handleTogglePermission(selectedRoleForDetail, m.key, "canExport")}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer disabled:opacity-70"
                            />
                          </label>
                        </td>

                        {/* Row Quick Preset */}
                        <td className="py-3.5 px-4 text-center">
                          {!isSuper ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleSetRowPermissions(selectedRoleForDetail, m.key, "ALL")}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 font-bold"
                                title="Beri Semua Hak Akses"
                              >
                                Full
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetRowPermissions(selectedRoleForDetail, m.key, "READ_ONLY")}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-600 font-bold"
                                title="Hanya Akses Lihat"
                              >
                                Read
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetRowPermissions(selectedRoleForDetail, m.key, "NONE")}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-rose-100 hover:text-rose-800 text-slate-600 font-bold"
                                title="Tutup Akses Sama Sekali"
                              >
                                Off
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              🔒 Full Akses
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                💡 <em>Perubahan matriks disimpan ke database dan langsung berlaku saat pengguna dengan peran terkait login kembali.</em>
              </p>
              <button
                onClick={handleSavePermissions}
                disabled={savingPerms}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {savingPerms ? "Menyimpan..." : "Simpan Perubahan Matriks"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MANAJEMEN PENGGUNA (USERS) */}
      {/* ========================================================================= */}
      {activeSubTab === "users" && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Daftar Akun Pengguna & Staf Travel
                </h3>
                <p className="text-xs text-slate-500">
                  Total <strong>{users.length} akun</strong> terdaftar dalam sistem
                </p>
              </div>

              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4" />
                + Tambah Pengguna
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Nama Lengkap & Username</th>
                    <th className="py-3 px-4">Peran (Role)</th>
                    <th className="py-3 px-4">Kontak (Email / HP)</th>
                    <th className="py-3 px-4 text-center">Status Akun</th>
                    <th className="py-3 px-4">Terakhir Login</th>
                    <th className="py-3 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {users.map((u, idx) => {
                    const isMaster = u.username === "master";
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                {u.name}
                                {isMaster && (
                                  <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.2 rounded">
                                    MASTER
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] font-mono text-slate-400">@{u.username}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="text-slate-800">{u.phone || "-"}</p>
                          <p className="text-[10px] text-slate-400">{u.email || "-"}</p>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              <XCircle className="w-3 h-3 text-slate-400" /> Nonaktif
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          {u.lastLogin ? formatDate(u.lastLogin, "dd MMM yyyy, HH:mm") : "Belum Pernah"}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors"
                              title="Edit Data / Ganti Password"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {!isMaster && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
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

      {/* ========================================================================= */}
      {/* TAB 3: PROFIL BIRO TRAVEL & PPIU */}
      {/* ========================================================================= */}
      {activeSubTab === "company" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 max-w-4xl space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Identitas Biro Perjalanan Ibadah Umrah (PPIU)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Data resmi biro travel yang dicetak otomatis pada Invoice, Surat Resmi Kemenag, Manifest, dan Sertifikat Jamaah.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700">Nama Resmi Perusahaan / Travel *</label>
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
                  value={travelSettings.licenseNumber}
                  onChange={(e) => setTravelSettings({ ...travelSettings, licenseNumber: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-emerald-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700">Nama Direktur Utama / Penanggung Jawab *</label>
                <input
                  type="text"
                  required
                  value={travelSettings.directorName}
                  onChange={(e) => setTravelSettings({ ...travelSettings, directorName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Jabatan Penandatangan *</label>
                <input
                  type="text"
                  required
                  value={travelSettings.directorTitle}
                  onChange={(e) => setTravelSettings({ ...travelSettings, directorTitle: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700">Alamat Kantor Pusat Travel</label>
              <textarea
                rows={2}
                value={travelSettings.address}
                onChange={(e) => setTravelSettings({ ...travelSettings, address: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700">Nomor Telepon & WhatsApp</label>
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

            {/* Rekening Bank Resmi */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
              <p className="font-bold text-emerald-950 flex items-center gap-1.5 border-b border-emerald-200 pb-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Rekening Resmi Pembayaran Jamaah (Dicetak di Invoice & Pesan WhatsApp)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Bank BSI Syariah</label>
                  <input
                    type="text"
                    value={travelSettings.bankBSI}
                    onChange={(e) => setTravelSettings({ ...travelSettings, bankBSI: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 bg-white font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Bank BCA</label>
                  <input
                    type="text"
                    value={travelSettings.bankBCA}
                    onChange={(e) => setTravelSettings({ ...travelSettings, bankBCA: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 bg-white font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Bank Mandiri</label>
                  <input
                    type="text"
                    value={travelSettings.bankMandiri}
                    onChange={(e) => setTravelSettings({ ...travelSettings, bankMandiri: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 bg-white font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {savingSettings ? "Menyimpan..." : "Simpan Profil Travel"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH PENGGUNA BARU */}
      {/* ========================================================================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Tambah Pengguna Baru
              </h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nama Lengkap Pengguna *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmad Fauzi"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Username Login *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. fauzi"
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value.toLowerCase() })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Password Awal *</label>
                  <input
                    type="text"
                    required
                    placeholder="Default: 1234"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Peran & Hak Akses (Role) *</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-800"
                >
                  {roles.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Email</label>
                  <input
                    type="email"
                    placeholder="user@travel.com"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">No. WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="08123456789"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT PENGGUNA */}
      {/* ========================================================================= */}
      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-600" />
                Edit Data Pengguna & Password
              </h3>
              <button onClick={() => setIsEditUserModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Username</label>
                <input
                  type="text"
                  disabled
                  value={userFormData.username}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono bg-slate-100 text-slate-500 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Ganti Password (Kosongkan jika tidak diubah)</label>
                <input
                  type="text"
                  placeholder="Masukkan password baru..."
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Peran & Hak Akses (Role) *</label>
                <select
                  disabled={editingUser.username === "master"}
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-800 disabled:bg-slate-100"
                >
                  {roles.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Status Akun</label>
                  <select
                    disabled={editingUser.username === "master"}
                    value={userFormData.isActive ? "true" : "false"}
                    onChange={(e) => setUserFormData({ ...userFormData, isActive: e.target.value === "true" })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold"
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH ROLE KUSTOM BARU */}
      {/* ========================================================================= */}
      {isAddRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Tambah Peran / Role Baru
              </h3>
              <button onClick={() => setIsAddRoleModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomRole} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Kode Peran (Role Key) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CUSTOMER_SERVICE"
                  value={newRoleData.roleKey}
                  onChange={(e) =>
                    setNewRoleData({
                      ...newRoleData,
                      roleKey: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Nama Lengkap Peran *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer Service & Front Office"
                  value={newRoleData.roleName}
                  onChange={(e) => setNewRoleData({ ...newRoleData, roleName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Deskripsi Tugas & Tanggung Jawab</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Menangani pertanyaan calon jamaah dan mencatat data tamu walk-in..."
                  value={newRoleData.description}
                  onChange={(e) => setNewRoleData({ ...newRoleData, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-sm"
                >
                  Buat Peran Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
