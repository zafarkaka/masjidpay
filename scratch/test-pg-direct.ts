import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

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

async function testConnection() {
  const connectionString = process.env.DIRECT_URL;
  console.log('Testing DIRECT_URL connection string:', connectionString);
  if (!connectionString) {
    console.error('DIRECT_URL is not set.');
    return;
  }

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Successfully connected!');
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);

    const usersRes = await client.query('SELECT id, name, email, role FROM "User"');
    console.log(`Users in DB (${usersRes.rows.length}):`);
    console.log(usersRes.rows);

    const masjidsRes = await client.query('SELECT id, name, slug, status FROM "Masjid"');
    console.log(`Masjids in DB (${masjidsRes.rows.length}):`);
    console.log(masjidsRes.rows);
  } catch (err: any) {
    console.error('Connection failed with error:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
  } finally {
    await client.end();
  }
}

testConnection();
