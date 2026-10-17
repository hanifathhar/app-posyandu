"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Building2,
  MapPin,
  HeartHandshake,
  ExternalLink,
  Calendar,
  Sparkles,
  ChevronRight,
  UserCheck,
  CheckSquare,
  Activity,
  Layers,
  Filter,
  PieChart as PieChartIcon,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const SPM_COLORS: Record<string, string> = {
  KESEHATAN: "#f43f5e", // Rose
  SOSIAL: "#f59e0b", // Amber
  PENDIDIKAN: "#6366f1", // Indigo
  PEKERJAAN_UMUM: "#06b6d4", // Cyan
  PERUMAHAN_RAKYAT: "#10b981", // Emerald
  TRANTIBUM_LINMAS: "#3b82f6", // Blue
};

const KECAMATAN_PALETTE = [
  "#2563eb", // Biru (Logo)
  "#9333ea", // Ungu (Logo)
  "#16a34a", // Hijau (Logo)
  "#f97316", // Orange (Logo)
  "#0284c7", // Sky Blue
  "#7c3aed", // Violet
  "#059669", // Emerald
  "#ea580c", // Dark Orange
  "#3b82f6", // Royal Blue
  "#a855f7", // Light Purple
  "#10b981", // Light Emerald
  "#f59e0b", // Amber
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#ec4899", // Pink
];

interface UserLevel {
  role: string;
  nama: string;
  kecamatanId?: string | null;
  kecamatanNama?: string | null;
  desaId?: string | null;
  desaNama?: string | null;
}

interface DashboardKPI {
  total: number;
  menungguDesa: number;
  menungguKecamatan: number;
  menungguKabupaten: number;
  ditindaklanjuti: number;
  selesai: number;
  perluPerbaikan: number;
  ditolak: number;
  totalMenungguVerifikasi: number;
  totalSelesaiDanDitindak: number;
  resolutionRate: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [periode, setPeriode] = useState<string>("semua"); // "semua" | "tahun-ini" | "bulan-ini"
  const [wilayahChartMode, setWilayahChartMode] = useState<"pie" | "bar">("pie");

