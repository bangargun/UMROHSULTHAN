"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Printer,
  Download,
  Edit3,
  Plus,
  Trash2,
  Save,
  X,
  Share2,
  Plane,
  Building,
  Bus,
  UserCheck,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  RefreshCw,
  Users,
} from "lucide-react";
import * as XLSX from "xlsx";
import { formatDate } from "@/lib/utils";

interface PackageInfoViewProps {
  packages: any[];
  pilgrims: any[];
  initialPackageId?: string;
  onRefreshAll?: () => void;
}

interface FlightLeg {
  from: string;
  to: string;
  date: string;
  etd: string;
  eta: string;
  carrier: string;
  flightNo: string;
  remarks: string;
}

interface HotelRoom {
  city: string;
  hotel: string;
  checkIn: string;
  checkOut: string;
  dbl: number;
  trpl: number;
  quad: number;
  quint: number;
  resNo: string;
}

interface BusRoute {
  date: string;
  from: string;
  to: string;
  time: string;
  busType: string;
  company: string;
}

export default function PackageInfoView({
  packages,
  pilgrims,
  initialPackageId,
  onRefreshAll,
}: PackageInfoViewProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    initialPackageId || packages[0]?.id || ""
  );
  const [packageInfo, setPackageInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [travelSettings, setTravelSettings] = useState<any>({
    companyName: "PT BAROKAH SULTHAN HARAMAIN",
  });

  // Edit Form State
  const [formData, setFormData] = useState({
    groupCode: "",
    subAgentName: "",
    adultPax: 0,
    childPax: 0,
    tourLeaderName: "",
    tourLeaderPhone: "",
    muthawwifName: "",
    muthawwifPhone: "",
    handlingSaudi: "",
    handlingPhone: "",
    flights: [] as FlightLeg[],
    hotels: [] as HotelRoom[],
    buses: [] as BusRoute[],
  });

  // Load Travel Settings
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.companyName) setTravelSettings(data);
      })
      .catch((e) => console.error(e));
  }, []);

  // Sync selectedPackageId with packages prop when loaded
  useEffect(() => {
    if (!selectedPackageId && packages && packages.length > 0) {
      setSelectedPackageId(initialPackageId || packages[0].id);
    }
  }, [packages, initialPackageId, selectedPackageId]);

  // Fetch Package Info when selected package changes
  const loadPackageInfo = async (pkgId: string) => {
    if (!pkgId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/package-info?packageId=${pkgId}`);
      if (res.ok) {
        const data = await res.json();
        setPackageInfo(data);

        // Parse JSON strings for form state
        let flights: FlightLeg[] = [];
        let hotels: HotelRoom[] = [];
        let buses: BusRoute[] = [];

        try {
          flights = data.flightInfoJson
            ? typeof data.flightInfoJson === "string"
              ? JSON.parse(data.flightInfoJson)
              : data.flightInfoJson
            : [];
        } catch (e) {
          flights = [];
        }

        try {
          hotels = data.hotelInfoJson
            ? typeof data.hotelInfoJson === "string"
              ? JSON.parse(data.hotelInfoJson)
              : data.hotelInfoJson
            : [];
        } catch (e) {
          hotels = [];
        }

        try {
          buses = data.busScheduleJson
            ? typeof data.busScheduleJson === "string"
              ? JSON.parse(data.busScheduleJson)
              : data.busScheduleJson
            : [];
        } catch (e) {
          buses = [];
        }

        setFormData({
          groupCode: data.groupCode || data.package?.code || "",
          subAgentName: data.subAgentName || "",
          adultPax: data.adultPax !== undefined && data.adultPax !== null ? data.adultPax : (data.package?.pilgrims?.length || 0),
          childPax: data.childPax || 0,
          tourLeaderName: data.tourLeaderName || "",
          tourLeaderPhone: data.tourLeaderPhone || "",
          muthawwifName: data.muthawwifName || "",
          muthawwifPhone: data.muthawwifPhone || "",
          handlingSaudi: data.handlingSaudi || "",
          handlingPhone: data.handlingPhone || "",
          flights,
          hotels,
          buses,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPackageId) {
      loadPackageInfo(selectedPackageId);
    }
  }, [selectedPackageId]);

  // Open edit modal with refreshed form data
  const handleOpenEditModal = () => {
    const curPkg = packages.find((p) => p.id === selectedPackageId) || packageInfo?.package;
    const totalP = curPkg?.pilgrims?.length || 0;

    let flights: FlightLeg[] = [];
    let hotels: HotelRoom[] = [];
    let buses: BusRoute[] = [];

    try {
      flights = packageInfo?.flightInfoJson
        ? typeof packageInfo.flightInfoJson === "string"
          ? JSON.parse(packageInfo.flightInfoJson)
          : packageInfo.flightInfoJson
        : formData.flights;
    } catch (e) {
      flights = formData.flights;
    }

    try {
      hotels = packageInfo?.hotelInfoJson
        ? typeof packageInfo.hotelInfoJson === "string"
          ? JSON.parse(packageInfo.hotelInfoJson)
          : packageInfo.hotelInfoJson
        : formData.hotels;
    } catch (e) {
      hotels = formData.hotels;
    }

    try {
      buses = packageInfo?.busScheduleJson
        ? typeof packageInfo.busScheduleJson === "string"
          ? JSON.parse(packageInfo.busScheduleJson)
          : packageInfo.busScheduleJson
        : formData.buses;
    } catch (e) {
      buses = formData.buses;
    }

    setFormData({
      groupCode: packageInfo?.groupCode || curPkg?.code || "",
      subAgentName: packageInfo?.subAgentName || travelSettings.companyName || "",
      adultPax: packageInfo?.adultPax !== undefined && packageInfo?.adultPax !== null ? packageInfo.adultPax : totalP,
      childPax: packageInfo?.childPax || 0,
      tourLeaderName: packageInfo?.tourLeaderName || "",
      tourLeaderPhone: packageInfo?.tourLeaderPhone || "",
      muthawwifName: packageInfo?.muthawwifName || "",
      muthawwifPhone: packageInfo?.muthawwifPhone || "",
      handlingSaudi: packageInfo?.handlingSaudi || "",
      handlingPhone: packageInfo?.handlingPhone || "",
      flights: flights && flights.length > 0 ? flights : [],
      hotels: hotels && hotels.length > 0 ? hotels : [],
      buses: buses && buses.length > 0 ? buses : [],
    });
    setIsEditModalOpen(true);
  };

  // Selected package object
  const currentPackage =
    packages.find((p) => p.id === selectedPackageId) || packageInfo?.package;

  // Parsed current data for live view
  const activeFlights: FlightLeg[] = packageInfo?.flightInfoJson
    ? typeof packageInfo.flightInfoJson === "string"
      ? JSON.parse(packageInfo.flightInfoJson)
      : packageInfo.flightInfoJson
    : formData.flights;

  const activeHotels: HotelRoom[] = packageInfo?.hotelInfoJson
    ? typeof packageInfo.hotelInfoJson === "string"
      ? JSON.parse(packageInfo.hotelInfoJson)
      : packageInfo.hotelInfoJson
    : formData.hotels;

  const activeBuses: BusRoute[] = packageInfo?.busScheduleJson
    ? typeof packageInfo.busScheduleJson === "string"
      ? JSON.parse(packageInfo.busScheduleJson)
      : packageInfo.busScheduleJson
    : formData.buses;

  const totalPax =
    (packageInfo?.adultPax !== undefined && packageInfo?.adultPax !== null ? packageInfo.adultPax : formData.adultPax || 0) +
    (packageInfo?.childPax || formData.childPax || 0);

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetPkgId = selectedPackageId || packages[0]?.id;
    if (!targetPkgId) {
      alert("Pilih Paket Umroh terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        packageId: targetPkgId,
        groupCode: formData.groupCode,
        subAgentName: formData.subAgentName,
        adultPax: Number(formData.adultPax) || 0,
        childPax: Number(formData.childPax) || 0,
        tourLeaderName: formData.tourLeaderName,
        tourLeaderPhone: formData.tourLeaderPhone,
        muthawwifName: formData.muthawwifName,
        muthawwifPhone: formData.muthawwifPhone,
        handlingSaudi: formData.handlingSaudi,
        handlingPhone: formData.handlingPhone,
        flightInfoJson: JSON.stringify(formData.flights || []),
        hotelInfoJson: JSON.stringify(formData.hotels || []),
        busScheduleJson: JSON.stringify(formData.buses || []),
      };

      const res = await fetch("/api/package-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        await loadPackageInfo(targetPkgId);
        if (onRefreshAll) onRefreshAll();
        alert("✅ Data Package Info & Manifest Operasional berhasil disimpan!");
      } else {
        const err = await res.json();
        alert(`❌ Gagal menyimpan: ${err.error || "Terjadi kesalahan pada server"}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`❌ Error: ${e.message || "Gagal menghubungi server"}`);
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      const departureDateStr = currentPackage?.departureDate
        ? formatDate(currentPackage.departureDate, "dd MMM yyyy")
        : "TBA";
      const subAgentLabel = packageInfo?.subAgentName || "SULTHAN_HARAMAIN";
      const fileName = `PACKAGE INFO_${subAgentLabel.replace(/\s+/g, "_")}_${departureDateStr.replace(/\s+/g, "_")}_${totalPax}PAX.xlsx`;

      const wb = XLSX.utils.book_new();

      // Flatten structure into worksheet rows
      const rows: any[][] = [
        ["PACKAGE INFO"],
        [],
        [
          "GROUP CODE",
          "SUB AGENT NAME",
          "NO. OF PAX",
          "",
          "TOUR LEADER",
          "MOBILE",
        ],
        [
          "",
          "",
          "ADULT",
          "CHILD",
          "",
          "",
        ],
        [
          packageInfo?.groupCode || currentPackage?.code || "",
          packageInfo?.subAgentName || travelSettings.companyName,
          packageInfo?.adultPax || 0,
          packageInfo?.childPax || 0,
          packageInfo?.tourLeaderName || "",
          packageInfo?.tourLeaderPhone || "",
        ],
        [],
        ["FLIGHT INFORMATION"],
        ["FROM", "TO", "DATE", "ETD", "ETA", "CARRIER", "FLIGHT NO", "REMARKS"],
      ];

      activeFlights.forEach((f) => {
        rows.push([
          f.from,
          f.to,
          f.date,
          f.etd,
          f.eta,
          f.carrier,
          f.flightNo,
          f.remarks,
        ]);
      });

      rows.push([]);
      rows.push(["HOTEL ACCOMODATION"]);
      rows.push([
        "CITY",
        "HOTEL",
        "DATE",
        "",
        "TYPE ROOM",
        "",
        "",
        "",
        "RES NO",
      ]);
      rows.push([
        "",
        "",
        "IN",
        "OUT",
        "DBL",
        "TRPL",
        "QUAD",
        "QUINT",
        "",
      ]);

      activeHotels.forEach((h) => {
        rows.push([
          h.city,
          h.hotel,
          h.checkIn,
          h.checkOut,
          h.dbl || "",
          h.trpl || "",
          h.quad || "",
          h.quint || "",
          h.resNo || "",
        ]);
      });

      rows.push([]);
      rows.push(["TRANSPORTATION & BUS SCHEDULE"]);
      rows.push(["DATE", "FROM", "TO", "TIME", "BUS TYPE", "COMPANY"]);

      activeBuses.forEach((b) => {
        rows.push([
          b.date,
          b.from,
          b.to,
          b.time,
          b.busType,
          b.company,
        ]);
      });

      rows.push([]);
      rows.push(["LOCAL CONTACT PERSON"]);
      rows.push([
        "NAME",
        `MUTHOWWIF : ${packageInfo?.muthawwifName || "-"}`,
        "",
        "MOBILE :",
        packageInfo?.muthawwifPhone || "-",
      ]);
      rows.push([
        "HANDLING SAUDI :",
        packageInfo?.handlingSaudi || "-",
        "",
        "MOBILE :",
        packageInfo?.handlingPhone || "-",
      ]);

      const ws = XLSX.utils.aoa_to_sheet(rows);

      // Set column widths
      ws["!cols"] = [
        { wch: 15 },
        { wch: 28 },
        { wch: 16 },
        { wch: 16 },
        { wch: 22 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "PACKAGE INFO");
      XLSX.writeFile(wb, fileName);
    } catch (e) {
      console.error(e);
      alert("Gagal mengunduh file Excel");
    }
  };

  // WhatsApp share message
  const handleShareWhatsApp = () => {
    const text = `*INFORMASI PAKET & MANIFEST OPERASIONAL (PACKAGE INFO)*\n` +
      `------------------------------------------\n` +
      `*Paket:* ${currentPackage?.name || "Program Umroh"}\n` +
      `*Kode Grup:* ${packageInfo?.groupCode || currentPackage?.code || "-"}\n` +
      `*Sub Agent / Mitra:* ${packageInfo?.subAgentName || travelSettings.companyName}\n` +
      `*Total Jamaah:* ${totalPax} Pax (Dewasa: ${packageInfo?.adultPax || 0}, Anak: ${packageInfo?.childPax || 0})\n` +
      `*Tour Leader:* ${packageInfo?.tourLeaderName || "-"} (${packageInfo?.tourLeaderPhone || "-"})\n` +
      `*Muthawwif:* ${packageInfo?.muthawwifName || "-"} (${packageInfo?.muthawwifPhone || "-"})\n\n` +
      `*JADWAL PENERBANGAN:*\n` +
      activeFlights.map((f, i) => `${i + 1}. ${f.from} -> ${f.to} | ${f.date} | ETD ${f.etd} - ETA ${f.eta} | ${f.carrier} (${f.flightNo})`).join("\n") +
      `\n\n*HOTEL:* \n` +
      activeHotels.map((h, i) => `${i + 1}. [${h.city}] ${h.hotel} (${h.checkIn} s/d ${h.checkOut})`).join("\n") +
      `\n\n*HOTLINE HANDLING SAUDI:* ${packageInfo?.handlingSaudi || "-"} (${packageInfo?.handlingPhone || "-"})\n\n` +
      `_Diterbitkan resmi oleh ${travelSettings.companyName}_`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar (no-print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Package Info & Handover Sheet
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manifest operasional penerbangan, akomodasi hotel, jadwal bus, dan kontak Saudi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Select Package */}
          <div className="relative">
            <select
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className="h-10 pl-3.5 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} ({formatDate(pkg.departureDate, "dd MMM yyyy")})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenEditModal}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Edit3 className="w-4 h-4" /> Edit Data Info
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Download file Excel .xlsx asli"
          >
            <Download className="w-4 h-4" /> Excel (.xlsx)
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Cetak dokumen resmi / Simpan PDF"
          >
            <Printer className="w-4 h-4" /> Cetak (PDF)
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-bold transition-all cursor-pointer"
            title="Bagikan ringkasan via WhatsApp"
          >
            <Share2 className="w-4 h-4" /> WA Share
          </button>
        </div>
      </div>

      {/* Printable Sheet View: Authentic Excel Document Layout */}
      <div className="bg-white rounded-3xl border border-slate-300 shadow-xl p-6 sm:p-10 text-slate-900 printable-modal-content print-sheet relative overflow-x-auto space-y-4">
        {/* Document Header Table Banner */}
        <div className="w-full bg-[#4a86e8] text-white text-center py-2.5 rounded-t-lg shadow-xs">
          <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">
            PACKAGE INFO
          </h2>
        </div>

        {/* Section 1: Top Grid Info (Group Code, Sub Agent, Pax, TL, Mobile) */}
        <div className="overflow-x-auto border-2 border-slate-400 rounded-sm">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr className="bg-[#4a86e8] text-white font-bold border-b border-slate-400">
                <th className="py-2 px-3 border-r border-slate-400 uppercase w-1/5">GROUP CODE</th>
                <th className="py-2 px-3 border-r border-slate-400 uppercase w-1/4">SUB AGENT NAME</th>
                <th colSpan={2} className="py-1 px-3 border-r border-slate-400 uppercase w-1/5">
                  NO. OF PAX
                  <div className="flex border-t border-slate-300 mt-1 pt-0.5 text-[10px]">
                    <span className="w-1/2 border-r border-slate-300">ADULT</span>
                    <span className="w-1/2">CHILD</span>
                  </div>
                </th>
                <th className="py-2 px-3 border-r border-slate-400 uppercase w-1/6">TOUR LEADER</th>
                <th className="py-2 px-3 uppercase w-1/6">MOBILE</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-bold text-slate-900 bg-white hover:bg-blue-50/30">
                <td className="py-3 px-3 border-r border-slate-400 font-mono">
                  {packageInfo?.groupCode || currentPackage?.code || "-"}
                </td>
                <td className="py-3 px-3 border-r border-slate-400 uppercase">
                  {packageInfo?.subAgentName || travelSettings.companyName || "-"}
                </td>
                <td className="py-3 px-2 border-r border-slate-400 w-1/10 font-mono text-sm">
                  {packageInfo?.adultPax || formData.adultPax || 0}
                </td>
                <td className="py-3 px-2 border-r border-slate-400 w-1/10 font-mono text-sm">
                  {packageInfo?.childPax || formData.childPax || 0}
                </td>
                <td className="py-3 px-3 border-r border-slate-400 uppercase">
                  {packageInfo?.tourLeaderName || "-"}
                </td>
                <td className="py-3 px-3 font-mono">
                  {packageInfo?.tourLeaderPhone || "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: FLIGHT INFORMATION */}
        <div className="overflow-x-auto border-2 border-slate-400 rounded-sm">
          <div className="bg-[#4a86e8] text-white text-center py-1.5 font-bold tracking-wider text-xs border-b border-slate-400 uppercase">
            FLIGHT INFORMATION
          </div>
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-black border-b border-slate-400 text-[11px]">
                <th className="py-2 px-3 border-r border-slate-400 uppercase">FROM</th>
                <th className="py-2 px-3 border-r border-slate-400 uppercase">TO</th>
                <th className="py-2 px-3 border-r border-slate-400 uppercase">DATE</th>
                <th className="py-2 px-3 border-r border-slate-400 uppercase">ETD</th>
                <th className="py-2 px-3 border-r border-slate-400 uppercase">ETA</th>
                <th className="py-2 px-3 border-r border-slate-400 uppercase">CARRIER</th>
                <th className="py-2 px-3 border-r border-slate-400 uppercase">FLIGHT NO</th>
                <th className="py-2 px-3 uppercase">REMARKS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {activeFlights.length > 0 ? (
                activeFlights.map((flight, idx) => (
                  <tr key={idx} className="font-bold text-slate-800 hover:bg-blue-50/20">
                    <td className="py-2 px-3 border-r border-slate-400 font-mono">{flight.from || "-"}</td>
                    <td className="py-2 px-3 border-r border-slate-400 font-mono">{flight.to || "-"}</td>
                    <td className="py-2 px-3 border-r border-slate-400 font-mono">{flight.date || "-"}</td>
                    <td className="py-2 px-3 border-r border-slate-400 font-mono text-emerald-800">{flight.etd || "-"}</td>
                    <td className="py-2 px-3 border-r border-slate-400 font-mono text-blue-800">{flight.eta || "-"}</td>
                    <td className="py-2 px-3 border-r border-slate-400 uppercase">{flight.carrier || "-"}</td>
                    <td className="py-2 px-3 border-r border-slate-400 font-mono">{flight.flightNo || "-"}</td>
                    <td className="py-2 px-3 text-slate-600">{flight.remarks || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-4 text-slate-400 italic">
                    Belum ada data penerbangan. Klik tombol "Edit Data Info" untuk menambah rute.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 3: HOTEL ACCOMODATION */}
        <div className="overflow-x-auto border-2 border-slate-400 rounded-sm">
          <div className="bg-[#4a86e8] text-white text-center py-1.5 font-bold tracking-wider text-xs border-b border-slate-400 uppercase">
            HOTEL ACCOMODATION
          </div>
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-black border-b border-slate-400 text-[11px]">
                <th rowSpan={2} className="py-2 px-3 border-r border-slate-400 uppercase w-1/6">CITY</th>
                <th rowSpan={2} className="py-2 px-3 border-r border-slate-400 uppercase w-1/4">HOTEL</th>
                <th colSpan={2} className="py-1 px-3 border-r border-slate-400 uppercase">DATE</th>
                <th colSpan={4} className="py-1 px-3 border-r border-slate-400 uppercase">TYPE ROOM</th>
                <th rowSpan={2} className="py-2 px-3 uppercase w-1/6">RES NO</th>
              </tr>
              <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-400 text-[10px]">
                <th className="py-1 px-2 border-r border-slate-400">IN</th>
                <th className="py-1 px-2 border-r border-slate-400">OUT</th>
                <th className="py-1 px-2 border-r border-slate-400">DBL</th>
                <th className="py-1 px-2 border-r border-slate-400">TRPL</th>
                <th className="py-1 px-2 border-r border-slate-400">QUAD</th>
                <th className="py-1 px-2 border-r border-slate-400">QUINT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {activeHotels.length > 0 ? (
                activeHotels.map((h, idx) => (
                  <tr key={idx} className="font-bold text-slate-800 hover:bg-blue-50/20">
                    <td className="py-2.5 px-3 border-r border-slate-400 font-black text-slate-950 uppercase">{h.city || "-"}</td>
                    <td className="py-2.5 px-3 border-r border-slate-400 uppercase text-slate-900">{h.hotel || "-"}</td>
                    <td className="py-2.5 px-2 border-r border-slate-400 font-mono">{h.checkIn || "-"}</td>
                    <td className="py-2.5 px-2 border-r border-slate-400 font-mono">{h.checkOut || "-"}</td>
                    <td className="py-2.5 px-2 border-r border-slate-400 font-mono">{h.dbl || "-"}</td>
                    <td className="py-2.5 px-2 border-r border-slate-400 font-mono">{h.trpl || "-"}</td>
                    <td className="py-2.5 px-2 border-r border-slate-400 font-mono font-black text-blue-900">{h.quad || "-"}</td>
                    <td className="py-2.5 px-2 border-r border-slate-400 font-mono">{h.quint || "-"}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{h.resNo || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-4 text-slate-400 italic">
                    Belum ada data akomodasi hotel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 4: TRANSPORTATION & BUS SCHEDULE */}
        <div className="overflow-x-auto border-2 border-slate-400 rounded-sm">
          <div className="bg-[#4a86e8] text-white text-center py-1.5 font-bold tracking-wider text-xs border-b border-slate-400 uppercase">
            TRANSPORTATION & BUS SCHEDULE
          </div>
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-black border-b border-slate-400 text-[11px]">
                <th className="py-2 px-3 border-r border-slate-400 uppercase w-1/8">DATE</th>
                <th className="py-2 px-3 border-r border-slate-400 uppercase w-1/4">FROM</th>
                <th className="py-2 px-3 border-r border-slate-400 uppercase w-1/4">TO</th>
                <th className="py-2 px-3 border-r border-slate-400 uppercase w-1/10">TIME</th>
                <th className="py-2 px-3 border-r border-slate-400 uppercase w-1/6">BUS TYPE</th>
                <th className="py-2 px-3 uppercase w-1/6">COMPANY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {activeBuses.length > 0 ? (
                activeBuses.map((b, idx) => (
                  <tr key={idx} className="font-bold text-slate-800 hover:bg-blue-50/20">
                    <td className="py-2 px-3 border-r border-slate-400 font-mono">{b.date || "-"}</td>
                    <td className="py-2 px-3 border-r border-slate-400 uppercase text-slate-900">{b.from || "-"}</td>
                    <td className="py-2 px-3 border-r border-slate-400 uppercase text-blue-900">{b.to || "-"}</td>
                    <td className="py-2 px-3 border-r border-slate-400 font-mono text-emerald-800">{b.time || "-"}</td>
                    <td className="py-2 px-3 border-r border-slate-400 uppercase">{b.busType || "-"}</td>
                    <td className="py-2 px-3 uppercase font-semibold text-slate-700">{b.company || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-slate-400 italic">
                    Belum ada data jadwal bus.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 5: LOCAL CONTACT PERSON */}
        <div className="overflow-x-auto border-2 border-slate-400 rounded-sm">
          <div className="bg-[#4a86e8] text-white text-center py-1.5 font-bold tracking-wider text-xs border-b border-slate-400 uppercase">
            LOCAL CONTACT PERSON
          </div>
          <table className="w-full text-xs border-collapse">
            <tbody className="divide-y divide-slate-300 font-bold text-slate-900">
              <tr className="bg-white">
                <td className="py-2.5 px-4 w-1/2 border-r border-slate-400">
                  <span className="text-slate-500 uppercase mr-2">NAME :</span>
                  <span className="text-blue-950 font-black">MUTHOWWIF : {packageInfo?.muthawwifName || "-"}</span>
                </td>
                <td className="py-2.5 px-4 w-1/2">
                  <span className="text-slate-500 uppercase mr-2">MOBILE :</span>
                  <span className="font-mono text-emerald-800">{packageInfo?.muthawwifPhone || "-"}</span>
                </td>
              </tr>
              <tr className="bg-slate-50">
                <td className="py-2.5 px-4 w-1/2 border-r border-slate-400">
                  <span className="text-slate-500 uppercase mr-2">HANDLING SAUDI :</span>
                  <span className="text-slate-900">{packageInfo?.handlingSaudi || "-"}</span>
                </td>
                <td className="py-2.5 px-4 w-1/2">
                  <span className="text-slate-500 uppercase mr-2">MOBILE :</span>
                  <span className="font-mono text-slate-800">{packageInfo?.handlingPhone || "-"}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit & Atur Package Info */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit & Konfigurasi Package Info
                  </h3>
                  <p className="text-xs text-slate-500">
                    Paket: {currentPackage?.name || "Program Umroh"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6 text-xs">
              {/* 1. Group & Sub Agent */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Users className="w-4 h-4 text-blue-600" />
                  Informasi Rombongan & Sub-Agent
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Group Code</label>
                    <input
                      type="text"
                      value={formData.groupCode}
                      onChange={(e) => setFormData({ ...formData, groupCode: e.target.value })}
                      placeholder="e.g. GRP-20260908-01"
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Sub Agent Name</label>
                    <input
                      type="text"
                      value={formData.subAgentName}
                      onChange={(e) => setFormData({ ...formData, subAgentName: e.target.value })}
                      placeholder="e.g. PT. HAJAR ASWAD WISATA"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 uppercase"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Pax Dewasa</label>
                      <input
                        type="number"
                        value={formData.adultPax}
                        onChange={(e) => setFormData({ ...formData, adultPax: parseInt(e.target.value, 10) || 0 })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Pax Anak</label>
                      <input
                        type="number"
                        value={formData.childPax}
                        onChange={(e) => setFormData({ ...formData, childPax: parseInt(e.target.value, 10) || 0 })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Nama Tour Leader (TL)</label>
                    <input
                      type="text"
                      value={formData.tourLeaderName}
                      onChange={(e) => setFormData({ ...formData, tourLeaderName: e.target.value })}
                      placeholder="e.g. WAHIDAH RANGKUTI"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">No. Kontak / HP TL</label>
                    <input
                      type="text"
                      value={formData.tourLeaderPhone}
                      onChange={(e) => setFormData({ ...formData, tourLeaderPhone: e.target.value })}
                      placeholder="e.g. 085276550914"
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Flight Information */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <Plane className="w-4 h-4 text-blue-600" />
                    Jadwal Penerbangan (Flight Information)
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        flights: [
                          ...formData.flights,
                          {
                            from: "KNO",
                            to: "JED",
                            date: "",
                            etd: "14:45",
                            eta: "20:00",
                            carrier: "Saudia Airlines",
                            flightNo: "SV-827",
                            remarks: "Direct",
                          },
                        ],
                      });
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Tambah Rute Flight
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.flights.map((flight, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-8 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 items-center">
                      <div>
                        <input
                          type="text"
                          value={flight.from}
                          onChange={(e) => {
                            const newFlights = [...formData.flights];
                            newFlights[idx].from = e.target.value;
                            setFormData({ ...formData, flights: newFlights });
                          }}
                          placeholder="FROM (e.g. KNO)"
                          className="w-full p-2 rounded-lg border border-slate-200 font-mono text-xs uppercase"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={flight.to}
                          onChange={(e) => {
                            const newFlights = [...formData.flights];
                            newFlights[idx].to = e.target.value;
                            setFormData({ ...formData, flights: newFlights });
                          }}
                          placeholder="TO (e.g. JED)"
                          className="w-full p-2 rounded-lg border border-slate-200 font-mono text-xs uppercase"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={flight.date}
                          onChange={(e) => {
                            const newFlights = [...formData.flights];
                            newFlights[idx].date = e.target.value;
                            setFormData({ ...formData, flights: newFlights });
                          }}
                          placeholder="Tanggal (8-Sep)"
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={flight.etd}
                          onChange={(e) => {
                            const newFlights = [...formData.flights];
                            newFlights[idx].etd = e.target.value;
                            setFormData({ ...formData, flights: newFlights });
                          }}
                          placeholder="ETD (14.45)"
                          className="w-full p-2 rounded-lg border border-slate-200 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={flight.eta}
                          onChange={(e) => {
                            const newFlights = [...formData.flights];
                            newFlights[idx].eta = e.target.value;
                            setFormData({ ...formData, flights: newFlights });
                          }}
                          placeholder="ETA (20.00)"
                          className="w-full p-2 rounded-lg border border-slate-200 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={flight.carrier}
                          onChange={(e) => {
                            const newFlights = [...formData.flights];
                            newFlights[idx].carrier = e.target.value;
                            setFormData({ ...formData, flights: newFlights });
                          }}
                          placeholder="Carrier"
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={flight.flightNo}
                          onChange={(e) => {
                            const newFlights = [...formData.flights];
                            newFlights[idx].flightNo = e.target.value;
                            setFormData({ ...formData, flights: newFlights });
                          }}
                          placeholder="Flight No"
                          className="w-full p-2 rounded-lg border border-slate-200 font-mono text-xs uppercase"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={flight.remarks}
                          onChange={(e) => {
                            const newFlights = [...formData.flights];
                            newFlights[idx].remarks = e.target.value;
                            setFormData({ ...formData, flights: newFlights });
                          }}
                          placeholder="Remarks"
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFlights = formData.flights.filter((_, i) => i !== idx);
                            setFormData({ ...formData, flights: newFlights });
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Hotel Accomodation */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <Building className="w-4 h-4 text-blue-600" />
                    Akomodasi Hotel & Alokasi Kamar
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        hotels: [
                          ...formData.hotels,
                          {
                            city: "MADINAH",
                            hotel: "",
                            checkIn: "",
                            checkOut: "",
                            dbl: 0,
                            trpl: 0,
                            quad: 0,
                            quint: 0,
                            resNo: "",
                          },
                        ],
                      });
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Tambah Hotel
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.hotels.map((h, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-0.5">KOTA</label>
                          <select
                            value={h.city}
                            onChange={(e) => {
                              const newHotels = [...formData.hotels];
                              newHotels[idx].city = e.target.value;
                              setFormData({ ...formData, hotels: newHotels });
                            }}
                            className="w-full p-2 rounded-lg border border-slate-200 font-bold text-xs"
                          >
                            <option value="MADINAH">MADINAH</option>
                            <option value="MAKKAH">MAKKAH</option>
                            <option value="JEDDAH">JEDDAH</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-0.5">NAMA HOTEL</label>
                          <input
                            type="text"
                            value={h.hotel}
                            onChange={(e) => {
                              const newHotels = [...formData.hotels];
                              newHotels[idx].hotel = e.target.value;
                              setFormData({ ...formData, hotels: newHotels });
                            }}
                            placeholder="e.g. ROYAL MADINAH"
                            className="w-full p-2 rounded-lg border border-slate-200 text-xs uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-0.5">CHECK IN</label>
                          <input
                            type="text"
                            value={h.checkIn}
                            onChange={(e) => {
                              const newHotels = [...formData.hotels];
                              newHotels[idx].checkIn = e.target.value;
                              setFormData({ ...formData, hotels: newHotels });
                            }}
                            placeholder="8-Sep-2026"
                            className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono"
                          />
                        </div>
                        <div className="flex items-end gap-1">
                          <div className="flex-1">
                            <label className="block text-[10px] text-slate-500 font-bold mb-0.5">CHECK OUT</label>
                            <input
                              type="text"
                              value={h.checkOut}
                              onChange={(e) => {
                                const newHotels = [...formData.hotels];
                                newHotels[idx].checkOut = e.target.value;
                                setFormData({ ...formData, hotels: newHotels });
                              }}
                              placeholder="14-Sep-2026"
                              className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newHotels = formData.hotels.filter((_, i) => i !== idx);
                              setFormData({ ...formData, hotels: newHotels });
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-slate-100">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-0.5">DBL (Kamar Ber-2)</label>
                          <input
                            type="number"
                            value={h.dbl}
                            onChange={(e) => {
                              const newHotels = [...formData.hotels];
                              newHotels[idx].dbl = parseInt(e.target.value, 10) || 0;
                              setFormData({ ...formData, hotels: newHotels });
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-200 font-mono text-xs text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-0.5">TRPL (Kamar Ber-3)</label>
                          <input
                            type="number"
                            value={h.trpl}
                            onChange={(e) => {
                              const newHotels = [...formData.hotels];
                              newHotels[idx].trpl = parseInt(e.target.value, 10) || 0;
                              setFormData({ ...formData, hotels: newHotels });
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-200 font-mono text-xs text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-0.5">QUAD (Kamar Ber-4)</label>
                          <input
                            type="number"
                            value={h.quad}
                            onChange={(e) => {
                              const newHotels = [...formData.hotels];
                              newHotels[idx].quad = parseInt(e.target.value, 10) || 0;
                              setFormData({ ...formData, hotels: newHotels });
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-200 font-mono text-xs text-center font-bold text-blue-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-0.5">QUINT (Kamar Ber-5)</label>
                          <input
                            type="number"
                            value={h.quint}
                            onChange={(e) => {
                              const newHotels = [...formData.hotels];
                              newHotels[idx].quint = parseInt(e.target.value, 10) || 0;
                              setFormData({ ...formData, hotels: newHotels });
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-200 font-mono text-xs text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-0.5">RES NO (Booking)</label>
                          <input
                            type="text"
                            value={h.resNo}
                            onChange={(e) => {
                              const newHotels = [...formData.hotels];
                              newHotels[idx].resNo = e.target.value;
                              setFormData({ ...formData, hotels: newHotels });
                            }}
                            placeholder="e.g. RES-99812"
                            className="w-full p-1.5 rounded-lg border border-slate-200 font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Bus Schedule */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <Bus className="w-4 h-4 text-blue-600" />
                    Jadwal Rute Bus & City Tour
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        buses: [
                          ...formData.buses,
                          {
                            date: "",
                            from: "HOTEL",
                            to: "CITY TOUR",
                            time: "07:00",
                            busType: "VIP Bus 45 Seat",
                            company: "SAPTCO",
                          },
                        ],
                      });
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Tambah Rute Bus
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.buses.map((b, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-6 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 items-center">
                      <div>
                        <input
                          type="text"
                          value={b.date}
                          onChange={(e) => {
                            const newBuses = [...formData.buses];
                            newBuses[idx].date = e.target.value;
                            setFormData({ ...formData, buses: newBuses });
                          }}
                          placeholder="Tanggal (e.g. 8-Sep)"
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={b.from}
                          onChange={(e) => {
                            const newBuses = [...formData.buses];
                            newBuses[idx].from = e.target.value;
                            setFormData({ ...formData, buses: newBuses });
                          }}
                          placeholder="FROM (e.g. JED AIRPORT)"
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs uppercase"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={b.to}
                          onChange={(e) => {
                            const newBuses = [...formData.buses];
                            newBuses[idx].to = e.target.value;
                            setFormData({ ...formData, buses: newBuses });
                          }}
                          placeholder="TO (e.g. HOTEL MADINAH)"
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs uppercase"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={b.time}
                          onChange={(e) => {
                            const newBuses = [...formData.buses];
                            newBuses[idx].time = e.target.value;
                            setFormData({ ...formData, buses: newBuses });
                          }}
                          placeholder="Jam (20:00)"
                          className="w-full p-2 rounded-lg border border-slate-200 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={b.busType}
                          onChange={(e) => {
                            const newBuses = [...formData.buses];
                            newBuses[idx].busType = e.target.value;
                            setFormData({ ...formData, buses: newBuses });
                          }}
                          placeholder="Bus Type (VIP Bus)"
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={b.company}
                          onChange={(e) => {
                            const newBuses = [...formData.buses];
                            newBuses[idx].company = e.target.value;
                            setFormData({ ...formData, buses: newBuses });
                          }}
                          placeholder="Company (SAPTCO)"
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs uppercase"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newBuses = formData.buses.filter((_, i) => i !== idx);
                            setFormData({ ...formData, buses: newBuses });
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Local Contact Person */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Local Contact Person (Muthawwif & Handling Saudi)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Nama Muthawwif</label>
                    <input
                      type="text"
                      value={formData.muthawwifName}
                      onChange={(e) => setFormData({ ...formData, muthawwifName: e.target.value })}
                      placeholder="e.g. Ustadz Agim Asyari"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">No. Kontak / HP Muthawwif</label>
                    <input
                      type="text"
                      value={formData.muthawwifPhone}
                      onChange={(e) => setFormData({ ...formData, muthawwifPhone: e.target.value })}
                      placeholder="e.g. 0812 6102 9910"
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Nama Muassasah / Syarikah Handling Saudi</label>
                    <input
                      type="text"
                      value={formData.handlingSaudi}
                      onChange={(e) => setFormData({ ...formData, handlingSaudi: e.target.value })}
                      placeholder="e.g. Syarikah Al-Rawahel Transport Saudi"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">No. Kontak Handling Saudi</label>
                    <input
                      type="text"
                      value={formData.handlingPhone}
                      onChange={(e) => setFormData({ ...formData, handlingPhone: e.target.value })}
                      placeholder="e.g. +966 50 123 4567"
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Menyimpan..." : "Simpan Package Info"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
