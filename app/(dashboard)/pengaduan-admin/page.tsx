"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
  X,
  Check,
  Send,
  Building2,
  MapPin,
  User,
  PhoneCall,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Paperclip,
  HeartHandshake,
  Edit,
  Trash2,
  Lock,
  Undo2,
  Download,
} from "lucide-react";

interface DokumenItem {
  id: string;
  jenis: string;
  namaFile: string;
  pathFile: string;
  mimeType?: string | null;
  ukuranFile?: number | null;
  terverifikasi?: boolean;
}

interface TindakLanjutItem {
  id: string;
  jenis: string;
  uraian: string;
  hasil?: string;
  tanggal: string;
  petugasNama: string;
}

interface CurrentUser {
  id: string;
  nama: string;
  username: string;
  role: string;
  kecamatanId?: string | null;
  desaId?: string | null;
  kecamatan?: { kd_kecamatan: string; nm_kecamatan: string } | null;
  desa?: { kd_desa: string; nm_desa: string } | null;
}

interface PengaduanAdminItem {
  id: string;
  nomorPengaduan: string;
  tokenPelacakan: string;
  tanggalPengaduan: string;
  pelapor: {
    id: string;
    nama: string;
    nik?: string;
    noHp?: string;
    alamat: string;
  };
  bidang: {
    id: string;
    kode: string;
    nama: string;
  };
  jenisPengaduan: {
    id: string;
    nama: string;
  }[];
  lokasi: {
    posyandu: string;
    desa: string;
    kecamatan: string;
    kd_desa?: string;
    kd_kecamatan?: string;
  };
  deskripsi: string;
  status: string;
  alasanPenolakan?: string;
  catatan?: string;
  hasilPenyelesaian?: string;
  tanggalSelesai?: string;
  dokumenCount: number;
  dokumen?: DokumenItem[];
  verifikasiCount: number;
  tindakLanjutCount: number;
  tindakLanjutList?: TindakLanjutItem[];
}

function PengaduanAdminContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "";
  const initialSearch = searchParams.get("search") || "";

  // User Profile & Otoritas Wilayah
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Filter States
  const [activeStatus, setActiveStatus] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [selectedBidangId, setSelectedBidangId] = useState<string>("");
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>("");
  const [selectedDesa, setSelectedDesa] = useState<string>("");

  // Data List & Pagination
  const [items, setItems] = useState<PengaduanAdminItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Referensi Filter
  const [bidangList, setBidangList] = useState<any[]>([]);
  const [kecamatanList, setKecamatanList] = useState<any[]>([]);
  const [desaList, setDesaList] = useState<any[]>([]);

  // Modal Detail & Verifikasi
  const [selectedItem, setSelectedItem] = useState<PengaduanAdminItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<DokumenItem | null>(null);
  const [verifCatatan, setVerifCatatan] = useState<string>("");
  const [verifSubmitting, setVerifSubmitting] = useState<boolean>(false);
  const [verifFeedback, setVerifFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form Tindak Lanjut
  const [tlJenis, setTlJenis] = useState<string>("KUNJUNGAN_RUMAH");
  const [tlUraian, setTlUraian] = useState<string>("");
  const [tlHasil, setTlHasil] = useState<string>("");
  const [tlSelesai, setTlSelesai] = useState<boolean>(false);
  const [tlSubmitting, setTlSubmitting] = useState<boolean>(false);

  // Modal Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PengaduanAdminItem | null>(null);
  const [editForm, setEditForm] = useState({
    namaPelapor: "",
    noHpPelapor: "",
    alamatPelapor: "",
    deskripsi: "",
    catatan: "",
    status: "",
    hasilPenyelesaian: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<PengaduanAdminItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);

  // Modal Batal Verifikasi Berjenjang State
  const [batalModalOpen, setBatalModalOpen] = useState(false);
  const [batalAlasan, setBatalAlasan] = useState("");
  const [batalSubmitting, setBatalSubmitting] = useState(false);
  const [batalFeedback, setBatalFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleOpenEditModal = (item: PengaduanAdminItem) => {
    setEditItem(item);
    setEditForm({
      namaPelapor: item.pelapor.nama || "",
      noHpPelapor: item.pelapor.noHp || "",
      alamatPelapor: item.pelapor.alamat || "",
      deskripsi: item.deskripsi || "",
      catatan: item.catatan || "",
      status: item.status || "MENUNGGU_VERIFIKASI_DESA",
      hasilPenyelesaian: item.hasilPenyelesaian || "",
    });
    setEditFeedback(null);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setEditSubmitting(true);
    setEditFeedback(null);
    try {
      const res = await fetch("/api/admin/pengaduan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editItem.id,
          ...editForm,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal memperbarui data pengaduan.");

      setEditFeedback({ type: "success", message: json.message });
      if (selectedItem?.id === editItem.id) {
        setSelectedItem((prev: any) => ({
          ...prev,
          status: editForm.status,
          deskripsi: editForm.deskripsi,
          catatan: editForm.catatan,
          hasilPenyelesaian: editForm.hasilPenyelesaian,
          pelapor: {
            ...prev.pelapor,
            nama: editForm.namaPelapor,
            noHp: editForm.noHpPelapor,
            alamat: editForm.alamatPelapor,
          },
        }));
      }
      setTimeout(() => {
        setEditModalOpen(false);
        fetchList();
      }, 1000);
    } catch (err: any) {
      setEditFeedback({ type: "error", message: err.message });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (item: PengaduanAdminItem) => {
    setDeleteItem(item);
    setDeleteFeedback(null);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/admin/pengaduan?id=${deleteItem.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal menghapus pengaduan.");

      setDeleteModalOpen(false);
      if (selectedItem?.id === deleteItem.id) {
        setDetailModalOpen(false);
        setSelectedItem(null);
      }
      fetchList();
    } catch (err: any) {
      setDeleteFeedback(err.message);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Load Referensi Filter & Info User
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setCurrentUser(d.user);
          if (d.user.role === "ADMIN_KECAMATAN" && d.user.kecamatanId) {
            setSelectedKecamatan(d.user.kecamatanId);
          }
        }
      })
      .catch((err) => console.error("Gagal load session user:", err));

    fetch("/api/public/bidang")
      .then((r) => r.json())
      .then((d) => d.success && setBidangList(d.data));

    fetch("/api/public/wilayah")
      .then((r) => r.json())
      .then((d) => d.success && setKecamatanList(d.data));
  }, []);

  // Load Daftar Desa berdasarkan Kecamatan yang Dipilih / Otoritas Wilayah
  useEffect(() => {
    if (currentUser?.role === "ADMIN_DESA") return;

    const targetKecamatan = selectedKecamatan || (currentUser?.role === "ADMIN_KECAMATAN" ? currentUser.kecamatanId : "");

    if (targetKecamatan) {
      fetch(`/api/public/wilayah?kd_kecamatan=${targetKecamatan}`)
        .then((r) => r.json())
        .then((d) => d.success && setDesaList(d.data))
        .catch((e) => console.error("Gagal load daftar desa:", e));
    } else {
      fetch("/api/public/wilayah?all_desa=true")
        .then((r) => r.json())
        .then((d) => d.success && setDesaList(d.data))
        .catch((e) => console.error("Gagal load semua desa:", e));
    }
  }, [selectedKecamatan, currentUser]);

  // Fetch Pengaduan List
  const fetchList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeStatus) params.set("status", activeStatus);
      if (searchQuery) params.set("search", searchQuery);
      if (selectedBidangId) params.set("bidangId", selectedBidangId);
      if (selectedKecamatan) params.set("kd_kecamatan", selectedKecamatan);
      if (selectedDesa) params.set("kd_desa", selectedDesa);
      params.set("page", page.toString());
      params.set("limit", "10");

      const res = await fetch(`/api/admin/pengaduan?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
        setPagination(json.pagination);
      }
    } catch (e) {
      console.error("Gagal load pengaduan:", e);
    } finally {
      setLoading(false);
    }
  };

  // Sinkronisasi otomatis saat query URL (status / search) berubah dari Sidebar atau link eksternal
  useEffect(() => {
    const qStatus = searchParams.get("status") || "";
    const qSearch = searchParams.get("search") || "";
    setActiveStatus(qStatus);
    setSearchQuery(qSearch);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    fetchList();
  }, [activeStatus, selectedBidangId, selectedKecamatan, selectedDesa, page]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchList();
  };

  // Helper Hak Akses Verifikasi & Tindak Lanjut
  const getVerificationAuth = (item: PengaduanAdminItem | null, user: CurrentUser | null) => {
    if (!item || !user) return { canVerify: false, reason: "Memuat hak akses..." };

    if (["SUPERADMIN", "ADMIN_KABUPATEN"].includes(user.role)) {
      if (item.status === "MENUNGGU_VERIFIKASI_KABUPATEN") {
        return { canVerify: true, reason: "" };
      }
      return {
        canVerify: false,
        reason: "Pengaduan ini belum masuk ke tahap verifikasi Kabupaten.",
      };
    }

    if (user.role === "ADMIN_KECAMATAN") {
      if (item.lokasi.kd_kecamatan && user.kecamatanId && item.lokasi.kd_kecamatan !== user.kecamatanId) {
        return {
          canVerify: false,
          reason: `Akses Ditolak: Anda login sebagai Admin Kecamatan ${user.kecamatan?.nm_kecamatan || user.kecamatanId}. Anda tidak berwenang memverifikasi pengaduan dari kecamatan lain.`,
        };
      }
      if (item.status !== "MENUNGGU_VERIFIKASI_KECAMATAN") {
        return {
          canVerify: false,
          reason:
            item.status === "MENUNGGU_VERIFIKASI_DESA"
              ? "Pengaduan ini masih menunggu verifikasi di tingkat Desa terlebih dahulu."
              : "Pengaduan ini telah melewati tahap verifikasi Kecamatan.",
        };
      }
      return { canVerify: true, reason: "" };
    }

    if (user.role === "ADMIN_DESA") {
      if (item.lokasi.kd_desa && user.desaId && item.lokasi.kd_desa !== user.desaId) {
        return {
          canVerify: false,
          reason: `Akses Ditolak: Anda login sebagai Admin Desa ${user.desa?.nm_desa || user.desaId}. Anda tidak berwenang memverifikasi data pengaduan dari desa lain.`,
        };
      }
      if (item.status !== "MENUNGGU_VERIFIKASI_DESA") {
        return {
          canVerify: false,
          reason: "Pengaduan ini sudah diverifikasi di tingkat Desa dan diteruskan ke jenjang berikutnya.",
        };
      }
      return { canVerify: true, reason: "" };
    }

    return { canVerify: false, reason: "Peran akun Anda tidak memiliki hak akses untuk memverifikasi pengaduan ini." };
  };

  const getTindakLanjutAuth = (item: PengaduanAdminItem | null, user: CurrentUser | null) => {
    if (!item || !user) return { canAction: false, reason: "Memuat hak akses..." };
    if (["SUPERADMIN", "ADMIN_KABUPATEN"].includes(user.role)) return { canAction: true, reason: "" };
    if (user.role === "ADMIN_KECAMATAN") {
      if (item.lokasi.kd_kecamatan && user.kecamatanId && item.lokasi.kd_kecamatan !== user.kecamatanId) {
        return {
          canAction: false,
          reason: `Akses Ditolak: Hanya dapat menindaklanjuti pengaduan di wilayah Kecamatan ${user.kecamatan?.nm_kecamatan || user.kecamatanId}.`,
        };
      }
      return { canAction: true, reason: "" };
    }
    if (user.role === "ADMIN_DESA") {
      if (item.lokasi.kd_desa && user.desaId && item.lokasi.kd_desa !== user.desaId) {
        return {
          canAction: false,
          reason: `Akses Ditolak: Hanya dapat menindaklanjuti pengaduan di wilayah Desa ${user.desa?.nm_desa || user.desaId}.`,
        };
      }
      return { canAction: true, reason: "" };
    }
    return { canAction: false, reason: "Tidak memiliki hak akses." };
  };

  const isItemVerified = (item: PengaduanAdminItem) => {
    return item.status !== "MENUNGGU_VERIFIKASI_DESA" && item.status !== "BARU";
  };

  const getRollbackAuth = (item: PengaduanAdminItem | null, user: CurrentUser | null) => {
    if (!item || !user) return { canRollback: false, reason: "Memuat hak akses...", targetTier: "" };

    if (item.status === "MENUNGGU_VERIFIKASI_DESA" || item.status === "BARU") {
      return {
        canRollback: false,
        reason: "Pengaduan masih berada pada tahap awal (belum ada verifikasi yang disetujui).",
        targetTier: "",
      };
    }

    if (item.status === "MENUNGGU_VERIFIKASI_KECAMATAN") {
      // Diverifikasi oleh Desa -> Batal ke MENUNGGU_VERIFIKASI_DESA
      const isDesaMatch = user.role === "ADMIN_DESA" && (!item.lokasi.kd_desa || user.desaId === item.lokasi.kd_desa);
      const isKab = ["SUPERADMIN", "ADMIN_KABUPATEN"].includes(user.role);

      if (isDesaMatch || isKab) {
        return {
          canRollback: true,
          targetTier: "Desa",
          targetStatus: "MENUNGGU_VERIFIKASI_DESA",
          targetLabel: "Tahap Desa",
          reason: "",
        };
      }

      if (user.role === "ADMIN_DESA") {
        return {
          canRollback: false,
          targetTier: "Desa",
          reason: `Akses Ditolak: Anda login sebagai Admin Desa ${user.desa?.nm_desa || user.desaId}. Anda bukan Admin Desa asal pengaduan ini.`,
        };
      }

      return {
        canRollback: false,
        targetTier: "Desa",
        reason: "Hanya Admin Desa asal atau Admin Kabupaten yang dapat membatalkan verifikasi tahap Desa.",
      };
    }

    if (item.status === "MENUNGGU_VERIFIKASI_KABUPATEN") {
      // Diverifikasi oleh Kecamatan -> Batal ke MENUNGGU_VERIFIKASI_KECAMATAN
      if (user.role === "ADMIN_DESA") {
        return {
          canRollback: false,
          targetTier: "Kecamatan",
          reason: "Pembatalan harus dilakukan secara berjenjang: Verifikasi tahap Kecamatan harus dibatalkan terlebih dahulu oleh Admin Kecamatan sebelum Admin Desa dapat membatalkan verifikasi tahap Desa.",
        };
      }

      const isKecMatch = user.role === "ADMIN_KECAMATAN" && (!item.lokasi.kd_kecamatan || user.kecamatanId === item.lokasi.kd_kecamatan);
      const isKab = ["SUPERADMIN", "ADMIN_KABUPATEN"].includes(user.role);

      if (isKecMatch || isKab) {
        return {
          canRollback: true,
          targetTier: "Kecamatan",
          targetStatus: "MENUNGGU_VERIFIKASI_KECAMATAN",
          targetLabel: "Tahap Kecamatan",
          reason: "",
        };
      }

      if (user.role === "ADMIN_KECAMATAN") {
        return {
          canRollback: false,
          targetTier: "Kecamatan",
          reason: `Akses Ditolak: Anda login sebagai Admin Kecamatan ${user.kecamatan?.nm_kecamatan || user.kecamatanId}. Anda bukan Admin Kecamatan asal pengaduan ini.`,
        };
      }

      return {
        canRollback: false,
        targetTier: "Kecamatan",
        reason: "Hanya Admin Kecamatan asal pengaduan atau Admin Kabupaten yang dapat membatalkan verifikasi tahap Kecamatan.",
      };
    }

    if (item.status === "DITINDAKLANJUTI" || item.status === "DISETUJUI") {
      // Diverifikasi oleh Kabupaten -> Batal ke MENUNGGU_VERIFIKASI_KABUPATEN
      if (user.role === "ADMIN_DESA" || user.role === "ADMIN_KECAMATAN") {
        return {
          canRollback: false,
          targetTier: "Kabupaten",
          reason: "Pembatalan harus dilakukan secara berjenjang: Verifikasi tahap Kabupaten harus dibatalkan terlebih dahulu oleh Admin Kabupaten sebelum tahap di bawahnya dapat dibatalkan.",
        };
      }

      if (["SUPERADMIN", "ADMIN_KABUPATEN"].includes(user.role)) {
        return {
          canRollback: true,
          targetTier: "Kabupaten",
          targetStatus: "MENUNGGU_VERIFIKASI_KABUPATEN",
          targetLabel: "Tahap Kabupaten",
          reason: "",
        };
      }

      return {
        canRollback: false,
        targetTier: "Kabupaten",
        reason: "Hanya Admin Kabupaten / Superadmin yang dapat membatalkan verifikasi tahap Kabupaten.",
      };
    }

    if (item.status === "SELESAI") {
      if (["SUPERADMIN", "ADMIN_KABUPATEN"].includes(user.role)) {
        return {
          canRollback: true,
          targetTier: "Penyelesaian",
          targetStatus: "DITINDAKLANJUTI",
          targetLabel: "Status Selesai (Buka Kembali Kasus)",
          reason: "",
        };
      }

      return {
        canRollback: false,
        targetTier: "",
        reason: "Pengaduan telah berstatus SELESAI. Hanya Superadmin atau Admin Kabupaten yang dapat membuka kembali kasus ini.",
      };
    }

    if (item.status === "DITOLAK" || item.status === "PERLU_PERBAIKAN") {
      const isSuper = user.role === "SUPERADMIN";
      const isKab = user.role === "ADMIN_KABUPATEN";
      const isKecMatch = user.role === "ADMIN_KECAMATAN" && (!item.lokasi.kd_kecamatan || user.kecamatanId === item.lokasi.kd_kecamatan);
      const isDesaMatch = user.role === "ADMIN_DESA" && (!item.lokasi.kd_desa || user.desaId === item.lokasi.kd_desa);

      if (isSuper || isKab || isKecMatch || isDesaMatch) {
        return {
          canRollback: true,
          targetTier: item.status === "DITOLAK" ? "Penolakan" : "Perbaikan",
          targetStatus: "MENUNGGU_VERIFIKASI_DESA",
          targetLabel: item.status === "DITOLAK" ? "Penolakan (Tinjau Ulang)" : "Permintaan Perbaikan",
          reason: "",
        };
      }

      return {
        canRollback: false,
        targetTier: "",
        reason: `Akses Ditolak: Anda tidak memiliki wewenang untuk membatalkan status ${item.status} pengaduan di luar wilayah penugasan Anda.`,
      };
    }

    return {
      canRollback: false,
      targetTier: "",
      reason: `Status pengaduan saat ini (${item.status}) tidak mendukung pembatalan verifikasi berjenjang.`,
    };
  };

  const handleProcessBatalVerifikasi = async () => {
    if (!selectedItem) return;

    setBatalSubmitting(true);
    setBatalFeedback(null);

    try {
      const res = await fetch("/api/admin/pengaduan/verifikasi/batal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pengaduanId: selectedItem.id,
          alasan: batalAlasan,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal membatalkan verifikasi.");
      }

      setBatalFeedback({
        type: "success",
        message: json.message,
      });

      // Update item terpilih lokal
      setSelectedItem((prev: any) => ({
        ...prev,
        status: json.data.status,
      }));

      // Refresh tabel
      fetchList();

      setTimeout(() => {
        setBatalModalOpen(false);
        setBatalAlasan("");
        setBatalFeedback(null);
      }, 1200);
    } catch (err: any) {
      setBatalFeedback({
        type: "error",
        message: err.message || "Terjadi kendala saat membatalkan verifikasi.",
      });
    } finally {
      setBatalSubmitting(false);
    }
  };

  const canManageItem = (item: PengaduanAdminItem) => {
    if (!currentUser) return false;
    if (["SUPERADMIN", "ADMIN_KABUPATEN"].includes(currentUser.role)) return true;
    if (currentUser.role === "ADMIN_KECAMATAN") {
      return !item.lokasi.kd_kecamatan || item.lokasi.kd_kecamatan === currentUser.kecamatanId;
    }
    if (currentUser.role === "ADMIN_DESA") {
      return !item.lokasi.kd_desa || item.lokasi.kd_desa === currentUser.desaId;
    }
    return false;
  };

  // Handle Verifikasi Action
  const handleProcessVerifikasi = async (keputusan: "DISETUJUI" | "PERLU_PERBAIKAN" | "DITOLAK") => {
    if (!selectedItem) return;

    const authCheck = getVerificationAuth(selectedItem, currentUser);
    if (!authCheck.canVerify) {
      setVerifFeedback({
        type: "error",
        message: authCheck.reason,
      });
      return;
    }

    let tahap: "DESA" | "KECAMATAN" | "KABUPATEN" = "DESA";
    if (selectedItem.status === "MENUNGGU_VERIFIKASI_KECAMATAN") tahap = "KECAMATAN";
    if (selectedItem.status === "MENUNGGU_VERIFIKASI_KABUPATEN") tahap = "KABUPATEN";

    if ((keputusan === "DITOLAK" || keputusan === "PERLU_PERBAIKAN") && !verifCatatan.trim()) {
      setVerifFeedback({
        type: "error",
        message: "Harap isi catatan verifikasi untuk memberikan alasan perbaikan atau penolakan kepada pelapor.",
      });
      return;
    }

    setVerifSubmitting(true);
    setVerifFeedback(null);

    try {
      const res = await fetch("/api/admin/pengaduan/verifikasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pengaduanId: selectedItem.id,
          tahap,
          keputusan,
          catatan: verifCatatan,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memproses verifikasi.");
      }

      setVerifFeedback({
        type: "success",
        message: json.message,
      });

      // Update state item lokal & refresh list
      setSelectedItem((prev: any) => ({
        ...prev,
        status: json.data.status,
      }));

      fetchList();
      setVerifCatatan("");
    } catch (err: any) {
      setVerifFeedback({
        type: "error",
        message: err.message || "Terjadi kendala saat verifikasi.",
      });
    } finally {
      setVerifSubmitting(false);
    }
  };

  // Handle Tindak Lanjut Action
  const handleProcessTindakLanjut = async () => {
    if (!selectedItem) return;

    const tlAuth = getTindakLanjutAuth(selectedItem, currentUser);
    if (!tlAuth.canAction) {
      setVerifFeedback({
        type: "error",
        message: tlAuth.reason,
      });
      return;
    }

    if (!tlUraian.trim()) {
      setVerifFeedback({
        type: "error",
        message: "Harap isi uraian tindakan lapangan yang dilakukan.",
      });
      return;
    }

    setTlSubmitting(true);
    setVerifFeedback(null);

    try {
      const res = await fetch("/api/admin/pengaduan/tindak-lanjut", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pengaduanId: selectedItem.id,
          jenis: tlJenis,
          uraian: tlUraian,
          hasil: tlHasil,
          tandaiSelesai: tlSelesai,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mencatat tindak lanjut.");
      }

      setVerifFeedback({
        type: "success",
        message: json.message,
      });

      setSelectedItem((prev: any) => ({
        ...prev,
        status: tlSelesai ? "SELESAI" : "DITINDAKLANJUTI",
        hasilPenyelesaian: tlHasil,
        tindakLanjutList: [
          {
            id: json.data.id,
            jenis: tlJenis,
            uraian: tlUraian,
            hasil: tlHasil,
            tanggal: new Date().toISOString(),
            petugasNama: "Anda (Petugas)",
          },
          ...(prev.tindakLanjutList || []),
        ],
      }));

      fetchList();
      setTlUraian("");
      setTlHasil("");
      setTlSelesai(false);
    } catch (err: any) {
      setVerifFeedback({
        type: "error",
        message: err.message || "Terjadi kendala saat mencatat tindak lanjut.",
      });
    } finally {
      setTlSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "MENUNGGU_VERIFIKASI_DESA":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Verifikasi Desa</span>;
      case "MENUNGGU_VERIFIKASI_KECAMATAN":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">Verifikasi Camat</span>;
      case "MENUNGGU_VERIFIKASI_KABUPATEN":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">Verifikasi Dinas</span>;
      case "DITINDAKLANJUTI":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 border border-cyan-200">Ditindaklanjuti</span>;
      case "SELESAI":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Selesai</span>;
      case "PERLU_PERBAIKAN":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">Perbaikan Berkas</span>;
      case "DITOLAK":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Ditolak</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const statusTabs = [
    { label: "Semua Pengaduan", value: "" },
    { label: "Verifikasi Desa", value: "MENUNGGU_VERIFIKASI_DESA" },
    { label: "Verifikasi Kecamatan", value: "MENUNGGU_VERIFIKASI_KECAMATAN" },
    { label: "Verifikasi Kabupaten", value: "MENUNGGU_VERIFIKASI_KABUPATEN" },
    { label: "Ditindaklanjuti", value: "DITINDAKLANJUTI" },
    { label: "Selesai", value: "SELESAI" },
    { label: "Perlu Perbaikan", value: "PERLU_PERBAIKAN" },
    { label: "Ditolak", value: "DITOLAK" },
  ];

  const filteredStatusTabs = (() => {
    if (!currentUser) return statusTabs;
    if (currentUser.role === "ADMIN_DESA") {
      return statusTabs.filter(
        (t) =>
          t.value !== "MENUNGGU_VERIFIKASI_KECAMATAN" &&
          t.value !== "MENUNGGU_VERIFIKASI_KABUPATEN"
      );
    }
    if (currentUser.role === "ADMIN_KECAMATAN") {
      return statusTabs.filter(
        (t) =>
          t.value !== "MENUNGGU_VERIFIKASI_DESA" &&
          t.value !== "MENUNGGU_VERIFIKASI_KABUPATEN"
      );
    }
    return statusTabs;
  })();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Lembar Kerja Pengaduan SPM
            </h1>
            {currentUser && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1.5 shadow-2xs">
                <MapPin size={13} className="text-teal-600" />
                {currentUser.role === "ADMIN_DESA"
                  ? `Wilayah: Desa ${currentUser.desa?.nm_desa || currentUser.desaId || "-"}`
                  : currentUser.role === "ADMIN_KECAMATAN"
                  ? `Wilayah: Kec. ${currentUser.kecamatan?.nm_kecamatan || currentUser.kecamatanId || "-"}`
                  : `Wilayah: Kab. Tapanuli Selatan`}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola, verifikasi berjenjang, dan pantau penyelesaian laporan pemenuhan standar pelayanan minimal.
          </p>
        </div>

        <button
          onClick={fetchList}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-2xs self-start sm:self-auto hover:border-slate-300"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-teal-600" : ""} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* FILTER TABS STATUS */}
      <div className="flex overflow-x-auto pb-1.5 gap-2 border-b border-slate-200 no-scrollbar">
        {filteredStatusTabs.map((tab) => {
          const isActive = activeStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setActiveStatus(tab.value);
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-teal-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Nomor, NIK, atau Nama Pelapor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition bg-white shadow-2xs"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Filter Bidang */}
          <select
            value={selectedBidangId}
            onChange={(e) => {
              setSelectedBidangId(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs font-medium"
          >
            <option value="">Semua Bidang SPM</option>
            {bidangList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nm_bidang}
              </option>
            ))}
          </select>

          {/* Filter Wilayah Kecamatan & Desa */}
          {currentUser?.role === "ADMIN_DESA" ? (
            <div className="px-3 py-2 rounded-xl border border-teal-200 bg-teal-50/70 text-teal-900 text-xs flex items-center gap-1.5 font-semibold">
              <MapPin size={13} className="text-teal-700" />
              <span>Desa {currentUser.desa?.nm_desa || currentUser.desaId}</span>
            </div>
          ) : currentUser?.role === "ADMIN_KECAMATAN" ? (
            <>
              <div className="px-3 py-2 rounded-xl border border-teal-200 bg-teal-50/70 text-teal-900 text-xs flex items-center gap-1.5 font-semibold">
                <MapPin size={13} className="text-teal-700" />
                <span>Kec. {currentUser.kecamatan?.nm_kecamatan || currentUser.kecamatanId}</span>
              </div>

              {/* Filter Desa untuk Admin Kecamatan */}
              <select
                value={selectedDesa}
                onChange={(e) => {
                  setSelectedDesa(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:border-teal-500"
              >
                <option value="">Semua Desa / Kelurahan</option>
                {desaList.map((d) => (
                  <option key={d.kd_desa} value={d.kd_desa}>
                    {d.nm_desa}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              {/* Filter Kecamatan untuk Kabupaten/Superadmin */}
              <select
                value={selectedKecamatan}
                onChange={(e) => {
                  setSelectedKecamatan(e.target.value);
                  setSelectedDesa("");
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:border-teal-500"
              >
                <option value="">Semua Kecamatan</option>
                {kecamatanList.map((k) => (
                  <option key={k.kd_kecamatan} value={k.kd_kecamatan}>
                    {k.nm_kecamatan}
                  </option>
                ))}
              </select>

              {/* Filter Desa untuk Kabupaten/Superadmin */}
              <select
                value={selectedDesa}
                onChange={(e) => {
                  setSelectedDesa(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:border-teal-500"
              >
                <option value="">
                  {selectedKecamatan ? "Semua Desa di Kecamatan Terpilih" : "Semua Desa / Kelurahan"}
                </option>
                {desaList.map((d) => (
                  <option key={d.kd_desa} value={d.kd_desa}>
                    {d.nm_desa}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Nomor Pengaduan</th>
                <th className="px-5 py-3.5">Pelapor</th>
                <th className="px-5 py-3.5">Lokasi Wilayah</th>
                <th className="px-5 py-3.5">Bidang & Kategori SPM</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-teal-700">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                    <span>Memuat data pengaduan...</span>
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-slate-900 block">{p.nomorPengaduan}</span>
                        {(p.dokumenCount > 0 || (p.dokumen && p.dokumen.length > 0)) && (
                          <span
                            className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-200"
                            title={`Tersedia ${p.dokumenCount || p.dokumen?.length} dokumen lampiran pelapor`}
                          >
                            <Paperclip size={10} />
                            <span>{p.dokumenCount || p.dokumen?.length}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(p.tanggalPengaduan).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-800 block">{p.pelapor.nama}</span>
                      <span className="text-[11px] text-slate-400 block">NIK: {p.pelapor.nik || "-"}</span>
                      <span className="text-[11px] text-slate-400 block">WA: {p.pelapor.noHp || "-"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-800 block">{p.lokasi.posyandu}</span>
                      <span className="text-[11px] text-slate-400 block">
                        Desa {p.lokasi.desa}, Kec. {p.lokasi.kecamatan}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-sm">
                      <span className="font-semibold text-teal-800 text-[11px] block">{p.bidang.nama}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.jenisPengaduan.map((j) => (
                          <span
                            key={j.id}
                            className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium"
                          >
                            {j.nama}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedItem(p);
                            setVerifFeedback(null);
                            setVerifCatatan("");
                            setDetailModalOpen(true);
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 font-semibold text-xs transition shadow-xs"
                          title="Detail & Verifikasi"
                        >
                          <Eye size={13} />
                          <span>Detail</span>
                        </button>
                        {isItemVerified(p) && currentUser?.role !== "SUPERADMIN" ? (
                          <span
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200 font-semibold text-xs transition cursor-help"
                            title="Data pengaduan ini telah terverifikasi dan terkunci dari perubahan atau penghapusan. Batalkan verifikasi secara berjenjang terlebih dahulu untuk mengedit atau menghapusnya."
                          >
                            <Lock size={12} className="text-amber-600" />
                            <span>Terkunci</span>
                          </span>
                        ) : canManageItem(p) ? (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold text-xs transition shadow-xs"
                              title="Edit Pengaduan"
                            >
                              <Edit size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(p)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-semibold text-xs transition shadow-xs"
                              title="Hapus Pengaduan"
                            >
                              <Trash2 size={13} />
                              <span>Hapus</span>
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 italic">
                    Tidak ada pengaduan yang sesuai dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Total: <strong>{pagination.total}</strong> pengaduan tercatat
          </span>

          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold">
              Halaman {page} dari {pagination.totalPages || 1}
            </span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL / DIALOG DETAIL & VERIFIKASI BERJENJANG */}
      {detailModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                  Lembar Kerja Verifikasi Pengaduan
                </span>
                <h3 className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {selectedItem.nomorPengaduan}
                </h3>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {verifFeedback && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start space-x-2 ${
                    verifFeedback.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  {verifFeedback.type === "success" ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{verifFeedback.message}</span>
                </div>
              )}

              {/* Status Header Bar */}
              <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 gap-2">
                <div>
                  <span className="text-slate-500 block text-[11px]">Status Saat Ini:</span>
                  <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Token Pelacakan Publik:</span>
                  <span className="font-mono font-bold text-teal-800 text-sm">{selectedItem.tokenPelacakan}</span>
                </div>
              </div>

              {/* Data Pelapor & Lokasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <User size={14} className="text-teal-600" />
                    <span>Identitas Pelapor</span>
                  </h4>
                  <div>
                    <span className="text-slate-500 block">Nama:</span>
                    <span className="font-bold text-slate-900">{selectedItem.pelapor.nama}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">NIK:</span>
                    <span className="font-semibold text-slate-800">{selectedItem.pelapor.nik || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">WhatsApp / No. HP:</span>
                    <span className="font-semibold text-slate-800">{selectedItem.pelapor.noHp || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Alamat Domisili:</span>
                    <span className="text-slate-700">{selectedItem.pelapor.alamat}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <MapPin size={14} className="text-teal-600" />
                    <span>Lokasi & Posyandu Terdekat</span>
                  </h4>
                  <div>
                    <span className="text-slate-500 block">Posyandu:</span>
                    <span className="font-bold text-slate-900">{selectedItem.lokasi.posyandu}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Desa:</span>
                    <span className="font-semibold text-slate-800">{selectedItem.lokasi.desa}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Kecamatan:</span>
                    <span className="font-semibold text-slate-800">{selectedItem.lokasi.kecamatan}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tanggal Laporan:</span>
                    <span className="text-slate-700">
                      {new Date(selectedItem.tanggalPengaduan).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })} WIB
                    </span>
                  </div>
                </div>
              </div>

              {/* Bidang & Kategori Masalah Terpilih */}
              <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/30 space-y-2">
                <span className="text-slate-500 block text-[11px] font-semibold">Bidang SPM Terkait:</span>
                <span className="font-bold text-teal-900 text-sm block">{selectedItem.bidang.nama}</span>

                <span className="text-slate-500 block text-[11px] font-semibold pt-1">
                  Kategori Masalah yang Dicentang ({selectedItem.jenisPengaduan.length}):
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {selectedItem.jenisPengaduan.map((j) => (
                    <span
                      key={j.id}
                      className="px-2.5 py-1 rounded-lg bg-teal-100/70 text-teal-900 font-semibold border border-teal-200"
                    >
                      {j.nama}
                    </span>
                  ))}
                </div>
              </div>

              {/* Uraian Masalah */}
              <div>
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block mb-1">
                  Uraian Masalah / Permohonan Bantuan:
                </span>
                <p className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedItem.deskripsi}
                </p>
              </div>

              {/* Catatan Verifikator Sebelumnya jika ada */}
              {selectedItem.catatan && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                  <span className="font-bold block mb-0.5">Catatan Verifikator:</span>
                  <span>{selectedItem.catatan}</span>
                </div>
              )}

              {/* DOKUMEN LAMPIRAN PELAPOR */}
              <div className="space-y-2.5 p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                    <Paperclip size={15} className="text-teal-600" />
                    <span>Dokumen Lampiran Pelapor ({selectedItem.dokumen?.length || selectedItem.dokumenCount || 0})</span>
                  </span>
                  {selectedItem.dokumen && selectedItem.dokumen.length > 0 && (
                    <span className="text-[10px] text-teal-800 bg-teal-100/80 px-2.5 py-0.5 rounded-full font-bold">
                      Tersedia untuk Diverifikasi
                    </span>
                  )}
                </div>

                {selectedItem.dokumen && selectedItem.dokumen.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    {selectedItem.dokumen.map((doc, idx) => {
                      const isImage =
                        doc.pathFile?.startsWith("data:image/") ||
                        /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.namaFile || doc.pathFile);
                      const isPdf =
                        doc.pathFile?.startsWith("data:application/pdf") ||
                        /\.pdf$/i.test(doc.namaFile || doc.pathFile);

                      const getJenisLabel = (jenis: string) => {
                        switch (jenis) {
                          case "KTP":
                            return "KTP Pelapor";
                          case "KARTU_KELUARGA":
                            return "Kartu Keluarga (KK)";
                          case "SURAT_KETERANGAN_TIDAK_MAMPU":
                            return "SKTM / Keterangan Tidak Mampu";
                          default:
                            return "Dokumen Pendukung";
                        }
                      };

                      return (
                        <div
                          key={doc.id || idx}
                          className="p-3 rounded-xl border border-slate-200 bg-white hover:border-teal-400 hover:shadow-xs transition group flex flex-col justify-between space-y-2.5"
                        >
                          <div className="flex items-start space-x-2.5">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                              {isImage && doc.pathFile ? (
                                <img
                                  src={doc.pathFile}
                                  alt={doc.namaFile}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : isPdf ? (
                                <FileText size={20} className="text-rose-600" />
                              ) : (
                                <Paperclip size={18} className="text-teal-600" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700 mb-0.5 truncate max-w-full">
                                {getJenisLabel(doc.jenis)}
                              </span>
                              <p className="font-semibold text-slate-800 text-xs truncate" title={doc.namaFile}>
                                {doc.namaFile || "Lampiran Berkas"}
                              </p>
                              <span className="text-[10px] text-slate-400 block">
                                {isImage ? "Format Gambar" : isPdf ? "Dokumen PDF" : "Berkas Lampiran"}
                              </span>
                            </div>
                          </div>

                          <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="flex-1 inline-flex items-center justify-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[11px] transition border border-teal-200"
                            >
                              <Eye size={12} />
                              <span>Lihat Dokumen</span>
                            </button>
                            {doc.pathFile && !doc.pathFile.startsWith("data:") && (
                              <a
                                href={doc.pathFile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-[11px] transition"
                                title="Buka di Tab Baru"
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-white text-slate-500 text-xs flex items-center space-x-2">
                    <AlertCircle size={15} className="text-slate-400 shrink-0" />
                    <span>Tidak ada dokumen lampiran yang diunggah oleh pelapor untuk pengaduan ini.</span>
                  </div>
                )}
              </div>

              {/* STATUS TERVERIFIKASI & PENGUNCIAN DATA BERJENJANG */}
              {isItemVerified(selectedItem) && (() => {
                const rollbackAuth = getRollbackAuth(selectedItem, currentUser);
                const isSuperAdmin = currentUser?.role === "SUPERADMIN";
                return (
                  <div
                    className={`p-4 rounded-xl border text-xs space-y-2.5 ${
                      isSuperAdmin
                        ? "border-indigo-200 bg-indigo-50/70"
                        : "border-amber-200 bg-amber-50/70"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-start space-x-2.5 text-slate-800">
                        <Lock
                          size={18}
                          className={`shrink-0 mt-0.5 ${
                            isSuperAdmin ? "text-indigo-600" : "text-amber-600"
                          }`}
                        />
                        <div>
                          <span
                            className={`font-bold block ${
                              isSuperAdmin ? "text-indigo-950" : "text-amber-950"
                            }`}
                          >
                            {isSuperAdmin
                              ? "Superadmin Override: Hak Akses Penuh (Edit / Hapus / Batalkan)"
                              : "Data Pengaduan Terverifikasi & Terkunci"}
                          </span>
                          <p className="text-slate-600 text-[11px] leading-relaxed mt-0.5">
                            {isSuperAdmin
                              ? "Sebagai Superadmin, Anda memiliki hak penuh untuk merubah isi data, menghapus pengaduan, atau membatalkan status verifikasi (termasuk pengaduan yang sudah Selesai, Ditolak, atau Perlu Perbaikan)."
                              : "Data yang telah terverifikasi tidak boleh diedit atau dihapus. Untuk melakukan perbaikan data atau penghapusan, verifikasi harus dibatalkan secara berjenjang terlebih dahulu."}
                          </p>
                        </div>
                      </div>
                      {rollbackAuth.canRollback && (
                        <button
                          type="button"
                          onClick={() => {
                            setBatalFeedback(null);
                            setBatalAlasan("");
                            setBatalModalOpen(true);
                          }}
                          className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-white font-bold text-xs transition shadow-xs shrink-0 self-start sm:self-auto ${
                            isSuperAdmin
                              ? "bg-indigo-600 hover:bg-indigo-700"
                              : "bg-amber-600 hover:bg-amber-700"
                          }`}
                          title={`Batalkan verifikasi ${rollbackAuth.targetLabel}`}
                        >
                          <Undo2 size={14} />
                          <span>
                            {selectedItem.status === "SELESAI"
                              ? "Buka Kembali Kasus Selesai"
                              : `Batalkan Verifikasi (${rollbackAuth.targetLabel})`}
                          </span>
                        </button>
                      )}
                    </div>

                    {!rollbackAuth.canRollback && rollbackAuth.reason && (
                      <div className="p-2.5 rounded-lg bg-amber-100/70 text-amber-900 text-[11px] font-medium flex items-start space-x-1.5">
                        <AlertCircle size={14} className="shrink-0 text-amber-700 mt-0.5" />
                        <span>{rollbackAuth.reason}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* AKSI VERIFIKASI BERJENJANG */}
              {["MENUNGGU_VERIFIKASI_DESA", "MENUNGGU_VERIFIKASI_KECAMATAN", "MENUNGGU_VERIFIKASI_KABUPATEN"].includes(
                selectedItem.status
              ) && (() => {
                const authCheck = getVerificationAuth(selectedItem, currentUser);

                if (!authCheck.canVerify) {
                  return (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 flex items-start space-x-3">
                      <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                          Hak Akses Verifikasi Terbatas
                        </h5>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          {authCheck.reason}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="p-5 rounded-2xl border-2 border-teal-500/30 bg-teal-50/40 space-y-4">
                    <div className="flex items-center space-x-2">
                      <ShieldAlert size={18} className="text-teal-700" />
                      <h4 className="font-bold text-slate-900 text-sm">
                        Form Keputusan Verifikasi{" "}
                        {selectedItem.status === "MENUNGGU_VERIFIKASI_DESA"
                          ? "Tahap Desa"
                          : selectedItem.status === "MENUNGGU_VERIFIKASI_KECAMATAN"
                          ? "Tahap Kecamatan"
                          : "Tahap Kabupaten"}
                      </h4>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Catatan / Rekomendasi Verifikator:
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Tuliskan catatan hasil pemeriksaan berkas atau survei lapangan... (Wajib jika menolak atau meminta perbaikan)"
                        value={verifCatatan}
                        onChange={(e) => setVerifCatatan(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition bg-white"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={verifSubmitting}
                          onClick={() => handleProcessVerifikasi("PERLU_PERBAIKAN")}
                          className="px-3.5 py-2 rounded-xl border border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 font-bold transition disabled:opacity-50"
                        >
                          Minta Perbaikan Berkas
                        </button>

                        <button
                          type="button"
                          disabled={verifSubmitting}
                          onClick={() => handleProcessVerifikasi("DITOLAK")}
                          className="px-3.5 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold transition disabled:opacity-50"
                        >
                          Tolak Pengaduan
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={verifSubmitting}
                        onClick={() => handleProcessVerifikasi("DISETUJUI")}
                        className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
                      >
                        {verifSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                        <span>
                          {selectedItem.status === "MENUNGGU_VERIFIKASI_DESA"
                            ? "Setujui & Teruskan ke Kecamatan"
                            : selectedItem.status === "MENUNGGU_VERIFIKASI_KECAMATAN"
                            ? "Setujui & Teruskan ke Kabupaten"
                            : "Setujui & Terbitkan Tindak Lanjut"}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* RIWAYAT INTERVENSI & TINDAK LANJUT */}
              {selectedItem.tindakLanjutList && selectedItem.tindakLanjutList.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                    Riwayat Tindakan Lapangan & Intervensi ({selectedItem.tindakLanjutList.length}):
                  </span>
                  <div className="space-y-2.5">
                    {selectedItem.tindakLanjutList.map((tl) => (
                      <div
                        key={tl.id}
                        className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px]">
                            {tl.jenis.replace(/_/g, " ")}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(tl.tanggal).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })} WIB
                          </span>
                        </div>
                        <p className="text-slate-800 font-medium">{tl.uraian}</p>
                        {tl.hasil && (
                          <div className="pt-1 text-slate-600 border-t border-emerald-100/80">
                            <span className="font-semibold text-emerald-900">Hasil / Dampak: </span>
                            {tl.hasil}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500 italic">
                          Oleh: {tl.petugasNama}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STATUS SELESAI BANNER */}
              {selectedItem.status === "SELESAI" && (
                <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 flex items-start space-x-3">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-wider">Pengaduan SPM Telah Selesai</h5>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Intervensi lapangan telah dilaksanakan dan permohonan/masalah warga dinyatakan selesai tertangani.
                    </p>
                    {selectedItem.hasilPenyelesaian && (
                      <p className="text-xs font-medium text-emerald-950 mt-1.5 p-2 bg-emerald-100/60 rounded-lg">
                        <strong>Keterangan Akhir:</strong> {selectedItem.hasilPenyelesaian}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* FORM CATAT TINDAK LANJUT LAPANGAN (KHUSUS STATUS DITINDAKLANJUTI & SELESAI) */}
              {(selectedItem.status === "DITINDAKLANJUTI" || selectedItem.status === "SELESAI") && (() => {
                const tlAuth = getTindakLanjutAuth(selectedItem, currentUser);

                if (!tlAuth.canAction) {
                  return (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 flex items-start space-x-2.5">
                      <AlertCircle size={18} className="text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                          Pencatatan Tindak Lanjut Terbatas
                        </h5>
                        <p className="text-xs text-slate-600 mt-0.5">{tlAuth.reason}</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="p-5 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/30 space-y-3.5">
                    <div className="flex items-center space-x-2">
                      <HeartHandshake size={18} className="text-emerald-700" />
                      <h4 className="font-bold text-slate-900 text-sm">
                        Pencatatan Tindakan Lapangan / Intervensi SPM
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-1">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Jenis Tindakan:
                        </label>
                        <select
                          value={tlJenis}
                          onChange={(e) => setTlJenis(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition bg-white font-medium"
                        >
                          <option value="KUNJUNGAN_RUMAH">Kunjungan Rumah / Survei</option>
                          <option value="EDUKASI">Edukasi / Konseling</option>
                          <option value="VERIFIKASI_DATA">Verifikasi Data Lapangan</option>
                          <option value="PELAPORAN_PEMERINTAH_DESA">Pelaporan ke Pemerintah Desa</option>
                          <option value="TINDAKAN_LAINNYA">Pemberian Bantuan / Lainnya</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Uraian Tindakan Lapangan *:
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Kunjungan kader dan bidan desa memberikan paket PMT balita..."
                          value={tlUraian}
                          onChange={(e) => setTlUraian(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Hasil Tindakan / Catatan Dampak:
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Contoh: Kondisi balita mulai membaik, berat badan naik 200gr, ibu memahami pola makan sehat..."
                        value={tlHasil}
                        onChange={(e) => setTlHasil(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition bg-white"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tlSelesai}
                          onChange={(e) => setTlSelesai(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                        />
                        <span>Tandai pengaduan ini telah SELESAI (Kasus teratasi sepenuhnya)</span>
                      </label>

                      <button
                        type="button"
                        disabled={tlSubmitting}
                        onClick={handleProcessTindakLanjut}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm disabled:opacity-50 flex items-center space-x-1.5 text-xs"
                      >
                        {tlSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                        <span>Simpan Tindak Lanjut</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {(currentUser?.role === "SUPERADMIN" || (!isItemVerified(selectedItem) && canManageItem(selectedItem))) && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenEditModal(selectedItem);
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold text-xs transition"
                      title="Edit Data Pengaduan"
                    >
                      <Edit size={13} />
                      <span>Edit Data</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenDeleteModal(selectedItem);
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-semibold text-xs transition"
                      title="Hapus Pengaduan"
                    >
                      <Trash2 size={13} />
                      <span>Hapus Permanen</span>
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Edit Pengaduan */}
      {editModalOpen && editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Edit Data Pengaduan</h3>
                <p className="text-xs text-slate-500 font-mono">{editItem.nomorPengaduan}</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-3.5 text-xs overflow-y-auto">
              {editFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold ${
                    editFeedback.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  {editFeedback.message}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nama Pelapor:</label>
                  <input
                    type="text"
                    required
                    value={editForm.namaPelapor}
                    onChange={(e) => setEditForm({ ...editForm, namaPelapor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">No. WhatsApp / HP:</label>
                  <input
                    type="text"
                    value={editForm.noHpPelapor}
                    onChange={(e) => setEditForm({ ...editForm, noHpPelapor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Alamat Pelapor:</label>
                <input
                  type="text"
                  value={editForm.alamatPelapor}
                  onChange={(e) => setEditForm({ ...editForm, alamatPelapor: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Status Pengaduan:</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white font-medium"
                >
                  <option value="MENUNGGU_VERIFIKASI_DESA">Menunggu Verifikasi Desa</option>
                  <option value="MENUNGGU_VERIFIKASI_KECAMATAN">Menunggu Verifikasi Kecamatan</option>
                  <option value="MENUNGGU_VERIFIKASI_KABUPATEN">Menunggu Verifikasi Kabupaten</option>
                  <option value="DITINDAKLANJUTI">Sedang Ditindaklanjuti</option>
                  <option value="DISETUJUI">Disetujui</option>
                  <option value="SELESAI">Selesai</option>
                  <option value="PERLU_PERBAIKAN">Perlu Perbaikan</option>
                  <option value="DITOLAK">Ditolak</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Uraian / Deskripsi Masalah:</label>
                <textarea
                  rows={3}
                  required
                  value={editForm.deskripsi}
                  onChange={(e) => setEditForm({ ...editForm, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan Internal Petugas:</label>
                <textarea
                  rows={2}
                  value={editForm.catatan}
                  onChange={(e) => setEditForm({ ...editForm, catatan: e.target.value })}
                  placeholder="Catatan verifikasi atau rekomendasi..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Hasil Akhir Penyelesaian (Jika Selesai):</label>
                <textarea
                  rows={2}
                  value={editForm.hasilPenyelesaian}
                  onChange={(e) => setEditForm({ ...editForm, hasilPenyelesaian: e.target.value })}
                  placeholder="Bantuan disalurkan / penanganan tuntas..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {editSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteModalOpen && deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Konfirmasi Hapus Pengaduan</h3>
                <p className="text-slate-500 text-[11px]">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            {deleteFeedback && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {deleteFeedback}
              </div>
            )}

            <p className="text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus pengaduan nomor{" "}
              <strong className="font-mono text-slate-900">{deleteItem.nomorPengaduan}</strong> atas nama{" "}
              <strong>{deleteItem.pelapor.nama}</strong>? Seluruh dokumen dan riwayat verifikasi terkait akan ikut terhapus.
            </p>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                {deleteSubmitting && <RefreshCw size={14} className="animate-spin" />}
                <span>Ya, Hapus Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Batal Verifikasi Berjenjang */}
      {batalModalOpen && selectedItem && (() => {
        const rollbackAuth = getRollbackAuth(selectedItem, currentUser);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
              <div className="flex items-center space-x-3 text-amber-600">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Undo2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Batalkan Verifikasi {rollbackAuth.targetLabel || ""}
                  </h3>
                  <p className="text-slate-500 text-[11px]">Pembatalan status secara berjenjang</p>
                </div>
              </div>

              {batalFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold ${
                    batalFeedback.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  {batalFeedback.message}
                </div>
              )}

              <p className="text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin membatalkan verifikasi pengaduan{" "}
                <strong className="font-mono text-slate-900">{selectedItem.nomorPengaduan}</strong>? Status pengaduan akan dikembalikan ke{" "}
                <strong className="text-slate-900 font-bold">{rollbackAuth.targetStatus || "tahap sebelumnya"}</strong>.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Alasan Pembatalan Verifikasi (Opsional):
                </label>
                <textarea
                  rows={2}
                  placeholder="Tuliskan alasan pembatalan untuk audit trail / perbaikan data..."
                  value={batalAlasan}
                  onChange={(e) => setBatalAlasan(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  disabled={batalSubmitting}
                  onClick={() => setBatalModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={batalSubmitting}
                  onClick={handleProcessBatalVerifikasi}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {batalSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  <span>Ya, Batalkan Verifikasi</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Preview Dokumen Lampiran Pelapor */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                <div className="p-2 rounded-xl bg-teal-100 text-teal-800 shrink-0">
                  <Paperclip size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                    {previewDoc.namaFile}
                  </h3>
                  <span className="text-[11px] text-teal-700 font-semibold block">
                    {previewDoc.jenis === "KTP"
                      ? "KTP Pelapor"
                      : previewDoc.jenis === "KARTU_KELUARGA"
                      ? "Kartu Keluarga (KK)"
                      : previewDoc.jenis === "SURAT_KETERANGAN_TIDAK_MAMPU"
                      ? "Surat Keterangan Tidak Mampu"
                      : "Dokumen Lampiran Pendukung"}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                {previewDoc.pathFile && (
                  <a
                    href={previewDoc.pathFile}
                    download={previewDoc.namaFile}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center space-x-1 transition shadow-2xs"
                    title="Unduh Berkas"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">Unduh</span>
                  </a>
                )}
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  title="Tutup Pratinjau"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 flex-1 overflow-auto flex items-center justify-center bg-slate-100/60 min-h-[320px]">
              {previewDoc.pathFile?.startsWith("data:image/") ||
              /\.(jpg|jpeg|png|webp|gif)$/i.test(previewDoc.namaFile || previewDoc.pathFile) ? (
                <div className="max-w-full max-h-[70vh] flex items-center justify-center p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                  <img
                    src={previewDoc.pathFile}
                    alt={previewDoc.namaFile}
                    className="max-h-[65vh] max-w-full object-contain rounded-lg"
                  />
                </div>
              ) : previewDoc.pathFile?.startsWith("data:application/pdf") ||
                /\.pdf$/i.test(previewDoc.namaFile || previewDoc.pathFile) ? (
                <iframe
                  src={previewDoc.pathFile}
                  title={previewDoc.namaFile}
                  className="w-full h-[65vh] rounded-xl border border-slate-200 bg-white"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-xl border border-slate-200 max-w-md shadow-xs">
                  <FileText size={48} className="mx-auto text-teal-600 mb-3" />
                  <p className="text-sm font-bold text-slate-800 mb-1">{previewDoc.namaFile}</p>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    Format berkas ini dapat dibuka langsung di peramban atau diunduh untuk verifikasi.
                  </p>
                  {previewDoc.pathFile && (
                    <a
                      href={previewDoc.pathFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition"
                    >
                      <ExternalLink size={14} />
                      <span>Buka Dokumen di Tab Baru</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
              <span className="text-slate-500 text-[11px] text-center sm:text-left">
                Verifikator wajib memastikan keabsahan dokumen sebelum menyetujui pengaduan.
              </span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-100 transition text-xs shrink-0"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PengaduanAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-full min-h-[500px] text-teal-700 text-xs font-semibold">
          <RefreshCw size={20} className="animate-spin mr-2" />
          <span>Memuat data pengaduan admin...</span>
        </div>
      }
    >
      <PengaduanAdminContent />
    </Suspense>
  );
}
