import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-super-aman";

async function getAuthUser(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const token = cookieHeader.split("token=")[1]?.split(";")[0];
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const currentUser = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    let kd_kecamatan = searchParams.get("kd_kecamatan") || "";
    let kd_desa = searchParams.get("kd_desa") || "";
    const posyanduId = searchParams.get("posyanduId") || "";

    // Otorisasi role wilayah
    if (currentUser?.role === "ADMIN_DESA") {
      if (currentUser.desaId) kd_desa = currentUser.desaId;
      if (currentUser.kecamatanId) kd_kecamatan = currentUser.kecamatanId;
    } else if (currentUser?.role === "ADMIN_KECAMATAN") {
      if (currentUser.kecamatanId) kd_kecamatan = currentUser.kecamatanId;
    }

    const where: any = {};

    if (startDate || endDate) {
      where.tanggalPengaduan = {};
      if (startDate) where.tanggalPengaduan.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.tanggalPengaduan.lte = end;
      }
    }

    if (kd_kecamatan) {
      where.kd_kecamatan = kd_kecamatan;
    }

    if (kd_desa) {
      where.kd_desa = kd_desa;
    }

    if (posyanduId) {
      where.posyanduId = posyanduId;
    }

    // 1. Total KPI
    const [total, selesai, ditindaklanjuti, prosesVerifikasi, ditolak, perbaikan] = await Promise.all([
      prisma.pengaduan.count({ where }),
      prisma.pengaduan.count({ where: { ...where, status: "SELESAI" } }),
      prisma.pengaduan.count({ where: { ...where, status: "DITINDAKLANJUTI" } }),
      prisma.pengaduan.count({
        where: {
          ...where,
          status: {
            in: [
              "BARU",
              "MENUNGGU_VERIFIKASI_DESA",
              "MENUNGGU_VERIFIKASI_KECAMATAN",
              "MENUNGGU_VERIFIKASI_KABUPATEN",
            ],
          },
        },
      }),
      prisma.pengaduan.count({ where: { ...where, status: "DITOLAK" } }),
      prisma.pengaduan.count({ where: { ...where, status: "PERLU_PERBAIKAN" } }),
    ]);

    // 2. Rekap per Bidang SPM
    const bidangList = await prisma.bidang.findMany({
      orderBy: { kode: "asc" },
      select: {
        id: true,
        kode: true,
        nm_bidang: true,
      },
    });

    const bidangStats = await Promise.all(
      bidangList.map(async (b) => {
        const countTotal = await prisma.pengaduan.count({
          where: { ...where, bidangId: b.id },
        });
        const countSelesai = await prisma.pengaduan.count({
          where: { ...where, bidangId: b.id, status: "SELESAI" },
        });
        const countProses = await prisma.pengaduan.count({
          where: {
            ...where,
            bidangId: b.id,
            status: { notIn: ["SELESAI", "DITOLAK"] },
          },
        });

        return {
          id: b.id,
          kode: b.kode,
          nama: b.nm_bidang,
          total: countTotal,
          selesai: countSelesai,
          proses: countProses,
          persentaseSelesai: countTotal > 0 ? Math.round((countSelesai / countTotal) * 100) : 0,
        };
      })
    );

    // 3. Rekap per Kecamatan
    const kecamatanList = await prisma.kecamatan.findMany({
      orderBy: { kd_kecamatan: "asc" },
      select: {
        kd_kecamatan: true,
        nm_kecamatan: true,
      },
    });

    const kecamatanStats = await Promise.all(
      kecamatanList.map(async (k) => {
        const countTotal = await prisma.pengaduan.count({
          where: { ...where, kd_kecamatan: k.kd_kecamatan },
        });
        const countSelesai = await prisma.pengaduan.count({
          where: { ...where, kd_kecamatan: k.kd_kecamatan, status: "SELESAI" },
        });

        return {
          kode: k.kd_kecamatan,
          nama: k.nm_kecamatan,
          total: countTotal,
          selesai: countSelesai,
        };
      })
    );

    // 4. Detail list pengaduan untuk tabel laporan / export
    const detailList = await prisma.pengaduan.findMany({
      where,
      orderBy: { tanggalPengaduan: "asc" },
      take: 500,
      include: {
        bidang: true,
        jenisPengaduan: true,
        kecamatan: true,
        desa: true,
        posyandu: true,
        pelapor: true,
        tindakLanjut: {
          orderBy: { tanggal: "desc" },
          take: 1,
        },
      },
    });

    // Info Wilayah Terpilih (Kecamatan, Desa, Posyandu)
    let infoWilayah = {
      namaKecamatan: "",
      namaDesa: "",
      namaPosyandu: "",
    };

    if (kd_kecamatan) {
      const kec = await prisma.kecamatan.findUnique({
        where: { kd_kecamatan },
        select: { nm_kecamatan: true },
      });
      if (kec) infoWilayah.namaKecamatan = kec.nm_kecamatan;
    }

    if (kd_desa) {
      const des = await prisma.desa.findUnique({
        where: { kd_desa },
        select: { nm_desa: true, kecamatan: { select: { nm_kecamatan: true } } },
      });
      if (des) {
        infoWilayah.namaDesa = des.nm_desa;
        if (!infoWilayah.namaKecamatan && des.kecamatan) {
          infoWilayah.namaKecamatan = des.kecamatan.nm_kecamatan;
        }
      }
    }

    if (posyanduId) {
      const pos = await prisma.posyandu.findUnique({
        where: { id: posyanduId },
        select: { nama_posyandu: true },
      });
      if (pos) infoWilayah.namaPosyandu = pos.nama_posyandu;
    }

    return NextResponse.json({
      success: true,
      currentUserRole: currentUser?.role || null,
      infoWilayah,
      summary: {
        total,
        selesai,
        ditindaklanjuti,
        prosesVerifikasi,
        ditolak,
        perbaikan,
        tingkatPenyelesaian: total > 0 ? Math.round((selesai / total) * 100) : 0,
      },
      bidangStats,
      kecamatanStats,
      detailList: detailList.map((d, index) => {
        // Tentukan Keterangan (SELESAI / DITERUSKAN / DITOLAK / PERBAIKAN)
        let keterangan = "DITERUSKAN";
        if (d.status === "SELESAI") {
          keterangan = "SELESAI";
        } else if (d.status === "DITOLAK") {
          keterangan = "DITOLAK";
        } else if (d.status === "PERLU_PERBAIKAN") {
          keterangan = "PERLU PERBAIKAN";
        } else if (d.status === "MENUNGGU_VERIFIKASI_DESA" || d.status === "BARU") {
          keterangan = "PROSES DESA";
        } else {
          keterangan = "DITERUSKAN";
        }

        return {
          no: index + 1,
          id: d.id,
          nomorPengaduan: d.nomorPengaduan,
          tanggal: d.tanggalPengaduan,
          pelapor: d.pelapor.nama,
          namaSasaran: d.pelapor.nama,
          nik: d.pelapor.nik,
          noHp: d.pelapor.noHp,
          temuan: d.deskripsi,
          bidang: d.bidang.nm_bidang,
          kategori: d.jenisPengaduan.map((j) => j.nama).join(", "),
          kecamatan: d.kecamatan.nm_kecamatan,
          desa: d.desa.nm_desa,
          posyandu: d.posyandu.nama_posyandu,
          status: d.status,
          namaDesa: d.desa.nm_desa,
          namaKecamatan: d.kecamatan.nm_kecamatan,
          rekapitulasiTemuan: d.deskripsi,
          tindakLanjutDesa: d.tindakLanjut[0]?.uraian || d.hasilPenyelesaian || d.catatan || "-",
          tindakLanjutKecamatan: d.tindakLanjut[0]?.uraian || d.hasilPenyelesaian || d.catatan || "-",
          tindakLanjutOpd: d.tindakLanjut[0]?.uraian || d.hasilPenyelesaian || d.catatan || "-",
          tindakLanjutTerakhir: d.tindakLanjut[0]?.uraian || d.hasilPenyelesaian || "-",
          keterangan,
          tanggalSelesai: d.tanggalSelesai,
        };
      }),
    });
  } catch (error: any) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses laporan SPM: " + error.message },
      { status: 500 }
    );
  }
}
