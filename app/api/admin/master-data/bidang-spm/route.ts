import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const bidangList = await prisma.bidang.findMany({
      orderBy: { kode: "asc" },
      include: {
        jenis: {
          orderBy: { nama: "asc" },
          include: {
            _count: { select: { pengaduan: true } },
          },
        },
        _count: { select: { pengaduan: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: bidangList.map((b) => ({
        id: b.id,
        kode: b.kode,
        nm_bidang: b.nm_bidang,
        deskripsi: b.deskripsi,
        aktif: b.aktif,
        jenisPengaduan: b.jenis,
        _count: b._count,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching bidang master data:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat master bidang SPM: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bidangId, nama, deskripsi } = body;

    if (!bidangId || !nama) {
      return NextResponse.json(
        { success: false, message: "Bidang ID dan Nama Kategori Masalah wajib diisi." },
        { status: 400 }
      );
    }

    const created = await prisma.jenisPengaduan.create({
      data: {
        bidangId,
        nama,
        deskripsi: deskripsi || null,
        aktif: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Kategori masalah SPM berhasil ditambahkan.",
      data: created,
    });
  } catch (error: any) {
    console.error("Error creating jenis pengaduan:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menambahkan kategori SPM: " + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, deskripsi, aktif } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID kategori wajib diisi." }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof aktif === "boolean") updateData.aktif = aktif;
    if (nama) updateData.nama = nama;
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;

    const updated = await prisma.jenisPengaduan.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Kategori ${updated.nama} berhasil diperbarui.`,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating jenis pengaduan:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui kategori: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID kategori wajib diberikan." }, { status: 400 });
    }

    const current = await prisma.jenisPengaduan.findUnique({
      where: { id },
      include: { _count: { select: { pengaduan: true } } },
    });

    if (!current) {
      return NextResponse.json({ success: false, message: "Kategori tidak ditemukan." }, { status: 404 });
    }

    if (current._count.pengaduan > 0) {
      // Soft-delete: nonaktifkan kategori agar pengaduan yang sudah tercatat tidak rusak
      await prisma.jenisPengaduan.update({
        where: { id },
        data: { aktif: false },
      });
      return NextResponse.json({
        success: true,
        message: `Kategori ${current.nama} memiliki ${current._count.pengaduan} data pengaduan, status dialihkan ke Nonaktif (arsip).`,
      });
    }

    await prisma.jenisPengaduan.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Kategori ${current.nama} berhasil dihapus permanen.`,
    });
  } catch (error: any) {
    console.error("Error deleting jenis pengaduan:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus kategori: " + error.message },
      { status: 500 }
    );
  }
}

