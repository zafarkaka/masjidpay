import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Manual .env loader
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        let key = match[1].trim();
        let val = match[2].trim();
        // Remove quotes if present
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    });
  }
}

loadEnv();

console.log('Environment loaded manually.');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('DIRECT_URL:', process.env.DIRECT_URL);

const prismaDirect = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  console.log('\nQuerying database with DIRECT_URL...');
  try {
    const users = await prismaDirect.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });
    console.log(`Found ${users.length} users:`);
    console.log(JSON.stringify(users, null, 2));

    const masjids = await prismaDirect.masjid.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        status: true,
        createdAt: true,
      }
    });
    console.log(`Found ${masjids.length} masjids:`);
    console.log(JSON.stringify(masjids, null, 2));
  } catch (error: any) {
    console.error('Error querying database:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await prismaDirect.$disconnect();
  }
}

main();
