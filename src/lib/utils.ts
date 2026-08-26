import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string | null | undefined, pattern: string = "dd MMMM yyyy"): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return format(d, pattern, { locale: id });
}

export function formatShortDate(date: Date | string | null | undefined): string {
  return formatDate(date, "dd/MM/yyyy");
}

export function getStatusBadge(status: string): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    // Lead Statuses
    case "NEW":
      return { label: "Lead Baru", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
    case "CONTACTED":
      return { label: "Dihubungi", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
    case "INTERESTED":
      return { label: "Tertarik", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" };
    case "QUOTATION_SENT":
      return { label: "Penawaran Terkirim", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" };
    case "CLOSING_DP":
      return { label: "Closing / DP", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
    case "LOST":
      return { label: "Batal / Lost", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" };

    // Pilgrim Statuses
    case "REGISTERED":
      return { label: "Terdaftar", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" };
    case "DP_PAID":
      return { label: "DP Terbayar", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
    case "FULLY_PAID":
      return { label: "Lunas", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
    case "DOCUMENTS_READY":
      return { label: "Berkas Lengkap", bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" };
    case "VISA_ISSUED":
      return { label: "Visa Terbit", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" };
    case "DEPARTED":
      return { label: "Di Tanah Suci", bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300" };
    case "RETURNED":
      return { label: "Selesai / Pulang", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" };

    // Invoice Statuses
    case "PAID":
      return { label: "Lunas", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
    case "PENDING":
      return { label: "Belum Bayar", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
    case "OVERDUE":
      return { label: "Jatuh Tempo", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" };
    case "CANCELLED":
      return { label: "Dibatalkan", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300" };

    default:
      return { label: status, bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
  }
}

export function generateWhatsAppReminderUrl({
  phone,
  pilgrimName,
  invoiceNumber,
  title,
  amount,
  dueDate,
}: {
  phone: string;
  pilgrimName: string;
  invoiceNumber: string;
  title: string;
  amount: number;
  dueDate: string | Date;
}): string {
  // Normalize phone number to Indonesian international format (62)
  let cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "62" + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith("62")) {
    cleanPhone = "62" + cleanPhone;
  }

  const formattedAmount = formatCurrency(amount);
  const formattedDueDate = formatDate(dueDate);

  const message = `*Bismillah, Assalamu'alaikum Wr. Wb.*\n\n` +
    `Yth. Bapak/Ibu *${pilgrimName}*,\n\n` +
    `Semoga senantiasa dalam limpahan rahmat & kesehatan Allah SWT.\n\n` +
    `Kami dari *Travel Umroh Berkah* bermaksud menginformasikan tagihan *${title}* dengan rincian sebagai berikut:\n\n` +
    `📄 *No. Invoice:* ${invoiceNumber}\n` +
    `💰 *Nominal:* ${formattedAmount}\n` +
    `🗓 *Jatuh Tempo:* ${formattedDueDate}\n\n` +
    `Pembayaran dapat ditransfer melalui rekening resmi travel kami:\n` +
    `🏦 *Bank Syariah Indonesia (BSI)* : 7123-4567-89\n` +
    `🏦 *Bank Central Asia (BCA)* : 731-008-899\n` +
    `a.n *PT TRAVEL UMROH BERKAH NUSANTARA*\n\n` +
    `Mohon mengirimkan bukti transfer setelah melakukan pembayaran. Jika Bapak/Ibu sudah melakukan pembayaran, mohon abaikan pesan ini.\n\n` +
    `_Jazakumullah Khairan Katsiran._\n` +
    `Wassalamu'alaikum Wr. Wb.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
