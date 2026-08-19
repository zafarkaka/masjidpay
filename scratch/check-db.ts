import { PrismaClient } from '@prisma/client';
import net from 'net';

async function testConnection(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);
    socket.once('connect', () => {
      console.log(`Successfully connected to ${host}:${port}`);
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      console.log(`Connection to ${host}:${port} timed out`);
      socket.destroy();
      resolve(false);
    });
    socket.once('error', (err) => {
      console.log(`Error connecting to ${host}:${port}:`, err.message);
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function main() {
  const host = 'aws-0-ap-northeast-1.pooler.supabase.com';
  console.log('Testing network ports...');
  await testConnection(host, 6543);
  await testConnection(host, 5432);

  console.log('\nTesting Prisma with DIRECT_URL...');
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    console.log('DIRECT_URL is not set in environment!');
    return;
  }

  const prismaDirect = new PrismaClient({
    datasources: {
      db: {
        url: directUrl,
      },
    },
  });

  try {
    const users = await prismaDirect.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });
    console.log(`Direct connection succeeded! Found ${users.length} users.`);
    console.log(JSON.stringify(users, null, 2));

    const masjids = await prismaDirect.masjid.findMany({
      select: { id: true, name: true, slug: true, status: true }
    });
    console.log(`Found ${masjids.length} masjids.`);
    console.log(JSON.stringify(masjids, null, 2));
  } catch (err: any) {
    console.error('Direct connection failed:', err.message);
  } finally {
    await prismaDirect.$disconnect();
  }
}

main();
