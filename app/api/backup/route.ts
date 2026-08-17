import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, getOrResolveMasjid } from '@/lib/tenant';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');
    const selectedTypes = searchParams.get('types')?.split(',') || [
      'members',
      'memberPayments',
      'imams',
      'monthlyCollection',
      'imamPayouts',
      'mosqueIncome',
      'expenses',
      'recycleBin',
      'documents',
    ];

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {}

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid not found' }, { status: 404 });
    }

    const masjidId = masjid.id;
    const backupData: any = {
      exportMeta: {
        masjidId: masjid.id,
        masjidName: masjid.name,
        masjidSlug: masjid.slug,
        exportedAt: new Date().toISOString(),
        version: '2.0',
      },
    };

    if (selectedTypes.includes('members')) {
      backupData.members = await prisma.member.findMany({ where: { masjidId } });
    }

    if (selectedTypes.includes('memberPayments') || selectedTypes.includes('monthlyCollection')) {
      backupData.memberCollections = await prisma.memberCollection.findMany({ where: { masjidId } });
    }

    if (selectedTypes.includes('imams')) {
      backupData.staff = await prisma.staff.findMany({ where: { masjidId } });
    }

    if (selectedTypes.includes('imamPayouts')) {
      backupData.payrolls = await prisma.payroll.findMany({ where: { masjidId } });
    }

    if (selectedTypes.includes('mosqueIncome')) {
      backupData.incomes = await prisma.income.findMany({ where: { masjidId } });
      backupData.donations = await prisma.donation.findMany({ where: { masjidId } });
    }

    if (selectedTypes.includes('expenses')) {
      backupData.expenses = await prisma.expense.findMany({ where: { masjidId } });
    }

    if (selectedTypes.includes('recycleBin')) {
      backupData.voidedDonations = await prisma.donation.findMany({ where: { masjidId, isVoided: true } });
      backupData.voidedExpenses = await prisma.expense.findMany({ where: { masjidId, isVoided: true } });
    }

    if (selectedTypes.includes('documents')) {
      backupData.documents = await prisma.document.findMany({ where: { masjidId } });
    }

    const jsonString = JSON.stringify(backupData, null, 2);
    const fileName = `MasjidPay-Backup-${masjid.slug || 'masjid'}-${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Backup Export Error:', error);
    return NextResponse.json({ error: 'Failed to export backup' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { masjidIdParam, payload, restoreMode = 'merge' } = await req.json();

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {}

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid not found' }, { status: 404 });
    }

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Invalid backup file payload' }, { status: 400 });
    }

    const masjidId = masjid.id;

    // Optional: Overwrite mode clears current transaction records before restoring
    if (restoreMode === 'overwrite') {
      await prisma.memberCollection.deleteMany({ where: { masjidId } }).catch(() => {});
      await prisma.payroll.deleteMany({ where: { masjidId } }).catch(() => {});
      await prisma.income.deleteMany({ where: { masjidId } }).catch(() => {});
      await prisma.expense.deleteMany({ where: { masjidId } }).catch(() => {});
      await prisma.donation.deleteMany({ where: { masjidId } }).catch(() => {});
    }

    // Default Fallback Categories and Funds
    let defaultIncomeCat = await prisma.incomeCategory.findFirst({ where: { masjidId } });
    if (!defaultIncomeCat) {
      defaultIncomeCat = await prisma.incomeCategory.create({
        data: { masjidId, name: 'General Mosque Income', isDefault: true },
      });
    }

    let defaultExpenseCat = await prisma.expenseCategory.findFirst({ where: { masjidId } });
    if (!defaultExpenseCat) {
      defaultExpenseCat = await prisma.expenseCategory.create({
        data: { masjidId, name: 'General Utilities', isDefault: true },
      });
    }

    let defaultDonationCat = await prisma.donationCategory.findFirst({ where: { masjidId } });
    if (!defaultDonationCat) {
      defaultDonationCat = await prisma.donationCategory.create({
        data: { masjidId, name: 'General Sadaqah', isDefault: true },
      });
    }

    let defaultFund = await prisma.fund.findFirst({ where: { masjidId } });
    if (!defaultFund) {
      defaultFund = await prisma.fund.create({
        data: { masjidId, name: 'General Fund', openingBalance: 0, currentBalance: 0 },
      });
    }

    let restoredMembers = 0;
    let restoredStaff = 0;
    let restoredIncomes = 0;
    let restoredExpenses = 0;
    let restoredDonations = 0;
    let restoredCollections = 0;
    let restoredPayrolls = 0;

    // 1. Restore Members
    if (Array.isArray(payload.members)) {
      for (const m of payload.members) {
        if (!m.name) continue;
        await prisma.member.upsert({
          where: { id: m.id || 'none' },
          update: {
            name: m.name,
            phone: m.phone || '0000000000',
            email: m.email || null,
            address: m.address || null,
            monthlyAmount: Number(m.monthlyAmount || 100),
            canViewReports: m.canViewReports !== undefined ? Boolean(m.canViewReports) : true,
          },
          create: {
            masjidId,
            memberNo: m.memberNo || `MBR-${Date.now().toString().slice(-4)}`,
            name: m.name,
            phone: m.phone || '0000000000',
            email: m.email || null,
            address: m.address || null,
            monthlyAmount: Number(m.monthlyAmount || 100),
            canViewReports: m.canViewReports !== undefined ? Boolean(m.canViewReports) : true,
          },
        });
        restoredMembers++;
      }
    }

    // 2. Restore Staff (Imams & Mosque Staff)
    if (Array.isArray(payload.staff)) {
      for (const s of payload.staff) {
        if (!s.name) continue;
        await prisma.staff.upsert({
          where: { id: s.id || 'none' },
          update: {
            name: s.name,
            roleTitle: s.roleTitle || 'Mosque Staff',
            phone: s.phone || null,
            monthlySalary: Number(s.monthlySalary || 0),
            status: s.status || 'ACTIVE',
          },
          create: {
            masjidId,
            name: s.name,
            roleTitle: s.roleTitle || 'Mosque Staff',
            phone: s.phone || null,
            monthlySalary: Number(s.monthlySalary || 0),
            status: s.status || 'ACTIVE',
          },
        });
        restoredStaff++;
      }
    }

    // 3. Restore Incomes
    if (Array.isArray(payload.incomes)) {
      for (const inc of payload.incomes) {
        if (!inc.title || !inc.amount) continue;
        await prisma.income.create({
          data: {
            masjidId,
            categoryId: defaultIncomeCat.id,
            fundId: defaultFund.id,
            title: inc.title,
            amount: Number(inc.amount),
            payer: inc.payer || null,
            paymentMethod: inc.paymentMethod || 'CASH',
            referenceNo: inc.referenceNo || null,
            description: inc.description || null,
            date: inc.date ? new Date(inc.date) : new Date(),
          },
        });
        restoredIncomes++;
      }
    }

    // 4. Restore Expenses
    if (Array.isArray(payload.expenses)) {
      for (const exp of payload.expenses) {
        if (!exp.title || !exp.amount) continue;
        await prisma.expense.create({
          data: {
            masjidId,
            categoryId: defaultExpenseCat.id,
            fundId: defaultFund.id,
            title: exp.title,
            amount: Number(exp.amount),
            vendor: exp.vendor || null,
            paymentMethod: exp.paymentMethod || 'CASH',
            referenceNo: exp.referenceNo || null,
            description: exp.description || null,
            date: exp.date ? new Date(exp.date) : new Date(),
          },
        });
        restoredExpenses++;
      }
    }

    // 5. Restore Donations
    if (Array.isArray(payload.donations)) {
      for (const don of payload.donations) {
        if (!don.amount) continue;
        await prisma.donation.create({
          data: {
            masjidId,
            categoryId: defaultDonationCat.id,
            fundId: defaultFund.id,
            amount: Number(don.amount),
            paymentMethod: don.paymentMethod || 'CASH',
            referenceNo: don.referenceNo || null,
            notes: don.notes || null,
            date: don.date ? new Date(don.date) : new Date(),
          },
        });
        restoredDonations++;
      }
    }

    // 6. Restore Member Collections
    if (Array.isArray(payload.memberCollections)) {
      for (const mc of payload.memberCollections) {
        if (!mc.amount || !mc.memberName) continue;
        await prisma.memberCollection.create({
          data: {
            masjidId,
            memberName: mc.memberName,
            memberPhone: mc.memberPhone || '',
            memberAddress: mc.memberAddress || null,
            amount: Number(mc.amount),
            paymentType: mc.paymentType || 'SINGLE_MONTH',
            monthsCount: Number(mc.monthsCount || 1),
            forMonths: mc.forMonths || 'Restored Period',
            paymentDate: mc.paymentDate ? new Date(mc.paymentDate) : new Date(),
            paymentMethod: mc.paymentMethod || 'CASH',
            referenceNo: mc.referenceNo || null,
            receiptNo: mc.receiptNo || `REC-${Date.now().toString().slice(-4)}`,
            notes: mc.notes || null,
          },
        });
        restoredCollections++;
      }
    }

    // 7. Restore Payrolls
    if (Array.isArray(payload.payrolls)) {
      for (const p of payload.payrolls) {
        if (!p.staffName) continue;
        let staffRecord = await prisma.staff.findFirst({
          where: { masjidId, name: p.staffName },
        });
        if (!staffRecord) {
          staffRecord = await prisma.staff.create({
            data: {
              masjidId,
              name: p.staffName,
              roleTitle: 'Mosque Staff',
              monthlySalary: Number(p.netSalary || p.amount || 0),
            },
          });
        }

        await prisma.payroll.create({
          data: {
            masjidId,
            staffId: staffRecord.id,
            staffName: p.staffName,
            amount: Number(p.amount || p.netSalary || 0),
            monthPaid: p.monthPaid || 'Restored Month',
            netSalary: Number(p.netSalary || p.amount || 0),
            workingDays: Number(p.workingDays || 30),
            presentDays: Number(p.presentDays || 30),
            absentDays: Number(p.absentDays || 0),
            baseSalary: Number(p.baseSalary || 0),
            perDaySalary: Number(p.perDaySalary || 0),
            earnedSalary: Number(p.earnedSalary || 0),
            allowance: Number(p.allowance || 0),
            deduction: Number(p.deduction || 0),
            paymentMethod: p.paymentMethod || 'CASH',
            paymentDate: p.paymentDate ? new Date(p.paymentDate) : new Date(),
            status: p.status || 'PAID',
            notes: p.notes || null,
          },
        });
        restoredPayrolls++;
      }
    }

    const totalRestored =
      restoredMembers +
      restoredStaff +
      restoredIncomes +
      restoredExpenses +
      restoredDonations +
      restoredCollections +
      restoredPayrolls;

    return NextResponse.json({
      success: true,
      message: `Database backup restored successfully! Synchronized ${totalRestored} records (${restoredMembers} members, ${restoredStaff} staff, ${restoredIncomes} incomes, ${restoredExpenses} expenses, ${restoredDonations} donations, ${restoredCollections} collections, ${restoredPayrolls} payrolls).`,
      details: {
        restoredMembers,
        restoredStaff,
        restoredIncomes,
        restoredExpenses,
        restoredDonations,
        restoredCollections,
        restoredPayrolls,
        totalRestored,
      },
    });
  } catch (error: any) {
    console.error('Backup restore error:', error);
    return NextResponse.json({ error: 'Failed to restore backup: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}
