import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

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

    const session = requireTenantAccess(masjidIdParam);
    const masjid = await prisma.masjid.findFirst({
      where: {
        OR: [
          { id: session.masjidId || '' },
          { id: masjidIdParam || '' },
          { slug: masjidIdParam || 'jama-masjid' },
        ],
      },
    });

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid not found' }, { status: 404 });
    }

    const masjidId = masjid.id;
    const backupData: any = {
      exportMeta: {
        masjidId: masjid.id,
        masjidName: masjid.name,
        exportedAt: new Date().toISOString(),
        version: '1.0',
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
    const fileName = `MasjidPay-Backup-${masjid.slug}-${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Backup Export Error:', error);
    return NextResponse.json({ error: 'Failed to export backup' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { masjidIdParam, payload } = await req.json();
    const session = requireTenantAccess(masjidIdParam);
    const masjid = await prisma.masjid.findFirst({
      where: {
        OR: [
          { id: session.masjidId || '' },
          { id: masjidIdParam || '' },
          { slug: masjidIdParam || 'jama-masjid' },
        ],
      },
    });

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid not found' }, { status: 404 });
    }

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Invalid backup file payload' }, { status: 400 });
    }

    let restoredCount = 0;

    // Restore members
    if (Array.isArray(payload.members)) {
      for (const m of payload.members) {
        await prisma.member.upsert({
          where: { id: m.id || 'new-id' },
          update: { name: m.name, phone: m.phone, monthlyAmount: m.monthlyAmount },
          create: {
            masjidId: masjid.id,
            name: m.name,
            phone: m.phone,
            email: m.email || null,
            address: m.address || null,
            monthlyAmount: Number(m.monthlyAmount || 100),
          },
        });
        restoredCount++;
      }
    }

    // Restore incomes
    if (Array.isArray(payload.incomes)) {
      for (const inc of payload.incomes) {
        const cat = await prisma.incomeCategory.findFirst({ where: { masjidId: masjid.id } });
        const fnd = await prisma.fund.findFirst({ where: { masjidId: masjid.id } });
        if (cat && fnd) {
          await prisma.income.create({
            data: {
              masjidId: masjid.id,
              categoryId: cat.id,
              fundId: fnd.id,
              title: inc.title || 'Restored Income',
              amount: Number(inc.amount || 0),
              payer: inc.payer || null,
              paymentMethod: inc.paymentMethod || 'CASH',
            },
          });
          restoredCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Database backup restored successfully! Synchronized ${restoredCount} records.`,
    });
  } catch (error: any) {
    console.error('Backup restore error:', error);
    return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 });
  }
}
