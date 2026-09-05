import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get("packageId");
    const pilgrimId = searchParams.get("pilgrimId");
    const search = searchParams.get("search");

    const where: any = {};
    if (packageId && packageId !== "ALL") where.packageId = packageId;
    if (pilgrimId) where.pilgrimId = pilgrimId;
    if (search) {
      where.OR = [
        { certificateNumber: { contains: search } },
        { pilgrim: { name: { contains: search } } },
        { pilgrim: { passportNumber: { contains: search } } },
        { packageName: { contains: search } },
      ];
    }

    const certificates = await prisma.certificate.findMany({
      where,
      include: {
        pilgrim: {
          include: { package: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(certificates);
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { batch, packageId, pilgrimId, muthawwifName, directorName, directorTitle, issueDate, notes } = body;

    // Get company settings for default director name
    const setting = await prisma.travelSetting.findFirst();
    const activeDirectorName = directorName || setting?.directorName || "Attiyatul Amra";
    const activeDirectorTitle = directorTitle || setting?.directorTitle || "Direktur Utama";

    // Batch Generation for an Entire Package
    if (batch && packageId) {
      const pkg = await prisma.package.findUnique({
        where: { id: packageId },
        include: { pilgrims: true },
      });

      if (!pkg) {
        return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
      }

      if (!pkg.pilgrims || pkg.pilgrims.length === 0) {
        return NextResponse.json({ error: "Belum ada jamaah terdaftar di paket ini" }, { status: 400 });
      }

      const createdList = [];
      const currentYear = new Date().getFullYear();
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");

      for (let i = 0; i < pkg.pilgrims.length; i++) {
        const p = pkg.pilgrims[i];
        
        // Check if certificate already exists for this pilgrim
        const existing = await prisma.certificate.findFirst({
          where: { pilgrimId: p.id },
        });

        if (existing) {
          createdList.push(existing);
          continue;
        }

        const count = await prisma.certificate.count();
        const certNumber = `CERT-SH/UMR/${currentYear}/${currentMonth}/${String(count + 1 + i).padStart(4, "0")}`;

        const cert = await prisma.certificate.create({
          data: {
            certificateNumber: certNumber,
            pilgrimId: p.id,
            packageId: pkg.id,
            packageName: pkg.name,
            departureDate: pkg.departureDate,
            returnDate: pkg.returnDate,
            issueDate: issueDate ? new Date(issueDate) : (pkg.returnDate ? new Date(pkg.returnDate) : new Date()),
            muthawwifName: muthawwifName || "Ustadz Pembimbing Ibadah",
            directorName: activeDirectorName,
            directorTitle: activeDirectorTitle,
            notes: notes || `Piagam Penghargaan Ibadah Umroh - ${pkg.name}`,
          },
          include: {
            pilgrim: { include: { package: true } },
          },
        });
        createdList.push(cert);
      }

      return NextResponse.json({
        success: true,
        message: `Berhasil menerbitkan ${createdList.length} piagam/sertifikat umroh untuk paket ${pkg.name}.`,
        certificates: createdList,
      }, { status: 201 });
    }

    // Single Certificate Generation
    if (!pilgrimId) {
      return NextResponse.json({ error: "Jamaah wajib dipilih" }, { status: 400 });
    }

    const pilgrim = await prisma.pilgrim.findUnique({
      where: { id: pilgrimId },
      include: { package: true },
    });

    if (!pilgrim) {
      return NextResponse.json({ error: "Jamaah tidak ditemukan" }, { status: 404 });
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
    const count = await prisma.certificate.count();
    const certNumber = `CERT-SH/UMR/${currentYear}/${currentMonth}/${String(count + 1).padStart(4, "0")}`;

    const cert = await prisma.certificate.create({
      data: {
        certificateNumber: certNumber,
        pilgrimId: pilgrim.id,
        packageId: pilgrim.packageId || null,
        packageName: pilgrim.package?.name || "Program Ibadah Umroh Reguler",
        departureDate: pilgrim.package?.departureDate || null,
        returnDate: pilgrim.package?.returnDate || null,
        issueDate: issueDate ? new Date(issueDate) : (pilgrim.package?.returnDate ? new Date(pilgrim.package.returnDate) : new Date()),
        muthawwifName: muthawwifName || "Ustadz Pembimbing Ibadah",
        directorName: activeDirectorName,
        directorTitle: activeDirectorTitle,
        notes: notes || `Piagam Penghargaan Ibadah Umroh - ${pilgrim.name}`,
      },
      include: {
        pilgrim: { include: { package: true } },
      },
    });

    return NextResponse.json(cert, { status: 201 });
  } catch (error) {
    console.error("Error creating certificate:", error);
    return NextResponse.json({ error: "Failed to create certificate" }, { status: 500 });
  }
}
