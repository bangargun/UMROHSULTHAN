import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    let config = await prisma.paymentGatewayConfig.findUnique({
      where: { id: "default-pg" },
    });

    if (!config) {
      config = await prisma.paymentGatewayConfig.create({
        data: {
          id: "default-pg",
          provider: "MIDTRANS",
          merchantId: null,
          clientKey: null,
          serverKey: null,
          isSandbox: true,
          activeChannelsJson: JSON.stringify(["BSI_VA", "MANDIRI_VA", "BCA_VA", "QRIS"]),
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching Payment Gateway config:", error);
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { provider, merchantId, clientKey, serverKey, isSandbox, activeChannelsJson } = body;

    const updated = await prisma.paymentGatewayConfig.upsert({
      where: { id: "default-pg" },
      update: {
        provider,
        merchantId,
        clientKey,
        serverKey,
        isSandbox: isSandbox !== undefined ? Boolean(isSandbox) : true,
        activeChannelsJson: typeof activeChannelsJson === "object" ? JSON.stringify(activeChannelsJson) : activeChannelsJson,
      },
      create: {
        id: "default-pg",
        provider: provider || "MIDTRANS",
        merchantId: merchantId || null,
        clientKey: clientKey || null,
        serverKey: serverKey || null,
        isSandbox: isSandbox !== undefined ? Boolean(isSandbox) : true,
        activeChannelsJson: typeof activeChannelsJson === "object" ? JSON.stringify(activeChannelsJson) : activeChannelsJson,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating Payment Gateway config:", error);
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
