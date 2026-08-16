const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const masjids = await prisma.masjid.findMany({
    include: { masjidUsers: { include: { user: true } } },
  });
  console.log('Total Masjids in Database:', masjids.length);
  masjids.forEach((m) => {
    console.log(`- Mosque: ${m.name} | Status: ${m.status} | Admin: ${m.masjidUsers[0]?.user?.email || 'N/A'}`);
  });
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
