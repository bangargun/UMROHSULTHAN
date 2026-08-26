import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    let users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
    });

    if (users.length === 0) {
      // Auto-seed standard travel users
      const seedUsers = [
        {
          name: "Ustadz Fauzi (Master Superadmin)",
          username: "master",
          password: "1234",
          email: "master@sulthanharamain.com",
          phone: "081198765432",
          role: "SUPERADMIN",
          isActive: true,
        },
        {
          name: "Siti Rahma (Admin Operasional & Manifest)",
          username: "admin_ops",
          password: "1234",
          email: "ops@sulthanharamain.com",
          phone: "081234567890",
          role: "ADMIN_OPERASIONAL",
          isActive: true,
        },
        {
          name: "Bambang Tri (Admin Keuangan & Akuntansi)",
          username: "admin_finance",
          password: "1234",
          email: "finance@sulthanharamain.com",
          phone: "081398765432",
          role: "ADMIN_FINANCE",
          isActive: true,
        },
        {
          name: "Doni Pratama (Admin Marketing & Agen)",
          username: "admin_mkt",
          password: "1234",
          email: "marketing@sulthanharamain.com",
          phone: "081987654321",
          role: "ADMIN_MARKETING",
          isActive: true,
        },
        {
          name: "Budi Santoso (Staf Gudang & Logistik)",
          username: "staf_logistik",
          password: "1234",
          email: "logistik@sulthanharamain.com",
          phone: "081234560000",
          role: "STAF_LOGISTIK",
          isActive: true,
        },
      ];

      for (const u of seedUsers) {
        await prisma.user.create({ data: u });
      }

      users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, username, password, email, phone, role, isActive } = body;

    if (!name || !username) {
      return NextResponse.json({ error: "Nama dan Username wajib diisi" }, { status: 400 });
    }

    const existingUsername = await prisma.user.findFirst({
      where: { username: username.toLowerCase().trim() },
    });

    if (existingUsername) {
      return NextResponse.json({ error: "Username sudah terdaftar. Silakan pilih username lain." }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        username: username.toLowerCase().trim(),
        password: password || "1234",
        email: email || null,
        phone: phone || null,
        role: role || "ADMIN_OPERASIONAL",
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
