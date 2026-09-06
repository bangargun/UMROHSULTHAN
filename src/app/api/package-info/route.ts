import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/package-info?packageId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const packageId = searchParams.get("packageId");

    if (packageId) {
      const packageInfo = await prisma.packageInfo.findUnique({
        where: { packageId },
        include: {
          package: {
            include: {
              pilgrims: true,
            },
          },
        },
      });

      if (packageInfo) {
        return NextResponse.json(packageInfo);
      }

      // If no PackageInfo record exists yet, fetch package to build initial structure
      const pkg = await prisma.package.findUnique({
        where: { id: packageId },
        include: {
          pilgrims: true,
        },
      });

      if (!pkg) {
        return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
      }

      // Count registered adults and children
      const totalPax = pkg.pilgrims.length;

      return NextResponse.json({
        id: "",
        packageId: pkg.id,
        groupCode: pkg.code || "",
        subAgentName: "",
        adultPax: totalPax,
        childPax: 0,
        tourLeaderName: "",
        tourLeaderPhone: "",
        flightInfoJson: JSON.stringify([
          {
            from: "KNO",
            to: "JED",
            date: pkg.departureDate ? new Date(pkg.departureDate).toISOString().split("T")[0] : "",
            etd: "14:45",
            eta: "20:00",
            carrier: pkg.airline || "",
            flightNo: "A330",
            remarks: "Direct Flight",
          },
          {
            from: "JED",
            to: "KNO",
            date: pkg.returnDate ? new Date(pkg.returnDate).toISOString().split("T")[0] : "",
            etd: "19:10",
            eta: "08:00 (+1)",
            carrier: pkg.airline || "",
            flightNo: "A330",
            remarks: "Direct Flight",
          },
        ]),
        hotelInfoJson: JSON.stringify([
          {
            city: "MADINAH",
            hotel: pkg.hotelMadinah || "",
            checkIn: pkg.departureDate ? new Date(pkg.departureDate).toISOString().split("T")[0] : "",
            checkOut: pkg.departureDate ? new Date(new Date(pkg.departureDate).getTime() + 6 * 86400000).toISOString().split("T")[0] : "",
            dbl: 0,
            trpl: 0,
            quad: Math.ceil(totalPax / 4) || 0,
            quint: 0,
            resNo: "",
          },
          {
            city: "MAKKAH",
            hotel: pkg.hotelMakkah || "",
            checkIn: pkg.departureDate ? new Date(new Date(pkg.departureDate).getTime() + 6 * 86400000).toISOString().split("T")[0] : "",
            checkOut: pkg.returnDate ? new Date(pkg.returnDate).toISOString().split("T")[0] : "",
            dbl: 0,
            trpl: 0,
            quad: Math.ceil(totalPax / 4) || 0,
            quint: 0,
            resNo: "",
          },
        ]),
        busScheduleJson: JSON.stringify([
          {
            date: pkg.departureDate ? new Date(pkg.departureDate).toISOString().split("T")[0] : "",
            from: "JEDDAH AIRPORT",
            to: "HOTEL MADINAH",
            time: "20:00",
            busType: "VIP Bus 45 Seat",
            company: "SAPTCO",
          },
          {
            date: pkg.departureDate ? new Date(new Date(pkg.departureDate).getTime() + 2 * 86400000).toISOString().split("T")[0] : "",
            from: "HOTEL MADINAH",
            to: "CITY TOUR MADINAH",
            time: "07:00",
            busType: "VIP Bus 45 Seat",
            company: "SAPTCO",
          },
          {
            date: pkg.departureDate ? new Date(new Date(pkg.departureDate).getTime() + 6 * 86400000).toISOString().split("T")[0] : "",
            from: "HOTEL MADINAH",
            to: "HOTEL MAKKAH (MIQAT BIR ALI)",
            time: "14:00",
            busType: "VIP Bus 45 Seat",
            company: "SAPTCO",
          },
          {
            date: pkg.departureDate ? new Date(new Date(pkg.departureDate).getTime() + 8 * 86400000).toISOString().split("T")[0] : "",
            from: "HOTEL MAKKAH",
            to: "CITY TOUR MAKKAH & ZIARAH",
            time: "07:00",
            busType: "VIP Bus 45 Seat",
            company: "SAPTCO",
          },
          {
            date: pkg.returnDate ? new Date(pkg.returnDate).toISOString().split("T")[0] : "",
            from: "HOTEL MAKKAH",
            to: "JEDDAH AIRPORT",
            time: "14:00",
            busType: "VIP Bus 45 Seat",
            company: "SAPTCO",
          },
        ]),
        muthawwifName: "",
        muthawwifPhone: "",
        handlingSaudi: "",
        handlingPhone: "",
        package: pkg,
      });
    }

    const all = await prisma.packageInfo.findMany({
      include: {
        package: {
          include: {
            pilgrims: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(all);
  } catch (error: any) {
    console.error("GET /api/package-info error:", error);
    return NextResponse.json({ error: error.message || "Gagal mengambil data Package Info" }, { status: 500 });
  }
}

// POST /api/package-info
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      packageId,
      groupCode,
      subAgentName,
      adultPax,
      childPax,
      tourLeaderName,
      tourLeaderPhone,
      flightInfoJson,
      hotelInfoJson,
      busScheduleJson,
      muthawwifName,
      muthawwifPhone,
      handlingSaudi,
      handlingPhone,
    } = body;

    if (!packageId) {
      return NextResponse.json({ error: "Paket Umroh wajib dipilih" }, { status: 400 });
    }

    const numAdult = typeof adultPax === "number" ? adultPax : (parseInt(String(adultPax || "0"), 10) || 0);
    const numChild = typeof childPax === "number" ? childPax : (parseInt(String(childPax || "0"), 10) || 0);

    const saved = await prisma.packageInfo.upsert({
      where: { packageId },
      create: {
        packageId,
        groupCode: groupCode || null,
        subAgentName: subAgentName || null,
        adultPax: numAdult,
        childPax: numChild,
        tourLeaderName: tourLeaderName || null,
        tourLeaderPhone: tourLeaderPhone || null,
        flightInfoJson: typeof flightInfoJson === "string" ? flightInfoJson : JSON.stringify(flightInfoJson || []),
        hotelInfoJson: typeof hotelInfoJson === "string" ? hotelInfoJson : JSON.stringify(hotelInfoJson || []),
        busScheduleJson: typeof busScheduleJson === "string" ? busScheduleJson : JSON.stringify(busScheduleJson || []),
        muthawwifName: muthawwifName || null,
        muthawwifPhone: muthawwifPhone || null,
        handlingSaudi: handlingSaudi || null,
        handlingPhone: handlingPhone || null,
      },
      update: {
        groupCode: groupCode || null,
        subAgentName: subAgentName || null,
        adultPax: numAdult,
        childPax: numChild,
        tourLeaderName: tourLeaderName || null,
        tourLeaderPhone: tourLeaderPhone || null,
        flightInfoJson: typeof flightInfoJson === "string" ? flightInfoJson : JSON.stringify(flightInfoJson || []),
        hotelInfoJson: typeof hotelInfoJson === "string" ? hotelInfoJson : JSON.stringify(hotelInfoJson || []),
        busScheduleJson: typeof busScheduleJson === "string" ? busScheduleJson : JSON.stringify(busScheduleJson || []),
        muthawwifName: muthawwifName || null,
        muthawwifPhone: muthawwifPhone || null,
        handlingSaudi: handlingSaudi || null,
        handlingPhone: handlingPhone || null,
      },
      include: {
        package: {
          include: {
            pilgrims: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Data Package Info & Manifest Operasional berhasil disimpan!",
      data: saved,
    });
  } catch (error: any) {
    console.error("POST /api/package-info error:", error);
    return NextResponse.json({ error: error.message || "Gagal menyimpan Package Info" }, { status: 500 });
  }
}
