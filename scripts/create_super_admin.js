const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@masjidpay.org';
  const rawPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      name: 'Super Administrator',
      mustChangePassword: false,
    },
    create: {
      name: 'Super Administrator',
      email,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      mustChangePassword: false,
    },
  });

  console.log(`✅ Super Admin Account successfully provisioned:`);
  console.log(`- Email: ${superAdmin.email}`);
  console.log(`- Role: ${superAdmin.role}`);
  console.log(`- Status: Active & Ready`);
}

main()
  .catch((e) => {
    console.error('Error creating super admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
