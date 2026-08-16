import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');

    const session = requireTenantAccess(masjidIdParam);
    let masjidId = session.masjidId || masjidIdParam;

    if (!masjidId || masjidId === 'jama-masjid') {
      const defaultMasjid = await prisma.masjid.findFirst({
        where: { OR: [{ slug: 'jama-masjid' }, { status: 'APPROVED' }] },
      });
      masjidId = defaultMasjid?.id || masjidId;
    }

    if (!masjidId) {
      return NextResponse.json({ error: 'masjidId is required' }, { status: 400 });
    }

    const incomes = await prisma.income.findMany({
      where: { masjidId, isVoided: false },
      include: { category: true, fund: true },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ incomes });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Fetch income error:', error);
    return NextResponse.json({ error: 'Failed to fetch income' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      masjidId: reqMasjidId,
      title,
      amount,
      categoryId: reqCatId,
      fundId: reqFundId,
      categoryName,
      payer,
      paymentMethod,
      referenceNo,
      description,
      date,
    } = body;

    const session = requireTenantAccess(reqMasjidId);
    let masjidId = session.masjidId || reqMasjidId;

    if (!masjidId || masjidId === 'jama-masjid') {
      const foundMasjid = await prisma.masjid.findFirst({
        where: { OR: [{ slug: reqMasjidId || 'jama-masjid' }, { status: 'APPROVED' }] },
      });
      masjidId = foundMasjid?.id;
    }

    if (!masjidId || !title || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid title, amount, and mosque are required' },
        { status: 400 }
      );
    }

    // Auto-resolve or create Category
    let categoryId = reqCatId;
    let targetCat = null;
    if (categoryId && categoryId !== 'cat-1' && categoryId !== 'default') {
      targetCat = await prisma.incomeCategory.findFirst({
        where: { id: categoryId, masjidId },
      });
    }

    if (!targetCat) {
      const catNameToMatch = categoryName || 'General Income';
      targetCat = await prisma.incomeCategory.findFirst({
        where: { masjidId, name: catNameToMatch },
      });

      if (!targetCat) {
        // Find any category for this masjid or create one
        targetCat = await prisma.incomeCategory.findFirst({ where: { masjidId } });
        if (!targetCat) {
          targetCat = await prisma.incomeCategory.create({
            data: {
              masjidId,
              name: catNameToMatch,
              isDefault: false,
            },
          });
        }
      }
    }
    categoryId = targetCat.id;

    // Auto-resolve or create Fund
    let fundId = reqFundId;
    let targetFund = null;
    if (fundId && fundId !== 'fund-1' && fundId !== 'default') {
      targetFund = await prisma.fund.findFirst({
        where: { id: fundId, masjidId },
      });
    }

    if (!targetFund) {
      targetFund = await prisma.fund.findFirst({
        where: { masjidId },
      });

      if (!targetFund) {
        targetFund = await prisma.fund.create({
          data: {
            masjidId,
            name: 'General Mosque Fund',
            openingBalance: 0,
            currentBalance: 0,
          },
        });
      }
    }
    fundId = targetFund.id;

    const numAmount = Number(amount);

    const result = await prisma.$transaction(async (tx) => {
      const income = await tx.income.create({
        data: {
          masjidId,
          categoryId,
          fundId,
          title,
          amount: numAmount,
          payer: payer || null,
          paymentMethod: paymentMethod || 'CASH',
          referenceNo: referenceNo || null,
          description: description || null,
          date: date ? new Date(date) : new Date(),
        },
        include: { category: true, fund: true },
      });

      await tx.fund.update({
        where: { id: fundId },
        data: { currentBalance: { increment: numAmount } },
      });

      return income;
    });

    await recordAuditLog({
      masjidId,
      userId: session?.userId || 'system',
      userEmail: session?.email || 'admin@masjidpay.org',
      userRole: session?.role || 'MASJID_ADMIN',
      action: 'INCOME_CREATE',
      entity: 'Income',
      entityId: result.id,
      afterState: { title, amount: numAmount, payer, category: targetCat.name },
    });

    return NextResponse.json({ success: true, income: result });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Record income error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record income' }, { status: 500 });
  }
}
