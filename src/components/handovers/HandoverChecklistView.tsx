"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  Printer,
  X,
  Sparkles,
  UserCheck,
  Boxes,
  Eraser,
  MessageSquare,
  Send,
  User,
  Share2,
  CheckSquare,
  Square,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Eye,
  Trash2,
  RotateCcw,
  FileSignature,
  BadgeCheck,
  Phone,
  Calendar,
  Building2,
  Check,
  BookOpen,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Pagination from "@/components/common/Pagination";
import {
  MEN_PACKING_LIST,
  WOMEN_PACKING_LIST,
  getPackingListByGender,
  generatePackingWhatsAppText,
} from "@/lib/packing-list";

interface HandoverChecklistViewProps {
  handovers: any[];
  pilgrims: any[];
  equipment: any[];
  packages?: any[];
  onRefresh: () => void;
  initialSearchTerm?: string;
}

export default function HandoverChecklistView({
  handovers,
  pilgrims,
  equipment,
  packages = [],
  onRefresh,
  initialSearchTerm = "",
}: HandoverChecklistViewProps) {
  const [activeTab, setActiveTab] = useState<"HANDOVER_BAST" | "DOCUMENT_PASSPORT" | "PACKING_GUIDE">("HANDOVER_BAST");
  const [packingGender, setPackingGender] = useState<"MALE" | "FEMALE">("FEMALE");
  const [isPrintPackingModalOpen, setIsPrintPackingModalOpen] = useState(false);
  const [isSendWaModalOpen, setIsSendWaModalOpen] = useState(false);
  const [waSelectedPilgrimId, setWaSelectedPilgrimId] = useState<string>(pilgrims[0]?.id || "");
  const [waCustomPhone, setWaCustomPhone] = useState("");
  const [waCustomName, setWaCustomName] = useState("");
  const [waCustomGender, setWaCustomGender] = useState<"MALE" | "FEMALE">("FEMALE");

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedPackageId, setSelectedPackageId] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalPackageFilter, setModalPackageFilter] = useState("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedHandoverForPrint, setSelectedHandoverForPrint] = useState<any | null>(null);

  // Form states
  const [selectedPilgrimId, setSelectedPilgrimId] = useState(pilgrims[0]?.id || "");
  const [officerName, setOfficerName] = useState("Tim Admin");
  const [recipientName, setRecipientName] = useState("");
  const [notes, setNotes] = useState("Perlengkapan diserahkan lengkap dalam kondisi baru dan baik.");
  const [checklistItems, setChecklistItems] = useState<{ [eqId: string]: boolean }>({});

  // Canvas signature state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [loading, setLoading] = useState(false);

  // Document / Passport Handover states
  const [documentHandovers, setDocumentHandovers] = useState<any[]>([]);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [docSearchTerm, setDocSearchTerm] = useState("");
  const [docPackageFilter, setDocPackageFilter] = useState("ALL");
  const [docStatusFilter, setDocStatusFilter] = useState("ALL");
  const [docCurrentPage, setDocCurrentPage] = useState(1);
  const [docPageSize, setDocPageSize] = useState(10);

  // Modals for Document Handover
  const [isDocAddModalOpen, setIsDocAddModalOpen] = useState(false);
  const [selectedDocForPrint, setSelectedDocForPrint] = useState<any | null>(null);
  const [selectedDocForReturn, setSelectedDocForReturn] = useState<any | null>(null);
  const [isDocWaModalOpen, setIsDocWaModalOpen] = useState(false);
  const [docWaPayload, setDocWaPayload] = useState<any | null>(null);

  // Return modal form state
  const [returnOfficerName, setReturnOfficerName] = useState("Tim Operasional");
  const [returnNotes, setReturnNotes] = useState("Paspor diserahkan kembali kepada jamaah di bandara menjelang keberangkatan.");
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Form states for creating Document Handover
  const [docPilgrimId, setDocPilgrimId] = useState(pilgrims[0]?.id || "");
  const [docOfficerName, setDocOfficerName] = useState("Tim Operasional");
  const [docSubmitterName, setDocSubmitterName] = useState("");
  const [docSubmitterPhone, setDocSubmitterPhone] = useState("");
  const [docSubmitterRelation, setDocSubmitterRelation] = useState("YANG_BERSANGKUTAN");
  const [docHandoverDate, setDocHandoverDate] = useState(() => new Date().toISOString().split("T")[0]);

  const [docHasOriginalPassport, setDocHasOriginalPassport] = useState(true);
  const [docPassportNumber, setDocPassportNumber] = useState("");
  const [docPassportExpiry, setDocPassportExpiry] = useState("");
  const [docPassportPhysicalState, setDocPassportPhysicalState] = useState("BAIK_LENGKAP");

  const [docHasYellowVaccineBook, setDocHasYellowVaccineBook] = useState(false);
  const [docVaccineNotes, setDocVaccineNotes] = useState("");

  const [docHasPassportPhotos, setDocHasPassportPhotos] = useState(false);
  const [docPhotoCount, setDocPhotoCount] = useState(5);

  const [docHasFamilyCardCopy, setDocHasFamilyCardCopy] = useState(false);
  const [docHasIdCardCopy, setDocHasIdCardCopy] = useState(false);
  const [docHasMarriageBook, setDocHasMarriageBook] = useState(false);
  const [docHasBirthCertificate, setDocHasBirthCertificate] = useState(false);

  const [docAdditional, setDocAdditional] = useState("");
  const [docNotes, setDocNotes] = useState("Dokumen fisik asli diserahkan dalam keadaan baik dan lengkap untuk pengurusan visa umroh.");

  // Canvas signature state for Document Handover
  const docCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [docIsDrawing, setDocIsDrawing] = useState(false);
  const [docHasSignature, setDocHasSignature] = useState(false);

  const fetchDocumentHandovers = async () => {
    try {
      setLoadingDoc(true);
      const res = await fetch("/api/document-handovers");
      if (res.ok) {
        const data = await res.json();
        setDocumentHandovers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching document handovers:", err);
    } finally {
      setLoadingDoc(false);
    }
  };

  useEffect(() => {
    fetchDocumentHandovers();
  }, []);

  useEffect(() => {
    if (docPilgrimId) {
      const p = pilgrims.find((item) => item.id === docPilgrimId);
      if (p) {
        setDocSubmitterName(p.name || "");
        setDocSubmitterPhone(p.phone || "");
        setDocPassportNumber(p.passportNumber || "");
        if (p.passportExpiry) {
          try {
            setDocPassportExpiry(new Date(p.passportExpiry).toISOString().split("T")[0]);
          } catch (e) {
            setDocPassportExpiry("");
          }
        } else {
          setDocPassportExpiry("");
        }
      }
    }
  }, [docPilgrimId, pilgrims]);

  const startDocDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = docCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDocIsDrawing(true);
    setDocHasSignature(true);
  };

  const drawDoc = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!docIsDrawing) return;
    const canvas = docCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDocDrawing = () => {
    setDocIsDrawing(false);
  };

  const clearDocCanvas = () => {
    const canvas = docCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDocHasSignature(false);
  };

  const getDocumentItemsList = (doc: any) => {
    const list: string[] = [];
    if (doc.hasOriginalPassport) {
      list.push(`Paspor Asli RI (No: ${doc.passportNumber || "-"}) - ${doc.passportPhysicalState === "BAIK_LENGKAP" ? "Kondisi Baik/Lengkap" : "Ada Catatan Khusus"}`);
    }
    if (doc.hasYellowVaccineBook) {
      list.push(`Buku Kuning / ICV Vaksin Meningitis ${doc.vaccineNotes ? `(${doc.vaccineNotes})` : ""}`);
    }
    if (doc.hasPassportPhotos) {
      list.push(`Pasfoto 4x6 Latar Belakang Putih (${doc.photoCount || 5} Lembar)`);
    }
    if (doc.hasFamilyCardCopy) list.push("Fotokopi Kartu Keluarga (KK)");
    if (doc.hasIdCardCopy) list.push("Fotokopi KTP");
    if (doc.hasMarriageBook) list.push("Buku Nikah Asli / Legalisir");
    if (doc.hasBirthCertificate) list.push("Akta Kelahiran Asli");
    if (doc.additionalDocuments) list.push(`Dokumen Tambahan: ${doc.additionalDocuments}`);
    return list;
  };

  const handleSubmitDocHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docPilgrimId || !docOfficerName || !docSubmitterName) {
      alert("Mohon lengkapi Calon Jamaah, Nama Petugas Penerima, dan Nama Penyerah Dokumen.");
      return;
    }

    setLoading(true);
    let submitterSignatureUrl = "";
    if (docCanvasRef.current && docHasSignature) {
      submitterSignatureUrl = docCanvasRef.current.toDataURL("image/png");
    }

    try {
      const res = await fetch("/api/document-handovers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pilgrimId: docPilgrimId,
          handoverType: "RECEIVE_FROM_PILGRIM",
          handoverDate: docHandoverDate,
          officerName: docOfficerName,
          submitterName: docSubmitterName,
          submitterPhone: docSubmitterPhone,
          submitterRelation: docSubmitterRelation,
          hasOriginalPassport: docHasOriginalPassport,
          passportNumber: docPassportNumber,
          passportExpiry: docPassportExpiry ? new Date(docPassportExpiry).toISOString() : null,
          passportPhysicalState: docPassportPhysicalState,
          hasYellowVaccineBook: docHasYellowVaccineBook,
          vaccineNotes: docVaccineNotes,
          hasPassportPhotos: docHasPassportPhotos,
          photoCount: docHasPassportPhotos ? docPhotoCount : 0,
          hasFamilyCardCopy: docHasFamilyCardCopy,
          hasIdCardCopy: docHasIdCardCopy,
          hasMarriageBook: docHasMarriageBook,
          hasBirthCertificate: docHasBirthCertificate,
          additionalDocuments: docAdditional,
          notes: docNotes,
          submitterSignatureUrl,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setIsDocAddModalOpen(false);
        clearDocCanvas();
        await fetchDocumentHandovers();
        onRefresh();
        setSelectedDocForPrint(created);
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan serah terima paspor.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi saat menyimpan.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReturnPassport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForReturn) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/document-handovers/${selectedDocForReturn.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RETURNED_TO_PILGRIM",
          returnDate: returnDate,
          returnOfficerName: returnOfficerName,
          returnNotes: returnNotes,
        }),
      });
      if (res.ok) {
        setSelectedDocForReturn(null);
        await fetchDocumentHandovers();
        alert("Status paspor berhasil diperbarui: Telah dikembalikan ke jamaah.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocHandover = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data tanda terima paspor ini?")) return;
    try {
      const res = await fetch(`/api/document-handovers/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchDocumentHandovers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Initialize checklist items when equipment loads
  React.useEffect(() => {
    const initial: { [eqId: string]: boolean } = {};
    equipment.forEach((eq) => {
      initial[eq.id] = true; // default all checked
    });
    setChecklistItems(initial);
  }, [equipment]);

  const [travelSettings, setTravelSettings] = useState<any>({
    companyName: "PT SULTHAN HARAMAIN TOUR & TRAVEL",
    licenseNumber: "PPIU Kemenag RI No. U.412 Tahun 2022",
    address: "Sulthan Haramain Tower, Jl. Prof. Dr. Satrio No. 88, Jakarta Selatan",
    phone: "0811-9876-5432",
    email: "salam@sulthanharamain.com",
    directorName: "H. Sulthan Syarif, Lc., M.A.",
    directorTitle: "Direktur Utama",
  });

  React.useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setTravelSettings(data);
      })
      .catch((err) => console.error(err));
  }, []);

  // Update recipient name when pilgrim changes
  React.useEffect(() => {
    const p = pilgrims.find((item) => item.id === selectedPilgrimId);
    if (p) {
      setRecipientName(p.name);
    }
  }, [selectedPilgrimId, pilgrims]);

  const filteredHandovers = handovers.filter((h) => {
    const matchSearch =
      h.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.officerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.pilgrim?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.pilgrim?.package?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPkg = selectedPackageId === "ALL" || h.pilgrim?.packageId === selectedPackageId;
    return matchSearch && matchPkg;
  });

  // Reset page when search or package filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedPackageId]);

  // Paginated handovers
  const paginatedHandovers = filteredHandovers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const modalPilgrims = pilgrims.filter(
    (p) => modalPackageFilter === "ALL" || p.packageId === modalPackageFilter
  );

  const filteredDocHandovers = documentHandovers.filter((d) => {
    const matchSearch =
      (d.receiptNumber || "").toLowerCase().includes(docSearchTerm.toLowerCase()) ||
      (d.pilgrim?.name || "").toLowerCase().includes(docSearchTerm.toLowerCase()) ||
      (d.passportNumber || "").toLowerCase().includes(docSearchTerm.toLowerCase()) ||
      (d.submitterName || "").toLowerCase().includes(docSearchTerm.toLowerCase()) ||
      (d.officerName || "").toLowerCase().includes(docSearchTerm.toLowerCase());
    const matchPkg = docPackageFilter === "ALL" || d.pilgrim?.packageId === docPackageFilter;
    const matchStatus = docStatusFilter === "ALL" || d.status === docStatusFilter;
    return matchSearch && matchPkg && matchStatus;
  });

  const paginatedDocHandovers = filteredDocHandovers.slice(
    (docCurrentPage - 1) * docPageSize,
    docCurrentPage * docPageSize
  );

  const totalDocStored = documentHandovers.filter((d) => d.status === "STORED_SAFELY").length;
  const totalDocInVisa = documentHandovers.filter((d) => d.status === "IN_VISA_PROCESS").length;
  const totalDocReturned = documentHandovers.filter((d) => d.status === "RETURNED_TO_PILGRIM").length;

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = "#064e3b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleToggleCheck = (eqId: string) => {
    setChecklistItems((prev) => ({
      ...prev,
      [eqId]: !prev[eqId],
    }));
  };

  const handleSubmitHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let signatureUrl = "";
    if (canvasRef.current && hasSignature) {
      signatureUrl = canvasRef.current.toDataURL("image/png");
    }

    const itemsPayload = equipment.map((eq) => ({
      equipmentId: eq.id,
      quantity: 1,
      isGiven: !!checklistItems[eq.id],
      notes: checklistItems[eq.id] ? "Diserahkan" : "Belum diambil",
    }));

    try {
      const res = await fetch("/api/handovers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pilgrimId: selectedPilgrimId,
          officerName,
          recipientName: recipientName || "Jamaah",
          signatureUrl,
          notes,
          items: itemsPayload,
        }),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        clearCanvas();
        alert("Ceklis serah terima perlengkapan berhasil disimpan!");
        onRefresh();
      } else {
        alert("Gagal menyimpan serah terima.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentPackingItems = packingGender === "MALE" ? MEN_PACKING_LIST : WOMEN_PACKING_LIST;

  const handleOpenSendWa = (pilgrim?: any) => {
    if (pilgrim) {
      setWaSelectedPilgrimId(pilgrim.id);
      setWaCustomName(pilgrim.name);
      setWaCustomPhone(pilgrim.phone);
      setWaCustomGender(pilgrim.gender === "FEMALE" ? "FEMALE" : "MALE");
    } else {
      const p = pilgrims[0];
      setWaSelectedPilgrimId(p?.id || "");
      setWaCustomName(p?.name || "");
      setWaCustomPhone(p?.phone || "");
      setWaCustomGender(p?.gender === "FEMALE" ? "FEMALE" : "MALE");
    }
    setIsSendWaModalOpen(true);
  };

  const handleSendWaSubmit = () => {
    let targetPhone = waCustomPhone;
    let targetName = waCustomName;
    let targetGender = waCustomGender;
    let targetPkgName = "";
    let targetDepDate = "";

    const selectedP = pilgrims.find((p) => p.id === waSelectedPilgrimId);
    if (selectedP && waSelectedPilgrimId) {
      targetPhone = selectedP.phone;
      targetName = selectedP.name;
      targetGender = selectedP.gender === "FEMALE" ? "FEMALE" : "MALE";
      targetPkgName = selectedP.package?.name || "";
      targetDepDate = selectedP.package?.departureDate ? formatDate(selectedP.package.departureDate, "dd MMMM yyyy") : "";
    }

    if (!targetPhone) {
      alert("Nomor WhatsApp belum diisi!");
      return;
    }

    let cleanPhone = targetPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
    else if (!cleanPhone.startsWith("62")) cleanPhone = "62" + cleanPhone;

    const msg = generatePackingWhatsAppText({
      pilgrimName: targetName,
      gender: targetGender,
      packageName: targetPkgName,
      departureDate: targetDepDate,
      companyName: travelSettings.companyName,
      phone: travelSettings.phone,
    });

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    setIsSendWaModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-emerald-600" />
            Manajemen Logistik & Panduan Perlengkapan Jamaah
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Berita Acara Serah Terima (BAST), Tanda Tangan Digital, dan Panduan Checklist Packing Bawaan Jamaah (Laki-laki / Perempuan).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "HANDOVER_BAST" && (
            <button
              onClick={() => {
                setIsAddModalOpen(true);
                setTimeout(() => clearCanvas(), 200);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              + Buat Ceklis BAST Baru
            </button>
          )}

          {activeTab === "DOCUMENT_PASSPORT" && (
            <button
              onClick={() => {
                setIsDocAddModalOpen(true);
                setTimeout(() => clearDocCanvas(), 200);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              + Buat Tanda Terima Paspor
            </button>
          )}

          {activeTab === "PACKING_GUIDE" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrintPackingModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4 text-amber-400" />
                Cetak Lembar Panduan A4
              </button>
              <button
                onClick={() => handleOpenSendWa()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                Kirim WA ke Jamaah
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 no-print">
        <button
          onClick={() => setActiveTab("HANDOVER_BAST")}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "HANDOVER_BAST"
              ? "bg-white text-emerald-950 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ClipboardList className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>1. BAST Perlengkapan (Travel ➔ Jamaah)</span>
        </button>

        <button
          onClick={() => setActiveTab("DOCUMENT_PASSPORT")}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "DOCUMENT_PASSPORT"
              ? "bg-white text-blue-950 shadow-sm border border-blue-100"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
          <span>2. Tanda Terima Paspor (Jamaah ➔ Travel)</span>
          {documentHandovers.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800">
              {documentHandovers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("PACKING_GUIDE")}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "PACKING_GUIDE"
              ? "bg-white text-amber-950 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Boxes className="w-4 h-4 text-amber-600 shrink-0" />
          <span>3. Panduan Packing Jamaah</span>
        </button>
      </div>

      {/* TAB 1: BAST LIST & SEARCH */}
      {activeTab === "HANDOVER_BAST" && (
        <div className="space-y-6">
          {/* Search & Package Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs no-print flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama penerima, jamaah, paket, atau petugas logistik..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                <option value="ALL">📂 Semua Paket Keberangkatan ({handovers.length} BAST)</option>
                {packages.map((pkg) => {
                  const count = handovers.filter((h) => h.pilgrim?.packageId === pkg.id).length;
                  return (
                    <option key={pkg.id} value={pkg.id}>
                      🛫 {pkg.name} ({count} BAST)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

      {/* Handover List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tanggal Penyerahan</th>
                <th className="py-3 px-4">Nama Jamaah & Paket</th>
                <th className="py-3 px-4">Nama Penerima & Petugas</th>
                <th className="py-3 px-4">Rincian Item Diserahkan</th>
                <th className="py-3 px-4">Status & TTD</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredHandovers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Belum ada riwayat serah terima perlengkapan
                  </td>
                </tr>
              ) : (
                paginatedHandovers.map((h) => {
                  const givenCount = h.items?.filter((i: any) => i.isGiven).length || 0;
                  const totalItems = h.items?.length || 0;

                  return (
                    <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{formatDate(h.handoverDate, "dd/MM/yyyy")}</p>
                        <p className="text-[10px] text-slate-400">Pukul {formatDate(h.handoverDate, "HH:mm")}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{h.pilgrim?.name}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{h.pilgrim?.package?.name}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">Penerima: {h.recipientName}</p>
                        <p className="text-[10px] text-slate-500">Petugas: {h.officerName}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {givenCount} / {totalItems} Item Diterima
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {h.signatureUrl ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              ✍️ Bertanda Tangan
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Tanpa TTD Digital</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedHandoverForPrint(h)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors"
                          title="Cetak Berita Acara Serah Terima (BAST)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Cetak BAST
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredHandovers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredHandovers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            itemLabel="serah terima"
          />
        )}
      </div>
      </div>
      )}

      {/* TAB 2: TANDA TERIMA PENYERAHAN PASPOR & DOKUMEN ASLI JAMAAH */}
      {activeTab === "DOCUMENT_PASSPORT" && (
        <div className="space-y-6">
          {/* Top KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Disimpan di Brankas</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-black text-emerald-800">{totalDocStored}</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Aman di Kantor
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Dalam Proses Visa</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-black text-amber-700">{totalDocInVisa}</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Handling / Kedutaan
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Telah Dikembalikan</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-black text-blue-800">{totalDocReturned}</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Ke Jamaah
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Total Tanda Terima</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-black text-slate-900">{documentHandovers.length}</span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  Semua Berkas
                </span>
              </div>
            </div>
          </div>

          {/* Search, Package Filter, Status Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs no-print flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari no tanda terima, nama jamaah, nomor paspor, atau penyerah..."
                value={docSearchTerm}
                onChange={(e) => setDocSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
              <select
                value={docPackageFilter}
                onChange={(e) => setDocPackageFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="ALL">📂 Semua Paket Keberangkatan</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    🛫 {pkg.name}
                  </option>
                ))}
              </select>

              <select
                value={docStatusFilter}
                onChange={(e) => setDocStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="ALL">Semua Status Dokumen</option>
                <option value="STORED_SAFELY">🟢 Disimpan di Brankas (Aman)</option>
                <option value="IN_VISA_PROCESS">🟡 Dalam Proses Visa</option>
                <option value="RETURNED_TO_PILGRIM">🔵 Sudah Dikembalikan ke Jamaah</option>
              </select>
            </div>
          </div>

          {/* Document Handover Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No. Tanda Terima & Tgl</th>
                    <th className="py-3 px-4">Nama Jamaah & Paket</th>
                    <th className="py-3 px-4">Rincian Paspor Fisik</th>
                    <th className="py-3 px-4">Dokumen Fisik Diserahkan</th>
                    <th className="py-3 px-4">Penyerah & Petugas</th>
                    <th className="py-3 px-4 text-center">Status Berkas</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredDocHandovers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                        <FileText className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="font-medium">Belum ada data tanda terima penyerahan paspor & dokumen.</p>
                        <button
                          onClick={() => {
                            setIsDocAddModalOpen(true);
                            setTimeout(() => clearDocCanvas(), 200);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
                        >
                          <Plus className="w-3.5 h-3.5" /> + Buat Tanda Terima Paspor Baru
                        </button>
                      </td>
                    </tr>
                  ) : (
                    paginatedDocHandovers.map((d) => {
                      const docItems = getDocumentItemsList(d);
                      const isReturned = d.status === "RETURNED_TO_PILGRIM";

                      return (
                        <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-blue-900 block">
                              {d.receiptNumber}
                            </span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {formatDate(d.handoverDate, "dd MMMM yyyy")}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{d.pilgrim?.name}</span>
                            <span className="text-[10px] text-emerald-700 font-semibold block">
                              🛫 {d.pilgrim?.package?.name || "Paket Belum Dipilih"}
                            </span>
                            <span className="text-[9.5px] text-slate-400 font-mono">
                              NIK: {d.pilgrim?.nik || "-"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {d.hasOriginalPassport ? (
                              <div className="space-y-0.5">
                                <span className="font-mono font-bold text-slate-950 block text-[11.5px]">
                                  {d.passportNumber || d.pilgrim?.passportNumber || "Belum ada No"}
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  Exp: {d.passportExpiry ? formatDate(d.passportExpiry, "dd/MM/yyyy") : "-"}
                                </span>
                                <span className={`inline-block text-[9.5px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                  d.passportPhysicalState === "BAIK_LENGKAP"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}>
                                  {d.passportPhysicalState === "BAIK_LENGKAP" ? "Fisik Baik & Lengkap" : "Ada Catatan"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Tanpa Paspor Fisik</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {d.hasOriginalPassport && (
                                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                                  <FileText className="w-2.5 h-2.5" /> Paspor Asli
                                </span>
                              )}
                              {d.hasYellowVaccineBook && (
                                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                                  <ShieldCheck className="w-2.5 h-2.5" /> Buku Vaksin (ICV)
                                </span>
                              )}
                              {d.hasPassportPhotos && (
                                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">
                                  Foto 4x6 ({d.photoCount || 5} Lembar)
                                </span>
                              )}
                              {d.hasFamilyCardCopy && (
                                <span className="text-[9.5px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                  FC KK
                                </span>
                              )}
                              {d.hasIdCardCopy && (
                                <span className="text-[9.5px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                  FC KTP
                                </span>
                              )}
                              {d.hasMarriageBook && (
                                <span className="text-[9.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded">
                                  Buku Nikah
                                </span>
                              )}
                              {d.hasBirthCertificate && (
                                <span className="text-[9.5px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded">
                                  Akta Lahir
                                </span>
                              )}
                              {d.additionalDocuments && (
                                <span className="text-[9.5px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                  + {d.additionalDocuments}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block text-[11px]">{d.submitterName}</span>
                            <span className="text-[10px] text-slate-500 block">
                              Hub: {d.submitterRelation?.replace(/_/g, " ")}
                            </span>
                            <span className="text-[9.5px] text-slate-400 block mt-0.5">
                              Penerima: <strong>{d.officerName}</strong>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                                d.status === "STORED_SAFELY"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : d.status === "IN_VISA_PROCESS"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-blue-100 text-blue-800 border border-blue-200"
                              }`}
                            >
                              {d.status === "STORED_SAFELY" && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                              {d.status === "IN_VISA_PROCESS" && <Sparkles className="w-3 h-3 text-amber-600" />}
                              {d.status === "RETURNED_TO_PILGRIM" && <CheckCircle2 className="w-3 h-3 text-blue-600" />}
                              {d.status === "STORED_SAFELY" && "Disimpan di Brankas"}
                              {d.status === "IN_VISA_PROCESS" && "Proses Visa"}
                              {d.status === "RETURNED_TO_PILGRIM" && "Telah Dikembalikan"}
                            </span>
                            {d.returnDate && (
                              <span className="text-[9px] text-slate-400 block mt-0.5">
                                Kembali: {formatDate(d.returnDate, "dd/MM/yy")}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedDocForPrint(d)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors"
                                title="Pratinjau & Cetak Surat Tanda Terima Paspor A4"
                              >
                                <Printer className="w-3.5 h-3.5" /> Cetak Bukti
                              </button>

                              <button
                                onClick={() => {
                                  const text = `*BUKTI PENYERAHAN PASPOR & DOKUMEN RESMI UMROH*\n${travelSettings.companyName || "PT BAROKAH SULTHAN HARAMAIN"}\n------------------------------------\n*No. Tanda Terima:* ${d.receiptNumber}\n*Tanggal Terima:* ${formatDate(d.handoverDate, "dd MMMM yyyy")}\n*Nama Jamaah:* ${d.pilgrim?.name}\n*No. Paspor:* ${d.passportNumber || "-"}\n*Masa Berlaku:* ${d.passportExpiry ? formatDate(d.passportExpiry, "dd MMMM yyyy") : "-"}\n*Yang Menyerahkan:* ${d.submitterName}\n*Petugas Penerima:* ${d.officerName}\n\n*Rincian Dokumen Fisik yang Diterima:*\n${docItems.map((item, idx) => `${idx + 1}. ${item}`).join("\n")}\n\n_Dokumen fisik asli di atas telah diterima dalam kondisi baik dan disimpan secara aman di brankas dokumen travel untuk pengurusan visa umroh._\n\nTerima kasih atas kepercayaannya.\n*${travelSettings.companyName || "PT BAROKAH SULTHAN HARAMAIN"}*`;
                                  const cleanPhone = (d.submitterPhone || d.pilgrim?.phone || "").replace(/\D/g, "");
                                  const formattedPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
                                  if (formattedPhone) {
                                    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`, "_blank");
                                  } else {
                                    alert("Nomor WhatsApp penyerah/jamaah belum tersedia.");
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                                title="Kirim Bukti Tanda Terima via WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>

                              {!isReturned && (
                                <button
                                  onClick={() => {
                                    setSelectedDocForReturn(d);
                                    setReturnDate(new Date().toISOString().split("T")[0]);
                                  }}
                                  className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
                                  title="Catat Pengembalian Paspor ke Jamaah"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteDocHandover(d.id)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                                title="Hapus Data Tanda Terima"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredDocHandovers.length > 0 && (
              <Pagination
                currentPage={docCurrentPage}
                totalItems={filteredDocHandovers.length}
                pageSize={docPageSize}
                onPageChange={setDocCurrentPage}
                onPageSizeChange={(newSize) => {
                  setDocPageSize(newSize);
                  setDocCurrentPage(1);
                }}
                itemLabel="tanda terima dokumen"
              />
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PANDUAN & CHECKLIST PACKING JAMAAH */}
      {activeTab === "PACKING_GUIDE" && (
        <div className="space-y-6">
          {/* Top Control Bar: Gender Switch & Actions */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                onClick={() => setPackingGender("FEMALE")}
                className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  packingGender === "FEMALE"
                    ? "bg-rose-500 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🧕 Perempuan / Muslimah ({WOMEN_PACKING_LIST.length} Item)
              </button>

              <button
                onClick={() => setPackingGender("MALE")}
                className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  packingGender === "MALE"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                👨 Laki-Laki / Ikhwan ({MEN_PACKING_LIST.length} Item)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrintPackingModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                Cetak Format A4 (PDF)
              </button>

              <button
                onClick={() => handleOpenSendWa()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
                Kirim WA ke Jamaah
              </button>
            </div>
          </div>

          {/* Guidelines & Safety Rules Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Aturan Skincare & Cairan
              </div>
              <p className="text-amber-950 text-[11px] leading-relaxed">
                Cairan/spray di <strong>Tas Kabin</strong> maksimal <strong>100 ml/botol</strong> (wajib botol kecil spray wudhu). Cairan lebih dari 100 ml <strong>WAJIB</strong> masuk ke <strong>Koper Bagasi Besar</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-blue-900">
                <Boxes className="w-4 h-4 text-blue-600 shrink-0" />
                Koper Bagasi (25 - 30 Kg)
              </div>
              <p className="text-blue-950 text-[11px] leading-relaxed">
                Pakaian ganti harian, gamis, daster/baju tidur, deterjen, hanger, gunting kuku/cukur dimasukkan ke Koper Besar yang masuk bagasi pesawat.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Tas Paspor / Kabin (Maks 7 Kg)
              </div>
              <p className="text-emerald-950 text-[11px] leading-relaxed">
                Paspor asli, Buku Kuning Vaksin, 1 set pakaian ihram cadangan, obat pribadi penting, sajadah lipat, HP & Powerbank (maks 20.000 mAh).
              </p>
            </div>
          </div>

          {/* Packing Items Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-600" />
                  Daftar Checklist Perlengkapan Umroh {packingGender === "MALE" ? "Laki-Laki" : "Perempuan"}
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar {currentPackingItems.length} item perlengkapan pribadi yang wajib disiapkan jamaah di koper.
                </p>
              </div>
              <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                {currentPackingItems.length} Item Total
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-3 px-4 text-center w-12">No</th>
                    <th className="py-3 px-4">Nama Barang Perlengkapan</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Catatan & Rekomendasi Khusus</th>
                    <th className="py-3 px-4 text-center">Prioritas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {currentPackingItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 text-xs">{item.name}</p>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.category === "PAKAIAN"
                            ? "bg-purple-50 text-purple-800 border border-purple-200"
                            : item.category === "IBADAH"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : item.category === "ELEKTRONIK"
                            ? "bg-blue-50 text-blue-800 border border-blue-200"
                            : item.category === "KESEHATAN"
                            ? "bg-rose-50 text-rose-800 border border-rose-200"
                            : item.category === "LAUNDRY"
                            ? "bg-cyan-50 text-cyan-800 border border-cyan-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {item.notes || "-"}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {item.isEssential ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            ★ Wajib / Esensial
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                            Standar
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Form Ceklis Serah Terima & Canvas TTD Digital */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-600" />
                Formulir Serah Terima Perlengkapan Umroh
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitHandover} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Filter Paket Keberangkatan</label>
                  <select
                    value={modalPackageFilter}
                    onChange={(e) => {
                      const nextPkg = e.target.value;
                      setModalPackageFilter(nextPkg);
                      const filtered = pilgrims.filter(
                        (p) => nextPkg === "ALL" || p.packageId === nextPkg
                      );
                      if (filtered.length > 0) {
                        setSelectedPilgrimId(filtered[0].id);
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-semibold"
                  >
                    <option value="ALL">📂 Semua Paket Keberangkatan</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        🛫 {pkg.name} ({formatDate(pkg.departureDate, "dd MMM yyyy")})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Pilih Jamaah Penerima *</label>
                  <select
                    required
                    value={selectedPilgrimId}
                    onChange={(e) => setSelectedPilgrimId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {modalPilgrims.length === 0 ? (
                      <option value="">Tidak ada jamaah di paket ini</option>
                    ) : (
                      modalPilgrims.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - ({p.package?.name})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Nama Penerima (Jika Diwakilkan)</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Nama Petugas / Tim Admin Penyerah *</label>
                  <input
                    type="text"
                    required
                    placeholder="Tim Admin"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
                  />
                </div>
              </div>

              {/* Checklist Barang Perlengkapan */}
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 space-y-2">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-emerald-600" />
                  Ceklis Item Perlengkapan yang Diserahkan (Centang):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {equipment.map((eq) => {
                    const isChecked = !!checklistItems[eq.id];
                    return (
                      <label
                        key={eq.id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? "bg-white border-emerald-300 shadow-xs"
                            : "bg-slate-100/60 border-slate-200 opacity-60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCheck(eq.id)}
                          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 truncate">{eq.name}</p>
                          <p className="text-[10px] text-slate-400">Stok: {eq.availableStock} {eq.unit}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Canvas Tanda Tangan Digital */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">
                    ✍️ Tanda Tangan Digital Penerima (Goreskan di Kotak):
                  </label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700"
                  >
                    <Eraser className="w-3.5 h-3.5" /> Hapus / Ulangi
                  </button>
                </div>
                <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-white p-1 relative overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={580}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-32 touch-none cursor-crosshair bg-slate-50/50 rounded-xl"
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs">
                      Tanda tangan di sini dengan Mouse / Jari Sentuh Layar HP
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Catatan Serah Terima</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  {loading ? "Menyimpan..." : "Konfirmasi & Simpan Serah Terima"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Lembar Berita Acara Serah Terima (BAST Siap Cetak) */}
      {selectedHandoverForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 no-print">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Berita Acara Serah Terima Perlengkapan
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  <Printer className="w-4 h-4" /> Cetak BAST
                </button>
                <button
                  onClick={() => setSelectedHandoverForPrint(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* BAST Document Template (Matching Official Letterhead) */}
            <div className="border border-slate-300 p-8 rounded-2xl bg-white text-slate-900 space-y-4 text-xs">
              {/* 1. Header KOP */}
              <div className="flex items-center gap-4 pb-1">
                <div className="h-14 w-14 flex-shrink-0 flex items-center justify-center p-0.5">
                  <img
                    src="/sulthan-haramain-logo.jpg"
                    alt="Logo Sulthan Haramain"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1 text-left">
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-950 uppercase leading-none">
                    {travelSettings.companyName || "PT BAROKAH SULTHAN HARAMAIN"}
                  </h1>
                  <p className="text-[9.5px] text-slate-700 leading-tight mt-1">
                    {travelSettings.address || "Jl. Pahlawan No.10 J, Ps. Gambir, Kec. Tebing Tinggi Kota, Kota Tebing Tinggi, Sumatera Utara 20631"}
                  </p>
                  <p className="text-[9px] font-semibold text-slate-700 leading-tight mt-0.5">
                    Telp / WhatsApp: {travelSettings.phone || "0821-6733-9464"} • Email: {travelSettings.email || "barokahsulthanharamain@gmail.com"}
                  </p>
                  <p className="text-[9px] font-bold text-slate-900 leading-tight mt-0.5 tracking-tight">
                    {travelSettings.kemenhanLicense || "Keputusan Menteri Hukum Republik Indonesia NOMOR AHU-0007388.AH.01.01.TAHUN 2026"}
                  </p>
                  <p className="text-[7.5px] sm:text-[8px] font-semibold text-slate-500 tracking-wide mt-0.5 uppercase">
                    NO. IZIN PPIU INDUK USAHA PT. GRAND RESTU HARAMAN : {(travelSettings.licenseNumber || "25052200384080005")
                      .replace(/•?\s*NIB[\s\S]*/i, "")
                      .replace(/•?\s*KBLI[\s\S]*/i, "")
                      .replace(/NO\.\s*IZIN\s*PPIU\s*:\s*/i, "")
                      .trim()}
                  </p>
                </div>
              </div>

              {/* 2. Geometric Header Divider */}
              <div className="relative w-full h-4 flex items-center my-0.5 overflow-hidden">
                <div className="h-2 flex-1 bg-gradient-to-r from-amber-400 to-amber-500 rounded-l" />
                <div className="flex gap-1 px-2">
                  <div className="w-1.5 h-3 bg-amber-400 -skew-x-25" />
                  <div className="w-1.5 h-3 bg-amber-400 -skew-x-25" />
                  <div className="w-1.5 h-3 bg-amber-400 -skew-x-25" />
                  <div className="w-1.5 h-3 bg-amber-400 -skew-x-25" />
                </div>
                <div className="w-20 h-3 bg-slate-900 -skew-x-25 -mr-3" />
              </div>

              {/* Title */}
              <div className="text-center pt-1">
                <h2 className="text-xs font-black uppercase text-slate-900 underline">
                  BERITA ACARA SERAH TERIMA PERLENGKAPAN UMROH (BAST)
                </h2>
                <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                  Nomor Dokumen: BAST-LOG-{selectedHandoverForPrint.id.slice(0, 8).toUpperCase()}
                </p>
              </div>

              {/* Pilgrim Info */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <p><strong>Nama Jamaah:</strong> {selectedHandoverForPrint.pilgrim?.name}</p>
                  <p><strong>Nama Penerima:</strong> {selectedHandoverForPrint.recipientName}</p>
                  <p><strong>Paket Umroh:</strong> {selectedHandoverForPrint.pilgrim?.package?.name}</p>
                  <p><strong>Tanggal Serah Terima:</strong> {formatDate(selectedHandoverForPrint.handoverDate, "dd MMMM yyyy")}</p>
                </div>
              </div>

              {/* Checklist Table */}
              <div>
                <p className="font-bold text-slate-900 mb-1.5">Rincian Barang yang Diterima:</p>
                <table className="w-full border-collapse border border-slate-300 text-left">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="border border-slate-300 p-2 text-center w-10">No</th>
                      <th className="border border-slate-300 p-2">Nama Barang / Perlengkapan</th>
                      <th className="border border-slate-300 p-2 text-center w-16">Jumlah</th>
                      <th className="border border-slate-300 p-2 text-center w-24">Status Cek</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedHandoverForPrint.items?.map((item: any, idx: number) => (
                      <tr key={item.id}>
                        <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 font-medium">{item.equipment?.name}</td>
                        <td className="border border-slate-300 p-2 text-center font-bold">{item.quantity} {item.equipment?.unit}</td>
                        <td className="border border-slate-300 p-2 text-center font-bold text-emerald-800">
                          {item.isGiven ? "✓ Diterima" : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-slate-600 italic">
                Catatan: {selectedHandoverForPrint.notes || "Semua barang dalam kondisi baik dan lengkap."}
              </p>

              {/* Signatures */}
              <div className="pt-4 grid grid-cols-2 gap-4 text-center border-t border-slate-200">
                <div>
                  <p className="text-slate-600 font-medium">Tim Admin / Penyerah</p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-xs font-serif italic text-slate-500">[TTD Tim Admin]</span>
                  </div>
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block px-4">
                    {selectedHandoverForPrint.officerName || "Tim Admin"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-600 font-medium">Jamaah / Penerima Barang</p>
                  <div className="h-16 flex items-center justify-center">
                    {selectedHandoverForPrint.signatureUrl ? (
                      <img
                        src={selectedHandoverForPrint.signatureUrl}
                        alt="Tanda Tangan Digital"
                        className="max-h-14 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs font-serif italic text-slate-500">[Tanda Tangan]</span>
                    )}
                  </div>
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block px-4">
                    {selectedHandoverForPrint.recipientName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Cetak Lembar Panduan Packing A4 */}
      {isPrintPackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 no-print">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  Dokumen Panduan Manasik & Packing Koper
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Cetak Checklist Perlengkapan Umroh {packingGender === "MALE" ? "Laki-Laki" : "Perempuan"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-400" /> Cetak Lembar (Print/PDF)
                </button>
                <button
                  onClick={() => setIsPrintPackingModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="border border-slate-300 p-8 rounded-2xl bg-white text-slate-900 space-y-4 text-xs">
              {/* 1. Header KOP */}
              <div className="flex items-center gap-4 pb-1">
                <div className="h-14 w-14 flex-shrink-0 flex items-center justify-center p-0.5">
                  <img
                    src="/sulthan-haramain-logo.jpg"
                    alt="Logo Sulthan Haramain"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1 text-left">
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-950 uppercase leading-none">
                    {travelSettings.companyName || "PT BAROKAH SULTHAN HARAMAIN"}
                  </h1>
                  <p className="text-[9.5px] text-slate-700 leading-tight mt-1">
                    {travelSettings.address || "Jl. Pahlawan No.10 J, Ps. Gambir, Kec. Tebing Tinggi Kota, Kota Tebing Tinggi, Sumatera Utara 20631"}
                  </p>
                  <p className="text-[9px] font-semibold text-slate-700 leading-tight mt-0.5">
                    Telp / WhatsApp: {travelSettings.phone || "0821-6733-9464"} • Email: {travelSettings.email || "barokahsulthanharamain@gmail.com"}
                  </p>
                  <p className="text-[9px] font-bold text-slate-900 leading-tight mt-0.5 tracking-tight">
                    {travelSettings.kemenhanLicense || "Keputusan Menteri Hukum Republik Indonesia NOMOR AHU-0007388.AH.01.01.TAHUN 2026"}
                  </p>
                  <p className="text-[7.5px] sm:text-[8px] font-semibold text-slate-500 tracking-wide mt-0.5 uppercase">
                    NO. IZIN PPIU INDUK USAHA PT. GRAND RESTU HARAMAN : {(travelSettings.licenseNumber || "25052200384080005")
                      .replace(/•?\s*NIB[\s\S]*/i, "")
                      .replace(/•?\s*KBLI[\s\S]*/i, "")
                      .replace(/NO\.\s*IZIN\s*PPIU\s*:\s*/i, "")
                      .trim()}
                  </p>
                </div>
              </div>

              {/* 2. Geometric Header Divider */}
              <div className="relative w-full h-4 flex items-center my-0.5 overflow-hidden">
                <div className="h-2 flex-1 bg-gradient-to-r from-amber-400 to-amber-500 rounded-l" />
                <div className="flex gap-1 px-2">
                  <div className="w-1.5 h-3 bg-amber-400 -skew-x-25" />
                  <div className="w-1.5 h-3 bg-amber-400 -skew-x-25" />
                  <div className="w-1.5 h-3 bg-amber-400 -skew-x-25" />
                  <div className="w-1.5 h-3 bg-amber-400 -skew-x-25" />
                </div>
                <div className="w-20 h-3 bg-slate-900 -skew-x-25 -mr-3" />
              </div>

              {/* Title */}
              <div className="text-center pt-1">
                <h2 className="text-xs font-black uppercase text-slate-900 underline">
                  PANDUAN CHECKLIST PERSIAPAN PERLENGKAPAN UMROH ({packingGender === "MALE" ? "LAKI-LAKI" : "PEREMPUAN"})
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Lampiran Wajib Bawaan Koper Jamaah • Harap diceklis (✓) sebelum keberangkatan
                </p>
              </div>

              {/* Table of items */}
              <div>
                <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="border border-slate-300 p-1.5 text-center w-8">Cek</th>
                      <th className="border border-slate-300 p-1.5 text-center w-8">No</th>
                      <th className="border border-slate-300 p-1.5">Nama Barang Perlengkapan</th>
                      <th className="border border-slate-300 p-1.5">Catatan / Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPackingItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="border border-slate-300 p-1.5 text-center font-bold text-slate-400 font-mono">
                          [ &nbsp; ]
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-semibold text-slate-600">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-300 p-1.5 font-bold text-slate-900">
                          {item.name}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-slate-600 text-[10px]">
                          {item.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Flight & Luggage Notice */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10px] space-y-1 text-slate-700">
                <p className="font-bold text-slate-900">⚠️ Catatan Penting Bagasi & Penerbangan:</p>
                <p>1. <strong>Koper Bagasi Besar:</strong> Maksimal berat 25-30 kg per jamaah. Masukkan cairan/skincare lebih dari 100 ml, gunting kuku, dan pisau cukur ke koper bagasi.</p>
                <p>2. <strong>Tas Kabin / Tas Paspor:</strong> Paspor asli, buku kuning meningitis, obat pribadi harian, sajadah lipat, HP & Powerbank (maks 20.000 mAh). Dilarang membawa cairan &gt; 100 ml di kabin.</p>
              </div>

              {/* Footer */}
              <div className="pt-3 flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-200">
                <p>Semoga ibadah umroh Bapak/Ibu lancar dan meraih predikat Umroh yang Mabrur.</p>
                <p className="font-bold text-slate-900">Bagian Operasional & Logistik Sulthan Haramain</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Kirim WhatsApp Panduan Packing */}
      {isSendWaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                Kirim Panduan Packing via WhatsApp
              </h3>
              <button
                onClick={() => setIsSendWaModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Opsi Pilih Jamaah Terdaftar */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Pilih Jamaah Terdaftar:
                </label>
                <select
                  value={waSelectedPilgrimId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setWaSelectedPilgrimId(id);
                    const p = pilgrims.find((item) => item.id === id);
                    if (p) {
                      setWaCustomName(p.name);
                      setWaCustomPhone(p.phone);
                      setWaCustomGender(p.gender === "FEMALE" ? "FEMALE" : "MALE");
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Masukkan Nomor Manual di Bawah --</option>
                  {pilgrims.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gender === "FEMALE" ? "Perempuan" : "Laki-Laki"}) - {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data Manual / Edit */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Jamaah:</label>
                  <input
                    type="text"
                    value={waCustomName}
                    onChange={(e) => setWaCustomName(e.target.value)}
                    placeholder="Nama Lengkap Jamaah"
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor WhatsApp:</label>
                  <input
                    type="tel"
                    value={waCustomPhone}
                    onChange={(e) => setWaCustomPhone(e.target.value)}
                    placeholder="0821xxxxxxxx"
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Gender Switch */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Kategori Checklist:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setWaCustomGender("FEMALE")}
                    className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      waCustomGender === "FEMALE"
                        ? "bg-rose-500 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    🧕 Perempuan ({WOMEN_PACKING_LIST.length} Item)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaCustomGender("MALE")}
                    className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      waCustomGender === "MALE"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    👨 Laki-Laki ({MEN_PACKING_LIST.length} Item)
                  </button>
                </div>
              </div>

              {/* Preview Message Box */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Preview Teks WhatsApp:</label>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-44 overflow-y-auto text-[11px] font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {generatePackingWhatsAppText({
                    pilgrimName: waCustomName || "Bapak / Ibu Jamaah",
                    gender: waCustomGender,
                    companyName: travelSettings.companyName,
                    phone: travelSettings.phone,
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSendWaModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendWaSubmit}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" /> Buka WhatsApp & Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: FORM TAMBAH TANDA TERIMA PASPOR & DOKUMEN ASLI */}
      {isDocAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Buat Tanda Terima Penyerahan Paspor & Dokumen Asli
                </h3>
                <p className="text-xs text-slate-500">
                  Pencatatan resmi berkas fisik yang diterima biro travel dari jamaah / keluarga
                </p>
              </div>
              <button
                onClick={() => setIsDocAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDocHandover} className="space-y-4 text-xs font-sans">
              {/* 1. Pilih Jamaah */}
              <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs">
                  <User className="w-3.5 h-3.5" />
                  Data Calon Jamaah
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Pilih Calon Jamaah *</label>
                    <select
                      value={docPilgrimId}
                      onChange={(e) => setDocPilgrimId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500/20"
                      required
                    >
                      <option value="">-- Pilih Jamaah Terdaftar --</option>
                      {pilgrims.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - {p.package?.name || "Tanpa Paket"} ({p.passportNumber ? `Paspor: ${p.passportNumber}` : "Paspor Belum Ada"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tanggal Penyerahan *</label>
                    <input
                      type="date"
                      value={docHandoverDate}
                      onChange={(e) => setDocHandoverDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 2. Data Penyerah & Petugas Penerima */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Yang Menyerahkan *</label>
                  <input
                    type="text"
                    value={docSubmitterName}
                    onChange={(e) => setDocSubmitterName(e.target.value)}
                    placeholder="Nama jamaah / perwakilan"
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hubungan Penyerah</label>
                  <select
                    value={docSubmitterRelation}
                    onChange={(e) => setDocSubmitterRelation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-medium bg-white"
                  >
                    <option value="YANG_BERSANGKUTAN">Yang Bersangkutan (Jamaah)</option>
                    <option value="SUAMI_ISTRI">Suami / Istri</option>
                    <option value="ORANG_TUA">Orang Tua</option>
                    <option value="ANAK">Anak Kandung</option>
                    <option value="SAUDARA">Saudara Kandung</option>
                    <option value="KUASA_KELUARGA">Kuasa / Perwakilan Keluarga</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">No. WhatsApp Penyerah</label>
                  <input
                    type="tel"
                    value={docSubmitterPhone}
                    onChange={(e) => setDocSubmitterPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Petugas Penerima (Travel) *</label>
                  <input
                    type="text"
                    value={docOfficerName}
                    onChange={(e) => setDocOfficerName(e.target.value)}
                    placeholder="Nama staf operasional"
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kondisi Fisik Paspor</label>
                  <select
                    value={docPassportPhysicalState}
                    onChange={(e) => setDocPassportPhysicalState(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-medium bg-white"
                  >
                    <option value="BAIK_LENGKAP">Kondisi Baik, Utuh & Bersih</option>
                    <option value="ADA_CATATAN">Ada Noda / Lipatan / Catatan Fisik</option>
                  </select>
                </div>
              </div>

              {/* 3. Detail Paspor Asli */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docHasOriginalPassport}
                      onChange={(e) => setDocHasOriginalPassport(e.target.checked)}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <span>📘 Paspor Asli RI Diserahkan ke Travel</span>
                  </label>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    Dokumen Utama
                  </span>
                </div>

                {docHasOriginalPassport && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Nomor Paspor RI *</label>
                      <input
                        type="text"
                        value={docPassportNumber}
                        onChange={(e) => setDocPassportNumber(e.target.value.toUpperCase())}
                        placeholder="Contoh: X1234567 atau B1234567"
                        className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono font-bold uppercase"
                        required={docHasOriginalPassport}
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Masa Berlaku Paspor (Expiry)</label>
                      <input
                        type="date"
                        value={docPassportExpiry}
                        onChange={(e) => setDocPassportExpiry(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 p-2 text-xs font-medium bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Berkas Pendukung Lainnya */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block text-xs">
                  Berkas Pendukung yang Turut Diserahkan:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50/70 p-3 rounded-2xl border border-slate-200">
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docHasYellowVaccineBook}
                      onChange={(e) => setDocHasYellowVaccineBook(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Buku Kuning / ICV Vaksin Meningitis</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docHasPassportPhotos}
                      onChange={(e) => setDocHasPassportPhotos(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Pasfoto 4x6 Background Putih</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docHasFamilyCardCopy}
                      onChange={(e) => setDocHasFamilyCardCopy(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Fotokopi Kartu Keluarga (KK)</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docHasIdCardCopy}
                      onChange={(e) => setDocHasIdCardCopy(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Fotokopi KTP Jamaah</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docHasMarriageBook}
                      onChange={(e) => setDocHasMarriageBook(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Buku Nikah Asli / Legalisir</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docHasBirthCertificate}
                      onChange={(e) => setDocHasBirthCertificate(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Akta Kelahiran Asli</span>
                  </label>
                </div>

                {docHasPassportPhotos && (
                  <div className="flex items-center gap-2 pt-1">
                    <label className="text-slate-600 text-xs whitespace-nowrap">Jumlah Lembar Pasfoto:</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={docPhotoCount}
                      onChange={(e) => setDocPhotoCount(Number(e.target.value) || 0)}
                      className="w-20 rounded-lg border border-slate-200 p-1 text-xs text-center font-bold"
                    />
                    <span className="text-slate-500 text-xs">Lembar</span>
                  </div>
                )}

                <div>
                  <label className="text-slate-600 text-xs block mb-1">Dokumen Tambahan Lain (Jika ada):</label>
                  <input
                    type="text"
                    value={docAdditional}
                    onChange={(e) => setDocAdditional(e.target.value)}
                    placeholder="Contoh: Ijazah Asli, Surat Keterangan Domisili, dll"
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-600 text-xs block mb-1">Catatan Tambahan / Berita Acara:</label>
                  <textarea
                    rows={2}
                    value={docNotes}
                    onChange={(e) => setDocNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                  />
                </div>
              </div>

              {/* 5. Tanda Tangan Digital Penyerah */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <FileSignature className="w-3.5 h-3.5 text-blue-600" />
                    Tanda Tangan Digital Penyerah Dokumen (Jamaah/Keluarga):
                  </label>
                  <button
                    type="button"
                    onClick={clearDocCanvas}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eraser className="w-3 h-3" /> Hapus Tanda Tangan
                  </button>
                </div>
                <div className="border border-slate-300 rounded-xl bg-slate-50 overflow-hidden relative">
                  <canvas
                    ref={docCanvasRef}
                    width={560}
                    height={120}
                    className="w-full h-28 bg-white touch-none cursor-crosshair"
                    onMouseDown={startDocDrawing}
                    onMouseMove={drawDoc}
                    onMouseUp={stopDocDrawing}
                    onMouseLeave={stopDocDrawing}
                    onTouchStart={startDocDrawing}
                    onTouchMove={drawDoc}
                    onTouchEnd={stopDocDrawing}
                  />
                  {!docHasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-xs font-serif italic">
                      Tanda tangani di sini (Layar sentuh / Mouse)
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDocAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {loading ? "Menyimpan..." : "Simpan & Terbitkan Tanda Terima"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PRATINJAU & CETAK SURAT TANDA TERIMA PASPOR RESMI A4 */}
      {selectedDocForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[95vh] overflow-y-auto print:max-w-none print:w-full print:p-0 print:m-0 print:shadow-none print:rounded-none">
            {/* Modal Controls (no-print) */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 no-print">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Pratinjau Surat Tanda Terima Paspor Asli</h3>
                  <p className="text-xs text-slate-500">Dokumen resmi berita acara penerimaan berkas persyaratan umroh</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Cetak Lembar A4 (PDF)
                </button>
                <button
                  onClick={() => setSelectedDocForPrint(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Document Sheet (A4 Single Page) */}
            <div className="border border-slate-300 p-8 rounded-2xl bg-white text-slate-900 space-y-3.5 text-xs font-sans print:border-none print:p-4 print:space-y-3">
              {/* 1. Header KOP Resmi PT Barokah Sulthan Haramain */}
              <div className="flex items-center gap-4 pb-1">
                <div className="h-14 w-14 flex-shrink-0 flex items-center justify-center p-0.5">
                  <img
                    src="/sulthan-haramain-logo.jpg"
                    alt="Logo Sulthan Haramain"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1 text-left">
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-950 uppercase leading-none">
                    {travelSettings.companyName || "PT BAROKAH SULTHAN HARAMAIN"}
                  </h1>
                  <p className="text-[9.5px] text-slate-700 leading-tight mt-1">
                    {travelSettings.address || "Jl. Pahlawan No.10 J, Ps. Gambir, Kec. Tebing Tinggi Kota, Kota Tebing Tinggi, Sumatera Utara 20631"}
                  </p>
                  <p className="text-[9px] font-semibold text-slate-700 leading-tight mt-0.5">
                    Telp / WhatsApp: {travelSettings.phone || "0821-6733-9464"} • Email: {travelSettings.email || "barokahsulthanharamain@gmail.com"}
                  </p>
                  <p className="text-[9px] font-bold text-slate-900 leading-tight mt-0.5 tracking-tight">
                    {travelSettings.kemenhanLicense || "Keputusan Menteri Hukum Republik Indonesia NOMOR AHU-0007388.AH.01.01.TAHUN 2026"}
                  </p>
                  <p className="text-[7.5px] sm:text-[8px] font-semibold text-slate-500 tracking-wide mt-0.5 uppercase">
                    NO. IZIN PPIU INDUK USAHA PT. GRAND RESTU HARAMAN : {(travelSettings.licenseNumber || "25052200384080005")
                      .replace(/•?\s*NIB[\s\S]*/i, "")
                      .replace(/•?\s*KBLI[\s\S]*/i, "")
                      .replace(/NO\.\s*IZIN\s*PPIU\s*:\s*/i, "")
                      .trim()}
                  </p>
                </div>
              </div>

              {/* 2. Divider Garis Ganda Naskah Dinas */}
              <div className="w-full border-b-[2px] border-slate-900 mt-0.5"></div>
              <div className="w-full border-b-[0.8px] border-slate-900 mt-[1.5px] mb-2"></div>

              {/* 3. Document Title */}
              <div className="text-center pt-0.5">
                <h2 className="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-wide underline">
                  SURAT TANDA TERIMA PENYERAHAN PASPOR & DOKUMEN ASLI
                </h2>
                <p className="text-[10px] text-slate-600 font-bold uppercase mt-0.5">
                  BERITA ACARA SERAH TERIMA DOKUMEN PERSYARATAN UMROH
                </p>
                <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                  Nomor: {selectedDocForPrint.receiptNumber}
                </p>
              </div>

              {/* 4. Submitter & Pilgrim Info Card */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] leading-relaxed">
                <p className="text-slate-600 font-medium pb-1">
                  Telah diterima dengan baik dokumen fisik persyaratan keberangkatan umroh dari calon jamaah di bawah ini:
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 border-t border-slate-200">
                  <p><strong>Nama Calon Jamaah:</strong> {selectedDocForPrint.pilgrim?.name}</p>
                  <p><strong>Yang Menyerahkan:</strong> {selectedDocForPrint.submitterName} ({selectedDocForPrint.submitterRelation?.replace(/_/g, " ")})</p>
                  <p><strong>NIK / No KTP:</strong> {selectedDocForPrint.pilgrim?.nik || "-"}</p>
                  <p><strong>No. WhatsApp:</strong> {selectedDocForPrint.submitterPhone || selectedDocForPrint.pilgrim?.phone || "-"}</p>
                  <p><strong>Paket Umroh:</strong> {selectedDocForPrint.pilgrim?.package?.name || "-"}</p>
                  <p><strong>Tanggal Penyerahan:</strong> {formatDate(selectedDocForPrint.handoverDate, "dd MMMM yyyy")}</p>
                </div>
              </div>

              {/* 5. Physical Documents Table */}
              <div>
                <p className="font-bold text-slate-900 mb-1 text-[11px]">Rincian Dokumen Fisik yang Diterima Pihak Travel:</p>
                <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="border border-slate-300 p-2 text-center w-8">No</th>
                      <th className="border border-slate-300 p-2">Nama Dokumen Fisik</th>
                      <th className="border border-slate-300 p-2 text-center w-28">Status / Jenis</th>
                      <th className="border border-slate-300 p-2">Keterangan / Nomor Berkas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDocForPrint.hasOriginalPassport && (
                      <tr>
                        <td className="border border-slate-300 p-2 text-center">1</td>
                        <td className="border border-slate-300 p-2 font-bold text-slate-950">
                          Paspor Asli Republik Indonesia
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-bold text-emerald-800 bg-emerald-50/50">
                          Fisik Asli (Diterima)
                        </td>
                        <td className="border border-slate-300 p-2 font-mono">
                          No: <strong>{selectedDocForPrint.passportNumber || selectedDocForPrint.pilgrim?.passportNumber || "-"}</strong>
                          {selectedDocForPrint.passportExpiry && ` • Exp: ${formatDate(selectedDocForPrint.passportExpiry, "dd/MM/yyyy")}`}
                          <span className="block text-[9.5px] font-sans text-slate-500 font-normal">
                            Kondisi: {selectedDocForPrint.passportPhysicalState === "BAIK_LENGKAP" ? "Baik & Utuh" : "Ada Catatan Khusus"}
                          </span>
                        </td>
                      </tr>
                    )}

                    {selectedDocForPrint.hasYellowVaccineBook && (
                      <tr>
                        <td className="border border-slate-300 p-2 text-center">2</td>
                        <td className="border border-slate-300 p-2 font-medium">
                          Buku Kuning / Sertifikat Vaksin Meningitis (ICV)
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-bold text-amber-800 bg-amber-50/50">
                          Fisik Asli
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-600">
                          {selectedDocForPrint.vaccineNotes || "Buku Kuning Vaksin Meningitis Internasional"}
                        </td>
                      </tr>
                    )}

                    {selectedDocForPrint.hasPassportPhotos && (
                      <tr>
                        <td className="border border-slate-300 p-2 text-center">3</td>
                        <td className="border border-slate-300 p-2 font-medium">
                          Pasfoto Ukuran 4x6 Background Putih (80% Wajah)
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-medium">
                          Cetak Foto Fisik
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-700">
                          Sebanyak <strong>{selectedDocForPrint.photoCount || 5} Lembar</strong>
                        </td>
                      </tr>
                    )}

                    {selectedDocForPrint.hasFamilyCardCopy && (
                      <tr>
                        <td className="border border-slate-300 p-2 text-center">4</td>
                        <td className="border border-slate-300 p-2 font-medium">Fotokopi Kartu Keluarga (KK)</td>
                        <td className="border border-slate-300 p-2 text-center">Salinan Berkas</td>
                        <td className="border border-slate-300 p-2 text-slate-600">1 Lembar Fotokopi Jelas</td>
                      </tr>
                    )}

                    {selectedDocForPrint.hasIdCardCopy && (
                      <tr>
                        <td className="border border-slate-300 p-2 text-center">5</td>
                        <td className="border border-slate-300 p-2 font-medium">Fotokopi KTP Jamaah</td>
                        <td className="border border-slate-300 p-2 text-center">Salinan Berkas</td>
                        <td className="border border-slate-300 p-2 text-slate-600">1 Lembar Fotokopi Jelas</td>
                      </tr>
                    )}

                    {selectedDocForPrint.hasMarriageBook && (
                      <tr>
                        <td className="border border-slate-300 p-2 text-center">6</td>
                        <td className="border border-slate-300 p-2 font-medium">Buku Nikah Asli / Legalisir</td>
                        <td className="border border-slate-300 p-2 text-center font-bold text-rose-800">Dokumen Asli</td>
                        <td className="border border-slate-300 p-2 text-slate-600">Untuk Syarat Mahram Suami/Istri</td>
                      </tr>
                    )}

                    {selectedDocForPrint.hasBirthCertificate && (
                      <tr>
                        <td className="border border-slate-300 p-2 text-center">7</td>
                        <td className="border border-slate-300 p-2 font-medium">Akta Kelahiran Asli</td>
                        <td className="border border-slate-300 p-2 text-center font-bold text-teal-800">Dokumen Asli</td>
                        <td className="border border-slate-300 p-2 text-slate-600">Untuk Syarat Mahram Anak/Keluarga</td>
                      </tr>
                    )}

                    {selectedDocForPrint.additionalDocuments && (
                      <tr>
                        <td className="border border-slate-300 p-2 text-center">8</td>
                        <td className="border border-slate-300 p-2 font-medium">Dokumen Tambahan Lainnya</td>
                        <td className="border border-slate-300 p-2 text-center">Dokumen Khusus</td>
                        <td className="border border-slate-300 p-2 text-slate-700">
                          {selectedDocForPrint.additionalDocuments}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 6. Legal & Security Custody Clause */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[9.5px] text-slate-600 leading-relaxed text-justify">
                <strong>Pernyataan & Klausul Tanggung Jawab Biro Travel:</strong> Pihak PT BAROKAH SULTHAN HARAMAIN menyatakan telah menerima berkas fisik asli tersebut di atas dalam keadaan baik dan bertanggung jawab penuh untuk menyimpannya dengan aman di tempat penyimpanan khusus (brankas dokumen). Berkas asli ini dipergunakan semata-mata untuk kelengkapan administrasi pengurusan visa umroh Kerajaan Arab Saudi, pendaftaran SISKOPATUH Kemenag RI, dan handling keberangkatan. Berkas asli akan diserahkan kembali kepada jamaah sesuai jadwal operasional atau selambat-lambatnya pada saat keberangkatan di bandara.
              </div>

              {/* 7. Signatures Area (Two Columns) */}
              <div className="pt-2 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <p className="text-slate-600 text-[10.5px]">Yang Menyerahkan Dokumen,</p>
                  <p className="text-[10px] text-slate-400">Calon Jamaah / Keluarga</p>
                  <div className="h-20 flex items-center justify-center my-1">
                    {selectedDocForPrint.submitterSignatureUrl ? (
                      <img
                        src={selectedDocForPrint.submitterSignatureUrl}
                        alt="Tanda Tangan Penyerah"
                        className="max-h-16 max-w-full object-contain mx-auto"
                      />
                    ) : (
                      <div className="w-28 border-b border-dashed border-slate-400 mt-12" />
                    )}
                  </div>
                  <p className="font-bold underline text-slate-900 uppercase">
                    ( {selectedDocForPrint.submitterName} )
                  </p>
                </div>

                <div>
                  <p className="text-slate-600 text-[10.5px]">
                    Tebing Tinggi, {formatDate(selectedDocForPrint.handoverDate, "dd MMMM yyyy")}
                  </p>
                  <p className="text-[10px] text-slate-400">Yang Menerima (Petugas Dokumen Travel)</p>
                  <div className="h-20 flex items-center justify-center my-1 relative">
                    <div className="w-28 border-b border-dashed border-slate-400 mt-12" />
                    <span className="absolute text-[8px] font-bold text-blue-900/30 uppercase tracking-widest border border-blue-900/20 px-2 py-0.5 rounded rotate-[-12deg]">
                      STEMPEL OPERASIONAL
                    </span>
                  </div>
                  <p className="font-bold underline text-slate-900 uppercase">
                    ( {selectedDocForPrint.officerName} )
                  </p>
                  <p className="text-[9.5px] text-slate-500 font-semibold">
                    PT BAROKAH SULTHAN HARAMAIN
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex justify-between items-center no-print">
              <span className="text-xs text-slate-400">
                Format resmi standar A4 siap dicetak atau disimpan sebagai PDF
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedDocForPrint(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Tutup
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-4 h-4" /> Cetak Lembar A4
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CATAT PENGEMBALIAN PASPOR KE JAMAAH */}
      {selectedDocForReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <RotateCcw className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Catat Pengembalian Paspor</h3>
                  <p className="text-xs text-slate-500">Penyerahan kembali paspor fisik ke jamaah</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDocForReturn(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReturnPassport} className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <p><strong>No. Tanda Terima:</strong> {selectedDocForReturn.receiptNumber}</p>
                <p><strong>Nama Jamaah:</strong> {selectedDocForReturn.pilgrim?.name}</p>
                <p><strong>Nomor Paspor:</strong> {selectedDocForReturn.passportNumber || "-"}</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tanggal Pengembalian *</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Petugas Yang Menyerahkan Kembali *</label>
                <input
                  type="text"
                  value={returnOfficerName}
                  onChange={(e) => setReturnOfficerName(e.target.value)}
                  placeholder="Nama staf operasional"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Pengembalian</label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Lokasi penyerahan (misal: Bandara Kualanamu / Kantor)"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDocForReturn(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {loading ? "Menyimpan..." : "Konfirmasi Pengembalian"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
