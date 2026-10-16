import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const bidangList = await prisma.bidang.findMany({
      where: { aktif: true },
      orderBy: { kode: "asc" },
      include: {
        jenis: {
          where: { aktif: true },
          orderBy: { nama: "asc" },
          select: {
            id: true,
            nama: true,
            deskripsi: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: bidangList });
  } catch (error: any) {
    console.error("Error fetching bidang:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data Bidang SPM", error: error.message },
      { status: 500 }
    );
  }
}