  // Fetch Dashboard Data
  const fetchDashboard = async (selectedPeriode = periode, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/admin/dashboard?periode=${selectedPeriode}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Gagal memuat analitik dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard(periode, false);
  }, [periode]);

  // Greeting berdasarkan jam lokal
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 11) return "Selamat Pagi";
    if (hours < 15) return "Selamat Siang";
    if (hours < 18) return "Selamat Sore";
    return "Selamat Malam";
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "MENUNGGU_VERIFIKASI_DESA":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
            Verifikasi Desa
          </span>
        );
      case "MENUNGGU_VERIFIKASI_KECAMATAN":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-orange-50 text-orange-800 border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5 animate-pulse"></span>
            Verifikasi Camat
          </span>
        );
      case "MENUNGGU_VERIFIKASI_KABUPATEN":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5 animate-pulse"></span>
            Verifikasi Dinas
          </span>
        );
      case "DITINDAKLANJUTI":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
            <Activity size={12} className="mr-1 text-cyan-600" />
            Ditindaklanjuti
          </span>
        );
      case "SELESAI":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} className="mr-1 text-emerald-600" />
            Selesai
          </span>
        );
      case "PERLU_PERBAIKAN":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-yellow-50 text-yellow-800 border border-yellow-200">
            <AlertCircle size={12} className="mr-1 text-yellow-600" />
            Perlu Perbaikan
          </span>
        );
      case "DITOLAK":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
            Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[550px] text-blue-700">
        <Loader2 className="w-10 h-10 animate-spin mb-3 text-blue-600" />
        <span className="text-sm font-bold text-slate-700">Menyiapkan Dashboard Eksekutif SPM...</span>
        <span className="text-xs text-slate-400 mt-1">Menghitung analitik berjenjang berdasarkan wilayah penugasan</span>
      </div>
    );
  }

  const kpi: DashboardKPI = data?.kpi || {
    total: 0,
    menungguDesa: 0,
    menungguKecamatan: 0,
    menungguKabupaten: 0,
    ditindaklanjuti: 0,
    selesai: 0,
    perluPerbaikan: 0,
    ditolak: 0,
    totalMenungguVerifikasi: 0,
    totalSelesaiDanDitindak: 0,
    resolutionRate: 0,
  };

  const userLevel: UserLevel = data?.userLevel || {
    role: "GUEST",
    nama: "Petugas",
  };

  const isDesa = userLevel.role === "ADMIN_DESA";
  const isKecamatan = userLevel.role === "ADMIN_KECAMATAN";
  const isKabupaten = ["ADMIN_KABUPATEN", "SUPERADMIN"].includes(userLevel.role);

  // Label Tingkat Kewenangan & Wilayah
  let roleTitle = "Pemerintah Kabupaten Tapanuli Selatan";
  let roleBadge = "Administrator Kabupaten";
  let urgentActionCount = 0;
  let urgentActionLabel = "";
  let urgentActionLink = "/pengaduan-admin";

  if (isDesa) {
    roleTitle = `Desa ${userLevel.desaNama || ""}, Kec. ${userLevel.kecamatanNama || ""}`;
    roleBadge = "Petugas Verifikasi Desa";
    urgentActionCount = kpi.menungguDesa;
    urgentActionLabel = "Menunggu Verifikasi Tahap Desa";
    urgentActionLink = "/pengaduan-admin?status=MENUNGGU_VERIFIKASI_DESA";
  } else if (isKecamatan) {
    roleTitle = `Kecamatan ${userLevel.kecamatanNama || ""}`;
    roleBadge = "Petugas Verifikasi Kecamatan";
    urgentActionCount = kpi.menungguKecamatan;
    urgentActionLabel = "Menunggu Verifikasi Tingkat Camat";
    urgentActionLink = "/pengaduan-admin?status=MENUNGGU_VERIFIKASI_KECAMATAN";
  } else {
    roleTitle = "Kabupaten Tapanuli Selatan";
    roleBadge = userLevel.role === "SUPERADMIN" ? "Super Administrator" : "Administrator Kabupaten / OPD";
    urgentActionCount = kpi.menungguKabupaten;
    urgentActionLabel = "Menunggu Verifikasi Dinas / Kabupaten";
    urgentActionLink = "/pengaduan-admin?status=MENUNGGU_VERIFIKASI_KABUPATEN";
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      {/* 1. HERO HEADER WITH EXECUTIVE GREETING */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 shadow-xl shadow-blue-950/20 border border-blue-800/40">
        {/* Subtle ambient glows of the 4 logo colors: Biru, Ungu, Orange, Hijau */}
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-blue-500/15 blur-3xl pointer-events-none"></div>
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-purple-500/15 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 left-1/3 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-blue-200 text-xs font-semibold">
              <Building2 size={13} className="text-amber-300" />
              <span>{roleBadge}</span>
              <span className="text-white/40">•</span>
              <span className="text-white font-medium">{roleTitle}</span>
              <span className="text-white/40">•</span>
              {/* 4 dots from application logo */}
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-400" title="Biru (Pelayanan Dasar)" />
                <span className="w-2 h-2 rounded-full bg-purple-400" title="Ungu (Integrasi Posyandu)" />
                <span className="w-2 h-2 rounded-full bg-orange-400" title="Orange (Respon Cepat)" />
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Hijau (Kesehatan Masyarakat)" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {greeting}, {userLevel.nama}
            </h1>

            <p className="text-blue-100/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {isDesa
                ? `Pusat monitoring dan verifikasi pengaduan 6 Bidang SPM Posyandu untuk wilayah Desa ${userLevel.desaNama || ""}. Pastikan seluruh aduan warga tertangani tepat waktu.`
                : isKecamatan
                ? `Pusat kendali dan supervisi pengaduan SPM terintegrasi untuk seluruh desa di wilayah Kecamatan ${userLevel.kecamatanNama || ""}.`
                : "Pusat Kendali Eksekutif Standar Pelayanan Minimal (SPM) Kabupaten Tapanuli Selatan. Memonitor koordinasi lintas 15 kecamatan dan 6 bidang pelayanan dasar."}
            </p>
          </div>

          {/* Quick Action & Periode Filter */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Periode Pill Filter */}
            <div className="bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/15 flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setPeriode("semua")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  periode === "semua"
                    ? "bg-white text-blue-950 shadow-sm"
                    : "text-blue-200 hover:text-white hover:bg-white/10"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setPeriode("tahun-ini")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  periode === "tahun-ini"
                    ? "bg-white text-blue-950 shadow-sm"
                    : "text-blue-200 hover:text-white hover:bg-white/10"
                }`}
              >
                Tahun Ini
              </button>
              <button
                type="button"
                onClick={() => setPeriode("bulan-ini")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  periode === "bulan-ini"
                    ? "bg-white text-blue-950 shadow-sm"
                    : "text-blue-200 hover:text-white hover:bg-white/10"
                }`}
              >
                Bulan Ini
              </button>
            </div>

            <button
              onClick={() => fetchDashboard(periode, true)}
              disabled={refreshing}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition disabled:opacity-50 shadow-xs"
              title="Perbarui Data"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. URGENT ACTION BANNER (ORANGE ACCENT DARI LOGO) */}
      {urgentActionCount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl border-2 border-orange-300 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-2xl bg-orange-500 text-white shadow-md shadow-orange-500/20 shrink-0 mt-0.5">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md bg-orange-200 text-orange-900 font-extrabold text-[10px] uppercase tracking-wider">
                  Perhatian Tindakan
                </span>
                <span className="text-xs font-bold text-orange-950">
                  {urgentActionCount} Berkas Membutuhkan Persetujuan Anda
                </span>
              </div>
              <p className="text-xs text-orange-800/90 mt-1 leading-relaxed">
                Terdapat pengaduan warga berstatus <strong>{urgentActionLabel}</strong> yang memerlukan pemeriksaan berkas atau keputusan verifikasi berjenjang.
              </p>
            </div>
          </div>

          <Link
            href={urgentActionLink}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20 transition shrink-0"
          >
            <CheckSquare size={15} />
            <span>Proses Verifikasi Sekarang</span>
          </Link>
        </div>
      )}

      {/* 3. DYNAMIC KPI METRICS CARDS: SELARAS 4 WARNA LOGO (BIRU, ORANGE, UNGU, HIJAU) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: BIRU (Blue) - Total Pengaduan Wilayah */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-gradient-to-br from-white to-blue-50/20 shadow-xs hover:border-blue-400 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 group-hover:text-blue-800 transition">
              {isDesa ? "Pengaduan Desa" : isKecamatan ? "Pengaduan Kecamatan" : "Total Kabupaten"}
            </span>
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
              <FileText size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{kpi.total || 0}</span>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
              {periode === "bulan-ini" ? "Bulan Ini" : periode === "tahun-ini" ? "Tahun Ini" : "Semua Waktu"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {isDesa
              ? "Seluruh aduan masuk di wilayah Desa Anda"
              : isKecamatan
              ? "Total aduan terdaftar di wilayah Kecamatan Anda"
              : "Seluruh aduan masuk se-Kabupaten Tapsel"}
          </p>
        </div>

        {/* Card 2: ORANGE (Orange) - Fokus Verifikasi Pending Sesuai Level */}
        <div className="bg-white p-5 rounded-2xl border border-orange-200 bg-gradient-to-br from-white to-orange-50/20 shadow-xs hover:border-orange-400 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 group-hover:text-orange-700">
              {isDesa
                ? "Verifikasi Desa (Tugas Anda)"
                : isKecamatan
                ? "Verifikasi Camat (Tugas Anda)"
                : "Verifikasi Dinas / Kab."}
            </span>
            <div className="p-2.5 rounded-xl bg-orange-100 text-orange-700 group-hover:bg-orange-600 group-hover:text-white transition">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-orange-950">
              {isDesa ? kpi.menungguDesa : isKecamatan ? kpi.menungguKecamatan : kpi.menungguKabupaten}
            </span>
            <span className="text-[11px] font-bold text-orange-800 bg-orange-100 px-2.5 py-0.5 rounded-lg border border-orange-200">
              Perlu Disetujui
            </span>
          </div>
          <p className="text-[11px] text-orange-800/80 mt-2">
            {isDesa
              ? `Tingkat lanjutan: Kec (${kpi.menungguKecamatan}) • Kab (${kpi.menungguKabupaten})`
              : isKecamatan
              ? `Monitoring Desa: ${kpi.menungguDesa} pending di Desa`
              : `Total antrean verifikasi berjenjang: ${kpi.totalMenungguVerifikasi}`}
          </p>
        </div>

        {/* Card 3: UNGU (Purple) - Intervensi & Tindak Lanjut Lapangan */}
        <div className="bg-white p-5 rounded-2xl border border-purple-200 bg-gradient-to-br from-white to-purple-50/20 shadow-xs hover:border-purple-400 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 group-hover:text-purple-800 transition">
              Ditindaklanjuti
            </span>
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition">
              <HeartHandshake size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{kpi.ditindaklanjuti || 0}</span>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
              Proses Intervensi
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Sedang ditangani oleh Nakes Posyandu / Kader / Dinas Pengampu
          </p>
        </div>

        {/* Card 4: HIJAU (Green) - Selesai Tuntas & Rasio Penyelesaian */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/20 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 group-hover:text-emerald-800 transition">
              Selesai Tuntas
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{kpi.selesai || 0}</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              {kpi.resolutionRate}% Rasio Tuntas
            </span>
          </div>
          <div className="mt-2.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, kpi.resolutionRate || 0)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 4. VISUALISASI GRAFIK DINAMIS SESUAI TINGKAT WILAYAH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Sebaran Wilayah Khusus Level User (PieChart untuk Kecamatan se-Kabupaten) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">
                {data?.sebaranWilayah?.title || "Sebaran Kasus per Kecamatan se-Kabupaten"}
              </h3>
              <div className="flex items-center space-x-1.5">
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-800 text-[10px] font-extrabold uppercase">
                  {data?.sebaranWilayah?.type || "KECAMATAN"}
                </span>

                {/* Toggle Pie / Bar Chart */}
                <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setWilayahChartMode("pie")}
                    className={`p-1 rounded-md transition ${
                      wilayahChartMode === "pie"
                        ? "bg-white text-blue-700 shadow-2xs font-bold"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                    title="Tampilan Diagram Lingkaran (Pie Chart)"
                  >
                    <PieChartIcon size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setWilayahChartMode("bar")}
                    className={`p-1 rounded-md transition ${
                      wilayahChartMode === "bar"
                        ? "bg-white text-blue-700 shadow-2xs font-bold"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                    title="Tampilan Diagram Batang (Bar Chart)"
                  >
                    <BarChart3 size={14} />
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {isDesa
                ? "Sebaran konsentrasi pengaduan masyarakat menurut Posyandu di desa ini"
                : isKecamatan
                ? "Sebaran jumlah pengaduan per Desa di wilayah Kecamatan ini"
                : "Proporsi sebaran kasus SPM di 15 Kecamatan se-Kabupaten Tapanuli Selatan"}
            </p>
          </div>

          <div className="h-72 w-full pt-1">
            {data?.sebaranWilayah?.data && data.sebaranWilayah.data.length > 0 ? (
              wilayahChartMode === "pie" ? (
                // TAMPILAN PIECHART (DONUT CHART) SESUAI REQUEST USER
                (() => {
                  const rawData = data.sebaranWilayah.data;
                  const activeData = rawData.filter((d: any) => d.total > 0);
                  const totalKasus = rawData.reduce((acc: number, cur: any) => acc + cur.total, 0);

                  return (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 h-full">
                      {/* Donut Chart Canvas */}
                      <div className="w-full sm:w-1/2 h-48 sm:h-full relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip
                              formatter={(value: any, name: any) => {
                                const pct = totalKasus > 0 ? ((Number(value) / totalKasus) * 100).toFixed(1) : "0";
                                return [`${value} Kasus (${pct}%)`, name];
                              }}
                              contentStyle={{
                                borderRadius: "14px",
                                border: "1px solid #e2e8f0",
                                fontSize: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                              }}
                            />
                            <Pie
                              data={activeData.length > 0 ? activeData : [{ nama: "Belum Ada Kasus", total: 1 }]}
                              dataKey="total"
                              nameKey="nama"
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={activeData.length > 1 ? 2 : 0}
                            >
                              {activeData.length > 0 ? (
                                activeData.map((entry: any, index: number) => (
                                  <Cell
                                    key={`cell-pie-${index}`}
                                    fill={KECAMATAN_PALETTE[index % KECAMATAN_PALETTE.length]}
                                  />
                                ))
                              ) : (
                                <Cell fill="#e2e8f0" />
                              )}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>

                        {/* Center Ring Label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                          <span className="text-xl font-black text-slate-900 leading-tight">
                            {totalKasus}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                            Total Kasus
                          </span>
                        </div>
                      </div>

                      {/* Legend List Wilayah */}
                      <div className="w-full sm:w-1/2 h-24 sm:h-full overflow-y-auto pr-1 space-y-1 text-xs">
                        {rawData.map((wilayah: any, idx: number) => {
                          const activeIndex = activeData.findIndex((d: any) => d.nama === wilayah.nama);
                          const color = activeIndex !== -1
                            ? KECAMATAN_PALETTE[activeIndex % KECAMATAN_PALETTE.length]
                            : "#cbd5e1";
                          const pct = totalKasus > 0 ? Math.round((wilayah.total / totalKasus) * 100) : 0;

                          return (
                            <div
                              key={wilayah.id || idx}
                              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: color }}
                                ></span>
                                <span className="truncate font-medium text-slate-700 text-[11px]">
                                  {wilayah.nama}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1.5 shrink-0">
                                {wilayah.total > 0 && (
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {pct}%
                                  </span>
                                )}
                                <span
                                  className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                    wilayah.total > 0
                                      ? "bg-blue-50 text-blue-800 border border-blue-100"
                                      : "text-slate-400 bg-slate-50"
                                  }`}
                                >
                                  {wilayah.total}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              ) : (
                // TAMPILAN BARCHART
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.sebaranWilayah.data}
                    margin={{ top: 10, right: 10, left: -20, bottom: 35 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="nama"
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                    <Tooltip
                      formatter={(value: any) => [`${value} Kasus`, "Jumlah Pengaduan"]}
                      contentStyle={{
                        borderRadius: "14px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                    />
                    <Bar
                      dataKey="total"
                      fill={isDesa ? "#059669" : isKecamatan ? "#0d9488" : "#0f766e"}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                Belum ada data sebaran wilayah pada periode ini.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Distribusi 6 Bidang SPM */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">Distribusi 6 Rumpun SPM</h3>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-extrabold uppercase">
                PELAYANAN DASAR
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Komposisi masalah warga berdasarkan klaster SPM Permendagri No. 59/2021
            </p>
          </div>

          <div className="h-72 w-full pt-2">
            {data?.distribusiBidang && data.distribusiBidang.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.distribusiBidang}
                  margin={{ top: 10, right: 10, left: -20, bottom: 35 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="nama"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: any, name: any, props: any) => [
                      `${value} Kasus`,
                      props.payload.namaLengkap,
                    ]}
                    contentStyle={{
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {(data.distribusiBidang || []).map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SPM_COLORS[entry.kode] || "#0d9488"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                Belum ada data distribusi bidang pada periode ini.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. QUICK ACTIONS BAR (PINTASAN CEPAT SESUAI TINGKAT AKUN) */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <Sparkles size={18} className="text-blue-600" />
            <h4 className="font-bold text-xs sm:text-sm text-slate-800">
              Pintasan Cepat Lembar Kerja ({roleBadge}):
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isDesa && (
              <Link
                href="/pengaduan-admin?status=MENUNGGU_VERIFIKASI_DESA"
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold transition shadow-2xs flex items-center space-x-1.5"
              >
                <CheckSquare size={13} className="text-amber-600" />
                <span>Verifikasi Desa ({kpi.menungguDesa})</span>
              </Link>
            )}

            {isKecamatan && (
              <Link
                href="/pengaduan-admin?status=MENUNGGU_VERIFIKASI_KECAMATAN"
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-orange-50 text-orange-800 border border-orange-200 text-xs font-bold transition shadow-2xs flex items-center space-x-1.5"
              >
                <CheckSquare size={13} className="text-orange-600" />
                <span>Verifikasi Camat ({kpi.menungguKecamatan})</span>
              </Link>
            )}

            {isKabupaten && (
              <Link
                href="/pengaduan-admin?status=MENUNGGU_VERIFIKASI_KABUPATEN"
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold transition shadow-2xs flex items-center space-x-1.5"
              >
                <CheckSquare size={13} className="text-purple-600" />
                <span>Verifikasi Dinas ({kpi.menungguKabupaten})</span>
              </Link>
            )}

            <Link
              href="/pengaduan-admin?status=DITINDAKLANJUTI"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold transition shadow-2xs flex items-center space-x-1.5"
            >
              <HeartHandshake size={13} className="text-blue-600" />
              <span>Intervensi Lapangan ({kpi.ditindaklanjuti})</span>
            </Link>

            <Link
              href="/laporan"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition shadow-2xs flex items-center space-x-1.5"
            >
              <TrendingUp size={13} className="text-slate-600" />
              <span>Cetak Laporan SPM</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 6. TABLE: PENGADUAN TERKINI (DIFILTER OTOMATIS SESUAI WILAYAH USER) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900">Pengaduan SPM Terkini</h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                {isDesa ? `Wilayah Desa ${userLevel.desaNama || ""}` : isKecamatan ? `Kecamatan ${userLevel.kecamatanNama || ""}` : "Seluruh Wilayah"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Daftar pengaduan terbaru yang masuk dan tercatat di lembar kerja Anda
            </p>
          </div>

          <Link
            href="/pengaduan-admin"
            className="inline-flex items-center space-x-1 text-xs font-bold text-blue-700 hover:text-blue-800 transition"
          >
            <span>Buka Seluruh Pengaduan</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Nomor / Tanggal</th>
                <th className="px-5 py-3.5">Pelapor</th>
                <th className="px-5 py-3.5">Lokasi Posyandu / Wilayah</th>
                <th className="px-5 py-3.5">Rumpun SPM</th>
                <th className="px-5 py-3.5">Status Pengaduan</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.pengaduanTerbaru && data.pengaduanTerbaru.length > 0 ? (
                data.pengaduanTerbaru.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 block text-xs">
                        {p.nomorPengaduan}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <Calendar size={11} />
                        <span>
                          {new Date(p.tanggalPengaduan).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-extrabold text-[11px] shrink-0">
                          {p.pelapor ? p.pelapor.charAt(0).toUpperCase() : "W"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block text-xs">
                            {p.pelapor}
                          </span>
                          <span className="text-[11px] text-slate-400">{p.noHp || "-"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-800 block text-xs">
                        {p.posyandu}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Desa {p.desa}, Kec. {p.kecamatan}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <span className="font-bold text-blue-800 block text-[11px]">
                        {p.bidang}
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.jenisPengaduan.map((j: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium truncate max-w-[150px]"
                          >
                            {j}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <Link
                        href={`/pengaduan-admin?search=${p.nomorPengaduan}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition border border-blue-200/80 shadow-2xs"
                      >
                        <span>Periksa</span>
                        <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 italic">
                    Belum ada pengaduan tercatat pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
