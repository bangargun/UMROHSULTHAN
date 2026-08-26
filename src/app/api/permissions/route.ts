import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const DEFAULT_MODULES = [
  { key: "dashboard", name: "Dashboard & Analitik", desc: "Ringkasan metrik, grafik & KPI operasional" },
  { key: "leads", name: "Marketing & Leads CRM", desc: "Pipeline prospek jamaah, interaksi & konversi" },
  { key: "pilgrims", name: "Database Calon Jamaah", desc: "Master calon jamaah, paspor, visa & manifest" },
  { key: "alumni", name: "Jamaah Berangkat / Alumni", desc: "Riwayat keberangkatan, sertifikat & WA silaturahmi" },
  { key: "finance", name: "Invoicing & Kas Masuk", desc: "DP, pelunasan paket, kwitansi & WA reminder" },
  { key: "profit-loss", name: "Laba Rugi & Keuangan", desc: "Pendapatan, HPP paket, laba bersih & jurnal umum" },
  { key: "logistics", name: "Inventaris Logistik", desc: "Stok perlengkapan koper, kain ihram & mukena" },
  { key: "handovers", name: "Ceklis Serah Terima", desc: "Form serah terima logistik + tanda tangan digital" },
  { key: "requirements", name: "Pusat Dokumen Keberangkatan", desc: "Ceklis 8 dokumen syarat visa & handling bandara" },
  { key: "letters", name: "Generator Surat Resmi", desc: "Cetak surat rekomendasi paspor, cuti & kemenag" },
  { key: "agents", name: "Cabang & Agen Freelance", desc: "Manajemen kantor cabang, agen & komisi referral" },
  { key: "master", name: "Pusat Data Master", desc: "Master paket, barang logistik & syarat PPIU" },
  { key: "settings", name: "Pengaturan & Hak Akses", desc: "Manajemen user & permission matrix" },
];

const DEFAULT_ROLES = [
  {
    key: "SUPERADMIN",
    name: "Superadmin (Akses Penuh)",
    description: "Pemilik travel / Direktur Utama dengan hak akses penuh ke seluruh modul sistem",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    isSystem: true,
    orderIndex: 1,
  },
  {
    key: "ADMIN_OPERASIONAL",
    name: "Admin Operasional & Manifest",
    description: "Menangani pendaftaran jamaah, manifest penerbangan, dokumen visa & surat resmi",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    isSystem: true,
    orderIndex: 2,
  },
  {
    key: "ADMIN_FINANCE",
    name: "Admin Keuangan & Akuntansi",
    description: "Menangani invoice tagihan, kas masuk, laporan laba rugi, HPP & jurnal umum",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    isSystem: true,
    orderIndex: 3,
  },
  {
    key: "ADMIN_MARKETING",
    name: "Admin Marketing & Agen",
    description: "Menangani pipeline prospek leads, broadcast penawaran, cabang & agen referral",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    isSystem: true,
    orderIndex: 4,
  },
  {
    key: "STAF_LOGISTIK",
    name: "Staf Gudang & Logistik",
    description: "Menangani inventaris perlengkapan, mutasi stok barang & serah terima koper jamaah",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
    isSystem: true,
    orderIndex: 5,
  },
  {
    key: "CABANG_KORWIL",
    name: "Kepala Cabang / Korwil",
    description: "Memonitor data pendaftaran jamaah dan agen di wilayah cabangnya",
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
    isSystem: false,
    orderIndex: 6,
  },
  {
    key: "MUTHAWWIF",
    name: "Pembimbing Ibadah / Muthawwif",
    description: "Melihat manifest rombongan, data alumni & ceklis jamaah saat di Tanah Suci",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
    isSystem: false,
    orderIndex: 7,
  },
];

function getStandardPermission(roleKey: string, moduleKey: string) {
  if (roleKey === "SUPERADMIN") {
    return { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true };
  }

  switch (roleKey) {
    case "ADMIN_OPERASIONAL":
      if (["dashboard", "pilgrims", "alumni", "requirements", "letters", "handovers"].includes(moduleKey)) {
        return { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true };
      }
      if (["leads", "finance", "logistics", "master"].includes(moduleKey)) {
        return { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false };
      }
      return { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false };

    case "ADMIN_FINANCE":
      if (["dashboard", "finance", "profit-loss"].includes(moduleKey)) {
        return { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true };
      }
      if (["pilgrims", "alumni", "agents", "master"].includes(moduleKey)) {
        return { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: true };
      }
      return { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false };

    case "ADMIN_MARKETING":
      if (["dashboard", "leads", "agents"].includes(moduleKey)) {
        return { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true };
      }
      if (["pilgrims", "alumni", "master"].includes(moduleKey)) {
        return { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false };
      }
      return { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false };

    case "STAF_LOGISTIK":
      if (["dashboard", "logistics", "handovers"].includes(moduleKey)) {
        return { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true };
      }
      if (["pilgrims", "master"].includes(moduleKey)) {
        return { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false };
      }
      return { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false };

    case "CABANG_KORWIL":
      if (["dashboard", "leads", "pilgrims", "agents"].includes(moduleKey)) {
        return { canView: true, canCreate: true, canEdit: false, canDelete: false, canExport: true };
      }
      return { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false };

    case "MUTHAWWIF":
      if (["dashboard", "pilgrims", "alumni", "requirements"].includes(moduleKey)) {
        return { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: true };
      }
      return { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false };

    default:
      return { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false };
  }
}

