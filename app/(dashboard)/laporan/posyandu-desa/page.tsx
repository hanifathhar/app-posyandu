"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Calendar,
  Filter,
  Download,
  Printer,
  RefreshCw,
  MapPin,
  BarChart3,
  Building2,
} from "lucide-react";

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

export default function LaporanPosyanduDesaPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasFiltered, setHasFiltered] = useState(false);

  // Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedKecamatan, setSelectedKecamatan] = useState("");
  const [selectedDesa, setSelectedDesa] = useState("");
  const [selectedPosyandu, setSelectedPosyandu] = useState("");

  // Referensi Wilayah
  const [kecamatanList, setKecamatanList] = useState<any[]>([]);
  const [desaList, setDesaList] = useState<any[]>([]);
  const [posyanduList, setPosyanduList] = useState<any[]>([]);

  // Data Laporan
  const [reportData, setReportData] = useState<{
    infoWilayah: {
      namaKecamatan: string;
      namaDesa: string;
      namaPosyandu: string;
    };
    detailList: DetailLaporanItem[];
  }>({
    infoWilayah: {
      namaKecamatan: "",
      namaDesa: "",
      namaPosyandu: "",
    },
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

  // 4. Load Referensi Posyandu berdasarkan Desa
  useEffect(() => {
    const targetDesa = selectedDesa || (currentUser?.role === "ADMIN_DESA" ? currentUser.desaId : "");
    if (targetDesa) {
      fetch(`/api/public/wilayah?kd_desa=${targetDesa}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setPosyanduList(d.data);
        })
        .catch((e) => console.error("Gagal load posyandu:", e));
    } else {
      setPosyanduList([]);
      setSelectedPosyandu("");
    }
  }, [selectedDesa, currentUser]);

  // 5. Fetch Laporan Data
  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (selectedKecamatan) params.set("kd_kecamatan", selectedKecamatan);
      if (selectedDesa) params.set("kd_desa", selectedDesa);
      if (selectedPosyandu) params.set("posyanduId", selectedPosyandu);

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
    setSelectedPosyandu("");
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
      detailList: [],
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper resolusi nama wilayah untuk kop
  const currentDesaObj = desaList.find((d) => d.kd_desa === selectedDesa);
  const currentKecObj = kecamatanList.find((k) => k.kd_kecamatan === selectedKecamatan);
  const currentPosObj = posyanduList.find((p) => p.id === selectedPosyandu);

  const namaDesaDisplay =
    currentPosObj?.nama_posyandu
      ? `${currentPosObj.nama_posyandu} - Desa ${currentDesaObj?.nm_desa || reportData.infoWilayah.namaDesa || currentUser?.desa?.nm_desa || ""}`
      : currentDesaObj?.nm_desa ||
      reportData.infoWilayah.namaDesa ||
      currentUser?.desa?.nm_desa ||
      (selectedDesa ? `Desa (${selectedDesa})` : "Seluruh Desa / Posyandu");

  const namaKecamatanDisplay =
    currentKecObj?.nm_kecamatan ||
    reportData.infoWilayah.namaKecamatan ||
    currentUser?.kecamatan?.nm_kecamatan ||
    (selectedKecamatan ? `Kecamatan (${selectedKecamatan})` : "Tapanuli Selatan");

  // Export CSV Format A
  const handleExportCSV = () => {
    if (!reportData.detailList || reportData.detailList.length === 0) return;

    const headers = [
      "NO",
      "TANGGAL PENGADUAN",
      "NAMA SASARAN",
      "TEMUAN",
      "BIDANG SPM",
      "TINDAKLANJUT (DESA)",
      "KETERANGAN (SELESAI/DITERUSKAN)",
    ];

    const rows = reportData.detailList.map((d, idx) => [
      `"${idx + 1}"`,
      `"${new Date(d.tanggal).toLocaleDateString("id-ID")}"`,
      `"${d.namaSasaran.replace(/"/g, '""')}"`,
      `"${d.temuan.replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${d.bidang.replace(/"/g, '""')}"`,
      `"${(d.tindakLanjutDesa || "-").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${d.keterangan}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [
        `"A. DARI TP. POSYANDU DESA KE TP. POSYANDU KECAMATAN"`,
        `"POSYANDU DESA : ${namaDesaDisplay || "-"}"`,
        `"KECAMATAN     : ${namaKecamatanDisplay || "-"}"`,
        "",
        headers.join(","),
        ...rows.map((e) => e.join(",")),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Laporan_Format_A_TP_Posyandu_${(namaDesaDisplay || "Desa").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-12 print:p-0 print:m-0 print:max-w-none print:w-full">
      {/* HEADER SECTION (Hidden when printing) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-1 print:hidden">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileSpreadsheet className="text-emerald-600" size={28} />
              <span>Laporan Posyandu Desa (Format A)</span>
            </h1>
            {currentUser && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                <MapPin size={13} className="text-emerald-600" />
                {currentUser.role === "ADMIN_DESA"
                  ? `Penugasan: Desa ${currentUser.desa?.nm_desa || currentUser.desaId || "-"}`
                  : currentUser.role === "ADMIN_KECAMATAN"
                    ? `Penugasan: Kec. ${currentUser.kecamatan?.nm_kecamatan || currentUser.kecamatanId || "-"}`
                    : `Wilayah: Kabupaten Tapanuli Selatan`}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Format laporan resmi berjenjang dari Tim Pelaksana Posyandu Desa kepada Tim Pelaksana Posyandu Kecamatan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            disabled={!hasFiltered || reportData.detailList.length === 0}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs shadow-2xs transition disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-300"
            title={!hasFiltered ? "Terapkan filter terlebih dahulu" : "Download file CSV format aktif"}
          >
            <Download size={15} className="text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={!hasFiltered || reportData.detailList.length === 0}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed hover:shadow"
            title={!hasFiltered ? "Terapkan filter terlebih dahulu" : "Cetak format cetak resmi ke printer atau PDF"}
          >
            <Printer size={15} />
            <span>Cetak Dokumen</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR (Screen only) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm print:hidden">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-bold mb-1">Dari Tanggal:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">Sampai Tanggal:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
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
                setSelectedPosyandu("");
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-medium disabled:bg-slate-100 disabled:text-slate-500"
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
              onChange={(e) => {
                setSelectedDesa(e.target.value);
                setSelectedPosyandu("");
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-medium disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="">Semua Desa</option>
              {desaList.map((d) => (
                <option key={d.kd_desa} value={d.kd_desa}>
                  {d.nm_desa}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">Posyandu (Opsional):</label>
            <select
              value={selectedPosyandu}
              disabled={!selectedDesa && posyanduList.length === 0}
              onChange={(e) => setSelectedPosyandu(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-medium disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="">Semua Posyandu</option>
              {posyanduList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama_posyandu}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-5 flex items-center justify-end space-x-2 pt-1 border-t border-slate-100">
            {(startDate || endDate || selectedPosyandu || (currentUser?.role === "SUPERADMIN" && (selectedKecamatan || selectedDesa)) || hasFiltered) && (
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
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50 text-xs"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Filter size={14} />}
              <span>Terapkan Filter</span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* TAMPILAN FORMAT A - DARI TP. POSYANDU DESA KE TP. POSYANDU KECAMATAN      */}
      {/* ========================================================================= */}
      {!hasFiltered ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <Filter size={28} />
          </div>
          <div className="max-w-md">
            <h3 className="text-base font-bold text-slate-800">Laporan Belum Ditampilkan</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Tampilan awal laporan dalam keadaan kosong. Silakan tentukan kriteria filter (Kecamatan, Desa, Posyandu, atau Periode Tanggal) pada panel di atas, kemudian klik tombol <strong className="text-emerald-700">"Terapkan Filter"</strong> untuk menampilkan data laporan resmi.
            </p>
          </div>
        </div>
      ) : (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0 print:space-y-4">
        {/* Header Format A Sesuai Template Dinas */}
        <div className="space-y-3 font-sans">
          <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide">
            A. DARI TP. POSYANDU DESA KE TP. POSYANDU KECAMATAN
          </h2>

          <div className="space-y-1.5 text-xs sm:text-sm font-semibold text-slate-800">
            <div className="grid grid-cols-12 max-w-xl">
              <span className="col-span-4 uppercase">POSYANDU DESA</span>
              <span className="col-span-1">:</span>
              <span className="col-span-7 font-bold border-b border-dotted border-slate-400 pb-0.5">
                {namaDesaDisplay}
              </span>
            </div>
            <div className="grid grid-cols-12 max-w-xl">
              <span className="col-span-4 uppercase">KECAMATAN</span>
              <span className="col-span-1">:</span>
              <span className="col-span-7 font-bold border-b border-dotted border-slate-400 pb-0.5">
                {namaKecamatanDisplay}
              </span>
            </div>
          </div>
        </div>

        {/* TABEL FORMAT A */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
              <RefreshCw size={18} className="animate-spin text-emerald-600" />
              <span>Memuat data laporan format A...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse border border-black text-xs text-black">
              <thead>
                <tr className="bg-slate-50 print:bg-transparent text-center font-black uppercase text-[11px] tracking-wide">
                  <th className="border border-black px-2.5 py-3 w-12">NO</th>
                  <th className="border border-black px-3 py-3 w-28">
                    TANGGAL
                    <br />
                    PENGADUAN
                  </th>
                  <th className="border border-black px-4 py-3 w-44">NAMA SASARAN</th>
                  <th className="border border-black px-4 py-3">TEMUAN</th>
                  <th className="border border-black px-3 py-3 w-36">BIDANG SPM</th>
                  <th className="border border-black px-4 py-3 w-52">
                    TINDAKLANJUT
                    <br />
                    (DESA)
                  </th>
                  <th className="border border-black px-3 py-3 w-36">
                    KETERANGAN
                    <br />
                    (SELESAI/DITERUSKAN)
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.detailList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-black text-center py-10 text-slate-400 italic">
                      Belum ada data pengaduan pada Posyandu/Desa ini untuk periode yang dipilih.
                    </td>
                  </tr>
                ) : (
                  reportData.detailList.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 print:hover:bg-transparent align-top">
                      <td className="border border-black px-2.5 py-2.5 text-center font-bold">
                        {idx + 1}
                      </td>
                      <td className="border border-black px-3 py-2.5 text-center whitespace-nowrap">
                        {new Date(row.tanggal).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="border border-black px-4 py-2.5">
                        <span className="font-bold block uppercase">{row.namaSasaran}</span>
                        {row.nik && (
                          <span className="text-[10px] text-slate-500 print:text-black block">
                            NIK: {row.nik}
                          </span>
                        )}
                      </td>
                      <td className="border border-black px-4 py-2.5 whitespace-pre-wrap leading-relaxed">
                        {row.temuan}
                      </td>
                      <td className="border border-black px-3 py-2.5 font-semibold text-center sm:text-left">
                        {row.bidang}
                      </td>
                      <td className="border border-black px-4 py-2.5 whitespace-pre-wrap leading-relaxed">
                        {row.tindakLanjutDesa}
                      </td>
                      <td className="border border-black px-3 py-2.5 text-center font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] print:p-0 print:border-none ${row.keterangan === "SELESAI"
                              ? "bg-emerald-100 text-emerald-800 print:bg-transparent print:text-black"
                              : row.keterangan === "DITERUSKAN"
                                ? "bg-blue-100 text-blue-800 print:bg-transparent print:text-black"
                                : "bg-slate-100 text-slate-800 print:bg-transparent print:text-black"
                            }`}
                        >
                          {row.keterangan}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* LEMBAR PENGESAHAN / TANDA TANGAN RESMI */}
        <div className="pt-8 grid grid-cols-2 text-xs sm:text-sm text-slate-800 print:text-black print:pt-6">
          <div className="text-center space-y-16">
            <div>
              <p className="font-medium">Mengetahui,</p>
              <p className="font-bold uppercase tracking-wide">
                Ketua TP. Posyandu / Bidan Desa
              </p>
            </div>
            <div>
              <p className="font-bold underline uppercase">( .................................................. )</p>
              <p className="text-[11px] text-slate-500 print:text-black mt-0.5">NIP / Penanggung Jawab</p>
            </div>
          </div>

          <div className="text-center space-y-16">
            <div>
              <p className="font-medium">
                {namaDesaDisplay.includes("Desa") ? namaDesaDisplay : `Tapanuli Selatan`},{" "}
                {new Date().toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="font-bold uppercase tracking-wide">
                Petugas Verifikator / Admin Desa
              </p>
            </div>
            <div>
              <p className="font-bold underline uppercase">
                ( {currentUser?.nama || ".................................................."} )
              </p>
              <p className="text-[11px] text-slate-500 print:text-black mt-0.5">
                Admin TP. Posyandu Desa
              </p>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
