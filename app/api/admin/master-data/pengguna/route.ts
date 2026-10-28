import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { RolePengguna } from "@prisma/client";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-super-aman";

async function getAuthUser(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  let token = match ? match[1] : request.headers.get("cookie")?.split("token=")[1]?.split(";")[0];

  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded?.id) return null;

    return await prisma.pengguna.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        role: true,
        kecamatanId: true,
        desaId: true,
        dinasId: true,
        nama: true,
        kecamatan: { select: { kd_kecamatan: true, nm_kecamatan: true } },
        desa: { select: { kd_desa: true, nm_desa: true } },
        dinas: { select: { id: true, kode: true, nama: true } },
      },
    });
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const currentUser = await getAuthUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles: RolePengguna[] = [
      RolePengguna.SUPERADMIN,
      RolePengguna.ADMIN_KABUPATEN,
      RolePengguna.ADMIN_DINAS,
      RolePengguna.ADMIN_KECAMATAN,
      RolePengguna.ADMIN_DESA,
    ];

    if (!allowedRoles.includes(currentUser.role as RolePengguna)) {
      return NextResponse.json({ success: false, message: "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filterKecamatan = searchParams.get("kecamatanId");
    const filterDinas = searchParams.get("dinasId");

    const where: any = {};

    // Filter per wilayah kewenangan
    if (currentUser.role === RolePengguna.ADMIN_DINAS) {
      // Admin Dinas hanya melihat pengguna di dinasnya
      where.dinasId = currentUser.dinasId;
    } else if (currentUser.role === RolePengguna.ADMIN_KECAMATAN) {
      // Admin Kecamatan hanya melihat pengguna di wilayah kecamatannya
      where.OR = [
        { kecamatanId: currentUser.kecamatanId },
        { desa: { kd_kecamatan: currentUser.kecamatanId } },
      ];
    } else if (currentUser.role === RolePengguna.ADMIN_DESA) {
      // Admin Desa hanya melihat pengguna di desanya
      where.desaId = currentUser.desaId;
    } else {
      // Superadmin / Admin Kabupaten
      if (filterKecamatan) {
        where.OR = [
          { kecamatanId: filterKecamatan },
          { desa: { kd_kecamatan: filterKecamatan } },
        ];
      }
      if (filterDinas) {
        where.dinasId = filterDinas;
      }
    }

    const penggunaList = await prisma.pengguna.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nama: true,
        username: true,
        role: true,
        aktif: true,
        kecamatanId: true,
        desaId: true,
        dinasId: true,
        dinas: {
          select: { id: true, kode: true, nama: true },
        },
        kecamatan: {
          select: { nm_kecamatan: true },
        },
        desa: {
          select: { nm_desa: true, kd_kecamatan: true },
        },
        _count: {
          select: {
            verifikasiPengaduan: true,
            tindakLanjut: true,
          },
        },
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: penggunaList });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat daftar pengguna: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getAuthUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { nama, username, password, role } = body;
    let { kecamatanId, desaId, dinasId } = body;

    // 1. Admin Desa & Admin Dinas: tidak dapat menambah user sama sekali
    if (currentUser.role === RolePengguna.ADMIN_DESA || currentUser.role === RolePengguna.ADMIN_DINAS) {
      return NextResponse.json(
        { success: false, message: "Peran Anda tidak memiliki izin untuk menambah akun pengguna." },
        { status: 403 }
      );
    }

    // 2. Admin Kecamatan: hanya dapat menambahkan user Admin Desa di wilayah kecamatannya
    if (currentUser.role === RolePengguna.ADMIN_KECAMATAN) {
      if (role !== "ADMIN_DESA") {
        return NextResponse.json(
          { success: false, message: "Admin Kecamatan hanya dapat menambahkan akun untuk Admin Desa." },
          { status: 403 }
        );
      }

      if (!currentUser.kecamatanId) {
        return NextResponse.json(
          { success: false, message: "Akun Admin Kecamatan Anda tidak terdaftar pada wilayah kecamatan tertentu." },
          { status: 400 }
        );
      }

      // Kunci wilayah kecamatan ke wilayah Admin Kecamatan yang sedang login
      kecamatanId = currentUser.kecamatanId;

      if (!desaId) {
        return NextResponse.json(
          { success: false, message: "Desa penugasan wajib dipilih untuk Admin Desa." },
          { status: 400 }
        );
      }

      const validDesa = await prisma.desa.findFirst({
        where: {
          kd_desa: desaId,
          kd_kecamatan: currentUser.kecamatanId,
        },
      });

      if (!validDesa) {
        return NextResponse.json(
          { success: false, message: "Desa yang dipilih tidak valid atau berada di luar wilayah kecamatan Anda." },
          { status: 400 }
        );
      }
    }

    // 3. Admin Kabupaten: dapat menambah user Admin Dinas, Admin Kecamatan, dan Admin Desa
    if (currentUser.role === RolePengguna.ADMIN_KABUPATEN) {
      const allowedRoles = ["ADMIN_DINAS", "ADMIN_KECAMATAN", "ADMIN_DESA"];
      if (!allowedRoles.includes(role)) {
        return NextResponse.json(
          {
            success: false,
            message: "Admin Kabupaten hanya dapat menambah user Admin Dinas, Admin Kecamatan, dan Admin Desa.",
          },
          { status: 403 }
        );
      }

      if (role === "ADMIN_DINAS" && !dinasId) {
        return NextResponse.json(
          { success: false, message: "Dinas penugasan wajib dipilih untuk Admin Dinas." },
          { status: 400 }
        );
      }

      if (role === "ADMIN_KECAMATAN" && !kecamatanId) {
        return NextResponse.json(
          { success: false, message: "Kecamatan penugasan wajib dipilih untuk Admin Kecamatan." },
          { status: 400 }
        );
      }

      if (role === "ADMIN_DESA" && (!kecamatanId || !desaId)) {
        return NextResponse.json(
          { success: false, message: "Kecamatan dan Desa penugasan wajib dipilih untuk Admin Desa." },
          { status: 400 }
        );
      }
    }

    // 4. Superadmin: sudah sesuai (dapat menambah semua role)
    if (currentUser.role !== RolePengguna.SUPERADMIN &&
        currentUser.role !== RolePengguna.ADMIN_KABUPATEN &&
        currentUser.role !== RolePengguna.ADMIN_KECAMATAN) {
      return NextResponse.json(
        { success: false, message: "Anda tidak memiliki hak akses untuk menambah pengguna." },
        { status: 403 }
      );
    }

    if (!nama || !username || !password || !role) {
      return NextResponse.json(
        { success: false, message: "Nama, username, password, dan role wajib diisi." },
        { status: 400 }
      );
    }

    // Validasi penugasan Admin Dinas
    if (role === "ADMIN_DINAS") {
      if (!dinasId) {
        return NextResponse.json(
          { success: false, message: "Dinas penugasan wajib dipilih untuk Admin Dinas." },
          { status: 400 }
        );
      }
      const validDinas = await prisma.dinas.findUnique({ where: { id: dinasId } });
      if (!validDinas) {
        return NextResponse.json(
          { success: false, message: "Dinas yang dipilih tidak ditemukan." },
          { status: 400 }
        );
      }
    }

    const normalizedUsername = username.toLowerCase().trim();

    const existing = await prisma.pengguna.findUnique({
      where: { username: normalizedUsername },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Username sudah digunakan, silakan pilih username lain." },
        { status: 400 }
      );
    }

    // Pastikan jika role Admin Desa, kecamatanId terisi sesuai desa jika belum ada
    if (role === "ADMIN_DESA" && desaId && !kecamatanId) {
      const desaData = await prisma.desa.findUnique({
        where: { kd_desa: desaId },
        select: { kd_kecamatan: true },
      });
      if (desaData) {
        kecamatanId = desaData.kd_kecamatan;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const created = await prisma.pengguna.create({
      data: {
        nama: nama.trim(),
        username: normalizedUsername,
        password: hashedPassword,
        role: role as RolePengguna,
        dinasId: role === "ADMIN_DINAS" ? dinasId : null,
        kecamatanId: (role === "SUPERADMIN" || role === "ADMIN_KABUPATEN" || role === "ADMIN_DINAS") ? null : (kecamatanId || null),
        desaId: role === "ADMIN_DESA" ? (desaId || null) : null,
        aktif: true,
      },
      select: {
        id: true,
        nama: true,
        username: true,
        role: true,
        aktif: true,
        kecamatanId: true,
        desaId: true,
        dinasId: true,
        dinas: { select: { id: true, kode: true, nama: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Akun ${created.nama} (${created.role}) berhasil dibuat.`,
      data: created,
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat akun: " + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await getAuthUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.role === RolePengguna.ADMIN_DESA || currentUser.role === RolePengguna.ADMIN_DINAS) {
      return NextResponse.json(
        { success: false, message: "Peran Anda tidak memiliki izin untuk mengubah akun pengguna." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, nama, username, role, password, aktif, resetPassword } = body;
    let { kecamatanId, desaId, dinasId } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID pengguna wajib diisi." }, { status: 400 });
    }

    const targetUser = await prisma.pengguna.findUnique({
      where: { id },
      include: { desa: true, dinas: true },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, message: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    // Validasi wewenang update:
    // Admin Kecamatan hanya boleh mengedit Admin Desa di wilayahnya
    if (currentUser.role === RolePengguna.ADMIN_KECAMATAN) {
      const targetKecamatan = targetUser.kecamatanId || targetUser.desa?.kd_kecamatan;
      if (targetUser.role !== RolePengguna.ADMIN_DESA || targetKecamatan !== currentUser.kecamatanId) {
        return NextResponse.json(
          { success: false, message: "Admin Kecamatan hanya dapat mengedit akun Admin Desa di wilayah kecamatan Anda." },
          { status: 403 }
        );
      }
      // Tidak boleh ubah role selain ADMIN_DESA
      if (role && role !== "ADMIN_DESA") {
        return NextResponse.json(
          { success: false, message: "Admin Kecamatan tidak dapat mengubah peran selain Admin Desa." },
          { status: 403 }
        );
      }
      // Kunci kecamatan tetap di kecamatan Admin Kecamatan
      kecamatanId = currentUser.kecamatanId;
      if (desaId) {
        const validDesa = await prisma.desa.findFirst({
          where: { kd_desa: desaId, kd_kecamatan: currentUser.kecamatanId },
        });
        if (!validDesa) {
          return NextResponse.json(
            { success: false, message: "Desa berada di luar wilayah kecamatan Anda." },
            { status: 400 }
          );
        }
      }
    }

    // Admin Kabupaten hanya boleh mengedit Admin Dinas, Admin Kecamatan & Admin Desa
    if (currentUser.role === RolePengguna.ADMIN_KABUPATEN) {
      const allowedRoles = ["ADMIN_DINAS", "ADMIN_KECAMATAN", "ADMIN_DESA"];
      if (!allowedRoles.includes(targetUser.role)) {
        return NextResponse.json(
          { success: false, message: "Admin Kabupaten hanya dapat mengelola akun Admin Dinas, Admin Kecamatan, dan Admin Desa." },
          { status: 403 }
        );
      }
      if (role && !allowedRoles.includes(role)) {
        return NextResponse.json(
          { success: false, message: "Admin Kabupaten tidak dapat mengubah peran menjadi tingkatan ini." },
          { status: 403 }
        );
      }
    }

    // Check username uniqueness
    if (username) {
      const normalizedUsername = username.toLowerCase().trim();
      const existing = await prisma.pengguna.findFirst({
        where: {
          username: normalizedUsername,
          NOT: { id },
        },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: "Username sudah digunakan oleh akun lain." },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (nama) updateData.nama = nama.trim();
    if (username) updateData.username = username.toLowerCase().trim();
    if (role) updateData.role = role as RolePengguna;

    const finalRole = role || targetUser.role;

    if (finalRole === "ADMIN_DINAS") {
      const effectiveDinasId = dinasId !== undefined ? dinasId : targetUser.dinasId;
      if (!effectiveDinasId) {
        return NextResponse.json(
          { success: false, message: "Dinas penugasan wajib dipilih untuk Admin Dinas." },
          { status: 400 }
        );
      }
      const validDinas = await prisma.dinas.findUnique({ where: { id: effectiveDinasId } });
      if (!validDinas) {
        return NextResponse.json(
          { success: false, message: "Dinas yang dipilih tidak ditemukan." },
          { status: 400 }
        );
      }
      updateData.dinasId = effectiveDinasId;
      updateData.kecamatanId = null;
      updateData.desaId = null;
    } else {
      if (role && role !== "ADMIN_DINAS") {
        updateData.dinasId = null;
      }
      if (kecamatanId !== undefined) updateData.kecamatanId = kecamatanId || null;
      if (desaId !== undefined) updateData.desaId = desaId || null;
    }

    if (typeof aktif === "boolean") updateData.aktif = aktif;

    const newPwd = password || resetPassword;
    if (newPwd) {
      updateData.password = await bcrypt.hash(newPwd, 10);
    }

    const updated = await prisma.pengguna.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nama: true,
        username: true,
        role: true,
        aktif: true,
        kecamatanId: true,
        desaId: true,
        dinasId: true,
        dinas: { select: { id: true, kode: true, nama: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Akun ${updated.nama} berhasil diperbarui.`,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui pengguna: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await getAuthUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.role === RolePengguna.ADMIN_DESA || currentUser.role === RolePengguna.ADMIN_DINAS) {
      return NextResponse.json(
        { success: false, message: "Peran Anda tidak memiliki izin untuk menghapus akun pengguna." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID pengguna wajib diberikan." }, { status: 400 });
    }

    const user = await prisma.pengguna.findUnique({
      where: { id },
      include: {
        desa: true,
        _count: {
          select: {
            verifikasiPengaduan: true,
            tindakLanjut: true,
            pengaduanDibuat: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    // Validasi wewenang delete:
    if (currentUser.role === RolePengguna.ADMIN_KECAMATAN) {
      const targetKecamatan = user.kecamatanId || user.desa?.kd_kecamatan;
      if (user.role !== RolePengguna.ADMIN_DESA || targetKecamatan !== currentUser.kecamatanId) {
        return NextResponse.json(
          { success: false, message: "Admin Kecamatan hanya dapat menghapus akun Admin Desa di wilayahnya." },
          { status: 403 }
        );
      }
    }

    if (currentUser.role === RolePengguna.ADMIN_KABUPATEN) {
      const allowedRoles = ["ADMIN_DINAS", "ADMIN_KECAMATAN", "ADMIN_DESA"];
      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { success: false, message: "Admin Kabupaten hanya dapat menghapus akun Admin Dinas, Admin Kecamatan, dan Admin Desa." },
          { status: 403 }
        );
      }
    }

    // If user has audit history, deactivate instead to preserve audit logs
    const hasHistory =
      user._count.verifikasiPengaduan > 0 ||
      user._count.tindakLanjut > 0 ||
      user._count.pengaduanDibuat > 0;

    if (hasHistory) {
      await prisma.pengguna.update({
        where: { id },
        data: { aktif: false },
      });
      return NextResponse.json({
        success: true,
        message: `Pengguna ${user.nama} memiliki riwayat verifikasi/tindak lanjut, status akun telah dinonaktifkan (arsip).`,
      });
    }

    await prisma.pengguna.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Akun pengguna ${user.nama} berhasil dihapus permanen.`,
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus pengguna: " + error.message },
      { status: 500 }
    );
  }
}
