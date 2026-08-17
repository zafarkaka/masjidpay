import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Checking seed data...');

  // 1. Create Super Admin User
  const superAdminPassword = await bcrypt.hash('admin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@masjidpay.org' },
    update: {
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
    },
    create: {
      name: 'Platform Super Admin',
      email: 'admin@masjidpay.org',
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
      mustChangePassword: false,
    },
  });
  console.log('✅ Super Admin created:', superAdmin.email);

  // 2. Create Approved Demo Masjid: Jama Masjid Vaniyambadi
  const jamaMasjid = await prisma.masjid.upsert({
    where: { slug: 'jama-masjid' },
    update: {},
    create: {
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
  });
  console.log('✅ Approved Masjid created:', jamaMasjid.name);

  // 3. Create Demo Masjid Admin User
  const adminPassword = await bcrypt.hash('password123', 10);
  const masjidAdmin = await prisma.user.upsert({
    where: { email: 'admin@jamamasjid.org' },
    update: {},
    create: {
      name: 'Syed Usman (Committee Secretary)',
      email: 'admin@jamamasjid.org',
      password: adminPassword,
      role: 'MASJID_ADMIN',
    },
  });

  await prisma.masjidUser.upsert({
    where: {
      masjidId_userId: {
        masjidId: jamaMasjid.id,
        userId: masjidAdmin.id,
      },
    },
    update: {},
    create: {
      masjidId: jamaMasjid.id,
      userId: masjidAdmin.id,
      role: 'MASJID_ADMIN',
    },
  });

  // 4. Default Categories
  const catGeneral = await prisma.donationCategory.create({
    data: { masjidId: jamaMasjid.id, name: 'General Donation', isDefault: true },
  });
  const catMember = await prisma.donationCategory.create({
    data: { masjidId: jamaMasjid.id, name: 'Monthly Member Collection' },
  });
  const catExpUtil = await prisma.expenseCategory.create({
    data: { masjidId: jamaMasjid.id, name: 'Utilities & Electricity', isDefault: true },
  });

  // 5. Default Funds
  const fundGeneral = await prisma.fund.create({
    data: {
      masjidId: jamaMasjid.id,
      name: 'General Operating Fund',
      description: 'Unrestricted daily operating fund',
      openingBalance: 4000,
      currentBalance: 6500,
    },
  });

  // 6. Registered Members
  const member1 = await prisma.member.create({
    data: {
      masjidId: jamaMasjid.id,
      memberNo: 'MBR-001',
      name: 'Ibrahim Syed',
      phone: '+91 98765 43210',
      email: 'ibrahim@gmail.com',
      address: 'Fort Street, Vaniyambadi',
      monthlyAmount: 500,
      status: 'ACTIVE',
    },
  });

  const member2 = await prisma.member.create({
    data: {
      masjidId: jamaMasjid.id,
      memberNo: 'MBR-002',
      name: 'Mohammed Tariq',
      phone: '+91 91234 56789',
      email: 'tariq@gmail.com',
      address: 'Main Bazaar Road, Vaniyambadi',
      monthlyAmount: 1000,
      status: 'ACTIVE',
    },
  });

  await prisma.memberCollection.create({
    data: {
      masjidId: jamaMasjid.id,
      memberId: member1.id,
      memberName: 'Ibrahim Syed',
      memberPhone: '+91 98765 43210',
      memberAddress: 'Fort Street, Vaniyambadi',
      amount: 2500,
      paymentType: 'BULK_12_MONTHS',
      monthsCount: 5,
      forMonths: 'August 2026 - December 2026',
      paymentDate: new Date('2026-08-12'),
      paymentMethod: 'CASH',
      receiptNo: 'REC-2026-0001',
    },
  });

  // 7. Staff Roster (matching screenshot: Ali Bhai Muazzin)
  await prisma.staff.create({
    data: {
      masjidId: jamaMasjid.id,
      name: 'Ali Bhai',
      roleTitle: 'Muazzin',
      phone: '+91 98765 12345',
      monthlySalary: 4000,
      status: 'ACTIVE',
    },
  });

  await prisma.staff.create({
    data: {
      masjidId: jamaMasjid.id,
      name: 'Maulana Hafiz Arshad',
      roleTitle: 'Imam & Khateeb',
      phone: '+91 98123 45678',
      monthlySalary: 25000,
      status: 'ACTIVE',
    },
  });

  // 8. Sample Donations
  const don1 = await prisma.donation.create({
    data: {
      masjidId: jamaMasjid.id,
      donorId: null,
      categoryId: catMember.id,
      fundId: fundGeneral.id,
      amount: 2500,
      date: new Date('2026-08-12'),
      paymentMethod: 'CASH',
      receiptNo: 'REC-2026-0001',
      notes: 'Monthly Member Collection (Aug 2026)',
    },
  });

  await prisma.receipt.create({
    data: {
      masjidId: jamaMasjid.id,
      receiptNo: 'REC-2026-0001',
      donationId: don1.id,
      donorName: 'Ibrahim Syed',
      amount: 2500,
      categoryName: 'Monthly Member Collection',
    },
  });

  // 9. Sample Rental Shops & Documents
  await prisma.rentalShop.create({
    data: {
      masjidId: jamaMasjid.id,
      shopNo: 'Shop #1',
      tenantName: 'Abdul Rahman (Book Store)',
      tenantPhone: '+91 98456 78901',
      monthlyRent: 5000,
      status: 'OCCUPIED',
    },
  });

  await prisma.document.create({
    data: {
      masjidId: jamaMasjid.id,
      title: 'Land Property Title Deed',
      category: 'Land Deed',
      fileUrl: '/docs/land_deed.pdf',
      fileSize: '2.4 MB',
      uploadedBy: 'Syed Usman',
    },
  });

  console.log('✅ Seed completed successfully with Ali Bhai (Muazzin) and members!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
