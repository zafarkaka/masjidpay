import { Client } from 'pg';

async function testConnection(port: number) {
  console.log(`Testing connection on port ${port}...`);
  const client = new Client({
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: port,
    database: 'postgres',
    user: 'postgres.fqummlyvxbmqwggjmzrk',
    password: 'MasjidPay2026Secure',
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log(`Success on port ${port}!`);
    const res = await client.query('SELECT NOW()');
    console.log('Result:', res.rows[0]);
    return true;
  } catch (err: any) {
    console.log(`Failed on port ${port}:`, err.message);
    return false;
  } finally {
    await client.end();
  }
}

async function main() {
  await testConnection(5432);
  await testConnection(6543);
}

main();
