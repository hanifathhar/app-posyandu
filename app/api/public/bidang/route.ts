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

    // Urutkan jenis pengaduan agar opsi 'Lainnya' selalu berada di urutan paling akhir
    const sortedData = bidangList.map((b) => ({
      ...b,
      jenis: [...b.jenis].sort((a, b) => {
        const isALainnya = /lainnya|lain-lain/i.test(a.nama.trim());
        const isBLainnya = /lainnya|lain-lain/i.test(b.nama.trim());
        if (isALainnya && !isBLainnya) return 1;
        if (!isALainnya && isBLainnya) return -1;
        return a.nama.localeCompare(b.nama, "id");
      }),
    }));

    return NextResponse.json({ success: true, data: sortedData });
  } catch (error: any) {
    console.error("Error fetching bidang:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data Bidang SPM", error: error.message },
      { status: 500 }
    );
  }
}
