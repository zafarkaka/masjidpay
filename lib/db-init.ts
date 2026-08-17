import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SCHEMA_SQL } from './schema-sql';

let isInitialized = false;

export async function ensureDatabaseTables(prisma: PrismaClient) {
  if (isInitialized) return;
  isInitialized = true;

  try {
    const isPostgres = process.env.DATABASE_URL?.startsWith('postgres');

    // 1. Only execute SQLite DDL when using local SQLite
    if (!isPostgres) {
      for (const sql of SCHEMA_SQL) {
        try {
          await prisma.$executeRawUnsafe(sql);
        } catch (err: any) {
          // Table may already exist
        }
      }

      // Create indices if missing on SQLite
      try {
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Masjid_slug_key" ON "Masjid"("slug")`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "OtpVerification_email_key" ON "OtpVerification"("email")`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Receipt_receiptNo_key" ON "Receipt"("receiptNo")`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "MasjidUser_masjidId_userId_key" ON "MasjidUser"("masjidId", "userId")`);
      } catch (e) {
        // ignore
      }
    }

    // 2. Seed default Super Admin and Approved Masjid if completely empty
    const userCount = await prisma.user.count().catch(() => -1);
    if (userCount === 0) {
      const superAdminPassword = await bcrypt.hash('admin123', 10);
      const superAdmin = await prisma.user.create({
        data: {
          name: 'Platform Super Admin',
          email: 'admin@masjidpay.org',
          password: superAdminPassword,
          role: 'SUPER_ADMIN',
          mustChangePassword: false,
        },
      }).catch(() => null);

      const jamaMasjid = await prisma.masjid.create({
        data: {
          name: 'Jama Masjid Vaniyambadi',
          slug: 'jama-masjid',
          address: 'Fort Main Road',
          city: 'Vaniyambadi',
          state: 'Tamil Nadu',
          country: 'IN',
          zipCode: '635751',
          phone: '+91 98765 43210',
          email: 'admin@jamamasjid.org',
          website: 'https://jamamasjidvaniyambadi.org',
          status: 'APPROVED',
          openingBalance: 6500,
          currency: 'INR',
          financialYear: '2026-2027',
          bankName: 'State Bank of India',
          bankAccNo: '38920194821',
          bankIfsc: 'SBIN0000982',
          upiId: 'jamamasjid@sbi',
        },
      }).catch(() => null);

      if (jamaMasjid && superAdmin) {
        const adminPassword = await bcrypt.hash('password123', 10);
        const masjidAdmin = await prisma.user.create({
          data: {
            name: 'Abdul Rahman (Treasurer)',
            email: 'admin@jamamasjid.org',
            password: adminPassword,
            role: 'MASJID_ADMIN',
          },
        }).catch(() => null);

        if (masjidAdmin) {
          await prisma.masjidUser.create({
            data: {
              masjidId: jamaMasjid.id,
              userId: masjidAdmin.id,
              role: 'MASJID_ADMIN',
            },
          }).catch(() => null);
        }

        // Default funds
        await prisma.fund.create({
          data: {
            masjidId: jamaMasjid.id,
            name: 'General Operational Fund',
            openingBalance: 50000,
            currentBalance: 85000,
          },
        }).catch(() => null);

        await prisma.fund.create({
          data: {
            masjidId: jamaMasjid.id,
            name: 'Zakat & Sadaqah Vault',
            openingBalance: 20000,
            currentBalance: 32500,
          },
        }).catch(() => null);
      }
    }
  } catch (globalErr) {
    console.warn('Database initialization note:', globalErr);
  }
}
