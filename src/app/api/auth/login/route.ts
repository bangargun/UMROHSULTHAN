import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "Username dan password wajib diisi." }, { status: 400 });
    }

    // Special handler for Superadmin Master credentials
    if (username === "master" && password === "1234") {
      let masterUser = await prisma.user.findFirst({
        where: { username: "master" },
      });

      if (!masterUser) {
        masterUser = await prisma.user.create({
          data: {
            name: "Ustadz Fauzi (Master Superadmin)",
            username: "master",
            password: "1234",
            email: "master@sulthanharamain.com",
            phone: "081198765432",
            role: "SUPERADMIN",
            isActive: true,
            lastLogin: new Date(),
          },
        });
      } else {
        await prisma.user.update({
          where: { id: masterUser.id },
          data: { lastLogin: new Date() },
        });
      }

      return NextResponse.json({
        user: {
          id: masterUser.id,
          name: masterUser.name,
          username: masterUser.username,
          role: masterUser.role,
          email: masterUser.email,
        },
      });
    }

    // Check other registered users in DB
    const user = await prisma.user.findFirst({
      where: {
        username,
        password,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Username atau password salah. Silakan periksa kembali kredensial Anda." },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server saat login" }, { status: 500 });
  }
}
