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

    // 2. Auto-sync: Make sure every registered pilgrim has an active User account with password
    const allPilgrims = await prisma.pilgrim.findMany({
      include: { user: true },
    });

    for (const p of allPilgrims) {
      if (!p.user) {
        const cleanUsername = (p.nik || p.phone || `jamaah_${p.id.slice(0, 6)}`).toLowerCase().trim();
        const pPassword = p.portalPassword || "123456";
        
        // Find if user with this username already exists
        let existingUser = await prisma.user.findUnique({ where: { username: cleanUsername } });
        if (!existingUser) {
          await prisma.user.create({
            data: {
              name: p.name,
              username: cleanUsername,
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
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              pilgrimId: p.id,
              plainPassword: existingUser.plainPassword || pPassword,
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
