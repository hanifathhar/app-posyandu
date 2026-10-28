"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle2,
  X,
  Phone,
  FileText,
  Users,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  Filter,
} from "lucide-react";

interface DinasItem {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
  kontak: string | null;
  aktif: boolean;
  createdAt: string;
  _count?: {
    pengguna: number;
    pengaduan: number;
  };
}

export default function MasterDataDinasPage() {
  const [dinasList, setDinasList] = useState<DinasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AKTIF" | "NONAKTIF">("ALL");

  // Modal Tambah State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addKode, setAddKode] = useState("");
  const [addNama, setAddNama] = useState("");
  const [addDeskripsi, setAddDeskripsi] = useState("");
  const [addKontak, setAddKontak] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addFeedback, setAddFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<DinasItem | null>(null);
  const [editKode, setEditKode] = useState("");
  const [editNama, setEditNama] = useState("");
  const [editDeskripsi, setEditDeskripsi] = useState("");
  const [editKontak, setEditKontak] = useState("");
  const [editAktif, setEditAktif] = useState(true);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<DinasItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);

  const fetchDinas = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/master-data/dinas");
      const json = await res.json();
      if (json.success) {
        setDinasList(json.data);
      }
    } catch (err) {
      console.error("Gagal memuat master dinas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDinas();
  }, []);

  const handleOpenAdd = () => {
    setAddKode("");
    setAddNama("");
    setAddDeskripsi("");
    setAddKontak("");
    setAddFeedback(null);
    setIsAddOpen(true);
  };

  const handleCreateDinas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addKode.trim() || !addNama.trim()) {
      setAddFeedback({ type: "error", message: "Kode dan Nama Dinas wajib diisi." });
      return;
    }

    setAddSubmitting(true);
    setAddFeedback(null);

    try {
      const res = await fetch("/api/admin/master-data/dinas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode: addKode,
          nama: addNama,
          deskripsi: addDeskripsi,
          kontak: addKontak,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menambahkan dinas.");
      }

      setAddFeedback({ type: "success", message: json.message });
      setTimeout(() => {
        setIsAddOpen(false);
        fetchDinas();
      }, 800);
    } catch (err: any) {
      setAddFeedback({ type: "error", message: err.message || "Terjadi kesalahan." });
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleOpenEdit = (item: DinasItem) => {
    setEditItem(item);
    setEditKode(item.kode);
    setEditNama(item.nama);
    setEditDeskripsi(item.deskripsi || "");
    setEditKontak(item.kontak || "");
    setEditAktif(item.aktif);
    setEditFeedback(null);
    setIsEditOpen(true);
  };

  const handleUpdateDinas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem || !editKode.trim() || !editNama.trim()) return;

    setEditSubmitting(true);
    setEditFeedback(null);

    try {
      const res = await fetch("/api/admin/master-data/dinas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editItem.id,
          kode: editKode,
          nama: editNama,
          deskripsi: editDeskripsi,
          kontak: editKontak,
          aktif: editAktif,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memperbarui dinas.");
      }

      setEditFeedback({ type: "success", message: json.message });
      setTimeout(() => {
        setIsEditOpen(false);
        fetchDinas();
      }, 800);
    } catch (err: any) {
      setEditFeedback({ type: "error", message: err.message || "Terjadi kesalahan." });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleAktif = async (item: DinasItem) => {
    try {
      const res = await fetch("/api/admin/master-data/dinas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          aktif: !item.aktif,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchDinas();
      }
    } catch (err) {
      console.error("Gagal toggle status:", err);
    }
  };

  const handleOpenDelete = (item: DinasItem) => {
    setDeleteItem(item);
    setDeleteFeedback(null);
    setIsDeleteOpen(true);
  };

  const handleDeleteDinas = async () => {
    if (!deleteItem) return;
    setDeleteSubmitting(true);
    setDeleteFeedback(null);

    try {
      const res = await fetch(`/api/admin/master-data/dinas?id=${deleteItem.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menghapus dinas.");
      }
      setIsDeleteOpen(false);
      fetchDinas();
    } catch (err: any) {
      setDeleteFeedback(err.message || "Gagal menghapus dinas.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const filteredDinas = dinasList.filter((item) => {
    const matchSearch =
      item.kode.toLowerCase().includes(search.toLowerCase()) ||
      item.nama.toLowerCase().includes(search.toLowerCase()) ||
      (item.deskripsi && item.deskripsi.toLowerCase().includes(search.toLowerCase()));

    const matchStatus =
      statusFilter === "ALL" ? true : statusFilter === "AKTIF" ? item.aktif : !item.aktif;

    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-sky-200 border border-white/20">
              <Building2 size={14} />
              <span>Master Organisasi Perangkat Daerah</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Master Data Dinas / OPD Pengampu SPM
            </h1>
            <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
              Daftar dinas teknis penanggung jawab tindak lanjut dan intervensi pengaduan SPM di Kabupaten Tapanuli Selatan.
              Admin Kabupaten menunjuk dinas pengampu secara dinamis untuk menindaklanjuti berkas pengaduan yang disetujui.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDinas}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition shadow-sm active:scale-95"
              title="Segarkan Data"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              <span>Segarkan</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold transition shadow-lg hover:shadow-xl active:scale-95"
            >
              <Plus size={16} />
              <span>Tambah Dinas Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode, nama, atau deskripsi dinas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500 font-medium shrink-0">Status:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === "ALL" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua ({dinasList.length})
            </button>
            <button
              onClick={() => setStatusFilter("AKTIF")}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === "AKTIF" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Aktif ({dinasList.filter((d) => d.aktif).length})
            </button>
            <button
              onClick={() => setStatusFilter("NONAKTIF")}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === "NONAKTIF" ? "bg-white text-rose-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Nonaktif ({dinasList.filter((d) => !d.aktif).length})
            </button>
          </div>
        </div>
      </div>

      {/* List Card Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
          <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Memuat master data dinas...</p>
        </div>
      ) : filteredDinas.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
          <Building2 size={36} className="text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">Tidak ada dinas ditemukan</h3>
          <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter status.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDinas.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl p-5 border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                item.aktif ? "border-slate-200/80 shadow-xs" : "border-slate-200 bg-slate-50/50 opacity-80"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <Building2 size={13} />
                    <span>{item.kode}</span>
                  </div>

                  <button
                    onClick={() => handleToggleAktif(item)}
                    className="inline-flex items-center gap-1 text-xs font-medium"
                    title={item.aktif ? "Klik untuk nonaktifkan" : "Klik untuk aktifkan"}
                  >
                    {item.aktif ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <ToggleRight size={16} /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        <ToggleLeft size={16} /> Nonaktif
                      </span>
                    )}
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                    {item.nama}
                  </h3>
                  {item.deskripsi && (
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed">
                      {item.deskripsi}
                    </p>
                  )}
                </div>

                {item.kontak && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span className="font-medium truncate">{item.kontak}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="inline-flex items-center gap-1" title="Jumlah Petugas Admin Dinas">
                    <Users size={13} className="text-indigo-500" />
                    <span>{item._count?.pengguna || 0} akun</span>
                  </span>
                  <span className="inline-flex items-center gap-1" title="Jumlah Pengaduan Ditangani">
                    <FileText size={13} className="text-blue-500" />
                    <span>{item._count?.pengaduan || 0} pengaduan</span>
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="Ubah Data Dinas"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => handleOpenDelete(item)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Hapus Dinas"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Dinas */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tambah Dinas Baru</h3>
                  <p className="text-xs text-slate-500">Master data OPD penanggung jawab SPM</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDinas} className="mt-4 space-y-4">
              {addFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    addFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>{addFeedback.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Dinas (Singkatan) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: DINKES, DINSOS, DPUPR, DISDIK"
                  value={addKode}
                  onChange={(e) => setAddKode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 uppercase font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Dinas / OPD <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dinas Kesehatan"
                  value={addNama}
                  onChange={(e) => setAddNama(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Tugas Pengampu
                </label>
                <textarea
                  rows={3}
                  placeholder="Deskripsi kewenangan pemenuhan SPM dinas ini..."
                  value={addDeskripsi}
                  onChange={(e) => setAddDeskripsi(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kontak / Hotline Kedinasan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: (0634) 123456 / 0812-XXXX-XXXX"
                  value={addKontak}
                  onChange={(e) => setAddKontak(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition shadow-sm"
                >
                  {addSubmitting ? "Menyimpan..." : "Simpan Dinas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Dinas */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Edit size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Ubah Data Dinas</h3>
                  <p className="text-xs text-slate-500">Edit informasi dan status keaktifan</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateDinas} className="mt-4 space-y-4">
              {editFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    editFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>{editFeedback.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Dinas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editKode}
                  onChange={(e) => setEditKode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 uppercase font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Dinas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Tugas Pengampu
                </label>
                <textarea
                  rows={3}
                  value={editDeskripsi}
                  onChange={(e) => setEditDeskripsi(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kontak / Hotline Kedinasan
                </label>
                <input
                  type="text"
                  value={editKontak}
                  onChange={(e) => setEditKontak(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editAktifCheckbox"
                  checked={editAktif}
                  onChange={(e) => setEditAktif(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="editAktifCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Dinas aktif menerima penunjukan pengaduan dari Admin Kabupaten
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition shadow-sm"
                >
                  {editSubmitting ? "Menyimpan..." : "Perbarui Dinas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus Dinas */}
      {isDeleteOpen && deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Dinas</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus dinas <strong className="text-slate-900">{deleteItem.nama}</strong> ({deleteItem.kode})?
            </p>

            {deleteFeedback && (
              <div className="mt-3 p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium">
                {deleteFeedback}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteDinas}
                disabled={deleteSubmitting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition shadow-sm"
              >
                {deleteSubmitting ? "Menghapus..." : "Ya, Hapus Dinas"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
