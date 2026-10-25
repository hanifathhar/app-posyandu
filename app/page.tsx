"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse,
  GraduationCap,
  Users,
  Building2,
  Home,
  Shield,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  PhoneCall,
  MapPin,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Layers,
  Award,
  Activity,
  Menu,
  X,
  FileCheck2,
  Compass,
  ArrowUpRight,
  Phone,
  Mail,
  Scale,
  BookOpen,
} from "lucide-react";

import logoPic from "@/public/favicon.png";
import tapselLogo from "@/public/images/logo-tapsel.png";
import tapselBangkitLogo from "@/public/tapselbangkit.png";
import bgBack from "@/public/images/bg_back.png";

// 3 Banner Dummy untuk Slider Bagian Judul (Hero)
const HERO_SLIDES = [
  {
    id: 1,
    image: "/images/banner-1.jpg",
    tabLabel: "Posyandu & Kesehatan",
    badge: "Transformasi Layanan Primer Posyandu",
    badgeColors: ["bg-rose-400", "bg-sky-400", "bg-amber-400", "bg-emerald-400"],
    title: "Penuhi Hak Layanan Dasar Masyarakat",
    highlight: "Kabupaten Tapanuli Selatan",
    highlightGradient: "from-sky-300 via-purple-300 via-amber-300 to-emerald-300",
    deskripsi:
      "Sistem integrasi pelayanan dan pengaduan 6 Bidang SPM (Kesehatan, Pendidikan, Sosial, Pekerjaan Umum, Perumahan Rakyat, dan Trantibum Linmas) langsung dari simpul Posyandu dan Desa hingga ke Pemerintah Kabupaten.",
    actionText: "Ajukan Pengaduan",
    actionHref: "/pengaduan",
    secondaryText: "Eksplorasi 6 Bidang SPM",
    secondaryHref: "#bidang",
  },
  {
    id: 2,
    image: "/images/banner-2.jpg",
    tabLabel: "Pendidikan & Anak",
    badge: "Jaminan Belajar 12 Tahun & Hak Pendidikan",
    badgeColors: ["bg-sky-400", "bg-blue-400", "bg-indigo-400", "bg-teal-400"],
    title: "Wujudkan Generasi Cerdas & Berkualitas",
    highlight: "Bebas Hambatan Biaya",
    highlightGradient: "from-amber-300 via-orange-300 via-yellow-200 to-emerald-300",
    deskripsi:
      "Memastikan hak belajar anak usia dini hingga menengah, penanganan anak putus sekolah (ATS), dan penyediaan sarana pendidikan inklusif merata di seluruh pelosok desa.",
    actionText: "Layanan SPM Pendidikan",
    actionHref: "#bidang",
    secondaryText: "Lihat Alur Layanan",
    secondaryHref: "#alur",
  },
  {
    id: 3,
    image: "/images/banner-3.jpg",
    tabLabel: "Kesejahteraan Sosial",
    badge: "Perlindungan Sosial & Lingkungan Sehat",
    badgeColors: ["bg-emerald-400", "bg-teal-400", "bg-amber-400", "bg-sky-400"],
    title: "Gotong Royong Lindungi Warga Rentan",
    highlight: "Menuju Desa Sejahtera",
    highlightGradient: "from-emerald-300 via-teal-300 via-sky-300 to-amber-300",
    deskripsi:
      "Akses air minum aman, jamban sehat mandiri, rehabilitasi rumah tidak layak huni (RTLH), serta santunan sosial bagi warga yang membutuhkan uluran tangan secara nyata.",
    actionText: "Pelajari SPM Terpadu",
    actionHref: "#tentang",
    secondaryText: "Buat Pengaduan Warga",
    secondaryHref: "/pengaduan",
  },
];

