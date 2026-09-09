"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  QrCode,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building,
  Plane,
  User,
  ShieldCheck,
  Phone,
  Heart,
  Calendar,
  X,
  CreditCard,
  RefreshCw,
  ExternalLink,
  Copy,
  CheckCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ComplianceViewProps {
  packages: any[];
  pilgrims: any[];
}

export default function ComplianceView({ packages, pilgrims }: ComplianceViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"SISKOPATUH" | "IDCARD" | "MANIFEST_VISA">("SISKOPATUH");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("ALL");
  const [manifestVisaCopied, setManifestVisaCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [siskopatuhData, setSiskopatuhData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPilgrimForIdCard, setSelectedPilgrimForIdCard] = useState<any | null>(null);
  const [travelSettings, setTravelSettings] = useState<any>({
    companyName: "PT BAROKAH SULTHAN HARAMAIN",
    licenseNumber: "SK Kemenkumham RI No. AHU-0007388.AH.01.01.TAHUN 2026",
    kemenhanLicense: "NIB: 1504260072814 • KBLI 79122",
    phone: "0821-6733-9464",
    email: "barokahsulthanharamain@gmail.com",
    address: "Jl. Syekh Beringin Griya Palm Asri Tebing Tinggi, Sumut",
  });

  const loadSiskopatuh = async () => {
    setLoading(true);
    try {
      const url = `/api/compliance/siskopatuh?packageId=${selectedPackageId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSiskopatuhData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSiskopatuh();
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.companyName) setTravelSettings(data);
      })
      .catch((e) => console.error(e));
  }, [selectedPackageId]);

  // Filtered SISKOPATUH rows
  const filteredData = siskopatuhData.filter((row) => {
    const matchSearch =
      row.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.noPaspor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.namaPaket.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  // Filtered Pilgrims for ID Cards
  const filteredPilgrims = pilgrims.filter((p) => {
    const matchPkg = selectedPackageId === "ALL" || p.packageId === selectedPackageId;
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.passportNumber && p.passportNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.nik && p.nik.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchPkg && matchSearch;
  });

  // Export to CSV formatted for SISKOPATUH
  const handleExportCsv = () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data jamaah untuk program paket yang dipilih.");
      return;
    }

    const selectedPkg = packages.find((p) => p.id === selectedPackageId);
    const pkgCode = selectedPkg ? selectedPkg.code : "SEMUA_PAKET";
    const pkgNameClean = selectedPkg
      ? selectedPkg.name.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()
      : "SEMUA_PROGRAM";

    const headers = [
      "NO_URUT",
      "KD_PPIU",
      "NAMA_PPIU",
      "NIK",
      "NO_PASPOR",
      "NAMA_LENGKAP",
      "NAMA_AYAH_KANDUNG",
      "TEMPAT_LAHIR",
      "TGL_LAHIR",
      "JENIS_KELAMIN",
      "NO_HP",
      "ALAMAT",
      "KOTA",
      "PROVINSI",
      "STATUS_PERKAWINAN",
      "NAMA_MAHRAM",
      "HUBUNGAN_MAHRAM",
      "STATUS_VAKSIN_MENINGITIS",
      "STATUS_PASPOR",
      "TIPE_KAMAR",
      "UKURAN_SERAGAM",
      "KODE_PAKET",
      "NAMA_PAKET",
      "TGL_KEBERANGKATAN",
      "TGL_KEPULANGAN",
      "MASKAPAI",
      "HOTEL_MAKKAH",
      "HOTEL_MADINAH",
      "STATUS_JAMAAH",
    ];

    const rows = filteredData.map((d) => [
      d.noUrut,
      `"${d.kdPpiu}"`,
      `"${d.namaPpiu}"`,
      `'${d.nik}'`,
      `"${d.noPaspor}"`,
      `"${d.namaLengkap}"`,
      `"${d.namaAyahKandung}"`,
      `"${d.tempatLahir}"`,
      `"${d.tanggalLahir}"`,
      `"${d.jenisKelamin}"`,
      `'${d.nomorHp}'`,
      `"${d.alamat}"`,
      `"${d.kota}"`,
      `"${d.provinsi}"`,
      `"${d.statusPerkawinan}"`,
      `"${d.namaMahram}"`,
      `"${d.hubunganMahram}"`,
      `"${d.statusVaksinMeningitis}"`,
      `"${d.statusPaspor}"`,
      `"${d.tipeKamar}"`,
      `"${d.ukuranSeragam}"`,
      `"${d.kodePaket}"`,
      `"${d.namaPaket}"`,
      `"${d.tanggalKeberangkatan}"`,
      `"${d.tanggalKepulangan}"`,
      `"${d.maskapai}"`,
      `"${d.hotelMakkah}"`,
      `"${d.hotelMadinah}"`,
      `"${d.statusJamaah}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SISKOPATUH_MANIFEST_${pkgCode}_${pkgNameClean}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const INDO_MONTHS_UPPER = [
    "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
    "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
  ];

  const formatDateIndoUpper = (dateVal: string | Date | null | undefined): string => {
    if (!dateVal) return "-";
    if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
      const parts = dateVal.split("T")[0].split("-");
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parts[2].padStart(2, "0");
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${INDO_MONTHS_UPPER[monthIdx]} ${year}`;
      }
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, "0");
    const month = INDO_MONTHS_UPPER[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getManifestVisaTitle = () => {
    const selectedPkg = packages.find((p) => p.id === selectedPackageId);
    if (selectedPkg?.departureDate) {
      return `MANIFEST VISA ${formatDateIndoUpper(selectedPkg.departureDate)}`;
    }
    if (selectedPkg?.name) {
      return `MANIFEST VISA ${selectedPkg.name.toUpperCase()}`;
    }
    return "MANIFEST VISA SEMUA KEBERANGKATAN";
  };

  const getManifestVisaFileName = (ext: "xls" | "csv") => {
    const selectedPkg = packages.find((p) => p.id === selectedPackageId);
    const dateOrName = selectedPkg?.departureDate
      ? formatDateIndoUpper(selectedPkg.departureDate)
      : selectedPkg?.name
      ? selectedPkg.name.toUpperCase().replace(/[^A-Z0-9]/g, "_")
      : "SEMUA_KEBERANGKATAN";
    const paxCount = filteredPilgrims.length;
    return `(MANIFEST VISA ${dateOrName})(${paxCount} PAX).${ext}`;
  };

  const handleExportManifestVisaExcel = () => {
    if (filteredPilgrims.length === 0) {
      alert("Tidak ada data jamaah untuk diekspor ke Manifest Visa.");
      return;
    }

    const title = getManifestVisaTitle();
    const fileName = getManifestVisaFileName("xls");

    const tableRows = filteredPilgrims
      .map((p, idx) => {
        const sex = p.gender === "FEMALE" || p.gender === "F" ? "F" : "M";
        const fullName = (p.name || p.passportName || "-").toUpperCase();
        const pob = (p.placeOfBirth || "-").toUpperCase();
        const dob = formatDateIndoUpper(p.dateOfBirth);
        const passNo = (p.passportNumber || "-").toUpperCase();
        const doi = formatDateIndoUpper(p.passportIssuedDate);
        const doe = formatDateIndoUpper(p.passportExpiry);
        const office = (p.passportIssuedCity || "-").toUpperCase();

        return `<tr><td class="td-center">${idx + 1}</td><td class="td-center">${sex}</td><td class="td-left">${fullName}</td><td class="td-left">${pob}</td><td class="td-center">${dob}</td><td class="td-center">${passNo}</td><td class="td-center">${doi}</td><td class="td-center">${doe}</td><td class="td-center">${office}</td></tr>`;
      })
      .join("\n");

    const excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>MANIFEST VISA</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><style>body { font-family: Calibri, Arial, sans-serif; } table { border-collapse: collapse; width: 100%; } .banner { background-color: #FFFF00; font-weight: bold; font-size: 13pt; text-align: center; height: 38px; border: 1.5pt solid #000000; } .th-header { background-color: #FFFF00; font-weight: bold; font-size: 10pt; text-align: center; border: 1pt solid #000000; padding: 6px 8px; } .td-center { text-align: center; border: 0.5pt solid #000000; padding: 4px 6px; font-size: 10pt; mso-number-format: "\\@"; } .td-left { text-align: left; border: 0.5pt solid #000000; padding: 4px 6px; font-size: 10pt; mso-number-format: "\\@"; }</style></head><body><table><tr><td colspan="9" class="banner">${title}</td></tr><tr><th class="th-header" style="width: 45px;">NO</th><th class="th-header" style="width: 55px;">SEX</th><th class="th-header" style="width: 250px;">FULL NAME</th><th class="th-header" style="width: 160px;">PLACE OF BIRTH</th><th class="th-header" style="width: 150px;">DATE OF BIRTH</th><th class="th-header" style="width: 140px;">NOMOR PASSPORT</th><th class="th-header" style="width: 140px;">DATE OF ISSUE</th><th class="th-header" style="width: 140px;">DATE OF EXPIRY</th><th class="th-header" style="width: 160px;">ISSUING OFFICE</th></tr>${tableRows}</table></body></html>`;

    const blob = new Blob([excelHtml], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportManifestVisaCSV = () => {
    if (filteredPilgrims.length === 0) {
      alert("Tidak ada data jamaah untuk diekspor ke Manifest Visa.");
      return;
    }

    const title = getManifestVisaTitle();
    const fileName = getManifestVisaFileName("csv");

    const csvContent = [
      `"${title}"`,
      `"NO","SEX","FULL NAME","PLACE OF BIRTH","DATE OF BIRTH","NOMOR PASSPORT","DATE OF ISSUE","DATE OF EXPIRY","ISSUING OFFICE"`,
      ...filteredPilgrims.map((p, idx) => {
        const sex = p.gender === "FEMALE" || p.gender === "F" ? "F" : "M";
        const fullName = (p.name || p.passportName || "-").toUpperCase().replace(/"/g, '""');
        const pob = (p.placeOfBirth || "-").toUpperCase().replace(/"/g, '""');
        const dob = formatDateIndoUpper(p.dateOfBirth);
        const passNo = (p.passportNumber || "-").toUpperCase().replace(/"/g, '""');
        const doi = formatDateIndoUpper(p.passportIssuedDate);
        const doe = formatDateIndoUpper(p.passportExpiry);
        const office = (p.passportIssuedCity || "-").toUpperCase().replace(/"/g, '""');
        return `"${idx + 1}","${sex}","${fullName}","${pob}","${dob}","${passNo}","${doi}","${doe}","${office}"`;
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyManifestVisaToClipboard = () => {
    if (filteredPilgrims.length === 0) return;
    const title = getManifestVisaTitle();
    const headers = ["NO", "SEX", "FULL NAME", "PLACE OF BIRTH", "DATE OF BIRTH", "NOMOR PASSPORT", "DATE OF ISSUE", "DATE OF EXPIRY", "ISSUING OFFICE"].join("\t");
    const rows = filteredPilgrims
      .map((p, idx) => {
        const sex = p.gender === "FEMALE" || p.gender === "F" ? "F" : "M";
        const fullName = (p.name || p.passportName || "-").toUpperCase();
        const pob = (p.placeOfBirth || "-").toUpperCase();
        const dob = formatDateIndoUpper(p.dateOfBirth);
        const passNo = (p.passportNumber || "-").toUpperCase();
        const doi = formatDateIndoUpper(p.passportIssuedDate);
        const doe = formatDateIndoUpper(p.passportExpiry);
        const office = (p.passportIssuedCity || "-").toUpperCase();
        return [idx + 1, sex, fullName, pob, dob, passNo, doi, doe, office].join("\t");
      })
      .join("\n");

    const text = `${title}\n${headers}\n${rows}`;
    navigator.clipboard.writeText(text).then(() => {
      setManifestVisaCopied(true);
      setTimeout(() => setManifestVisaCopied(false), 2500);
    });
  };

  const currentSelectedPkg = packages.find((p) => p.id === selectedPackageId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-100 backdrop-blur-sm">
                <ShieldCheck className="w-3.5 h-3.5" /> Standar Kemenag RI & Provider Visa
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Regulasi SISKOPATUH, Manifest Visa & ID Card QR
            </h2>
            <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl">
              Ekspor manifest data jamaah sesuai format resmi SISKOPATUH Kemenag RI & format Manifest Visa 9-kolom standar provider.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Pilihan Program Paket Keberangkatan di Header */}
            <div className="bg-emerald-950/80 p-1 rounded-xl border border-emerald-400/30 flex items-center">
              <select
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="bg-transparent text-xs font-bold text-white px-2 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-white">
                  📂 Semua Program Paket ({pilgrims.length} Jamaah)
                </option>
                {packages.map((pkg) => {
                  const pkgPilgrimCount = pilgrims.filter((p) => p.packageId === pkg.id).length;
                  return (
                    <option key={pkg.id} value={pkg.id} className="bg-slate-900 text-white">
                      🛫 {pkg.name} ({pkgPilgrimCount} Jamaah)
                    </option>
                  );
                })}
              </select>
            </div>

            {activeSubTab === "SISKOPATUH" && (
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 px-4 py-2.5 text-xs font-black text-slate-950 shadow-sm transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Ekspor SISKOPATUH {currentSelectedPkg ? `(${currentSelectedPkg.code})` : "Semua"} (.CSV)
              </button>
            )}

            {activeSubTab === "MANIFEST_VISA" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportManifestVisaCSV}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 hover:bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4 text-slate-600" />
                  CSV
                </button>
                <button
                  onClick={handleExportManifestVisaExcel}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 px-4 py-2.5 text-xs font-black text-yellow-950 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Download Excel (.xls)
                </button>
              </div>
            )}

            {activeSubTab === "IDCARD" && (
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-900 shadow-sm transition-all hover:bg-emerald-50 hover:shadow cursor-pointer"
              >
                <Printer className="h-4 w-4 text-emerald-600" />
                Cetak Semua ID Card
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation SubTabs */}
      <div className="flex flex-wrap border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs no-print gap-1">
        <button
          onClick={() => setActiveSubTab("SISKOPATUH")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === "SISKOPATUH"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Manifest SISKOPATUH Kemenag RI
        </button>

        <button
          onClick={() => setActiveSubTab("MANIFEST_VISA")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === "MANIFEST_VISA"
              ? "bg-yellow-400 text-yellow-950 shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Plane className="w-4 h-4" />
          ✈️ Manifest Visa (Format Simple)
        </button>

        <button
          onClick={() => setActiveSubTab("IDCARD")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === "IDCARD"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <QrCode className="w-4 h-4" />
          ID Card & Gelang Jamaah QR Digital
        </button>
      </div>

      {/* Control & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs no-print">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, no paspor, atau NIK..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="ALL">Semua Paket Keberangkatan</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} ({formatDate(pkg.departureDate, "dd MMM yyyy")})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={loadSiskopatuh}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Segarkan
        </button>
      </div>

      {/* TAB 1: MANIFEST SISKOPATUH KEMENAG */}
      {activeSubTab === "SISKOPATUH" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Tabel Manifest Standar SISKOPATUH ({filteredData.length} Jamaah)
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              PPIU: PT BAROKAH SULTHAN HARAMAIN
            </span>
          </div>

          <div className="overflow-x-auto">
            {filteredData.length === 0 ? (
              <div className="p-12 text-center">
                <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">Belum Ada Data Jamaah Terdaftar</p>
                <p className="text-xs text-slate-400 mt-1">
                  Daftarkan calon jamaah pada menu Database Jamaah untuk mengompilasi manifest SISKOPATUH resmi.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-bold">
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">Nama Jamaah (Sesuai Paspor)</th>
                    <th className="py-3 px-3">NIK</th>
                    <th className="py-3 px-3">No. Paspor</th>
                    <th className="py-3 px-3">Ayah Kandung</th>
                    <th className="py-3 px-3">L/P</th>
                    <th className="py-3 px-3">Vaksin Meningitis</th>
                    <th className="py-3 px-3">Paket & Jadwal</th>
                    <th className="py-3 px-3">Kamar</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredData.map((row) => (
                    <tr key={row.noUrut} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-400">{row.noUrut}</td>
                      <td className="py-3 px-3 font-bold text-slate-950">
                        {row.namaLengkap}
                        <div className="text-[10px] text-slate-400 font-normal">
                          Lahir: {row.tempatLahir}, {row.tanggalLahir}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">{row.nik}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">{row.noPaspor}</td>
                      <td className="py-3 px-3 text-slate-600">{row.namaAyahKandung}</td>
                      <td className="py-3 px-3 font-bold">{row.jenisKelamin}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.statusVaksinMeningitis === "SUDAH"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {row.statusVaksinMeningitis === "SUDAH" ? "✓ Sudah" : "Belum"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{row.namaPaket}</div>
                        <div className="text-[10px] text-slate-500">Berangkat: {row.tanggalKeberangkatan}</div>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-700">{row.tipeKamar}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {row.statusJamaah}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MANIFEST VISA SIMPLE (FORMAT PROVIDER & KEDUTAAN) */}
      {activeSubTab === "MANIFEST_VISA" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Header Bar */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Manifest Visa Umroh Simple ({filteredPilgrims.length} Jamaah)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyManifestVisaToClipboard}
                disabled={filteredPilgrims.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer"
              >
                {manifestVisaCopied ? (
                  <>
                    <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-600" />
                    Salin Tabel (Excel)
                  </>
                )}
              </button>
              <button
                onClick={handleExportManifestVisaCSV}
                disabled={filteredPilgrims.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-slate-600" />
                CSV
              </button>
              <button
                onClick={handleExportManifestVisaExcel}
                disabled={filteredPilgrims.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-yellow-950 px-4 py-1.5 text-xs font-black shadow-xs transition-all disabled:opacity-50 cursor-pointer border border-yellow-500/40"
              >
                <Download className="h-3.5 w-3.5" />
                Excel (.xls)
              </button>
            </div>
          </div>

          {/* Yellow Banner & Table */}
          <div className="p-4 bg-slate-100/50">
            <div className="bg-white rounded-xl shadow-xs border border-slate-300 overflow-hidden">
              <div className="bg-[#FFFF00] text-black font-black text-center py-2.5 px-4 text-sm sm:text-base tracking-wide border-b-2 border-slate-900 select-all">
                {getManifestVisaTitle()}
              </div>

              {filteredPilgrims.length === 0 ? (
                <div className="p-12 text-center">
                  <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">Belum Ada Data Calon Jamaah</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Silakan pilih paket lain atau tambahkan data jamaah baru untuk menyusun Manifest Visa.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse text-left">
                    <thead>
                      <tr className="bg-[#FFFF00] text-black font-black border-b border-slate-900">
                        <th className="border border-slate-900/60 px-2 py-2 text-center w-12">NO</th>
                        <th className="border border-slate-900/60 px-2 py-2 text-center w-14">SEX</th>
                        <th className="border border-slate-900/60 px-3 py-2 text-left min-w-[200px]">FULL NAME</th>
                        <th className="border border-slate-900/60 px-3 py-2 text-left min-w-[140px]">PLACE OF BIRTH</th>
                        <th className="border border-slate-900/60 px-3 py-2 text-center min-w-[140px]">DATE OF BIRTH</th>
                        <th className="border border-slate-900/60 px-3 py-2 text-center min-w-[130px]">NOMOR PASSPORT</th>
                        <th className="border border-slate-900/60 px-3 py-2 text-center min-w-[130px]">DATE OF ISSUE</th>
                        <th className="border border-slate-900/60 px-3 py-2 text-center min-w-[130px]">DATE OF EXPIRY</th>
                        <th className="border border-slate-900/60 px-3 py-2 text-center min-w-[140px]">ISSUING OFFICE</th>
                      </tr>
                    </thead>
                    <tbody className="font-medium text-slate-900 divide-y divide-slate-200">
                      {filteredPilgrims.map((p, idx) => {
                        const sex = p.gender === "FEMALE" || p.gender === "F" ? "F" : "M";
                        const fullName = (p.name || p.passportName || "-").toUpperCase();
                        const pob = (p.placeOfBirth || "-").toUpperCase();
                        const dob = formatDateIndoUpper(p.dateOfBirth);
                        const passNo = (p.passportNumber || "-").toUpperCase();
                        const doi = formatDateIndoUpper(p.passportIssuedDate);
                        const doe = formatDateIndoUpper(p.passportExpiry);
                        const office = (p.passportIssuedCity || "-").toUpperCase();

                        return (
                          <tr key={p.id || idx} className="hover:bg-yellow-50/50 transition-colors">
                            <td className="border border-slate-300 px-2 py-1.5 text-center font-bold">{idx + 1}</td>
                            <td className="border border-slate-300 px-2 py-1.5 text-center font-bold">
                              <span className={sex === "M" ? "text-blue-700" : "text-pink-700"}>{sex}</span>
                            </td>
                            <td className="border border-slate-300 px-3 py-1.5 font-bold">{fullName}</td>
                            <td className="border border-slate-300 px-3 py-1.5">{pob}</td>
                            <td className="border border-slate-300 px-3 py-1.5 text-center">{dob}</td>
                            <td className="border border-slate-300 px-3 py-1.5 text-center font-mono font-bold">
                              {passNo !== "-" ? passNo : <span className="text-red-500 font-sans italic text-[11px]">Belum Diisi</span>}
                            </td>
                            <td className="border border-slate-300 px-3 py-1.5 text-center font-mono">
                              {doi !== "-" ? doi : <span className="text-slate-400 font-sans italic text-[11px]">-</span>}
                            </td>
                            <td className="border border-slate-300 px-3 py-1.5 text-center font-mono">
                              {doe !== "-" ? doe : <span className="text-slate-400 font-sans italic text-[11px]">-</span>}
                            </td>
                            <td className="border border-slate-300 px-3 py-1.5 text-center">
                              {office !== "-" ? office : <span className="text-slate-400 italic text-[11px]">-</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ID CARD & GELANG JAMAAH DIGITAL */}
      {activeSubTab === "IDCARD" && (
        <div>
          {filteredPilgrims.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
              <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Belum Ada Jamaah untuk Dibuatkan ID Card</p>
              <p className="text-xs text-slate-400 mt-1">
                Input data calon jamaah pada sistem untuk men-generate ID Card dan Gelang Ber-QR Code secara otomatis.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPilgrims.map((pilgrim) => {
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                  `PPIU: PT BAROKAH SULTHAN HARAMAIN | JAMAAH: ${pilgrim.name} | PASPOR: ${pilgrim.passportNumber || "-"} | PAKET: ${pilgrim.package?.name || "-"} | HOTEL MKH: ${pilgrim.package?.hotelMakkah || "-"} | HOTEL MDN: ${pilgrim.package?.hotelMadinah || "-"} | EMERGENCY: ${travelSettings.phone}`
                )}`;

                return (
                  <div
                    key={pilgrim.id}
                    className="bg-white rounded-3xl border border-slate-300 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
                  >
                    {/* Top Header Card */}
                    <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-4 text-center relative">
                      <div className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                        KARTU IDENTITAS RESMI JAMAAH UMROH
                      </div>
                      <div className="text-xs font-black mt-0.5 uppercase tracking-wide">
                        {travelSettings.companyName}
                      </div>
                      <div className="text-[9px] text-emerald-200 font-mono mt-0.5">
                        {travelSettings.licenseNumber}
                      </div>
                    </div>

                    {/* Middle Body */}
                    <div className="p-5 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-24 rounded-2xl bg-slate-100 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center p-1">
                          {pilgrim.avatar ? (
                            <img src={pilgrim.avatar} alt={pilgrim.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <User className="w-10 h-10 text-slate-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-slate-950 uppercase leading-tight truncate">
                            {pilgrim.name}
                          </h4>
                          <p className="text-[11px] font-mono font-bold text-emerald-700 mt-1">
                            No. Paspor: {pilgrim.passportNumber || "Dalam Proses"}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                            {pilgrim.package?.name || "Program Umroh Reguler"}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              Kamar: {pilgrim.roomType || "QUAD"}
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300">
                              {pilgrim.gender === "MALE" ? "Pria" : "Wanita"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Hotel & Contact Info */}
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-[10px] space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Hotel Makkah:</span>
                          <span className="font-bold text-slate-800 truncate max-w-[170px] text-right">
                            {pilgrim.package?.hotelMakkah || "Pullman Zamzam"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Hotel Madinah:</span>
                          <span className="font-bold text-slate-800 truncate max-w-[170px] text-right">
                            {pilgrim.package?.hotelMadinah || "Dallah Taibah"}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200 text-rose-700 font-bold">
                          <span>Emergency Call PPIU:</span>
                          <span>{travelSettings.phone || "0821-6733-9464"}</span>
                        </div>
                      </div>

                      {/* QR Code Verification Section */}
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-emerald-950">Scan QR Verifikasi</p>
                          <p className="text-[9px] text-emerald-800 leading-tight">
                            Memuat manifes resmi Kemenag & legalitas PPIU
                          </p>
                        </div>
                        <div className="w-14 h-14 bg-white rounded-xl p-1 border border-emerald-300 shadow-2xs shrink-0 flex items-center justify-center">
                          <img src={qrUrl} alt="QR Code Jamaah" className="w-full h-full object-contain" />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between no-print">
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        ID: {pilgrim.id.slice(0, 8).toUpperCase()}
                      </span>
                      <button
                        onClick={() => setSelectedPilgrimForIdCard(pilgrim)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" /> Pratinjau & Cetak
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Single ID Card Print Preview */}
      {selectedPilgrimForIdCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 no-print">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-4 h-4" /> Cetak ID Card Jamaah (8.5 x 5.5 cm)
              </span>
              <button
                onClick={() => setSelectedPilgrimForIdCard(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable ID Card (Front & Back Layout) */}
            <div className="border border-slate-300 rounded-2xl p-6 bg-white space-y-6">
              {/* Front Side */}
              <div className="w-[320px] h-[480px] mx-auto rounded-2xl border-2 border-slate-900 bg-white overflow-hidden shadow-lg flex flex-col justify-between text-slate-900">
                <div className="bg-emerald-800 text-white p-3 text-center">
                  <p className="text-[8px] font-black text-amber-300 uppercase tracking-widest">KARTU RESMI JAMAAH</p>
                  <h4 className="text-xs font-black uppercase mt-0.5">{travelSettings.companyName}</h4>
                  <p className="text-[8px] text-emerald-200 font-mono mt-0.5">{travelSettings.licenseNumber}</p>
                </div>

                <div className="p-4 text-center space-y-3">
                  <div className="w-24 h-28 mx-auto rounded-xl bg-slate-100 border border-slate-300 overflow-hidden flex items-center justify-center">
                    {selectedPilgrimForIdCard.avatar ? (
                      <img src={selectedPilgrimForIdCard.avatar} alt="Foto" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-950">
                      {selectedPilgrimForIdCard.name}
                    </h3>
                    <p className="text-xs font-mono font-bold text-emerald-800 mt-0.5">
                      {selectedPilgrimForIdCard.passportNumber || "PASPOR DALAM PROSES"}
                    </p>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-left space-y-1">
                    <p><strong>Paket:</strong> {selectedPilgrimForIdCard.package?.name || "-"}</p>
                    <p><strong>Makkah:</strong> {selectedPilgrimForIdCard.package?.hotelMakkah || "-"}</p>
                    <p><strong>Madinah:</strong> {selectedPilgrimForIdCard.package?.hotelMadinah || "-"}</p>
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-2.5 text-center text-[9px] font-bold">
                  EMERGENCY CALL: {travelSettings.phone || "0821-6733-9464"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 no-print">
              <button
                onClick={() => setSelectedPilgrimForIdCard(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
              >
                <Printer className="w-4 h-4" /> Cetak Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