export async function GET() {
  try {
    // 1. Ensure Roles exist
    let roles = await prisma.appRole.findMany({
      orderBy: { orderIndex: "asc" },
      include: { permissions: true },
    });

    if (roles.length === 0) {
      for (const r of DEFAULT_ROLES) {
        const createdRole = await prisma.appRole.create({
          data: {
            key: r.key,
            name: r.name,
            description: r.description,
            badgeColor: r.badgeColor,
            isSystem: r.isSystem,
            orderIndex: r.orderIndex,
          },
        });

        // Seed default permissions for each module
        for (const m of DEFAULT_MODULES) {
          const perm = getStandardPermission(r.key, m.key);
          await prisma.rolePermission.create({
            data: {
              roleId: createdRole.id,
              roleKey: r.key,
              moduleKey: m.key,
              moduleName: m.name,
              canView: perm.canView,
              canCreate: perm.canCreate,
              canEdit: perm.canEdit,
              canDelete: perm.canDelete,
              canExport: perm.canExport,
            },
          });
        }
      }

      roles = await prisma.appRole.findMany({
        orderBy: { orderIndex: "asc" },
        include: { permissions: true },
      });
    }

    // 2. Fetch all permissions flat list
    const permissions = await prisma.rolePermission.findMany({
      orderBy: [{ roleKey: "asc" }, { moduleKey: "asc" }],
    });

    return NextResponse.json({
      roles,
      modules: DEFAULT_MODULES,
      permissions,
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { permissions, roleId, roleData } = body;

    // 1. If updating permissions batch
    if (Array.isArray(permissions)) {
      for (const p of permissions) {
        if (p.id) {
          await prisma.rolePermission.update({
            where: { id: p.id },
            data: {
              canView: Boolean(p.canView),
              canCreate: Boolean(p.canCreate),
              canEdit: Boolean(p.canEdit),
              canDelete: Boolean(p.canDelete),
              canExport: Boolean(p.canExport),
            },
          });
        } else if (p.roleKey && p.moduleKey) {
          await prisma.rolePermission.upsert({
            where: {
              roleKey_moduleKey: {
                roleKey: p.roleKey,
                moduleKey: p.moduleKey,
              },
            },
            update: {
              canView: Boolean(p.canView),
              canCreate: Boolean(p.canCreate),
              canEdit: Boolean(p.canEdit),
              canDelete: Boolean(p.canDelete),
              canExport: Boolean(p.canExport),
            },
            create: {
              roleKey: p.roleKey,
              moduleKey: p.moduleKey,
              moduleName: p.moduleName || p.moduleKey,
              canView: Boolean(p.canView),
              canCreate: Boolean(p.canCreate),
              canEdit: Boolean(p.canEdit),
              canDelete: Boolean(p.canDelete),
              canExport: Boolean(p.canExport),
            },
          });
        }
      }
    }

    // 2. If updating single role metadata
    if (roleId && roleData) {
      await prisma.appRole.update({
        where: { id: roleId },
        data: {
          name: roleData.name,
          description: roleData.description,
          badgeColor: roleData.badgeColor,
        },
      });
    }

    return NextResponse.json({ success: true, message: "Hak akses berhasil disimpan!" });
  } catch (error) {
    console.error("Error updating permissions:", error);
    return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, roleKey, roleName, description, badgeColor } = body;

    // Action: Reset to PPIU Standard
    if (action === "RESET_TO_DEFAULT") {
      await prisma.rolePermission.deleteMany({});
      await prisma.appRole.deleteMany({});

      for (const r of DEFAULT_ROLES) {
        const createdRole = await prisma.appRole.create({
          data: {
            key: r.key,
            name: r.name,
            description: r.description,
            badgeColor: r.badgeColor,
            isSystem: r.isSystem,
            orderIndex: r.orderIndex,
          },
        });

        for (const m of DEFAULT_MODULES) {
          const perm = getStandardPermission(r.key, m.key);
          await prisma.rolePermission.create({
            data: {
              roleId: createdRole.id,
              roleKey: r.key,
              moduleKey: m.key,
              moduleName: m.name,
              canView: perm.canView,
              canCreate: perm.canCreate,
              canEdit: perm.canEdit,
              canDelete: perm.canDelete,
              canExport: perm.canExport,
            },
          });
        }
      }

      return NextResponse.json({ success: true, message: "Matriks Hak Akses berhasil direset ke Standar Rekomendasi PPIU!" });
    }

    // Action: Create New Custom Role
    if (!roleKey || !roleName) {
      return NextResponse.json({ error: "Kode Peran (Role Key) dan Nama Peran wajib diisi" }, { status: 400 });
    }

    const cleanKey = roleKey.toUpperCase().replace(/\s+/g, "_").trim();
    const existing = await prisma.appRole.findUnique({ where: { key: cleanKey } });
    if (existing) {
      return NextResponse.json({ error: `Peran "${cleanKey}" sudah ada.` }, { status: 400 });
    }

    const createdRole = await prisma.appRole.create({
      data: {
        key: cleanKey,
        name: roleName,
        description: description || null,
        badgeColor: badgeColor || "bg-indigo-100 text-indigo-800 border-indigo-200",
        isSystem: false,
        orderIndex: 10,
      },
    });

    // Create default permissions for new role
    for (const m of DEFAULT_MODULES) {
      await prisma.rolePermission.create({
        data: {
          roleId: createdRole.id,
          roleKey: cleanKey,
          moduleKey: m.key,
          moduleName: m.name,
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canExport: false,
        },
      });
    }

    return NextResponse.json(createdRole, { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}
