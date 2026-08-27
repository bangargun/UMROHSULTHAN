import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Ensure master account exists
    let master = await prisma.user.findFirst({ where: { username: "master" } });
    if (!master) {
      await prisma.user.create({
        data: {
          name: "Coach Argun",
          username: "master",
          password: "1234",
          plainPassword: "1234",
          email: "master@sulthanharamain.com",
          phone: "081198765432",
          role: "SUPERADMIN",
          isActive: true,
        },
      });
    }

    // Helper to generate clean username from pilgrim name
    const generatePilgrimUsername = (name: string) => {
      return (name || "jamaah")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
    };

    // 2. Auto-sync: Make sure every registered pilgrim has an active User account with name-based username
    const allPilgrims = await prisma.pilgrim.findMany({
      include: { user: true },
    });

    for (const p of allPilgrims) {
      const targetUsername = generatePilgrimUsername(p.name);
      const pPassword = p.portalPassword || "123456";

      if (!p.user) {
        // Check if username is taken by another record
        let existingUser = await prisma.user.findUnique({ where: { username: targetUsername } });
        let finalUsername = targetUsername;
        if (existingUser && existingUser.pilgrimId !== p.id) {
          finalUsername = `${targetUsername}_${p.nik?.slice(-4) || p.id.slice(0, 4)}`;
        }

        await prisma.user.create({
          data: {
            name: p.name,
            username: finalUsername,
            password: pPassword,
            plainPassword: pPassword,
            email: p.email || null,
            phone: p.phone || null,
            role: "PILGRIM",
            isActive: true,
            pilgrimId: p.id,
          },
        });
      } else {
        // If user already exists but username is NIK or numbers, migrate to name-based username
        if (p.user.username === p.nik || /^\d{10,20}$/.test(p.user.username)) {
          let existingUser = await prisma.user.findUnique({ where: { username: targetUsername } });
          let finalUsername = targetUsername;
          if (existingUser && existingUser.id !== p.user.id) {
            finalUsername = `${targetUsername}_${p.nik?.slice(-4) || p.id.slice(0, 4)}`;
          }
          await prisma.user.update({
            where: { id: p.user.id },
            data: {
              username: finalUsername,
              name: p.name,
              plainPassword: p.user.plainPassword || pPassword,
            },
          });
        }
      }
    }

    const users = await prisma.user.findMany({
      include: {
        pilgrim: {
          include: {
            package: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

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

    const finalPass = password || "1234";

    const user = await prisma.user.create({
      data: {
        name,
        username: username.toLowerCase().trim(),
        password: finalPass,
        plainPassword: finalPass,
        email: email || null,
        phone: phone || null,
        role: role || "ADMIN_OPERASIONAL",
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        pilgrim: {
          include: { package: true },
        },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
