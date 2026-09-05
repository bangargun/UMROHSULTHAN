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

export function terbilang(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n) || n === 0) return "Nol Rupiah";
  const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];

  function convert(num: number): string {
    let temp = "";
    if (num < 12) {
      temp = " " + satuan[num];
    } else if (num < 20) {
      temp = convert(num - 10) + " Belas";
    } else if (num < 100) {
      temp = convert(Math.floor(num / 10)) + " Puluh" + convert(num % 10);
    } else if (num < 200) {
      temp = " Seratus" + convert(num - 100);
    } else if (num < 1000) {
      temp = convert(Math.floor(num / 100)) + " Ratus" + convert(num % 100);
    } else if (num < 2000) {
      temp = " Seribu" + convert(num - 1000);
    } else if (num < 1000000) {
      temp = convert(Math.floor(num / 1000)) + " Ribu" + convert(num % 1000);
    } else if (num < 1000000000) {
      temp = convert(Math.floor(num / 1000000)) + " Juta" + convert(num % 1000000);
    } else if (num < 1000000000000) {
      temp = convert(Math.floor(num / 1000000000)) + " Miliar" + convert(num % 1000000000);
    } else if (num < 1000000000000000) {
      temp = convert(Math.floor(num / 1000000000000)) + " Triliun" + convert(num % 1000000000000);
    }
    return temp;
  }

  const result = convert(Math.abs(Math.floor(n))).trim();
  return result ? `${result} Rupiah` : "Nol Rupiah";
}

export function formatRupiahWithWords(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "Rp. 0,- (Nol Rupiah)";
  const formattedNominal = "Rp. " + new Intl.NumberFormat("id-ID").format(amount) + ",-";
  const textWords = terbilang(amount);
  return `${formattedNominal} (${textWords})`;
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
  discountAmount,
  discountReason,
  companyName,
  bankBSI,
  bankBCA,
  bankMandiri,
}: {
  phone: string;
  pilgrimName: string;
  invoiceNumber: string;
  title: string;
  amount: number;
  dueDate: string | Date;
  discountAmount?: number | null;
  discountReason?: string | null;
  companyName?: string;
  bankBSI?: string;
  bankBCA?: string;
  bankMandiri?: string;
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
  const company = companyName || "PT BAROKAH SULTHAN HARAMAIN";

  let discountInfo = "";
  if (discountAmount && discountAmount > 0) {
    discountInfo = `🏷️ *Potongan Diskon Khusus:* ${formatCurrency(discountAmount)} (${discountReason || "Promo Spesial"})\n`;
  }

  const message = `*Bismillah, Assalamu'alaikum Wr. Wb.*\n\n` +
    `Yth. Bapak/Ibu *${pilgrimName}*,\n\n` +
    `Semoga senantiasa dalam limpahan rahmat & kesehatan Allah SWT.\n\n` +
    `Kami dari *${company}* bermaksud menginformasikan tagihan *${title}* dengan rincian:\n\n` +
    `📄 *No. Invoice:* ${invoiceNumber}\n` +
    discountInfo +
    `💰 *Nominal Tagihan:* ${formattedAmount}\n` +
    `🗓 *Jatuh Tempo:* ${formattedDueDate}\n\n` +
    `Pembayaran dapat ditransfer melalui rekening resmi travel kami:\n` +
    `🏦 *Bank BSI* : ${bankBSI || "7123-4567-89"}\n` +
    `🏦 *Bank BCA* : ${bankBCA || "731-008-899"}\n` +
    `🏦 *Bank Mandiri* : ${bankMandiri || "137-00-9876543-2"}\n` +
    `a.n *${company}*\n\n` +
    `Mohon mengirimkan bukti transfer setelah melakukan pembayaran. Jika Bapak/Ibu sudah melakukan pembayaran, mohon abaikan pesan ini.\n\n` +
    `_Jazakumullah Khairan Katsiran._\n` +
    `Wassalamu'alaikum Wr. Wb.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
