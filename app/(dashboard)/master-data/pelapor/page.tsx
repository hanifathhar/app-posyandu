"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  X,
  PhoneCall,
  MapPin,
  FileText,
  UserCheck,
} from "lucide-react";
import { CustomPagination } from "@/components/CustomPagination";

interface PelaporItem {
  id: string;
  nama: string;
  nik?: string;
  noHp?: string;
  alamat: string;
  kd_kecamatan?: string;
  kd_desa?: string;
  kecamatan?: { nm_kecamatan: string };
  desa?: { nm_desa: string };
  _count?: { pengaduan: number };
  createdAt: string;
}

export default function MasterPelaporPage() {
  const [data, setData] = useState<PelaporItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Wilayah references
  const [kecamatanList, setKecamatanList] = useState<any[]>([]);
  const [desaList, setDesaList] = useState<any[]>([]);

  // Modal Add
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    nik: "",
    noHp: "",
    alamat: "",
    kd_kecamatan: "",
    kd_desa: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal Edit
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PelaporItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    nama: "",
    nik: "",
    noHp: "",
    alamat: "",
    kd_kecamatan: "",
    kd_desa: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal Delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<PelaporItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      params.set("page", currentPage.toString());
      params.set("limit", "10");

      const res = await fetch(`/api/admin/master-data/pelapor?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotalCount(json.pagination.total);
      }
    } catch (e) {
      console.error("Gagal load pelapor:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetch("/api/admin/master-data/wilayah?type=kecamatan")
      .then((r) => r.json())
      .then((d) => d.success && setKecamatanList(d.data));
    fetch("/api/admin/master-data/wilayah?type=desa")
      .then((r) => r.json())
      .then((d) => d.success && setDesaList(d.data));
  }, []);

  const handleOpenAdd = () => {
    setFormData({ nama: "", nik: "", noHp: "", alamat: "", kd_kecamatan: "", kd_desa: "" });
    setFeedback(null);
    setModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/master-data/pelapor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal menyimpan data pelapor.");

      setFeedback({ type: "success", message: json.message });
      setTimeout(() => {
        setModalOpen(false);
        fetchData();
      }, 1000);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (item: PelaporItem) => {
    setEditItem(item);
    setEditFormData({
      nama: item.nama || "",
      nik: item.nik || "",
      noHp: item.noHp || "",
      alamat: item.alamat || "",
      kd_kecamatan: item.kd_kecamatan || "",
      kd_desa: item.kd_desa || "",
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
      const res = await fetch("/api/admin/master-data/pelapor", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editItem.id,
          ...editFormData,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal memperbarui data pelapor.");

      setEditFeedback({ type: "success", message: json.message });
      setTimeout(() => {
        setEditModalOpen(false);
        fetchData();
      }, 1000);
    } catch (err: any) {
      setEditFeedback({ type: "error", message: err.message });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleOpenDelete = (item: PelaporItem) => {
    setDeleteItem(item);
    setDeleteFeedback(null);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/admin/master-data/pelapor?id=${deleteItem.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal menghapus pelapor.");

      setDeleteModalOpen(false);
      fetchData();
    } catch (err: any) {
      setDeleteFeedback(err.message);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="text-teal-600" size={28} />
            <span>Master Data Pelapor Masyarakat</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data warga dan masyarakat pelapor program Standar Pelayanan Minimal (SPM) Posyandu.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-sm transition hover:shadow shrink-0"
        >
          <Plus size={16} />
          <span>Tambah Pelapor Baru</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Sub Header & Search */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/40">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Users size={16} className="text-teal-600" />
            <span>Daftar Pelapor Terdaftar</span>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama, NIK, no HP, alamat..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition bg-white shadow-2xs"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
              <RefreshCw size={18} className="animate-spin text-teal-600" />
              <span>Memuat data pelapor...</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/90 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">No.</th>
                  <th className="px-5 py-3.5">Nama Pelapor</th>
                  <th className="px-5 py-3">NIK</th>
                  <th className="px-5 py-3">Kontak</th>
                  <th className="px-5 py-3">Wilayah Domisili</th>
                  <th className="px-5 py-3">Alamat Lengkap</th>
                  <th className="px-5 py-3 text-center">Pengaduan</th>
                  <th className="px-5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      Tidak ditemukan data pelapor yang sesuai pencarian.
                    </td>
                  </tr>
                ) : (
                  data.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5 text-slate-400 font-medium">
                        {(currentPage - 1) * 10 + idx + 1}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">{item.nama}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">{item.nik || "-"}</td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {item.noHp ? (
                          <span className="flex items-center space-x-1">
                            <PhoneCall size={12} className="text-teal-600" />
                            <span>{item.noHp}</span>
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {item.desa?.nm_desa ? (
                          <div>
                            <span className="font-semibold block">{item.desa.nm_desa}</span>
                            <span className="text-[10px] text-slate-500">
                              Kec. {item.kecamatan?.nm_kecamatan || "-"}
                            </span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">{item.alamat}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          {item._count?.pengaduan || 0} Laporan
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-teal-700 transition"
                            title="Edit Pelapor"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(item)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition"
                            title="Hapus Pelapor"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Total {totalCount} pelapor terdaftar
          </span>
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      </div>

      {/* Modal Add */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Tambah Data Pelapor Baru</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-3.5 text-xs">
              {feedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold ${
                    feedback.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap Pelapor *:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NIK (16 Digit):</label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="1203..."
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">No. WhatsApp / HP:</label>
                  <input
                    type="text"
                    placeholder="0812..."
                    value={formData.noHp}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kecamatan:</label>
                  <select
                    value={formData.kd_kecamatan}
                    onChange={(e) => setFormData({ ...formData, kd_kecamatan: e.target.value, kd_desa: "" })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                  >
                    <option value="">-- Pilih --</option>
                    {kecamatanList.map((k) => (
                      <option key={k.kd_kecamatan} value={k.kd_kecamatan}>
                        {k.nm_kecamatan}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Desa:</label>
                  <select
                    value={formData.kd_desa}
                    disabled={!formData.kd_kecamatan}
                    onChange={(e) => setFormData({ ...formData, kd_desa: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white disabled:bg-slate-100"
                  >
                    <option value="">-- Pilih --</option>
                    {desaList
                      .filter((d) => !formData.kd_kecamatan || d.kd_kecamatan === formData.kd_kecamatan)
                      .map((d) => (
                        <option key={d.kd_desa} value={d.kd_desa}>
                          {d.nm_desa}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Alamat Lengkap *:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Dusun / RT / RW / Nama Jalan..."
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
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
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {submitting && <RefreshCw size={14} className="animate-spin" />}
                  <span>Simpan Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {editModalOpen && editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Edit Data Pelapor</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-3.5 text-xs">
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

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap Pelapor *:</label>
                <input
                  type="text"
                  required
                  value={editFormData.nama}
                  onChange={(e) => setEditFormData({ ...editFormData, nama: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NIK:</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={editFormData.nik}
                    onChange={(e) => setEditFormData({ ...editFormData, nik: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">No. WhatsApp / HP:</label>
                  <input
                    type="text"
                    value={editFormData.noHp}
                    onChange={(e) => setEditFormData({ ...editFormData, noHp: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kecamatan:</label>
                  <select
                    value={editFormData.kd_kecamatan}
                    onChange={(e) => setEditFormData({ ...editFormData, kd_kecamatan: e.target.value, kd_desa: "" })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                  >
                    <option value="">-- Pilih --</option>
                    {kecamatanList.map((k) => (
                      <option key={k.kd_kecamatan} value={k.kd_kecamatan}>
                        {k.nm_kecamatan}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Desa:</label>
                  <select
                    value={editFormData.kd_desa}
                    disabled={!editFormData.kd_kecamatan}
                    onChange={(e) => setEditFormData({ ...editFormData, kd_desa: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white disabled:bg-slate-100"
                  >
                    <option value="">-- Pilih --</option>
                    {desaList
                      .filter((d) => !editFormData.kd_kecamatan || d.kd_kecamatan === editFormData.kd_kecamatan)
                      .map((d) => (
                        <option key={d.kd_desa} value={d.kd_desa}>
                          {d.nm_desa}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Alamat Lengkap *:</label>
                <textarea
                  rows={2}
                  required
                  value={editFormData.alamat}
                  onChange={(e) => setEditFormData({ ...editFormData, alamat: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
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

      {/* Modal Delete */}
      {deleteModalOpen && deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Konfirmasi Hapus Data Pelapor</h3>
                <p className="text-slate-500 text-[11px]">Hapus identitas pelapor.</p>
              </div>
            </div>

            {deleteFeedback && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {deleteFeedback}
              </div>
            )}

            <p className="text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus data pelapor <strong className="text-slate-900">{deleteItem.nama}</strong>?
              Data pelapor hanya dapat dihapus jika belum memiliki riwayat pengaduan aktif.
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
