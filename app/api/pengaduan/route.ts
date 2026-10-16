import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatusPengaduan, JenisPeristiwa, JenisDokumen } from "@prisma/client";

function generateTrackingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "TRK-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      nama,
      nik,
      noHp,
      alamat,
      kd_kecamatan,
      kd_desa,
      posyanduId,
      bidangId,
      jenisPengaduanIds, // Array of IDs
      jenisPengaduanId,  // Fallback single ID
      deskripsi,
      dokumen,
    } = body;

    // Normalisasi jenisPengaduanIds
    let selectedJenisIds: string[] = [];
    if (Array.isArray(jenisPengaduanIds) && jenisPengaduanIds.length > 0) {
      selectedJenisIds = jenisPengaduanIds;
    } else if (jenisPengaduanId) {
      selectedJenisIds = [jenisPengaduanId];
    }

    // Validasi input utama
    if (!nama || !noHp || !alamat || !kd_kecamatan || !kd_desa || !posyanduId || !bidangId || selectedJenisIds.length === 0 || !deskripsi) {
      return NextResponse.json(
        { success: false, message: "Semua field bertanda bintang wajib diisi, termasuk minimal satu kategori masalah SPM." },
        { status: 400 }
      );
    }

    if (deskripsi.trim().length < 15) {
      return NextResponse.json(
        { success: false, message: "Uraian pengaduan minimal 15 karakter agar informasi jelas." },
        { status: 400 }
      );
    }

    // 1. Simpan atau Temukan Data Pelapor
    let pelapor;
    const cleanNik = nik?.trim() ? nik.trim() : null;

    if (cleanNik) {
      pelapor = await prisma.pelapor.findUnique({
        where: { nik: cleanNik },
      });

      if (pelapor) {
        pelapor = await prisma.pelapor.update({
          where: { id: pelapor.id },
          data: {
            nama: nama.trim(),
            noHp: noHp.trim(),
            alamat: alamat.trim(),
            kd_kecamatan,
            kd_desa,
          },
        });
      } else {
        pelapor = await prisma.pelapor.create({
          data: {
            nama: nama.trim(),
            nik: cleanNik,
            noHp: noHp.trim(),
            alamat: alamat.trim(),
            kd_kecamatan,
            kd_desa,
          },
        });
      }
    } else {
      pelapor = await prisma.pelapor.create({
        data: {
          nama: nama.trim(),
          noHp: noHp.trim(),
          alamat: alamat.trim(),
          kd_kecamatan,
          kd_desa,
        },
      });
    }

    // 2. Generate Nomor Pengaduan Unik
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const nomorPengaduan = `SPM-${dateStr}-${randomSuffix}`;

    // 3. Generate Token Pelacakan Unik
    let tokenPelacakan = generateTrackingCode();
    let isTokenExists = await prisma.pengaduan.findUnique({ where: { tokenPelacakan } });
    while (isTokenExists) {
      tokenPelacakan = generateTrackingCode();
      isTokenExists = await prisma.pengaduan.findUnique({ where: { tokenPelacakan } });
    }

    // 4. Siapkan dokumen pendukung jika ada
    const dokumenData = Array.isArray(dokumen)
      ? dokumen.map((d: any) => ({
          jenis: (d.jenis as JenisDokumen) || JenisDokumen.DOKUMEN_LAINNYA,
          namaFile: d.namaFile || "Lampiran",
          pathFile: d.pathFile || "",
          mimeType: d.mimeType || null,
          ukuranFile: d.ukuranFile ? parseInt(d.ukuranFile) : null,
        }))
      : [];

    // 5. Simpan Pengaduan & Hubungkan Multiple JenisPengaduan
    const pengaduan = await prisma.pengaduan.create({
      data: {
        nomorPengaduan,
        tokenPelacakan,
        pelaporId: pelapor.id,
        bidangId,
        jenisPengaduan: {
          connect: selectedJenisIds.map((id) => ({ id })),
        },
        kd_kecamatan,
        kd_desa,
        posyanduId,
        deskripsi: deskripsi.trim(),
        status: StatusPengaduan.MENUNGGU_VERIFIKASI_DESA,
        dokumen: {
          create: dokumenData,
        },
        riwayatStatus: {
          create: {
            peristiwa: JenisPeristiwa.PENGADUAN_DIBUAT,
            statusSebelum: null,
            statusSesudah: StatusPengaduan.MENUNGGU_VERIFIKASI_DESA,
            keterangan: "Pengaduan berhasil diajukan oleh masyarakat secara online.",
          },
        },
      },
      include: {
        bidang: true,
        jenisPengaduan: true,
        desa: true,
        kecamatan: true,
        posyandu: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pengaduan berhasil diajukan dan sedang diteruskan ke Verifikator Desa.",
      data: {
        id: pengaduan.id,
        nomorPengaduan: pengaduan.nomorPengaduan,
        tokenPelacakan: pengaduan.tokenPelacakan,
        tanggalPengaduan: pengaduan.tanggalPengaduan,
        status: pengaduan.status,
        bidang: pengaduan.bidang.nm_bidang,
        jenisPengaduan: pengaduan.jenisPengaduan.map((j) => j.nama),
        posyandu: pengaduan.posyandu.nama_posyandu,
        desa: pengaduan.desa.nm_desa,
        kecamatan: pengaduan.kecamatan.nm_kecamatan,
      },
    });
  } catch (error: any) {
    console.error("Error creating pengaduan:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat memproses pengaduan", error: error.message },
      { status: 500 }
    );
  }
}
