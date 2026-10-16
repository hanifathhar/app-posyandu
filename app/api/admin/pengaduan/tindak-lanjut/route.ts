import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { StatusPengaduan, JenisTindakLanjut, JenisPeristiwa } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-super-aman";

export async function POST(request: Request) {
  try {
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
        console.warn("Invalid JWT in tindak-lanjut");
      }
    }

    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Pengguna tidak terautentikasi atau sesi login berakhir." }, { status: 401 });
    }

    const penggunaId = currentUser.id;

    const body = await request.json();
    const { pengaduanId, jenis, uraian, hasil, tandaiSelesai } = body;

    if (!pengaduanId || !jenis || !uraian) {
      return NextResponse.json(
        { success: false, message: "Pengaduan ID, Jenis Tindak Lanjut, dan Uraian wajib diisi." },
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

    // Otorisasi Wilayah
    if (currentUser.role === "ADMIN_DESA" && (!currentUser.desaId || pengaduan.kd_desa !== currentUser.desaId)) {
      return NextResponse.json(
        { success: false, message: `Akses ditolak: Anda hanya berwenang menindaklanjuti pengaduan di Desa ${currentUser.desa?.nm_desa || currentUser.desaId}.` },
        { status: 403 }
      );
    }
    if (currentUser.role === "ADMIN_KECAMATAN" && (!currentUser.kecamatanId || pengaduan.kd_kecamatan !== currentUser.kecamatanId)) {
      return NextResponse.json(
        { success: false, message: `Akses ditolak: Anda hanya berwenang menindaklanjuti pengaduan di Kecamatan ${currentUser.kecamatan?.nm_kecamatan || currentUser.kecamatanId}.` },
        { status: 403 }
      );
    }

    const statusSebelum = pengaduan.status;
    const statusSesudah = tandaiSelesai ? StatusPengaduan.SELESAI : StatusPengaduan.DITINDAKLANJUTI;

    // Simpan tindak lanjut dalam transaksi
    const result = await prisma.$transaction(async (tx) => {
      // 1. Simpan catatan tindak lanjut
      const tl = await tx.tindakLanjut.create({
        data: {
          pengaduanId,
          jenis: jenis as JenisTindakLanjut,
          uraian,
          hasil: hasil || null,
          petugasId: penggunaId,
          tanggal: new Date(),
        },
      });

      // 2. Update status pengaduan
      await tx.pengaduan.update({
        where: { id: pengaduanId },
        data: {
          status: statusSesudah,
          tanggalSelesai: tandaiSelesai ? new Date() : pengaduan.tanggalSelesai,
          hasilPenyelesaian: hasil ? (pengaduan.hasilPenyelesaian ? `${pengaduan.hasilPenyelesaian}\n${hasil}` : hasil) : pengaduan.hasilPenyelesaian,
        },
      });

      // 3. Catat audit riwayat
      await tx.riwayatPengaduan.create({
        data: {
          pengaduanId,
          penggunaId,
          peristiwa: tandaiSelesai ? JenisPeristiwa.PENGADUAN_DISELESAIKAN : JenisPeristiwa.TINDAK_LANJUT,
          statusSebelum,
          statusSesudah,
          keterangan: `Tindak Lanjut [${jenis}]: ${uraian}. Hasil: ${hasil || "Dalam pemantauan"}`,
        },
      });

      return tl;
    });

    return NextResponse.json({
      success: true,
      message: tandaiSelesai
        ? "Tindak lanjut berhasil dicatat dan pengaduan telah diselesaikan!"
        : "Tindak lanjut berhasil dicatat.",
      data: result,
    });
  } catch (error: any) {
    console.error("Error in tindak-lanjut:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server: " + error.message },
      { status: 500 }
    );
  }
}
