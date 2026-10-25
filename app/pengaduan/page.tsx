"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Building2,
  ShieldAlert,
  HeartHandshake,
  GraduationCap,
  Hammer,
  Home,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Upload,
  Copy,
  Check,
  Info,
  RefreshCw,
  PhoneCall,
  User,
  ExternalLink,
  ChevronDown,
  ArrowLeft,
  X,
  FileCheck2,
  Lock,
  PlusCircle,
} from "lucide-react";
import tapselLogo from "@/public/images/logo-tapsel.png";
import tapselBangkitLogo from "@/public/tapselbangkit.png";
import {
  containsSqlInjection,
  validateNik,
  validatePhone,
  scanFileName,
} from "@/lib/security";

interface Kecamatan {
  kd_kecamatan: string;
  nm_kecamatan: string;
}

interface Desa {
  kd_desa: string;
  nm_desa: string;
  kd_kecamatan: string;
}

interface Posyandu {
  id: string;
  nama_posyandu: string;
  alamat?: string;
  kd_desa: string;
}

interface JenisPengaduan {
  id: string;
  nama: string;
  deskripsi?: string;
}

interface Bidang {
  id: string;
  kode: string;
  nm_bidang: string;
  deskripsi?: string;
  jenis: JenisPengaduan[];
}

function PengaduanMasyarakatContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "lacak" ? "lacak" : "form";
  const initialToken = searchParams.get("token") || searchParams.get("nomor") || "";

  const [activeTab, setActiveTab] = useState<"form" | "lacak">(initialTab);

  // Data Referensi
  const [kecamatans, setKecamatans] = useState<Kecamatan[]>([]);
  const [desas, setDesas] = useState<Desa[]>([]);
  const [posyandus, setPosyandus] = useState<Posyandu[]>([]);
  const [bidangs, setBidangs] = useState<Bidang[]>([]);

  // State Form
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [noHp, setNoHp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [selectedKecamatan, setSelectedKecamatan] = useState("");
  const [selectedDesa, setSelectedDesa] = useState("");
  const [selectedPosyandu, setSelectedPosyandu] = useState("");
  const [selectedBidangId, setSelectedBidangId] = useState("");
  const [selectedJenisIds, setSelectedJenisIds] = useState<string[]>([]);
  const [deskripsi, setDeskripsi] = useState("");
  const [dokumenList, setDokumenList] = useState<
    { jenis: string; namaFile: string; pathFile: string; ukuranFile?: number }[]
  >([]);

  // State Loading & Feedback Form
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<{
    nomorPengaduan: string;
    tokenPelacakan: string;
    posyandu: string;
    bidang: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // State Pelacakan
  const [trackingQuery, setTrackingQuery] = useState(initialToken);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [trackingResult, setTrackingResult] = useState<any | null>(null);

  // Load Data Referensi
  useEffect(() => {
    fetch("/api/public/wilayah")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setKecamatans(res.data);
      })
      .catch((err) => console.error("Error load kecamatan:", err));

    fetch("/api/public/bidang")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setBidangs(res.data);
          if (res.data.length > 0) {
            setSelectedBidangId(res.data[0].id);
          }
        }
      })
      .catch((err) => console.error("Error load bidang:", err));
  }, []);

  // Cascading Desa ketika Kecamatan berubah
  useEffect(() => {
    if (!selectedKecamatan) {
      setDesas([]);
      setSelectedDesa("");
      setPosyandus([]);
      setSelectedPosyandu("");
      return;
    }

    fetch(`/api/public/wilayah?kd_kecamatan=${encodeURIComponent(selectedKecamatan)}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setDesas(res.data);
          setSelectedDesa("");
          setPosyandus([]);
          setSelectedPosyandu("");
        }
      });
  }, [selectedKecamatan]);

  // Cascading Posyandu ketika Desa berubah
  useEffect(() => {
    if (!selectedDesa) {
      setPosyandus([]);
      setSelectedPosyandu("");
      return;
    }

    fetch(`/api/public/wilayah?kd_desa=${encodeURIComponent(selectedDesa)}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setPosyandus(res.data);
          if (res.data.length > 0) {
            setSelectedPosyandu(res.data[0].id);
          } else {
            setSelectedPosyandu("");
          }
        }
      });
  }, [selectedDesa]);

  // Auto-track jika ada query parameter saat dimuat
  useEffect(() => {
    if (initialToken && activeTab === "lacak") {
      handleLacak(initialToken);
    }
  }, [initialToken]);

  // Jenis pengaduan berdasarkan bidang terpilih
  const activeBidang = bidangs.find((b) => b.id === selectedBidangId);
  const jenisList = activeBidang ? activeBidang.jenis : [];

  // Reset jenis pengaduan saat bidang berganti
  useEffect(() => {
    setSelectedJenisIds([]);
  }, [selectedBidangId]);

  const handleToggleJenis = (id: string) => {
    setSelectedJenisIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllJenis = () => {
    if (selectedJenisIds.length === jenisList.length) {
      setSelectedJenisIds([]);
    } else {
      setSelectedJenisIds(jenisList.map((j) => j.id));
    }
  };

  // Handle Upload Dokumen dengan Pemindaian Keamanan Lengkap
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, jenisDok: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);

    // 1. Pindai Nama File & Ekstensi (Cegah file .exe dan file berbahaya)
    const nameScan = scanFileName(file.name);
    if (!nameScan.isSafe) {
      setErrorMsg(`Peringatan Keamanan File: ${nameScan.reason}`);
      e.target.value = "";
      return;
    }

    // 2. Batas Ukuran File (Maksimal 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Ukuran file terlalu besar. Batas maksimal lampiran adalah 5MB.");
      e.target.value = "";
      return;
    }

    // 3. Pemindaian Biner / Magic Bytes di Browser (Deteksi file .exe dan binary berbahaya)
    try {
      const slice = file.slice(0, 16);
      const arrayBuffer = await slice.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Cek apakah file Windows Executable (.exe, .dll, .com, .scr, .sys): 0x4D 0x5A ("MZ")
      if (bytes[0] === 0x4d && bytes[1] === 0x5a) {
        setErrorMsg("PERINGATAN KEAMANAN: File terdeteksi sebagai file executable Windows (.exe/program). File ditolak demi keamanan!");
        e.target.value = "";
        return;
      }

      // Cek Linux ELF Executable: 0x7F 0x45 0x4C 0x46
      if (bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46) {
        setErrorMsg("PERINGATAN KEAMANAN: File terdeteksi sebagai Linux Executable Binary. File ditolak!");
        e.target.value = "";
        return;
      }

      // Verifikasi Magic Bytes Format Legal: JPEG, PNG, WEBP, PDF
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
      const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
      const isRiff = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;

      if (!isJpeg && !isPng && !isPdf && !isRiff) {
        setErrorMsg("Format file tidak sah: Header biner file tidak cocok dengan format gambar (JPG/PNG/WEBP) atau PDF resmi.");
        e.target.value = "";
        return;
      }
    } catch (err) {
      console.error("Gagal membaca byte file:", err);
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDokumenList((prev) => [
        ...prev.filter((d) => d.jenis !== jenisDok),
        {
          jenis: jenisDok,
          namaFile: nameScan.sanitizedName,
          pathFile: reader.result as string,
          ukuranFile: file.size,
        },
      ]);
    };
    reader.readAsDataURL(file);
  };

  // Submit Pengaduan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Pengecekan SQL Injection di Sisi Klien
    if (
      containsSqlInjection(nama) ||
      containsSqlInjection(nik || "") ||
      containsSqlInjection(noHp) ||
      containsSqlInjection(alamat) ||
      containsSqlInjection(deskripsi)
    ) {
      setErrorMsg("Karakter atau kata kunci tidak diizinkan terdeteksi (pola SQL Injection). Mohon periksa kembali formulir Anda.");
      return;
    }

    // 2. Validasi NIK jika diisi
    if (nik && nik.trim()) {
      const nikCheck = validateNik(nik);
      if (!nikCheck.isValid) {
        setErrorMsg(nikCheck.error || "NIK tidak valid.");
        return;
      }
    }

    // 3. Validasi No HP
    const phoneCheck = validatePhone(noHp);
    if (!phoneCheck.isValid) {
      setErrorMsg(phoneCheck.error || "Nomor HP tidak valid.");
      return;
    }

    if (
      !nama ||
      !noHp ||
      !alamat ||
      !selectedKecamatan ||
      !selectedDesa ||
      !selectedPosyandu ||
      !selectedBidangId ||
      selectedJenisIds.length === 0 ||
      !deskripsi
    ) {
      setErrorMsg(
        "Harap lengkapi semua isian yang wajib diisi (*), serta pilih minimal 1 Kategori Masalah SPM."
      );
      return;
    }

    if (deskripsi.trim().length < 15) {
      setErrorMsg("Deskripsi pengaduan minimal 15 karakter agar informasi lengkap.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/pengaduan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama,
          nik,
          noHp,
          alamat,
          kd_kecamatan: selectedKecamatan,
          kd_desa: selectedDesa,
          posyanduId: selectedPosyandu,
          bidangId: selectedBidangId,
          jenisPengaduanIds: selectedJenisIds,
          deskripsi,
          dokumen: dokumenList,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal mengirim pengaduan.");
      }

      setSubmitSuccess({
        nomorPengaduan: data.data.nomorPengaduan,
        tokenPelacakan: data.data.tokenPelacakan,
        posyandu: data.data.posyandu,
        bidang: data.data.bidang,
      });

      // Reset form input
      setNama("");
      setNik("");
      setNoHp("");
      setAlamat("");
      setSelectedJenisIds([]);
      setDeskripsi("");
      setDokumenList([]);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kendala saat mengirim pengaduan.");
    } finally {
      setSubmitting(false);
    }
  };

  // Buat Laporan Baru (Reset Form & Kembali Tampilkan Form)
  const handleBuatLaporanBaru = () => {
    setNama("");
    setNik("");
    setNoHp("");
    setAlamat("");
    setSelectedKecamatan("");
    setSelectedDesa("");
    setSelectedPosyandu("");
    setSelectedJenisIds([]);
    setDeskripsi("");
    setDokumenList([]);
    setErrorMsg(null);
    setSubmitSuccess(null);
  };

  // Lacak Pengaduan
  const handleLacak = async (queryInput?: string) => {
    const q = (queryInput || trackingQuery).trim();
    if (!q) {
      setTrackingError("Masukkan Nomor Pengaduan atau Token Pelacakan.");
      return;
    }

    setTrackingLoading(true);
    setTrackingError(null);
    setTrackingResult(null);

    try {
      const res = await fetch(`/api/pengaduan/lacak?query=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Data pengaduan tidak ditemukan.");
      }

      setTrackingResult(data.data);
    } catch (err: any) {
      setTrackingError(err.message || "Gagal melacak pengaduan.");
    } finally {
      setTrackingLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Pemetaan Ikon Bidang SPM
  const getBidangIcon = (kode: string) => {
    switch (kode) {
      case "KESEHATAN":
        return <HeartHandshake className="w-5 h-5 text-rose-500" />;
      case "SOSIAL":
        return <User className="w-5 h-5 text-amber-500" />;
      case "PENDIDIKAN":
        return <GraduationCap className="w-5 h-5 text-indigo-500" />;
      case "PEKERJAAN_UMUM":
        return <Hammer className="w-5 h-5 text-cyan-500" />;
      case "PERUMAHAN_RAKYAT":
        return <Home className="w-5 h-5 text-emerald-500" />;
      case "TRANTIBUM_LINMAS":
        return <ShieldCheck className="w-5 h-5 text-blue-500" />;
      default:
        return <Building2 className="w-5 h-5 text-slate-500" />;
    }
  };

  // Pemetaan Warna Status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BARU":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            Baru Terdaftar
          </span>
        );
      case "MENUNGGU_VERIFIKASI_DESA":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Verifikasi Desa
          </span>
        );
      case "MENUNGGU_VERIFIKASI_KECAMATAN":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
            Verifikasi Kecamatan
          </span>
        );
      case "MENUNGGU_VERIFIKASI_KABUPATEN":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            Verifikasi Kabupaten
          </span>
        );
      case "DITINDAKLANJUTI":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
            Sedang Ditindaklanjuti
          </span>
        );
      case "DISETUJUI":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Disetujui
          </span>
        );
      case "SELESAI":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
            Selesai
          </span>
        );
      case "PERLU_PERBAIKAN":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
            Perlu Perbaikan Berkas
          </span>
        );
      case "DITOLAK":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-900 selection:bg-blue-600 selection:text-white pb-16">
      {/* 1. NAVBAR RESPONSIF */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & Identitas Singkat */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <div className="w-8 h-10 sm:w-10 sm:h-12 relative shrink-0 transition-transform group-hover:scale-105">
                <Image
                  src={tapselLogo}
                  alt="Logo Pemkab Tapanuli Selatan"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="h-7 sm:h-9 w-24 sm:w-32 relative shrink-0 transition-transform group-hover:scale-105">
                <Image
                  src={tapselBangkitLogo}
                  alt="Logo Tapsel Bangkit"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <div className="min-w-0 hidden sm:block border-l border-slate-200 pl-2.5">
              <h1 className="text-xs sm:text-sm font-black text-slate-900 leading-tight group-hover:text-blue-700 transition-colors truncate">
                Saluran Aspirasi dan Pengaduan Aktif Posyandu
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                SAPA Posyandu Tapanuli Selatan
              </p>
            </div>
          </Link>

          {/* Navigasi Kanan Header */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Beranda</span>
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white shadow-xs transition"
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden xs:inline">Login Petugas</span>
              <span className="xs:hidden">Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO BANNER PEMERINTAHAN */}
      <section className="bg-gradient-to-br from-[#061828] via-[#092b47] to-[#1e1b4b] text-white py-8 sm:py-12 px-4 sm:px-6 relative overflow-hidden">
        {/* Multi-color ambient glows from logo */}
        <div className="absolute top-0 left-10 w-72 h-72 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-10 w-72 h-72 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] sm:text-xs font-semibold mb-3 border border-white/15 backdrop-blur-md">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <span className="text-blue-100">Kanal Resmi 6 Standar Pelayanan Minimal (SPM) Posyandu</span>
          </div>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight leading-snug">
            Sampaikan Pengaduan Pelayanan Dasar
          </h2>
          <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-200 max-w-2xl mx-auto leading-relaxed">
            Pengawalan pemenuhan hak pelayanan dasar masyarakat secara transparan dan berjenjang dari Desa, Kecamatan, hingga Dinas Terkait.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-blue-200 font-medium">
            <span className="bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">✓ Tanpa Perlu Akun</span>
            <span className="bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">✓ Verifikasi Desa & Kecamatan</span>
            <span className="bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">✓ Lacak Status Real-Time</span>
          </div>
        </div>
      </section>

      {/* 3. KONTROL TAB SEGMENTASI */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-5 relative z-20">
        <div className="p-1.5 bg-white rounded-2xl shadow-lg border border-slate-200/80 flex gap-1.5 sm:gap-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab("form");
              setSubmitSuccess(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === "form"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:text-blue-700 hover:bg-slate-100/70"
              }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Buat Pengaduan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("lacak");
              setSubmitSuccess(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === "lacak"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm"
              : "text-slate-600 hover:text-purple-700 hover:bg-slate-100/70"
              }`}
          >
            <Search className="w-4 h-4 shrink-0" />
            <span>Lacak Status</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTAINER FORM & TRACKING */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
        {/* ========================================================= */}
        {/* TAB 1: FORMULIR PENGADUAN / TAMPILAN SUKSES */}
        {/* ========================================================= */}
        {activeTab === "form" && (
          submitSuccess ? (
            /* TAMPILAN SUKSES (FORM INPUT DISEMBUNYIKAN) */
            <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              {/* Header Sukses dengan Gradient 4-Warna Brand */}
              <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-emerald-600 p-6 sm:p-10 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_60%)]" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-4 shadow-inner border border-white/30">
                    <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-white/20 text-emerald-100 text-xs font-semibold mb-2.5 border border-white/20 backdrop-blur-xs">
                    Pengaduan Berhasil Tercatat
                  </span>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
                    Pengaduan Berhasil Terkirim!
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
                    Laporan Anda telah tercatat pada sistem dan langsung diteruskan ke{" "}
                    <strong className="text-white">Kader Posyandu & Verifikator Desa</strong> setempat untuk ditindaklanjuti.
                  </p>
                </div>
              </div>

              {/* Rincian Nomor Pengaduan & Token */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>Informasi Bukti Pengaduan</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                        Nomor Pengaduan
                      </span>
                      <p className="text-base sm:text-lg font-mono font-black text-slate-900 mt-1 break-all">
                        {submitSuccess.nomorPengaduan}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/30 shadow-2xs">
                      <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide block">
                        Token Pelacakan (Privat)
                      </span>
                      <p className="text-base sm:text-lg font-mono font-black text-blue-700 mt-1 break-all">
                        {submitSuccess.tokenPelacakan}
                      </p>
                    </div>
                  </div>

                  {(submitSuccess.posyandu || submitSuccess.bidang) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 text-xs">
                      {submitSuccess.posyandu && (
                        <div>
                          <span className="text-slate-500 font-medium">Posyandu Sasaran:</span>
                          <p className="font-bold text-slate-800 mt-0.5">{submitSuccess.posyandu}</p>
                        </div>
                      )}
                      {submitSuccess.bidang && (
                        <div>
                          <span className="text-slate-500 font-medium">Bidang SPM:</span>
                          <p className="font-bold text-slate-800 mt-0.5">{submitSuccess.bidang}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Penting:</strong> Simpan atau catat <strong>Nomor Pengaduan</strong> dan <strong>Token Pelacakan</strong> Anda. Anda dapat menggunakannya di tab <strong>Lacak Status</strong> untuk melihat progres penanganan secara transparan kapan saja.
                  </p>
                </div>

                {/* Tombol Aksi: Buat Laporan Baru, Salin, & Lacak */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBuatLaporanBaru}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Buat Laporan Baru</span>
                  </button>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `Nomor Pengaduan: ${submitSuccess.nomorPengaduan}\nToken Pelacakan: ${submitSuccess.tokenPelacakan}`
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-700 hover:text-blue-700 border border-slate-300 hover:border-blue-300 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? "Tersalin ke Clipboard" : "Salin Nomor & Token"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTrackingQuery(submitSuccess.tokenPelacakan);
                        setActiveTab("lacak");
                        handleLacak(submitSuccess.tokenPelacakan);
                        setSubmitSuccess(null);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0c3b5e] hover:bg-[#082942] text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer"
                    >
                      <span>Lacak Status Sekarang</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden">
              {/* Header Form */}
              <div className="border-b border-slate-100 px-5 sm:px-8 py-4 sm:py-5 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Formulir Pengaduan Masyarakat
                  </h3>
                  <p className="text-xs text-slate-500">
                    Silakan isi data pengaduan Anda dengan informasi yang valid dan sebenarnya.
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
                  6 Bidang SPM
                </span>
              </div>

              {/* Alert Error Form */}
              {errorMsg && (
                <div className="m-4 sm:m-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs sm:text-sm flex items-start gap-2.5 font-medium">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-7 sm:space-y-8">
                {/* BAGIAN 1: IDENTITAS PELAPOR */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
                    <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm shadow-blue-500/20">
                      1
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        Identitas Pelapor
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Data digunakan untuk verifikasi dan konfirmasi tindak lanjut oleh petugas
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                        Nama Lengkap <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Siti Aisyah Daulay"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                        Nomor WhatsApp / HP Aktif <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Contoh: 08126345xxxx"
                        value={noHp}
                        onChange={(e) => setNoHp(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                      />
                      <span className="text-[10px] sm:text-[11px] text-slate-400 mt-1 block">
                        Untuk konfirmasi jadwal kunjungan kader/petugas posyandu
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                        NIK KTP <span className="text-slate-400 font-normal lowercase">(opsional)</span>
                      </label>
                      <input
                        type="text"
                        maxLength={16}
                        placeholder="16 digit NIK kepala keluarga / pelapor"
                        value={nik}
                        onChange={(e) => setNik(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                        Alamat Domisili Lengkap <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nama jalan, RT/RW, Dusun"
                        value={alamat}
                        onChange={(e) => setAlamat(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* BAGIAN 2: LOKASI & POSYANDU */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
                    <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm shadow-purple-500/20">
                      2
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        Wilayah & Posyandu Sasaran
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Pilih lokasi agar laporan langsung diteruskan ke Posyandu & Desa setempat
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                        Kecamatan <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={selectedKecamatan}
                        onChange={(e) => setSelectedKecamatan(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition bg-white font-medium"
                      >
                        <option value="">-- Pilih Kecamatan --</option>
                        {kecamatans.map((kec) => (
                          <option key={kec.kd_kecamatan} value={kec.kd_kecamatan}>
                            {kec.nm_kecamatan}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                        Desa / Kelurahan <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        disabled={!selectedKecamatan}
                        value={selectedDesa}
                        onChange={(e) => setSelectedDesa(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition bg-white disabled:bg-slate-100 disabled:text-slate-400 font-medium"
                      >
                        <option value="">
                          {selectedKecamatan ? "-- Pilih Desa --" : "Pilih Kecamatan Dahulu"}
                        </option>
                        {desas.map((d) => (
                          <option key={d.kd_desa} value={d.kd_desa}>
                            {d.nm_desa}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                        Posyandu Terdekat <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        disabled={!selectedDesa}
                        value={selectedPosyandu}
                        onChange={(e) => setSelectedPosyandu(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition bg-white disabled:bg-slate-100 disabled:text-slate-400 font-medium"
                      >
                        <option value="">
                          {selectedDesa ? "-- Pilih Posyandu --" : "Pilih Desa Dahulu"}
                        </option>
                        {posyandus.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nama_posyandu}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* BAGIAN 3: BIDANG SPM & PERMASALAHAN */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
                    <div className="w-7 h-7 rounded-xl bg-orange-500 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm shadow-orange-500/20">
                      3
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        Pilih Bidang SPM & Kategori Masalah
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Tentukan jenis layanan dasar SPM yang membutuhkan penanganan
                      </p>
                    </div>
                  </div>

                  {/* PILIHAN 6 BIDANG SPM (Grid 2 Kolom Mobile, 3 Kolom Desktop) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    {bidangs.map((b) => {
                      const isSelected = selectedBidangId === b.id;
                      return (
                        <button
                          type="button"
                          key={b.id}
                          onClick={() => setSelectedBidangId(b.id)}
                          className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${isSelected
                            ? "border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20 shadow-sm"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="p-1.5 sm:p-2 rounded-xl bg-white shadow-2xs border border-slate-100 shrink-0">
                              {getBidangIcon(b.kode)}
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
                            )}
                          </div>
                          <span className="text-[11px] sm:text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                            {b.nm_bidang}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* PILIH JENIS PENGADUAN DENGAN CHECKBOX */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Kategori Masalah SPM <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] sm:text-[11px] text-slate-500">
                          Bisa pilih lebih dari satu ({selectedJenisIds.length} dipilih)
                        </span>
                      </div>

                      {jenisList.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSelectAllJenis}
                          className="text-[11px] text-orange-700 hover:text-orange-900 font-bold transition py-1 px-2.5 rounded-lg border border-orange-200 bg-orange-50/60 hover:bg-orange-100 cursor-pointer"
                        >
                          {selectedJenisIds.length === jenisList.length
                            ? "Hapus Semua"
                            : "Pilih Semua Kategori"}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {jenisList.map((j) => {
                        const isChecked = selectedJenisIds.includes(j.id);
                        return (
                          <div
                            key={j.id}
                            onClick={() => handleToggleJenis(j.id)}
                            className={`p-3 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 select-none ${isChecked
                              ? "border-orange-500 bg-orange-50/80 ring-1 ring-orange-500/30 shadow-2xs"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => { }}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 pointer-events-none accent-orange-600 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span
                                className={`text-xs font-bold block leading-snug ${isChecked ? "text-orange-950 font-extrabold" : "text-slate-800"
                                  }`}
                              >
                                {j.nama}
                              </span>
                              {j.deskripsi && (
                                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 leading-snug">
                                  {j.deskripsi}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {selectedJenisIds.length === 0 && (
                      <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1 font-medium">
                        <span>⚠️ Harap pilih minimal satu kategori masalah di atas.</span>
                      </p>
                    )}
                  </div>

                  {/* DESKRIPSI PENGADUAN */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      Uraian Masalah / Kebutuhan Bantuan <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Jelaskan secara rinci kondisi di lapangan, nama warga/balita sasaran, alamat spesifik, dan bantuan yang mendesak dibutuhkan..."
                      value={deskripsi}
                      onChange={(e) => setDeskripsi(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition resize-y font-medium leading-relaxed"
                    />
                    <div className="flex justify-between items-center text-[10px] sm:text-[11px] text-slate-400 mt-1 font-medium">
                      <span>Minimal 15 karakter</span>
                      <span>{deskripsi.length} karakter</span>
                    </div>
                  </div>
                </div>

                {/* BAGIAN 4: DOKUMEN PENDUKUNG (OPSIONAL) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm shadow-emerald-500/20">
                      4
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        Dokumen / Foto Lapangan (Opsional)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Lampirkan bukti foto untuk mempercepat verifikasi faktual kader desa
                      </p>
                    </div>
                  </div>


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="border border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 text-center transition bg-slate-50/60">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                      <span className="text-xs font-bold text-slate-800 block">
                        Foto KTP / KK Pelapor
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-slate-400 block mb-2.5">
                        Format JPG, PNG, WEBP, PDF (Maks 5MB)
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(e) => handleFileUpload(e, "KTP")}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>

                    <div className="border border-dashed border-slate-300 hover:border-purple-500 rounded-2xl p-4 text-center transition bg-slate-50/60">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                      <span className="text-xs font-bold text-slate-800 block">
                        Foto Kondisi / Bukti Lapangan
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-slate-400 block mb-2.5">
                        Foto anak/balita, kondisi rumah, sanitasi, dll.
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(e) => handleFileUpload(e, "DOKUMEN_LAINNYA")}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                      />
                    </div>
                  </div>

                  {dokumenList.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {dokumenList.map((doc, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-medium"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[200px]">{doc.namaFile}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* TOMBOL SUBMIT RESPONSIF */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-[11px] sm:text-xs text-slate-500 text-center sm:text-left leading-relaxed">
                    Laporan akan diproses secara berjenjang oleh Posyandu, Desa, Kecamatan, dan Pemerintah Kabupaten.
                  </p>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sedang Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <span>Kirimkan Pengaduan</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )
        )}

        {/* ========================================================= */}
        {/* TAB 2: PELACAKAN STATUS PENGADUAN */}
        {/* ========================================================= */}
        {activeTab === "lacak" && (
          <div className="space-y-6">
            {/* SEARCH BOX */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-sm">
              <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">
                Lacak Status Pengaduan SPM
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Masukkan <strong>Nomor Pengaduan</strong> (contoh: <code>SPM-20261015-0001</code>) atau{" "}
                <strong>Token Pelacakan</strong> (contoh: <code>TRK-7A9B2C</code>) yang Anda peroleh saat mendaftar.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Contoh: SPM-20261015-0001 atau TRK-7A9B2C"
                    value={trackingQuery}
                    onChange={(e) => setTrackingQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLacak()}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-mono uppercase"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleLacak()}
                  disabled={trackingLoading}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 active:scale-[0.99] text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {trackingLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Lacak Pengaduan</span>
                </button>
              </div>

              {trackingError && (
                <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{trackingError}</span>
                </div>
              )}
            </div>

            {/* HASIL PELACAKAN */}
            {trackingResult && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden animate-in fade-in duration-200">
                {/* HEADER HASIL */}
                <div className="p-5 sm:p-7 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Nomor Pengaduan
                    </span>
                    <h3 className="text-lg sm:text-2xl font-black font-mono text-slate-900 mt-0.5 break-all">
                      {trackingResult.nomorPengaduan}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Didaftarkan:{" "}
                      {new Date(trackingResult.tanggalPengaduan).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      WIB
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Status Saat Ini
                    </span>
                    {getStatusBadge(trackingResult.status)}
                  </div>
                </div>

                {/* PROGRESS STEPPER BERJENJANG */}
                <div className="p-5 sm:p-7 border-b border-slate-100">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 sm:mb-4">
                    Alur Verifikasi SPM Berjenjang
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-3 rounded-2xl border border-blue-200 bg-blue-50/80 shadow-2xs">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold mx-auto flex items-center justify-center mb-1">
                        1
                      </div>
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        Pelapor
                      </span>
                      <span className="text-[10px] text-blue-700 block">Oleh Warga</span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl border ${[
                        "MENUNGGU_VERIFIKASI_DESA",
                        "MENUNGGU_VERIFIKASI_KECAMATAN",
                        "MENUNGGU_VERIFIKASI_KABUPATEN",
                        "DISETUJUI",
                        "DITINDAKLANJUTI",
                        "SELESAI",
                      ].includes(trackingResult.status)
                        ? "border-purple-200 bg-purple-50/80 shadow-2xs"
                        : "border-slate-200 bg-slate-50"
                        }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full text-xs font-bold mx-auto flex items-center justify-center mb-1 ${[
                          "MENUNGGU_VERIFIKASI_DESA",
                          "MENUNGGU_VERIFIKASI_KECAMATAN",
                          "MENUNGGU_VERIFIKASI_KABUPATEN",
                          "DISETUJUI",
                          "DITINDAKLANJUTI",
                          "SELESAI",
                        ].includes(trackingResult.status)
                          ? "bg-purple-600 text-white"
                          : "bg-slate-300 text-slate-600"
                          }`}
                      >
                        2
                      </div>
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        Verifikasi Desa
                      </span>
                      <span className="text-[10px] text-purple-700 block">Kader Posyandu</span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl border ${[
                        "MENUNGGU_VERIFIKASI_KECAMATAN",
                        "MENUNGGU_VERIFIKASI_KABUPATEN",
                        "DISETUJUI",
                        "DITINDAKLANJUTI",
                        "SELESAI",
                      ].includes(trackingResult.status)
                        ? "border-orange-200 bg-orange-50/80 shadow-2xs"
                        : "border-slate-200 bg-slate-50"
                        }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full text-xs font-bold mx-auto flex items-center justify-center mb-1 ${[
                          "MENUNGGU_VERIFIKASI_KECAMATAN",
                          "MENUNGGU_VERIFIKASI_KABUPATEN",
                          "DISETUJUI",
                          "DITINDAKLANJUTI",
                          "SELESAI",
                        ].includes(trackingResult.status)
                          ? "bg-orange-500 text-white"
                          : "bg-slate-300 text-slate-600"
                          }`}
                      >
                        3
                      </div>
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        Verifikasi Kecamatan
                      </span>
                      <span className="text-[10px] text-orange-700 block">Admin Kecamatan</span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl border ${["DITINDAKLANJUTI", "SELESAI"].includes(trackingResult.status)
                        ? "border-emerald-200 bg-emerald-50/80 shadow-2xs"
                        : "border-slate-200 bg-slate-50"
                        }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full text-xs font-bold mx-auto flex items-center justify-center mb-1 ${["DITINDAKLANJUTI", "SELESAI"].includes(trackingResult.status)
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-300 text-slate-600"
                          }`}
                      >
                        4
                      </div>
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        Tindak Lanjut
                      </span>
                      <span className="text-[10px] text-emerald-700 block">OPD Pengampu SPM</span>
                    </div>
                  </div>
                </div>

                {/* DETAIL DATA LAPORAN */}
                <div className="p-5 sm:p-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Kolom Kiri: Detail Laporan */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Ringkasan Pengaduan
                    </h4>

                    <div className="bg-slate-50 p-4 rounded-2xl space-y-3 text-xs border border-slate-100">
                      <div>
                        <span className="text-slate-500 block font-normal">Bidang SPM:</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {trackingResult.bidang?.nama}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1 font-normal">
                          Kategori Masalah SPM:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.isArray(trackingResult.jenisPengaduan) ? (
                            trackingResult.jenisPengaduan.map((j: string, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200"
                              >
                                {j}
                              </span>
                            ))
                          ) : (
                            <span className="font-bold text-slate-900 text-sm">
                              {trackingResult.jenisPengaduan}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-normal">Lokasi & Posyandu:</span>
                        <span className="font-bold text-slate-900">
                          {trackingResult.lokasi?.posyandu} (Desa {trackingResult.lokasi?.desa}, Kec.{" "}
                          {trackingResult.lokasi?.kecamatan})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-normal">Pelapor:</span>
                        <span className="font-bold text-slate-900">
                          {trackingResult.pelapor?.nama} ({trackingResult.pelapor?.noHpMasked})
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5">
                        Uraian Masalah Lapangan
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                        {trackingResult.deskripsi}
                      </p>
                    </div>

                    {trackingResult.catatan && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
                        <span className="font-bold block mb-1">Catatan Verifikator:</span>
                        <span className="leading-relaxed">{trackingResult.catatan}</span>
                      </div>
                    )}
                  </div>

                  {/* Kolom Kanan: Riwayat Timeline */}
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-4">
                      Riwayat Tindak Lanjut Berkas
                    </h4>

                    <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {trackingResult.riwayat && trackingResult.riwayat.length > 0 ? (
                        trackingResult.riwayat.map((rw: any, idx: number) => (
                          <div key={rw.id || idx} className="relative flex items-start gap-3 text-xs">
                            <div className="w-7 h-7 rounded-full bg-blue-100 border-2 border-blue-600 flex items-center justify-center text-blue-800 shrink-0 z-10 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                                <span className="font-bold text-slate-900 uppercase text-[11px]">
                                  {rw.peristiwa.replace(/_/g, " ")}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(rw.tanggal).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-slate-600 text-xs leading-relaxed">
                                {rw.keterangan || "Status pengaduan diperbarui oleh petugas."}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          Belum ada catatan riwayat tambahan.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 5. FOOTER */}
      <footer className="mt-14 sm:mt-16 text-center text-xs text-slate-500 border-t border-slate-200 pt-8 max-w-4xl mx-auto px-4">
        <p className="font-bold text-slate-700">
          Sistem Informasi Pengaduan Pelayanan Dasar SPM Berbasis Posyandu
        </p>
        <p className="mt-1 text-slate-400 text-[11px]">
          Pemerintah Kabupaten Tapanuli Selatan • Terhubung langsung dengan Kader Desa, Kecamatan, dan Dinas Pengampu SPM
        </p>
      </footer>
    </div>
  );
}

export default function PengaduanMasyarakatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="flex items-center space-x-3 text-blue-700">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold">Memuat Layanan Pengaduan SPM...</span>
          </div>
        </div>
      }
    >
      <PengaduanMasyarakatContent />
    </Suspense>
  );
}