// Definisi 6 Bidang SPM
const BIDANG_SPM_DATA = [
  {
    id: "KESEHATAN",
    nama: "Kesehatan",
    subjudul: "Posyandu & Layanan Kesehatan Dasar",
    tagline: "Memastikan setiap ibu, anak, dan warga memperoleh pelayanan kesehatan yang layak dan prima.",
    icon: HeartPulse,
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    themeColor: "from-rose-500 to-pink-600",
    accentBg: "bg-rose-500/10 text-rose-600",
    deskripsi:
      "Pelayanan kesehatan dasar mencakup pemantauan status gizi balita, pencegahan stunting, pemeriksaan rutin ibu hamil (Bumil KEK), imunisasi dasar lengkap, serta skrining kesehatan usia produktif dan lansia.",
    sasaran: [
      "Ibu hamil, ibu bersalin, dan bayi baru lahir",
      "Balita berisiko stunting dan gizi kurang",
      "Warga usia pendidikan dasar dan lansia",
      "Penderita penyakit menular dan penyakit kronis",
    ],
    layananUtama: [
      "Pemberian Makanan Tambahan (PMT) Balita Gizi Kurang",
      "Pemeriksaan Antenatal Care (ANC) Ibu Hamil Berkala",
      "Penimbangan & Pengukuran Antropometri Standar di Posyandu",
      "Rujukan Cepat Puskesmas & Pengawalan BPJS Kesehatan PBI",
    ],
    contohPengaduan:
      "Balita mengalami gizi buruk atau penurunan BB terus menerus, belum tersentuh imunisasi, atau ibu hamil risiko tinggi yang belum dipantau nakes.",
  },
  {
    id: "PENDIDIKAN",
    nama: "Pendidikan",
    subjudul: "Jaminan Belajar 12 Tahun & Hak Pendidikan",
    tagline: "Tidak boleh ada anak usia sekolah di Tapanuli Selatan yang putus sekolah karena kendala biaya.",
    icon: GraduationCap,
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    themeColor: "from-sky-500 to-blue-600",
    accentBg: "bg-sky-500/10 text-sky-600",
    deskripsi:
      "Menjamin tersedianya akses dan mutu pendidikan anak usia dini (PAUD), pendidikan dasar (SD/MI), serta pendidikan menengah pertama (SMP/MTs) bagi seluruh anak bangsa secara adil dan merata.",
    sasaran: [
      "Anak usia 5-6 tahun (Pendidikan Anak Usia Dini)",
      "Anak usia 7-12 tahun (Pendidikan Dasar SD/MI)",
      "Anak usia 13-15 tahun (Pendidikan Dasar SMP/MTs)",
      "Anak Tidak Sekolah (ATS) dan anak putus sekolah",
    ],
    layananUtama: [
      "Pendataan dan penarikan kembali Anak Putus Sekolah (ATS)",
      "Bantuan perlengkapan sekolah (seragam, tas, buku pelajaran)",
      "Fasilitasi beasiswa dan Program Indonesia Pintar (PIP)",
      "Pengawasan sarana belajar inklusif di wilayah pedesaan",
    ],
    contohPengaduan:
      "Anak usia sekolah tidak dapat melanjutkan pendidikan karena kesulitan biaya, atau tidak memiliki seragam dan buku penunjang.",
  },
  {
    id: "SOSIAL",
    nama: "Sosial",
    subjudul: "Perlindungan & Jaminan Kesejahteraan Keluarga",
    tagline: "Perlindungan nyata bagi warga rentan, disabilitas, lansia terlantar, dan keluarga prasejahtera.",
    icon: Users,
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    themeColor: "from-amber-500 to-orange-600",
    accentBg: "bg-amber-500/10 text-amber-600",
    deskripsi:
      "Penyelenggaraan rehabilitasi sosial dasar, jaminan perlindungan korban bencana, serta pemutakhiran data kemiskinan (DTKS) agar bantuan sosial tepat sasaran kepada masyarakat yang benar-benar membutuhkan.",
    sasaran: [
      "Lanjut usia terlantar dan hidup sebatang kara",
      "Penyandang disabilitas fisik maupun mental terlantar",
      "Anak terlantar dan keluarga prasejahtera ekstrem",
      "Korban bencana alam dan bencana sosial",
    ],
    layananUtama: [
      "Bantuan permakanan harian bagi lansia tunggal terlantar",
      "Penyediaan alat bantu disabilitas (kursi roda, tongkat, kacamata)",
      "Verifikasi faktual penerima bantuan sosial (PKH, BPNT, DTKS)",
      "Penyaluran logistik tanggap darurat musibah bencana",
    ],
    contohPengaduan:
      "Warga lansia sebatang kara belum menerima bantuan, atau ada keluarga miskin yang luput dari pendataan bantuan sosial pemerintah.",
  },
  {
    id: "PEKERJAAN_UMUM",
    nama: "Pekerjaan Umum",
    subjudul: "Akses Air Minum Aman & Sanitasi Sehat",
    tagline: "Menjamin ketersediaan air bersih dan jamban sehat sebagai fondasi hidup bersih dan bebas stunting.",
    icon: Building2,
    badgeColor: "bg-sky-50 text-sky-800 border-sky-200",
    themeColor: "from-sky-500 to-blue-600",
    accentBg: "bg-sky-500/10 text-sky-600",
    deskripsi:
      "Pemenuhan kebutuhan pokok air minum perpipaan/non-perpajakan yang terlindungi serta penyediaan sistem pengelolaan sanitasi air limbah domestik (jamban sehat keluarga) untuk mewujudkan desa bebas buang air besar sembarangan (ODF).",
    sasaran: [
      "Masyarakat desa tanpa akses air minum layak",
      "Keluarga yang belum memiliki jamban sehat mandiri",
      "Wilayah rawan krisis air bersih saat musim kemarau",
      "Lingkungan pemukiman dengan saluran drainase tersumbat",
    ],
    layananUtama: [
      "Pembangunan dan rehabilitasi SPAM (Sistem Penyediaan Air Minum)",
      "Bantuan stimulan jamban sehat keluarga dan tangki septik aman",
      "Normalisasi saluran drainase dan sanitasi lingkungan pemukiman",
      "Perbaikan akses jalan lingkungan menuju sarana posyandu & sekolah",
    ],
    contohPengaduan:
      "Sumber air bersih desa mati atau tercemar, dan masih banyak keluarga balita yang belum memiliki jamban sehat (BABS).",
  },
  {
    id: "PERUMAHAN_RAKYAT",
    nama: "Perumahan Rakyat",
    subjudul: "Rehabilitasi Rumah Layak Huni (RTLH)",
    tagline: "Hunian yang kokoh, sehat, dan aman bagi seluruh keluarga di Kabupaten Tapanuli Selatan.",
    icon: Home,
    badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
    themeColor: "from-indigo-500 to-violet-600",
    accentBg: "bg-indigo-500/10 text-indigo-600",
    deskripsi:
      "Penyediaan dan fasilitasi rehabilitasi rumah tidak layak huni (RTLH/Bedah Rumah) bagi masyarakat berpenghasilan rendah, serta penanganan relokasi rumah bagi warga yang terdampak bencana alam.",
    sasaran: [
      "Masyarakat Berpenghasilan Rendah (MBR) pemilik RTLH",
      "Keluarga dengan rumah berlantai tanah dan atap lapuk",
      "Korban bencana alam (longsor, banjir, kebakaran rumah)",
      "Kawasan pemukiman kumuh pedesaan",
    ],
    layananUtama: [
      "Program Bantuan Stimulan Perumahan Swadaya (BSPS / Bedah Rumah)",
      "Perbaikan komponen keselamatan struktur, atap, lantai, dan dinding",
      "Bantuan material darurat bagi rumah tertimpa bencana alam",
      "Fasilitasi ventilasi sehat dan pencahayaan alami rumah",
    ],
    contohPengaduan:
      "Rumah warga hampir roboh, atap bocor parah, dinding rapuh, atau rusak berat akibat bencana yang membahayakan keselamatan keluarga.",
  },
  {
    id: "TRANTIBUM_LINMAS",
    nama: "Trantibum Linmas",
    subjudul: "Ketenteraman, Ketertiban & Penanggulangan Bencana",
    tagline: "Mewujudkan lingkungan yang aman, tertib, serta tanggap darurat bencana dan perlindungan warga.",
    icon: Shield,
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    themeColor: "from-emerald-600 to-green-700",
    accentBg: "bg-emerald-500/10 text-emerald-600",
    deskripsi:
      "Pelayanan pencegahan gangguan ketenteraman dan ketertiban umum, penegakan regulasi daerah, penanganan darurat bencana (BPBD/Damkar), serta perlindungan khusus bagi perempuan dan anak dari tindak kekerasan.",
    sasaran: [
      "Masyarakat di kawasan rawan bencana alam",
      "Perempuan dan anak korban kekerasan/penelantaran",
      "Warga masyarakat terdampak gangguan ketertiban umum",
      "Satgas Perlindungan Masyarakat (Linmas) tingkat desa",
    ],
    layananUtama: [
      "Respon cepat evakuasi penyelamatan darurat bencana & kebakaran",
      "Pencegahan dan mediasi gangguan keamanan & ketenteraman warga",
      "Layanan pendampingan pengaduan kekerasan perempuan dan anak",
      "Peningkatan kesiapsiagaan warga terhadap ancaman bencana wilayah",
    ],
    contohPengaduan:
      "Terjadi indikasi penelantaran anak/KDRT, ancaman bahaya longsor di pemukiman, atau gangguan ketenteraman lingkungan warga.",
  },
];

