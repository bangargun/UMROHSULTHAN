import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    let users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
    });

    if (users.length === 0) {
      await prisma.user.create({
        data: {
          name: "Coach Argun",
          username: "master",
          password: "1234",
          email: "master@sulthanharamain.com",
          phone: "081198765432",
          role: "SUPERADMIN",
          isActive: true,
        },
      });
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
