"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  ShieldCheck,
  Building2,
  Home,
  CheckCircle2,
  X,
  Key,
  ToggleLeft,
  ToggleRight,
  Shield,
  UserCheck,
  Edit,
  Trash2,
} from "lucide-react";
import { CustomPagination } from "@/components/CustomPagination";

interface PenggunaSPM {
  id: string;
  nama: string;
  username: string;
  role: string;
  aktif: boolean;
  kecamatanId: string | null;
  desaId: string | null;
  kecamatan?: { nm_kecamatan: string };
  desa?: { nm_desa: string };
  _count?: {
    verifikasiPengaduan: number;
    tindakLanjut: number;
  };
  createdAt: string;
}

export default function ManajemenPenggunaPage() {
  const [users, setUsers] = useState<PenggunaSPM[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Referensi Wilayah untuk Assignment Form
  const [kecamatanList, setKecamatanList] = useState<any[]>([]);
  const [desaList, setDesaList] = useState<any[]>([]);

  // Modal Create
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    username: "",
    password: "",
    role: "ADMIN_DESA",
    kecamatanId: "",
    desaId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PenggunaSPM | null>(null);
  const [editForm, setEditForm] = useState({
    nama: "",
    username: "",
    password: "",
    role: "ADMIN_DESA",
    kecamatanId: "",
    desaId: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<PenggunaSPM | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);

  const handleOpenEditModal = (u: PenggunaSPM) => {
    setEditItem(u);
    setEditForm({
      nama: u.nama,
      username: u.username,
      password: "",
      role: u.role,
      kecamatanId: u.kecamatanId || "",
      desaId: u.desaId || "",
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
      const res = await fetch("/api/admin/master-data/pengguna", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editItem.id,
          ...editForm,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal memperbarui akun pengguna.");

      setEditFeedback({ type: "success", message: json.message });
      setTimeout(() => {
        setEditModalOpen(false);
        fetchUsers();
      }, 1000);
    } catch (err: any) {
      setEditFeedback({ type: "error", message: err.message });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (u: PenggunaSPM) => {
    setDeleteItem(u);
    setDeleteFeedback(null);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/admin/master-data/pengguna?id=${deleteItem.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal menghapus pengguna.");

      setDeleteModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setDeleteFeedback(err.message);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/master-data/pengguna");
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      }
    } catch (e) {
      console.error("Gagal load users:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Load Wilayah for assignment
    fetch("/api/admin/master-data/wilayah?type=kecamatan")
      .then((r) => r.json())
      .then((d) => d.success && setKecamatanList(d.data));
    fetch("/api/admin/master-data/wilayah?type=desa")
      .then((r) => r.json())
      .then((d) => d.success && setDesaList(d.data));
  }, []);

  const handleToggleAktif = async (id: string, currentAktif: boolean) => {
    try {
      const res = await fetch("/api/admin/master-data/pengguna", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, aktif: !currentAktif }),
      });
      const json = await res.json();
      if (json.success) {
        fetchUsers();
      }
    } catch (e) {
      console.error("Gagal ubah status pengguna:", e);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/master-data/pengguna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal membuat pengguna.");
      }

      setFeedback({ type: "success", message: json.message });
      setTimeout(() => {
        setModalOpen(false);
        setFormData({
          nama: "",
          username: "",
          password: "",
          role: "ADMIN_DESA",
          kecamatanId: "",
          desaId: "",
        });
        fetchUsers();
      }, 1000);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">SUPERADMIN</span>;
      case "ADMIN_KABUPATEN":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">ADMIN KABUPATEN</span>;
      case "ADMIN_KECAMATAN":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">ADMIN KECAMATAN</span>;
      case "ADMIN_DESA":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">ADMIN DESA / KADER</span>;
      case "VERIFIKATOR":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">VERIFIKATOR</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-800 border border-slate-200">{role}</span>;
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      u.nama.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.kecamatan?.nm_kecamatan || "").toLowerCase().includes(q) ||
      (u.desa?.nm_desa || "").toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchQuery && matchRole;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="text-blue-600" size={28} />
            <span>Manajemen Pengguna & Otoritas Wilayah</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola akun petugas, verifikator, serta admin berjenjang dari tingkat Desa, Kecamatan, hingga Kabupaten.
          </p>
        </div>

        <button
          onClick={() => {
            setFeedback(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition hover:shadow shrink-0"
        >
          <Plus size={16} />
          <span>Tambah Akun Pengguna</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/40">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-2xs"
            >
              <option value="">Semua Peran / Role</option>
              <option value="SUPERADMIN">SUPERADMIN</option>
              <option value="ADMIN_KABUPATEN">ADMIN KABUPATEN</option>
              <option value="ADMIN_KECAMATAN">ADMIN KECAMATAN</option>
              <option value="ADMIN_DESA">ADMIN DESA / KADER</option>
              <option value="VERIFIKATOR">VERIFIKATOR</option>
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama, username, wilayah..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white shadow-2xs"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
              <RefreshCw size={18} className="animate-spin text-blue-600" />
              <span>Memuat daftar akun pengguna...</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/90 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Pengguna</th>
                  <th className="px-5 py-3.5">Peran (Role)</th>
                  <th className="px-5 py-3.5">Otoritas Wilayah Penugasan</th>
                  <th className="px-5 py-3.5 text-center">Aktivitas Verifikasi</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Tidak ditemukan pengguna yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-800 flex items-center justify-center font-bold text-sm shrink-0">
                            {user.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{user.nama}</span>
                            <span className="text-[11px] font-mono text-slate-500">@{user.username}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">{getRoleBadge(user.role)}</td>

                      <td className="px-5 py-3.5">
                        {user.role === "SUPERADMIN" || user.role === "ADMIN_KABUPATEN" ? (
                          <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-blue-600" />
                            Seluruh Kab. Tapanuli Selatan
                          </span>
                        ) : user.role === "ADMIN_KECAMATAN" ? (
                          <span className="text-slate-700 font-medium flex items-center gap-1.5">
                            <Building2 size={14} className="text-indigo-600" />
                            Kec. {user.kecamatan?.nm_kecamatan || user.kecamatanId}
                          </span>
                        ) : user.role === "ADMIN_DESA" ? (
                          <span className="text-slate-700 font-medium flex items-center gap-1.5">
                            <Home size={14} className="text-emerald-600" />
                            Desa {user.desa?.nm_desa || user.desaId}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span className="font-bold text-slate-800">
                          {user._count?.verifikasiPengaduan || 0} verifikasi
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleAktif(user.id, user.aktif)}
                          className="inline-flex items-center space-x-1"
                          title="Klik untuk ubah status aktif/nonaktif"
                        >
                          {user.aktif ? (
                            <ToggleRight size={22} className="text-blue-600" />
                          ) : (
                            <ToggleLeft size={22} className="text-slate-300" />
                          )}
                          <span className={`text-[10px] font-bold ${user.aktif ? "text-blue-700" : "text-slate-400"}`}>
                            {user.aktif ? "Aktif" : "Nonaktif"}
                          </span>
                        </button>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-700 transition"
                            title="Edit Pengguna"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(user)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition"
                            title="Hapus Pengguna"
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
            Total {filteredUsers.length} pengguna terdaftar
          </span>
          <CustomPagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredUsers.length / itemsPerPage) || 1}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      </div>

      {/* Modal Add User */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Tambah Akun Pengguna Baru</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-3.5 text-xs">
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
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap & Gelar *:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bidan Siti Rahmah, S.Tr.Keb"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Username Login *:</label>
                  <input
                    type="text"
                    required
                    placeholder="kader_desa"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Password Default *:</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Peran / Hak Akses (Role) *:</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => {
                    const r = e.target.value;
                    setFormData({
                      ...formData,
                      role: r,
                      kecamatanId: r === "SUPERADMIN" || r === "ADMIN_KABUPATEN" ? "" : formData.kecamatanId,
                      desaId: r === "ADMIN_DESA" ? formData.desaId : "",
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
                >
                  <option value="ADMIN_DESA">ADMIN DESA / KADER POSYANDU</option>
                  <option value="ADMIN_KECAMATAN">ADMIN KECAMATAN</option>
                  <option value="ADMIN_KABUPATEN">ADMIN KABUPATEN (DINAS)</option>
                  <option value="SUPERADMIN">SUPERADMIN (TEKNIS SISTEM)</option>
                </select>
              </div>

              {/* Otoritas Wilayah jika Kecamatan atau Desa */}
              {(formData.role === "ADMIN_KECAMATAN" || formData.role === "ADMIN_DESA") && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pilih Kecamatan Penugasan *:</label>
                  <select
                    required
                    value={formData.kecamatanId}
                    onChange={(e) => setFormData({ ...formData, kecamatanId: e.target.value, desaId: "" })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="">-- Pilih Kecamatan --</option>
                    {kecamatanList.map((k) => (
                      <option key={k.kd_kecamatan} value={k.kd_kecamatan}>
                        {k.nm_kecamatan}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.role === "ADMIN_DESA" && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pilih Desa Penugasan *:</label>
                  <select
                    required
                    disabled={!formData.kecamatanId}
                    value={formData.desaId}
                    onChange={(e) => setFormData({ ...formData, desaId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white disabled:bg-slate-100"
                  >
                    <option value="">-- Pilih Desa --</option>
                    {desaList
                      .filter((d) => !formData.kecamatanId || d.kd_kecamatan === formData.kecamatanId)
                      .map((d) => (
                        <option key={d.kd_desa} value={d.kd_desa}>
                          {d.nm_desa}
                        </option>
                      ))}
                  </select>
                </div>
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {submitting && <RefreshCw size={14} className="animate-spin" />}
                  <span>Buat Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Edit User */}
      {editModalOpen && editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Edit Akun Pengguna</h3>
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
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap & Gelar *:</label>
                <input
                  type="text"
                  required
                  value={editForm.nama}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Username Login *:</label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value.toLowerCase().trim() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Reset Password (Opsional):</label>
                  <input
                    type="password"
                    placeholder="Kosongkan jika tak diubah"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Peran / Hak Akses (Role) *:</label>
                <select
                  required
                  value={editForm.role}
                  onChange={(e) => {
                    const r = e.target.value;
                    setEditForm({
                      ...editForm,
                      role: r,
                      kecamatanId: r === "SUPERADMIN" || r === "ADMIN_KABUPATEN" ? "" : editForm.kecamatanId,
                      desaId: r === "ADMIN_DESA" ? editForm.desaId : "",
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
                >
                  <option value="ADMIN_DESA">ADMIN DESA / KADER POSYANDU</option>
                  <option value="ADMIN_KECAMATAN">ADMIN KECAMATAN</option>
                  <option value="ADMIN_KABUPATEN">ADMIN KABUPATEN (DINAS)</option>
                  <option value="SUPERADMIN">SUPERADMIN (TEKNIS SISTEM)</option>
                </select>
              </div>

              {(editForm.role === "ADMIN_KECAMATAN" || editForm.role === "ADMIN_DESA") && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pilih Kecamatan Penugasan *:</label>
                  <select
                    required
                    value={editForm.kecamatanId}
                    onChange={(e) => setEditForm({ ...editForm, kecamatanId: e.target.value, desaId: "" })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="">-- Pilih Kecamatan --</option>
                    {kecamatanList.map((k) => (
                      <option key={k.kd_kecamatan} value={k.kd_kecamatan}>
                        {k.nm_kecamatan}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editForm.role === "ADMIN_DESA" && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pilih Desa Penugasan *:</label>
                  <select
                    required
                    disabled={!editForm.kecamatanId}
                    value={editForm.desaId}
                    onChange={(e) => setEditForm({ ...editForm, desaId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white disabled:bg-slate-100"
                  >
                    <option value="">-- Pilih Desa --</option>
                    {desaList
                      .filter((d) => !editForm.kecamatanId || d.kd_kecamatan === editForm.kecamatanId)
                      .map((d) => (
                        <option key={d.kd_desa} value={d.kd_desa}>
                          {d.nm_desa}
                        </option>
                      ))}
                  </select>
                </div>
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

      {/* Modal Delete User */}
      {deleteModalOpen && deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Konfirmasi Hapus Akun</h3>
                <p className="text-slate-500 text-[11px]">Hapus akses pengguna sistem.</p>
              </div>
            </div>

            {deleteFeedback && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {deleteFeedback}
              </div>
            )}

            <p className="text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun pengguna <strong className="text-slate-900">{deleteItem.nama}</strong> (@{deleteItem.username})?
              Jika pengguna telah memiliki riwayat verifikasi, akun akan diarsipkan secara otomatis agar histori data tetap aman.
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
                <span>Ya, Hapus Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