// Tahapan Alur Pengaduan
const ALUR_TAHAPAN = [
  {
    nomor: "01",
    titel: "Pengaduan oleh Warga / Kader",
    deskripsi:
      "Masyarakat atau kader Posyandu menyampaikan laporan kendala SPM secara online via web atau langsung melapor ke Posyandu setempat.",
    waktu: "Menit - Jam",
    icon: FileText,
    badge: "Tahap Awal",
  },
  {
    nomor: "02",
    titel: "Verifikasi Faktual Tingkat Desa",
    deskripsi:
      "Kader Posyandu dan Kepala Desa melakukan pengecekan langsung ke lokasi warga guna memvalidasi data administrasi dan kondisi nyata.",
    waktu: "Maks. 2x24 Jam",
    icon: FileCheck2,
    badge: "Tingkat Desa",
  },
  {
    nomor: "03",
    titel: "Validasi & Rekomendasi Kecamatan",
    deskripsi:
      "Kasi Kessos dan Camat memeriksa kelayakan berkas serta mengesahkan rekomendasi resmi kepada dinas teknis terkait di Kabupaten.",
    waktu: "Maks. 2x24 Jam",
    icon: Scale,
    badge: "Tingkat Kecamatan",
  },
  {
    nomor: "04",
    titel: "Tindak Lanjut & Intervensi Dinas",
    deskripsi:
      "OPD teknis Kabupaten (Dinkes, Dinsos, Dinas PU, Disperkim, BPBD, dll.) langsung menyalurkan bantuan dan solusi konkret.",
    waktu: "Penanganan Lapangan",
    icon: CheckCircle2,
    badge: "Tingkat Kabupaten",
  },
];

// FAQ SPM
const FAQ_ITEMS = [
  {
    pertanyaan: "Apa yang dimaksud dengan Standar Pelayanan Minimal (SPM)?",
    jawaban:
      "Standar Pelayanan Minimal (SPM) adalah ketentuan mengenai jenis dan mutu pelayanan dasar yang merupakan urusan pemerintahan wajib yang berhak diperoleh oleh setiap warga negara secara minimal. Diatur secara nasional melalui Peraturan Pemerintah No. 2 Tahun 2018.",
  },
  {
    pertanyaan: "Siapa saja yang berhak mendapatkan pelayanan SPM?",
    jawaban:
      "Setiap warga negara Indonesia yang berdomisili di Kabupaten Tapanuli Selatan, khususnya kelompok rentan seperti ibu hamil, balita berisiko stunting, anak usia sekolah dari keluarga prasejahtera, lansia terlantar, serta masyarakat yang belum memiliki rumah layak huni dan sanitasi sehat.",
  },
  {
    pertanyaan: "Apakah pengaduan atau pengajuan layanan SPM dipungut biaya?",
    jawaban:
      "Sama sekali TIDAK DIPUNGUT BIAYA (100% GRATIS). Seluruh proses pengaduan, verifikasi lapangan, hingga intervensi bantuan merupakan program prioritas Pemerintah Kabupaten Tapanuli Selatan demi kesejahteraan masyarakat.",
  },
  {
    pertanyaan: "Bagaimana jika warga yang membutuhkan bantuan tidak memiliki smartphone atau internet?",
    jawaban:
      "Warga dapat langsung menghubungi Kader Posyandu di dusun/lingkungan masing-masing atau melapor ke Balai Desa setempat. Kader Posyandu telah dilatih untuk mendata dan mendaftarkan pengaduan secara langsung ke dalam sistem SPM Terpadu.",
  },
  {
    pertanyaan: "Bagaimana cara melacak perkembangan pengaduan saya?",
    jawaban:
      "Setelah mengirimkan laporan, pelapor akan menerima Kode Token Unik (contoh: TRK-7A9B2C) dan Nomor Pengaduan. Anda cukup memasukkan kode tersebut pada fitur 'Lacak Status Pengaduan' di halaman ini untuk melihat catatan verifikasi dari desa, kecamatan, hingga kabupaten.",
  },
  {
    pertanyaan: "Berapa lama laporan saya akan ditindaklanjuti?",
    jawaban:
      "Verifikasi tingkat desa ditargetkan selesai dalam 1x24 hingga 2x24 jam kerja. Validasi kecamatan maksimal 2x24 jam kerja sebelum diteruskan ke dinas teknis kabupaten untuk penjadwalan tindak lanjut atau intervensi bantuan.",
  },
];

