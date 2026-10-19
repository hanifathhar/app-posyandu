"use client";

import React, { useState, useEffect } from "react";
import {
  Heart,
  GraduationCap,
  Activity,
  Wrench,
  Home,
  Shield,
  Plus,
  RefreshCw,
  Tag,
  CheckCircle2,
  X,
  FileText,
  ToggleLeft,
  ToggleRight,
  Edit,
  Trash2,
  Search,
} from "lucide-react";

export default function MasterBidangSPMPage() {
  const [bidangList, setBidangList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchFilter, setSearchFilter] = useState("");

  // Modal Add Jenis Masalah
  const [modalOpen, setModalOpen] = useState(false);
  const [targetBidangId, setTargetBidangId] = useState("");
  const [namaJenis, setNamaJenis] = useState("");
  const [deskripsiJenis, setDeskripsiJenis] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal Edit Jenis Masalah
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editNama, setEditNama] = useState("");
  const [editDeskripsi, setEditDeskripsi] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);

  const handleOpenEditModal = (jenis: any) => {
    setEditItem(jenis);
    setEditNama(jenis.nama);
    setEditDeskripsi(jenis.deskripsi || "");
    setEditFeedback(null);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem || !editNama.trim()) return;

    setEditSubmitting(true);
    setEditFeedback(null);
    try {
      const res = await fetch("/api/admin/master-data/bidang-spm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editItem.id,
          nama: editNama,
          deskripsi: editDeskripsi,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal memperbarui kategori.");

      setEditFeedback({ type: "success", message: json.message });
      setTimeout(() => {
        setEditModalOpen(false);
        fetchBidang();
      }, 1000);
    } catch (err: any) {
      setEditFeedback({ type: "error", message: err.message });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (jenis: any) => {
    setDeleteItem(jenis);
    setDeleteFeedback(null);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/admin/master-data/bidang-spm?id=${deleteItem.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal menghapus kategori.");

      setDeleteModalOpen(false);
      fetchBidang();
    } catch (err: any) {
      setDeleteFeedback(err.message);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const fetchBidang = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/master-data/bidang-spm");
      const json = await res.json();
      if (json.success) {
        setBidangList(json.data);
      }
    } catch (e) {
      console.error("Gagal load bidang SPM:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBidang();
  }, []);

  const handleOpenAddModal = (bidangId?: string) => {
    setTargetBidangId(bidangId || (bidangList[0]?.id || ""));
    setNamaJenis("");
    setDeskripsiJenis("");
    setFeedback(null);
    setModalOpen(true);
  };

  const handleToggleAktif = async (id: string, currentAktif: boolean) => {
    try {
      const res = await fetch("/api/admin/master-data/bidang-spm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, aktif: !currentAktif }),
      });
      const json = await res.json();
      if (json.success) {
        fetchBidang();
      }
    } catch (e) {
      console.error("Gagal toggle status:", e);
    }
  };

  const handleCreateJenis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBidangId || !namaJenis.trim()) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/master-data/bidang-spm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bidangId: targetBidangId,
          nama: namaJenis,
          deskripsi: deskripsiJenis,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menambahkan kategori masalah SPM.");
      }

      setFeedback({ type: "success", message: json.message });
      setTimeout(() => {
        setModalOpen(false);
        fetchBidang();
      }, 1000);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const getBidangIcon = (kode: string) => {
    switch (kode) {
      case "SOSIAL":
        return <Heart className="text-rose-600" size={24} />;
      case "PENDIDIKAN":
        return <GraduationCap className="text-blue-600" size={24} />;
      case "KESEHATAN":
        return <Activity className="text-emerald-600" size={24} />;
      case "PEKERJAAN_UMUM":
        return <Wrench className="text-amber-600" size={24} />;
      case "PERUMAHAN_RAKYAT":
        return <Home className="text-indigo-600" size={24} />;
      case "TRANTIBUM_LINMAS":
        return <Shield className="text-purple-600" size={24} />;
      default:
        return <Tag className="text-blue-600" size={24} />;
    }
  };

  const getBidangTheme = (kode: string) => {
    switch (kode) {
      case "SOSIAL":
        return "border-rose-200 bg-rose-50/20 text-rose-800";
      case "PENDIDIKAN":
        return "border-blue-200 bg-blue-50/20 text-blue-800";
      case "KESEHATAN":
        return "border-emerald-200 bg-emerald-50/20 text-emerald-800";
      case "PEKERJAAN_UMUM":
        return "border-amber-200 bg-amber-50/20 text-amber-800";
      case "PERUMAHAN_RAKYAT":
        return "border-indigo-200 bg-indigo-50/20 text-indigo-800";
      case "TRANTIBUM_LINMAS":
        return "border-purple-200 bg-purple-50/20 text-purple-800";
      default:
        return "border-slate-200 bg-slate-50/20 text-slate-800";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Tag className="text-blue-600" size={28} />
            <span>Master 6 Bidang SPM & Kategori Masalah</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Konfigurasi 6 Standar Pelayanan Minimal (SPM) dan opsi kategori masalah masyarakat pada formulir pengaduan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari kategori masalah..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white shadow-2xs"
            />
          </div>

          <button
            onClick={() => handleOpenAddModal()}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition hover:shadow shrink-0"
          >
            <Plus size={16} />
            <span>Tambah Kategori Masalah</span>
          </button>
        </div>
      </div>

      {/* Grid 6 Bidang SPM */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs flex items-center justify-center space-x-2 bg-white rounded-2xl border border-slate-200">
          <RefreshCw size={20} className="animate-spin text-blue-600" />
          <span>Memuat 6 Bidang SPM...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bidangList.map((bidang) => {
            const displayCategories = (bidang.jenisPengaduan || []).filter((j: any) =>
              searchFilter ? j.nama.toLowerCase().includes(searchFilter.toLowerCase()) : true
            );

            return (
              <div
                key={bidang.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between overflow-hidden hover:shadow-md transition hover:border-slate-300"
              >
                <div>
                  {/* Header Card Bidang */}
                  <div className={`p-5 border-b flex items-start justify-between ${getBidangTheme(bidang.kode)}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-xs flex items-center justify-center shrink-0">
                        {getBidangIcon(bidang.kode)}
                      </div>
                      <div>
                        <span className="text-[10px] font-black tracking-wider uppercase opacity-75">
                          Bidang SPM
                        </span>
                        <h3 className="font-black text-base leading-tight text-slate-900">{bidang.nm_bidang}</h3>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 shadow-2xs border border-black/5">
                      {bidang._count?.pengaduan || 0} Laporan
                    </span>
                  </div>

                  {/* Deskripsi */}
                  <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 text-[11px] text-slate-500">
                    {bidang.deskripsi || "Pelayanan dasar standar minimal masyarakat."}
                  </div>

                  {/* List Kategori / Jenis Pengaduan */}
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                      <span>
                        Kategori Masalah ({displayCategories.length}
                        {searchFilter && displayCategories.length !== (bidang.jenisPengaduan?.length || 0) && (
                          <span className="text-blue-600 font-normal"> dari {bidang.jenisPengaduan?.length}</span>
                        )}
                        ):
                      </span>
                      <button
                        onClick={() => handleOpenAddModal(bidang.id)}
                        className="text-blue-600 hover:text-blue-700 text-[11px] font-bold flex items-center space-x-1"
                      >
                        <Plus size={13} />
                        <span>Tambah</span>
                      </button>
                    </div>

                    {displayCategories.length === 0 ? (
                      <p className="text-slate-400 text-xs italic py-2">
                        {searchFilter ? "Tidak ada kategori yang cocok." : "Belum ada kategori masalah."}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {displayCategories.map((jenis: any) => (
                          <div
                            key={jenis.id}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition text-xs"
                          >
                            <div className="pr-2">
                              <span className={`font-semibold ${jenis.aktif ? "text-slate-800" : "text-slate-400 line-through"}`}>
                                {jenis.nama}
                              </span>
                              {jenis._count?.pengaduan > 0 && (
                                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold">
                                  {jenis._count.pengaduan}x dipilih
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                onClick={() => handleToggleAktif(jenis.id, jenis.aktif)}
                                title={jenis.aktif ? "Klik untuk nonaktifkan" : "Klik untuk aktifkan"}
                                className="p-1 hover:opacity-80 transition"
                              >
                                {jenis.aktif ? (
                                  <ToggleRight size={20} className="text-blue-600" />
                                ) : (
                                  <ToggleLeft size={20} className="text-slate-300" />
                                )}
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(jenis)}
                                className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-blue-700 transition"
                                title="Edit Kategori"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteModal(jenis)}
                                className="p-1 rounded-md border border-slate-200 bg-white hover:bg-rose-50 text-slate-500 hover:rose-600 transition"
                                title="Hapus Kategori"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Kode: <strong className="font-mono">{bidang.kode}</strong></span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Status Aktif
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add Jenis */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Tambah Kategori Masalah SPM</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateJenis} className="p-6 space-y-4 text-xs">
              {feedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold ${feedback.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}
                >
                  {feedback.message}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Bidang SPM Terkait:</label>
                <select
                  required
                  value={targetBidangId}
                  onChange={(e) => setTargetBidangId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
                >
                  {bidangList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nm_bidang} ({b.kode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Kategori Masalah *:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Balita Gizi Buruk / Stunting, RTLH, dll."
                  value={namaJenis}
                  onChange={(e) => setNamaJenis(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Deskripsi / Penjelasan Singkat:</label>
                <textarea
                  rows={2}
                  placeholder="Kriteria atau catatan kategori..."
                  value={deskripsiJenis}
                  onChange={(e) => setDeskripsiJenis(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {submitting && <RefreshCw size={14} className="animate-spin" />}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Edit Jenis */}
      {editModalOpen && editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Edit Kategori Masalah SPM</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              {editFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold ${editFeedback.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}
                >
                  {editFeedback.message}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Kategori Masalah *:</label>
                <input
                  type="text"
                  required
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Deskripsi / Penjelasan Singkat:</label>
                <textarea
                  rows={3}
                  value={editDeskripsi}
                  onChange={(e) => setEditDeskripsi(e.target.value)}
                  placeholder="Kriteria atau catatan kategori..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {editSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete Jenis */}
      {deleteModalOpen && deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Konfirmasi Hapus Kategori</h3>
                <p className="text-slate-500 text-[11px]">Hapus kategori masalah SPM.</p>
              </div>
            </div>

            {deleteFeedback && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {deleteFeedback}
              </div>
            )}

            <p className="text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus kategori <strong className="text-slate-900">{deleteItem.nama}</strong>?
              Jika kategori telah digunakan dalam pengaduan masyarakat, sistem akan menonaktifkannya (arsip) agar tidak merusak data laporan.
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
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
