import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { RolePengguna } from "@prisma/client";

export async function GET() {
  try {
    const penggunaList = await prisma.pengguna.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nama: true,
        username: true,
        role: true,
        aktif: true,
        kecamatanId: true,
        desaId: true,
        kecamatan: {
          select: { nm_kecamatan: true },
        },
        desa: {
          select: { nm_desa: true },
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
    const body = await request.json();
    const { nama, username, password, role, kecamatanId, desaId } = body;

    if (!nama || !username || !password || !role) {
      return NextResponse.json(
        { success: false, message: "Nama, username, password, dan role wajib diisi." },
        { status: 400 }
      );
    }

    const existing = await prisma.pengguna.findUnique({
      where: { username },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Username sudah digunakan, silakan pilih username lain." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const created = await prisma.pengguna.create({
      data: {
        nama,
        username,
        password: hashedPassword,
        role: role as RolePengguna,
        kecamatanId: kecamatanId || null,
        desaId: desaId || null,
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
    const body = await request.json();
    const { id, nama, username, role, kecamatanId, desaId, password, aktif, resetPassword } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID pengguna wajib diisi." }, { status: 400 });
    }

    // Check if username is changed and already taken
    if (username) {
      const existing = await prisma.pengguna.findFirst({
        where: {
          username: username.toLowerCase().trim(),
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
    if (nama) updateData.nama = nama;
    if (username) updateData.username = username.toLowerCase().trim();
    if (role) updateData.role = role as RolePengguna;
    if (kecamatanId !== undefined) updateData.kecamatanId = kecamatanId || null;
    if (desaId !== undefined) updateData.desaId = desaId || null;
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID pengguna wajib diberikan." }, { status: 400 });
    }

    const user = await prisma.pengguna.findUnique({
      where: { id },
      include: {
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

    // If user has audit history, deactivate instead or inform
    const hasHistory =
      user._count.verifikasiPengaduan > 0 ||
      user._count.tindakLanjut > 0 ||
      user._count.pengaduanDibuat > 0;

    if (hasHistory) {
      // Soft-delete / nonaktifkan akun agar histori audit verifikasi tetap utuh
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

