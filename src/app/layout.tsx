import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaInstallPrompt from "@/components/pwa/PwaInstallPrompt";

export const metadata: Metadata = {
  title: "Sulthan Haramain - Portal Mandiri & Aplikasi Umroh",
  description: "Aplikasi Terpadu Manajemen Marketing, Database Jamaah, Keuangan, Logistik, Ceklis & Generator Surat",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sulthan Umroh",
  },
};

export const viewport: Viewport = {
  themeColor: "#064e3b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/sulthan-haramain-logo.jpg" />
      </head>
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
