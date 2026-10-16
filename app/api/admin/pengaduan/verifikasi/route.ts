import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { StatusPengaduan, TahapVerifikasi, KeputusanVerifikasi, JenisPeristiwa } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-super-aman";

export async function POST(request: Request) {
  try {
    // 1. Ambil token petugas dari cookie
    const token = request.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
    let currentUser: any = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        currentUser = await prisma.pengguna.findUnique({
          where: { id: decoded.id },
          include: { kecamatan: true, desa: true },
        });
      } catch (e) {
        console.warn("Invalid JWT in verifikasi");
      }
    }

    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Pengguna tidak terautentikasi atau sesi login berakhir." }, { status: 401 });
    }

    const penggunaId = currentUser.id;

    const body = await request.json();
    const { pengaduanId, tahap, keputusan, catatan } = body;

    if (!pengaduanId || !tahap || !keputusan) {
      return NextResponse.json(
        { success: false, message: "Parameter pengaduanId, tahap, dan keputusan wajib diisi." },
        { status: 400 }
      );
    }

    const pengaduan = await prisma.pengaduan.findUnique({
      where: { id: pengaduanId },
      include: { desa: true, kecamatan: true },
    });

    if (!pengaduan) {
      return NextResponse.json({ success: false, message: "Pengaduan tidak ditemukan." }, { status: 404 });
    }

    // ========================================================
    // ATURAN OTORISASI WILAYAH & PERAN VERIFIKASI
    // ========================================================
    if (currentUser.role === "ADMIN_DESA") {
      // 1. Admin Desa hanya berwenang verifikasi tahap DESA
      if (tahap !== "DESA") {
        return NextResponse.json(
          { success: false, message: "Akses ditolak: Admin Desa hanya memiliki wewenang untuk verifikasi tahap Desa." },
          { status: 403 }
        );
      }

      // 2. Admin Desa A TIDAK BISA memverifikasi data pengaduan Desa B
      if (!currentUser.desaId || pengaduan.kd_desa !== currentUser.desaId) {
        return NextResponse.json(
          {
            success: false,
            message: `Akses ditolak: Anda terdaftar sebagai Admin Desa ${currentUser.desa?.nm_desa || currentUser.desaId}. Anda tidak memiliki wewenang memverifikasi pengaduan dari Desa ${pengaduan.desa?.nm_desa || pengaduan.kd_desa}.`,
          },
          { status: 403 }
        );
      }
    } else if (currentUser.role === "ADMIN_KECAMATAN") {
      // 1. Admin Kecamatan hanya berwenang verifikasi tahap KECAMATAN
      if (tahap !== "KECAMATAN") {
        return NextResponse.json(
          { success: false, message: "Akses ditolak: Admin Kecamatan hanya memiliki wewenang untuk verifikasi tahap Kecamatan." },
          { status: 403 }
        );
      }

      // 2. Admin Kecamatan X TIDAK BISA memverifikasi data pengaduan Kecamatan Y
      if (!currentUser.kecamatanId || pengaduan.kd_kecamatan !== currentUser.kecamatanId) {
        return NextResponse.json(
          {
            success: false,
            message: `Akses ditolak: Anda terdaftar sebagai Admin Kecamatan ${currentUser.kecamatan?.nm_kecamatan || currentUser.kecamatanId}. Anda tidak memiliki wewenang memverifikasi pengaduan dari Kecamatan ${pengaduan.kecamatan?.nm_kecamatan || pengaduan.kd_kecamatan}.`,
          },
          { status: 403 }
        );
      }
    } else if (currentUser.role === "ADMIN_KABUPATEN" || currentUser.role === "PETUGAS" || currentUser.role === "VERIFIKATOR") {
      if (tahap !== "KABUPATEN" && currentUser.role !== "SUPERADMIN") {
        return NextResponse.json(
          { success: false, message: "Akses ditolak: Akun tingkat Kabupaten hanya memproses verifikasi tahap Kabupaten." },
          { status: 403 }
        );
      }
    }

    const statusSebelum = pengaduan.status;
    let statusSesudah: StatusPengaduan = statusSebelum;
    let keterangan = "";

    if (keputusan === "DITOLAK") {
      statusSesudah = StatusPengaduan.DITOLAK;
      keterangan = `Pengaduan ditolak pada tahap verifikasi ${tahap}. Catatan: ${catatan || "-"}`;
    } else if (keputusan === "PERLU_PERBAIKAN") {
      statusSesudah = StatusPengaduan.PERLU_PERBAIKAN;
      keterangan = `Pengaduan dikembalikan untuk perbaikan berkas oleh verifikator ${tahap}. Catatan: ${catatan || "-"}`;
    } else if (keputusan === "DISETUJUI") {
      if (tahap === "DESA") {
        statusSesudah = StatusPengaduan.MENUNGGU_VERIFIKASI_KECAMATAN;
        keterangan = `Verifikasi Desa disetujui oleh kader/admin desa. Diteruskan ke verifikasi Kecamatan.`;
      } else if (tahap === "KECAMATAN") {
        statusSesudah = StatusPengaduan.MENUNGGU_VERIFIKASI_KABUPATEN;
        keterangan = `Verifikasi Kecamatan disetujui oleh Kasi Kessos/Camat. Diteruskan ke Dinas Kabupaten terkait.`;
      } else if (tahap === "KABUPATEN") {
        statusSesudah = StatusPengaduan.DITINDAKLANJUTI;
        keterangan = `Verifikasi Kabupaten disetujui oleh OPD Pengampu SPM. Pengaduan masuk tahap tindak lanjut/intervensi.`;
      }
    }

    // Hitung putaran verifikasi
    const prevVerifCount = await prisma.verifikasiPengaduan.count({
      where: { pengaduanId, tahap: tahap as TahapVerifikasi },
    });

    // Simpan Verifikasi & Update Pengaduan
    const [verifRecord, updatedPengaduan] = await prisma.$transaction([
      prisma.verifikasiPengaduan.create({
        data: {
          pengaduanId,
          penggunaId,
          tahap: tahap as TahapVerifikasi,
          keputusan: keputusan as KeputusanVerifikasi,
          catatan: catatan?.trim() || null,
          putaran: prevVerifCount + 1,
        },
      }),
      prisma.pengaduan.update({
        where: { id: pengaduanId },
        data: {
          status: statusSesudah,
          alasanPenolakan: keputusan === "DITOLAK" ? catatan?.trim() || "Ditolak oleh verifikator" : pengaduan.alasanPenolakan,
          catatan: catatan?.trim() || pengaduan.catatan,
          tahapPerbaikanKe: keputusan === "PERLU_PERBAIKAN" ? (tahap as TahapVerifikasi) : null,
          tanggalDisetujui: keputusan === "DISETUJUI" && tahap === "KABUPATEN" ? new Date() : pengaduan.tanggalDisetujui,
          riwayatStatus: {
            create: {
              penggunaId,
              peristiwa: keputusan === "DISETUJUI" ? JenisPeristiwa.VERIFIKASI : keputusan === "PERLU_PERBAIKAN" ? JenisPeristiwa.PERBAIKAN_DIMINTA : JenisPeristiwa.STATUS_DIUBAH,
              statusSebelum,
              statusSesudah,
              keterangan,
            },
          },
        },
        include: {
          bidang: true,
          jenisPengaduan: true,
          desa: true,
          kecamatan: true,
          posyandu: true,
          pelapor: true,
          verifikasi: {
            orderBy: { tanggal: "desc" },
          },
          riwayatStatus: {
            orderBy: { tanggal: "desc" },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Verifikasi tahap ${tahap} berhasil diproses: ${keputusan}`,
      data: {
        id: updatedPengaduan.id,
        nomorPengaduan: updatedPengaduan.nomorPengaduan,
        status: updatedPengaduan.status,
      },
    });
  } catch (error: any) {
    console.error("Error in verifikasi pengaduan:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses verifikasi pengaduan", error: error.message },
      { status: 500 }
    );
  }
}
