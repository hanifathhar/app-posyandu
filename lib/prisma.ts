// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// Pastikan instance prisma di-refresh jika skema baru (seperti model dinas) baru ditambahkan
const isClientValid = globalForPrisma.prisma && "dinas" in (globalForPrisma.prisma as any);

export const prisma =
  (isClientValid ? globalForPrisma.prisma : undefined) ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

