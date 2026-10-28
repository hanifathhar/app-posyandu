import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
        nama: true,
        dinasId: true,
      },
    });
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const aktifOnly = searchParams.get("aktif") === "true";

    const where: any = {};
    if (aktifOnly) {
      where.aktif = true;
    }
    if (search) {
      where.OR = [
        { kode: { contains: search, mode: "insensitive" } },
        { nama: { contains: search, mode: "insensitive" } },
        { deskripsi: { contains: search, mode: "insensitive" } },
      ];
    }

    const dinasList = await prisma.dinas.findMany({
      where,
      orderBy: { nama: "asc" },
      include: {
        _count: {
          select: {
            pengguna: true,
            pengaduan: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: dinasList,
    });
  } catch (error: any) {
    console.error("Error fetching master dinas:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat master dinas: " + error.message },
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

    if (currentUser.role !== RolePengguna.SUPERADMIN && currentUser.role !== RolePengguna.ADMIN_KABUPATEN) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak: Hanya Superadmin dan Admin Kabupaten yang dapat menambah dinas." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { kode, nama, deskripsi, kontak } = body;

    if (!kode?.trim() || !nama?.trim()) {
      return NextResponse.json(
        { success: false, message: "Kode dinas dan Nama dinas wajib diisi." },
        { status: 400 }
      );
    }

    const cleanKode = kode.trim().toUpperCase();
    const existing = await prisma.dinas.findUnique({
      where: { kode: cleanKode },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Dinas dengan kode "${cleanKode}" sudah terdaftar.` },
        { status: 400 }
      );
    }

    const created = await prisma.dinas.create({
      data: {
        kode: cleanKode,
        nama: nama.trim(),
        deskripsi: deskripsi?.trim() || null,
        kontak: kontak?.trim() || null,
        aktif: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Dinas ${created.nama} berhasil ditambahkan.`,
      data: created,
    });
  } catch (error: any) {
    console.error("Error creating dinas:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menambah dinas: " + error.message },
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

    if (currentUser.role !== RolePengguna.SUPERADMIN && currentUser.role !== RolePengguna.ADMIN_KABUPATEN) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak: Hanya Superadmin dan Admin Kabupaten yang dapat mengubah data dinas." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, kode, nama, deskripsi, kontak, aktif } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID Dinas wajib diisi." }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof aktif === "boolean") updateData.aktif = aktif;
    if (nama?.trim()) updateData.nama = nama.trim();
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi?.trim() || null;
    if (kontak !== undefined) updateData.kontak = kontak?.trim() || null;

    if (kode?.trim()) {
      const cleanKode = kode.trim().toUpperCase();
      const existing = await prisma.dinas.findFirst({
        where: { kode: cleanKode, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: `Kode dinas "${cleanKode}" sudah digunakan oleh dinas lain.` },
          { status: 400 }
        );
      }
      updateData.kode = cleanKode;
    }

    const updated = await prisma.dinas.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Data dinas ${updated.nama} berhasil diperbarui.`,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating dinas:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui dinas: " + error.message },
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

    if (currentUser.role !== RolePengguna.SUPERADMIN && currentUser.role !== RolePengguna.ADMIN_KABUPATEN) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak: Hanya Superadmin dan Admin Kabupaten yang dapat menghapus dinas." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID Dinas wajib diisi." }, { status: 400 });
    }

    const checkRelations = await prisma.dinas.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            pengguna: true,
            pengaduan: true,
          },
        },
      },
    });

    if (!checkRelations) {
      return NextResponse.json({ success: false, message: "Dinas tidak ditemukan." }, { status: 404 });
    }

    if (checkRelations._count.pengguna > 0 || checkRelations._count.pengaduan > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Dinas "${checkRelations.nama}" tidak dapat dihapus permanen karena telah memiliki ${checkRelations._count.pengguna} pengguna dan ${checkRelations._count.pengaduan} pengaduan terkait. Anda dapat menonaktifkan status dinas ini.`,
        },
        { status: 400 }
      );
    }

    await prisma.dinas.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Dinas "${checkRelations.nama}" berhasil dihapus.`,
    });
  } catch (error: any) {
    console.error("Error deleting dinas:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus dinas: " + error.message },
      { status: 500 }
    );
  }
}
