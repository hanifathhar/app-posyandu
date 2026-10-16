import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { StatusPengaduan, TahapVerifikasi, JenisPeristiwa } from "@prisma/client";

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
        console.warn("Invalid JWT in pembatalan verifikasi");
      }
    }

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Pengguna tidak terautentikasi atau sesi login berakhir." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { pengaduanId, alasan } = body;

    if (!pengaduanId) {
      return NextResponse.json(
        { success: false, message: "ID pengaduan wajib diberikan." },
        { status: 400 }
      );
    }

    const pengaduan = await prisma.pengaduan.findUnique({
      where: { id: pengaduanId },
      include: {
        desa: true,
        kecamatan: true,
        tindakLanjut: true,
        verifikasi: { orderBy: { tanggal: "desc" } },
      },
    });

    if (!pengaduan) {
      return NextResponse.json(
        { success: false, message: "Data pengaduan tidak ditemukan." },
        { status: 404 }
      );
    }

    const currentStatus = pengaduan.status;

    // Evaluasi aturan pembatalan verifikasi berjenjang
    let statusSebelum = currentStatus;
    let statusSesudah: StatusPengaduan;
    let tahapYangDibatalkan: TahapVerifikasi;
    let keterangan = "";

    if (currentStatus === StatusPengaduan.MENUNGGU_VERIFIKASI_DESA || currentStatus === StatusPengaduan.BARU) {
      return NextResponse.json(
        {
          success: false,
          message: "Pengaduan masih berada pada tahap awal (belum ada keputusan verifikasi yang disetujui untuk dibatalkan).",
        },
        { status: 400 }
      );
    }

    if (currentStatus === StatusPengaduan.MENUNGGU_VERIFIKASI_KECAMATAN) {
      // Telah diverifikasi oleh Desa. Sedang menunggu Kecamatan.
      const isAuthorized =
        (currentUser.role === "ADMIN_DESA" && currentUser.desaId === pengaduan.kd_desa) ||
        currentUser.role === "ADMIN_KABUPATEN" ||
        currentUser.role === "SUPERADMIN";

      if (!isAuthorized) {
        if (currentUser.role === "ADMIN_DESA") {
          return NextResponse.json(
            { success: false, message: "Akses ditolak: Anda bukan Admin Desa asal pengaduan ini." },
            { status: 403 }
          );
        }
        return NextResponse.json(
          {
            success: false,
            message: "Akses ditolak: Hanya Admin Desa asal atau Admin Kabupaten/Superadmin yang dapat membatalkan verifikasi tahap Desa.",
          },
          { status: 403 }
        );
      }

      tahapYangDibatalkan = TahapVerifikasi.DESA;
      statusSesudah = StatusPengaduan.MENUNGGU_VERIFIKASI_DESA;
      keterangan = `Pembatalan verifikasi tahap Desa oleh ${currentUser.nama} (${currentUser.role}). Alasan: ${alasan?.trim() || "Koreksi data oleh verifikator"}`;
    } else if (currentStatus === StatusPengaduan.MENUNGGU_VERIFIKASI_KABUPATEN) {
      // Telah diverifikasi oleh Kecamatan. Sedang menunggu Kabupaten.
      if (currentUser.role === "ADMIN_DESA") {
        return NextResponse.json(
          {
            success: false,
            message: "Pembatalan harus dilakukan secara berjenjang: Verifikasi tahap Kecamatan harus dibatalkan terlebih dahulu oleh Admin Kecamatan sebelum Admin Desa dapat membatalkan verifikasi tahap Desa.",
          },
          { status: 403 }
        );
      }

      const isAuthorized =
        (currentUser.role === "ADMIN_KECAMATAN" && currentUser.kecamatanId === pengaduan.kd_kecamatan) ||
        currentUser.role === "ADMIN_KABUPATEN" ||
        currentUser.role === "SUPERADMIN";

      if (!isAuthorized) {
        return NextResponse.json(
          {
            success: false,
            message: "Akses ditolak: Hanya Admin Kecamatan asal pengaduan atau Admin Kabupaten/Superadmin yang dapat membatalkan verifikasi tahap Kecamatan.",
          },
          { status: 403 }
        );
      }

      tahapYangDibatalkan = TahapVerifikasi.KECAMATAN;
      statusSesudah = StatusPengaduan.MENUNGGU_VERIFIKASI_KECAMATAN;
      keterangan = `Pembatalan verifikasi tahap Kecamatan oleh ${currentUser.nama} (${currentUser.role}). Alasan: ${alasan?.trim() || "Koreksi data oleh verifikator kecamatan"}`;
    } else if (currentStatus === StatusPengaduan.DITINDAKLANJUTI || currentStatus === StatusPengaduan.DISETUJUI) {
      // Telah diverifikasi oleh Kabupaten / OPD Pengampu.
      if (currentUser.role === "ADMIN_DESA" || currentUser.role === "ADMIN_KECAMATAN") {
        return NextResponse.json(
          {
            success: false,
            message: "Pembatalan harus dilakukan secara berjenjang: Verifikasi tahap Kabupaten harus dibatalkan terlebih dahulu oleh Admin Kabupaten sebelum tahap sebelumnya dapat dibatalkan.",
          },
          { status: 403 }
        );
      }

      const isAuthorized = currentUser.role === "ADMIN_KABUPATEN" || currentUser.role === "SUPERADMIN";
      if (!isAuthorized) {
        return NextResponse.json(
          { success: false, message: "Akses ditolak: Hanya Admin Kabupaten atau Superadmin yang dapat membatalkan verifikasi tahap Kabupaten." },
          { status: 403 }
        );
      }

      tahapYangDibatalkan = TahapVerifikasi.KABUPATEN;
      statusSesudah = StatusPengaduan.MENUNGGU_VERIFIKASI_KABUPATEN;
      keterangan = `Pembatalan verifikasi tahap Kabupaten oleh ${currentUser.nama} (${currentUser.role}). Alasan: ${alasan?.trim() || "Koreksi verifikasi dinas"}`;
    } else if (currentStatus === StatusPengaduan.SELESAI) {
      // Superadmin atau Admin Kabupaten dapat membuka kembali pengaduan yang sudah Selesai
      const isAuthorized = currentUser.role === "ADMIN_KABUPATEN" || currentUser.role === "SUPERADMIN";
      if (!isAuthorized) {
        return NextResponse.json(
          {
            success: false,
            message: "Akses ditolak: Hanya Superadmin atau Admin Kabupaten yang dapat membatalkan status SELESAI dan membuka kembali kasus ini.",
          },
          { status: 403 }
        );
      }

      tahapYangDibatalkan = TahapVerifikasi.KABUPATEN;
      statusSesudah =
        pengaduan.tindakLanjut && pengaduan.tindakLanjut.length > 0
          ? StatusPengaduan.DITINDAKLANJUTI
          : StatusPengaduan.MENUNGGU_VERIFIKASI_KABUPATEN;

      keterangan = `Pembatalan status SELESAI (buka kembali kasus) oleh ${currentUser.nama} (${currentUser.role}). Alasan: ${alasan?.trim() || "Kasus dibuka kembali untuk peninjauan / tindak lanjut ulang"}`;
    } else if (currentStatus === StatusPengaduan.DITOLAK || currentStatus === StatusPengaduan.PERLU_PERBAIKAN) {
      // Pembatalan penolakan atau perbaikan untuk dikembalikan ke verifikasi tahap terkait
      const latestVerif = pengaduan.verifikasi[0];
      const targetTahap = latestVerif?.tahap || TahapVerifikasi.DESA;

      if (currentUser.role !== "SUPERADMIN") {
        if (targetTahap === TahapVerifikasi.DESA) {
          if (currentUser.role === "ADMIN_DESA" && currentUser.desaId !== pengaduan.kd_desa) {
            return NextResponse.json(
              { success: false, message: "Akses ditolak: Anda bukan Admin Desa asal pengaduan ini." },
              { status: 403 }
            );
          }
          if (currentUser.role !== "ADMIN_DESA" && currentUser.role !== "ADMIN_KABUPATEN") {
            return NextResponse.json(
              { success: false, message: "Akses ditolak: Tidak memiliki wewenang membatalkan keputusan verifikasi tahap Desa." },
              { status: 403 }
            );
          }
        } else if (targetTahap === TahapVerifikasi.KECAMATAN) {
          if (currentUser.role === "ADMIN_KECAMATAN" && currentUser.kecamatanId !== pengaduan.kd_kecamatan) {
            return NextResponse.json(
              { success: false, message: "Akses ditolak: Anda bukan Admin Kecamatan asal pengaduan ini." },
              { status: 403 }
            );
          }
          if (currentUser.role !== "ADMIN_KECAMATAN" && currentUser.role !== "ADMIN_KABUPATEN") {
            return NextResponse.json(
              { success: false, message: "Akses ditolak: Tidak memiliki wewenang membatalkan keputusan verifikasi tahap Kecamatan." },
              { status: 403 }
            );
          }
        } else if (targetTahap === TahapVerifikasi.KABUPATEN) {
          if (currentUser.role !== "ADMIN_KABUPATEN") {
            return NextResponse.json(
              { success: false, message: "Akses ditolak: Hanya Admin Kabupaten atau Superadmin yang dapat membatalkan keputusan tahap Kabupaten." },
              { status: 403 }
            );
          }
        }
      }

      tahapYangDibatalkan = targetTahap;

      if (targetTahap === TahapVerifikasi.DESA) {
        statusSesudah = StatusPengaduan.MENUNGGU_VERIFIKASI_DESA;
      } else if (targetTahap === TahapVerifikasi.KECAMATAN) {
        statusSesudah = StatusPengaduan.MENUNGGU_VERIFIKASI_KECAMATAN;
      } else {
        statusSesudah = StatusPengaduan.MENUNGGU_VERIFIKASI_KABUPATEN;
      }

      keterangan = `Pembatalan status ${currentStatus} tahap ${targetTahap} oleh ${currentUser.nama} (${currentUser.role}). Alasan: ${alasan?.trim() || "Peninjauan ulang"}`;
    } else {
      return NextResponse.json(
        { success: false, message: `Status ${currentStatus} tidak dapat dibatalkan verifikasinya.` },
        { status: 400 }
      );
    }

    // Cari ID record verifikasi terakhir dari tahap yang dibatalkan
    const latestVerifRecord = pengaduan.verifikasi.find((v) => v.tahap === tahapYangDibatalkan);

    // Jalankan transaksi database:
    // 1. Hapus record verifikasi yang dibatalkan (jika bukan SELESAI, karena SELESAI adalah status tindak lanjut, verifikasinya tetap ada)
    // 2. Update status pengaduan kembali ke tahap sebelumnya (jika SELESAI, reset tanggalSelesai dan hasilPenyelesaian)
    // 3. Catat audit riwayatStatus
    await prisma.$transaction(async (tx) => {
      if (latestVerifRecord && currentStatus !== StatusPengaduan.SELESAI) {
        await tx.verifikasiPengaduan.delete({
          where: { id: latestVerifRecord.id },
        });
      }

      await tx.pengaduan.update({
        where: { id: pengaduanId },
        data: {
          status: statusSesudah,
          tanggalSelesai: currentStatus === StatusPengaduan.SELESAI ? null : undefined,
          tanggalDisetujui: statusSesudah === StatusPengaduan.MENUNGGU_VERIFIKASI_DESA ? null : pengaduan.tanggalDisetujui,
          catatan: alasan?.trim() ? `[Dibatalkan]: ${alasan.trim()}` : pengaduan.catatan,
          riwayatStatus: {
            create: {
              penggunaId: currentUser.id,
              peristiwa: JenisPeristiwa.STATUS_DIUBAH,
              statusSebelum,
              statusSesudah,
              keterangan,
            },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message:
        currentStatus === StatusPengaduan.SELESAI
          ? `Status SELESAI berhasil dibatalkan dan kasus dibuka kembali. Status pengaduan kini: ${statusSesudah}.`
          : `Verifikasi tahap ${tahapYangDibatalkan} berhasil dibatalkan. Status pengaduan kini kembali ke: ${statusSesudah}.`,
      data: {
        id: pengaduan.id,
        nomorPengaduan: pengaduan.nomorPengaduan,
        status: statusSesudah,
      },
    });
  } catch (error: any) {
    console.error("Error in pembatalan verifikasi:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membatalkan verifikasi: " + error.message },
      { status: 500 }
    );
  }
}
