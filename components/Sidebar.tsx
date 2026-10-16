"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  HeartHandshake,
  Database,
  Users,
  BarChart3,
  LogOut,
  X,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Building2,
  MapPin,
  FolderOpen,
} from "lucide-react";
import Image from "next/image";
import logoPic from "@/public/favicon.png";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  active?: string;
}

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [role, setRole] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [openMenu, setOpenMenu] = useState<string | null>("Pengaduan SPM");

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        if (data.user) {
          const userRole = data.user.role || "PETUGAS";
          setRole(userRole);
          setUserInfo(data.user);

          if (userRole === "ADMIN_DESA") {
            setOpenMenu("Verifikasi Desa");
          } else if (userRole === "ADMIN_KECAMATAN") {
            setOpenMenu("Verifikasi Kecamatan");
          } else {
            setOpenMenu("Pengaduan SPM");
          }
        }
      } catch (error) {
        console.error("Gagal ambil role:", error);
      }
    };

    fetchRole();
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/laporan")) {
      setOpenMenu("Laporan SPM");
    } else if (pathname.startsWith("/master-data")) {
      setOpenMenu("Master Data");
    }
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    router.push("/login");
  };

  const allMenus = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      href: "/dashboard",
      roles: ["SUPERADMIN", "ADMIN_KABUPATEN", "ADMIN_KECAMATAN", "ADMIN_DESA", "OPERATOR", "PETUGAS", "VERIFIKATOR"],
    },
    // Menu Khusus Admin Desa
    {
      title: "Verifikasi Desa",
      icon: <FileText size={18} />,
      href: "/pengaduan-admin?status=MENUNGGU_VERIFIKASI_DESA",
      roles: ["ADMIN_DESA"],
      children: [
        { label: "Menunggu Verifikasi", href: "/pengaduan-admin?status=MENUNGGU_VERIFIKASI_DESA" },
        { label: "Semua Pengaduan Desa", href: "/pengaduan-admin" },
        { label: "Ditindaklanjuti & Selesai", href: "/pengaduan-admin?status=DITINDAKLANJUTI" },
      ],
    },
    // Menu Khusus Admin Kecamatan
    {
      title: "Verifikasi Kecamatan",
      icon: <FileText size={18} />,
      href: "/pengaduan-admin?status=MENUNGGU_VERIFIKASI_KECAMATAN",
      roles: ["ADMIN_KECAMATAN"],
      children: [
        { label: "Menunggu Verifikasi", href: "/pengaduan-admin?status=MENUNGGU_VERIFIKASI_KECAMATAN" },
        { label: "Semua Pengaduan Kecamatan", href: "/pengaduan-admin" },
        { label: "Ditindaklanjuti & Selesai", href: "/pengaduan-admin?status=DITINDAKLANJUTI" },
      ],
    },
    // Menu Khusus Admin Kabupaten & Superadmin
    {
      title: "Pengaduan SPM",
      icon: <FileText size={18} />,
      href: "/pengaduan-admin",
      roles: ["SUPERADMIN", "ADMIN_KABUPATEN", "OPERATOR", "PETUGAS", "VERIFIKATOR"],
      children: [
        { label: "Semua Pengaduan", href: "/pengaduan-admin" },
        { label: "Verifikasi Desa", href: "/pengaduan-admin?status=MENUNGGU_VERIFIKASI_DESA" },
        { label: "Verifikasi Kecamatan", href: "/pengaduan-admin?status=MENUNGGU_VERIFIKASI_KECAMATAN" },
        { label: "Verifikasi Kabupaten", href: "/pengaduan-admin?status=MENUNGGU_VERIFIKASI_KABUPATEN" },
        { label: "Ditindaklanjuti & Selesai", href: "/pengaduan-admin?status=DITINDAKLANJUTI" },
      ],
    },
    {
      title: "Tindak Lanjut & Intervensi",
      icon: <HeartHandshake size={18} />,
      href: "/pengaduan-admin?status=DITINDAKLANJUTI",
      roles: ["SUPERADMIN", "ADMIN_KABUPATEN", "ADMIN_KECAMATAN", "ADMIN_DESA", "PETUGAS"],
    },
    // Master Data hanya untuk SUPERADMIN dan ADMIN_KABUPATEN
    {
      title: "Master Data",
      icon: <Database size={18} />,
      href: "/master-data/wilayah",
      roles: ["SUPERADMIN", "ADMIN_KABUPATEN"],
      children: [
        { label: "Wilayah & Posyandu", href: "/master-data/wilayah" },
        { label: "6 Bidang & Jenis SPM", href: "/master-data/bidang-spm" },
        { label: "Data Pelapor", href: "/master-data/pelapor" },
      ],
    },
    // Manajemen Pengguna hanya untuk SUPERADMIN dan ADMIN_KABUPATEN
    {
      title: "Manajemen Pengguna",
      icon: <Users size={18} />,
      href: "/master-data/pengguna",
      roles: ["SUPERADMIN", "ADMIN_KABUPATEN"],
    },
    {
      title: "Laporan SPM",
      icon: <BarChart3 size={18} />,
      href: "/laporan/posyandu-desa",
      roles: ["SUPERADMIN", "ADMIN_KABUPATEN", "ADMIN_KECAMATAN", "ADMIN_DESA"],
      children: [
        { label: "Laporan Posyandu Desa", href: "/laporan/posyandu-desa" },
        { label: "Laporan Posyandu Kecamatan", href: "/laporan/posyandu-kecamatan" },
        { label: "Laporan Posyandu Kabupaten", href: "/laporan/posyandu-kabupaten" },
        { label: "Rekapitulasi Capaian 6 SPM", href: "/laporan/rekap-spm" },
      ],
    },
  ];

  const menuItems = role
    ? allMenus.filter((item) =>
      item.roles.some((r) => r.toUpperCase() === role.toUpperCase())
    )
    : allMenus;

  const isLinkActive = (href?: string) => {
    if (!href) return false;
    const [targetPath, targetQuery] = href.split("?");
    if (pathname !== targetPath) return false;
    if (!targetQuery) {
      return !searchParams.get("status");
    }
    const params = new URLSearchParams(targetQuery);
    if (params.has("status") && searchParams.get("status") !== params.get("status")) {
      return false;
    }
    return true;
  };

  return (
    <>
      {/* Overlay Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-72
          bg-white
          border-r border-slate-200
          shadow-xl md:shadow-none
          flex flex-col
          justify-between
          transform transition-all duration-300
          print:hidden
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Header Sidebar */}
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-md overflow-hidden p-1 shrink-0">
                  <Image
                    src={logoPic}
                    alt="Logo SPM Posyandu"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>

                <div>
                  <h2 className="font-bold text-base leading-tight">SPM Terpadu</h2>
                  <p className="text-[11px] text-teal-100">Berbasis Posyandu & Wilayah</p>
                </div>
              </div>

              <button
                className="md:hidden text-white/80 hover:text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Scope Wilayah Badge */}
            {userInfo && (
              <div className="mt-3.5 pt-2.5 border-t border-white/20 text-[11px] flex flex-col space-y-0.5 text-teal-100">
                <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider truncate">
                  <ShieldCheck size={14} className="shrink-0 text-teal-300" />
                  <span>{userInfo.role?.replace(/_/g, " ")}</span>
                </div>
                {userInfo.desa?.nm_desa ? (
                  <span className="text-[10px] text-teal-200 font-medium truncate">
                    Desa {userInfo.desa.nm_desa}
                  </span>
                ) : userInfo.kecamatan?.nm_kecamatan ? (
                  <span className="text-[10px] text-teal-200 font-medium truncate">
                    Kec. {userInfo.kecamatan.nm_kecamatan}
                  </span>
                ) : (
                  <span className="text-[10px] text-teal-200 font-medium truncate">
                    Wilayah Kab. Tapanuli Selatan
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Nav Menu */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const isSubActive =
                item.children &&
                item.children.some((child) => isLinkActive(child.href));
              const isActive = item.href ? isLinkActive(item.href) : isSubActive;

              return (
                <div key={item.title}>
                  {item.children ? (
                    <div>
                      <div
                        className={`
                          flex items-center justify-between
                          w-full
                          rounded-xl
                          text-xs font-semibold
                          transition-all
                          ${isSubActive || openMenu === item.title
                            ? "bg-teal-50/70 text-teal-900 font-bold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }
                        `}
                      >
                        <Link
                          href={item.href || (item.children ? item.children[0].href : "#")}
                          onClick={() => {
                            setOpenMenu(item.title);
                            setSidebarOpen(false);
                          }}
                          className="flex items-center gap-3 flex-1 py-2.5 px-3.5"
                        >
                          <span className={isSubActive ? "text-teal-600" : "text-slate-400"}>
                            {item.icon}
                          </span>
                          <span>{item.title}</span>
                        </Link>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenu(openMenu === item.title ? null : item.title);
                          }}
                          className="p-2.5 text-slate-400 hover:text-slate-700 transition"
                          title={openMenu === item.title ? "Tutup Submenu" : "Buka Submenu"}
                        >
                          {openMenu === item.title ? (
                            <ChevronDown size={14} className="text-teal-700" />
                          ) : (
                            <ChevronRight size={14} className="text-slate-400" />
                          )}
                        </button>
                      </div>

                      {openMenu === item.title && (
                        <div className="ml-5 pl-3 mt-1 space-y-1 border-l-2 border-teal-100">
                          {item.children.map((sub) => {
                            const isCurrent = isLinkActive(sub.href);
                            return (
                              <Link
                                key={sub.label}
                                href={sub.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                                  block px-3 py-2
                                  rounded-lg text-xs font-medium
                                  transition-all
                                  ${isCurrent
                                    ? "bg-teal-600 text-white font-semibold shadow-xs"
                                    : "text-slate-600 hover:text-teal-700 hover:bg-slate-50"
                                  }
                                `}
                              >
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href || "#"}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3
                        px-3.5 py-2.5
                        rounded-xl
                        text-xs font-semibold
                        transition-all
                        ${isActive
                          ? "bg-teal-600 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }
                      `}
                    >
                      <span className={isActive ? "text-white" : "text-slate-400"}>
                        {item.icon}
                      </span>
                      <span>{item.title}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50">
          <Link
            href="/pengaduan"
            target="_blank"
            className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition border border-teal-200"
          >
            <div className="flex items-center gap-2">
              <ExternalLink size={14} />
              <span>Portal Pengaduan Publik</span>
            </div>
            <span className="text-[10px] bg-teal-200/60 px-1.5 py-0.5 rounded text-teal-800">Buka</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut size={16} />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>
    </>
  );
}