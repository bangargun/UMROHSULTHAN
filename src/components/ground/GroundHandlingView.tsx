"use client";

import React, { useState, useEffect } from "react";
import {
  Hotel,
  Bus,
  ClipboardCheck,
  Plus,
  Trash2,
  Printer,
  Download,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Building,
  UserCheck,
  Calendar,
  Clock,
  RefreshCw,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface GroundHandlingViewProps {
  packages: any[];
  pilgrims: any[];
}

export default function GroundHandlingView({ packages, pilgrims }: GroundHandlingViewProps) {
  const [activeTab, setActiveTab] = useState<"ROOMS" | "BUSES" | "ATTENDANCE">("ROOMS");
  const [selectedPackageId, setSelectedPackageId] = useState<string>(packages[0]?.id || "ALL");
  const [selectedCity, setSelectedCity] = useState<"MAKKAH" | "MADINAH">("MAKKAH");
  const [searchTerm, setSearchTerm] = useState("");
  const [rooms, setRooms] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isAddBusOpen, setIsAddBusOpen] = useState(false);
  const [isAddAttendanceOpen, setIsAddAttendanceOpen] = useState(false);

  // Forms
  const [roomForm, setRoomForm] = useState({
    packageId: packages[0]?.id || "",
    hotelCity: "MAKKAH",
    hotelName: "",
    roomNumber: "",
    roomType: "QUAD",
    floor: "",
    pilgrimIds: [] as string[],
    notes: "",
  });

  const [busForm, setBusForm] = useState({
    packageId: packages[0]?.id || "",
    busNumber: "",
    busName: "",
    capacity: "45",
    driverName: "",
    driverPhone: "",
    tourLeaderName: "",
    muthawwifName: "",
    pilgrimIds: [] as string[],
    notes: "",
  });

  const [attendanceForm, setAttendanceForm] = useState({
    packageId: packages[0]?.id || "",
    eventName: "Keberangkatan Bandara Soekarno Hatta",
    conductedBy: "",
    checkedPilgrimIds: [] as string[],
    notes: "",
  });

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [rRes, bRes, aRes] = await Promise.all([
        fetch(`/api/ground/rooms?packageId=${selectedPackageId}&hotelCity=${selectedCity}`),
        fetch(`/api/ground/buses?packageId=${selectedPackageId}`),
        fetch(`/api/ground/attendance?packageId=${selectedPackageId}`),
      ]);
      if (rRes.ok) setRooms(await rRes.json());
      if (bRes.ok) setBuses(await bRes.json());
      if (aRes.ok) setAttendances(await aRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [selectedPackageId, selectedCity]);

  // Pilgrims for selected package
  const packagePilgrims = pilgrims.filter(
    (p) => selectedPackageId === "ALL" || p.packageId === selectedPackageId
  );

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/ground/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomForm),
      });
      if (res.ok) {
        setIsAddRoomOpen(false);
        setRoomForm({
          packageId: packages[0]?.id || "",
          hotelCity: "MAKKAH",
          hotelName: "",
          roomNumber: "",
          roomType: "QUAD",
          floor: "",
          pilgrimIds: [],
          notes: "",
        });
        loadAllData();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan kamar.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm("Hapus alokasi kamar ini?")) return;
    await fetch(`/api/ground/rooms?id=${id}`, { method: "DELETE" });
    loadAllData();
  };

  const handleSaveBus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/ground/buses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(busForm),
      });
      if (res.ok) {
        setIsAddBusOpen(false);
        setBusForm({
          packageId: packages[0]?.id || "",
          busNumber: "",
          busName: "",
          capacity: "45",
          driverName: "",
          driverPhone: "",
          tourLeaderName: "",
          muthawwifName: "",
          pilgrimIds: [],
          notes: "",
        });
        loadAllData();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan bus.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBus = async (id: string) => {
    if (!confirm("Hapus alokasi bus ini?")) return;
    await fetch(`/api/ground/buses?id=${id}`, { method: "DELETE" });
    loadAllData();
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/ground/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceForm),
      });
      if (res.ok) {
        setIsAddAttendanceOpen(false);
        setAttendanceForm({
          packageId: packages[0]?.id || "",
          eventName: "Keberangkatan Bandara Soekarno Hatta",
          conductedBy: "",
          checkedPilgrimIds: [],
          notes: "",
        });
        loadAllData();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan absensi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAttendance = async (id: string) => {
    if (!confirm("Hapus rekor absensi ini?")) return;
    await fetch(`/api/ground/attendance?id=${id}`, { method: "DELETE" });
    loadAllData();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-100 backdrop-blur-sm">
                <Hotel className="w-3.5 h-3.5" /> Ground Handling & Operasional Saudi
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Manajemen Tanah Suci (Rooming, Bus & Absensi)
            </h2>
            <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl">
              Distribusi kamar hotel Makkah/Madinah, manifest seat bus ziarah, serta absensi digital lapangan untuk Tour Leader dan Muthawwif.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {activeTab === "ROOMS" && (
              <button
                onClick={() => {
                  setRoomForm((prev) => ({ ...prev, packageId: selectedPackageId !== "ALL" ? selectedPackageId : packages[0]?.id || "" }));
                  setIsAddRoomOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-950 shadow-sm hover:bg-emerald-50 transition-all"
              >
                <Plus className="h-4 w-4 text-emerald-600" /> + Tambah Alokasi Kamar
              </button>
            )}
            {activeTab === "BUSES" && (
              <button
                onClick={() => {
                  setBusForm((prev) => ({ ...prev, packageId: selectedPackageId !== "ALL" ? selectedPackageId : packages[0]?.id || "" }));
                  setIsAddBusOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-950 shadow-sm hover:bg-emerald-50 transition-all"
              >
                <Plus className="h-4 w-4 text-emerald-600" /> + Tambah Alokasi Bus
              </button>
            )}
            {activeTab === "ATTENDANCE" && (
              <button
                onClick={() => {
                  setAttendanceForm((prev) => ({
                    ...prev,
                    packageId: selectedPackageId !== "ALL" ? selectedPackageId : packages[0]?.id || "",
                    checkedPilgrimIds: packagePilgrims.map((p) => p.id),
                  }));
                  setIsAddAttendanceOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-950 shadow-sm hover:bg-emerald-50 transition-all"
              >
                <Plus className="h-4 w-4 text-emerald-600" /> + Rekam Absensi Lapangan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs & Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs no-print">
        <div className="flex border-b border-slate-200 sm:border-none gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("ROOMS")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "ROOMS" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Hotel className="w-4 h-4" /> Rooming List Hotel
          </button>
          <button
            onClick={() => setActiveTab("BUSES")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "BUSES" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Bus className="w-4 h-4" /> Manifest Bus & Kursi
          </button>
          <button
            onClick={() => setActiveTab("ATTENDANCE")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "ATTENDANCE" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ClipboardCheck className="w-4 h-4" /> Absensi Lapangan
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedPackageId}
            onChange={(e) => setSelectedPackageId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-auto"
          >
            <option value="ALL">Semua Paket Keberangkatan</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} ({formatDate(pkg.departureDate, "dd MMM yyyy")})
              </option>
            ))}
          </select>

          {activeTab === "ROOMS" && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setSelectedCity("MAKKAH")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  selectedCity === "MAKKAH" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-500"
                }`}
              >
                Makkah
              </button>
              <button
                onClick={() => setSelectedCity("MADINAH")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  selectedCity === "MADINAH" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-500"
                }`}
              >
                Madinah
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: ROOMING LIST HOTEL */}
      {activeTab === "ROOMS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between no-print">
            <span className="text-xs font-bold text-slate-500">
              Total {rooms.length} Kamar Terdaftar ({selectedCity})
            </span>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak Rooming List
            </button>
          </div>

          {rooms.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <Hotel className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Belum Ada Pembagian Kamar Hotel {selectedCity}</p>
              <p className="text-xs text-slate-400 mt-1">
                Klik tombol "+ Tambah Alokasi Kamar" untuk menentukan nomor kamar dan jamaah yang menempatinya.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => {
                let pIds: string[] = [];
                try {
                  pIds = JSON.parse(room.pilgrimIds || "[]");
                } catch (e) {
                  pIds = [];
                }
                const roomPilgrims = pilgrims.filter((p) => pIds.includes(p.id));

                return (
                  <div key={room.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {room.roomType} ({roomPilgrims.length} Orang)
                        </span>
                        <h4 className="text-lg font-black text-slate-900 mt-1">
                          Kamar #{room.roomNumber}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {room.hotelName || (room.hotelCity === "MAKKAH" ? "Hotel Makkah" : "Hotel Madinah")}
                          {room.floor && ` • ${room.floor}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Pilgrim List in this Room */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Daftar Jamaah:</p>
                      {roomPilgrims.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Belum ada jamaah yang dialokasikan.</p>
                      ) : (
                        roomPilgrims.map((p, idx) => (
                          <div key={p.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <span className="font-bold text-slate-800">{idx + 1}. {p.name}</span>
                            <span className="text-[10px] font-bold text-slate-500 font-mono">
                              {p.gender === "MALE" ? "L" : "P"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    {room.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-amber-50/60 p-2 rounded-xl border border-amber-200/60">
                        Catatan: {room.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANIFEST BUS & KURSI */}
      {activeTab === "BUSES" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between no-print">
            <span className="text-xs font-bold text-slate-500">
              Total {buses.length} Armada Bus Terdaftar
            </span>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak Manifest Bus
            </button>
          </div>

          {buses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <Bus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Belum Ada Alokasi Bus</p>
              <p className="text-xs text-slate-400 mt-1">
                Klik "+ Tambah Alokasi Bus" untuk mengelompokkan rombongan jamaah ke Bus 1, Bus 2, dst.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buses.map((bus) => {
                let pIds: string[] = [];
                try {
                  pIds = JSON.parse(bus.pilgrimIds || "[]");
                } catch (e) {
                  pIds = [];
                }
                const busPilgrims = pilgrims.filter((p) => pIds.includes(p.id));

                return (
                  <div key={bus.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-mono">
                          KAPASITAS: {busPilgrims.length} / {bus.capacity} SEAT
                        </span>
                        <h4 className="text-lg font-black text-slate-900 mt-1">
                          {bus.busNumber} {bus.busName ? `(${bus.busName})` : ""}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Muthawwif: <strong>{bus.muthawwifName || "-"}</strong> • TL: <strong>{bus.tourLeaderName || "-"}</strong>
                        </p>
                        {bus.driverName && (
                          <p className="text-[11px] text-slate-500">
                            Driver: {bus.driverName} ({bus.driverPhone || "-"})
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteBus(bus.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-60 overflow-y-auto">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Rombongan Jamaah Bus:</p>
                      {busPilgrims.map((p, idx) => (
                        <div key={p.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="font-bold text-slate-800">{idx + 1}. {p.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">{p.passportNumber || "-"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ABSENSI LAPANGAN */}
      {activeTab === "ATTENDANCE" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between no-print">
            <span className="text-xs font-bold text-slate-500">
              Total {attendances.length} Rekor Absensi
            </span>
          </div>

          {attendances.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Belum Ada Rekor Absensi Lapangan</p>
              <p className="text-xs text-slate-400 mt-1">
                Gunakan fitur ini untuk merekam kehadiran jamaah saat titik kumpul Bandara, Raudhah, Tawaf, atau City Tour.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendances.map((att) => {
                let pIds: string[] = [];
                try {
                  pIds = JSON.parse(att.checkedPilgrimIds || "[]");
                } catch (e) {
                  pIds = [];
                }

                return (
                  <div key={att.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-700 uppercase bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                          {att.eventName}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {formatDate(att.eventDate, "dd MMMM yyyy, HH:mm")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-semibold">
                        Petugas / Muthawwif: {att.conductedBy || "Pimpinan Rombongan"}
                      </p>
                      {att.notes && <p className="text-xs text-slate-500">Catatan: {att.notes}</p>}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-black text-slate-900">
                          {pIds.length} Jamaah Hadir
                        </div>
                        <div className="text-[11px] font-bold text-emerald-600">
                          ✓ Terverifikasi Lengkap
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAttendance(att.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Add Room */}
      {isAddRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Tambah Alokasi Kamar Hotel</h3>
              <button onClick={() => setIsAddRoomOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Paket</label>
                <select
                  value={roomForm.packageId}
                  onChange={(e) => setRoomForm({ ...roomForm, packageId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  required
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kota Hotel</label>
                  <select
                    value={roomForm.hotelCity}
                    onChange={(e) => setRoomForm({ ...roomForm, hotelCity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    <option value="MAKKAH">Makkah</option>
                    <option value="MADINAH">Madinah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Kamar</label>
                  <select
                    value={roomForm.roomType}
                    onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    <option value="QUAD">Quad (4 Pax)</option>
                    <option value="TRIPLE">Triple (3 Pax)</option>
                    <option value="DOUBLE">Double (2 Pax)</option>
                    <option value="SINGLE">Single (1 Pax)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Kamar</label>
                  <input
                    type="text"
                    placeholder="Contoh: 1204"
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lantai (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Lantai 12"
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Jamaah</label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5">
                  {packagePilgrims.map((pilgrim) => {
                    const isChecked = roomForm.pilgrimIds.includes(pilgrim.id);
                    return (
                      <label key={pilgrim.id} className="flex items-center gap-2 text-xs cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRoomForm({ ...roomForm, pilgrimIds: [...roomForm.pilgrimIds, pilgrim.id] });
                            } else {
                              setRoomForm({ ...roomForm, pilgrimIds: roomForm.pilgrimIds.filter((id) => id !== pilgrim.id) });
                            }
                          }}
                          className="rounded border-slate-300 text-emerald-600"
                        />
                        <span className="font-bold text-slate-800">{pilgrim.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({pilgrim.gender === "MALE" ? "Pria" : "Wanita"})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddRoomOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Simpan Kamar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Bus */}
      {isAddBusOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Tambah Alokasi Bus</h3>
              <button onClick={() => setIsAddBusOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBus} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Paket</label>
                <select
                  value={busForm.packageId}
                  onChange={(e) => setBusForm({ ...busForm, packageId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  required
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Bus</label>
                  <input
                    type="text"
                    placeholder="Contoh: BUS-01"
                    value={busForm.busNumber}
                    onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kapasitas Kursi</label>
                  <input
                    type="number"
                    value={busForm.capacity}
                    onChange={(e) => setBusForm({ ...busForm, capacity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Muthawwif</label>
                  <input
                    type="text"
                    placeholder="Ustadz Pembimbing"
                    value={busForm.muthawwifName}
                    onChange={(e) => setBusForm({ ...busForm, muthawwifName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tour Leader (TL)</label>
                  <input
                    type="text"
                    placeholder="Nama TL"
                    value={busForm.tourLeaderName}
                    onChange={(e) => setBusForm({ ...busForm, tourLeaderName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Jamaah Bus</label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5">
                  {packagePilgrims.map((pilgrim) => {
                    const isChecked = busForm.pilgrimIds.includes(pilgrim.id);
                    return (
                      <label key={pilgrim.id} className="flex items-center gap-2 text-xs cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBusForm({ ...busForm, pilgrimIds: [...busForm.pilgrimIds, pilgrim.id] });
                            } else {
                              setBusForm({ ...busForm, pilgrimIds: busForm.pilgrimIds.filter((id) => id !== pilgrim.id) });
                            }
                          }}
                          className="rounded border-slate-300 text-emerald-600"
                        />
                        <span className="font-bold text-slate-800">{pilgrim.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBusOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Simpan Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Attendance */}
      {isAddAttendanceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Rekam Absensi Lapangan</h3>
              <button onClick={() => setIsAddAttendanceOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Agenda / Titik Kumpul</label>
                <input
                  type="text"
                  placeholder="Contoh: Keberangkatan CGK / Ziarah Raudhah"
                  value={attendanceForm.eventName}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, eventName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Petugas / Pimpinan</label>
                <input
                  type="text"
                  placeholder="Nama Tour Leader / Muthawwif"
                  value={attendanceForm.conductedBy}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, conductedBy: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Daftar Jamaah Hadir ({attendanceForm.checkedPilgrimIds.length} / {packagePilgrims.length})
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5">
                  {packagePilgrims.map((pilgrim) => {
                    const isChecked = attendanceForm.checkedPilgrimIds.includes(pilgrim.id);
                    return (
                      <label key={pilgrim.id} className="flex items-center gap-2 text-xs cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAttendanceForm({ ...attendanceForm, checkedPilgrimIds: [...attendanceForm.checkedPilgrimIds, pilgrim.id] });
                            } else {
                              setAttendanceForm({ ...attendanceForm, checkedPilgrimIds: attendanceForm.checkedPilgrimIds.filter((id) => id !== pilgrim.id) });
                            }
                          }}
                          className="rounded border-slate-300 text-emerald-600"
                        />
                        <span className="font-bold text-slate-800">{pilgrim.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddAttendanceOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Simpan Absensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
