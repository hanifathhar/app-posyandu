"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  User,
  Users,
  GraduationCap,
  HeartPulse,
  Building2,
  Home,
  Shield,
  LogIn,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  HelpCircle,
  Phone,
  Mail,
  X,
  FileCheck2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import logoPic from "@/public/logo1.png";
import tapselLogo from "@/public/images/logo-tapsel.png";
import bgBack from "@/public/images/bg_log.png";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const [notif, setNotif] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif(null);

    if (!username.trim() || !password) {
      setNotif({
        type: "error",
        message: "Username dan password wajib diisi.",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "programming-123",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setNotif({
          type: "error",
          message:
            data.error ||
            "Kredensial tidak valid. Silakan periksa kembali username dan kata sandi Anda.",
        });
      } else {
        if (data.token) {
          try {
            localStorage.setItem("token", data.token);
          } catch { }
        }

        setNotif({
          type: "success",
          message: "Autentikasi berhasil! Mengalihkan ke dashboard...",
        });

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 500);
      }
    } catch {
      setNotif({
        type: "error",
        message: "Gagal terhubung ke server jaringan. Silakan coba kembali.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userVal: string, passVal: string) => {
    setUsername(userVal);
    setPassword(passVal);
    setNotif(null);
    setShowDemoModal(false);
  };

  const spmCategories = [
    { name: "Kesehatan", icon: HeartPulse, desc: "Posyandu, KIA & Gizi" },
    { name: "Pendidikan", icon: GraduationCap, desc: "PAUD & Akses Belajar" },
    { name: "Sosial", icon: Users, desc: "Bansos & Kesejahteraan" },
    { name: "Pekerjaan Umum", icon: Building2, desc: "Air Bersih & Sanitasi" },
    { name: "Perumahan", icon: Home, desc: "RTLH & Hunian Layak" },
    { name: "Trantibum", icon: Shield, desc: "Linmas & Ketenteraman" },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-900 font-sans selection:bg-[#0c3b5e] selection:text-white flex flex-col lg:grid lg:grid-cols-12 overflow-x-hidden">
      {/* ========================================================= */}
      {/* PANEL KIRI: IDENTITAS PEMKAB & SHOWCASE SPM (DESKTOP/TABLET) */}
      {/* ========================================================= */}
      <div className="relative hidden lg:flex lg:col-span-7 xl:col-span-7 flex-col justify-between p-8 xl:p-12 2xl:p-16 overflow-hidden bg-gradient-to-br from-[#061828] via-[#0c2f4d] to-[#1e1b4b]">
        {/* Latar Belakang Citra Resmi dengan Fit Sesuai Frame & Overlay Transparan */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <Image
            src={bgBack}
            alt="Background"
            fill
            priority
            className="object-cover object-center"
          />
          {/* Multi-layered government gradient: Deep navy + emerald subtle tone (transparan seperti tampilan awal) */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#061828]/85 via-[#0c2f4d]/80 to-[#0a375e]/85 backdrop-blur-[0.5px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.15),transparent_50%)]" />
        </div>

        {/* 1. Header Kiri Atas: Lambang Daerah Pemkab Tapanuli Selatan */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-4 transition-transform hover:scale-[1.01]"
          >
            <div className="relative w-16 h-20 xl:w-20 xl:h-24 shrink-0 drop-shadow-xl transition-transform group-hover:scale-105">
              <Image
                src={tapselLogo}
                alt="Logo Pemerintah Kabupaten Tapanuli Selatan"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="inline-block text-[11px] font-black uppercase tracking-wider text-amber-300 mb-0.5">
                Portal Pelayanan Publik
              </span>
              <h1 className="text-sm xl:text-base font-extrabold tracking-wide uppercase text-white drop-shadow-sm">
                Pemerintah Kabupaten Tapanuli Selatan
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                Saluran Aspirasi dan Pengaduan Aktif Posyandu Tapanuli Selatan
              </p>
            </div>
          </Link>
        </div>

        {/* 2. Bagian Konten Tengah: Pesan Utama & 6 Bidang SPM */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 text-xs font-semibold backdrop-blur-md mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Integrasi Layanan Posyandu 6 Bidang SPM
          </div>

          <h2 className="text-2xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md">
            Akselerasi Pelayanan Dasar Masyarakat Tapanuli Selatan
          </h2>
          <p className="mt-3 text-sm xl:text-base text-slate-200/90 leading-relaxed max-w-xl font-normal">
            Platform digital terintegrasi untuk pencatatan indikator, verifikasi berjenjang dari tingkat desa hingga kabupaten, serta penanganan respon cepat pengaduan warga.
          </p>

          {/* Grid 6 Bidang SPM dengan kartu transparan / glassmorphism */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl">
            {spmCategories.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  className="group relative p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md transition-all duration-300 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-105 group-hover:bg-amber-400/30 transition-all">
                    <IconComp size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-white truncate">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-slate-300 truncate">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Indikator Kepatuhan & Keamanan */}
          <div className="mt-8 pt-6 border-t border-white/15 flex flex-wrap items-center gap-6 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Verifikasi Berjenjang Desa s.d. Kabupaten</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck2 size={16} className="text-amber-300" />
              <span>Sesuai Permendagri Standar Pelayanan Minimal</span>
            </div>
          </div>
        </div>

        {/* 3. Footer Bawah Kiri: Navigasi Publik & Bantuan */}
        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10 text-xs text-slate-300">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-200 hover:text-white transition group font-medium"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Beranda / Portal Informasi Publik</span>
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PANEL KANAN: FORMULIR AUTENTIKASI PETUGAS */}
      {/* ========================================================= */}
      <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between min-h-screen bg-slate-50 relative p-4 sm:p-8 lg:p-10 xl:p-12 overflow-y-auto">
        {/* Top Header Mobile / Navigasi Cepat */}
        <div className="flex items-center justify-between w-full mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition font-medium py-1 px-2.5 rounded-lg hover:bg-slate-200/60"
          >
            <ArrowLeft size={14} />
            <span>Beranda</span>
          </Link>
        </div>

        {/* Header Identitas Pemkab khusus tampilan Mobile */}
        <div className="lg:hidden flex items-center gap-3.5 p-4 mb-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-950 text-white shadow-md">
          <div className="relative w-14 h-16 shrink-0 drop-shadow-md">
            <Image
              src={tapselLogo}
              alt="Logo Tapsel"
              fill
              className="object-contain"
            />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-black uppercase tracking-wider text-amber-300">
              Pemerintah Kabupaten Tapanuli Selatan
            </span>
            <span className="block text-xs sm:text-sm font-bold truncate">
              Saluran Aspirasi dan Pengaduan Atif Posyandu Tapanuli Selatan
            </span>
          </div>
        </div>

        {/* Kartu Autentikasi Tengah */}
        <div className="my-auto w-full max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/90 p-6 sm:p-9 transition-all">
            {/* Header Kartu Login */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-sm mb-4 transition-transform hover:scale-105 duration-200">
                <div className="relative w-36 h-36 sm:w-44 sm:h-44">
                  <Image
                    src={logoPic}
                    alt="Logo SAPA Posyandu Tapanuli Selatan"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Masuk ke Akun Petugas
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-snug">
                Silakan masukkan kredensial akun Anda untuk mengakses sistem SAPA Posyandu.
              </p>
            </div>

            {/* Alert Notifikasi */}
            <AnimatePresence mode="wait">
              {notif && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={`mb-5 p-3.5 rounded-2xl text-xs sm:text-sm flex items-start gap-2.5 border font-medium ${notif.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}
                >
                  {notif.type === "success" ? (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-snug">{notif.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Input */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Username / NIP / ID Kedinasan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="Masukkan username atau ID akun"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition bg-white font-medium"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Kata Sandi (Password) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi akun"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition bg-white font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Opsi Ingat Saya & Lupa Kata Sandi */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 accent-blue-600"
                  />
                  <span className="text-xs text-slate-600 font-medium">Ingat sesi saya</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-blue-700 hover:text-blue-900 font-semibold hover:underline transition"
                >
                  Lupa kata sandi?
                </button>
              </div>

              {/* Tombol Masuk */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-md shadow-blue-900/25 transition-all flex items-center justify-center space-x-2.5 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Memverifikasi Akun...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      <span>Masuk ke Sistem</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* Footer Panel Kanan */}
        <div className="mt-6 text-center text-xs text-slate-500 space-y-1.5">
          <p className="flex items-center justify-center gap-1.5 text-slate-500 text-[11px]">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Koneksi Terenkripsi SSL 256-bit • Standar SPBE</span>
          </p>
          <p className="text-[11px] text-slate-400">
            © 2026 SPM Terpadu — Dikembangkan oleh Tim TI Kabupaten Tapanuli Selatan. All Rights Reserved.
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL POPUP BANTUAN LUPA KATA SANDI */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 relative text-slate-800"
            >
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <HelpCircle size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Bantuan Reset Kata Sandi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Prosedur Keamanan Akun Kedinasan
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <p>
                  Sesuai kebijakan keamanan informasi SPBE Pemkab Tapanuli Selatan, reset kata sandi hanya dapat diproses melalui verifikasi kedinasan:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                  <li>Admin Kabupaten / OPD : Hubungi <strong>Administrator Sistem</strong>.</li>
                  <li>Tim IT Kabupaten Tapanuli Selatan</li>
                </ul>
              </div>



              <div className="mt-5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                >
                  Saya Mengerti
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
