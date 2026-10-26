"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  Filter,
  Download,
  Printer,
  RefreshCw,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  MapPin,
  FileSpreadsheet,
} from "lucide-react";
import { CustomPagination } from "@/components/CustomPagination";

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

interface DetailLaporanItem {
  no: number;
  id: string;
  nomorPengaduan: string;
  tanggal: string;
  pelapor: string;
  namaSasaran: string;
  nik?: string;
  noHp?: string;
  temuan: string;
  bidang: string;
  kategori: string;
  kecamatan: string;
  desa: string;
  posyandu: string;
  status: string;
  tindakLanjutDesa: string;
  tindakLanjutTerakhir: string;
  keterangan: string;
  tanggalSelesai?: string | null;
}

export default function LaporanRekapSPMPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasFiltered, setHasFiltered] = useState(false);

  // Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedKecamatan, setSelectedKecamatan] = useState("");
  const [selectedDesa, setSelectedDesa] = useState("");

  // Referensi Wilayah
  const [kecamatanList, setKecamatanList] = useState<any[]>([]);
  const [desaList, setDesaList] = useState<any[]>([]);

  // Pagination for Rekap table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Data Laporan
  const [reportData, setReportData] = useState<{
    infoWilayah: {
      namaKecamatan: string;
      namaDesa: string;
      namaPosyandu: string;
    };
    summary: {
      total: number;
      selesai: number;
      ditindaklanjuti: number;
      prosesVerifikasi: number;
      ditolak: number;
      perbaikan: number;
      tingkatPenyelesaian: number;
    };
    bidangStats: any[];
    kecamatanStats: any[];
    detailList: DetailLaporanItem[];
  }>({
    infoWilayah: {
      namaKecamatan: "",
      namaDesa: "",
      namaPosyandu: "",
    },
    summary: {
      total: 0,
      selesai: 0,
      ditindaklanjuti: 0,
      prosesVerifikasi: 0,
      ditolak: 0,
      perbaikan: 0,
      tingkatPenyelesaian: 0,
    },
    bidangStats: [],
    kecamatanStats: [],
    detailList: [],
  });

  // 1. Load User Session
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setCurrentUser(d.user);
          if (d.user.role === "ADMIN_DESA") {
            if (d.user.kecamatanId) setSelectedKecamatan(d.user.kecamatanId);
            if (d.user.desaId) setSelectedDesa(d.user.desaId);
          } else if (d.user.role === "ADMIN_KECAMATAN") {
            if (d.user.kecamatanId) setSelectedKecamatan(d.user.kecamatanId);
          }
        }
      })
      .catch((err) => console.error("Gagal load session user:", err));
  }, []);

  // 2. Load Referensi Kecamatan
  useEffect(() => {
    fetch("/api/public/wilayah")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setKecamatanList(d.data);
      })
      .catch((e) => console.error("Gagal load kecamatan:", e));
  }, []);

  // 3. Load Referensi Desa berdasarkan Kecamatan
  useEffect(() => {
    const targetKec = selectedKecamatan || (currentUser?.role === "ADMIN_KECAMATAN" ? currentUser.kecamatanId : "");
    if (targetKec) {
      fetch(`/api/public/wilayah?kd_kecamatan=${targetKec}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setDesaList(d.data);
        })
        .catch((e) => console.error("Gagal load desa:", e));
    } else {
      fetch("/api/public/wilayah?all_desa=true")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setDesaList(d.data);
        })
        .catch((e) => console.error("Gagal load semua desa:", e));
    }
  }, [selectedKecamatan, currentUser]);

  // 4. Fetch Laporan Data
  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (selectedKecamatan) params.set("kd_kecamatan", selectedKecamatan);
      if (selectedDesa) params.set("kd_desa", selectedDesa);

      const res = await fetch(`/api/admin/laporan?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setReportData(json);
      }
    } catch (e) {
      console.error("Gagal memuat laporan:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasFiltered(true);
    fetchReport();
  };

  const handleResetFilter = () => {
    setStartDate("");
    setEndDate("");
    if (currentUser?.role !== "ADMIN_DESA" && currentUser?.role !== "ADMIN_KECAMATAN") {
      setSelectedKecamatan("");
      setSelectedDesa("");
    }
    setHasFiltered(false);
    setReportData({
      infoWilayah: {
        namaKecamatan: "",
        namaDesa: "",
        namaPosyandu: "",
      },
      summary: {
        total: 0,
        selesai: 0,
        ditindaklanjuti: 0,
        prosesVerifikasi: 0,
        ditolak: 0,
        perbaikan: 0,
        tingkatPenyelesaian: 0,
      },
      bidangStats: [],
      kecamatanStats: [],
      detailList: [],
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportData.detailList || reportData.detailList.length === 0) return;

    const headers = [
      "No. Pengaduan",
      "Tanggal",
      "Nama Pelapor",
      "NIK",
      "No. HP",
      "Bidang SPM",
      "Kategori Masalah",
      "Kecamatan",
      "Desa",
      "Posyandu",
      "Status",
      "Tindak Lanjut Terakhir",
    ];

    const rows = reportData.detailList.map((d) => [
      `"${d.nomorPengaduan}"`,
      `"${new Date(d.tanggal).toLocaleDateString("id-ID")}"`,
      `"${d.pelapor}"`,
      `"${d.nik || "-"}"`,
      `"${d.noHp || "-"}"`,
      `"${d.bidang}"`,
      `"${d.kategori}"`,
      `"${d.kecamatan}"`,
      `"${d.desa}"`,
      `"${d.posyandu}"`,
      `"${d.status}"`,
      `"${(d.tindakLanjutTerakhir || "-").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Laporan_Rekap_SPM_Posyandu_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper resolusi nama wilayah
  const currentDesaObj = desaList.find((d) => d.kd_desa === selectedDesa);
  const currentKecObj = kecamatanList.find((k) => k.kd_kecamatan === selectedKecamatan);

  const namaDesaDisplay =
    currentDesaObj?.nm_desa ||
    reportData.infoWilayah.namaDesa ||
    currentUser?.desa?.nm_desa ||
    (selectedDesa ? `Desa (${selectedDesa})` : "Seluruh Desa");

  const namaKecamatanDisplay =
    currentKecObj?.nm_kecamatan ||
    reportData.infoWilayah.namaKecamatan ||
    currentUser?.kecamatan?.nm_kecamatan ||
    (selectedKecamatan ? `Kecamatan (${selectedKecamatan})` : "Kabupaten Tapanuli Selatan");

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-12 print:p-0 print:m-0 print:max-w-none print:w-full">
      {/* HEADER SECTION (Hidden when printing) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-1 print:hidden">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <BarChart3 className="text-blue-600" size={28} />
              <span>Rekapitulasi Capaian 6 SPM</span>
            </h1>
            {currentUser && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5 shadow-2xs">
                <MapPin size={13} className="text-blue-600" />
                {currentUser.role === "ADMIN_DESA"
                  ? `Wilayah: Desa ${currentUser.desa?.nm_desa || currentUser.desaId || "-"}`
                  : currentUser.role === "ADMIN_KECAMATAN"
                    ? `Wilayah: Kec. ${currentUser.kecamatan?.nm_kecamatan || currentUser.kecamatanId || "-"}`
                    : `Wilayah: Kabupaten Tapanuli Selatan`}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rekapitulasi statistik evaluasi capaian Standar Pelayanan Minimal (SPM) Posyandu se-Kabupaten Tapanuli Selatan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            disabled={!hasFiltered || reportData.detailList.length === 0}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs shadow-2xs transition disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-300"
            title={!hasFiltered ? "Terapkan filter terlebih dahulu" : "Download file CSV format rekapitulasi"}
          >
            <Download size={15} className="text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={!hasFiltered || reportData.detailList.length === 0}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed hover:shadow"
            title={!hasFiltered ? "Terapkan filter terlebih dahulu" : "Cetak rekapitulasi ke printer atau PDF"}
          >
            <Printer size={15} />
            <span>Cetak Dokumen</span>
          </button>
        </div>
      </div>

      {/* Official Government Print Header (Only visible on print) */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-4">
        <h2 className="text-base font-bold uppercase tracking-wide">Pemerintah Kabupaten Tapanuli Selatan</h2>
        <h1 className="text-xl font-black uppercase tracking-wider mt-0.5">
          Laporan Rekapitulasi Pelayanan Standar Pelayanan Minimal (SPM) Posyandu
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Periode: {startDate ? new Date(startDate).toLocaleDateString("id-ID") : "Semua Periode"} s/d{" "}
          {endDate ? new Date(endDate).toLocaleDateString("id-ID") : "Hari Ini"}
          {selectedKecamatan && ` | Kecamatan: ${namaKecamatanDisplay}`}
          {selectedDesa && ` | Desa: ${namaDesaDisplay}`}
        </p>
      </div>

      {/* FILTER BAR (Screen only) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm print:hidden">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-bold mb-1">Dari Tanggal:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">Sampai Tanggal:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">Kecamatan:</label>
            <select
              value={selectedKecamatan}
              disabled={currentUser?.role === "ADMIN_KECAMATAN" || currentUser?.role === "ADMIN_DESA"}
              onChange={(e) => {
                setSelectedKecamatan(e.target.value);
                setSelectedDesa("");
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="">Semua Kecamatan</option>
              {kecamatanList.map((k) => (
                <option key={k.kd_kecamatan} value={k.kd_kecamatan}>
                  {k.nm_kecamatan}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">Desa:</label>
            <select
              value={selectedDesa}
              disabled={currentUser?.role === "ADMIN_DESA"}
              onChange={(e) => setSelectedDesa(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="">Semua Desa</option>
              {desaList.map((d) => (
                <option key={d.kd_desa} value={d.kd_desa}>
                  {d.nm_desa}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-end space-x-2 pt-1 border-t border-slate-100">
            {(startDate || endDate || (currentUser?.role === "SUPERADMIN" && (selectedKecamatan || selectedDesa)) || hasFiltered) && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold transition text-xs"
              >
                Reset Filter
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50 text-xs"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Filter size={14} />}
              <span>Terapkan Filter</span>
            </button>
          </div>
        </form>
      </div>

      {!hasFiltered ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
            <Filter size={28} />
          </div>
          <div className="max-w-md">
            <h3 className="text-base font-bold text-slate-800">Laporan Belum Ditampilkan</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Tampilan awal laporan dalam keadaan kosong. Silakan tentukan kriteria filter (Kecamatan, Desa, atau Periode Tanggal) pada panel di atas, kemudian klik tombol <strong className="text-blue-700">"Terapkan Filter"</strong> untuk menampilkan data rekapitulasi.
            </p>
          </div>
        </div>
      ) : (
      <>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Pengaduan</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{reportData.summary.total}</span>
            <span className="text-xs text-slate-400 font-semibold">Kasus Terdaftar</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Kasus Selesai</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-900">{reportData.summary.selesai}</span>
            <span className="text-xs font-bold text-emerald-700">
              {reportData.summary.tingkatPenyelesaian}% Teratasi
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 shadow-xs">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Ditindaklanjuti</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-900">{reportData.summary.ditindaklanjuti}</span>
            <span className="text-xs text-blue-600 font-semibold">Intervensi Lapangan</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Tahap Verifikasi</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-900">{reportData.summary.prosesVerifikasi}</span>
            <span className="text-xs text-amber-700 font-semibold">Desa / Kec / Kab</span>
          </div>
        </div>
      </div>

      {/* Progress Capaian 6 Bidang SPM */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <TrendingUp size={20} className="text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Tingkat Penanganan Per 6 Bidang SPM</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Standar Pelayanan Minimal</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportData.bidangStats.map((b) => (
            <div key={b.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{b.nama}</span>
                <span className="text-slate-500">
                  <strong className="text-slate-900">{b.selesai}</strong> dari {b.total} selesai ({b.persentaseSelesai}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${b.persentaseSelesai}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rekapitulasi & Detail Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden print:border-none print:shadow-none">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Building2 size={18} className="text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Daftar Detail Pengaduan SPM Masyarakat</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Menampilkan {reportData.detailList.length} data laporan
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
              <RefreshCw size={18} className="animate-spin text-blue-600" />
              <span>Memuat data laporan...</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">No. Pengaduan</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Pelapor</th>
                  <th className="px-4 py-3">Bidang SPM</th>
                  <th className="px-4 py-3">Wilayah & Posyandu</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tindak Lanjut Lapangan Terakhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {reportData.detailList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Tidak ada data pengaduan pada filter periode ini.
                    </td>
                  </tr>
                ) : (
                  reportData.detailList
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3 font-mono font-bold text-blue-700">{row.nomorPengaduan}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(row.tanggal).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          <div>{row.pelapor}</div>
                          <div className="text-[10px] font-normal text-slate-500">{row.noHp || "-"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800 block">{row.bidang}</span>
                          <span className="text-[11px] text-slate-500 block truncate max-w-xs">{row.kategori}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-800 block">{row.posyandu}</span>
                          <span className="text-[11px] text-slate-500 block">
                            Desa {row.desa}, Kec. {row.kecamatan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${row.status === "SELESAI"
                                ? "bg-emerald-100 text-emerald-800"
                                : row.status === "DITINDAKLANJUTI"
                                  ? "bg-blue-100 text-blue-800"
                                  : row.status === "DITOLAK"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                          >
                            {row.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-sm truncate">
                          {row.tindakLanjutTerakhir}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* LEMBAR PENGESAHAN / TANDA TANGAN RESMI */}
        <div className="pt-8 p-6 grid grid-cols-2 text-xs sm:text-sm text-slate-800 print:text-black print:pt-6 print:p-0">
          <div></div>
          <div className="text-center space-y-16">
            <div>
              <p className="font-medium">
                {selectedDesa
                  ? (namaDesaDisplay.includes("Desa") ? namaDesaDisplay : `Desa ${namaDesaDisplay}`)
                  : selectedKecamatan
                    ? `Kecamatan ${namaKecamatanDisplay}`
                    : "Sipirok"}
                ,{" "}
                {new Date().toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="font-bold uppercase tracking-wide mt-1">
                Ketua TP. Posyandu Setempat
              </p>
            </div>
            <div>
              <p className="font-bold underline uppercase">
                ( .................................................. )
              </p>
            </div>
          </div>
        </div>

        {/* Pagination for Rekap */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500 font-medium">
            Total {reportData.detailList.length} data pengaduan terfilter
          </span>
          <CustomPagination
            currentPage={currentPage}
            totalPages={Math.ceil(reportData.detailList.length / itemsPerPage) || 1}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      </div>
      </>
      )}
    </div>
  );
}
