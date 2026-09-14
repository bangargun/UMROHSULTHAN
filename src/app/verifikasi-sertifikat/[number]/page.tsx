import React from "react";
import prisma from "@/lib/prisma";
import { CheckCircle2, ShieldCheck, Award, Building2, Calendar, User, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: {
    number: string;
  };
}

export default async function CertificateVerificationPage({ params }: PageProps) {
  const decodedNumber = decodeURIComponent(params.number);

  const cert = await prisma.certificate.findFirst({
    where: {
      certificateNumber: decodedNumber,
    },
    include: {
      pilgrim: {
        include: { package: true },
      },
    },
  });

  const badal = !cert
    ? await prisma.badalUmroh.findFirst({
        where: {
          OR: [
            { orderNumber: decodedNumber },
            { orderNumber: decodedNumber.replace("CERT-", "") },
            { id: decodedNumber },
          ],
        },
      })
    : null;

  const setting = await prisma.travelSetting.findFirst();

  if (!cert && !badal) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl border border-rose-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✕
          </div>
          <h2 className="text-xl font-black text-slate-900">Sertifikat Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Nomor sertifikat <strong className="font-mono text-slate-800">{decodedNumber}</strong> tidak terdaftar dalam pangkalan data resmi PT Sulthan Haramain Tour & Travel.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-800 py-10 px-4 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-amber-400/40 overflow-hidden relative">
        {/* Top Gold Border Ornament */}
        <div className="h-3 bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header & Verification Badge */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto p-1.5 bg-white rounded-2xl border border-amber-300 shadow-sm flex items-center justify-center">
              <img
                src="/sulthan-haramain-logo.jpg"
                alt="Logo Sulthan Haramain"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Sertifikat Resmi Terverifikasi Sah
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                  {setting?.companyName || "PT BAROKAH SULTHAN HARAMAIN"}
                </h1>
                <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                  Barokah Group Indonesia
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {setting?.kemenhanLicense || "Keputusan Menteri Hukum RI NOMOR AHU-0007388.AH.01.01.TAHUN 2026"}
              </p>
              <p className="text-[11px] text-amber-800 font-bold mt-0.5">
                NO. IZIN PPIU KEMENAG RI: {setting?.licenseNumber || "25052200384080005"}
              </p>
            </div>
          </div>

          {/* Certificate Card Summary */}
          {cert ? (
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-4 text-xs">
              <div className="text-center border-b border-amber-200 pb-3">
                <span className="text-[10px] uppercase font-bold text-amber-900 tracking-widest block">
                  Nomor Piagam Resmi
                </span>
                <span className="font-mono font-black text-base text-slate-950">
                  {cert.certificateNumber}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 text-[10px] block">Nama Lengkap Jamaah:</span>
                    <span className="font-black text-slate-950 text-sm">{cert.pilgrim?.name}</span>
                    {cert.pilgrim?.passportNumber && (
                      <span className="text-slate-500 text-[11px] block">
                        No. Paspor: <strong className="font-mono text-slate-800">{cert.pilgrim.passportNumber}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Award className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 text-[10px] block">Program Ibadah Umroh:</span>
                    <span className="font-bold text-slate-900">{cert.packageName}</span>
                  </div>
                </div>

                {(cert.departureDate || cert.returnDate) && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 text-[10px] block">Periode Keberangkatan & Kepulangan:</span>
                      <span className="font-semibold text-slate-800">
                        {cert.departureDate ? formatDate(cert.departureDate, "dd MMMM yyyy") : "-"} s/d{" "}
                        {cert.returnDate ? formatDate(cert.returnDate, "dd MMMM yyyy") : "-"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-amber-200 text-[11px] flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Diterbitkan Oleh:</span>
                    <span className="font-bold text-slate-900">{setting?.companyName || "PT BAROKAH SULTHAN HARAMAIN"}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block">Direktur Utama:</span>
                    <span className="font-black text-slate-900">{cert.directorName || "ATIYATUL AMRA"}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : badal ? (
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-4 text-xs">
              <div className="text-center border-b border-amber-200 pb-3">
                <span className="text-[10px] uppercase font-bold text-amber-900 tracking-widest block">
                  Nomor Sertifikat Badal Umroh
                </span>
                <span className="font-mono font-black text-base text-slate-950">
                  {badal.orderNumber}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 text-[10px] block">Diniatkan & Dihadiahkan Kepada:</span>
                    <span className="font-black text-slate-950 text-base uppercase">{badal.recipientName}</span>
                    <span className="text-slate-600 text-[11px] block mt-0.5">
                      {badal.recipientGender === "MALE" ? "Bin" : "Binti"} — {badal.recipientStatus === "DECEASED" ? "Almarhum/ah (Semoga Allah Merahmati Beliau)" : "Uzur / Sakit Permanen"}
                      {badal.recipientBirthPlace ? ` • Lahir di ${badal.recipientBirthPlace}` : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Award className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 text-[10px] block">Pelaksana Badal di Makkah:</span>
                    <span className="font-bold text-slate-900">{badal.executorName || "Muthawwif Sulthan Haramain"}</span>
                    {badal.scheduledDate && (
                      <span className="text-slate-500 text-[11px] block">
                        Tanggal Pelaksanaan: {formatDate(badal.scheduledDate, "dd MMMM yyyy")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 text-[10px] block">Pemesan / Ahli Waris:</span>
                    <span className="font-semibold text-slate-800">
                      {badal.ordererName} ({badal.ordererRelation.toLowerCase()} dari yang dibadalkan)
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-amber-200 text-[11px] flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Diterbitkan Oleh:</span>
                    <span className="font-bold text-slate-900">{setting?.companyName || "PT BAROKAH SULTHAN HARAMAIN"}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block">Direktur Utama:</span>
                    <span className="font-black text-slate-900">{setting?.directorName || "ATIYATUL AMRA"}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Doa Arabic */}
          <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <p className="font-serif text-emerald-950 font-bold text-base">
              {badal
                ? "اللّٰهُمَّ تَقَبَّلْ هٰذِهِ الْعُمْرَةَ وَاجْعَلْهَا رَحْمَةً وَنُوْرًا وَمَغْفِرَةً"
                : "جَعَلَهُ اللّٰهُ عُمْرَةً مَبْرُوْرَةً وَذَنْبًا مَغْفُوْرًا وَسَعْيًا مَشْكُوْرًا"}
            </p>
            <p className="text-[10px] text-slate-500 italic">
              {badal
                ? '"Ya Allah, terimalah ibadah umroh ini, jadikanlah sebagai rahmat, cahaya, dan ampunan bagi beliau."'
                : '"Semoga Allah SWT menerima ibadah umrohnya, mengampuni segala khilafnya, dan menjadikannya umroh yang mabrur."'}
            </p>
          </div>

          <div className="text-center pt-2 text-[10px] text-slate-400">
            Diterbitkan secara sah oleh Sistem Informasi Digital PT Sulthan Haramain Tour & Travel
          </div>
        </div>
      </div>
    </div>
  );
}
