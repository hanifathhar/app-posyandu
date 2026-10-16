import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-super-aman";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("cookie")?.split("token=")[1]?.split(";")[0];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const pengguna = await prisma.pengguna.findUnique({
      where: { id: decoded.id },
      include: {
        kecamatan: true,
        desa: true,
      },
    });

    if (!pengguna) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: pengguna.id,
        nama: pengguna.nama,
        username: pengguna.username,
        role: pengguna.role,
        aktif: pengguna.aktif,
        kecamatanId: pengguna.kecamatanId,
        desaId: pengguna.desaId,
        kecamatan: pengguna.kecamatan ? { kd_kecamatan: pengguna.kecamatan.kd_kecamatan, nm_kecamatan: pengguna.kecamatan.nm_kecamatan } : null,
        desa: pengguna.desa ? { kd_desa: pengguna.desa.kd_desa, nm_desa: pengguna.desa.nm_desa } : null,
      },
    });
  } catch (error) {
    console.error("Auth check failed:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
