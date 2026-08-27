import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Standard Industry Umroh Itinerary Templates
const DEFAULT_TEMPLATES = {
  DAYS_9: [
    {
      dayNumber: 1,
      title: "Keberangkatan Menuju Madinah Al-Munawwarah",
      time: "08:00 WIB",
      location: "Bandara Internasional (KNO/CGK) - Bandara AMAA Madinah",
      dresscode: "Seragam Batik Resmi Travel",
      mealPlan: "Makan di Pesawat & Dinner Hotel",
      description: "Berkumpul di Bandara 4 jam sebelum take-off. Briefing teknis & doa pelepasan oleh Tour Leader. Penerbangan menuju Madinah. Tiba di Madinah, proses imigrasi & bagasi, dilanjutkan perjalanan menuju hotel dengan Bus VIP. Check-in hotel dan istirahat.",
      notes: "Koper bagasi telah diberi label nama jamaah & pita identitas travel.",
    },
    {
      dayNumber: 2,
      title: "Ziarah Raudhah & Makam Rasulullah SAW di Masjid Nabawi",
      time: "07:30 WSA",
      location: "Pelataran & Raudhah Masjid Nabawi",
      dresscode: "Baju Koko Putih (Pria) / Gamis Hitam (Wanita)",
      mealPlan: "Sarapan, Makan Siang & Malam di Hotel",
      description: "Sholat Subuh berjamaah di Masjid Nabawi. Memperbanyak ibadah sunnah, zikir, dan tilawah Al-Qur'an. Pelaksanaan Ziarah Makam Rasulullah SAW, Sayyidina Abu Bakar Ash-Shiddiq, Sayyidina Umar bin Khattab, serta Ziarah Raudhah As-Syarifah (Taman Surga) sesuai jadwal Tasreh resmi dari Nusuk.",
      notes: "Pastikan membawa kartu identitas & ID Card SISKOPATUH.",
    },
    {
      dayNumber: 3,
      title: "City Tour Kota Madinah (Ziarah Luar)",
      time: "07:00 WSA",
      location: "Masjid Quba, Jabal Uhud, Kebun Kurma, Masjid Qiblatain",
      dresscode: "Bebas Syar'i & Nyaman",
      mealPlan: "Sarapan, Makan Siang & Malam di Hotel",
      description: "Ziarah ke Masjid Quba (shalat sunnah 2 rakaat berpahala 1 kali umroh), Ziarah Syuhada Jabal Uhud & Makam Sayyidina Hamzah, melewati Masjid Qiblatain & Masjid Khamsah (Khandaq), belanja kurma di Perkebunan Kurma Madinah. Kembali ke hotel sebelum waktu Shalat Dzuhur.",
      notes: "Berwudhu dari hotel sebelum menuju Masjid Quba untuk mendapatkan pahala sempurna.",
    },
    {
      dayNumber: 4,
      title: "Ambil Miqat di Masjid Bir Ali, Menuju Makkah & Umroh Wajib",
      time: "09:00 WSA",
      location: "Hotel Madinah - Masjid Bir Ali - Kereta Cepat Haramain / Bus - Masjidil Haram Makkah",
      dresscode: "Kain Ihram (Pria) / Mukena & Busana Ihram (Wanita)",
      mealPlan: "Sarapan di Hotel Madinah, Snack Perjalanan & Dinner Hotel Makkah",
      description: "Mandi sunnah ihram dan bersiap dari hotel. Ziarah Wada' ke Makam Rasulullah SAW. Check-out hotel Madinah, berangkat menuju Masjid Dzulhulaifah (Bir Ali) untuk berniat Ihram Umroh. Melanjutkan perjalanan menuju Kota Suci Makkah Al-Mukarramah. Tiba di Makkah, check-in hotel, makan malam, lalu bersama Muthawwif menuju Masjidil Haram untuk pelaksanaan Thawaf, Sa'i, dan Tahallul (Umroh Wajib).",
      notes: "Jagalah larangan-larangan ihram sejak mengikrarkan niat di Bir Ali hingga selesai tahallul.",
    },
    {
      dayNumber: 5,
      title: "Istirahat & Memperbanyak Ibadah Mandiri di Masjidil Haram",
      time: "Sepanjang Hari",
      location: "Masjidil Haram Makkah",
      dresscode: "Bebas Rapi & Syar'i",
      mealPlan: "Sarapan, Makan Siang & Malam di Hotel",
      description: "Memulihkan stamina pasca pelaksanaan Umroh Wajib. Shalat fardhu 5 waktu berjamaah di Masjidil Haram (pahala 100.000 kali lipat), thawaf sunnah, iktikaf, dan memperbanyak doa di Multazam, Hijir Ismail, dan pelataran Ka'bah.",
      notes: "Minumlah air zamzam secukupnya untuk menjaga kebugaran tubuh.",
    },
    {
      dayNumber: 6,
      title: "City Tour Kota Makkah & Miqat Umroh Kedua (Ji'ranah / Tan'im)",
      time: "07:00 WSA",
      location: "Jabal Tsur, Padang Arafah, Jabal Rahmah, Muzdalifah, Mina, Ji'ranah",
      dresscode: "Batik Travel / Pakaian Ihram bagi yang berniat Umroh ke-2",
      mealPlan: "Sarapan, Makan Siang & Malam di Hotel",
      description: "Ziarah Napak Tilas Ibadah Haji ke Jabal Tsur, Padang Arafah (Jabal Rahmah), Muzdalifah, dan Mina (tempat melontar Jumrah). Melewati Jabal Nur (Gua Hira). Singgah di Masjid Ji'ranah bagi jamaah yang ingin mengambil Miqat untuk Umroh Sunnah kedua (Badal Umroh). Kembali ke hotel dan pelaksanaan Thawaf, Sa'i, Tahallul Umroh kedua.",
      notes: "Bagi yang tidak mengambil Umroh kedua, dapat menikmati ziarah dan shalat dzuhur di hotel/Masjidil Haram.",
    },
    {
      dayNumber: 7,
      title: "Ibadah Mandiri & Ziarah Opsional Museum Al-Amoudi",
      time: "Sepanjang Hari",
      location: "Masjidil Haram & Pusat Perbelanjaan Zamzam Tower / Souq",
      dresscode: "Bebas Syar'i",
      mealPlan: "Sarapan, Makan Siang & Malam di Hotel",
      description: "Memperbanyak thawaf sunnah dan shalat berjamaah di Masjidil Haram. Wisata belanja oleh-oleh haji & umroh di pertokoan sekitar hotel. Tausiyah pemantapan pasca umroh bersama Tour Leader di restoran hotel.",
      notes: "Mempersiapkan barang bawaan koper bagasi besar untuk penimbangan (weighing).",
    },
    {
      dayNumber: 8,
      title: "Thawaf Wada' (Perpisahan) & Perjalanan ke Bandara Jeddah",
      time: "04:00 WSA (Dini Hari / Pagi)",
      location: "Masjidil Haram - Hotel Makkah - Bandara King Abdulaziz Jeddah",
      dresscode: "Seragam Batik Resmi Travel",
      mealPlan: "Sarapan di Hotel Makkah & Makan di Bandara/Pesawat",
      description: "Pelaksanaan Thawaf Wada' bersama-sama sebelum waktu Subuh/Dhuha. Shalat Subuh terakhir di Masjidil Haram. Check-out hotel Makkah, perjalanan menuju Bandara King Abdulaziz Jeddah via Bus VIP. City tour singkat melewati Laut Merah & Masjid Terapung Jeddah (jika waktu memungkinkan). Proses check-in tiket, bagasi, dan imigrasi kepulangan.",
      notes: "Pastikan air zamzam resmi 5 liter telah terkoordinasi oleh tim logistik travel.",
    },
    {
      dayNumber: 9,
      title: "Tiba di Tanah Air Indonesia (Alhamdulillah Umroh Mabrur)",
      time: "Waktu Indonesia",
      location: "Bandara Internasional Indonesia (KNO/CGK)",
      dresscode: "Seragam Batik Resmi Travel",
      mealPlan: "Makan di Pesawat",
      description: "Penerbangan menuju Tanah Air. Mendarat di Bandara Indonesia. Proses imigrasi dan pengambilan bagasi koper serta air zamzam. Sesi foto bersama pelepasan kepulangan. Jamaah kembali ke rumah masing-masing membawa predikat Umroh yang Mabrur.",
      notes: "Semoga ibadah umroh Bapak/Ibu diterima oleh Allah SWT. Aamiin Ya Rabbal 'Alamin.",
    },
  ],
  DAYS_12: [
    {
      dayNumber: 1,
      title: "Keberangkatan Menuju Madinah Al-Munawwarah",
      time: "08:00 WIB",
      location: "Bandara KNO/CGK - Bandara AMAA Madinah",
      dresscode: "Seragam Batik Resmi Travel",
      mealPlan: "Makan di Pesawat & Dinner Hotel",
      description: "Penerbangan direct/transit menuju Madinah. Tiba di Madinah, transfer hotel dan istirahat.",
      notes: "Bawa perlengkapan ibadah ringan di tas kabin.",
    },
    {
      dayNumber: 2,
      title: "Ziarah Raudhah & Makam Rasulullah SAW",
      time: "07:30 WSA",
      location: "Raudhah As-Syarifah Masjid Nabawi",
      dresscode: "Baju Putih Rapi",
      mealPlan: "Fullboard Hotel",
      description: "Ibadah di Masjid Nabawi & Masuk Raudhah sesuai jadwal Tasreh Nusuk.",
      notes: "Jaga adab dan ketenangan di Makam Rasulullah SAW.",
    },
    {
      dayNumber: 3,
      title: "City Tour Madinah (Quba, Uhud, Kebun Kurma)",
      time: "07:00 WSA",
      location: "Ziarah Luar Kota Madinah",
      dresscode: "Bebas Syar'i",
      mealPlan: "Fullboard Hotel",
      description: "Ziarah Masjid Quba, Makam Syuhada Uhud, Masjid Qiblatain, dan Kebun Kurma.",
      notes: "Berwudhu dari hotel sebelum ke Masjid Quba.",
    },
    {
      dayNumber: 4,
      title: "Ziarah Seputar Masjid Nabawi & Ibadah Khusyuk",
      time: "Sepanjang Hari",
      location: "Masjid Ghamamah, Saqifah Bani Saidah, Pemakaman Baqi",
      dresscode: "Bebas Syar'i",
      mealPlan: "Fullboard Hotel",
      description: "Ziarah sejarah di sekitar Masjid Nabawi dan memperbanyak shalat berjamaah.",
      notes: "Persiapan fisik untuk perjalanan ke Makkah esok hari.",
    },
    {
      dayNumber: 5,
      title: "Miqat Bir Ali, Kereta Cepat Haramain & Umroh Wajib",
      time: "09:00 WSA",
      location: "Madinah - Bir Ali - Stasiun Madinah - Makkah",
      dresscode: "Pakaian Ihram",
      mealPlan: "Fullboard Hotel",
      description: "Mandi ihram, ziarah wada', ambil miqat di Bir Ali, naik Kereta Cepat Haramain (High Speed Railway 300 km/jam) ke Makkah. Check-in hotel & Pelaksanaan Umroh Wajib.",
      notes: "Pengalaman eksklusif Kereta Cepat Haramain (hanya 2 jam perjalanan).",
    },
    {
      dayNumber: 6,
      title: "Ibadah Mandiri & Pemulihan di Masjidil Haram",
      time: "Sepanjang Hari",
      location: "Masjidil Haram Makkah",
      dresscode: "Bebas Syar'i",
      mealPlan: "Fullboard Hotel",
      description: "Thawaf sunnah, iktikaf, dan shalat berjamaah di depan Ka'bah.",
      notes: "Pahala shalat di Masjidil Haram 100.000 kali lipat.",
    },
    {
      dayNumber: 7,
      title: "City Tour Makkah & Miqat Umroh Kedua (Ji'ranah)",
      time: "07:00 WSA",
      location: "Arafah, Mina, Muzdalifah, Ji'ranah",
      dresscode: "Batik Travel / Pakaian Ihram Umroh ke-2",
      mealPlan: "Fullboard Hotel",
      description: "Napak tilas haji ke Padang Arafah, Jabal Rahmah, Mina, dan Miqat Ji'ranah untuk Umroh ke-2.",
      notes: "Dapat diniatkan untuk Badal Umroh orang tua.",
    },
    {
      dayNumber: 8,
      title: "City Tour Eksklusif Kota Thaif (Pegunungan Sejuk)",
      time: "07:30 WSA",
      location: "Kota Thaif - Teleferik Cable Car - Masjid Ibnu Abbas - Pabrik Parfum Mawar",
      dresscode: "Jaket Hangat & Pakaian Nyaman",
      mealPlan: "Sarapan Hotel & Makan Siang Nasi Mandhi Khas Thaif",
      description: "Perjalanan menuju Kota Pegunungan Thaif. Mengunjungi Masjid Abdullah bin Abbas, Pabrik Penyulingan Parfum Mawar, naik Kereta Gantung Cable Car (opsional), menikmati kuliner Nasi Mandhi kambing khas Thaif, dan ambil miqat Qarnul Manazil (as-Sail al-Kabir) bagi yang ingin Umroh ke-3.",
      notes: "Suhu di Thaif cukup sejuk dan pemandangan alam spektakuler.",
    },
    {
      dayNumber: 9,
      title: "Ibadah Khusyuk & Tawaf Sunnah di Ka'bah",
      time: "Sepanjang Hari",
      location: "Masjidil Haram",
      dresscode: "Bebas Syar'i",
      mealPlan: "Fullboard Hotel",
      description: "Fokus ibadah, khatam Al-Qur'an, dan memanjatkan doa-doa hajat di Hijir Ismail.",
      notes: "Manfaatkan waktu sepertiga malam terakhir di pelataran Ka'bah.",
    },
    {
      dayNumber: 10,
      title: "Wisata Belanja & Persiapan Bagasi Kepulangan",
      time: "Sepanjang Hari",
      location: "Zamzam Tower & Pasar Kakiyah Makkah",
      dresscode: "Bebas Rapi",
      mealPlan: "Fullboard Hotel",
      description: "Belanja cenderamata khas Arab Saudi dan penimbangan koper bagasi 30 kg.",
      notes: "Pastikan cairan dan benda tajam masuk ke bagasi besar, bukan tas kabin.",
    },
    {
      dayNumber: 11,
      title: "Thawaf Wada', Menuju Jeddah & Terbang ke Indonesia",
      time: "04:00 WSA",
      location: "Masjidil Haram - Jeddah - Bandara",
      dresscode: "Seragam Batik Resmi Travel",
      mealPlan: "Sarapan Hotel & Makan di Bandara/Pesawat",
      description: "Thawaf perpisahan (Thawaf Wada'), check-out hotel, city tour singkat di Corniche Laut Merah Jeddah, dan penerbangan kepulangan ke Indonesia.",
      notes: "Koper dan air zamzam 5L resmi disiapkan tim handling.",
    },
    {
      dayNumber: 12,
      title: "Tiba di Tanah Air (Umroh Mabruran Maqbula)",
      time: "Waktu Indonesia",
      location: "Bandara Internasional Tanah Air",
      dresscode: "Seragam Batik Resmi Travel",
      mealPlan: "Makan di Pesawat",
      description: "Tiba di Indonesia dengan selamat. Pengambilan bagasi & penyerahan air zamzam. Selesai program ibadah umroh.",
      notes: "Taqabbalallahu Minna Wa Minkum. Selamat berkumpul kembali dengan keluarga.",
    },
  ],
};

