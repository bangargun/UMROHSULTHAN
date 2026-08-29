"use client";

import React, { useState } from "react";
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
    name: "",
    nik: "",
    hasPassport: false,
    passportNumber: "",
    passportExpiry: "",
    hasVisa: false,
    visaNumber: "",
    visaIssueDate: "",
    visaExpiryDate: "",
    mofaNumber: "",
    muassasahName: "",
    insuranceNumber: "",
    placeOfBirth: "",
    dateOfBirth: "",
    gender: "MALE",
    phone: "",
    email: "",
    address: "",
    city: "",
    province: "",
    fatherName: "",
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
  });

  // Edit form data
  const [editFormData, setEditFormData] = useState({
    packageId: "",
    name: "",
    nik: "",
    hasPassport: false,
    passportNumber: "",
    passportExpiry: "",
    hasVisa: false,
    visaNumber: "",
    visaIssueDate: "",
    visaExpiryDate: "",
    mofaNumber: "",
    muassasahName: "",
    insuranceNumber: "",
    placeOfBirth: "",
    dateOfBirth: "",
    gender: "MALE",
    phone: "",
    email: "",
    address: "",
    city: "",
    province: "",
    fatherName: "",
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
  });

  const handleOpenEdit = (p: any) => {
    setEditingPilgrimId(p.id);
    const hasPass = Boolean(p.passportNumber && p.passportNumber.trim() !== "");
    const hasVis = Boolean(p.visaNumber && p.visaNumber.trim() !== "");
    setEditFormData({
      packageId: p.packageId || "",
      name: p.name || "",
      nik: p.nik || "",
      hasPassport: hasPass,
      passportNumber: p.passportNumber || "",
      passportExpiry: p.passportExpiry ? p.passportExpiry.split("T")[0] : "",
      hasVisa: hasVis,
      visaNumber: p.visaNumber || "",
      visaIssueDate: p.visaIssueDate ? p.visaIssueDate.split("T")[0] : "",
      visaExpiryDate: p.visaExpiryDate ? p.visaExpiryDate.split("T")[0] : "",
      mofaNumber: p.mofaNumber || "",
      muassasahName: p.muassasahName || "",
      insuranceNumber: p.insuranceNumber || "",
      placeOfBirth: p.placeOfBirth || "",
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "",
      gender: p.gender || "MALE",
      phone: p.phone || "",
      email: p.email || "",
      address: p.address || "",
      city: p.city || "",
      province: p.province || "",
      fatherName: p.fatherName || "",
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
        passportNumber: editFormData.hasPassport ? editFormData.passportNumber : null,
        passportExpiry: editFormData.hasPassport && editFormData.passportExpiry ? editFormData.passportExpiry : null,
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

  const handleAddPilgrim = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        passportNumber: formData.hasPassport ? formData.passportNumber : null,
        passportExpiry: formData.hasPassport && formData.passportExpiry ? formData.passportExpiry : null,
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
          name: "",
          nik: "",
          hasPassport: false,
          passportNumber: "",
          passportExpiry: "",
          hasVisa: false,
          visaNumber: "",
          visaIssueDate: "",
          visaExpiryDate: "",
          mofaNumber: "",
          muassasahName: "",
          insuranceNumber: "",
          placeOfBirth: "",
          dateOfBirth: "",
          gender: "MALE",
          phone: "",
          email: "",
          address: "",
          city: "",
          province: "",
          fatherName: "",
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

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, NIK, nomor paspor, atau no HP..."
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

      {/* Table Database Jamaah */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Jamaah & NIK</th>
                <th className="py-3 px-4">No Paspor & Exp</th>
                <th className="py-3 px-4">Paket & Keberangkatan</th>
                <th className="py-3 px-4">Kamar & Seragam</th>
                <th className="py-3 px-4">Kontak & Mahram</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredPilgrims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Tidak ada data jamaah ditemukan
                  </td>
                </tr>
              ) : (
                filteredPilgrims.map((p) => {
                  const badge = getStatusBadge(p.status);
                  const expInfo = getPassportExpiryStatus(p.passportExpiry, p.package?.departureDate);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & NIK */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="font-mono text-[11px] text-slate-400">NIK: {p.nik}</p>
                      </td>

                      {/* Passport & Visa */}
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
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Exp: {p.passportExpiry ? formatDate(p.passportExpiry, "dd/MM/yyyy") : "-"}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-block text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-medium">
                              Paspor Belum Ada
                            </span>
                          )}

                          {/* Visa Info Badge */}
                          {p.visaNumber ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              <span>🎫 Visa:</span>
                              <span className="font-mono">{p.visaNumber}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                              🎫 Visa: Belum Terbit
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Package */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800 line-clamp-1">{p.package?.name}</p>
                        <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                          🛫 {formatDate(p.package?.departureDate, "dd MMM yyyy")}
                        </p>
                      </td>

                      {/* Room & Uniform */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {p.roomType} Room
                        </span>
                        <span className="inline-block ml-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          Size: {p.uniformSize}
                        </span>
                      </td>

                      {/* Contact & Mahram */}
                      <td className="py-3.5 px-4">
                        <p className="text-slate-800 font-semibold">{p.phone}</p>
                        {p.mahramName && (
                          <p className="text-[10px] text-slate-500">
                            Mahram: {p.mahramName} ({p.mahramRelation || "Keluarga"})
                          </p>
                        )}
                      </td>

                      {/* Status (Interactive Inline Selector) */}
                      <td className="py-3.5 px-4">
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

            {/* Grid 3 Columns Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Kolom 1: Identitas Pribadi */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-2 text-xs">
                <p className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" /> Identitas Diri
                </p>
                <div>
                  <span className="text-[10px] text-slate-400">NIK (KTP):</span>
                  <p className="font-mono font-bold text-slate-800">{selectedPilgrim.nik}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Tempat, Tanggal Lahir:</span>
                  <p className="text-slate-800">
                    {selectedPilgrim.placeOfBirth || "-"},{" "}
                    {selectedPilgrim.dateOfBirth ? formatDate(selectedPilgrim.dateOfBirth) : "-"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Jenis Kelamin / Gol. Darah:</span>
                  <p className="text-slate-800">
                    {selectedPilgrim.gender === "MALE" ? "Laki-laki" : "Perempuan"} • Gol: {selectedPilgrim.bloodType === "TIDAK_TAHU" ? "Tidak Tahu" : (selectedPilgrim.bloodType || "-")}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Alamat Tempat Tinggal:</span>
                  <p className="text-slate-800">{selectedPilgrim.address || "-"}</p>
                </div>
              </div>

              {/* Kolom 2: Paspor & Mahram */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-2 text-xs">
                <p className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <Plane className="w-4 h-4 text-emerald-600" /> Paspor & Mahram
                </p>
                <div>
                  <span className="text-[10px] text-slate-400">Nomor Paspor:</span>
                  <p className="font-mono font-bold text-slate-800">{selectedPilgrim.passportNumber || "Belum Ada"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Masa Berlaku Paspor:</span>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-slate-900 font-bold">
                      {selectedPilgrim.passportExpiry ? formatDate(selectedPilgrim.passportExpiry) : "-"}
                    </p>
                    {(() => {
                      const expInfo = getPassportExpiryStatus(selectedPilgrim.passportExpiry, selectedPilgrim.package?.departureDate);
                      if (expInfo && expInfo.isWarning) {
                        return (
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${expInfo.badgeClass}`}>
                            {expInfo.label}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  {(() => {
                    const expInfo = getPassportExpiryStatus(selectedPilgrim.passportExpiry, selectedPilgrim.package?.departureDate);
                    if (expInfo && expInfo.isWarning) {
                      return (
                        <div className="mt-1.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-900 leading-snug">
                          <strong>💡 Rekomendasi PPIU:</strong> {expInfo.recommendation}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Mahram / Pendamping:</span>
                  <p className="text-slate-800 font-semibold">
                    {selectedPilgrim.mahramName || "-"} {selectedPilgrim.mahramRelation ? `(${selectedPilgrim.mahramRelation})` : ""}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Kontak Darurat Keluarga:</span>
                  <p className="text-slate-800">
                    {selectedPilgrim.emergencyContactName || "-"} ({selectedPilgrim.emergencyContactPhone || "-"})
                  </p>
                </div>
              </div>

              {/* Kolom 3: Fasilitas & Kesehatan */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-2 text-xs">
                <p className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <Shield className="w-4 h-4 text-emerald-600" /> Fasilitas & Catatan
                </p>
                <div>
                  <span className="text-[10px] text-slate-400">Tipe Kamar Hotel:</span>
                  <p className="font-bold text-slate-800">{selectedPilgrim.roomType} Room</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Ukuran Seragam / Batik:</span>
                  <p className="font-bold text-slate-800">Size {selectedPilgrim.uniformSize}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Catatan Khusus Kesehatan:</span>
                  <p className="text-slate-800">{selectedPilgrim.healthNotes || "Tidak ada keluhan"}</p>
                </div>
              </div>
            </div>

            {/* Banner Khusus Visa Saudi MoFA */}
            <div className="rounded-2xl bg-emerald-50/60 border border-emerald-200 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  Status Dokumen E-Visa Umroh & Syarikah Saudi
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
                  <span className="text-[10px] text-emerald-800">Nomor E-Visa (MoFA):</span>
                  <p className="font-mono font-bold text-emerald-950">
                    {selectedPilgrim.visaNumber || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-800">Nomor MOFA:</span>
                  <p className="font-mono font-bold text-emerald-950">
                    {selectedPilgrim.mofaNumber || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-800">Syarikah Penjamin:</span>
                  <p className="font-bold text-emerald-950">
                    {selectedPilgrim.muassasahName || "PT Sulthan Haramain Travel"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-800">Masa Berlaku Visa:</span>
                  <p className="font-bold text-emerald-950">
                    {selectedPilgrim.visaExpiryDate ? formatDate(selectedPilgrim.visaExpiryDate, "dd MMM yyyy") : "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Riwayat Dokumen & Keuangan Mini Preview */}
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
              {/* SEKSI 1: NAMA JAMAAH & NIK (DATA IDENTITAS SESUAI KTP) */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200/70 pb-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>1. NAMA JAMAAH & NIK (DATA IDENTITAS KTP)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Nama Lengkap Sesuai KTP/Paspor *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. H. Bambang Sulistyo"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Nomor Induk Kependudukan (NIK) *</label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      placeholder="16 Digit NIK KTP"
                      value={formData.nik}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                    <label className="font-bold text-slate-700">Kota / Domisili</label>
                    <input
                      type="text"
                      placeholder="e.g. Jakarta Selatan"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Alamat Lengkap KTP</label>
                  <input
                    type="text"
                    placeholder="e.g. Jl. Melati No. 12 RT 04/RW 02, Kebayoran Baru"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
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
                      placeholder="e.g. H. Ahmad Dahlan"
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Digunakan sistem untuk rekomendasi otomatis penambahan 3 kata di paspor / surat endos.
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800">Nama Ibu Kandung (Wanita)</label>
                    <input
                      type="text"
                      placeholder="e.g. Hj. Siti Aminah"
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Kelengkapan data keluarga untuk manifes SISKOPATUH Kemenag RI.
                    </p>
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
              </div>

              {/* SEKSI 3: PASPOR, VISA SAUDI & TTL */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200/70 pb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>3. PASPOR, VISA SAUDI & TTL (DOKUMEN PERJALANAN)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Tempat Lahir</label>
                    <input
                      type="text"
                      placeholder="e.g. Surabaya"
                      value={formData.placeOfBirth}
                      onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>Tanggal Lahir</span>
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
                            passportNumber: "",
                            passportExpiry: "",
                          })
                        }
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          !formData.hasPassport
                            ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        ❌ Belum Ada Paspor
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, hasPassport: true })}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="font-bold text-slate-700">Nomor Paspor RI *</label>
                        <input
                          type="text"
                          required={formData.hasPassport}
                          placeholder="e.g. C8921475"
                          value={formData.passportNumber}
                          onChange={(e) =>
                            setFormData({ ...formData, passportNumber: e.target.value.toUpperCase() })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 font-mono font-bold text-slate-900 focus:bg-white"
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
                        {(() => {
                          const expInfo = getPassportExpiryStatus(formData.passportExpiry);
                          if (formData.hasPassport && expInfo && expInfo.isWarning) {
                            return (
                              <div className="mt-1.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950 flex items-start gap-1.5 leading-snug">
                                <span className="shrink-0 text-amber-600 font-bold">⚠️</span>
                                <div>
                                  <p className="font-bold">{expInfo.label}</p>
                                  <p className="text-[10px] text-amber-800 mt-0.5">{expInfo.recommendation}</p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
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
                          setFormData({
                            ...formData,
                            hasVisa: false,
                            visaNumber: "",
                            visaIssueDate: "",
                            visaExpiryDate: "",
                            mofaNumber: "",
                            muassasahName: "",
                            insuranceNumber: "",
                          })
                        }
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
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
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700">Syarikah / Muassasah Penjamin</label>
                          <input
                            type="text"
                            placeholder="e.g. Dallah / Al-Riyadah / Rawafina"
                            value={formData.muassasahName}
                            onChange={(e) => setFormData({ ...formData, muassasahName: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700">Masa Berlaku E-Visa</label>
                          <input
                            type="date"
                            value={formData.visaExpiryDate}
                            onChange={(e) => setFormData({ ...formData, visaExpiryDate: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 font-semibold"
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

              {/* SEKSI 4: KAMAR & SERAGAM */}
              <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 border-b border-amber-200 pb-2">
                  <Boxes className="w-4 h-4 text-amber-700" />
                  <span>4. KAMAR & SERAGAM</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-800">Tipe Kamar Hotel</label>
                    <select
                      value={formData.roomType}
                      onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-amber-200 p-2.5 bg-white font-semibold"
                    >
                      <option value="QUAD">Quad (Sekamar Ber-4)</option>
                      <option value="TRIPLE">Triple (Sekamar Ber-3)</option>
                      <option value="DOUBLE">Double (Sekamar Ber-2)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-800">Ukuran Seragam / Batik</label>
                    <select
                      value={formData.uniformSize}
                      onChange={(e) => setFormData({ ...formData, uniformSize: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-amber-200 p-2.5 bg-white font-semibold"
                    >
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                      <option value="XXXL">XXXL</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SEKSI 5: KONTAK & MAHRAM */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200/70 pb-2">
                  <Phone className="w-4 h-4 text-teal-600" />
                  <span>5. KONTAK & MAHRAM</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Nomor WhatsApp / HP *</label>
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
              {/* SEKSI 1: IDENTITAS KTP */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200/70 pb-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>1. NAMA JAMAAH & NIK (DATA IDENTITAS KTP)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Nama Lengkap Sesuai KTP/Paspor *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. H. Bambang Sulistyo"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Nomor Induk Kependudukan (NIK) *</label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      placeholder="16 Digit NIK KTP"
                      value={editFormData.nik}
                      onChange={(e) => setEditFormData({ ...editFormData, nik: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                    <label className="font-bold text-slate-700">Kota / Domisili</label>
                    <input
                      type="text"
                      placeholder="e.g. Jakarta Selatan"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Alamat Lengkap KTP</label>
                  <input
                    type="text"
                    placeholder="e.g. Jl. Melati No. 12 RT 04/RW 02"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
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
                      placeholder="e.g. H. Ahmad Dahlan"
                      value={editFormData.fatherName}
                      onChange={(e) => setEditFormData({ ...editFormData, fatherName: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-emerald-300 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Digunakan sistem untuk rekomendasi otomatis penambahan 3 kata di paspor / surat endos.
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800">Nama Ibu Kandung (Wanita)</label>
                    <input
                      type="text"
                      placeholder="e.g. Hj. Siti Aminah"
                      value={editFormData.motherName}
                      onChange={(e) => setEditFormData({ ...editFormData, motherName: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Kelengkapan data keluarga untuk manifes SISKOPATUH Kemenag RI.
                    </p>
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
              </div>

              {/* SEKSI 3: PASPOR, VISA SAUDI & TTL */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200/70 pb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>3. PASPOR, VISA SAUDI & TTL (DOKUMEN PERJALANAN)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Tempat Lahir</label>
                    <input
                      type="text"
                      placeholder="e.g. Surabaya"
                      value={editFormData.placeOfBirth}
                      onChange={(e) => setEditFormData({ ...editFormData, placeOfBirth: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>Tanggal Lahir</span>
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
                            passportNumber: "",
                            passportExpiry: "",
                          })
                        }
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          !editFormData.hasPassport
                            ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        ❌ Belum Ada Paspor
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, hasPassport: true })}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
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
                      <div>
                        <label className="font-bold text-slate-700">Masa Berlaku Paspor (Expiry) *</label>
                        <input
                          type="date"
                          required={editFormData.hasPassport}
                          value={editFormData.passportExpiry}
                          onChange={(e) => setEditFormData({ ...editFormData, passportExpiry: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 text-slate-900 focus:bg-white font-semibold"
                        />
                        {(() => {
                          const expInfo = getPassportExpiryStatus(editFormData.passportExpiry);
                          if (editFormData.hasPassport && expInfo && expInfo.isWarning) {
                            return (
                              <div className="mt-1.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950 flex items-start gap-1.5 leading-snug">
                                <span className="shrink-0 text-amber-600 font-bold">⚠️</span>
                                <div>
                                  <p className="font-bold">{expInfo.label}</p>
                                  <p className="text-[10px] text-amber-800 mt-0.5">{expInfo.recommendation}</p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
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
                            visaNumber: "",
                            visaIssueDate: "",
                            visaExpiryDate: "",
                            mofaNumber: "",
                            muassasahName: "",
                            insuranceNumber: "",
                          })
                        }
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
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
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700">Syarikah / Muassasah Penjamin</label>
                          <input
                            type="text"
                            placeholder="e.g. Dallah / Al-Riyadah / Rawafina"
                            value={editFormData.muassasahName}
                            onChange={(e) => setEditFormData({ ...editFormData, muassasahName: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700">Masa Berlaku E-Visa</label>
                          <input
                            type="date"
                            value={editFormData.visaExpiryDate}
                            onChange={(e) => setEditFormData({ ...editFormData, visaExpiryDate: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 font-semibold"
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

              {/* SEKSI 4: KAMAR & SERAGAM */}
              <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 border-b border-amber-200 pb-2">
                  <Boxes className="w-4 h-4 text-amber-700" />
                  <span>4. KAMAR & SERAGAM</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-800">Tipe Kamar Hotel</label>
                    <select
                      value={editFormData.roomType}
                      onChange={(e) => setEditFormData({ ...editFormData, roomType: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    >
                      <option value="QUAD">Quad Room (Ber-4)</option>
                      <option value="TRIPLE">Triple Room (Ber-3)</option>
                      <option value="DOUBLE">Double Room (Ber-2)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-800">Ukuran Seragam / Batik</label>
                    <select
                      value={editFormData.uniformSize}
                      onChange={(e) => setEditFormData({ ...editFormData, uniformSize: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                    >
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                      <option value="XXXL">XXXL</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SEKSI 5: KONTAK & MAHRAM */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200/70 pb-2">
                  <Phone className="w-4 h-4 text-teal-600" />
                  <span>5. KONTAK & MAHRAM / PENDAMPING</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
