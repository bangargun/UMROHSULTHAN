import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      include: {
        _count: {
          select: { pilgrims: true },
        },
        itineraries: {
          orderBy: { dayNumber: "asc" },
        },
      },
      orderBy: { departureDate: "asc" },
    });
    return NextResponse.json(packages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      code,
      name,
      description,
      departureDate,
      returnDate,
      durationDays,
      hotelMakkah,
      hotelMadinah,
      airline,
      priceQuad,
      priceTriple,
      priceDouble,
      quota,
      commissionAgent,
      commissionReferral,
    } = body;

    const daysCount = parseInt(durationDays) || 9;
    const depDate = new Date(departureDate);
    const retDate = new Date(returnDate);

    const pkg = await prisma.package.create({
      data: {
        code: code || `UMR-${Date.now().toString().slice(-6)}`,
        name,
        description,
        departureDate: depDate,
        returnDate: retDate,
        durationDays: daysCount,
        hotelMakkah,
        hotelMadinah,
        airline,
        priceQuad: parseFloat(priceQuad),
        priceTriple: parseFloat(priceTriple),
        priceDouble: parseFloat(priceDouble),
        quota: parseInt(quota) || 45,
        commissionAgent: commissionAgent !== undefined ? parseFloat(commissionAgent) : 1500000,
        commissionReferral: commissionReferral !== undefined ? parseFloat(commissionReferral) : 500000,
      },
    });

    // Auto-generate standard itinerary days
    try {
      for (let i = 1; i <= daysCount; i++) {
        const itemDate = new Date(depDate);
        itemDate.setDate(itemDate.getDate() + (i - 1));

        let title = `Hari ${i}: Agenda Ibadah & Kegiatan`;
        let location = i <= 4 ? `Madinah Al-Munawwarah (${hotelMadinah})` : `Makkah Al-Mukarramah (${hotelMakkah})`;
        let time = "07:30 WSA";
        let dresscode = "Batik Travel Resmi";
        let desc = "Ibadah berjamaah, zikir, dan ziarah napak tilas sejarah Islam bersama Muthawwif.";

        if (i === 1) {
          title = "Keberangkatan Menuju Madinah Al-Munawwarah";
          location = `Bandara KNO/CGK - Bandara AMAA Madinah (${airline})`;
          time = "08:00 WIB";
          desc = "Berkumpul di Bandara 4 jam sebelum penerbangan. Briefing teknis & doa bersama. Penerbangan menuju Madinah, check-in hotel dan istirahat.";
        } else if (i === 2) {
          title = "Ziarah Raudhah & Makam Rasulullah SAW di Masjid Nabawi";
          location = "Raudhah As-Syarifah Masjid Nabawi";
          dresscode = "Baju Koko Putih (Pria) / Gamis Hitam (Wanita)";
          desc = "Sholat Subuh di Masjid Nabawi. Ziarah Makam Rasulullah SAW, Sayyidina Abu Bakar & Umar bin Khattab, dan Masuk Raudhah sesuai jadwal Tasreh Nusuk.";
        } else if (i === 3) {
          title = "City Tour Kota Madinah (Masjid Quba, Uhud, Kebun Kurma)";
          location = "Masjid Quba & Jabal Uhud";
          dresscode = "Bebas Syar'i & Nyaman";
          desc = "Shalat sunnah 2 rakaat di Masjid Quba (pahala 1 umroh), Ziarah Jabal Uhud, dan belanja kurma segar langsung dari perkebunan Madinah.";
        } else if (i === 4) {
          title = "Miqat di Masjid Bir Ali, Menuju Makkah & Pelaksanaan Umroh Wajib";
          location = "Masjid Bir Ali - Makkah Al-Mukarramah";
          time = "09:00 WSA";
          dresscode = "Kain Ihram (Pria) / Busana Ihram (Wanita)";
          desc = "Mandi sunnah ihram di hotel Madinah. Mengambil Miqat di Masjid Bir Ali. Perjalanan ke Makkah Al-Mukarramah, check-in hotel, dan pelaksanaan Umroh Wajib.";
        } else if (i === 5) {
          title = "Istirahat & Memperbanyak Ibadah Mandiri di Masjidil Haram";
          location = "Masjidil Haram Makkah";
          time = "Sepanjang Hari";
          dresscode = "Bebas Syar'i";
          desc = "Memperbanyak thawaf sunnah, iktikaf, dan shalat berjamaah di depan Ka'bah (pahala 100.000 kali lipat).";
        } else if (i === 6) {
          title = "City Tour Kota Makkah & Miqat Umroh Kedua (Ji'ranah)";
          location = "Jabal Tsur, Padang Arafah, Jabal Rahmah, Mina, Ji'ranah";
          dresscode = "Batik Travel / Pakaian Ihram Umroh ke-2";
          desc = "Ziarah Napak Tilas Ibadah Haji ke Jabal Tsur, Arafah, Mina, dan Miqat Ji'ranah bagi yang berniat Umroh kedua (Badal Umroh).";
        } else if (i === daysCount - 1) {
          title = "Thawaf Wada' (Perpisahan) & Perjalanan Menuju Bandara Jeddah";
          location = "Masjidil Haram - Bandara King Abdulaziz Jeddah";
          time = "04:00 WSA";
          dresscode = "Seragam Batik Resmi Travel";
          desc = "Pelaksanaan Thawaf Wada' bersama Muthawwif. Check-out hotel Makkah, transfer ke Bandara Jeddah, dan penerbangan kembali ke Indonesia.";
        } else if (i === daysCount) {
          title = "Tiba di Tanah Air Indonesia (Alhamdulillah Umroh Mabrur)";
          location = "Bandara Internasional Tanah Air";
          time = "Waktu Indonesia";
          dresscode = "Seragam Batik Resmi Travel";
          desc = "Tiba di Tanah Air dengan selamat. Pengambilan bagasi & penyerahan air zamzam 5 liter resmi. Jamaah kembali ke kediaman masing-masing.";
        }

        await prisma.itineraryDay.create({
          data: {
            packageId: pkg.id,
            dayNumber: i,
            date: itemDate,
            title,
            time,
            location,
            dresscode,
            mealPlan: "Fullboard Hotel / Sesuai Agenda",
            description: desc,
            notes: "Kumpul di titik kumpul tepat waktu.",
          },
        });
      }
    } catch (itErr) {
      console.warn("Auto-itinerary warning:", itErr);
    }

    return NextResponse.json(pkg, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}
