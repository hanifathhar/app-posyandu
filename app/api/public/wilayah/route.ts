import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kd_kecamatan = searchParams.get("kd_kecamatan");
    const kd_desa = searchParams.get("kd_desa");

    const all_desa = searchParams.get("all_desa");

    // Jika parameter all_desa diberikan, ambil semua Desa aktif
    if (all_desa === "true") {
      const desas = await prisma.desa.findMany({
        where: { aktif: true },
        orderBy: [{ kd_kecamatan: "asc" }, { nm_desa: "asc" }],
        select: {
          kd_desa: true,
          nm_desa: true,
          kd_kecamatan: true,
        },
      });
      return NextResponse.json({ success: true, data: desas });
    }

    // Jika parameter kd_desa diberikan, ambil Posyandu
    if (kd_desa) {
      const posyandus = await prisma.posyandu.findMany({
        where: { kd_desa, aktif: true },
        orderBy: { nama_posyandu: "asc" },
        select: {
          id: true,
          nama_posyandu: true,
          alamat: true,
          kd_desa: true,
          kd_kecamatan: true,
        },
      });
      return NextResponse.json({ success: true, data: posyandus });
    }

    // Jika parameter kd_kecamatan diberikan, ambil Desa
    if (kd_kecamatan) {
      const desas = await prisma.desa.findMany({
        where: { kd_kecamatan, aktif: true },
        orderBy: { nm_desa: "asc" },
        select: {
          kd_desa: true,
          nm_desa: true,
          kd_kecamatan: true,
        },
      });
      return NextResponse.json({ success: true, data: desas });
    }

    // Default: Ambil semua Kecamatan
    const kecamatans = await prisma.kecamatan.findMany({
      where: { aktif: true },
      orderBy: { nm_kecamatan: "asc" },
      select: {
        kd_kecamatan: true,
        nm_kecamatan: true,
      },
    });

    return NextResponse.json({ success: true, data: kecamatans });
  } catch (error: any) {
    console.error("Error fetching wilayah:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data wilayah", error: error.message },
      { status: 500 }
    );
  }
}
