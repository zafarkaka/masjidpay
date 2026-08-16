const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function run() {
  try {
    const tables = await prisma.$queryRawUnsafe("SELECT sql FROM sqlite_master WHERE type='table' AND sql NOT NULL AND name != '_prisma_migrations'");
    const sqlStatements = tables.map(t => t.sql);
    
    const outputContent = `// Auto-generated SQLite Schema Initialization DDL for Vercel/Serverless
export const SCHEMA_SQL = ${JSON.stringify(sqlStatements, null, 2)};
`;

    fs.writeFileSync(path.join(__dirname, '../lib/schema-sql.ts'), outputContent);
    console.log(`✅ Successfully exported ${sqlStatements.length} table DDL statements to lib/schema-sql.ts`);
  } catch (err) {
    console.error('Export error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
