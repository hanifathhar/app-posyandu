import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: "insensitive" } },
        { nik: { contains: search, mode: "insensitive" } },
        { noHp: { contains: search, mode: "insensitive" } },
        { alamat: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, pelaporList] = await Promise.all([
      prisma.pelapor.count({ where }),
      prisma.pelapor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          desa: { select: { nm_desa: true } },
          kecamatan: { select: { nm_kecamatan: true } },
          _count: { select: { pengaduan: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: pelaporList,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching pelapor:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data pelapor: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, nik, noHp, alamat, kd_kecamatan, kd_desa } = body;

    if (!nama || !alamat) {
      return NextResponse.json(
        { success: false, message: "Nama dan alamat wajib diisi." },
        { status: 400 }
      );
    }

    if (nik) {
      const existing = await prisma.pelapor.findUnique({ where: { nik } });
      if (existing) {
        return NextResponse.json(
          { success: false, message: "NIK sudah terdaftar pada pelapor lain." },
          { status: 400 }
        );
      }
    }

    const created = await prisma.pelapor.create({
      data: {
        nama,
        nik: nik || null,
        noHp: noHp || null,
        alamat,
        kd_kecamatan: kd_kecamatan || null,
        kd_desa: kd_desa || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Data pelapor ${created.nama} berhasil ditambahkan.`,
      data: created,
    });
  } catch (error: any) {
    console.error("Error creating pelapor:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat pelapor: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, nik, noHp, alamat, kd_kecamatan, kd_desa } = body;

    if (!id || !nama || !alamat) {
      return NextResponse.json(
        { success: false, message: "ID, Nama, dan Alamat wajib diisi." },
        { status: 400 }
      );
    }

    if (nik) {
      const existing = await prisma.pelapor.findFirst({
        where: { nik, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: "NIK sudah digunakan oleh pelapor lain." },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.pelapor.update({
      where: { id },
      data: {
        nama,
        nik: nik || null,
        noHp: noHp || null,
        alamat,
        kd_kecamatan: kd_kecamatan || null,
        kd_desa: kd_desa || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Data pelapor ${updated.nama} berhasil diperbarui.`,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating pelapor:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui pelapor: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID pelapor wajib diberikan." }, { status: 400 });
    }

    const current = await prisma.pelapor.findUnique({
      where: { id },
      include: { _count: { select: { pengaduan: true } } },
    });

    if (!current) {
      return NextResponse.json({ success: false, message: "Pelapor tidak ditemukan." }, { status: 404 });
    }

    if (current._count.pengaduan > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Tidak dapat menghapus pelapor ini karena terdapat ${current._count.pengaduan} pengaduan aktif yang terhubung.`,
        },
        { status: 400 }
      );
    }

    await prisma.pelapor.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Data pelapor ${current.nama} berhasil dihapus.`,
    });
  } catch (error: any) {
    console.error("Error deleting pelapor:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus pelapor: " + error.message },
      { status: 500 }
    );
  }
}
