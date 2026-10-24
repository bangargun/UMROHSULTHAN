"use client";

import React, { useRef } from "react";
import { Printer, Download, X, FileText, CheckCircle2 } from "lucide-react";

interface BatchPassportPrintModalProps {
  packageName: string;
  departureDate?: string | Date | null;
  pilgrims: any[];
  onClose: () => void;
  docFilter?: "paspor" | "vaksin" | "all";
}

export default function BatchPassportPrintModal({
  packageName,
  departureDate,
  pilgrims,
  onClose,
  docFilter = "paspor",
}: BatchPassportPrintModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Filter jamaah yang memiliki dokumen sesuai pilihan
  const validPilgrims = pilgrims.filter((p) => {
    if (docFilter === "paspor") return Boolean(p.passportFileUrl || p.passportNumber);
    if (docFilter === "vaksin") return Boolean(p.vaccineCardFileUrl || p.hasMeningitisVaccine);
    return Boolean(p.passportFileUrl || p.vaccineCardFileUrl || p.passportNumber);
  });

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (date: any) => {
    if (!date) return "-";
    try {
      const d = new Date(date);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return String(date);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs print:p-0 print:bg-white print:static print:block">
      {/* Container Dialog */}
      <div className="bg-white rounded-3xl w-full max-w-5xl h-[94vh] flex flex-col shadow-2xl overflow-hidden print:h-auto print:max-w-none print:shadow-none print:rounded-none">
        {/* Header (No-Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0 no-print">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>Dokumen Rombongan (1 File PDF Siap Cetak / Save As PDF)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Paket: <strong className="text-slate-800">{packageName}</strong> • Total Terdata:{" "}
              <strong className="text-emerald-700">{validPilgrims.length} Jamaah</strong>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF (1 File)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Stylesheet */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .printable-batch-doc,
            .printable-batch-doc * {
              visibility: visible;
            }
            .printable-batch-doc {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
            .page-break {
              page-break-after: always;
              break-after: page;
            }
            @page {
              size: A4 portrait;
              margin: 10mm 15mm;
            }
          }
        `}</style>

        {/* Content Area (Scrollable in UI, Page Breaks in Print) */}
        <div ref={printAreaRef} className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:p-0 printable-batch-doc space-y-6 print:space-y-0">
          {/* HALAMAN 1: COVER MANIFEST ROMBONGAN */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-none min-h-[265mm] flex flex-col justify-between page-break">
            <div>
              {/* Header Travel */}
              <div className="text-center pb-6 border-b-2 border-slate-800">
                <span className="text-[11px] font-black tracking-widest text-emerald-700 uppercase">
                  PT BAROKAH SULTHAN HARAMAIN
                </span>
                <h1 className="text-2xl font-black text-slate-900 uppercase mt-1">
                  MANIFEST DOKUMEN VISA & PASPOR ROMBONGAN
                </h1>
                <p className="text-xs font-semibold text-slate-600 mt-1">
                  Paket: <span className="font-bold text-slate-900">{packageName}</span> • Keberangkatan:{" "}
                  <span className="font-bold text-slate-900">{formatDate(departureDate)}</span>
                </p>
              </div>

              {/* Ringkasan Tabel Manifest */}
              <div className="mt-6">
                <h3 className="text-xs font-black uppercase text-slate-800 mb-2">
                  DAFTAR NOMOR PASPOR & STATUS DOKUMEN ({validPilgrims.length} JAMAAH)
                </h3>
                <table className="w-full text-[11px] border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold">
                      <th className="border border-slate-300 p-1.5 text-center w-8">NO</th>
                      <th className="border border-slate-300 p-1.5 text-left">NAMA LENGKAP</th>
                      <th className="border border-slate-300 p-1.5 text-center">NO. PASPOR</th>
                      <th className="border border-slate-300 p-1.5 text-center">MASA BERLAKU</th>
                      <th className="border border-slate-300 p-1.5 text-center">STATUS SCAN PASPOR</th>
                      <th className="border border-slate-300 p-1.5 text-center">STATUS VAKSIN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validPilgrims.map((p, idx) => (
                      <tr key={p.id} className="border-b border-slate-200">
                        <td className="border border-slate-300 p-1.5 text-center font-bold">{idx + 1}</td>
                        <td className="border border-slate-300 p-1.5 font-bold uppercase">{p.name}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono font-bold">
                          {p.passportNumber || "-"}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center">
                          {formatDate(p.passportExpiry)}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center">
                          {p.passportFileUrl ? (
                            <span className="text-emerald-700 font-bold">✅ Ada Scan</span>
                          ) : (
                            <span className="text-slate-400">Belum Ada</span>
                          )}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center">
                          {p.vaccineCardFileUrl || p.hasMeningitisVaccine ? (
                            <span className="text-emerald-700 font-bold">✅ Siap</span>
                          ) : (
                            <span className="text-amber-600 font-bold">Belum Lengkap</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-right text-[10px] text-slate-500 font-medium">
              Dokumen Dicetak pada: {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} WIB
            </div>
          </div>

          {/* HALAMAN 2 DST: 1 HALAMAN PER JAMAAH */}
          {validPilgrims.map((p, idx) => (
            <div
              key={p.id}
              className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-none min-h-[265mm] flex flex-col justify-between page-break"
            >
              <div>
                {/* Header Dokumen Jamaah */}
                <div className="flex items-start justify-between pb-4 border-b-2 border-emerald-600">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                      LEMBAR DOKUMEN VISA #{String(idx + 1).padStart(2, "0")} • {packageName}
                    </span>
                    <h2 className="text-xl font-black text-slate-900 uppercase">{p.name}</h2>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      NIK: <span className="font-mono">{p.nik}</span> • Jenis Kelamin:{" "}
                      <span>{p.gender === "FEMALE" ? "Perempuan" : "Laki-laki"}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Nomor Paspor RI</span>
                    <p className="text-lg font-mono font-black text-slate-900">{p.passportNumber || "-"}</p>
                    <p className="text-[10px] font-semibold text-slate-600">
                      Exp: {formatDate(p.passportExpiry)}
                    </p>
                  </div>
                </div>

                {/* Tampilan Gambar Scan Paspor */}
                <div className="mt-6 text-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 text-left">
                    LAMPIRAN SCAN PASPOR ASLI:
                  </h4>
                  {p.passportFileUrl ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-2 bg-slate-50 flex items-center justify-center min-h-[140mm]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.passportFileUrl}
                        alt={`Paspor ${p.name}`}
                        className="max-h-[135mm] max-w-full object-contain mx-auto rounded-lg shadow-xs"
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-rose-300 rounded-2xl p-12 bg-rose-50/50 text-center text-rose-700 font-semibold text-xs">
                      ⚠️ Scan berkas paspor fisik belum diunggah untuk jamaah ini.
                    </div>
                  )}
                </div>

                {/* Tampilan Bukti Vaksin (Jika Ada) */}
                {(docFilter === "vaksin" || docFilter === "all" || p.vaccineCardFileUrl) && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[11px] font-black uppercase text-teal-800">
                        STATUS VAKSINASI (MENINGITIS / POLIO):
                      </h4>
                      <span className="text-[10px] font-bold text-slate-600 font-mono">
                        No Sertifikat: {p.vaccineNumber || p.meningitisVaccineNumber || "-"}
                      </span>
                    </div>

                    {p.vaccineCardFileUrl ? (
                      <div className="border border-slate-200 rounded-xl p-2 bg-teal-50/30 text-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.vaccineCardFileUrl}
                          alt={`Vaksin ${p.name}`}
                          className="max-h-[50mm] max-w-full object-contain mx-auto rounded"
                        />
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">
                        Status: {p.hasMeningitisVaccine ? "Sudah Vaksin (Berkas fisik tercatat)" : "Belum Vaksin"}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Lembar Cetak */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span>PT Barokah Sulthan Haramain • Portal Umroh Manajemen</span>
                <span>
                  Halaman {idx + 2} dari {validPilgrims.length + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
