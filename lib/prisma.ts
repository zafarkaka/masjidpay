import { PrismaClient } from '@prisma/client';
import { ensureDatabaseTables } from './db-init';

const globalForPrisma = global as unknown as { prisma: PrismaClient; dbInitialized: boolean };

// If running in Vercel with SQLite file, ensure writable /tmp
if (process.env.VERCEL && process.env.DATABASE_URL?.startsWith('file:')) {
  const tmpDbPath = '/tmp/dev.db';
  process.env.DATABASE_URL = `file:${tmpDbPath}`;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Auto-bootstrap tables on cold start
if (!globalForPrisma.dbInitialized) {
  globalForPrisma.dbInitialized = true;
  ensureDatabaseTables(prisma).catch((err) => console.warn('Prisma DB init notice:', err));
}
