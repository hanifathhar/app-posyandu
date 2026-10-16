"use client";

import { Menu, LogOut, UserCircle, ShieldCheck, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Header({
  setSidebarOpen,
}: {
  setSidebarOpen?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Gagal ambil data user:", error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const formatRoleName = (role?: string) => {
    if (!role) return "Petugas";
    return role.replace(/_/g, " ");
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs print:hidden">
      <div className="px-6 py-3.5 flex items-center justify-between">
        {/* Kiri */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            onClick={() => {
              if (setSidebarOpen) setSidebarOpen(true);
            }}
          >
            <Menu size={22} />
          </button>


        </div>

        {/* Kanan */}
        <div className="relative">
          <button
            className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-50 transition"
            onClick={() => setOpen(!open)}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-tight">
                {user?.nama || "Petugas SPM"}
              </p>
              <p className="text-[11px] text-teal-700 font-semibold uppercase tracking-wider">
                {formatRoleName(user?.role)}
              </p>
            </div>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {user?.nama?.charAt(0).toUpperCase() || "P"}
            </div>
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-2.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Header Dropdown */}
              <div className="bg-gradient-to-r from-teal-700 to-emerald-600 p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white text-teal-700 flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                    {user?.nama?.charAt(0).toUpperCase() || "P"}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-sm leading-tight truncate">
                      {user?.nama || "Petugas SPM"}
                    </h3>
                    <p className="text-xs text-teal-100 mt-0.5 truncate uppercase font-medium">
                      {formatRoleName(user?.role)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Options */}
              <div className="p-2 space-y-1 text-xs font-semibold text-slate-700">
                <button
                  onClick={() => {
                    setOpen(false);
                    router.push("/profile");
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 transition text-left"
                >
                  <UserCircle size={18} className="text-slate-400" />
                  <span>Profil Akun</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-rose-50 text-rose-600 transition text-left"
                >
                  <LogOut size={16} />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}