// GET: Fetch all itinerary days for package
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const packageId = params.id;

    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        itineraries: {
          orderBy: { dayNumber: "asc" },
        },
      },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
    }

    // If no itineraries exist yet, return calculated default template matching duration
    let itineraries = pkg.itineraries;
    if (itineraries.length === 0) {
      const template = pkg.durationDays >= 12 ? DEFAULT_TEMPLATES.DAYS_12 : DEFAULT_TEMPLATES.DAYS_9;
      itineraries = template.map((item) => {
        const itemDate = new Date(pkg.departureDate);
        itemDate.setDate(itemDate.getDate() + (item.dayNumber - 1));
        return {
          id: `temp-${item.dayNumber}`,
          packageId: pkg.id,
          dayNumber: item.dayNumber,
          date: itemDate,
          title: item.title,
          time: item.time,
          location: item.location,
          dresscode: item.dresscode,
          mealPlan: item.mealPlan,
          description: item.description,
          notes: item.notes,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
      });
    }

    return NextResponse.json({
      package: {
        id: pkg.id,
        code: pkg.code,
        name: pkg.name,
        durationDays: pkg.durationDays,
        departureDate: pkg.departureDate,
        returnDate: pkg.returnDate,
        hotelMakkah: pkg.hotelMakkah,
        hotelMadinah: pkg.hotelMadinah,
        airline: pkg.airline,
      },
      itineraries,
    });
  } catch (error: any) {
    console.error("Error fetching itinerary:", error);
    return NextResponse.json({ error: error.message || "Gagal memuat itinerary" }, { status: 500 });
  }
}

