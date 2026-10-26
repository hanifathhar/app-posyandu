import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatusPengaduan } from "@prisma/client";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-super-aman";

async function getAuthUser(request: Request) {
  const token = request.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return await prisma.pengguna.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, kecamatanId: true, desaId: true, nama: true },
    });
  } catch (e) {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as StatusPengaduan | null;
    const bidangId = searchParams.get("bidangId");
    const kd_kecamatan = searchParams.get("kd_kecamatan");
    const kd_desa = searchParams.get("kd_desa");
    const search = searchParams.get("search")?.trim();
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {};

    const currentUser = await getAuthUser(request);

    if (status) {
      where.status = status;
    }

    if (bidangId) {
      where.bidangId = bidangId;
    }

    // Pembatasan Yurisdiksi Wilayah:
    // Admin Desa HANYA bisa mengakses data desanya sendiri
    if (currentUser?.role === "ADMIN_DESA" && currentUser.desaId) {
      where.kd_desa = currentUser.desaId;
    } else if (currentUser?.role === "ADMIN_KECAMATAN" && currentUser.kecamatanId) {
      // Admin Kecamatan HANYA bisa mengakses data kecamatannya sendiri
      where.kd_kecamatan = currentUser.kecamatanId;
      if (kd_desa) where.kd_desa = kd_desa;
    } else {
      // Superadmin / Admin Kabupaten dapat melihat seluruhnya atau memfilter
      if (kd_kecamatan) where.kd_kecamatan = kd_kecamatan;
      if (kd_desa) where.kd_desa = kd_desa;
    }

    if (search) {
      where.OR = [
        { nomorPengaduan: { contains: search, mode: "insensitive" } },
        { tokenPelacakan: { contains: search, mode: "insensitive" } },
        { pelapor: { nama: { contains: search, mode: "insensitive" } } },
        { pelapor: { nik: { contains: search, mode: "insensitive" } } },
        { deskripsi: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, pengaduanList] = await Promise.all([
      prisma.pengaduan.count({ where }),
      prisma.pengaduan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { tanggalPengaduan: "desc" },
        include: {
          bidang: true,
          jenisPengaduan: true,
          desa: true,
          kecamatan: true,
          posyandu: true,
          pelapor: true,
          dokumen: {
            select: {
              id: true,
              jenis: true,
              namaFile: true,
              pathFile: true,
              terverifikasi: true,
            },
          },
          tindakLanjut: {
            include: {
              petugas: { select: { nama: true } },
            },
            orderBy: { tanggal: "desc" },
          },
          verifikasi: {
            orderBy: { tanggal: "desc" },
            select: {
              id: true,
              tahap: true,
              keputusan: true,
              catatan: true,
              tanggal: true,
              putaran: true,
            },
          },
          _count: {
            select: {
              verifikasi: true,
              tindakLanjut: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: pengaduanList.map((p) => ({
        id: p.id,
        nomorPengaduan: p.nomorPengaduan,
        tokenPelacakan: p.tokenPelacakan,
        tanggalPengaduan: p.tanggalPengaduan,
        pelapor: {
          id: p.pelapor.id,
          nama: p.pelapor.nama,
          nik: p.pelapor.nik,
          noHp: p.pelapor.noHp,
          alamat: p.pelapor.alamat,
        },
        bidang: {
          id: p.bidang.id,
          kode: p.bidang.kode,
          nama: p.bidang.nm_bidang,
        },
        jenisPengaduan: p.jenisPengaduan.map((j) => ({
          id: j.id,
          nama: j.nama,
        })),
        lokasi: {
          posyandu: p.posyandu.nama_posyandu,
          desa: p.desa.nm_desa,
          kecamatan: p.kecamatan.nm_kecamatan,
          kd_desa: p.kd_desa,
          kd_kecamatan: p.kd_kecamatan,
        },
        deskripsi: p.deskripsi,
        jumlahTanggungan: p.jumlahTanggungan ?? p.pelapor?.jumlahTanggungan ?? null,
        penghasilan: p.penghasilan ?? p.pelapor?.penghasilan ?? null,
        status: p.status,
        alasanPenolakan: p.alasanPenolakan,
        catatan: p.catatan,
        hasilPenyelesaian: p.hasilPenyelesaian,
        tanggalSelesai: p.tanggalSelesai,
        dokumenCount: p.dokumen.length,
        dokumen: p.dokumen.map((d) => ({
          id: d.id,
          jenis: d.jenis,
          namaFile: d.namaFile,
          pathFile: d.pathFile,
          terverifikasi: d.terverifikasi,
        })),
        verifikasiCount: p._count.verifikasi,
        latestVerifikasiTahap: p.verifikasi[0]?.tahap || null,
        verifikasiList: p.verifikasi || [],
        tindakLanjutCount: p._count.tindakLanjut,
        tindakLanjutList: p.tindakLanjut.map((tl) => ({
          id: tl.id,
          jenis: tl.jenis,
          uraian: tl.uraian,
          hasil: tl.hasil,
          tanggal: tl.tanggal,
          petugasNama: tl.petugas?.nama || "Petugas Lapangan",
        })),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching admin pengaduan list:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat daftar pengaduan admin", error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      deskripsi,
      catatan,
      status,
      hasilPenyelesaian,
      namaPelapor,
      noHpPelapor,
      alamatPelapor,
      jumlahTanggungan,
      penghasilan,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID pengaduan wajib diisi." }, { status: 400 });
    }

    const current = await prisma.pengaduan.findUnique({
      where: { id },
      include: { pelapor: true, desa: true, kecamatan: true },
    });

    if (!current) {
      return NextResponse.json({ success: false, message: "Data pengaduan tidak ditemukan." }, { status: 404 });
    }

    const currentUser = await getAuthUser(request);
    if (currentUser?.role === "ADMIN_DESA" && current.kd_desa !== currentUser.desaId) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak: Anda tidak memiliki wewenang untuk mengubah data pengaduan di luar desa penugasan Anda." },
        { status: 403 }
      );
    }
    if (currentUser?.role === "ADMIN_KECAMATAN" && current.kd_kecamatan !== currentUser.kecamatanId) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak: Anda tidak memiliki wewenang untuk mengubah data pengaduan di luar kecamatan penugasan Anda." },
        { status: 403 }
      );
    }

    // PENGUNCIAN DATA TERVERIFIKASI:
    // Pengaduan yang telah diverifikasi (status bukan MENUNGGU_VERIFIKASI_DESA / BARU) tidak boleh diedit
    // KECUALI oleh SUPERADMIN yang memiliki hak akses penuh untuk merubah status apa pun (termasuk SELESAI, DITOLAK, PERLU_PERBAIKAN).
    if (
      currentUser?.role !== "SUPERADMIN" &&
      current.status !== StatusPengaduan.MENUNGGU_VERIFIKASI_DESA &&
      current.status !== StatusPengaduan.BARU
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Akses ditolak: Pengaduan ini telah terverifikasi (Status: ${current.status}) dan terkunci dari perubahan. Verifikasi harus dibatalkan secara berjenjang terlebih dahulu jika ingin mengedit data ini (atau dilakukan oleh Superadmin).`,
        },
        { status: 400 }
      );
    }

    // Update Pelapor if provided
    if (
      namaPelapor ||
      noHpPelapor !== undefined ||
      alamatPelapor !== undefined ||
      jumlahTanggungan !== undefined ||
      penghasilan !== undefined
    ) {
      await prisma.pelapor.update({
        where: { id: current.pelaporId },
        data: {
          ...(namaPelapor ? { nama: namaPelapor } : {}),
          ...(noHpPelapor !== undefined ? { noHp: noHpPelapor } : {}),
          ...(alamatPelapor !== undefined ? { alamat: alamatPelapor } : {}),
          ...(jumlahTanggungan !== undefined ? { jumlahTanggungan: parseInt(String(jumlahTanggungan), 10) || 0 } : {}),
          ...(penghasilan !== undefined ? { penghasilan } : {}),
        },
      });
    }

    const updateData: any = {};
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (catatan !== undefined) updateData.catatan = catatan;
    if (status !== undefined) updateData.status = status as StatusPengaduan;
    if (hasilPenyelesaian !== undefined) updateData.hasilPenyelesaian = hasilPenyelesaian;
    if (jumlahTanggungan !== undefined) updateData.jumlahTanggungan = parseInt(String(jumlahTanggungan), 10) || 0;
    if (penghasilan !== undefined) updateData.penghasilan = penghasilan;

    const updated = await prisma.pengaduan.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Pengaduan ${updated.nomorPengaduan} berhasil diperbarui.`,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating pengaduan:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui pengaduan: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID pengaduan wajib diberikan." }, { status: 400 });
    }

    const current = await prisma.pengaduan.findUnique({
      where: { id },
      select: { nomorPengaduan: true, kd_desa: true, kd_kecamatan: true, status: true },
    });

    if (!current) {
      return NextResponse.json({ success: false, message: "Data pengaduan tidak ditemukan." }, { status: 404 });
    }

    const currentUser = await getAuthUser(request);
    if (currentUser?.role === "ADMIN_DESA" && current.kd_desa !== currentUser.desaId) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak: Anda tidak berhak menghapus pengaduan di luar desa penugasan Anda." },
        { status: 403 }
      );
    }
    if (currentUser?.role === "ADMIN_KECAMATAN" && current.kd_kecamatan !== currentUser.kecamatanId) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak: Anda tidak berhak menghapus pengaduan di luar kecamatan penugasan Anda." },
        { status: 403 }
      );
    }

    // PENGUNCIAN DATA TERVERIFIKASI:
    // Pengaduan yang telah diverifikasi tidak boleh dihapus
    // kecuali oleh SUPERADMIN atau verifikasinya dibatalkan secara berjenjang terlebih dahulu.
    if (
      currentUser?.role !== "SUPERADMIN" &&
      current.status !== StatusPengaduan.MENUNGGU_VERIFIKASI_DESA &&
      current.status !== StatusPengaduan.BARU
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Akses ditolak: Pengaduan ini telah terverifikasi (Status: ${current.status}) dan tidak dapat dihapus. Anda harus membatalkan verifikasi secara berjenjang terlebih dahulu hingga tahap Desa jika ingin menghapus data ini (atau dilakukan oleh Superadmin).`,
        },
        { status: 400 }
      );
    }

    // Safe cascading delete
    await prisma.$transaction([
      prisma.dokumenPendukung.deleteMany({ where: { pengaduanId: id } }),
      prisma.verifikasiPengaduan.deleteMany({ where: { pengaduanId: id } }),
      prisma.tindakLanjut.deleteMany({ where: { pengaduanId: id } }),
      prisma.riwayatPengaduan.deleteMany({ where: { pengaduanId: id } }),
      prisma.pengaduan.update({
        where: { id },
        data: { jenisPengaduan: { set: [] } },
      }),
      prisma.pengaduan.delete({ where: { id } }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Pengaduan ${current.nomorPengaduan} berhasil dihapus permanen.`,
    });
  } catch (error: any) {
    console.error("Error deleting pengaduan:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus pengaduan: " + error.message },
      { status: 500 }
    );
  }
}

