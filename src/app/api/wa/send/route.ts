import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, message, pilgrimName, packageName } = body;

    if (!phone || !message) {
      return NextResponse.json({ error: "Nomor WhatsApp dan Pesan wajib diisi" }, { status: 400 });
    }

    const config = await prisma.whatsappConfig.findUnique({
      where: { id: "default-wa" },
    });

    // Clean phone number (convert 08xx to 628xx)
    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }

    // If Fonnte API Key is provided, attempt live dispatch
    if (config?.apiKey && config.provider === "FONNTE") {
      try {
        const fonnteRes = await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: {
            Authorization: config.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target: cleanPhone,
            message: message,
          }),
        });
        const fonnteData = await fonnteRes.json();
        return NextResponse.json({ success: true, result: fonnteData, dispatchedVia: "FONNTE_API" });
      } catch (fErr) {
        console.error("Fonnte dispatch error:", fErr);
      }
    }

    // Generate Direct WhatsApp URL for web/desktop link fallback
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    return NextResponse.json({
      success: true,
      phone: cleanPhone,
      message,
      waUrl,
      dispatchedVia: config?.isConnected ? "GATEWAY_ONLINE" : "DIRECT_WA_LINK",
    });
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return NextResponse.json({ error: "Failed to dispatch message" }, { status: 500 });
  }
}
