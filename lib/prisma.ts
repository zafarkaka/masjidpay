import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// If running in Vercel / serverless environment with SQLite, ensure DB is in writable /tmp
if (process.env.VERCEL) {
  const tmpDbPath = '/tmp/dev.db';
  const projectDbPath = path.join(process.cwd(), 'prisma', 'dev.db');

  if (!fs.existsSync(tmpDbPath)) {
    if (fs.existsSync(projectDbPath)) {
      try {
        fs.copyFileSync(projectDbPath, tmpDbPath);
      } catch (e) {
        console.warn('Could not copy project DB to /tmp:', e);
      }
    }
  }
  process.env.DATABASE_URL = `file:${tmpDbPath}`;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
