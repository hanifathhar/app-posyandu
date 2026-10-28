import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatusPengaduan } from "@prisma/client";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-super-aman";

export async function GET(request?: Request) {
  try {
    const url = request ? new URL(request.url) : null;
    const periode = url?.searchParams.get("periode") || "semua"; // "semua" | "bulan-ini" | "tahun-ini"

    // 1. Dapatkan Pengguna Login dari Token
    const token = request?.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
    let currentUser: any = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        currentUser = await prisma.pengguna.findUnique({
          where: { id: decoded.id },
          include: { kecamatan: true, desa: true, dinas: true },
        });
      } catch (e) {
        console.warn("Invalid JWT token on dashboard route");
      }
    }

    // 2. Susun Filter Wilayah/Dinas Berdasarkan Hak Akses Role
    const baseWhere: any = {};

    if (currentUser?.role === "ADMIN_DESA" && currentUser.desaId) {
      baseWhere.kd_desa = currentUser.desaId;
    } else if (currentUser?.role === "ADMIN_KECAMATAN" && currentUser.kecamatanId) {
      baseWhere.kd_kecamatan = currentUser.kecamatanId;
    } else if (currentUser?.role === "ADMIN_DINAS" && currentUser.dinasId) {
      baseWhere.dinasId = currentUser.dinasId;
    }

    // Filter Periode Waktu jika dipilih
    const now = new Date();
    if (periode === "bulan-ini") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      baseWhere.tanggalPengaduan = { gte: startOfMonth, lte: endOfMonth };
    } else if (periode === "tahun-ini") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      baseWhere.tanggalPengaduan = { gte: startOfYear, lte: endOfYear };
    }

    // 3. KPI Counts Sesuai Wilayah/Dinas & Periode
    const [
      total,
      menungguDesa,
      menungguKecamatan,
      menungguKabupaten,
      diteruskanKeDinas,
      ditindaklanjuti,
      selesai,
      perluPerbaikan,
      ditolak,
    ] = await Promise.all([
      prisma.pengaduan.count({ where: baseWhere }),
      prisma.pengaduan.count({ where: { ...baseWhere, status: StatusPengaduan.MENUNGGU_VERIFIKASI_DESA } }),
      prisma.pengaduan.count({ where: { ...baseWhere, status: StatusPengaduan.MENUNGGU_VERIFIKASI_KECAMATAN } }),
      prisma.pengaduan.count({ where: { ...baseWhere, status: StatusPengaduan.MENUNGGU_VERIFIKASI_KABUPATEN } }),
      prisma.pengaduan.count({ where: { ...baseWhere, status: StatusPengaduan.DITERUSKAN_KE_DINAS } }),
      prisma.pengaduan.count({ where: { ...baseWhere, status: StatusPengaduan.DITINDAKLANJUTI } }),
      prisma.pengaduan.count({ where: { ...baseWhere, status: StatusPengaduan.SELESAI } }),
      prisma.pengaduan.count({ where: { ...baseWhere, status: StatusPengaduan.PERLU_PERBAIKAN } }),
      prisma.pengaduan.count({ where: { ...baseWhere, status: StatusPengaduan.DITOLAK } }),
    ]);

    // 4. Distribusi 6 Bidang SPM (Dengan mempertimbangkan filter wilayah)
    const bidangList = await prisma.bidang.findMany({
      where: { aktif: true },
      orderBy: { kode: "asc" },
    });

    const pengaduanPerBidang = await prisma.pengaduan.groupBy({
      by: ["bidangId"],
      where: baseWhere,
      _count: { id: true },
    });

    const bidangCountMap = new Map(pengaduanPerBidang.map((p) => [p.bidangId, p._count.id]));

    const distribusiBidang = bidangList.map((b) => ({
      kode: b.kode,
      nama: b.nm_bidang.split(" ")[0],
      namaLengkap: b.nm_bidang,
      total: bidangCountMap.get(b.id) || 0,
    }));

    // 5. Sebaran Wilayah Khusus Sesuai Level User:
    // - Admin Desa: Sebaran per Posyandu di Desanya
    // - Admin Kecamatan: Sebaran per Desa di Kecamatannya
    // - Admin Kabupaten / Superadmin: Sebaran per Kecamatan se-Kabupaten
    let sebaranWilayahType: "POSYANDU" | "DESA" | "KECAMATAN" = "KECAMATAN";
    let sebaranWilayahTitle = "Sebaran Kasus per Kecamatan";
    let sebaranWilayah: Array<{ id: string; nama: string; total: number }> = [];

    if (currentUser?.role === "ADMIN_DESA" && currentUser.desaId) {
      sebaranWilayahType = "POSYANDU";
      sebaranWilayahTitle = `Sebaran Kasus per Posyandu (Desa ${currentUser.desa?.nm_desa || ""})`;

      const posyanduList = await prisma.posyandu.findMany({
        where: { kd_desa: currentUser.desaId, aktif: true },
        select: { id: true, nama_posyandu: true },
      });

      const pengaduanPosyandu = await prisma.pengaduan.groupBy({
        by: ["posyanduId"],
        where: baseWhere,
        _count: { id: true },
      });

      const posyanduCountMap = new Map(pengaduanPosyandu.map((p) => [p.posyanduId, p._count.id]));

      sebaranWilayah = posyanduList.map((pos) => ({
        id: pos.id,
        nama: pos.nama_posyandu,
        total: posyanduCountMap.get(pos.id) || 0,
      }));
    } else if (currentUser?.role === "ADMIN_KECAMATAN" && currentUser.kecamatanId) {
      sebaranWilayahType = "DESA";
      sebaranWilayahTitle = `Sebaran Kasus per Desa (Kec. ${currentUser.kecamatan?.nm_kecamatan || ""})`;

      const desaList = await prisma.desa.findMany({
        where: { kd_kecamatan: currentUser.kecamatanId, aktif: true },
        select: { kd_desa: true, nm_desa: true },
        orderBy: { nm_desa: "asc" },
      });

      const pengaduanDesa = await prisma.pengaduan.groupBy({
        by: ["kd_desa"],
        where: baseWhere,
        _count: { id: true },
      });

      const desaCountMap = new Map(pengaduanDesa.map((d) => [d.kd_desa, d._count.id]));

      sebaranWilayah = desaList.map((desa) => ({
        id: desa.kd_desa,
        nama: desa.nm_desa,
        total: desaCountMap.get(desa.kd_desa) || 0,
      }));
    } else {
      sebaranWilayahType = "KECAMATAN";
      sebaranWilayahTitle = "Sebaran Kasus per Kecamatan se-Kabupaten";

      const kecamatanList = await prisma.kecamatan.findMany({
        where: { aktif: true },
        select: { kd_kecamatan: true, nm_kecamatan: true },
        orderBy: { nm_kecamatan: "asc" },
      });

      const pengaduanKecamatan = await prisma.pengaduan.groupBy({
        by: ["kd_kecamatan"],
        where: baseWhere,
        _count: { id: true },
      });

      const kecCountMap = new Map(pengaduanKecamatan.map((k) => [k.kd_kecamatan, k._count.id]));

      sebaranWilayah = kecamatanList.map((kec) => ({
        id: kec.kd_kecamatan,
        nama: kec.nm_kecamatan,
        total: kecCountMap.get(kec.kd_kecamatan) || 0,
      }));
    }

    // 6. Pengaduan Terbaru Sesuai Wilayah
    const pengaduanTerbaru = await prisma.pengaduan.findMany({
      where: baseWhere,
      take: 6,
      orderBy: { tanggalPengaduan: "desc" },
      include: {
        bidang: true,
        jenisPengaduan: true,
        desa: true,
        kecamatan: true,
        posyandu: true,
        pelapor: {
          select: {
            nama: true,
            noHp: true,
          },
        },
      },
    });

    // 7. Hitung Resolution Rate (%)
    const totalSelesaiDanDitindak = selesai + ditindaklanjuti;
    const resolutionRate = total > 0 ? Math.round((selesai / total) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        userLevel: {
          role: currentUser?.role || "GUEST",
          nama: currentUser?.nama || "Petugas",
          kecamatanId: currentUser?.kecamatanId || null,
          kecamatanNama: currentUser?.kecamatan?.nm_kecamatan || null,
          desaId: currentUser?.desaId || null,
          desaNama: currentUser?.desa?.nm_desa || null,
          dinasId: currentUser?.dinasId || null,
          dinasNama: currentUser?.dinas?.nama || null,
          dinasKode: currentUser?.dinas?.kode || null,
        },
        periode,
        kpi: {
          total,
          menungguDesa,
          menungguKecamatan,
          menungguKabupaten,
          diteruskanKeDinas,
          ditindaklanjuti,
          selesai,
          perluPerbaikan,
          ditolak,
          totalMenungguVerifikasi: menungguDesa + menungguKecamatan + menungguKabupaten + diteruskanKeDinas,
          totalSelesaiDanDitindak,
          resolutionRate,
        },
        distribusiBidang,
        sebaranWilayah: {
          type: sebaranWilayahType,
          title: sebaranWilayahTitle,
          data: sebaranWilayah,
        },
        pengaduanTerbaru: pengaduanTerbaru.map((p) => ({
          id: p.id,
          nomorPengaduan: p.nomorPengaduan,
          tanggalPengaduan: p.tanggalPengaduan,
          pelapor: p.pelapor.nama,
          noHp: p.pelapor.noHp,
          bidang: p.bidang.nm_bidang,
          jenisPengaduan: p.jenisPengaduan.map((j) => j.nama),
          desa: p.desa.nm_desa,
          kecamatan: p.kecamatan.nm_kecamatan,
          posyandu: p.posyandu.nama_posyandu,
          status: p.status,
        })),
      },
    });
  } catch (error: any) {
    console.error("Error fetching admin dashboard:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat analitik dashboard admin", error: error.message },
      { status: 500 }
    );
  }
}
