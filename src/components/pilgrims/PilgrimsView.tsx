"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  Eye,
  CreditCard,
  FileCheck,
  FileText,
  Boxes,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  Plane,
  X,
  Sparkles,
  Download,
  AlertCircle,
  Pencil,
  Trash2,
  Camera,
  Scan,
  UploadCloud,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Key,
  Copy,
  CheckCheck,
  MessageSquare,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusBadge } from "@/lib/utils";
import RegistrationsAdminModal from "@/components/registrations/RegistrationsAdminModal";
import Pagination from "@/components/common/Pagination";

interface PilgrimsViewProps {
  pilgrims: any[];
  packages: any[];
  onRefresh: () => void;
  onOpenLetterGenerator?: (pilgrim: any) => void;
  onNavigateTab?: (tab: string, searchFilter?: string) => void;
}

export default function PilgrimsView({
  pilgrims,
  packages,
  onRefresh,
  onOpenLetterGenerator,
  onNavigateTab,
}: PilgrimsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPilgrim, setSelectedPilgrim] = useState<any | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRegistrationsModalOpen, setIsRegistrationsModalOpen] = useState(false);
  const [editingPilgrimId, setEditingPilgrimId] = useState<string | null>(null);

  // Column Visibility Filter State
  const [columns, setColumns] = useState({
    title: true,
    name: true,
    fatherName: true,
    identity: true,
    passport: true,
    birth: true,
    address: true,
    phone: true,
    demography: true,
    visa: true,
    package: true,
    room: true,
    status: true,
  });
  const [isColumnFilterOpen, setIsColumnFilterOpen] = useState(false);

  const setPresetColumns = (preset: "ALL" | "SISKOPATUH" | "PASSPORT_VISA" | "IDENTITY_CONTACT") => {
    if (preset === "ALL") {
      setColumns({
        title: true,
        name: true,
        fatherName: true,
        identity: true,
        passport: true,
        birth: true,
        address: true,
        phone: true,
        demography: true,
        visa: true,
        package: true,
        room: true,
        status: true,
      });
    } else if (preset === "SISKOPATUH") {
      setColumns({
        title: true,
        name: true,
        fatherName: true,
        identity: true,
        passport: true,
        birth: true,
        address: true,
        phone: true,
        demography: true,
        visa: true,
        package: true,
        room: false,
        status: true,
      });
    } else if (preset === "PASSPORT_VISA") {
      setColumns({
        title: false,
        name: true,
        fatherName: false,
        identity: false,
        passport: true,
        birth: false,
        address: false,
        phone: true,
        demography: false,
        visa: true,
        package: true,
        room: false,
        status: true,
      });
    } else if (preset === "IDENTITY_CONTACT") {
      setColumns({
        title: true,
        name: true,
        fatherName: true,
        identity: true,
        passport: false,
        birth: true,
        address: true,
        phone: true,
        demography: true,
        visa: false,
        package: true,
        room: false,
        status: true,
      });
    }
  };

  // Helper to calculate age from birth date string
  const calculateAge = (dobString: string | null | undefined) => {
    if (!dobString) return null;
    const birth = new Date(dobString);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Smart Mahram & Underage Guardian states for Add Modal
  const [addHasMahramOption, setAddHasMahramOption] = useState<boolean | null>(null);
  const [addHasGuardianOption, setAddHasGuardianOption] = useState<boolean | null>(null);
  const [addGuardianRelationType, setAddGuardianRelationType] = useState<string>("AYAH");
  const [addMahramInputMode, setAddMahramInputMode] = useState<"DB" | "MANUAL">("DB");

  // Smart Mahram & Underage Guardian states for Edit Modal
  const [editHasMahramOption, setEditHasMahramOption] = useState<boolean | null>(null);
  const [editHasGuardianOption, setEditHasGuardianOption] = useState<boolean | null>(null);
  const [editGuardianRelationType, setEditGuardianRelationType] = useState<string>("AYAH");
  const [editMahramInputMode, setEditMahramInputMode] = useState<"DB" | "MANUAL">("DB");

  // KTP & KK OCR states
  const [isScanningKtp, setIsScanningKtp] = useState(false);
  const [ktpPreviewUrl, setKtpPreviewUrl] = useState<string | null>(null);
  const [isScanningKk, setIsScanningKk] = useState(false);
  const [kkPreviewUrl, setKkPreviewUrl] = useState<string | null>(null);
  const [kkParsedData, setKkParsedData] = useState<any | null>(null);
  const [kkMembers, setKkMembers] = useState<any[]>([]);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState<string | null>(null);

  const handleKtpFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setKtpPreviewUrl(preview);
    setIsScanningKtp(true);
    setOcrSuccessMsg(null);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/ocr/ktp", {
        method: "POST",
        body: uploadData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          if (isEdit) {
            setEditFormData((prev) => ({
              ...prev,
              nik: d.nik || prev.nik,
              name: d.name || prev.name,
              placeOfBirth: d.birthPlace || prev.placeOfBirth,
              dateOfBirth: d.birthDate || prev.dateOfBirth,
              gender: d.gender || prev.gender,
              address: d.address || prev.address,
              bloodType: d.bloodType || prev.bloodType,
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              nik: d.nik || prev.nik,
              name: d.name || prev.name,
              placeOfBirth: d.birthPlace || prev.placeOfBirth,
              dateOfBirth: d.birthDate || prev.dateOfBirth,
              gender: d.gender || prev.gender,
              address: d.address || prev.address,
              bloodType: d.bloodType || prev.bloodType,
            }));
          }
          setOcrSuccessMsg(`✨ e-KTP Berhasil Terbaca! NIK: ${d.nik || "-"}, Nama: ${d.name || "-"}. Semua kolom di bawah dapat Anda edit.`);
        }
      } else {
        alert("Peringatan: Pastikan foto KTP tajam, terbaca jelas, dan tidak terpotong.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal membaca foto KTP. Anda tetap dapat menginput form secara manual.");
    } finally {
      setIsScanningKtp(false);
    }
  };

  const handleKkFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setKkPreviewUrl(preview);
    setIsScanningKk(true);
    setOcrSuccessMsg(null);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/ocr/kk", {
        method: "POST",
        body: uploadData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setKkParsedData(d);
          const members = Array.isArray(d.members) ? d.members : [];
          setKkMembers(members);

          if (members.length > 0) {
            const first = members[0];
            const addressFull = [d.address, d.rtRw ? `RT/RW ${d.rtRw}` : "", d.village, d.district].filter(Boolean).join(", ");
            const inferredFather = first.relation === "ANAK" ? d.headOfFamily : "";
            if (isEdit) {
              setEditFormData((prev) => ({
                ...prev,
                nik: first.nik || prev.nik,
                name: first.name || prev.name,
                placeOfBirth: first.birthPlace || d.city || prev.placeOfBirth,
                dateOfBirth: first.birthDate || prev.dateOfBirth,
                gender: first.gender || prev.gender,
                address: addressFull || prev.address,
                city: d.city || prev.city,
                province: d.province || prev.province,
                fatherName: inferredFather || prev.fatherName,
                mahramName: d.headOfFamily || prev.mahramName,
                mahramRelation: first.relation || prev.mahramRelation,
              }));
            } else {
              setFormData((prev) => ({
                ...prev,
                nik: first.nik || prev.nik,
                name: first.name || prev.name,
                placeOfBirth: first.birthPlace || d.city || prev.placeOfBirth,
                dateOfBirth: first.birthDate || prev.dateOfBirth,
                gender: first.gender || prev.gender,
                address: addressFull || prev.address,
                city: d.city || prev.city,
                province: d.province || prev.province,
                fatherName: inferredFather || prev.fatherName,
                mahramName: d.headOfFamily || prev.mahramName,
                mahramRelation: first.relation || prev.mahramRelation,
              }));
            }
          }

          setOcrSuccessMsg(`✨ Kartu Keluarga Berhasil Dibaca! Terdeteksi ${members.length} anggota keluarga. Silakan tinjau dan edit data anggota di tabel bawah.`);
        }
      } else {
        alert("Peringatan: Pastikan foto Kartu Keluarga tajam, jelas, dan tabel anggota terbaca.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal membaca Kartu Keluarga. Anda tetap dapat mengisi data secara manual.");
    } finally {
      setIsScanningKk(false);
    }
  };

  const handleSelectKkMember = (member: any, isEdit = false) => {
    const addressFull = kkParsedData ? [kkParsedData.address, kkParsedData.rtRw ? `RT/RW ${kkParsedData.rtRw}` : "", kkParsedData.village, kkParsedData.district].filter(Boolean).join(", ") : "";
    const inferredFather = member.relation === "ANAK" ? (kkParsedData?.headOfFamily || "") : "";
    if (isEdit) {
      setEditFormData((prev) => ({
        ...prev,
        nik: member.nik || prev.nik,
        name: member.name || prev.name,
        placeOfBirth: member.birthPlace || kkParsedData?.city || prev.placeOfBirth,
        dateOfBirth: member.birthDate || prev.dateOfBirth,
        gender: member.gender || prev.gender,
        address: addressFull || prev.address,
        city: kkParsedData?.city || prev.city,
        province: kkParsedData?.province || prev.province,
        fatherName: inferredFather || prev.fatherName,
        mahramName: kkParsedData?.headOfFamily || prev.mahramName,
        mahramRelation: member.relation || prev.mahramRelation,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        nik: member.nik || prev.nik,
        name: member.name || prev.name,
        placeOfBirth: member.birthPlace || kkParsedData?.city || prev.placeOfBirth,
        dateOfBirth: member.birthDate || prev.dateOfBirth,
        gender: member.gender || prev.gender,
        address: addressFull || prev.address,
        city: kkParsedData?.city || prev.city,
        province: kkParsedData?.province || prev.province,
        fatherName: inferredFather || prev.fatherName,
        mahramName: kkParsedData?.headOfFamily || prev.mahramName,
        mahramRelation: member.relation || prev.mahramRelation,
      }));
    }
    alert(`Data anggota "${member.name}" berhasil diterapkan ke form.`);
  };

  const handleUpdateKkMember = (index: number, field: string, value: any) => {
    setKkMembers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Helper to determine passport expiry status and recommend renewal (< 1 year or < 6 months)
  const getPassportExpiryStatus = (expiryDateStr: string | null | undefined, departureDateStr?: string | null | undefined) => {
    if (!expiryDateStr) return null;
    const expDate = new Date(expiryDateStr);
    if (isNaN(expDate.getTime())) return null;

    const targetDate = departureDateStr ? new Date(departureDateStr) : new Date();
    const diffDays = Math.ceil((expDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        status: "EXPIRED",
        badgeClass: "bg-rose-100 text-rose-900 border-rose-300 font-bold",
        shortBadge: "⛔ Kadaluarsa",
        label: "⛔ Paspor Sudah Kadaluarsa",
        recommendation: "Paspor sudah habis masa berlaku. Wajib melakukan penggantian paspor baru di Kantor Imigrasi sebelum pendaftaran visa.",
        isWarning: true,
        isCritical: true,
        diffDays,
      };
    } else if (diffDays <= 180) {
      return {
        status: "CRITICAL_6M",
        badgeClass: "bg-rose-100 text-rose-900 border-rose-300 font-black animate-pulse",
        shortBadge: `⛔ Exp < 6 Bln (${diffDays} hr)`,
        label: `⛔ Kritis: Exp < 6 Bulan (${diffDays} Hari Lagi)`,
        recommendation: "Kritis! Masa berlaku paspor kurang dari 6 bulan. Syarat Visa Umroh Saudi mensyaratkan minimal 6 bulan. Wajib perpanjang paspor segera!",
        isWarning: true,
        isCritical: true,
        diffDays,
      };
    } else if (diffDays <= 365) {
      return {
        status: "WARNING_1Y",
        badgeClass: "bg-amber-100 text-amber-950 border-amber-300 font-bold",
        shortBadge: `⚠️ Saran Perpanjang (< 1 Thn)`,
        label: `⚠️ Saran Perpanjang Paspor (< 1 Tahun)`,
        recommendation: "Masa berlaku paspor kurang dari 1 tahun. Disarankan untuk segera melakukan perpanjangan paspor guna kelancaran pendaftaran dan pengurusan visa.",
        isWarning: true,
        isCritical: false,
        diffDays,
      };
    }

    return {
      status: "VALID",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold",
      shortBadge: "✓ Aktif",
      label: "✓ Paspor Aktif (> 1 Tahun)",
      recommendation: "Masa berlaku paspor aman dan memenuhi syarat perjalanan umroh.",
      isWarning: false,
      isCritical: false,
      diffDays,
    };
  };

  const handleBatchAddKkMembers = async () => {
    if (kkMembers.length === 0) return;
    if (!confirm(`Daftarkan ${kkMembers.length} anggota keluarga dari Kartu Keluarga ini ke dalam paket yang dipilih?`)) return;

    setLoading(true);
    let successCount = 0;
    const addressFull = kkParsedData ? [kkParsedData.address, kkParsedData.rtRw ? `RT/RW ${kkParsedData.rtRw}` : "", kkParsedData.village, kkParsedData.district].filter(Boolean).join(", ") : "";

    for (const m of kkMembers) {
      try {
        const payload = {
          packageId: formData.packageId || packages[0]?.id,
          name: m.name,
          nik: m.nik,
          hasPassport: false,
          passportNumber: null,
          passportExpiry: null,
          hasVisa: false,
          visaNumber: null,
          placeOfBirth: m.birthPlace || kkParsedData?.city || "Jakarta",
          dateOfBirth: m.birthDate ? new Date(m.birthDate).toISOString() : new Date("1990-01-01").toISOString(),
          gender: m.gender || "MALE",
          phone: formData.phone || "-",
          address: addressFull || "-",
          city: kkParsedData?.city || "Jakarta",
          province: kkParsedData?.province || "Sumatera Utara",
          fatherName: m.relation === "ANAK" ? (kkParsedData?.headOfFamily || null) : null,
          motherName: null,
          mahramName: kkParsedData?.headOfFamily || null,
          mahramRelation: m.relation || null,
          roomType: formData.roomType || "QUAD",
          uniformSize: "L",
          bloodType: "O",
          initialDpAmount: formData.initialDpAmount || "10000000",
        };

        const res = await fetch("/api/pilgrims", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) successCount++;
      } catch (e) {
        console.error(e);
      }
    }

    setLoading(false);
    setIsAddModalOpen(false);
    alert(`Alhamdulillah! Berhasil mendaftarkan ${successCount} dari ${kkMembers.length} anggota keluarga.`);
    onRefresh();
  };

  // Form input data jamaah baru
  const [formData, setFormData] = useState({
    packageId: packages[0]?.id || "",
    title: "Bpk",
    name: "",
    fatherName: "",
    identityType: "KTP",
    nik: "",
    hasPassport: false,
    passportName: "",
    passportNumber: "",
    passportIssuedDate: "",
    passportIssuedCity: "",
    passportExpiry: "",
    hasVisa: false,
    visaProvider: "",
    visaNumber: "",
    visaIssueDate: "",
    visaExpiryDate: "",
    mofaNumber: "",
    muassasahName: "",
    insuranceNumber: "",
    placeOfBirth: "",
    dateOfBirth: "",
    gender: "MALE",
    address: "",
    subDistrict: "",
    district: "",
    city: "",
    province: "",
    telephone: "",
    phone: "",
    email: "",
    citizenship: "WNI",
    maritalStatus: "MENIKAH",
    education: "SMA",
    job: "SWASTA",
    motherName: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    mahramName: "",
    mahramRelation: "",
    roomType: "QUAD",
    uniformSize: "L",
    bloodType: "O",
    healthNotes: "",
    initialDpAmount: "10000000",
    hasDiscount: false,
    discountAmount: "",
    discountReason: "",
  });

  // Edit form data
  const [editFormData, setEditFormData] = useState({
    packageId: "",
    title: "Bpk",
    name: "",
    fatherName: "",
    identityType: "KTP",
    nik: "",
    hasPassport: false,
    passportName: "",
    passportNumber: "",
    passportIssuedDate: "",
    passportIssuedCity: "",
    passportExpiry: "",
    hasVisa: false,
    visaProvider: "",
    visaNumber: "",
    visaIssueDate: "",
    visaExpiryDate: "",
    mofaNumber: "",
    muassasahName: "",
    insuranceNumber: "",
    placeOfBirth: "",
    dateOfBirth: "",
    gender: "MALE",
    address: "",
    subDistrict: "",
    district: "",
    city: "",
    province: "",
    telephone: "",
    phone: "",
    email: "",
    citizenship: "WNI",
    maritalStatus: "MENIKAH",
    education: "SMA",
    job: "SWASTA",
    motherName: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    mahramName: "",
    mahramRelation: "",
    roomType: "QUAD",
    uniformSize: "L",
    bloodType: "O",
    healthNotes: "",
    status: "REGISTERED",
    hasDiscount: false,
    discountAmount: "",
    discountReason: "",
  });

  const handleOpenEdit = (p: any) => {
    setEditingPilgrimId(p.id);
    const hasPass = Boolean(p.passportNumber && p.passportNumber.trim() !== "");
    const hasVis = Boolean(p.visaNumber && p.visaNumber.trim() !== "");
    const pDisc = p.discountAmount || 0;
    setEditFormData({
      packageId: p.packageId || "",
      title: p.title || "Bpk",
      name: p.name || "",
      fatherName: p.fatherName || "",
      identityType: p.identityType || "KTP",
      nik: p.nik || "",
      hasPassport: hasPass,
      passportName: p.passportName || p.name || "",
      passportNumber: p.passportNumber || "",
      passportIssuedDate: p.passportIssuedDate ? p.passportIssuedDate.split("T")[0] : "",
      passportIssuedCity: p.passportIssuedCity || "",
      passportExpiry: p.passportExpiry ? p.passportExpiry.split("T")[0] : "",
      hasVisa: hasVis,
      visaProvider: p.visaProvider || "",
      visaNumber: p.visaNumber || "",
      visaIssueDate: p.visaIssueDate ? p.visaIssueDate.split("T")[0] : "",
      visaExpiryDate: p.visaExpiryDate ? p.visaExpiryDate.split("T")[0] : "",
      mofaNumber: p.mofaNumber || "",
      muassasahName: p.muassasahName || "",
      insuranceNumber: p.insuranceNumber || "",
      placeOfBirth: p.placeOfBirth || "",
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "",
      gender: p.gender || "MALE",
      address: p.address || "",
      subDistrict: p.subDistrict || "",
      district: p.district || "",
      city: p.city || "",
      province: p.province || "",
      telephone: p.telephone || "",
      phone: p.phone || "",
      email: p.email || "",
      citizenship: p.citizenship || "WNI",
      maritalStatus: p.maritalStatus || "MENIKAH",
      education: p.education || "SMA",
      job: p.job || "SWASTA",
      motherName: p.motherName || "",
      emergencyContactName: p.emergencyContactName || "",
      emergencyContactPhone: p.emergencyContactPhone || "",
      mahramName: p.mahramName || "",
      mahramRelation: p.mahramRelation || "",
      roomType: p.roomType || "QUAD",
      uniformSize: p.uniformSize || "L",
      bloodType: p.bloodType || "O",
      healthNotes: p.healthNotes || "",
      status: p.status || "REGISTERED",
      hasDiscount: pDisc > 0,
      discountAmount: pDisc > 0 ? String(pDisc) : "",
      discountReason: p.discountReason || "",
    });

    const hasMah = Boolean(p.mahramName && p.mahramName.trim() !== "");
    setEditHasMahramOption(hasMah);
    setEditHasGuardianOption(hasMah);
    setEditGuardianRelationType(p.mahramRelation || "AYAH");
    setEditMahramInputMode("DB");

    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPilgrimId) return;
    setLoading(true);
    try {
      const payload = {
        ...editFormData,
        discountAmount: editFormData.hasDiscount && editFormData.discountAmount ? parseFloat(editFormData.discountAmount) : 0,
        discountReason: editFormData.hasDiscount ? editFormData.discountReason : null,
        passportName: editFormData.hasPassport ? editFormData.passportName : null,
        passportNumber: editFormData.hasPassport ? editFormData.passportNumber : null,
        passportIssuedDate: editFormData.hasPassport && editFormData.passportIssuedDate ? editFormData.passportIssuedDate : null,
        passportIssuedCity: editFormData.hasPassport ? editFormData.passportIssuedCity : null,
        passportExpiry: editFormData.hasPassport && editFormData.passportExpiry ? editFormData.passportExpiry : null,
        visaProvider: editFormData.hasVisa ? editFormData.visaProvider : null,
        visaNumber: editFormData.hasVisa ? editFormData.visaNumber : null,
        visaIssueDate: editFormData.hasVisa && editFormData.visaIssueDate ? editFormData.visaIssueDate : null,
        visaExpiryDate: editFormData.hasVisa && editFormData.visaExpiryDate ? editFormData.visaExpiryDate : null,
        mofaNumber: editFormData.hasVisa ? editFormData.mofaNumber : null,
        muassasahName: editFormData.hasVisa ? editFormData.muassasahName : null,
        insuranceNumber: editFormData.hasVisa ? editFormData.insuranceNumber : null,
      };
      const res = await fetch(`/api/pilgrims/${editingPilgrimId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        setEditingPilgrimId(null);
        alert("Data jamaah berhasil diperbarui!");
        onRefresh();
        if (selectedPilgrim && selectedPilgrim.id === editingPilgrimId) {
          setSelectedPilgrim(null);
        }
      } else {
        const err = await res.json();
        alert(`Gagal memperbarui: ${err.error || "Terjadi kesalahan"}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePilgrim = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data jamaah "${name}"?\nSemua data tagihan, berkas, dan logistik terkait akan dihapus secara permanen.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/pilgrims/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert(`Data jamaah "${name}" berhasil dihapus.`);
        if (selectedPilgrim && selectedPilgrim.id === id) {
          setSelectedPilgrim(null);
        }
        onRefresh();
      } else {
        alert("Gagal menghapus jamaah.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickDepart = async (pilgrimId: string, pilgrimName: string) => {
    if (
      !confirm(
        `Berangkatkan jamaah "${pilgrimName}" ke Tanah Suci (Arab Saudi)?\n\nStatus jamaah akan diubah menjadi "Di Tanah Suci (DEPARTED)" dan otomatis tercatat di menu "Jamaah Berangkat / Alumni".`
      )
    )
      return;
    try {
      const res = await fetch(`/api/pilgrims/${pilgrimId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DEPARTED" }),
      });
      if (res.ok) {
        alert(`Alhamdulillah, jamaah "${pilgrimName}" berhasil ditandai telah berangkat dan masuk ke arsip alumni!`);
        onRefresh();
      } else {
        alert("Gagal memperbarui status jamaah.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInlineStatusChange = async (pilgrimId: string, newStatus: string, pilgrimName: string) => {
    try {
      const res = await fetch(`/api/pilgrims/${pilgrimId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onRefresh();
        if (newStatus === "DEPARTED" || newStatus === "RETURNED") {
          alert(
            `Status "${pilgrimName}" berhasil diubah menjadi "${
              newStatus === "DEPARTED" ? "Di Tanah Suci (Berangkat)" : "Selesai / Pulang (Alumni)"
            }".\n\nData jamaah ini sekarang otomatis tercatat juga di menu "Jamaah Berangkat / Alumni".`
          );
        }
      } else {
        alert("Gagal memperbarui status jamaah");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi");
    }
  };

  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter
  const filteredPilgrims = pilgrims.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nik.includes(searchTerm) ||
      (p.passportNumber && p.passportNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.phone.includes(searchTerm);
    const matchPackage = selectedPackageId === "ALL" || p.packageId === selectedPackageId;
    const matchStatus = selectedStatus === "ALL" || p.status === selectedStatus;
    return matchSearch && matchPackage && matchStatus;
  });

  // Auto-reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedPackageId, selectedStatus]);

  const paginatedPilgrims = filteredPilgrims.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleAddPilgrim = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        discountAmount: formData.hasDiscount && formData.discountAmount ? parseFloat(formData.discountAmount) : 0,
        discountReason: formData.hasDiscount ? formData.discountReason : null,
        passportName: formData.hasPassport ? formData.passportName : null,
        passportNumber: formData.hasPassport ? formData.passportNumber : null,
        passportIssuedDate: formData.hasPassport && formData.passportIssuedDate ? formData.passportIssuedDate : null,
        passportIssuedCity: formData.hasPassport ? formData.passportIssuedCity : null,
        passportExpiry: formData.hasPassport && formData.passportExpiry ? formData.passportExpiry : null,
        visaProvider: formData.hasVisa ? formData.visaProvider : null,
        visaNumber: formData.hasVisa ? formData.visaNumber : null,
        visaIssueDate: formData.hasVisa && formData.visaIssueDate ? formData.visaIssueDate : null,
        visaExpiryDate: formData.hasVisa && formData.visaExpiryDate ? formData.visaExpiryDate : null,
        mofaNumber: formData.hasVisa ? formData.mofaNumber : null,
        muassasahName: formData.hasVisa ? formData.muassasahName : null,
        insuranceNumber: formData.hasVisa ? formData.insuranceNumber : null,
      };
      const res = await fetch("/api/pilgrims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({
          packageId: packages[0]?.id || "",
          title: "Bpk",
          name: "",
          fatherName: "",
          identityType: "KTP",
          nik: "",
          hasPassport: false,
          passportName: "",
          passportNumber: "",
          passportIssuedDate: "",
          passportIssuedCity: "",
          passportExpiry: "",
          hasVisa: false,
          visaProvider: "",
          visaNumber: "",
          visaIssueDate: "",
          visaExpiryDate: "",
          mofaNumber: "",
          muassasahName: "",
          insuranceNumber: "",
          placeOfBirth: "",
          dateOfBirth: "",
          gender: "MALE",
          address: "",
          subDistrict: "",
          district: "",
          city: "",
          province: "",
          telephone: "",
          phone: "",
          email: "",
          citizenship: "WNI",
          maritalStatus: "MENIKAH",
          education: "SMA",
          job: "SWASTA",
          motherName: "",
          emergencyContactName: "",
          emergencyContactPhone: "",
          mahramName: "",
          mahramRelation: "",
          roomType: "QUAD",
          uniformSize: "L",
          bloodType: "O",
          healthNotes: "",
          initialDpAmount: "10000000",
          hasDiscount: false,
          discountAmount: "",
          discountReason: "",
        });
        onRefresh();
      } else {
        const err = await res.json();
        alert(`Gagal mendaftar: ${err.error || "Periksa data NIK"}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredPilgrims.length === 0) {
      alert("Tidak ada data jamaah untuk diekspor.");
      return;
    }

    const selectedPkg = packages.find((p) => p.id === selectedPackageId);
    const pkgCode = selectedPkg ? selectedPkg.code : "SEMUA_PAKET";
    const pkgNameClean = selectedPkg
      ? selectedPkg.name.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()
      : "SEMUA_PROGRAM";

    const headers = "No,Nama Jamaah,NIK,No Paspor,Masa Berlaku Paspor,No WhatsApp,Paket Umroh,Tgl Berangkat,Tgl Pulang,Kamar,Ukuran Baju,Catatan Medis,Status\n";
    const rows = filteredPilgrims
      .map((p, idx) => {
        const dep = p.package?.departureDate ? formatDate(p.package.departureDate, "yyyy-MM-dd") : "-";
        let ret = p.package?.returnDate ? formatDate(p.package.returnDate, "yyyy-MM-dd") : "-";
        if (p.package?.departureDate && (!p.package?.returnDate || new Date(p.package.returnDate) <= new Date(p.package.departureDate))) {
          const d = new Date(p.package.departureDate);
          d.setDate(d.getDate() + ((p.package.durationDays || 9) - 1));
          ret = formatDate(d, "yyyy-MM-dd");
        }
        const health = (p.healthNotes || "-").replace(/"/g, '""');
        return `"${idx + 1}","${p.name}","${p.nik}","${p.passportNumber || "-"}","${p.passportExpiry ? formatDate(p.passportExpiry, "yyyy-MM-dd") : "-"}","${p.phone}","${p.package?.name}","${dep}","${ret}","${p.roomType}","${p.uniformSize || "L"}","${health}","${p.status}"`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Manifest_Jamaah_${pkgCode}_${pkgNameClean}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-emerald-600" />
            Database Lengkap Jamaah Umroh & Manifest
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Master data identitas, paspor, mahram, kamar, berkas persyaratan, dan riwayat logistik jamaah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRegistrationsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-black text-amber-900 shadow-2xs hover:bg-amber-100 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-amber-600" />
            📥 Antrean Pendaftaran Online
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export Manifest CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            + Tambah Jamaah Baru
          </button>
        </div>
      </div>

      {/* 5-Tier Umroh Lifecycle Quick Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => {
            if (onNavigateTab) onNavigateTab("leads");
          }}
          className="bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 p-3 rounded-2xl text-left transition-all group"
        >
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
            Tier 1 & 2 • Prospek
          </span>
          <p className="text-xs font-black text-amber-950 mt-0.5 group-hover:text-amber-800">
            Pipeline Leads & Penawaran &rarr;
          </p>
          <span className="text-[10px] text-amber-700">Follow-up calon jamaah</span>
        </button>

        <button
          onClick={() => setSelectedStatus("DP_PAID")}
          className={`p-3 rounded-2xl text-left transition-all border ${
            selectedStatus === "DP_PAID"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-900"
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${selectedStatus === "DP_PAID" ? "text-emerald-100" : "text-emerald-700"}`}>
            Tier 3 • Telah Bayar DP
          </span>
          <p className="text-xs font-black mt-0.5">Booking Seat Locked</p>
          <span className={`text-[10px] ${selectedStatus === "DP_PAID" ? "text-emerald-100" : "text-slate-500"}`}>
            {pilgrims.filter((p) => p.status === "DP_PAID" || p.status === "REGISTERED").length} Jamaah Terdata
          </span>
        </button>

        <button
          onClick={() => setSelectedStatus("DOCUMENTS_READY")}
          className={`p-3 rounded-2xl text-left transition-all border ${
            selectedStatus === "DOCUMENTS_READY"
              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-900"
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${selectedStatus === "DOCUMENTS_READY" ? "text-blue-100" : "text-blue-700"}`}>
            Tier 4 • Siap Berangkat
          </span>
          <p className="text-xs font-black mt-0.5">Lunas & Berkas Lengkap</p>
          <span className={`text-[10px] ${selectedStatus === "DOCUMENTS_READY" ? "text-blue-100" : "text-slate-500"}`}>
            {pilgrims.filter((p) => p.status === "DOCUMENTS_READY" || p.status === "FULLY_PAID").length} Jamaah Siap Terbang
          </span>
        </button>

        <button
          onClick={() => setSelectedStatus("DEPARTED")}
          className={`p-3 rounded-2xl text-left transition-all border ${
            selectedStatus === "DEPARTED"
              ? "bg-slate-900 text-white border-slate-900 shadow-xs"
              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-900"
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${selectedStatus === "DEPARTED" ? "text-amber-300" : "text-purple-700"}`}>
            Tier 5 • Di Tanah Suci
          </span>
          <p className="text-xs font-black mt-0.5">Makkah & Madinah</p>
          <span className={`text-[10px] ${selectedStatus === "DEPARTED" ? "text-slate-300" : "text-slate-500"}`}>
            {pilgrims.filter((p) => p.status === "DEPARTED").length} Sedang Beribadah
          </span>
        </button>
      </div>

      {/* Filter Bar & Column Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, NIK, nomor paspor, nama ayah, no HP, alamat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <select
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">Semua Jadwal Paket</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} ({formatDate(pkg.departureDate, "dd MMM")})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">Semua Status Perjalanan</option>
              <option value="REGISTERED">Terdaftar</option>
              <option value="DP_PAID">DP Terbayar</option>
              <option value="FULLY_PAID">Lunas</option>
              <option value="DOCUMENTS_READY">Berkas Lengkap</option>
              <option value="VISA_ISSUED">Visa Terbit</option>
              <option value="DEPARTED">Di Tanah Suci</option>
              <option value="RETURNED">Selesai / Pulang</option>
            </select>
          </div>
        </div>

        {/* Toolbar Baris 2: Preset Kolom & Toggle Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-emerald-600" /> Filter Kolom:
            </span>
            <button
              type="button"
              onClick={() => setPresetColumns("SISKOPATUH")}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-all border border-emerald-200 cursor-pointer"
            >
              🌟 Standar SISKOPATUH
            </button>
            <button
              type="button"
              onClick={() => setPresetColumns("PASSPORT_VISA")}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 hover:bg-blue-100 transition-all border border-blue-200 cursor-pointer"
            >
              ✈️ Paspor & Visa
            </button>
            <button
              type="button"
              onClick={() => setPresetColumns("IDENTITY_CONTACT")}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 hover:bg-purple-100 transition-all border border-purple-200 cursor-pointer"
            >
              🪪 Identitas & Kontak
            </button>
            <button
              type="button"
              onClick={() => setPresetColumns("ALL")}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all border border-slate-200 cursor-pointer"
            >
              📋 Tampilkan Semua
            </button>
          </div>

          {/* Popover Toggle Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsColumnFilterOpen(!isColumnFilterOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <span>⚙️ Sesuaikan Kolom ({Object.values(columns).filter(Boolean).length}/13)</span>
            </button>

            {isColumnFilterOpen && (
              <div className="absolute right-0 top-9 z-40 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 w-72 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900 text-xs">Pilih Kolom Tampilan</p>
                  <button
                    type="button"
                    onClick={() => setIsColumnFilterOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] max-h-60 overflow-y-auto pr-1">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" checked={columns.title} onChange={(e) => setColumns({ ...columns, title: e.target.checked })} className="rounded text-emerald-600" />
                    <span>Title / Sapaan</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" checked={columns.name} onChange={(e) => setColumns({ ...columns, name: e.target.checked })} className="rounded text-emerald-600" />
                    <span>Nama Jamaah</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" checked={columns.fatherName} onChange={(e) => setColumns({ ...columns, fatherName: e.target.checked })} className="rounded text-emerald-600" />
                    <span>Nama Ayah</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" checked={columns.identity} onChange={(e) => setColumns({ ...columns, identity: e.target.checked })} className="rounded text-emerald-600" />
                    <span>No. Identitas / NIK</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" checked={columns.passport} onChange={(e) => setColumns({ ...columns, passport: e.target.checked })} className="rounded text-emerald-600" />
                    <span>Paspor Lengkap</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" checked={columns.birth} onChange={(e) => setColumns({ ...columns, birth: e.target.checked })} className="rounded text-emerald-600" />
                    <span>Tempat & Tgl Lahir</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" checked={columns.address} onChange={(e) => setColumns({ ...columns, address: e.target.checked })} className="rounded text-emerald-600" />
                    <span>Alamat Lengkap</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" checked={columns.phone} onChange={(e) => setColumns({ ...columns, phone: e.target.checked })} className="rounded text-emerald-600" />
                    <span>Kontak (Telp/HP)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" checked={columns.demography} onChange={(e) => setColumns({ ...columns, demography: e.target.checked })} className="rounded text-emerald-600" />
                    <span>Demografi & Kerja</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" checked={columns.visa} onChange={(e) => setColumns({ ...columns, visa: e.target.checked })} className="rounded text-emerald-600" />
                    <span>Visa Saudi</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" checked={columns.package} onChange={(e) => setColumns({ ...columns, package: e.target.checked })} className="rounded text-emerald-600" />
                    <span>Paket & Jadwal</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" checked={columns.room} onChange={(e) => setColumns({ ...columns, room: e.target.checked })} className="rounded text-emerald-600" />
                    <span>Kamar & Ukuran</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" checked={columns.status} onChange={(e) => setColumns({ ...columns, status: e.target.checked })} className="rounded text-emerald-600" />
                    <span>Status Jamaah</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Database Jamaah */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                {columns.title && <th className="py-3 px-3">Title</th>}
                {columns.name && <th className="py-3 px-4">Nama (Kartu Vaksin) & NIK</th>}
                {columns.fatherName && <th className="py-3 px-3">Nama Ayah</th>}
                {columns.identity && <th className="py-3 px-3">Identitas</th>}
                {columns.passport && <th className="py-3 px-4">Paspor RI & Exp</th>}
                {columns.birth && <th className="py-3 px-3">Tempat & Tgl Lahir</th>}
                {columns.address && <th className="py-3 px-4">Alamat Domisili</th>}
                {columns.phone && <th className="py-3 px-3">Kontak (HP/Telp)</th>}
                {columns.demography && <th className="py-3 px-3">Demografi & Kerja</th>}
                {columns.visa && <th className="py-3 px-4">Visa Saudi</th>}
                {columns.package && <th className="py-3 px-4">Paket & Keberangkatan</th>}
                {columns.room && <th className="py-3 px-3">Kamar & Seragam</th>}
                {columns.status && <th className="py-3 px-3">Status</th>}
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredPilgrims.length === 0 ? (
                <tr>
                  <td colSpan={Object.values(columns).filter(Boolean).length + 1} className="py-10 text-center text-slate-400">
                    Tidak ada data jamaah ditemukan
                  </td>
                </tr>
              ) : (
                paginatedPilgrims.map((p) => {
                  const badge = getStatusBadge(p.status);
                  const expInfo = getPassportExpiryStatus(p.passportExpiry, p.package?.departureDate);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Title */}
                      {columns.title && (
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {p.title || "Bpk"}
                          </span>
                        </td>
                      )}

                      {/* Name & NIK */}
                      {columns.name && (
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="font-mono text-[11px] text-slate-400">NIK: {p.nik}</p>
                        </td>
                      )}

                      {/* Father Name */}
                      {columns.fatherName && (
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-slate-800">{p.fatherName || "-"}</p>
                        </td>
                      )}

                      {/* Identity */}
                      {columns.identity && (
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-slate-700">{p.identityType || "KTP"}:</span>
                          <p className="font-mono text-[11px] text-slate-600">{p.nik}</p>
                        </td>
                      )}

                      {/* Passport & Visa */}
                      {columns.passport && (
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {p.passportNumber ? (
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded text-[11px]">
                                    {p.passportNumber}
                                  </span>
                                  {expInfo && expInfo.isWarning && (
                                    <span
                                      className={`inline-flex items-center text-[9px] px-1.5 py-0.5 rounded border shadow-2xs ${expInfo.badgeClass}`}
                                      title={expInfo.recommendation}
                                    >
                                      {expInfo.shortBadge}
                                    </span>
                                  )}
                                </div>
                                {p.passportName && p.passportName !== p.name && (
                                  <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                                    Nama: {p.passportName}
                                  </p>
                                )}
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  Exp: {p.passportExpiry ? formatDate(p.passportExpiry, "dd/MM/yyyy") : "-"}
                                  {p.passportIssuedCity ? ` • Kota: ${p.passportIssuedCity}` : ""}
                                </p>
                              </div>
                            ) : (
                              <span className="inline-block text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-medium">
                                Paspor Belum Ada
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Place & Date of Birth */}
                      {columns.birth && (
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-slate-800">{p.placeOfBirth || "-"}</p>
                          <p className="text-[10px] text-slate-500">{p.dateOfBirth ? formatDate(p.dateOfBirth, "dd/MM/yyyy") : "-"}</p>
                        </td>
                      )}

                      {/* Full Address */}
                      {columns.address && (
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <p className="text-slate-800 font-medium line-clamp-1">{p.address || "-"}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">
                            {[p.subDistrict, p.district, p.city, p.province].filter(Boolean).join(", ") || "-"}
                          </p>
                        </td>
                      )}

                      {/* Phone & Telephone */}
                      {columns.phone && (
                        <td className="py-3.5 px-3">
                          <p className="text-slate-800 font-bold">{p.phone}</p>
                          {p.telephone && <p className="text-[10px] text-slate-500">Telp: {p.telephone}</p>}
                          {p.mahramName && (
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Mahram: {p.mahramName}
                            </p>
                          )}
                        </td>
                      )}

                      {/* Demography & Job */}
                      {columns.demography && (
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-slate-800">{p.job || "-"}</p>
                          <p className="text-[10px] text-slate-500">
                            {p.maritalStatus || "-"} • {p.citizenship || "WNI"}
                          </p>
                        </td>
                      )}

                      {/* Visa Saudi */}
                      {columns.visa && (
                        <td className="py-3.5 px-4">
                          {p.visaNumber ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                <span>🎫</span>
                                <span className="font-mono">{p.visaNumber}</span>
                              </span>
                              {p.visaProvider && (
                                <p className="text-[10px] text-slate-500">Provider: {p.visaProvider}</p>
                              )}
                              {p.visaExpiryDate && (
                                <p className="text-[10px] text-slate-400">
                                  Exp: {formatDate(p.visaExpiryDate, "dd/MM/yyyy")}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                              🎫 Belum Terbit
                            </span>
                          )}
                        </td>
                      )}

                      {/* Package */}
                      {columns.package && (
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800 line-clamp-1">{p.package?.name}</p>
                          <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                            🛫 {formatDate(p.package?.departureDate, "dd MMM yyyy")}
                          </p>
                        </td>
                      )}

                      {/* Room & Uniform */}
                      {columns.room && (
                        <td className="py-3.5 px-3">
                          <span className="inline-block text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {p.roomType} Room
                          </span>
                          <span className="inline-block ml-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            Size: {p.uniformSize}
                          </span>
                        </td>
                      )}

                      {/* Status (Interactive Inline Selector) */}
                      {columns.status && (
                        <td className="py-3.5 px-3">
                          <select
                            value={p.status || "REGISTERED"}
                            onChange={(e) => handleInlineStatusChange(p.id, e.target.value, p.name)}
                            className={`text-[10px] font-bold rounded-xl px-2.5 py-1 border cursor-pointer focus:outline-none transition-all ${badge.bg} ${badge.text} ${badge.border}`}
                            title="Klik untuk langsung mengubah status jamaah di tabel"
                          >
                            <option value="REGISTERED" className="bg-white text-slate-800">📋 Terdaftar Baru</option>
                            <option value="DP_PAID" className="bg-white text-slate-800">💳 DP Terbayar (Locked)</option>
                            <option value="FULLY_PAID" className="bg-white text-slate-800">💰 Lunas 100%</option>
                            <option value="DOCUMENTS_READY" className="bg-white text-slate-800">📑 Berkas Lengkap</option>
                            <option value="VISA_ISSUED" className="bg-white text-slate-800">🎫 Visa Terbit</option>
                            <option value="DEPARTED" className="bg-white text-slate-800">✈️ Di Tanah Suci (Berangkat)</option>
                            <option value="RETURNED" className="bg-white text-slate-800">🕋 Selesai / Pulang (Alumni)</option>
                          </select>
                        </td>
                      )}

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedPilgrim(p)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
                            title="Lihat Detail Profil"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors"
                            title="Edit / Ubah Data Jamaah"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeletePilgrim(p.id, p.name)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                            title="Hapus Data Jamaah"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {onNavigateTab && (
                            <>
                              <button
                                onClick={() => onNavigateTab("finance", p.name)}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                title="Buka Tagihan & Invoice"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onNavigateTab("handovers", p.name)}
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                                title="Ceklis Serah Terima Logistik"
                              >
                                <Boxes className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onNavigateTab("requirements", p.name)}
                                className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors"
                                title="Ceklis Syarat & Dokumen"
                              >
                                <FileCheck className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleQuickDepart(p.id, p.name)}
                            className="p-1.5 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300 transition-colors"
                            title="✈️ Berangkatkan Jamaah (Pindahkan ke Database Alumni)"
                          >
                            <Plane className="w-3.5 h-3.5" />
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

        {/* Pagination Footer */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredPilgrims.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="jamaah"
        />
      </div>

      {/* Modal Detail Jamaah Lengkap */}
      {selectedPilgrim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Detail Profil Jamaah
                </span>
                <h3 className="text-lg font-black text-slate-900">{selectedPilgrim.name}</h3>
                <p className="text-xs text-slate-500">Paket: {selectedPilgrim.package?.name}</p>
              </div>
              <button
                onClick={() => setSelectedPilgrim(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Akun Portal Mandiri Jamaah & Password Card */}
            <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50/70 border border-indigo-200 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2">
                <p className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                  <Key className="w-4 h-4 text-indigo-600" />
                  Akun Akses Portal Mandiri Jamaah (Login & Password)
                </p>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10px] font-bold">
                  Akun Aktif
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Username Login:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 inline-block mt-0.5">
                    {selectedPilgrim.user?.username ||
                      (selectedPilgrim.name || "jamaah")
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, "_")
                        .replace(/[^a-z0-9_]/g, "")}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">Password Akun:</span>
                  <span className="font-mono font-bold text-indigo-950 bg-white px-2.5 py-1 rounded-lg border border-indigo-300 inline-block mt-0.5">
                    {selectedPilgrim.portalPassword || "123456"}
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const usernameVal =
                        selectedPilgrim.user?.username ||
                        (selectedPilgrim.name || "jamaah")
                          .toLowerCase()
                          .trim()
                          .replace(/\s+/g, "_")
                          .replace(/[^a-z0-9_]/g, "");
                      const text = `Akses Portal Jamaah Sulthan Haramain:\nNama: ${selectedPilgrim.name}\nUsername: ${usernameVal}\nPassword: ${selectedPilgrim.portalPassword || "123456"}\nLink Portal: http://localhost:3005`;
                      navigator.clipboard.writeText(text);
                      alert("Akun & password berhasil disalin!");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-indigo-300 text-indigo-900 font-bold text-xs hover:bg-indigo-50 shadow-2xs flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-600" />
                    Salin Akun
                  </button>

                  {selectedPilgrim.phone && (
                    <a
                      href={`https://wa.me/${selectedPilgrim.phone.replace(/[^0-9]/g, "").replace(/^0/, "62")}?text=${encodeURIComponent(
                        `Assalamu'alaikum Bpk/Ibu ${selectedPilgrim.name},\n\nBerikut adalah akses login akun Portal Mandiri Jamaah resmi Anda:\n\n👤 Username: ${
                          selectedPilgrim.user?.username ||
                          (selectedPilgrim.name || "jamaah")
                            .toLowerCase()
                            .trim()
                            .replace(/\s+/g, "_")
                            .replace(/[^a-z0-9_]/g, "")
                        }\n🔑 Password: ${selectedPilgrim.portalPassword || "123456"}\n\nSilakan login untuk memantau kelengkapan dokumen paspor, status visa, jadwal bimbingan manasik, dan doa-doa umroh.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-2xs flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Kirim via WA
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Grid 4 Columns Standard SISKOPATUH Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Kolom 1: Identitas Pribadi */}
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-2 text-xs">
                <p className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" /> 1. Identitas & Ayah
                </p>
                <div>
                  <span className="text-[10px] text-slate-400">Title / Sapaan:</span>
                  <p className="font-bold text-slate-800">{selectedPilgrim.title || "Bpk"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Nama (Kartu Vaksin):</span>
                  <p className="font-bold text-slate-900">{selectedPilgrim.name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Nama Ayah Kandung:</span>
                  <p className="font-bold text-slate-800">{selectedPilgrim.fatherName || "-"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Jenis & No. Identitas:</span>
                  <p className="font-mono font-bold text-slate-800">
                    {selectedPilgrim.identityType || "KTP"}: {selectedPilgrim.nik}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Jenis Kelamin / Gol. Darah:</span>
                  <p className="text-slate-800 font-semibold">
                    {selectedPilgrim.gender === "MALE" ? "Laki-laki" : "Perempuan"} • Gol: {selectedPilgrim.bloodType || "-"}
                  </p>
                </div>
              </div>

              {/* Kolom 2: Paspor RI */}
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-2 text-xs">
                <p className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <FileText className="w-4 h-4 text-blue-600" /> 2. Paspor RI
                </p>
                <div>
                  <span className="text-[10px] text-slate-400">Nama di Paspor:</span>
                  <p className="font-bold text-slate-800">{selectedPilgrim.passportName || selectedPilgrim.name || "-"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Nomor Paspor:</span>
                  <p className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                    {selectedPilgrim.passportNumber || "Belum Ada"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Tgl Dikeluarkan Paspor:</span>
                  <p className="text-slate-800 font-semibold">
                    {selectedPilgrim.passportIssuedDate ? formatDate(selectedPilgrim.passportIssuedDate, "dd/MM/yyyy") : "-"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Kota Kanim Penerbit:</span>
                  <p className="text-slate-800 font-semibold">{selectedPilgrim.passportIssuedCity || "-"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Masa Berlaku Paspor (Exp):</span>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-slate-900 font-bold">
                      {selectedPilgrim.passportExpiry ? formatDate(selectedPilgrim.passportExpiry, "dd/MM/yyyy") : "-"}
                    </span>
                    {(() => {
                      const expInfo = getPassportExpiryStatus(selectedPilgrim.passportExpiry, selectedPilgrim.package?.departureDate);
                      if (expInfo && expInfo.isWarning) {
                        return (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded border ${expInfo.badgeClass}`}>
                            {expInfo.shortBadge}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>

              {/* Kolom 3: TTL & Alamat */}
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-2 text-xs">
                <p className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <MapPin className="w-4 h-4 text-rose-600" /> 3. TTL & Domisili
                </p>
                <div>
                  <span className="text-[10px] text-slate-400">Tempat, Tanggal Lahir:</span>
                  <p className="text-slate-800 font-semibold">
                    {selectedPilgrim.placeOfBirth || "-"},{" "}
                    {selectedPilgrim.dateOfBirth ? formatDate(selectedPilgrim.dateOfBirth, "dd/MM/yyyy") : "-"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Alamat Lengkap:</span>
                  <p className="text-slate-800 leading-tight">{selectedPilgrim.address || "-"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Kelurahan / Desa:</span>
                  <p className="text-slate-800 font-semibold">{selectedPilgrim.subDistrict || "-"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Kecamatan:</span>
                  <p className="text-slate-800 font-semibold">{selectedPilgrim.district || "-"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Kabupaten & Provinsi:</span>
                  <p className="text-slate-800 font-semibold">
                    {[selectedPilgrim.city, selectedPilgrim.province].filter(Boolean).join(", ") || "-"}
                  </p>
                </div>
              </div>

              {/* Kolom 4: Kontak & Demografi */}
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-2 text-xs">
                <p className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <Phone className="w-4 h-4 text-teal-600" /> 4. Kontak & Pekerjaan
                </p>
                <div>
                  <span className="text-[10px] text-slate-400">Nomor HP / WA:</span>
                  <p className="font-bold text-emerald-800">{selectedPilgrim.phone}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">No. Telepon:</span>
                  <p className="text-slate-800 font-semibold">{selectedPilgrim.telephone || "-"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Kewarganegaraan:</span>
                  <p className="text-slate-800 font-semibold">{selectedPilgrim.citizenship || "WNI"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Status Pernikahan:</span>
                  <p className="text-slate-800 font-semibold">{selectedPilgrim.maritalStatus || "-"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Pendidikan & Pekerjaan:</span>
                  <p className="text-slate-800 font-semibold">
                    {selectedPilgrim.education || "-"} • {selectedPilgrim.job || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Banner Khusus Visa Saudi MoFA */}
            <div className="rounded-2xl bg-emerald-50/60 border border-emerald-200 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  Status Dokumen E-Visa Umroh & Provider Saudi
                </p>
                {selectedPilgrim.visaNumber ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">
                    ✅ Visa Terbit
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                    ⏳ Menunggu Penerbitan Visa
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <span className="text-[10px] text-emerald-800">Provider Visa:</span>
                  <p className="font-bold text-emerald-950">{selectedPilgrim.visaProvider || "-"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-800">Nomor E-Visa (MoFA):</span>
                  <p className="font-mono font-bold text-emerald-950">
                    {selectedPilgrim.visaNumber || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-800">Tanggal Berlaku Visa:</span>
                  <p className="font-bold text-emerald-950">
                    {selectedPilgrim.visaIssueDate ? formatDate(selectedPilgrim.visaIssueDate, "dd/MM/yyyy") : "-"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-800">Tanggal Akhir Visa:</span>
                  <p className="font-bold text-emerald-950">
                    {selectedPilgrim.visaExpiryDate ? formatDate(selectedPilgrim.visaExpiryDate, "dd/MM/yyyy") : "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Kartu Status Keuangan, DP & Kekurangan Pelunasan */}
            {(() => {
              const grossPrice = (() => {
                if (!selectedPilgrim.package) return 0;
                if (selectedPilgrim.roomType === "TRIPLE") return selectedPilgrim.package.priceTriple || selectedPilgrim.package.priceQuad || 0;
                if (selectedPilgrim.roomType === "DOUBLE") return selectedPilgrim.package.priceDouble || selectedPilgrim.package.priceQuad || 0;
                return selectedPilgrim.package.priceQuad || 0;
              })();

              const discountAmount = selectedPilgrim.discountAmount || 0;
              const discountReason = selectedPilgrim.discountReason || "";
              const netPrice = Math.max(0, grossPrice - discountAmount);

              const invoicesList = selectedPilgrim.invoices || [];
              const paidInvoices = invoicesList.filter((inv: any) => inv.status === "PAID");
              const totalPaid = paidInvoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
              const remainingBalance = netPrice > 0 ? Math.max(0, netPrice - totalPaid) : 0;
              const isFullySettled = remainingBalance === 0 && (totalPaid > 0 || (netPrice === 0 && grossPrice > 0));

              return (
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-4.5 space-y-3.5 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                        Status Pembayaran Paket, DP & Sisa Pelunasan
                      </h4>
                    </div>
                    {isFullySettled ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                        ✅ LUNAS 100%
                      </span>
                    ) : totalPaid > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold">
                        💳 DP TERBAYAR (Belum Lunas)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                        ❌ BELUM ADA PEMBAYARAN
                      </span>
                    )}
                  </div>

                  {/* Discount Banner if applicable */}
                  {discountAmount > 0 && (
                    <div className="bg-amber-400/20 border border-amber-400/40 rounded-xl p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-300 font-bold">🏷️ Diskon Khusus ({discountReason || "Promo Spesial"}):</span>
                        <span className="font-mono font-black text-amber-200">- {formatCurrency(discountAmount)}</span>
                      </div>
                      <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full">
                        Kewajiban Bersih: {formatCurrency(netPrice)}
                      </span>
                    </div>
                  )}

                  {/* 3 Metric Summary Boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                      <span className="text-[10px] text-emerald-200 block">
                        {discountAmount > 0 ? `Kewajiban Bersih (${selectedPilgrim.roomType || "QUAD"}):` : `Total Biaya Paket (${selectedPilgrim.roomType || "QUAD"}):`}
                      </span>
                      <strong className="text-base font-mono font-black text-white mt-0.5 block">
                        {formatCurrency(netPrice)}
                      </strong>
                      <p className="text-[10px] text-slate-300 mt-0.5 line-clamp-1">
                        {selectedPilgrim.package?.name || "Program Umroh"} {discountAmount > 0 ? `(Normal: ${formatCurrency(grossPrice)})` : ""}
                      </p>
                    </div>

                    <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                      <span className="text-[10px] text-emerald-200 block">Total DP / Sudah Terbayar:</span>
                      <strong className="text-base font-mono font-black text-emerald-300 mt-0.5 block">
                        {formatCurrency(totalPaid)}
                      </strong>
                      <p className="text-[10px] text-emerald-200/80 mt-0.5">
                        {paidInvoices.length} Transaksi Diterima
                      </p>
                    </div>

                    <div className={`rounded-xl p-3 border ${remainingBalance > 0 ? "bg-amber-500/20 border-amber-400/40" : "bg-emerald-500/20 border-emerald-400/40"}`}>
                      <span className="text-[10px] text-amber-200 font-bold block">Kekurangan Pelunasan (Sisa):</span>
                      <strong className={`text-base font-mono font-black mt-0.5 block ${remainingBalance > 0 ? "text-amber-300" : "text-emerald-300"}`}>
                        {formatCurrency(remainingBalance)}
                      </strong>
                      <p className="text-[10px] text-slate-300 mt-0.5">
                        {remainingBalance > 0 ? "⚠️ Wajib dilunasi H-30 sebelum berangkat" : "✨ Sudah Lunas Penuh"}
                      </p>
                    </div>
                  </div>

                  {/* Riwayat Invoice Terbit */}
                  {invoicesList.length > 0 && (
                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      <p className="text-[11px] font-bold text-slate-300">Rincian Invoice Terdaftar:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {invoicesList.map((inv: any) => (
                          <div key={inv.id} className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-mono font-bold text-amber-300">{inv.invoiceNumber}</span>
                              <span className="text-[10px] text-slate-400 block">{inv.title}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold">{formatCurrency(inv.amount)}</span>
                              <span className={`text-[9px] font-bold block ${inv.status === "PAID" ? "text-emerald-300" : "text-amber-300"}`}>
                                {inv.status === "PAID" ? "✅ Lunas" : "⏳ Pending"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Riwayat Dokumen & Ceklis Syarat */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900">Dokumen Ceklis Persyaratan Umroh</p>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  {selectedPilgrim.requirements?.filter((r: any) => r.isVerified).length} / {selectedPilgrim.requirements?.length || 6} Terverifikasi
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedPilgrim.requirements?.map((req: any) => (
                  <div
                    key={req.id}
                    className={`p-2.5 rounded-xl border text-[11px] ${
                      req.isVerified
                        ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                        : req.isSubmitted
                        ? "bg-amber-50/60 border-amber-200 text-amber-900"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    <p className="font-semibold line-clamp-1">{req.name}</p>
                    <p className="text-[10px] mt-0.5">
                      {req.isVerified ? "✅ Terverifikasi" : req.isSubmitted ? "⏳ Diserahkan" : "❌ Belum Lengkap"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap gap-1.5">
                {onNavigateTab && (
                  <>
                    <button
                      onClick={() => {
                        const name = selectedPilgrim.name;
                        setSelectedPilgrim(null);
                        onNavigateTab("finance", name);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold hover:bg-amber-100"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Kelola Invoice
                    </button>

                    <button
                      onClick={() => {
                        const name = selectedPilgrim.name;
                        setSelectedPilgrim(null);
                        onNavigateTab("handovers", name);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold hover:bg-blue-100"
                    >
                      <Boxes className="w-3.5 h-3.5" /> Form Logistik (BAST)
                    </button>

                    <button
                      onClick={() => {
                        const name = selectedPilgrim.name;
                        setSelectedPilgrim(null);
                        onNavigateTab("requirements", name);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold hover:bg-teal-100"
                    >
                      <FileCheck className="w-3.5 h-3.5" /> Ceklis Berkas
                    </button>
                  </>
                )}

                {onOpenLetterGenerator && (
                  <button
                    onClick={() => {
                      const p = selectedPilgrim;
                      setSelectedPilgrim(null);
                      onOpenLetterGenerator(p);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold hover:bg-purple-100"
                  >
                    <FileText className="w-3.5 h-3.5" /> Buat Surat Resmi
                  </button>
                )}
              </div>

                <button
                  onClick={() => {
                    const p = selectedPilgrim;
                    handleOpenEdit(p);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400"
                >
                  <Pencil className="w-3.5 h-3.5" /> Ubah Data Jamaah
                </button>

                <button
                  onClick={() => {
                    const p = selectedPilgrim;
                    handleDeletePilgrim(p.id, p.name);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Jamaah
                </button>

                <button
                  onClick={() => setSelectedPilgrim(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Tutup
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Jamaah Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                Tambah Jamaah Baru (Master Data)
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* KTP & KK AI / OCR SCANNER DROPZONE */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-dashed border-emerald-300 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Scan className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      📷 Scan e-KTP & 📄 Kartu Keluarga (KK) Otomatis
                      <span className="text-[9px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.2 rounded-md">
                        AUTO-FILL & EDIT
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Unggah foto KTP atau Kartu Keluarga (KK). Sistem akan mengekstrak NIK, Nama, TTL, Jenis Kelamin, Mahram & seluruh anggota keluarga (dapat diedit).
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Upload KTP Button */}
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs transition-all">
                    {isScanningKtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Membaca KTP...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" /> Upload Foto KTP
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isScanningKtp || isScanningKk}
                      onChange={(e) => handleKtpFileChange(e, false)}
                      className="hidden"
                    />
                  </label>

                  {/* Upload KK Button */}
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 shadow-xs transition-all">
                    {isScanningKk ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Membaca KK...
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" /> Upload Kartu Keluarga (KK)
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isScanningKtp || isScanningKk}
                      onChange={(e) => handleKkFileChange(e, false)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Status & Preview Banner */}
              {(isScanningKtp || isScanningKk) && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 text-xs font-semibold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>
                    {isScanningKk
                      ? "Sedang memproses OCR & membaca tabel anggota Kartu Keluarga (KK)..."
                      : "Sedang memproses OCR & mengekstrak data dari foto e-KTP..."}
                  </span>
                </div>
              )}

              {ocrSuccessMsg && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-950 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{ocrSuccessMsg}</p>
                    <p className="text-[10px] text-emerald-800 mt-0.5">
                      Periksa kembali data di bawah. Anda dapat mengedit nama/NIK sebelum menyimpan atau mendaftar.
                    </p>
                  </div>
                </div>
              )}

              {/* KK Parsed Members Table (Editable) */}
              {kkMembers.length > 0 && (
                <div className="bg-white p-3.5 rounded-2xl border border-teal-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-teal-600" />
                        Tabel Anggota Kartu Keluarga ({kkMembers.length} Orang Terbaca)
                      </h5>
                      <p className="text-[10px] text-slate-500">
                        No. KK: <span className="font-mono font-bold text-slate-800">{kkParsedData?.noKk || "-"}</span> | Kepala Keluarga: <span className="font-bold text-slate-800">{kkParsedData?.headOfFamily || "-"}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleBatchAddKkMembers}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Daftarkan Semua ({kkMembers.length} Anggota) Sekaligus
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold text-[11px]">
                          <th className="py-2 px-2.5">No</th>
                          <th className="py-2 px-2.5">Nama Lengkap (Bisa Diedit)</th>
                          <th className="py-2 px-2.5">NIK (Bisa Diedit)</th>
                          <th className="py-2 px-2.5">Hubungan</th>
                          <th className="py-2 px-2.5">L/P</th>
                          <th className="py-2 px-2.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {kkMembers.map((m, mIdx) => (
                          <tr key={mIdx} className="hover:bg-slate-50/70">
                            <td className="py-2 px-2.5 font-bold text-slate-400">{mIdx + 1}</td>
                            <td className="py-2 px-2.5">
                              <input
                                type="text"
                                value={m.name}
                                onChange={(e) => handleUpdateKkMember(mIdx, "name", e.target.value)}
                                className="w-full font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-1 text-xs bg-slate-50 focus:bg-white"
                              />
                            </td>
                            <td className="py-2 px-2.5">
                              <input
                                type="text"
                                maxLength={16}
                                value={m.nik}
                                onChange={(e) => handleUpdateKkMember(mIdx, "nik", e.target.value)}
                                className="w-36 font-mono font-bold text-slate-800 border border-slate-200 rounded-lg px-2 py-1 text-xs bg-slate-50 focus:bg-white"
                              />
                            </td>
                            <td className="py-2 px-2.5">
                              <select
                                value={m.relation}
                                onChange={(e) => handleUpdateKkMember(mIdx, "relation", e.target.value)}
                                className="border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold bg-slate-50"
                              >
                                <option value="KEPALA KELUARGA">Kepala Keluarga</option>
                                <option value="ISTRI">Istri</option>
                                <option value="ANAK">Anak</option>
                                <option value="ORANG TUA">Orang Tua / Ayah / Ibu</option>
                                <option value="FAMILI LAIN">Famili Lain</option>
                              </select>
                            </td>
                            <td className="py-2 px-2.5">
                              <select
                                value={m.gender}
                                onChange={(e) => handleUpdateKkMember(mIdx, "gender", e.target.value)}
                                className="border border-slate-200 rounded-lg px-1.5 py-1 text-[11px] font-semibold bg-slate-50"
                              >
                                <option value="MALE">Laki-laki</option>
                                <option value="FEMALE">Perempuan</option>
                              </select>
                            </td>
                            <td className="py-2 px-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleSelectKkMember(m, false)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[11px] border border-teal-200 transition-all"
                              >
                                ⬇️ Pakai di Form
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Photo Previews */}
              <div className="flex flex-wrap items-center gap-3">
                {ktpPreviewUrl && (
                  <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-emerald-200">
                    <img
                      src={ktpPreviewUrl}
                      alt="Preview KTP"
                      className="w-16 h-10 object-cover rounded-lg border border-slate-200 shadow-2xs"
                    />
                    <div className="text-[11px] text-slate-600">
                      <p className="font-bold text-slate-900">Foto e-KTP</p>
                      <button
                        type="button"
                        onClick={() => {
                          setKtpPreviewUrl(null);
                          setOcrSuccessMsg(null);
                        }}
                        className="text-[10px] text-rose-600 font-bold hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )}

                {kkPreviewUrl && (
                  <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-teal-200">
                    <img
                      src={kkPreviewUrl}
                      alt="Preview KK"
                      className="w-16 h-10 object-cover rounded-lg border border-slate-200 shadow-2xs"
                    />
                    <div className="text-[11px] text-slate-600">
                      <p className="font-bold text-slate-900">Foto Kartu Keluarga</p>
                      <button
                        type="button"
                        onClick={() => {
                          setKkPreviewUrl(null);
                          setKkParsedData(null);
                          setKkMembers([]);
                          setOcrSuccessMsg(null);
                        }}
                        className="text-[10px] text-rose-600 font-bold hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleAddPilgrim} className="space-y-4 text-xs">
              {/* SEKSI 1: NAMA JAMAAH & IDENTITAS (STANDAR SISKOPATUH) */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200/70 pb-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>1. IDENTITAS JAMAAH & KELUARGA (STANDAR SISKOPATUH)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Title / Sapaan</label>
                    <select
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-900"
                    >
                      <option value="Bpk">Bpk (Tuan)</option>
                      <option value="Ibu">Ibu (Nyonya)</option>
                      <option value="Sdr">Sdr (Saudara)</option>
                      <option value="Sdri">Sdri (Saudari / Nona)</option>
                      <option value="H.">H. (Haji)</option>
                      <option value="Hj.">Hj. (Hajjah)</option>
                      <option value="Ustadz">Ustadz</option>
                      <option value="Ustadzah">Ustadzah</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Prof.">Prof.</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="font-bold text-slate-700">Nama Lengkap (Sesuai Kartu Vaksin & Paspor) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. H. BAMBANG SULISTYO"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Jenis Identitas</label>
                    <select
                      value={formData.identityType}
                      onChange={(e) => setFormData({ ...formData, identityType: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    >
                      <option value="KTP">e-KTP (WNI)</option>
                      <option value="PASPOR">Paspor</option>
                      <option value="KITAS">KITAS / WNA</option>
                      <option value="SIM">SIM</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700">Nomor Identitas (NIK) *</label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      placeholder="16 Digit NIK e-KTP"
                      value={formData.nik}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
                  <div>
                    <label className="font-bold text-slate-800 flex items-center justify-between">
                      <span>Nama Ayah Kandung (Pria) *</span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Otomatis Saran Endos 3 Kata
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. H. AHMAD DAHLAN"
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value.toUpperCase() })}
                      className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Digunakan sistem untuk rekomendasi otomatis penambahan 3 kata di paspor / surat endorsement.
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800">Nama Ibu Kandung (Wanita)</label>
                    <input
                      type="text"
                      placeholder="e.g. HJ. SITI AMINAH"
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value.toUpperCase() })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Kelengkapan data keluarga untuk manifes SISKOPATUH Kemenag RI.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200/60">
                  <div>
                    <label className="font-bold text-slate-700">Jenis Kelamin</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    >
                      <option value="MALE">Laki-laki</option>
                      <option value="FEMALE">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Golongan Darah</label>
                    <select
                      value={formData.bloodType}
                      onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                      <option value="TIDAK_TAHU">Tidak Tahu</option>
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="font-bold text-slate-700">Kewarganegaraan</label>
                    <select
                      value={formData.citizenship}
                      onChange={(e) => setFormData({ ...formData, citizenship: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    >
                      <option value="WNI">WNI (Indonesia)</option>
                      <option value="WNA">WNA (Asing)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SEKSI 2: PROGRAM PAKET & TANGGAL */}
              <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/80 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 border-b border-emerald-200 pb-2">
                  <Plane className="w-4 h-4 text-emerald-700" />
                  <span>2. PROGRAM PAKET & TANGGAL KEBERANGKATAN</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="font-bold text-slate-800">Pilih Paket Keberangkatan *</label>
                    <select
                      required
                      value={formData.packageId}
                      onChange={(e) => setFormData({ ...formData, packageId: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} - Berangkat {formatDate(pkg.departureDate, "dd MMM yyyy")} ({formatCurrency(pkg.priceQuad)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-800">Nominal DP Awal (Rp)</label>
                    <input
                      type="number"
                      value={formData.initialDpAmount}
                      onChange={(e) => setFormData({ ...formData, initialDpAmount: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white font-bold text-emerald-800 text-sm"
                    />
                  </div>
                </div>

                {/* Opsi Diskon Khusus Jamaah */}
                <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.hasDiscount}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData({
                            ...formData,
                            hasDiscount: checked,
                            discountAmount: checked ? (formData.discountAmount || "4000000") : "",
                            discountReason: checked ? (formData.discountReason || "Promo Spesial Keberangkatan") : "",
                          });
                        }}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="font-bold text-amber-950 text-xs">
                        🏷️ Berikan Diskon Khusus / Potongan Harga Promo
                      </span>
                    </label>
                    {formData.hasDiscount && (
                      <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                        Diskon Aktif
                      </span>
                    )}
                  </div>

                  {formData.hasDiscount && (
                    <div className="space-y-2 pt-1 border-t border-amber-200">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, discountAmount: "4000000", discountReason: "Promo Spesial Keberangkatan" })}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${formData.discountAmount === "4000000" ? "bg-amber-600 text-white border-amber-700" : "bg-white text-slate-700 border-amber-200"}`}
                        >
                          🔥 Promo Rp 4 Jt
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, discountAmount: "3000000", discountReason: "Diskon Khusus Tokoh / Ustadz" })}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${formData.discountAmount === "3000000" ? "bg-amber-600 text-white border-amber-700" : "bg-white text-slate-700 border-amber-200"}`}
                        >
                          👳 Tokoh Rp 3 Jt
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, discountAmount: "2000000", discountReason: "Diskon Keluarga / Mitra" })}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${formData.discountAmount === "2000000" ? "bg-amber-600 text-white border-amber-700" : "bg-white text-slate-700 border-amber-200"}`}
                        >
                          👨‍👩‍👧 Keluarga Rp 2 Jt
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, discountAmount: "1000000", discountReason: "Early Bird / Booking Awal" })}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${formData.discountAmount === "1000000" ? "bg-amber-600 text-white border-amber-700" : "bg-white text-slate-700 border-amber-200"}`}
                        >
                          ⚡ Early Bird Rp 1 Jt
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Nominal Potongan (Rp)</label>
                          <input
                            type="number"
                            value={formData.discountAmount}
                            onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 font-bold text-amber-900 bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Alasan / Jenis Diskon</label>
                          <input
                            type="text"
                            value={formData.discountReason}
                            onChange={(e) => setFormData({ ...formData, discountReason: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 font-medium text-slate-800 bg-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SEKSI 3: PASPOR, VISA SAUDI & TTL */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200/70 pb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>3. PASPOR, VISA SAUDI & TEMPAT TANGGAL LAHIR</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Tempat Lahir</label>
                    <input
                      type="text"
                      placeholder="e.g. Tebing Tinggi / Medan"
                      value={formData.placeOfBirth}
                      onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value.toUpperCase() })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>Tanggal Lahir (yyyy-mm-dd)</span>
                      {calculateAge(formData.dateOfBirth) !== null && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            calculateAge(formData.dateOfBirth)! < 17
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          }`}
                        >
                          Usia: {calculateAge(formData.dateOfBirth)} Tahun{" "}
                          {calculateAge(formData.dateOfBirth)! < 17 ? "👶 (< 17 Thn)" : "👤 (Dewasa)"}
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    />
                  </div>
                </div>

                {/* SUB-SECTION 1: STATUS PASPOR */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <label className="font-bold text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Apakah Jamaah Sudah Memiliki Paspor?</span>
                      </label>
                      <p className="text-[10px] text-slate-500">Pilih "Sudah Ada" jika paspor fisik sudah tersedia.</p>
                    </div>

                    <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            hasPassport: false,
                            passportName: "",
                            passportNumber: "",
                            passportIssuedDate: "",
                            passportIssuedCity: "",
                            passportExpiry: "",
                          })
                        }
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          !formData.hasPassport
                            ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        ❌ Belum Ada Paspor
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, hasPassport: true, passportName: formData.passportName || formData.name })}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          formData.hasPassport
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        ✅ Sudah Ada Paspor
                      </button>
                    </div>
                  </div>

                  {formData.hasPassport ? (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700">Nama Paspor (Sesuai Buku Paspor) *</label>
                          <input
                            type="text"
                            required={formData.hasPassport}
                            placeholder="e.g. BAMBANG SULISTYO AHMAD"
                            value={formData.passportName}
                            onChange={(e) => setFormData({ ...formData, passportName: e.target.value.toUpperCase() })}
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 font-bold text-slate-900 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700">Nomor Paspor RI *</label>
                          <input
                            type="text"
                            required={formData.hasPassport}
                            placeholder="e.g. C8921475"
                            value={formData.passportNumber}
                            onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value.toUpperCase() })}
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 font-mono font-bold text-slate-900 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-bold text-slate-700">Tanggal Dikeluarkan Paspor</label>
                          <input
                            type="date"
                            value={formData.passportIssuedDate}
                            onChange={(e) => setFormData({ ...formData, passportIssuedDate: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 text-slate-900 focus:bg-white font-semibold"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700">Kota / Kantor Imigrasi Paspor</label>
                          <input
                            type="text"
                            placeholder="e.g. Kanim Medan / Pematangsiantar"
                            value={formData.passportIssuedCity}
                            onChange={(e) => setFormData({ ...formData, passportIssuedCity: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 text-slate-900 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700">Masa Berlaku Paspor (Expiry) *</label>
                          <input
                            type="date"
                            required={formData.hasPassport}
                            value={formData.passportExpiry}
                            onChange={(e) => setFormData({ ...formData, passportExpiry: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 text-slate-900 focus:bg-white font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-[11px] flex items-center gap-2">
                      <span className="text-base">⏳</span>
                      <span>Paspor belum ada / sedang proses di kantor Imigrasi. Kolom data paspor disembunyikan dan dapat dilengkapi menyusul saat edit data.</span>
                    </div>
                  )}
                </div>

                {/* SUB-SECTION 2: STATUS E-VISA */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <label className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        <span>Apakah E-Visa Umroh Sudah Diterbitkan?</span>
                      </label>
                      <p className="text-[10px] text-slate-500">Pilih "Sudah Terbit" jika visa dari MoFA Saudi sudah keluar.</p>
                    </div>

                    <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            hasVisa: false,
                            visaProvider: "",
                            visaNumber: "",
                            visaIssueDate: "",
                            visaExpiryDate: "",
                            mofaNumber: "",
                            muassasahName: "",
                            insuranceNumber: "",
                          })
                        }
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          !formData.hasVisa
                            ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        ⏳ Belum Terbit Visa
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, hasVisa: true })}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          formData.hasVisa
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        ✅ Sudah Terbit Visa
                      </button>
                    </div>
                  </div>

                  {formData.hasVisa ? (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700">Provider Visa</label>
                          <input
                            type="text"
                            placeholder="e.g. PT Barokah Sulthan Haramain / Dallah"
                            value={formData.visaProvider}
                            onChange={(e) => setFormData({ ...formData, visaProvider: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-emerald-50/40 font-semibold text-emerald-900 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700">Nomor E-Visa Saudi (MoFA) *</label>
                          <input
                            type="text"
                            required={formData.hasVisa}
                            placeholder="e.g. 6098234123"
                            value={formData.visaNumber}
                            onChange={(e) => setFormData({ ...formData, visaNumber: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-emerald-50/40 font-mono font-bold text-emerald-900 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-bold text-slate-700">Tanggal Berlaku Visa</label>
                          <input
                            type="date"
                            value={formData.visaIssueDate}
                            onChange={(e) => setFormData({ ...formData, visaIssueDate: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 text-slate-900 focus:bg-white font-semibold"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700">Tanggal Akhir Visa</label>
                          <input
                            type="date"
                            value={formData.visaExpiryDate}
                            onChange={(e) => setFormData({ ...formData, visaExpiryDate: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 text-slate-900 focus:bg-white font-semibold"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700">Nomor MOFA Saudi</label>
                          <input
                            type="text"
                            placeholder="e.g. MOFA-881920"
                            value={formData.mofaNumber}
                            onChange={(e) => setFormData({ ...formData, mofaNumber: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-[11px] flex items-center gap-2">
                      <span className="text-base">🕋</span>
                      <span>E-Visa belum terbit dari Kementerian Haji & Umrah Saudi. Kolom data visa disembunyikan dan dapat diinput menyusul saat edit data.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SEKSI 4: ALAMAT LENGKAP & DOMISILI */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200/70 pb-2">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  <span>4. ALAMAT LENGKAP DOMISILI</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Alamat Jalan / Dusun / RT RW</label>
                  <input
                    type="text"
                    placeholder="e.g. Jl. Pahlawan No. 10 J RT 02/RW 03"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Kelurahan / Desa</label>
                    <input
                      type="text"
                      placeholder="e.g. Pasar Gambir"
                      value={formData.subDistrict}
                      onChange={(e) => setFormData({ ...formData, subDistrict: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Kecamatan</label>
                    <input
                      type="text"
                      placeholder="e.g. Tebing Tinggi Kota"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Kabupaten / Kota</label>
                    <input
                      type="text"
                      placeholder="e.g. Tebing Tinggi"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Provinsi</label>
                    <input
                      type="text"
                      placeholder="e.g. Sumatera Utara"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SEKSI 5: KONTAK & DEMOGRAFI */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200/70 pb-2">
                  <Phone className="w-4 h-4 text-teal-600" />
                  <span>5. KONTAK, DEMOGRAFI & MAHRAM</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Nomor HP / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      placeholder="08123456789"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">No. Telepon (Rumah/Kantor)</label>
                    <input
                      type="tel"
                      placeholder="0621-123456"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Email Jamaah</label>
                    <input
                      type="email"
                      placeholder="jamaah@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200/60">
                  <div>
                    <label className="font-bold text-slate-700">Status Pernikahan</label>
                    <select
                      value={formData.maritalStatus}
                      onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    >
                      <option value="MENIKAH">Menikah</option>
                      <option value="BELUM_MENIKAH">Belum Menikah</option>
                      <option value="CERAI_HIDUP">Cerai Hidup</option>
                      <option value="CERAI_MATI">Cerai Mati</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Pendidikan Terakhir</label>
                    <select
                      value={formData.education}
                      onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    >
                      <option value="SMA">SMA / SMK / MA</option>
                      <option value="S1">Sarjana (S1)</option>
                      <option value="S2">Magister (S2)</option>
                      <option value="S3">Doktor (S3)</option>
                      <option value="D3">Diploma (D3)</option>
                      <option value="SMP">SMP / MTs</option>
                      <option value="SD">SD / MI</option>
                      <option value="LAINNYA">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Pekerjaan</label>
                    <select
                      value={formData.job}
                      onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    >
                      <option value="SWASTA">Karyawan Swasta</option>
                      <option value="WIRASWASTA">Wiraswasta / Usaha</option>
                      <option value="PNS">PNS / ASN</option>
                      <option value="TNI_POLRI">TNI / POLRI</option>
                      <option value="IBU_RUMAH_TANGGA">Ibu Rumah Tangga</option>
                      <option value="PENSIUNAN">Pensiunan</option>
                      <option value="BUMN">BUMN / BUMD</option>
                      <option value="DOKTER_MEDIS">Tenaga Medis / Dokter</option>
                      <option value="GURU_DOSEN">Guru / Dosen</option>
                      <option value="PELAJAR_MAHASISWA">Pelajar / Mahasiswa</option>
                      <option value="LAINNYA">Lainnya</option>
                    </select>
                  </div>
                </div>

                {/* SMART CONDITIONAL MAHRAM & GUARDIAN SECTION */}
                {(() => {
                  const addAge = calculateAge(formData.dateOfBirth);
                  const addIsUnder17 = addAge !== null && addAge < 17;
                  const addIsFemale = formData.gender === "FEMALE";
                  const samePackagePilgrims = pilgrims.filter((p) => p.packageId === (formData.packageId || packages[0]?.id));
                  const malePilgrimsInPackage = samePackagePilgrims.filter((p) => p.gender === "MALE");

                  if (addIsUnder17) {
                    return (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/70 p-3.5 rounded-2xl border border-blue-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-blue-950 text-xs">
                            <UserCheck className="w-4 h-4 text-blue-600" />
                            <span>Deteksi Usia: Jamaah Berusia di Bawah 17 Tahun ({addAge} Tahun)</span>
                          </div>
                          <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-md border border-blue-200">
                            Regulasi Perlindungan Anak
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-xs block">
                            Apakah ada orang tua / keluarga yang ikut serta mendampingi dalam keberangkatan ini?
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setAddHasGuardianOption(true);
                                setFormData((prev) => ({
                                  ...prev,
                                  mahramRelation: prev.mahramRelation || "AYAH KANDUNG",
                                }));
                              }}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                addHasGuardianOption === true || (addHasGuardianOption === null && Boolean(formData.mahramName))
                                  ? "bg-blue-600 text-white shadow-xs"
                                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              ✅ Ya, Ada Orang Tua / Pendamping
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAddHasGuardianOption(false);
                                setFormData((prev) => ({
                                  ...prev,
                                  mahramName: "",
                                  mahramRelation: "TANPA PENDAMPING ORANG TUA (TL/MUTHAWWIF)",
                                }));
                              }}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                addHasGuardianOption === false
                                  ? "bg-slate-800 text-white shadow-xs"
                                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              ❌ Tidak Ada (Pendampingan Petugas / TL)
                            </button>
                          </div>
                        </div>

                        {(addHasGuardianOption === true || (addHasGuardianOption === null && Boolean(formData.mahramName))) && (
                          <div className="pt-2 border-t border-blue-200/60 space-y-3">
                            <div>
                              <label className="font-bold text-slate-800 text-xs block mb-1">
                                Pilih Hubungan Pendamping / Wali:
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {[
                                  { label: "Ayah Kandung", val: "AYAH KANDUNG" },
                                  { label: "Ibu Kandung", val: "IBU KANDUNG" },
                                  { label: "Kakak / Abang", val: "KAKAK / ABANG KANDUNG" },
                                  { label: "Wali / Keluarga Lain", val: "WALI KELUARGA" },
                                ].map((rel) => (
                                  <button
                                    key={rel.val}
                                    type="button"
                                    onClick={() => {
                                      setAddGuardianRelationType(rel.val);
                                      setFormData((prev) => ({ ...prev, mahramRelation: rel.val }));
                                    }}
                                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                                      (formData.mahramRelation || addGuardianRelationType) === rel.val
                                        ? "bg-indigo-600 text-white shadow-xs"
                                        : "bg-white border border-blue-200 text-blue-900 hover:bg-blue-100/50"
                                    }`}
                                  >
                                    {rel.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Pick from database in same package */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="font-bold text-slate-800 text-xs">
                                  Pilih Nama Pendamping dari Jamaah Paket Keberangkatan yang Sama:
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setAddMahramInputMode(addMahramInputMode === "DB" ? "MANUAL" : "DB")}
                                  className="text-[10px] text-blue-700 font-bold hover:underline"
                                >
                                  {addMahramInputMode === "DB" ? "✏️ Input Manual" : "📋 Pilih dari Database Paket"}
                                </button>
                              </div>

                              {addMahramInputMode === "DB" ? (
                                <select
                                  value={formData.mahramName}
                                  onChange={(e) => {
                                    const selectedName = e.target.value;
                                    const currentRel = formData.mahramRelation || addGuardianRelationType;
                                    setFormData((prev) => ({
                                      ...prev,
                                      mahramName: selectedName,
                                      fatherName: currentRel === "AYAH KANDUNG" ? selectedName : prev.fatherName,
                                      motherName: currentRel === "IBU KANDUNG" ? selectedName : prev.motherName,
                                    }));
                                  }}
                                  className="w-full rounded-xl border border-blue-300 p-2.5 bg-white font-bold text-slate-900 text-xs"
                                >
                                  <option value="">-- Pilih Jamaah dari Database Paket Ini --</option>
                                  {((formData.mahramRelation || addGuardianRelationType) === "AYAH KANDUNG"
                                    ? samePackagePilgrims.filter((p) => p.gender === "MALE")
                                    : (formData.mahramRelation || addGuardianRelationType) === "IBU KANDUNG"
                                    ? samePackagePilgrims.filter((p) => p.gender === "FEMALE")
                                    : samePackagePilgrims
                                  ).map((p) => (
                                    <option key={p.id} value={p.name}>
                                      {p.name} (NIK: {p.nik || "-"}) - {p.gender === "MALE" ? "Laki-laki" : "Perempuan"}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Ketik nama pendamping / wali..."
                                  value={formData.mahramName}
                                  onChange={(e) => setFormData({ ...formData, mahramName: e.target.value })}
                                  className="w-full rounded-xl border border-blue-300 p-2.5 bg-white font-bold text-slate-900 text-xs"
                                />
                              )}
                              <p className="text-[10px] text-slate-500 mt-1">
                                💡 Data otomatis ditarik dari manifest jamaah yang terdaftar pada paket keberangkatan ini.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (addIsFemale) {
                    return (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50/60 p-3.5 rounded-2xl border border-purple-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-purple-950 text-xs">
                            <UserCheck className="w-4 h-4 text-purple-700" />
                            <span>Ketentuan Mahram Jamaah Wanita ({addAge !== null ? `${addAge} Tahun` : "Dewasa"})</span>
                          </div>
                          <span className="text-[10px] bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded-md border border-purple-200">
                            Syarat Visa Umroh Saudi
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-xs block">
                            Apakah jamaah memiliki mahram dalam keberangkatan umroh ini?
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setAddHasMahramOption(true);
                                setFormData((prev) => ({
                                  ...prev,
                                  mahramRelation: prev.mahramRelation || "SUAMI",
                                }));
                              }}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                addHasMahramOption === true || (addHasMahramOption === null && Boolean(formData.mahramName))
                                  ? "bg-purple-700 text-white shadow-xs"
                                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              ✅ Ya, Memiliki Mahram
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAddHasMahramOption(false);
                                setFormData((prev) => ({
                                  ...prev,
                                  mahramName: "",
                                  mahramRelation: "MANDIRI / TANPA MAHRAM",
                                }));
                              }}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                addHasMahramOption === false
                                  ? "bg-slate-800 text-white shadow-xs"
                                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              ❌ Tidak (Berangkat Mandiri)
                            </button>
                          </div>
                        </div>

                        {(addHasMahramOption === true || (addHasMahramOption === null && Boolean(formData.mahramName))) && (
                          <div className="pt-2 border-t border-purple-200/60 space-y-3">
                            <div>
                              <label className="font-bold text-slate-800 text-xs block mb-1">
                                Pilih Hubungan Mahram:
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {[
                                  { label: "Suami", val: "SUAMI" },
                                  { label: "Ayah Kandung", val: "AYAH KANDUNG" },
                                  { label: "Anak Laki-laki", val: "ANAK LAKI-LAKI" },
                                  { label: "Saudara Kandung", val: "SAUDARA KANDUNG" },
                                  { label: "Paman / Kakek", val: "PAMAN / KAKEK" },
                                ].map((rel) => (
                                  <button
                                    key={rel.val}
                                    type="button"
                                    onClick={() => {
                                      setFormData((prev) => ({ ...prev, mahramRelation: rel.val }));
                                    }}
                                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                                      (formData.mahramRelation || "SUAMI") === rel.val
                                        ? "bg-purple-700 text-white shadow-xs"
                                        : "bg-white border border-purple-200 text-purple-900 hover:bg-purple-100/50"
                                    }`}
                                  >
                                    {rel.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Pick from database in same package */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="font-bold text-slate-800 text-xs">
                                  Pilih Nama Mahram dari Jamaah Pria di Paket Keberangkatan yang Sama:
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setAddMahramInputMode(addMahramInputMode === "DB" ? "MANUAL" : "DB")}
                                  className="text-[10px] text-purple-700 font-bold hover:underline"
                                >
                                  {addMahramInputMode === "DB" ? "✏️ Input Manual" : "📋 Pilih dari Database Paket"}
                                </button>
                              </div>

                              {addMahramInputMode === "DB" ? (
                                <select
                                  value={formData.mahramName}
                                  onChange={(e) => {
                                    const selectedName = e.target.value;
                                    setFormData((prev) => ({
                                      ...prev,
                                      mahramName: selectedName,
                                      fatherName: formData.mahramRelation === "AYAH KANDUNG" ? selectedName : prev.fatherName,
                                    }));
                                  }}
                                  className="w-full rounded-xl border border-purple-300 p-2.5 bg-white font-bold text-slate-900 text-xs"
                                >
                                  <option value="">-- Pilih Mahram Pria dari Database Paket Ini --</option>
                                  {malePilgrimsInPackage.map((p) => (
                                    <option key={p.id} value={p.name}>
                                      {p.name} (NIK: {p.nik || "-"})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Ketik nama mahram..."
                                  value={formData.mahramName}
                                  onChange={(e) => setFormData({ ...formData, mahramName: e.target.value })}
                                  className="w-full rounded-xl border border-purple-300 p-2.5 bg-white font-bold text-slate-900 text-xs"
                                />
                              )}
                              <p className="text-[10px] text-slate-500 mt-1">
                                💡 Data otomatis memfilter jamaah laki-laki yang terdaftar pada paket keberangkatan ini.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700">Nama Mahram / Kerabat yang Disertai (Opsional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Ibu Fatimah (Istri / Ibu)"
                          value={formData.mahramName}
                          onChange={(e) => setFormData({ ...formData, mahramName: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700">Hubungan Kerabat</label>
                        <input
                          type="text"
                          placeholder="e.g. Istri / Ibu Kandung"
                          value={formData.mahramRelation}
                          onChange={(e) => setFormData({ ...formData, mahramRelation: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                        />
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Kontak Darurat Keluarga</label>
                    <input
                      type="text"
                      placeholder="e.g. Ibu Siti (Istri)"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">No. HP Darurat</label>
                    <input
                      type="tel"
                      placeholder="08198765432"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SEKSI 6: CATATAN KESEHATAN & KHUSUS */}
              <div>
                <label className="font-bold text-slate-700">Catatan Riwayat Kesehatan & Kebutuhan Khusus</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Membutuhkan bantuan kursi roda saat tawaf, riwayat alergi obat, dll..."
                  value={formData.healthNotes}
                  onChange={(e) => setFormData({ ...formData, healthNotes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
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
                  className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm"
                >
                  {loading ? "Menyimpan..." : "Simpan Jamaah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Data Jamaah */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-600" />
                Edit / Ubah Data Jamaah
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* KTP & KK AI / OCR SCANNER IN EDIT MODAL */}
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                    <Scan className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      📷 Update Data dari e-KTP / 📄 Kartu Keluarga
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Scan foto KTP atau KK untuk memperbarui NIK, Nama, TTL, Mahram & Alamat secara instan.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 shadow-xs transition-all">
                    {isScanningKtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Membaca KTP...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" /> Upload e-KTP
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isScanningKtp || isScanningKk}
                      onChange={(e) => handleKtpFileChange(e, true)}
                      className="hidden"
                    />
                  </label>

                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 shadow-xs transition-all">
                    {isScanningKk ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Membaca KK...
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" /> Upload KK
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isScanningKtp || isScanningKk}
                      onChange={(e) => handleKkFileChange(e, true)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {ocrSuccessMsg && (
                <div className="p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 text-xs font-semibold">
                  {ocrSuccessMsg}
                </div>
              )}
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* SEKSI 1: IDENTITAS JAMAAH & KELUARGA (STANDAR SISKOPATUH) */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200/70 pb-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>1. IDENTITAS JAMAAH & KELUARGA (STANDAR SISKOPATUH)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Title / Sapaan</label>
                    <select
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-900"
                    >
                      <option value="Bpk">Bpk (Tuan)</option>
                      <option value="Ibu">Ibu (Nyonya)</option>
                      <option value="Sdr">Sdr (Saudara)</option>
                      <option value="Sdri">Sdri (Saudari / Nona)</option>
                      <option value="H.">H. (Haji)</option>
                      <option value="Hj.">Hj. (Hajjah)</option>
                      <option value="Ustadz">Ustadz</option>
                      <option value="Ustadzah">Ustadzah</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Prof.">Prof.</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="font-bold text-slate-700">Nama Lengkap (Sesuai Kartu Vaksin & Paspor) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. H. BAMBANG SULISTYO"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value.toUpperCase() })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Jenis Identitas</label>
                    <select
                      value={editFormData.identityType}
                      onChange={(e) => setEditFormData({ ...editFormData, identityType: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    >
                      <option value="KTP">e-KTP (WNI)</option>
                      <option value="PASPOR">Paspor</option>
                      <option value="KITAS">KITAS / WNA</option>
                      <option value="SIM">SIM</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700">Nomor Identitas (NIK) *</label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      placeholder="16 Digit NIK e-KTP"
                      value={editFormData.nik}
                      onChange={(e) => setEditFormData({ ...editFormData, nik: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
                  <div>
                    <label className="font-bold text-slate-800 flex items-center justify-between">
                      <span>Nama Ayah Kandung (Pria) *</span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Otomatis Saran Endos 3 Kata
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. H. AHMAD DAHLAN"
                      value={editFormData.fatherName}
                      onChange={(e) => setEditFormData({ ...editFormData, fatherName: e.target.value.toUpperCase() })}
                      className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Digunakan sistem untuk rekomendasi otomatis penambahan 3 kata di paspor / surat endorsement.
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800">Nama Ibu Kandung (Wanita)</label>
                    <input
                      type="text"
                      placeholder="e.g. HJ. SITI AMINAH"
                      value={editFormData.motherName}
                      onChange={(e) => setEditFormData({ ...editFormData, motherName: e.target.value.toUpperCase() })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Kelengkapan data keluarga untuk manifes SISKOPATUH Kemenag RI.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200/60">
                  <div>
                    <label className="font-bold text-slate-700">Jenis Kelamin</label>
                    <select
                      value={editFormData.gender}
                      onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    >
                      <option value="MALE">Laki-laki</option>
                      <option value="FEMALE">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Golongan Darah</label>
                    <select
                      value={editFormData.bloodType}
                      onChange={(e) => setEditFormData({ ...editFormData, bloodType: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                      <option value="TIDAK_TAHU">Tidak Tahu</option>
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="font-bold text-slate-700">Kewarganegaraan</label>
                    <select
                      value={editFormData.citizenship}
                      onChange={(e) => setEditFormData({ ...editFormData, citizenship: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    >
                      <option value="WNI">WNI (Indonesia)</option>
                      <option value="WNA">WNA (Asing)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SEKSI 2: PAKET & STATUS */}
              <div className="bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-200/80 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950 border-b border-emerald-200/70 pb-2">
                  <Plane className="w-4 h-4 text-emerald-600" />
                  <span>2. PROGRAM PAKET & STATUS PERJALANAN</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-800">Pilih Paket Keberangkatan *</label>
                    <select
                      required
                      value={editFormData.packageId}
                      onChange={(e) => setEditFormData({ ...editFormData, packageId: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} - {formatDate(pkg.departureDate, "dd MMM yyyy")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-800">Status Perjalanan Jamaah *</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white font-bold text-slate-900"
                    >
                      <option value="REGISTERED">📋 Terdaftar Baru (REGISTERED)</option>
                      <option value="DP_PAID">💳 DP Terbayar (DP_PAID)</option>
                      <option value="FULLY_PAID">💰 Lunas 100% (FULLY_PAID)</option>
                      <option value="DOCUMENTS_READY">📑 Berkas Lengkap (DOCUMENTS_READY)</option>
                      <option value="VISA_ISSUED">🎫 Visa Terbit (VISA_ISSUED)</option>
                      <option value="DEPARTED">✈️ Di Tanah Suci (DEPARTED)</option>
                      <option value="RETURNED">🕋 Selesai / Pulang (RETURNED)</option>
                    </select>
                  </div>
                </div>

                {/* Opsi Diskon Khusus Jamaah */}
                <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editFormData.hasDiscount}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEditFormData({
                            ...editFormData,
                            hasDiscount: checked,
                            discountAmount: checked ? (editFormData.discountAmount || "4000000") : "",
                            discountReason: checked ? (editFormData.discountReason || "Promo Spesial Keberangkatan") : "",
                          });
                        }}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="font-bold text-amber-950 text-xs">
                        🏷️ Diskon Khusus / Potongan Harga Promo Jamaah
                      </span>
                    </label>
                    {editFormData.hasDiscount && (
                      <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                        Diskon Aktif
                      </span>
                    )}
                  </div>

                  {editFormData.hasDiscount && (
                    <div className="space-y-2 pt-1 border-t border-amber-200">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, discountAmount: "4000000", discountReason: "Promo Spesial Keberangkatan" })}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${editFormData.discountAmount === "4000000" ? "bg-amber-600 text-white border-amber-700" : "bg-white text-slate-700 border-amber-200"}`}
                        >
                          🔥 Promo Rp 4 Jt
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, discountAmount: "3000000", discountReason: "Diskon Khusus Tokoh / Ustadz" })}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${editFormData.discountAmount === "3000000" ? "bg-amber-600 text-white border-amber-700" : "bg-white text-slate-700 border-amber-200"}`}
                        >
                          👳 Tokoh Rp 3 Jt
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, discountAmount: "2000000", discountReason: "Diskon Keluarga / Mitra" })}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${editFormData.discountAmount === "2000000" ? "bg-amber-600 text-white border-amber-700" : "bg-white text-slate-700 border-amber-200"}`}
                        >
                          👨‍👩‍👧 Keluarga Rp 2 Jt
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, discountAmount: "1000000", discountReason: "Early Bird / Booking Awal" })}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${editFormData.discountAmount === "1000000" ? "bg-amber-600 text-white border-amber-700" : "bg-white text-slate-700 border-amber-200"}`}
                        >
                          ⚡ Early Bird Rp 1 Jt
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Nominal Potongan (Rp)</label>
                          <input
                            type="number"
                            value={editFormData.discountAmount}
                            onChange={(e) => setEditFormData({ ...editFormData, discountAmount: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 font-bold text-amber-900 bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Alasan / Jenis Diskon</label>
                          <input
                            type="text"
                            value={editFormData.discountReason}
                            onChange={(e) => setEditFormData({ ...editFormData, discountReason: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 font-medium text-slate-800 bg-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SEKSI 3: PASPOR, VISA SAUDI & TTL */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200/70 pb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>3. PASPOR, VISA SAUDI & TEMPAT TANGGAL LAHIR</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Tempat Lahir</label>
                    <input
                      type="text"
                      placeholder="e.g. Tebing Tinggi / Medan"
                      value={editFormData.placeOfBirth}
                      onChange={(e) => setEditFormData({ ...editFormData, placeOfBirth: e.target.value.toUpperCase() })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>Tanggal Lahir (yyyy-mm-dd)</span>
                      {calculateAge(editFormData.dateOfBirth) !== null && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            calculateAge(editFormData.dateOfBirth)! < 17
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          }`}
                        >
                          Usia: {calculateAge(editFormData.dateOfBirth)} Tahun{" "}
                          {calculateAge(editFormData.dateOfBirth)! < 17 ? "👶 (< 17 Thn)" : "👤 (Dewasa)"}
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={editFormData.dateOfBirth}
                      onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    />
                  </div>
                </div>

                {/* SUB-SECTION 1: STATUS PASPOR */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <label className="font-bold text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Apakah Jamaah Sudah Memiliki Paspor?</span>
                      </label>
                      <p className="text-[10px] text-slate-500">Pilih "Sudah Ada" jika paspor fisik sudah tersedia.</p>
                    </div>

                    <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setEditFormData({
                            ...editFormData,
                            hasPassport: false,
                            passportName: "",
                            passportNumber: "",
                            passportIssuedDate: "",
                            passportIssuedCity: "",
                            passportExpiry: "",
                          })
                        }
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          !editFormData.hasPassport
                            ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        ❌ Belum Ada Paspor
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, hasPassport: true, passportName: editFormData.passportName || editFormData.name })}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          editFormData.hasPassport
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        ✅ Sudah Ada Paspor
                      </button>
                    </div>
                  </div>

                  {editFormData.hasPassport ? (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700">Nama Paspor (Sesuai Buku Paspor) *</label>
                          <input
                            type="text"
                            required={editFormData.hasPassport}
                            placeholder="e.g. BAMBANG SULISTYO AHMAD"
                            value={editFormData.passportName}
                            onChange={(e) => setEditFormData({ ...editFormData, passportName: e.target.value.toUpperCase() })}
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 font-bold text-slate-900 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700">Nomor Paspor RI *</label>
                          <input
                            type="text"
                            required={editFormData.hasPassport}
                            placeholder="e.g. C8921475"
                            value={editFormData.passportNumber}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, passportNumber: e.target.value.toUpperCase() })
                            }
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 font-mono font-bold text-slate-900 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-bold text-slate-700">Tanggal Dikeluarkan Paspor</label>
                          <input
                            type="date"
                            value={editFormData.passportIssuedDate}
                            onChange={(e) => setEditFormData({ ...editFormData, passportIssuedDate: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 text-slate-900 focus:bg-white font-semibold"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700">Kota / Kantor Imigrasi Paspor</label>
                          <input
                            type="text"
                            placeholder="e.g. Kanim Medan / Pematangsiantar"
                            value={editFormData.passportIssuedCity}
                            onChange={(e) => setEditFormData({ ...editFormData, passportIssuedCity: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 text-slate-900 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700">Masa Berlaku Paspor (Expiry) *</label>
                          <input
                            type="date"
                            required={editFormData.hasPassport}
                            value={editFormData.passportExpiry}
                            onChange={(e) => setEditFormData({ ...editFormData, passportExpiry: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 text-slate-900 focus:bg-white font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-[11px] flex items-center gap-2">
                      <span className="text-base">⏳</span>
                      <span>Paspor belum ada / sedang proses di kantor Imigrasi. Kolom nomor paspor disembunyikan dan dapat dilengkapi menyusul saat edit data.</span>
                    </div>
                  )}
                </div>

                {/* SUB-SECTION 2: STATUS E-VISA */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <label className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        <span>Apakah E-Visa Umroh Sudah Diterbitkan?</span>
                      </label>
                      <p className="text-[10px] text-slate-500">Pilih "Sudah Terbit" jika visa dari MoFA Saudi sudah keluar.</p>
                    </div>

                    <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setEditFormData({
                            ...editFormData,
                            hasVisa: false,
                            visaProvider: "",
                            visaNumber: "",
                            visaIssueDate: "",
                            visaExpiryDate: "",
                            mofaNumber: "",
                            muassasahName: "",
                            insuranceNumber: "",
                          })
                        }
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          !editFormData.hasVisa
                            ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        ⏳ Belum Terbit Visa
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, hasVisa: true })}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          editFormData.hasVisa
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        ✅ Sudah Terbit Visa
                      </button>
                    </div>
                  </div>

                  {editFormData.hasVisa ? (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700">Provider Visa</label>
                          <input
                            type="text"
                            placeholder="e.g. PT Barokah Sulthan Haramain / Dallah"
                            value={editFormData.visaProvider}
                            onChange={(e) => setEditFormData({ ...editFormData, visaProvider: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-emerald-50/40 font-semibold text-emerald-900 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700">Nomor E-Visa Saudi (MoFA) *</label>
                          <input
                            type="text"
                            required={editFormData.hasVisa}
                            placeholder="e.g. 6098234123"
                            value={editFormData.visaNumber}
                            onChange={(e) => setEditFormData({ ...editFormData, visaNumber: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-emerald-50/40 font-mono font-bold text-emerald-900 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-bold text-slate-700">Tanggal Berlaku Visa</label>
                          <input
                            type="date"
                            value={editFormData.visaIssueDate}
                            onChange={(e) => setEditFormData({ ...editFormData, visaIssueDate: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 text-slate-900 focus:bg-white font-semibold"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700">Tanggal Akhir Visa</label>
                          <input
                            type="date"
                            value={editFormData.visaExpiryDate}
                            onChange={(e) => setEditFormData({ ...editFormData, visaExpiryDate: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 text-slate-900 focus:bg-white font-semibold"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700">Nomor MOFA Saudi</label>
                          <input
                            type="text"
                            placeholder="e.g. MOFA-881920"
                            value={editFormData.mofaNumber}
                            onChange={(e) => setEditFormData({ ...editFormData, mofaNumber: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-[11px] flex items-center gap-2">
                      <span className="text-base">🕋</span>
                      <span>E-Visa belum terbit dari Kementerian Haji & Umrah Saudi. Kolom data visa disembunyikan dan dapat diinput menyusul saat edit data.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SEKSI 4: ALAMAT LENGKAP & DOMISILI */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200/70 pb-2">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  <span>4. ALAMAT LENGKAP DOMISILI</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Alamat Jalan / Dusun / RT RW</label>
                  <input
                    type="text"
                    placeholder="e.g. Jl. Pahlawan No. 10 J RT 02/RW 03"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Kelurahan / Desa</label>
                    <input
                      type="text"
                      placeholder="e.g. Pasar Gambir"
                      value={editFormData.subDistrict}
                      onChange={(e) => setEditFormData({ ...editFormData, subDistrict: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Kecamatan</label>
                    <input
                      type="text"
                      placeholder="e.g. Tebing Tinggi Kota"
                      value={editFormData.district}
                      onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Kabupaten / Kota</label>
                    <input
                      type="text"
                      placeholder="e.g. Tebing Tinggi"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Provinsi</label>
                    <input
                      type="text"
                      placeholder="e.g. Sumatera Utara"
                      value={editFormData.province}
                      onChange={(e) => setEditFormData({ ...editFormData, province: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SEKSI 5: KONTAK & DEMOGRAFI */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200/70 pb-2">
                  <Phone className="w-4 h-4 text-teal-600" />
                  <span>5. KONTAK, DEMOGRAFI & MAHRAM / PENDAMPING</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Nomor WhatsApp Jamaah *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 08123456789"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">No. Telepon (Rumah/Kantor)</label>
                    <input
                      type="tel"
                      placeholder="0621-123456"
                      value={editFormData.telephone}
                      onChange={(e) => setEditFormData({ ...editFormData, telephone: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Email Jamaah (Opsional)</label>
                    <input
                      type="email"
                      placeholder="e.g. jamaah@gmail.com"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200/60">
                  <div>
                    <label className="font-bold text-slate-700">Status Pernikahan</label>
                    <select
                      value={editFormData.maritalStatus}
                      onChange={(e) => setEditFormData({ ...editFormData, maritalStatus: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    >
                      <option value="MENIKAH">Menikah</option>
                      <option value="BELUM_MENIKAH">Belum Menikah</option>
                      <option value="CERAI_HIDUP">Cerai Hidup</option>
                      <option value="CERAI_MATI">Cerai Mati</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Pendidikan Terakhir</label>
                    <select
                      value={editFormData.education}
                      onChange={(e) => setEditFormData({ ...editFormData, education: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    >
                      <option value="SMA">SMA / SMK / MA</option>
                      <option value="S1">Sarjana (S1)</option>
                      <option value="S2">Magister (S2)</option>
                      <option value="S3">Doktor (S3)</option>
                      <option value="D3">Diploma (D3)</option>
                      <option value="SMP">SMP / MTs</option>
                      <option value="SD">SD / MI</option>
                      <option value="LAINNYA">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Pekerjaan</label>
                    <select
                      value={editFormData.job}
                      onChange={(e) => setEditFormData({ ...editFormData, job: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    >
                      <option value="SWASTA">Karyawan Swasta</option>
                      <option value="WIRASWASTA">Wiraswasta / Usaha</option>
                      <option value="PNS">PNS / ASN</option>
                      <option value="TNI_POLRI">TNI / POLRI</option>
                      <option value="IBU_RUMAH_TANGGA">Ibu Rumah Tangga</option>
                      <option value="PENSIUNAN">Pensiunan</option>
                      <option value="BUMN">BUMN / BUMD</option>
                      <option value="DOKTER_MEDIS">Tenaga Medis / Dokter</option>
                      <option value="GURU_DOSEN">Guru / Dosen</option>
                      <option value="PELAJAR_MAHASISWA">Pelajar / Mahasiswa</option>
                      <option value="LAINNYA">Lainnya</option>
                    </select>
                  </div>
                </div>

                {/* SMART CONDITIONAL MAHRAM & GUARDIAN SECTION (EDIT MODAL) */}
                {(() => {
                  const editAge = calculateAge(editFormData.dateOfBirth);
                  const editIsUnder17 = editAge !== null && editAge < 17;
                  const editIsFemale = editFormData.gender === "FEMALE";
                  const samePackagePilgrims = pilgrims.filter(
                    (p) => p.packageId === (editFormData.packageId || packages[0]?.id) && p.id !== editingPilgrimId
                  );
                  const malePilgrimsInPackage = samePackagePilgrims.filter((p) => p.gender === "MALE");

                  if (editIsUnder17) {
                    return (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/70 p-3.5 rounded-2xl border border-blue-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-blue-950 text-xs">
                            <UserCheck className="w-4 h-4 text-blue-600" />
                            <span>Deteksi Usia: Jamaah Berusia di Bawah 17 Tahun ({editAge} Tahun)</span>
                          </div>
                          <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-md border border-blue-200">
                            Regulasi Perlindungan Anak
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-xs block">
                            Apakah ada orang tua / keluarga yang ikut serta mendampingi dalam keberangkatan ini?
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditHasGuardianOption(true);
                                setEditFormData((prev) => ({
                                  ...prev,
                                  mahramRelation: prev.mahramRelation || "AYAH KANDUNG",
                                }));
                              }}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                editHasGuardianOption === true || (editHasGuardianOption === null && Boolean(editFormData.mahramName))
                                  ? "bg-blue-600 text-white shadow-xs"
                                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              ✅ Ya, Ada Orang Tua / Pendamping
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditHasGuardianOption(false);
                                setEditFormData((prev) => ({
                                  ...prev,
                                  mahramName: "",
                                  mahramRelation: "TANPA PENDAMPING ORANG TUA (TL/MUTHAWWIF)",
                                }));
                              }}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                editHasGuardianOption === false
                                  ? "bg-slate-800 text-white shadow-xs"
                                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              ❌ Tidak Ada (Pendampingan Petugas / TL)
                            </button>
                          </div>
                        </div>

                        {(editHasGuardianOption === true || (editHasGuardianOption === null && Boolean(editFormData.mahramName))) && (
                          <div className="pt-2 border-t border-blue-200/60 space-y-3">
                            <div>
                              <label className="font-bold text-slate-800 text-xs block mb-1">
                                Pilih Hubungan Pendamping / Wali:
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {[
                                  { label: "Ayah Kandung", val: "AYAH KANDUNG" },
                                  { label: "Ibu Kandung", val: "IBU KANDUNG" },
                                  { label: "Kakak / Abang", val: "KAKAK / ABANG KANDUNG" },
                                  { label: "Wali / Keluarga Lain", val: "WALI KELUARGA" },
                                ].map((rel) => (
                                  <button
                                    key={rel.val}
                                    type="button"
                                    onClick={() => {
                                      setEditGuardianRelationType(rel.val);
                                      setEditFormData((prev) => ({ ...prev, mahramRelation: rel.val }));
                                    }}
                                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                                      (editFormData.mahramRelation || editGuardianRelationType) === rel.val
                                        ? "bg-indigo-600 text-white shadow-xs"
                                        : "bg-white border border-blue-200 text-blue-900 hover:bg-blue-100/50"
                                    }`}
                                  >
                                    {rel.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Pick from database in same package */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="font-bold text-slate-800 text-xs">
                                  Pilih Nama Pendamping dari Jamaah Paket Keberangkatan yang Sama:
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setEditMahramInputMode(editMahramInputMode === "DB" ? "MANUAL" : "DB")}
                                  className="text-[10px] text-blue-700 font-bold hover:underline"
                                >
                                  {editMahramInputMode === "DB" ? "✏️ Input Manual" : "📋 Pilih dari Database Paket"}
                                </button>
                              </div>

                              {editMahramInputMode === "DB" ? (
                                <select
                                  value={editFormData.mahramName}
                                  onChange={(e) => {
                                    const selectedName = e.target.value;
                                    const currentRel = editFormData.mahramRelation || editGuardianRelationType;
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      mahramName: selectedName,
                                      fatherName: currentRel === "AYAH KANDUNG" ? selectedName : prev.fatherName,
                                      motherName: currentRel === "IBU KANDUNG" ? selectedName : prev.motherName,
                                    }));
                                  }}
                                  className="w-full rounded-xl border border-blue-300 p-2.5 bg-white font-bold text-slate-900 text-xs"
                                >
                                  <option value="">-- Pilih Jamaah dari Database Paket Ini --</option>
                                  {((editFormData.mahramRelation || editGuardianRelationType) === "AYAH KANDUNG"
                                    ? samePackagePilgrims.filter((p) => p.gender === "MALE")
                                    : (editFormData.mahramRelation || editGuardianRelationType) === "IBU KANDUNG"
                                    ? samePackagePilgrims.filter((p) => p.gender === "FEMALE")
                                    : samePackagePilgrims
                                  ).map((p) => (
                                    <option key={p.id} value={p.name}>
                                      {p.name} (NIK: {p.nik || "-"}) - {p.gender === "MALE" ? "Laki-laki" : "Perempuan"}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Ketik nama pendamping / wali..."
                                  value={editFormData.mahramName}
                                  onChange={(e) => setEditFormData({ ...editFormData, mahramName: e.target.value })}
                                  className="w-full rounded-xl border border-blue-300 p-2.5 bg-white font-bold text-slate-900 text-xs"
                                />
                              )}
                              <p className="text-[10px] text-slate-500 mt-1">
                                💡 Data otomatis ditarik dari manifest jamaah yang terdaftar pada paket keberangkatan ini.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (editIsFemale) {
                    return (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50/60 p-3.5 rounded-2xl border border-purple-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-purple-950 text-xs">
                            <UserCheck className="w-4 h-4 text-purple-700" />
                            <span>Ketentuan Mahram Jamaah Wanita ({editAge !== null ? `${editAge} Tahun` : "Dewasa"})</span>
                          </div>
                          <span className="text-[10px] bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded-md border border-purple-200">
                            Syarat Visa Umroh Saudi
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-xs block">
                            Apakah jamaah memiliki mahram dalam keberangkatan umroh ini?
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditHasMahramOption(true);
                                setEditFormData((prev) => ({
                                  ...prev,
                                  mahramRelation: prev.mahramRelation || "SUAMI",
                                }));
                              }}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                editHasMahramOption === true || (editHasMahramOption === null && Boolean(editFormData.mahramName))
                                  ? "bg-purple-700 text-white shadow-xs"
                                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              ✅ Ya, Memiliki Mahram
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditHasMahramOption(false);
                                setEditFormData((prev) => ({
                                  ...prev,
                                  mahramName: "",
                                  mahramRelation: "MANDIRI / TANPA MAHRAM",
                                }));
                              }}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                editHasMahramOption === false
                                  ? "bg-slate-800 text-white shadow-xs"
                                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              ❌ Tidak (Berangkat Mandiri)
                            </button>
                          </div>
                        </div>

                        {(editHasMahramOption === true || (editHasMahramOption === null && Boolean(editFormData.mahramName))) && (
                          <div className="pt-2 border-t border-purple-200/60 space-y-3">
                            <div>
                              <label className="font-bold text-slate-800 text-xs block mb-1">
                                Pilih Hubungan Mahram:
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {[
                                  { label: "Suami", val: "SUAMI" },
                                  { label: "Ayah Kandung", val: "AYAH KANDUNG" },
                                  { label: "Anak Laki-laki", val: "ANAK LAKI-LAKI" },
                                  { label: "Saudara Kandung", val: "SAUDARA KANDUNG" },
                                  { label: "Paman / Kakek", val: "PAMAN / KAKEK" },
                                ].map((rel) => (
                                  <button
                                    key={rel.val}
                                    type="button"
                                    onClick={() => {
                                      setEditFormData((prev) => ({ ...prev, mahramRelation: rel.val }));
                                    }}
                                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                                      (editFormData.mahramRelation || "SUAMI") === rel.val
                                        ? "bg-purple-700 text-white shadow-xs"
                                        : "bg-white border border-purple-200 text-purple-900 hover:bg-purple-100/50"
                                    }`}
                                  >
                                    {rel.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Pick from database in same package */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="font-bold text-slate-800 text-xs">
                                  Pilih Nama Mahram dari Jamaah Pria di Paket Keberangkatan yang Sama:
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setEditMahramInputMode(editMahramInputMode === "DB" ? "MANUAL" : "DB")}
                                  className="text-[10px] text-purple-700 font-bold hover:underline"
                                >
                                  {editMahramInputMode === "DB" ? "✏️ Input Manual" : "📋 Pilih dari Database Paket"}
                                </button>
                              </div>

                              {editMahramInputMode === "DB" ? (
                                <select
                                  value={editFormData.mahramName}
                                  onChange={(e) => {
                                    const selectedName = e.target.value;
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      mahramName: selectedName,
                                      fatherName: editFormData.mahramRelation === "AYAH KANDUNG" ? selectedName : prev.fatherName,
                                    }));
                                  }}
                                  className="w-full rounded-xl border border-purple-300 p-2.5 bg-white font-bold text-slate-900 text-xs"
                                >
                                  <option value="">-- Pilih Mahram Pria dari Database Paket Ini --</option>
                                  {malePilgrimsInPackage.map((p) => (
                                    <option key={p.id} value={p.name}>
                                      {p.name} (NIK: {p.nik || "-"})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Ketik nama mahram..."
                                  value={editFormData.mahramName}
                                  onChange={(e) => setEditFormData({ ...editFormData, mahramName: e.target.value })}
                                  className="w-full rounded-xl border border-purple-300 p-2.5 bg-white font-bold text-slate-900 text-xs"
                                />
                              )}
                              <p className="text-[10px] text-slate-500 mt-1">
                                💡 Data otomatis memfilter jamaah laki-laki yang terdaftar pada paket keberangkatan ini.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700">Nama Mahram / Kerabat yang Disertai (Opsional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Ibu Fatimah (Istri / Ibu)"
                          value={editFormData.mahramName}
                          onChange={(e) => setEditFormData({ ...editFormData, mahramName: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700">Hubungan Kerabat</label>
                        <input
                          type="text"
                          placeholder="e.g. Istri / Ibu Kandung"
                          value={editFormData.mahramRelation}
                          onChange={(e) => setEditFormData({ ...editFormData, mahramRelation: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                        />
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
                  <div>
                    <label className="font-bold text-slate-700">Nama Kontak Darurat Keluarga</label>
                    <input
                      type="text"
                      placeholder="e.g. Ahmad (Anak Sulung)"
                      value={editFormData.emergencyContactName}
                      onChange={(e) => setEditFormData({ ...editFormData, emergencyContactName: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">No HP Kontak Darurat</label>
                    <input
                      type="tel"
                      placeholder="e.g. 08129876543"
                      value={editFormData.emergencyContactPhone}
                      onChange={(e) => setEditFormData({ ...editFormData, emergencyContactPhone: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SEKSI 6: CATATAN KESEHATAN & KHUSUS */}
              <div>
                <label className="font-bold text-slate-700">Catatan Riwayat Kesehatan & Kebutuhan Khusus</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Membutuhkan bantuan kursi roda saat tawaf, riwayat alergi obat, dll..."
                  value={editFormData.healthNotes}
                  onChange={(e) => setEditFormData({ ...editFormData, healthNotes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-sm"
                >
                  {loading ? "Menyimpan..." : "Simpan Perubahan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registrations Management Modal */}
      <RegistrationsAdminModal
        isOpen={isRegistrationsModalOpen}
        onClose={() => setIsRegistrationsModalOpen(false)}
        onRefreshPilgrims={onRefresh}
      />
    </div>
  );
}
