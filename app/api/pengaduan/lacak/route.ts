import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || searchParams.get("nomor")?.trim() || searchParams.get("token")?.trim();

    if (!query) {
      return NextResponse.json(
        { success: false, message: "Nomor pengaduan atau token pelacakan wajib diisi." },
        { status: 400 }
      );
    }

    // Cari berdasarkan nomorPengaduan atau tokenPelacakan (case-insensitive)
    const pengaduan = await prisma.pengaduan.findFirst({
      where: {
        OR: [
          { nomorPengaduan: { equals: query, mode: "insensitive" } },
          { tokenPelacakan: { equals: query, mode: "insensitive" } },
        ],
      },
      include: {
        bidang: true,
        jenisPengaduan: true,
        desa: true,
        kecamatan: true,
        posyandu: true,
        pelapor: {
          select: {
            nama: true,
            alamat: true,
            // Mask nomor HP for privacy
            noHp: true,
          },
        },
        riwayatStatus: {
          orderBy: { tanggal: "desc" },
          select: {
            id: true,
            peristiwa: true,
            statusSebelum: true,
            statusSesudah: true,
            keterangan: true,
            tanggal: true,
          },
        },
        verifikasi: {
          orderBy: { tanggal: "desc" },
          select: {
            tahap: true,
            keputusan: true,
            catatan: true,
            tanggal: true,
            putaran: true,
          },
        },
        tindakLanjut: {
          orderBy: { tanggal: "desc" },
          select: {
            jenis: true,
            uraian: true,
            hasil: true,
            tanggal: true,
          },
        },
      },
    });

    if (!pengaduan) {
      return NextResponse.json(
        {
          success: false,
          message: "Data pengaduan tidak ditemukan. Pastikan Nomor Pengaduan atau Token Pelacakan sudah sesuai.",
        },
        { status: 404 }
      );
    }

    // Mask phone number: 0812****7890
    const rawHp = pengaduan.pelapor.noHp || "";
    const maskedHp = rawHp.length > 6 ? rawHp.slice(0, 4) + "****" + rawHp.slice(-4) : rawHp;

    return NextResponse.json({
      success: true,
      data: {
        nomorPengaduan: pengaduan.nomorPengaduan,
        tokenPelacakan: pengaduan.tokenPelacakan,
        tanggalPengaduan: pengaduan.tanggalPengaduan,
        status: pengaduan.status,
        alasanPenolakan: pengaduan.alasanPenolakan,
        catatan: pengaduan.catatan,
        tahapPerbaikanKe: pengaduan.tahapPerbaikanKe,
        hasilPenyelesaian: pengaduan.hasilPenyelesaian,
        tanggalDisetujui: pengaduan.tanggalDisetujui,
        tanggalSelesai: pengaduan.tanggalSelesai,
        bidang: {
          kode: pengaduan.bidang.kode,
          nama: pengaduan.bidang.nm_bidang,
        },
        jenisPengaduan: pengaduan.jenisPengaduan.map((j) => j.nama),
        lokasi: {
          posyandu: pengaduan.posyandu.nama_posyandu,
          desa: pengaduan.desa.nm_desa,
          kecamatan: pengaduan.kecamatan.nm_kecamatan,
        },
        pelapor: {
          nama: pengaduan.pelapor.nama,
          noHpMasked: maskedHp,
          alamat: pengaduan.pelapor.alamat,
        },
        deskripsi: pengaduan.deskripsi,
        riwayat: pengaduan.riwayatStatus,
        verifikasi: pengaduan.verifikasi,
        tindakLanjut: pengaduan.tindakLanjut,
      },
    });
  } catch (error: any) {
    console.error("Error tracking pengaduan:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat mencari status pengaduan", error: error.message },
      { status: 500 }
    );
  }
}