export default function SPMHomePage() {
  const router = useRouter();
  const [selectedBidang, setSelectedBidang] = useState(BIDANG_SPM_DATA[0]);
  const [trackingInput, setTrackingInput] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // State untuk Sliding Banner Hero
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-play interval slider banner (6 detik)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  // Data Statistik Wilayah & Posyandu dari Database
  const [stats, setStats] = useState({
    bidang: 6,
    kecamatan: 0,
    desa: 0,
    posyandu: 0,
    loading: true,
  });

  useEffect(() => {
    fetch("/api/public/stats")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setStats({
            bidang: res.data.bidang ?? 6,
            kecamatan: res.data.kecamatan ?? 0,
            desa: res.data.desa ?? 0,
            posyandu: res.data.posyandu ?? 0,
            loading: false,
          });
        }
      })
      .catch((err) => {
        console.error("Gagal memuat statistik wilayah:", err);
      });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    router.push(`/pengaduan?tab=lacak&token=${encodeURIComponent(trackingInput.trim())}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#0c3b5e] selection:text-white">


      {/* 2. MAIN HEADER NAVIGATION */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-white/95 backdrop-blur-md shadow-md py-3 border-b border-slate-200"
          : "bg-white/90 backdrop-blur-sm py-4 border-b border-slate-100"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & Identity */}
          <Link href="/" className="flex items-center gap-3 sm:gap-4 group">
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div className="w-9 h-11 sm:w-10 sm:h-12 relative shrink-0 transition-transform group-hover:scale-105">
                <Image
                  src={tapselLogo}
                  alt="Logo Pemkab Tapanuli Selatan"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="h-8 sm:h-10 w-28 sm:w-36 relative shrink-0 transition-transform group-hover:scale-105">
                <Image
                  src={tapselBangkitLogo}
                  alt="Logo Tapsel Bangkit"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <div className="leading-tight hidden sm:block border-l border-slate-200 pl-3">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                Pemerintah Kabupaten
              </div>
              <div className="text-base sm:text-lg font-black text-[#0c3b5e] tracking-tight">
                Tapanuli Selatan
              </div>
              <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-widest flex items-center gap-1">
                <span>SAPA POSYANDU TAPSEL</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-700">
            <a href="#tentang" className="hover:text-[#0c3b5e] transition">
              Home
            </a>
            <a href="#bidang" className="hover:text-[#0c3b5e] transition">
              6 Bidang Pelayanan
            </a>
            <a href="#alur" className="hover:text-[#0c3b5e] transition">
              Alur Layanan
            </a>
            <a href="#posyandu" className="hover:text-[#0c3b5e] transition">
              Transformasi Posyandu
            </a>
            <a href="#faq" className="hover:text-[#0c3b5e] transition">
              FAQ
            </a>
            <a href="#kontak" className="hover:text-[#0c3b5e] transition">
              Kontak
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">

            <Link
              href="/login"
              className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-[#0c3b5e] text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center gap-2"
            >
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Portal Petugas</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
            aria-label="Buka Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 shadow-xl"
            >
              <nav className="flex flex-col space-y-3 text-sm font-semibold text-slate-800">
                <a
                  href="#tentang"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 border-b border-slate-100"
                >
                  Tentang SPM
                </a>
                <a
                  href="#bidang"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 border-b border-slate-100"
                >
                  6 Bidang Pelayanan
                </a>
                <a
                  href="#alur"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 border-b border-slate-100"
                >
                  Alur Layanan
                </a>
                <a
                  href="#posyandu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 border-b border-slate-100"
                >
                  Transformasi Posyandu
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 border-b border-slate-100"
                >
                  FAQ
                </a>
                <a
                  href="#kontak"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 border-b border-slate-100"
                >
                  Kontak
                </a>
                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    href="/pengaduan"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center font-bold"
                  >
                    Ajukan Pengaduan
                  </Link>
                  <Link
                    href="/login"
                    className="w-full py-3 rounded-xl bg-slate-900 text-white text-center font-bold"
                  >
                    Masuk Portal Petugas
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 3. HERO SECTION - SLIDING BANNER CAROUSEL */}
      <section
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative overflow-hidden bg-slate-950 text-white pt-12 pb-20 lg:pt-16 lg:pb-28"
      >
        {/* Dynamic Sliding Background Images */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 z-0"
          >
            <Image
              src={HERO_SLIDES[currentSlide].image}
              alt={HERO_SLIDES[currentSlide].title}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            {/* Subtle, minimal gradient overlay so banner photos remain bright, vibrant, and clear */}
            <div className="absolute inset-0 bg-slate-950/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/25" />
          </motion.div>
        </AnimatePresence>

        {/* Carousel Navigation Arrows */}
        <button
          onClick={handlePrevSlide}
          aria-label="Banner Sebelumnya"
          className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-slate-900/70 hover:bg-white hover:text-slate-950 backdrop-blur-md border border-white/25 text-white items-center justify-center transition-all duration-200 shadow-xl hover:scale-110 active:scale-95 cursor-pointer"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={handleNextSlide}
          aria-label="Banner Berikutnya"
          className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-slate-900/70 hover:bg-white hover:text-slate-950 backdrop-blur-md border border-white/25 text-white items-center justify-center transition-all duration-200 shadow-xl hover:scale-110 active:scale-95 cursor-pointer"
        >
          <ChevronRight size={24} />
        </button>

        {/* Main Content Area */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="text-center max-w-4xl mx-auto py-4 px-4 sm:px-8 rounded-3xl bg-slate-950/35 backdrop-blur-[2px] border border-white/10 shadow-2xl"
            >
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-bold text-white mb-6 shadow-md">
                <div className="flex items-center gap-1.5">
                  {HERO_SLIDES[currentSlide].badgeColors.map((color, i) => (
                    <span key={i} className={`w-2 h-2 rounded-full ${color}`} />
                  ))}
                </div>
                <span className="text-white">{HERO_SLIDES[currentSlide].badge}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight sm:leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]">
                {HERO_SLIDES[currentSlide].title}{" "}
                <span
                  className={`text-transparent bg-clip-text bg-gradient-to-r ${HERO_SLIDES[currentSlide].highlightGradient} drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]`}
                >
                  {HERO_SLIDES[currentSlide].highlight}
                </span>
              </h1>

              {/* Subhead Description */}
              <p className="mt-6 text-base sm:text-lg lg:text-xl text-white font-medium leading-relaxed max-w-3xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                {HERO_SLIDES[currentSlide].deskripsi}
              </p>

              {/* Quick Actions Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={HERO_SLIDES[currentSlide].actionHref}
                  className="w-full sm:w-auto py-4 px-8 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-base shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-3 transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <FileText size={20} />
                  <span>{HERO_SLIDES[currentSlide].actionText}</span>
                  <ArrowRight size={18} />
                </Link>

                <a
                  href={HERO_SLIDES[currentSlide].secondaryHref}
                  className="w-full sm:w-auto py-4 px-8 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-base border border-white/20 backdrop-blur-md transition flex items-center justify-center gap-2"
                >
                  <Layers size={18} className="text-sky-300" />
                  <span>{HERO_SLIDES[currentSlide].secondaryText}</span>
                </a>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Interactive Slide Tabs / Indicators */}
          <div className="mt-8 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {HERO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(idx)}
                className={`group flex items-center gap-2.5 px-3.5 sm:px-5 py-2 rounded-full transition-all duration-300 text-xs sm:text-sm font-bold cursor-pointer ${currentSlide === idx
                  ? "bg-white text-slate-950 shadow-xl scale-105"
                  : "bg-black/40 text-white/80 hover:bg-black/60 hover:text-white border border-white/15 backdrop-blur-md"
                  }`}
              >
                <span
                  className={`w-2 h-2 rounded-full transition-transform ${currentSlide === idx ? "bg-blue-600 scale-125" : "bg-white/50 group-hover:bg-white"
                    }`}
                />
                <span>0{slide.id}</span>
                <span className="hidden sm:inline font-semibold">{slide.tabLabel}</span>
              </button>
            ))}
          </div>

          {/* 4. QUICK TRACKING WIDGET IN HERO */}
          <div className="mt-10 max-w-2xl mx-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-3 shadow-2xl border border-white/90 text-slate-800">
              <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Lacak laporan Anda? Masukkan Kode Token (misal: TRK-7A9B2C)..."
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="py-3 px-6 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-md"
                >
                  <Search size={16} />
                  <span>Lacak Aduan</span>
                </button>
              </form>
              <p className="text-[11px] text-slate-500 mt-2 text-center sm:text-left px-2">
                *Gunakan kode pelacakan unik yang diberikan saat mendaftarkan laporan pengaduan secara online.
              </p>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 text-center shadow-lg">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-300">
                {stats.loading ? "-" : stats.bidang}
              </div>
              <div className="text-xs sm:text-sm font-bold text-white mt-1">Bidang Pelayanan SPM</div>
              <p className="text-[11px] text-slate-300 mt-0.5">Urusan Wajib Pelayanan Dasar</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 text-center shadow-lg">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-purple-300">
                {stats.loading ? "-" : stats.kecamatan}
              </div>
              <div className="text-xs sm:text-sm font-bold text-white mt-1">Kecamatan Wilayah</div>
              <p className="text-[11px] text-slate-300 mt-0.5">Terintegrasi Sistem SPM</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 text-center shadow-lg">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-300">
                {stats.loading ? "-" : stats.desa}
              </div>
              <div className="text-xs sm:text-sm font-bold text-white mt-1">Desa & Kelurahan</div>
              <p className="text-[11px] text-slate-300 mt-0.5">Verifikasi Lapangan Faktual</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 text-center shadow-lg">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-sky-300">
                {stats.loading ? "-" : stats.posyandu}
              </div>
              <div className="text-xs sm:text-sm font-bold text-white mt-1">Posyandu Aktif</div>
              <p className="text-[11px] text-slate-300 mt-0.5">Simpul Deteksi Dini 6 Bidang</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION: APA ITU SPM & DASAR HUKUM */}
      <section id="tentang" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Sisi Kiri: Narasi & Penjelasan */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 py-1 px-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider">
                <BookOpen size={14} className="text-blue-600" />
                <span>Pengenalan Standar Pelayanan Minimal</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
                Mewujudkan Pelayanan Dasar Berkualitas, Tepat Sasaran, & Berkeadilan
              </h2>

              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                <strong>Standar Pelayanan Minimal (SPM)</strong> adalah ketentuan mengenai jenis dan mutu pelayanan dasar yang merupakan Urusan Pemerintahan Wajib yang berhak diperoleh oleh setiap warga negara secara minimal.
              </p>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Pemerintah Kabupaten Tapanuli Selatan berkomitmen tinggi dalam mengawal pemenuhan 6 urusan wajib pelayanan dasar. Melalui platform digital SPM Terpadu, setiap pengaduan kendala warga di pelosok desa dapat didengar, diverifikasi, dan segera ditindaklanjuti secara berjenjang oleh dinas teknis terkait.
              </p>

              {/* 4 Pilar SPM dengan 4 Warna Logo: Biru, Ungu, Orange, Hijau */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 hover:border-blue-300 transition">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-blue-500/20">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Tepat Sasaran</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Memastikan bantuan dan intervensi diterima oleh warga yang benar-benar memenuhi kriteria SPM.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 hover:border-purple-300 transition">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-purple-500/20">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Transparan & Terlacak</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Status pengaduan dapat dipantau oleh warga secara real-time melalui kode pelacakan unik.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 hover:border-orange-300 transition">
                  <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-orange-500/20">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Respon Berjenjang Cepat</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verifikasi langsung di lapangan oleh perangkat Desa dan Kecamatan dalam 2x24 jam.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 hover:border-emerald-300 transition">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-emerald-500/20">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">100% Bebas Biaya</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Seluruh pelayanan pengaduan dan verifikasi masyarakat tidak dipungut biaya apapun.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sisi Kanan: Kartu Regulasi & Dasar Hukum */}
            <div className="lg:col-span-5">
              <div className="bg-gradient-to-br from-slate-900 via-[#0c3b5e] to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
                <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl"></div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-400">
                    <Scale size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Dasar Hukum Penyelenggaraan</h3>
                    <p className="text-xs text-blue-300">Regulasi Resmi Republik Indonesia</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-xl bg-white/10 border border-white/10">
                    <span className="font-bold text-amber-300 block mb-1">
                      Undang-Undang No. 23 Tahun 2014
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Tentang Pemerintahan Daerah, yang menegaskan bahwa pelayanan dasar merupakan urusan pemerintahan wajib bagi Pemerintah Daerah.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/10 border border-white/10">
                    <span className="font-bold text-amber-300 block mb-1">
                      Peraturan Pemerintah (PP) No. 2 Tahun 2018
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Tentang Standar Pelayanan Minimal, yang mengatur secara terperinci jenis, mutu, dan kriteria pelayanan dasar di 6 bidang wajib.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/10 border border-white/10">
                    <span className="font-bold text-amber-300 block mb-1">
                      Permendagri No. 59 Tahun 2021
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Tentang Penerapan Standar Pelayanan Minimal, petunjuk teknis tahapan penerapan SPM mulai dari pengumpulan data hingga pelaporan.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/10 border border-white/10">
                    <span className="font-bold text-amber-300 block mb-1">
                      Permendagri No. 13 Tahun 2024
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Tentang Pos Pelayanan Terpadu
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/10 border border-white/10">
                    <span className="font-bold text-blue-300 block mb-1">
                      Peraturan Daerah Pemkab Tapanuli Selatan
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Kebijakan Integrasi Transformasi Posyandu 6 Bidang SPM sebagai simpul pelayanan dasar di tingkat desa.
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION: 6 BIDANG PELAYANAN DASAR SPM (INTERAKTIF) */}
      <section id="bidang" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 py-1 px-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider mb-3">
              <Layers size={14} />
              <span>Cakupan Urusan Wajib Pelayanan Dasar</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              6 Bidang Standar Pelayanan Minimal
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3">
              Klik salah satu bidang di bawah ini untuk mempelajari indikator layanan, kelompok sasaran, dan contoh kendala yang dapat Anda laporkan.
            </p>
          </div>

          {/* Interactive Bidang Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {BIDANG_SPM_DATA.map((bidang) => {
              const IconComponent = bidang.icon;
              const isSelected = selectedBidang.id === bidang.id;
              return (
                <button
                  key={bidang.id}
                  onClick={() => setSelectedBidang(bidang)}
                  className={`p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer border ${isSelected
                    ? "bg-white border-[#0c3b5e] shadow-lg scale-102 ring-2 ring-[#0c3b5e]/20"
                    : "bg-white/70 hover:bg-white border-slate-200 text-slate-600 shadow-2xs"
                    }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 transition-colors ${isSelected
                      ? `bg-gradient-to-tr ${bidang.themeColor} text-white shadow-md`
                      : "bg-slate-100 text-slate-600"
                      }`}
                  >
                    <IconComponent size={22} />
                  </div>
                  <span className={`text-xs sm:text-sm font-bold leading-tight ${isSelected ? "text-[#0c3b5e]" : "text-slate-700"}`}>
                    {bidang.nama}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detailed Card for Selected Bidang */}
          <motion.div
            key={selectedBidang.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xl"
          >
            <div className="flex flex-col lg:flex-row gap-8 items-start justify-between border-b border-slate-100 pb-8">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${selectedBidang.badgeColor}`}
                  >
                    Bidang {selectedBidang.nama}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {selectedBidang.subjudul}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {selectedBidang.nama}: {selectedBidang.subjudul}
                </h3>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  {selectedBidang.deskripsi}
                </p>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium italic">
                  &ldquo;{selectedBidang.tagline}&rdquo;
                </div>
              </div>

              {/* Action Button for reporting this bidang */}
              <div className="w-full lg:w-auto shrink-0 flex flex-col gap-3">
                <Link
                  href={`/pengaduan?bidang=${selectedBidang.id}`}
                  className={`py-3.5 px-6 rounded-2xl bg-gradient-to-r ${selectedBidang.themeColor} text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 hover:opacity-95`}
                >
                  <FileText size={18} />
                  <span>Laporkan Kendala {selectedBidang.nama}</span>
                </Link>
                <span className="text-[11px] text-slate-400 text-center">
                  Respon verifikasi lapangan maksimal 2x24 jam
                </span>
              </div>
            </div>

            {/* Sasaran Penerima & Layanan Utama */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
              {/* Sasaran Penerima */}
              <div className="space-y-4">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users size={18} className="text-blue-600" />
                  <span>Kelompok Sasaran Penerima Manfaat:</span>
                </h4>
                <ul className="space-y-2.5">
                  {selectedBidang.sasaran.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Layanan & Intervensi Utama */}
              <div className="space-y-4">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  <span>Jenis Layanan & Intervensi Utama:</span>
                </h4>
                <ul className="space-y-2.5">
                  {selectedBidang.layananUtama.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                      <ChevronRight size={16} className="text-blue-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contoh Kasus Pengaduan */}
            <div className="mt-8 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-amber-900 block mb-0.5">
                  Contoh Kejadian yang Dapat Dilaporkan Warga:
                </span>
                <p className="text-amber-800 leading-relaxed">
                  {selectedBidang.contohPengaduan}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 7. SECTION: TRANSFORMASI POSYANDU BERBASIS 6 BIDANG SPM */}
      <section id="posyandu" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-12 lg:p-16 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 py-1 px-3 rounded-md bg-white/10 backdrop-blur-md text-blue-300 text-xs font-bold uppercase tracking-wider mb-4 border border-white/15">
                <Sparkles size={14} className="text-amber-300" />
                <span>Inovasi Daerah Tapanuli Selatan</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Transformasi Posyandu: Bukan Hanya Timbang Balita, Tapi Simpul 6 Bidang SPM
              </h2>

              <p className="mt-6 text-slate-200 text-sm sm:text-base lg:text-lg leading-relaxed">
                Di era baru, Posyandu bertransformasi menjadi <strong>Lembaga Kemasyarakatan Desa (LKD)</strong> yang terintegrasi. Posyandu kini menjadi ujung tombak deteksi dini tidak hanya kesehatan ibu dan anak, namun juga mendeteksi anak putus sekolah, lansia terlantar, ketiadaan sanitasi, rumah roboh, hingga ketenteraman warga.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <div className="text-orange-400 font-black text-lg mb-1">01. Deteksi Dini</div>
                  <p className="text-xs text-slate-300">
                    Kader mengenali kebutuhan warga dari pintu ke pintu saat hari buka posyandu dan kunjungan rumah.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <div className="text-purple-300 font-black text-lg mb-1">02. Input Cepat</div>
                  <p className="text-xs text-slate-300">
                    Kader desa dapat langsung mendaftarkan pengaduan warga ke sistem portal SPM Terpadu.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <div className="text-emerald-300 font-black text-lg mb-1">03. Respon Nyata</div>
                  <p className="text-xs text-slate-300">
                    Dinas Kabupaten menyalurkan intervensi langsung ke sasaran berdasarkan data valid posyandu.
                  </p>
                </div>
              </div>

              <div className="mt-10 flex flex-wrap gap-4 items-center">
                <Link
                  href="/pengaduan"
                  className="py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-sm shadow-md transition flex items-center gap-2"
                >
                  <FileText size={16} />
                  <span>Laporkan Kebutuhan Posyandu Anda</span>
                </Link>
                <Link
                  href="/login"
                  className="py-3 px-6 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-sm border border-white/20 backdrop-blur-md transition flex items-center gap-2"
                >
                  <ShieldCheck size={16} />
                  <span>Login Petugas & Kader</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. SECTION: ALUR PENGADUAN & VERIFIKASI 4 TAHAP */}
      <section id="alur" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 py-1 px-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider mb-3">
              <Compass size={14} />
              <span>Transparansi & Akuntabilitas</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Alur Pelayanan & Pengaduan Berjenjang 4 Tahap
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3">
              Setiap laporan warga diproses melalui verifikasi berjenjang dari Desa, Kecamatan, hingga Dinas Teknis Kabupaten demi menjamin kepastian tindak lanjut.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {ALUR_TAHAPAN.map((tahap, idx) => {
              const IconComp = tahap.icon;
              const stepStyles = [
                { num: "text-blue-600", bg: "bg-blue-50 text-blue-600", border: "hover:border-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-200" },
                { num: "text-purple-600", bg: "bg-purple-50 text-purple-600", border: "hover:border-purple-500", badge: "bg-purple-50 text-purple-700 border-purple-200" },
                { num: "text-orange-500", bg: "bg-orange-50 text-orange-600", border: "hover:border-orange-500", badge: "bg-orange-50 text-orange-700 border-orange-200" },
                { num: "text-emerald-600", bg: "bg-emerald-50 text-emerald-600", border: "hover:border-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
              ][idx];

              return (
                <div
                  key={idx}
                  className={`bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-lg relative flex flex-col justify-between group ${stepStyles.border} transition`}
                >
                  <div>
                    {/* Header Card Tahap */}
                    <div className="flex items-center justify-between mb-5">
                      <span className={`text-3xl font-black font-mono ${stepStyles.num}`}>
                        {tahap.nomor}
                      </span>
                      <span className={`text-[10px] font-bold py-1 px-2.5 rounded-full uppercase tracking-wider border ${stepStyles.badge}`}>
                        {tahap.badge}
                      </span>
                    </div>

                    <div className={`w-12 h-12 rounded-2xl ${stepStyles.bg} flex items-center justify-center mb-4 transition-colors`}>
                      <IconComp size={24} />
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-2">
                      {tahap.titel}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {tahap.deskripsi}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Clock size={14} className="text-slate-400" />
                    <span>Estimasi: {tahap.waktu}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Banner Pelacakan Cepat */}
          <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Search size={28} />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  Sudah Pernah Mengajukan Pengaduan?
                </h4>
                <p className="text-xs sm:text-sm text-slate-500">
                  Pantau posisi berkas pengaduan Anda saat ini secara transparan dan akurat.
                </p>
              </div>
            </div>

            <Link
              href="/pengaduan?tab=lacak"
              className="py-3 px-6 rounded-xl bg-slate-900 hover:bg-[#0c3b5e] text-white font-bold text-sm shadow-sm transition flex items-center gap-2 shrink-0"
            >
              <Search size={16} />
              <span>Buka Menu Pelacakan Aduan</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 9. SECTION: FAQ (TANYA JAWAB SPM) */}
      <section id="faq" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 py-1 px-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider mb-3">
              <HelpCircle size={14} />
              <span>Bantuan & Informasi</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Segala hal penting yang perlu Anda ketahui mengenai hak pelayanan dasar SPM dan tata cara pelaporan.
            </p>
          </div>

          <div className="space-y-3.5">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-800 hover:text-[#0c3b5e] transition"
                  >
                    <span>{item.pertanyaan}</span>
                    <ChevronDown
                      size={20}
                      className={`text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180 text-blue-600" : ""
                        }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100"
                      >
                        {item.jawaban}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. SECTION: KONTAK & PUSAT BANTUAN PEMKAB TAPSEL */}
      <section id="kontak" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Informasi Kontak */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 py-1 px-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider">
                <PhoneCall size={14} />
                <span>Pusat Informasi & Pengaduan</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
                Hubungi Sekretariat SPM Terpadu Kabupaten Tapanuli Selatan
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Pemerintah Kabupaten Tapanuli Selatan siap mendengarkan aspirasi dan kendala pemenuhan kebutuhan dasar masyarakat. Kunjungi kantor kami atau hubungi narahubung resmi di bawah ini:
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <strong className="block text-slate-800 text-sm">Alamat Kantor Sekretariat</strong>
                    <span className="text-xs sm:text-sm text-slate-500">
                      Kompleks Perkantoran Pemerintah Kabupaten Tapanuli Selatan, Jl. Prof. Lafran Pane, Kilang Papan, Dano Situmba, Kec. Sipirok, Kab. Tapanuli Selatan, Sumatera Utara 22742
                    </span>
                  </div>
                </div>




              </div>
            </div>

            {/* Kartu Call to Action */}
            <div className="lg:col-span-6">
              <div className="bg-gradient-to-tr from-[#0c3b5e] to-[#082942] rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 mb-6">
                  <FileText size={28} />
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  Laporkan Segera Bila Menemukan Warga Belum Tersentuh SPM
                </h3>

                <p className="mt-3 text-slate-300 text-xs sm:text-sm leading-relaxed">
                  Partisipasi Anda menyelamatkan masa depan balita stunting, menjamin anak tetap bersekolah, dan memberi hunian serta sanitasi layak bagi keluarga membutuhkan di Tapanuli Selatan.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/pengaduan"
                    className="py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm text-center shadow-md shadow-blue-600/20 transition cursor-pointer"
                  >
                    Mulai Buat Pengaduan Sekarang
                  </Link>

                  <Link
                    href="/login"
                    className="py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm text-center border border-white/20 transition"
                  >
                    Masuk Sebagai Petugas
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
            {/* Col 1: Brand & Identity */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-12 relative shrink-0">
                  <Image
                    src={tapselLogo}
                    alt="Logo Pemkab Tapanuli Selatan"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    Pemerintah Kabupaten
                  </h4>
                  <h3 className="text-base font-black text-blue-400">Tapanuli Selatan</h3>
                  <span className="text-[11px] text-slate-400">
                    Saluran Aspirasi dan Pengaduan Atif Posyandu Tapanuli Selatan
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed pr-6">
                Platform resmi pemantauan dan pengaduan Standar Pelayanan Minimal (SPM) dalam 6 urusan wajib pelayanan dasar demi menjamin keadilan sosial bagi seluruh masyarakat Tapanuli Selatan.
              </p>

              <div className="pt-2 text-xs text-slate-400 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>
                  Terintegrasi dengan {stats.loading ? "..." : stats.kecamatan} Kecamatan & {stats.loading ? "..." : stats.desa} Desa
                </span>
              </div>
            </div>

            {/* Col 2: 6 Bidang SPM */}
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">
                6 Bidang SPM
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a href="#bidang" className="hover:text-white transition">
                    1. Kesehatan (Posyandu)
                  </a>
                </li>
                <li>
                  <a href="#bidang" className="hover:text-white transition">
                    2. Pendidikan
                  </a>
                </li>
                <li>
                  <a href="#bidang" className="hover:text-white transition">
                    3. Sosial & Perlindungan
                  </a>
                </li>
                <li>
                  <a href="#bidang" className="hover:text-white transition">
                    4. Pekerjaan Umum (Air Bersih)
                  </a>
                </li>
                <li>
                  <a href="#bidang" className="hover:text-white transition">
                    5. Perumahan Rakyat (RTLH)
                  </a>
                </li>
                <li>
                  <a href="#bidang" className="hover:text-white transition">
                    6. Trantibum Linmas
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Layanan Cepat */}
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">
                Layanan Cepat
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <Link href="/pengaduan" className="hover:text-white transition">
                    Form Pengaduan SPM
                  </Link>
                </li>
                <li>
                  <Link href="/pengaduan?tab=lacak" className="hover:text-white transition">
                    Lacak Status Pengaduan
                  </Link>
                </li>
                <li>
                  <a href="#tentang" className="hover:text-white transition">
                    Dasar Hukum & Regulasi
                  </a>
                </li>
                <li>
                  <a href="#alur" className="hover:text-white transition">
                    Alur Verifikasi 4 Tahap
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition">
                    Tanya Jawab (FAQ)
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Akses Petugas */}
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">
                Portal Internal
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <Link href="/login" className="hover:text-white transition">
                    Login Petugas / Kader
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition">
                    Verifikasi Tingkat Desa
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition">
                    Validasi Kecamatan
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition">
                    Panel Dinas/Kabupaten
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>
              &copy; {new Date().getFullYear()} Pemerintah Kabupaten Tapanuli Selatan.
            </p>
            <div className="flex items-center gap-6 text-slate-400">
              <a href="#tentang" className="hover:text-white transition">
                Kebijakan Privasi
              </a>
              <a href="#tentang" className="hover:text-white transition">
                Syarat & Ketentuan
              </a>
              <a href="#kontak" className="hover:text-white transition">
                Pusat Bantuan
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