// POST: Save or Batch update itinerary days
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const packageId = params.id;
    const body = await request.json();
    const { items, templateType } = body;

    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
    }

    let daysToSave = items;

    // If requested to apply a predefined template
    if (templateType && (!items || items.length === 0)) {
      const template = templateType === "DAYS_12" ? DEFAULT_TEMPLATES.DAYS_12 : DEFAULT_TEMPLATES.DAYS_9;
      daysToSave = template.map((item) => {
        const itemDate = new Date(pkg.departureDate);
        itemDate.setDate(itemDate.getDate() + (item.dayNumber - 1));
        return {
          dayNumber: item.dayNumber,
          date: itemDate.toISOString(),
          title: item.title,
          time: item.time,
          location: item.location,
          dresscode: item.dresscode,
          mealPlan: item.mealPlan,
          description: item.description,
          notes: item.notes,
        };
      });
    }

    if (!Array.isArray(daysToSave)) {
      return NextResponse.json({ error: "Format data itinerary tidak valid" }, { status: 400 });
    }

    // Transaction: Delete existing days and recreate batch
    await prisma.$transaction(async (tx) => {
      await tx.itineraryDay.deleteMany({
        where: { packageId },
      });

      for (const day of daysToSave) {
        const itemDate = day.date
          ? new Date(day.date)
          : (() => {
              const d = new Date(pkg.departureDate);
              d.setDate(d.getDate() + (day.dayNumber - 1));
              return d;
            })();

        await tx.itineraryDay.create({
          data: {
            packageId,
            dayNumber: day.dayNumber,
            date: itemDate,
            title: day.title,
            time: day.time || null,
            location: day.location || null,
            dresscode: day.dresscode || null,
            mealPlan: day.mealPlan || null,
            description: day.description || null,
            notes: day.notes || null,
          },
        });
      }
    });

    const updatedItineraries = await prisma.itineraryDay.findMany({
      where: { packageId },
      orderBy: { dayNumber: "asc" },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menyimpan ${updatedItineraries.length} hari rundown perjalanan!`,
      itineraries: updatedItineraries,
    });
  } catch (error: any) {
    console.error("Error saving itinerary:", error);
    return NextResponse.json({ error: error.message || "Gagal menyimpan itinerary" }, { status: 500 });
  }
}
