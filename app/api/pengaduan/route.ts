import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatusPengaduan, JenisPeristiwa, JenisDokumen } from "@prisma/client";
import {
  containsSqlInjection,
  sanitizeString,
  validateNik,
  validatePhone,
  validateIdFormat,
  scanBase64Upload,
} from "@/lib/security";

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
      jumlahTanggungan,
      penghasilan,
      kd_kecamatan,
      kd_desa,
      posyanduId,
      bidangId,
      jenisPengaduanIds, // Array of IDs
      jenisPengaduanId,  // Fallback single ID
      deskripsi,
      dokumen,
    } = body;

    // 1. CEK KEAMANAN DARI SQL INJECTION
    if (
      containsSqlInjection(nama) ||
      containsSqlInjection(nik || "") ||
      containsSqlInjection(noHp) ||
      containsSqlInjection(alamat) ||
      containsSqlInjection(deskripsi) ||
      containsSqlInjection(penghasilan || "")
    ) {
      console.warn("[SECURITY ALERT] Percobaan SQL Injection terdeteksi pada form pengaduan.");
      return NextResponse.json(
        {
          success: false,
          message: "Permintaan ditolak: Terdeteksi pola karakter atau perintah tidak sah (SQL Injection).",
        },
        { status: 400 }
      );
    }

    // Normalisasi jenisPengaduanIds
    let selectedJenisIds: string[] = [];
    if (Array.isArray(jenisPengaduanIds) && jenisPengaduanIds.length > 0) {
      selectedJenisIds = jenisPengaduanIds;
    } else if (jenisPengaduanId) {
      selectedJenisIds = [jenisPengaduanId];
    }

    // Validasi input wajib
    if (
      !nama ||
      !noHp ||
      !alamat ||
      jumlahTanggungan === undefined ||
      jumlahTanggungan === null ||
      jumlahTanggungan === "" ||
      !penghasilan ||
      !kd_kecamatan ||
      !kd_desa ||
      !posyanduId ||
      !bidangId ||
      selectedJenisIds.length === 0 ||
      !deskripsi
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Semua field bertanda bintang wajib diisi, termasuk jumlah tanggungan, penghasilan, dan minimal satu kategori masalah SPM.",
        },
        { status: 400 }
      );
    }

    if (deskripsi.trim().length < 15) {
      return NextResponse.json(
        { success: false, message: "Uraian pengaduan minimal 15 karakter agar informasi jelas." },
        { status: 400 }
      );
    }

    // 2. VALIDASI & SANITASI DATA INPUT
    const cleanNama = sanitizeString(nama, 100);
    const cleanAlamat = sanitizeString(alamat, 500);
    const cleanDeskripsi = sanitizeString(deskripsi, 5000);

    // Validasi & Sanitasi Jumlah Tanggungan
    const parsedTanggungan = parseInt(String(jumlahTanggungan), 10);
    if (isNaN(parsedTanggungan) || parsedTanggungan < 0 || parsedTanggungan > 50) {
      return NextResponse.json(
        { success: false, message: "Jumlah tanggungan harus berupa angka valid (minimal 0)." },
        { status: 400 }
      );
    }

    // Validasi Pilihan Penghasilan
    const ALLOWED_PENGHASILAN = [
      "< 1 jt /bulan",
      "1 jt s/d. 2.5 juta",
      "2.6 jt sd 5 jt",
      "> 5 jt",
      "< 1 juta",
      "1 juta s/d. 2.5 juta",
      "2.6 juta sd 5 juta",
      "> 5 juta",
    ];
    const cleanPenghasilan = String(penghasilan).trim();
    if (!ALLOWED_PENGHASILAN.includes(cleanPenghasilan)) {
      return NextResponse.json(
        { success: false, message: "Pilihan rentang penghasilan tidak valid." },
        { status: 400 }
      );
    }

    // Validasi NIK jika diisi
    const nikCheck = validateNik(nik);
    if (!nikCheck.isValid) {
      return NextResponse.json({ success: false, message: nikCheck.error }, { status: 400 });
    }
    const cleanNik = nikCheck.cleaned;

    // Validasi Nomor HP
    const phoneCheck = validatePhone(noHp);
    if (!phoneCheck.isValid) {
      return NextResponse.json({ success: false, message: phoneCheck.error }, { status: 400 });
    }
    const cleanNoHp = phoneCheck.cleaned;

    // Validasi Format ID / Kode Wilayah
    const checkKec = validateIdFormat(kd_kecamatan, "Kecamatan");
    if (!checkKec.isValid) return NextResponse.json({ success: false, message: checkKec.error }, { status: 400 });

    const checkDesa = validateIdFormat(kd_desa, "Desa");
    if (!checkDesa.isValid) return NextResponse.json({ success: false, message: checkDesa.error }, { status: 400 });

    const checkPos = validateIdFormat(posyanduId, "Posyandu");
    if (!checkPos.isValid) return NextResponse.json({ success: false, message: checkPos.error }, { status: 400 });

    const checkBid = validateIdFormat(bidangId, "Bidang SPM");
    if (!checkBid.isValid) return NextResponse.json({ success: false, message: checkBid.error }, { status: 400 });

    for (const id of selectedJenisIds) {
      const checkJ = validateIdFormat(id, "Kategori Masalah SPM");
      if (!checkJ.isValid) return NextResponse.json({ success: false, message: checkJ.error }, { status: 400 });
    }

    // 3. PINDAI FILE UPLOAD SECARA KETAT (Cegah File Executable & Berbahaya)
    const dokumenData = [];
    if (Array.isArray(dokumen)) {
      if (dokumen.length > 5) {
        return NextResponse.json(
          { success: false, message: "Maksimal 5 dokumen/foto lampiran per pengaduan." },
          { status: 400 }
        );
      }

      for (const d of dokumen) {
        if (!d.pathFile) continue;

        // Pindai Magic Bytes & Ekstensi
        const scanResult = scanBase64Upload(d.pathFile, d.namaFile || "Lampiran");
        if (!scanResult.isSafe) {
          console.warn(`[SECURITY ALERT] File ditolak: ${d.namaFile} - Alasan: ${scanResult.reason}`);
          return NextResponse.json(
            {
              success: false,
              message: `Dokumen '${d.namaFile || "Lampiran"}' ditolak: ${scanResult.reason}`,
            },
            { status: 400 }
          );
        }

        dokumenData.push({
          jenis: (d.jenis as JenisDokumen) || JenisDokumen.DOKUMEN_LAINNYA,
          namaFile: scanResult.sanitizedName || "Lampiran",
          pathFile: d.pathFile,
          mimeType: scanResult.mimeType || d.mimeType || null,
          ukuranFile: scanResult.bufferSize || (d.ukuranFile ? parseInt(d.ukuranFile) : null),
        });
      }
    }

    // 4. Simpan atau Temukan Data Pelapor (Prepared Statements via Prisma)
    let pelapor;
    if (cleanNik) {
      pelapor = await prisma.pelapor.findUnique({
        where: { nik: cleanNik },
      });

      if (pelapor) {
        pelapor = await prisma.pelapor.update({
          where: { id: pelapor.id },
          data: {
            nama: cleanNama,
            noHp: cleanNoHp,
            alamat: cleanAlamat,
            jumlahTanggungan: parsedTanggungan,
            penghasilan: cleanPenghasilan,
            kd_kecamatan,
            kd_desa,
          },
        });
      } else {
        pelapor = await prisma.pelapor.create({
          data: {
            nama: cleanNama,
            nik: cleanNik,
            noHp: cleanNoHp,
            alamat: cleanAlamat,
            jumlahTanggungan: parsedTanggungan,
            penghasilan: cleanPenghasilan,
            kd_kecamatan,
            kd_desa,
          },
        });
      }
    } else {
      pelapor = await prisma.pelapor.create({
        data: {
          nama: cleanNama,
          noHp: cleanNoHp,
          alamat: cleanAlamat,
          jumlahTanggungan: parsedTanggungan,
          penghasilan: cleanPenghasilan,
          kd_kecamatan,
          kd_desa,
        },
      });
    }

    // 5. Generate Nomor Pengaduan Unik
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const nomorPengaduan = `SPM-${dateStr}-${randomSuffix}`;

    // 6. Generate Token Pelacakan Unik
    let tokenPelacakan = generateTrackingCode();
    let isTokenExists = await prisma.pengaduan.findUnique({ where: { tokenPelacakan } });
    while (isTokenExists) {
      tokenPelacakan = generateTrackingCode();
      isTokenExists = await prisma.pengaduan.findUnique({ where: { tokenPelacakan } });
    }

    // 7. Simpan Pengaduan & Hubungkan Multiple JenisPengaduan
    const pengaduan = await prisma.pengaduan.create({
      data: {
        nomorPengaduan,
        tokenPelacakan,
        pelaporId: pelapor.id,
        bidangId,
        jumlahTanggungan: parsedTanggungan,
        penghasilan: cleanPenghasilan,
        jenisPengaduan: {
          connect: selectedJenisIds.map((id) => ({ id })),
        },
        kd_kecamatan,
        kd_desa,
        posyanduId,
        deskripsi: cleanDeskripsi,
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
