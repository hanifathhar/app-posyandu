import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";

    if (type === "posyandu") {
      const posyanduList = await prisma.posyandu.findMany({
        orderBy: [{ kd_kecamatan: "asc" }, { kd_desa: "asc" }, { nama_posyandu: "asc" }],
        include: {
          desa: { select: { nm_desa: true } },
          kecamatan: { select: { nm_kecamatan: true } },
          _count: { select: { pengaduan: true } },
        },
      });
      return NextResponse.json({ success: true, data: posyanduList });
    }

    if (type === "desa") {
      const desaList = await prisma.desa.findMany({
        orderBy: [{ kd_kecamatan: "asc" }, { nm_desa: "asc" }],
        include: {
          kecamatan: { select: { nm_kecamatan: true } },
          _count: { select: { posyandu: true, pengaduan: true } },
        },
      });
      return NextResponse.json({ success: true, data: desaList });
    }

    if (type === "kecamatan") {
      const kecamatanList = await prisma.kecamatan.findMany({
        orderBy: { kd_kecamatan: "asc" },
        include: {
          _count: { select: { desa: true, posyandu: true, pengaduan: true } },
        },
      });
      return NextResponse.json({ success: true, data: kecamatanList });
    }

    // Default "all" summary
    const [kecamatan, desa, posyandu] = await Promise.all([
      prisma.kecamatan.findMany({
        orderBy: { kd_kecamatan: "asc" },
        include: {
          _count: { select: { desa: true, posyandu: true, pengaduan: true } },
        },
      }),
      prisma.desa.findMany({
        orderBy: [{ kd_kecamatan: "asc" }, { nm_desa: "asc" }],
        include: {
          kecamatan: { select: { nm_kecamatan: true } },
          _count: { select: { posyandu: true, pengaduan: true } },
        },
      }),
      prisma.posyandu.findMany({
        orderBy: [{ kd_kecamatan: "asc" }, { kd_desa: "asc" }, { nama_posyandu: "asc" }],
        include: {
          desa: { select: { nm_desa: true } },
          kecamatan: { select: { nm_kecamatan: true } },
          _count: { select: { pengaduan: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        kecamatan,
        desa,
        posyandu,
      },
    });
  } catch (error: any) {
    console.error("Error fetching wilayah master data:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat master data wilayah: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entity, data } = body;

    if (entity === "posyandu") {
      const { nama_posyandu, alamat, kd_desa, kd_kecamatan } = data;
      if (!nama_posyandu || !kd_desa || !kd_kecamatan) {
        return NextResponse.json(
          { success: false, message: "Nama posyandu, desa, dan kecamatan wajib diisi." },
          { status: 400 }
        );
      }

      const created = await prisma.posyandu.create({
        data: {
          nama_posyandu,
          alamat: alamat || null,
          kd_desa,
          kd_kecamatan,
          aktif: true,
        },
      });
      return NextResponse.json({ success: true, message: "Posyandu berhasil ditambahkan.", data: created });
    }

    if (entity === "desa") {
      const { kd_desa, nm_desa, kd_kecamatan } = data;
      if (!kd_desa || !nm_desa || !kd_kecamatan) {
        return NextResponse.json(
          { success: false, message: "Kode desa, nama desa, dan kecamatan wajib diisi." },
          { status: 400 }
        );
      }

      const created = await prisma.desa.create({
        data: {
          kd_desa,
          nm_desa,
          kd_kecamatan,
          aktif: true,
        },
      });
      return NextResponse.json({ success: true, message: "Desa berhasil ditambahkan.", data: created });
    }

    if (entity === "kecamatan") {
      const { kd_kecamatan, nm_kecamatan } = data;
      if (!kd_kecamatan || !nm_kecamatan) {
        return NextResponse.json(
          { success: false, message: "Kode kecamatan dan nama kecamatan wajib diisi." },
          { status: 400 }
        );
      }

      const created = await prisma.kecamatan.create({
        data: {
          kd_kecamatan,
          nm_kecamatan,
          aktif: true,
        },
      });
      return NextResponse.json({ success: true, message: "Kecamatan berhasil ditambahkan.", data: created });
    }

    return NextResponse.json({ success: false, message: "Entity tidak valid." }, { status: 400 });
  } catch (error: any) {
    console.error("Error creating master wilayah:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan data: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { entity, id, data } = body;

    if (!id || !entity) {
      return NextResponse.json({ success: false, message: "Entity dan ID wajib diisi." }, { status: 400 });
    }

    if (entity === "posyandu") {
      const { nama_posyandu, alamat, kd_desa, kd_kecamatan, aktif } = data;
      const updated = await prisma.posyandu.update({
        where: { id },
        data: {
          ...(nama_posyandu ? { nama_posyandu } : {}),
          ...(alamat !== undefined ? { alamat } : {}),
          ...(kd_desa ? { kd_desa } : {}),
          ...(kd_kecamatan ? { kd_kecamatan } : {}),
          ...(typeof aktif === "boolean" ? { aktif } : {}),
        },
      });
      return NextResponse.json({ success: true, message: `Posyandu ${updated.nama_posyandu} berhasil diperbarui.`, data: updated });
    }

    if (entity === "desa") {
      const { nm_desa, kd_kecamatan, aktif } = data;
      const updated = await prisma.desa.update({
        where: { id },
        data: {
          ...(nm_desa ? { nm_desa } : {}),
          ...(kd_kecamatan ? { kd_kecamatan } : {}),
          ...(typeof aktif === "boolean" ? { aktif } : {}),
        },
      });
      return NextResponse.json({ success: true, message: `Desa ${updated.nm_desa} berhasil diperbarui.`, data: updated });
    }

    if (entity === "kecamatan") {
      const { nm_kecamatan, aktif } = data;
      const updated = await prisma.kecamatan.update({
        where: { id },
        data: {
          ...(nm_kecamatan ? { nm_kecamatan } : {}),
          ...(typeof aktif === "boolean" ? { aktif } : {}),
        },
      });
      return NextResponse.json({ success: true, message: `Kecamatan ${updated.nm_kecamatan} berhasil diperbarui.`, data: updated });
    }

    return NextResponse.json({ success: false, message: "Entity tidak valid." }, { status: 400 });
  } catch (error: any) {
    console.error("Error updating master wilayah:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui data: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get("entity");
    const id = searchParams.get("id");

    if (!entity || !id) {
      return NextResponse.json({ success: false, message: "Entity dan ID wajib diberikan." }, { status: 400 });
    }

    if (entity === "posyandu") {
      const pos = await prisma.posyandu.findUnique({
        where: { id },
        include: { _count: { select: { pengaduan: true } } },
      });
      if (!pos) return NextResponse.json({ success: false, message: "Posyandu tidak ditemukan." }, { status: 404 });

      if (pos._count.pengaduan > 0) {
        // Soft delete
        await prisma.posyandu.update({ where: { id }, data: { aktif: false } });
        return NextResponse.json({ success: true, message: `Posyandu ${pos.nama_posyandu} memiliki ${pos._count.pengaduan} data pengaduan, status diubah menjadi nonaktif.` });
      }

      await prisma.posyandu.delete({ where: { id } });
      return NextResponse.json({ success: true, message: `Posyandu ${pos.nama_posyandu} berhasil dihapus.` });
    }

    if (entity === "desa") {
      const d = await prisma.desa.findUnique({
        where: { id },
        include: { _count: { select: { posyandu: true, pengaduan: true } } },
      });
      if (!d) return NextResponse.json({ success: false, message: "Desa tidak ditemukan." }, { status: 404 });

      if (d._count.posyandu > 0 || d._count.pengaduan > 0) {
        await prisma.desa.update({ where: { id }, data: { aktif: false } });
        return NextResponse.json({ success: true, message: `Desa ${d.nm_desa} memiliki posyandu/pengaduan aktif, status diubah menjadi nonaktif.` });
      }

      await prisma.desa.delete({ where: { id } });
      return NextResponse.json({ success: true, message: `Desa ${d.nm_desa} berhasil dihapus.` });
    }

    if (entity === "kecamatan") {
      const k = await prisma.kecamatan.findUnique({
        where: { id },
        include: { _count: { select: { desa: true, posyandu: true, pengaduan: true } } },
      });
      if (!k) return NextResponse.json({ success: false, message: "Kecamatan tidak ditemukan." }, { status: 404 });

      if (k._count.desa > 0 || k._count.posyandu > 0 || k._count.pengaduan > 0) {
        await prisma.kecamatan.update({ where: { id }, data: { aktif: false } });
        return NextResponse.json({ success: true, message: `Kecamatan ${k.nm_kecamatan} masih memiliki desa/posyandu, status diubah menjadi nonaktif.` });
      }

      await prisma.kecamatan.delete({ where: { id } });
      return NextResponse.json({ success: true, message: `Kecamatan ${k.nm_kecamatan} berhasil dihapus.` });
    }

    return NextResponse.json({ success: false, message: "Entity tidak valid." }, { status: 400 });
  } catch (error: any) {
    console.error("Error deleting master wilayah:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus wilayah: " + error.message },
      { status: 500 }
    );
  }
}

