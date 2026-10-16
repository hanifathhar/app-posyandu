import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.pengaduan.count();
  console.log("Total Pengaduan SPM:", count);

  const pengaduanList = await prisma.pengaduan.findMany({
    take: 5,
    include: {
      bidang: true,
      desa: true,
      kecamatan: true,
      posyandu: true,
    },
  });

  for (const p of pengaduanList) {
    console.log(`[${p.nomorPengaduan}] ${p.bidang.nm_bidang} - ${p.desa.nm_desa}, Kec. ${p.kecamatan.nm_kecamatan} (${p.status})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
