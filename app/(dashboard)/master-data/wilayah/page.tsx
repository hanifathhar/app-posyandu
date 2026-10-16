"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Building2,
  Plus,
  Search,
  RefreshCw,
  Home,
  CheckCircle2,
  X,
  Layers,
  FileText,
  Edit,
  Trash2,
} from "lucide-react";
import { CustomPagination } from "@/components/CustomPagination";

export default function MasterWilayahPage() {
  const [activeTab, setActiveTab] = useState<"posyandu" | "desa" | "kecamatan">("posyandu");
  const [data, setData] = useState<{
    kecamatan: any[];
    desa: any[];
    posyandu: any[];
  }>({ kecamatan: [], desa: [], posyandu: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);

  const handleOpenEdit = (item: any) => {
    setEditItem(item);
    setEditFormData({ ...item });
    setEditFeedback(null);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setEditSubmitting(true);
    setEditFeedback(null);

    try {
      const res = await fetch("/api/admin/master-data/wilayah", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: activeTab,
          id: editItem.id,
          data: editFormData,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal memperbarui data.");

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

  const handleOpenDelete = (item: any) => {
    setDeleteItem(item);
    setDeleteFeedback(null);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/admin/master-data/wilayah?entity=${activeTab}&id=${deleteItem.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal menghapus data.");

      setDeleteModalOpen(false);
      fetchData();
    } catch (err: any) {
      setDeleteFeedback(err.message);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/master-data/wilayah");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error("Gagal load wilayah:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setFormData({});
    setFeedback(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/master-data/wilayah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: activeTab,
          data: formData,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menyimpan data.");
      }

      setFeedback({ type: "success", message: json.message });
      setTimeout(() => {
        setModalOpen(false);
        fetchData();
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredList = () => {
    const q = searchQuery.toLowerCase();
    if (activeTab === "posyandu") {
      return data.posyandu.filter(
        (p) =>
          p.nama_posyandu.toLowerCase().includes(q) ||
          p.desa?.nm_desa.toLowerCase().includes(q) ||
          p.kecamatan?.nm_kecamatan.toLowerCase().includes(q)
      );
    }
    if (activeTab === "desa") {
      return data.desa.filter(
        (d) =>
          d.nm_desa.toLowerCase().includes(q) ||
          d.kd_desa.toLowerCase().includes(q) ||
          d.kecamatan?.nm_kecamatan.toLowerCase().includes(q)
      );
    }
    return data.kecamatan.filter(
      (k) =>
        k.nm_kecamatan.toLowerCase().includes(q) ||
        k.kd_kecamatan.toLowerCase().includes(q)
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <MapPin className="text-teal-600" size={28} />
            <span>Master Wilayah & Posyandu</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pengelolaan hierarki wilayah administrasi Posyandu, Desa, dan Kecamatan se-Kabupaten Tapanuli Selatan.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-sm transition hover:shadow shrink-0"
        >
          <Plus size={16} />
          <span>
            Tambah{" "}
            {activeTab === "posyandu"
              ? "Posyandu"
              : activeTab === "desa"
              ? "Desa / Kelurahan"
              : "Kecamatan"}
          </span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab("kecamatan")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeTab === "kecamatan"
              ? "bg-teal-50/80 border-teal-500 shadow-sm"
              : "bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kecamatan</span>
            <div className={`p-2 rounded-xl transition ${activeTab === "kecamatan" ? "bg-teal-600 text-white" : "bg-teal-50 text-teal-600"}`}>
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{data.kecamatan.length}</span>
            <span className="text-xs text-slate-500">Kecamatan terdata</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab("desa")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeTab === "desa"
              ? "bg-teal-50/80 border-teal-500 shadow-sm"
              : "bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Desa / Kelurahan</span>
            <div className={`p-2 rounded-xl transition ${activeTab === "desa" ? "bg-teal-600 text-white" : "bg-teal-50 text-teal-600"}`}>
              <Home size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{data.desa.length}</span>
            <span className="text-xs text-slate-500">Desa terdata</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab("posyandu")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeTab === "posyandu"
              ? "bg-teal-50/80 border-teal-500 shadow-sm"
              : "bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Posyandu SPM</span>
            <div className={`p-2 rounded-xl transition ${activeTab === "posyandu" ? "bg-teal-600 text-white" : "bg-teal-50 text-teal-600"}`}>
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{data.posyandu.length}</span>
            <span className="text-xs text-slate-500">Unit Posyandu</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Sub Header & Search */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/40">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => { setActiveTab("posyandu"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "posyandu" ? "bg-white text-teal-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Posyandu ({data.posyandu.length})
            </button>
            <button
              onClick={() => { setActiveTab("desa"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "desa" ? "bg-white text-teal-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Desa ({data.desa.length})
            </button>
            <button
              onClick={() => { setActiveTab("kecamatan"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "kecamatan" ? "bg-white text-teal-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Kecamatan ({data.kecamatan.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={`Cari nama ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition bg-white shadow-2xs"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
              <RefreshCw size={18} className="animate-spin text-teal-600" />
              <span>Memuat data wilayah...</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">No.</th>
                  {activeTab === "posyandu" && (
                    <>
                      <th className="px-5 py-3">Nama Posyandu</th>
                      <th className="px-5 py-3">Desa / Kelurahan</th>
                      <th className="px-5 py-3">Kecamatan</th>
                      <th className="px-5 py-3">Alamat</th>
                      <th className="px-5 py-3 text-center">Pengaduan Masuk</th>
                    </>
                  )}
                  {activeTab === "desa" && (
                    <>
                      <th className="px-5 py-3">Kode Desa</th>
                      <th className="px-5 py-3">Nama Desa</th>
                      <th className="px-5 py-3">Kecamatan</th>
                      <th className="px-5 py-3 text-center">Posyandu</th>
                      <th className="px-5 py-3 text-center">Pengaduan</th>
                    </>
                  )}
                  {activeTab === "kecamatan" && (
                    <>
                      <th className="px-5 py-3">Kode Kecamatan</th>
                      <th className="px-5 py-3">Nama Kecamatan</th>
                      <th className="px-5 py-3 text-center">Jumlah Desa</th>
                      <th className="px-5 py-3 text-center">Posyandu</th>
                      <th className="px-5 py-3 text-center">Pengaduan</th>
                    </>
                  )}
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredList().length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      Tidak ditemukan data {activeTab} yang sesuai pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredList()
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((item: any, idx: number) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5 text-slate-400 font-medium">{idx + 1}</td>

                      {activeTab === "posyandu" && (
                        <>
                          <td className="px-5 py-3.5 font-bold text-slate-900">{item.nama_posyandu}</td>
                          <td className="px-5 py-3.5">{item.desa?.nm_desa}</td>
                          <td className="px-5 py-3.5 text-slate-600">{item.kecamatan?.nm_kecamatan}</td>
                          <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">{item.alamat || "-"}</td>
                          <td className="px-5 py-3.5 text-center font-bold text-teal-700">
                            {item._count?.pengaduan || 0}
                          </td>
                        </>
                      )}

                      {activeTab === "desa" && (
                        <>
                          <td className="px-5 py-3.5 font-mono text-slate-600 font-semibold">{item.kd_desa}</td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">{item.nm_desa}</td>
                          <td className="px-5 py-3.5 text-slate-600">{item.kecamatan?.nm_kecamatan}</td>
                          <td className="px-5 py-3.5 text-center font-bold text-slate-800">{item._count?.posyandu || 0}</td>
                          <td className="px-5 py-3.5 text-center font-bold text-teal-700">{item._count?.pengaduan || 0}</td>
                        </>
                      )}

                      {activeTab === "kecamatan" && (
                        <>
                          <td className="px-5 py-3.5 font-mono text-slate-600 font-semibold">{item.kd_kecamatan}</td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">{item.nm_kecamatan}</td>
                          <td className="px-5 py-3.5 text-center font-bold text-slate-800">{item._count?.desa || 0}</td>
                          <td className="px-5 py-3.5 text-center font-bold text-slate-800">{item._count?.posyandu || 0}</td>
                          <td className="px-5 py-3.5 text-center font-bold text-teal-700">{item._count?.pengaduan || 0}</td>
                        </>
                      )}

                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.aktif !== false ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                        }`}>
                          {item.aktif !== false ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-teal-700 transition"
                            title="Edit Data"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(item)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition"
                            title="Hapus Data"
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
            Total {filteredList().length} data {activeTab}
          </span>
          <CustomPagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredList().length / itemsPerPage) || 1}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      </div>

      {/* Modal Add */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">
                Tambah {activeTab === "posyandu" ? "Posyandu" : activeTab === "desa" ? "Desa" : "Kecamatan"} Baru
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
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

              {activeTab === "kecamatan" && (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Kode Kecamatan (Contoh: 12.03.05):</label>
                    <input
                      type="text"
                      required
                      placeholder="12.03.05"
                      value={formData.kd_kecamatan || ""}
                      onChange={(e) => setFormData({ ...formData, kd_kecamatan: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nama Kecamatan:</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Kecamatan..."
                      value={formData.nm_kecamatan || ""}
                      onChange={(e) => setFormData({ ...formData, nm_kecamatan: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                </>
              )}

              {activeTab === "desa" && (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Pilih Kecamatan Induk:</label>
                    <select
                      required
                      value={formData.kd_kecamatan || ""}
                      onChange={(e) => setFormData({ ...formData, kd_kecamatan: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                    >
                      <option value="">-- Pilih Kecamatan --</option>
                      {data.kecamatan.map((k) => (
                        <option key={k.kd_kecamatan} value={k.kd_kecamatan}>
                          {k.nm_kecamatan} ({k.kd_kecamatan})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Kode Desa (Contoh: 12.03.01.2005):</label>
                    <input
                      type="text"
                      required
                      placeholder="12.03.01.2005"
                      value={formData.kd_desa || ""}
                      onChange={(e) => setFormData({ ...formData, kd_desa: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nama Desa / Kelurahan:</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Desa..."
                      value={formData.nm_desa || ""}
                      onChange={(e) => setFormData({ ...formData, nm_desa: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                </>
              )}

              {activeTab === "posyandu" && (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Pilih Kecamatan:</label>
                    <select
                      required
                      value={formData.kd_kecamatan || ""}
                      onChange={(e) => setFormData({ ...formData, kd_kecamatan: e.target.value, kd_desa: "" })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                    >
                      <option value="">-- Pilih Kecamatan --</option>
                      {data.kecamatan.map((k) => (
                        <option key={k.kd_kecamatan} value={k.kd_kecamatan}>
                          {k.nm_kecamatan}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Pilih Desa:</label>
                    <select
                      required
                      disabled={!formData.kd_kecamatan}
                      value={formData.kd_desa || ""}
                      onChange={(e) => setFormData({ ...formData, kd_desa: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white disabled:bg-slate-100"
                    >
                      <option value="">-- Pilih Desa --</option>
                      {data.desa
                        .filter((d) => d.kd_kecamatan === formData.kd_kecamatan)
                        .map((d) => (
                          <option key={d.kd_desa} value={d.kd_desa}>
                            {d.nm_desa}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nama Posyandu:</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Posyandu Mawar I"
                      value={formData.nama_posyandu || ""}
                      onChange={(e) => setFormData({ ...formData, nama_posyandu: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Alamat / Lokasi Balai Posyandu:</label>
                    <input
                      type="text"
                      placeholder="Contoh: Dusun II, Samping Kantor Kepala Desa"
                      value={formData.alamat || ""}
                      onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                </>
              )}

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
                  <span>Simpan</span>
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
              <h3 className="font-bold text-sm text-slate-900">
                Edit Data {activeTab === "posyandu" ? "Posyandu" : activeTab === "desa" ? "Desa" : "Kecamatan"}
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
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

              {activeTab === "kecamatan" && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nama Kecamatan:</label>
                  <input
                    type="text"
                    required
                    value={editFormData.nm_kecamatan || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, nm_kecamatan: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              )}

              {activeTab === "desa" && (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nama Desa / Kelurahan:</label>
                    <input
                      type="text"
                      required
                      value={editFormData.nm_desa || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, nm_desa: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Kecamatan:</label>
                    <select
                      required
                      value={editFormData.kd_kecamatan || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, kd_kecamatan: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                    >
                      {data.kecamatan.map((k: any) => (
                        <option key={k.kd_kecamatan} value={k.kd_kecamatan}>
                          {k.nm_kecamatan}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {activeTab === "posyandu" && (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nama Posyandu:</label>
                    <input
                      type="text"
                      required
                      value={editFormData.nama_posyandu || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, nama_posyandu: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Kecamatan:</label>
                    <select
                      required
                      value={editFormData.kd_kecamatan || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, kd_kecamatan: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                    >
                      {data.kecamatan.map((k: any) => (
                        <option key={k.kd_kecamatan} value={k.kd_kecamatan}>
                          {k.nm_kecamatan}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Desa:</label>
                    <select
                      required
                      value={editFormData.kd_desa || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, kd_desa: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                    >
                      {data.desa
                        .filter((d: any) => !editFormData.kd_kecamatan || d.kd_kecamatan === editFormData.kd_kecamatan)
                        .map((d: any) => (
                          <option key={d.kd_desa} value={d.kd_desa}>
                            {d.nm_desa}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Alamat Posyandu:</label>
                    <input
                      type="text"
                      value={editFormData.alamat || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, alamat: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                </>
              )}

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
                <h3 className="font-bold text-sm text-slate-900">
                  Konfirmasi Hapus {activeTab === "posyandu" ? "Posyandu" : activeTab === "desa" ? "Desa" : "Kecamatan"}
                </h3>
                <p className="text-slate-500 text-[11px]">Hapus data master wilayah.</p>
              </div>
            </div>

            {deleteFeedback && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {deleteFeedback}
              </div>
            )}

            <p className="text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus data{" "}
              <strong className="text-slate-900">
                {activeTab === "posyandu" ? deleteItem.nama_posyandu : activeTab === "desa" ? deleteItem.nm_desa : deleteItem.nm_kecamatan}
              </strong>?
              Jika data wilayah telah terhubung dengan data pengaduan atau posyandu lain, status akan dialihkan ke Nonaktif agar riwayat sistem tetap terjaga.
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
