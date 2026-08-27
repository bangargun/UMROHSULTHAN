import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");

    let hotels = await prisma.masterHotel.findMany({
      where: city ? { city: city.toUpperCase() } : {},
      orderBy: { name: "asc" },
    });

    if (hotels.length === 0 && !city) {
      const initialHotels = [
        // Makkah
        { name: "Pullman Zamzam Tower (Bintang 5)", city: "MAKKAH", rating: 5, distance: "Pelataran Depan Masjidil Haram" },
        { name: "Swissotel Al Maqam Makkah (Bintang 5)", city: "MAKKAH", rating: 5, distance: "Kompleks Abraj Al Bait" },
        { name: "Fairmont Makkah Clock Royal Tower (Bintang 5)", city: "MAKKAH", rating: 5, distance: "Depan Masjidil Haram (Clock Tower)" },
        { name: "Movenpick Hotel & Residence Hajar Tower (Bintang 5)", city: "MAKKAH", rating: 5, distance: "Kompleks Abraj Al Bait" },
        { name: "Safwah Royale Orchid Hotel (Bintang 5)", city: "MAKKAH", rating: 5, distance: "Pelataran Depan Masjidil Haram" },
        { name: "Anjum Hotel Makkah (Bintang 5)", city: "MAKKAH", rating: 5, distance: "50 meter ke pelataran Baru" },
        { name: "Hilton Convention Makkah (Bintang 5)", city: "MAKKAH", rating: 5, distance: "Jabal Omar" },
        { name: "Al Kiswah Towers Hotel (Bintang 4)", city: "MAKKAH", rating: 4, distance: "900m Shuttle Bus 24 Jam" },
        { name: "Retaj Al Rayyan Hotel (Bintang 4)", city: "MAKKAH", rating: 4, distance: "Shuttle Bus Shisha" },

        // Madinah
        { name: "Dallah Taibah Hotel (Bintang 5)", city: "MADINAH", rating: 5, distance: "50 meter ke Pintu Utama Masjid Nabawi" },
        { name: "Dar Al Taqwa Hotel Madinah (Bintang 5)", city: "MADINAH", rating: 5, distance: "Depan Pelataran Masjid Nabawi (Pintu Utama)" },
        { name: "Madinah Hilton Hotel (Bintang 5)", city: "MADINAH", rating: 5, distance: "Pelataran Masjid Nabawi" },
        { name: "Pullman Zamzam Madinah (Bintang 5)", city: "MADINAH", rating: 5, distance: "150 meter ke Masjid Nabawi" },
        { name: "Frontel Al Harithia Hotel (Bintang 5)", city: "MADINAH", rating: 5, distance: "Dekat Pintu Masuk Raudhah Wanita" },
        { name: "Anwar Al Madinah Movenpick (Bintang 5)", city: "MADINAH", rating: 5, distance: "Pelataran Utara Masjid Nabawi" },
        { name: "Rove Al Madinah Hotel (Bintang 4)", city: "MADINAH", rating: 4, distance: "200 meter ke Masjid Nabawi" },
        { name: "Grand Plaza Madinah (Bintang 4)", city: "MADINAH", rating: 4, distance: "300 meter ke Masjid Nabawi" },
      ];

      for (const h of initialHotels) {
        await prisma.masterHotel.create({ data: h });
      }

      hotels = await prisma.masterHotel.findMany({
        where: city ? { city: city.toUpperCase() } : {},
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json(hotels);
  } catch (error) {
    console.error("Error fetching master hotels:", error);
    return NextResponse.json({ error: "Failed to fetch hotels" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, city, rating, distance } = body;

    if (!name || !city) {
      return NextResponse.json({ error: "Nama Hotel dan Kota (Makkah/Madinah) wajib diisi" }, { status: 400 });
    }

    const cleanCity = city.toUpperCase() === "MADINAH" ? "MADINAH" : "MAKKAH";
    const cleanName = name.trim();

    // Check if already exists
    let hotel = await prisma.masterHotel.findFirst({
      where: {
        name: cleanName,
        city: cleanCity,
      },
    });

    if (!hotel) {
      hotel = await prisma.masterHotel.create({
        data: {
          name: cleanName,
          city: cleanCity,
          rating: rating ? parseInt(rating) : 5,
          distance: distance ? distance.trim() : null,
        },
      });
    }

    return NextResponse.json(hotel, { status: 201 });
  } catch (error) {
    console.error("Error creating master hotel:", error);
    return NextResponse.json({ error: "Failed to create hotel" }, { status: 500 });
  }
}
