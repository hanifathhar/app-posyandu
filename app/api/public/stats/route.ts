import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [kecamatan, desa, posyandu, bidang] = await Promise.all([
      prisma.kecamatan.count({ where: { aktif: true } }),
      prisma.desa.count({ where: { aktif: true } }),
      prisma.posyandu.count({ where: { aktif: true } }),
      prisma.bidang.count({ where: { aktif: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        kecamatan,
        desa,
        posyandu,
        bidang,
      },
    });
  } catch (error: any) {
    console.error("Error fetching public stats:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data statistik", error: error.message },
      { status: 500 }
    );
  }
}
