import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    let config = await prisma.whatsappConfig.findUnique({
      where: { id: "default-wa" },
    });

    if (!config) {
      config = await prisma.whatsappConfig.create({
        data: {
          id: "default-wa",
          provider: "FONNTE",
          apiKey: null,
          senderPhone: null,
          isConnected: false,
          autoRemindersEnabled: true,
          templatesJson: JSON.stringify({
            WELCOME_LEAD: "Assalamu'alaikum Wr. Wb. Bpk/Ibu *{NAMA}*, terima kasih telah menghubungi PT BAROKAH SULTHAN HARAMAIN. Kami siap melayani rencana ibadah Umroh Anda untuk program *{PAKET}*.",
            DP_INVOICE_SENT: "Assalamu'alaikum Bpk/Ibu *{NAMA}*, berikut tagihan pembayaran DP pendaftaran Umroh *{PAKET}* sebesar *{NOMINAL}*. Silakan melakukan pembayaran ke rekening resmi PT BAROKAH SULTHAN HARAMAIN: BSI 8888-999-123.",
            PAYMENT_CONFIRMED: "Alhamdulillah, pembayaran sebesar *{NOMINAL}* untuk Bpk/Ibu *{NAMA}* telah kami terima dan diverifikasi. Kuitansi resmi telah tercatat di sistem kami.",
            DUE_DATE_REMINDER: "Pengingat Ibadah: Assalamu'alaikum Bpk/Ibu *{NAMA}*, kami menginfokan batas waktu pelunasan program *{PAKET}* jatuh tempo pada *{TANGGAL}* sebesar *{NOMINAL}*.",
            DEPARTURE_INFO: "Pemberitahuan Keberangkatan: Assalamu'alaikum Bpk/Ibu *{NAMA}*, keberangkatan grup *{PAKET}* dijadwalkan pada *{TANGGAL}* di Bandara Soekarno Hatta Terminal 3.",
          }),
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching WhatsApp config:", error);
    return NextResponse.json({ error: "Failed to fetch WhatsApp config" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { provider, apiKey, senderPhone, isConnected, autoRemindersEnabled, templatesJson } = body;

    const updated = await prisma.whatsappConfig.upsert({
      where: { id: "default-wa" },
      update: {
        provider,
        apiKey,
        senderPhone,
        isConnected: isConnected !== undefined ? Boolean(isConnected) : undefined,
        autoRemindersEnabled: autoRemindersEnabled !== undefined ? Boolean(autoRemindersEnabled) : undefined,
        templatesJson: typeof templatesJson === "object" ? JSON.stringify(templatesJson) : templatesJson,
      },
      create: {
        id: "default-wa",
        provider: provider || "FONNTE",
        apiKey: apiKey || null,
        senderPhone: senderPhone || null,
        isConnected: Boolean(isConnected),
        autoRemindersEnabled: autoRemindersEnabled !== undefined ? Boolean(autoRemindersEnabled) : true,
        templatesJson: typeof templatesJson === "object" ? JSON.stringify(templatesJson) : templatesJson,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating WhatsApp config:", error);
    return NextResponse.json({ error: "Failed to update WhatsApp config" }, { status: 500 });
  }
}
