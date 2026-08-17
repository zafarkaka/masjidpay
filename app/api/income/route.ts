import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, getOrResolveMasjid } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {
      // fallback
    }

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam || undefined);

    if (!masjid) {
      return NextResponse.json({ incomes: [] });
    }

    const incomes = await prisma.income.findMany({
      where: { masjidId: masjid.id, isVoided: false },
      include: { category: true, fund: true },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ incomes: incomes || [] });
  } catch (error: any) {
    console.error('Fetch income error:', error);
    return NextResponse.json({ incomes: [] });
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

    let session: any = null;
    try {
      session = requireTenantAccess(reqMasjidId);
    } catch (e) {
      // fallback
    }

    const masjid = await getOrResolveMasjid(session?.masjidId, reqMasjidId);

    if (!masjid) {
      return NextResponse.json({ error: 'Mosque tenant record not found' }, { status: 500 });
    }

    const masjidId = masjid.id;

    if (!title || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid title and amount are required' },
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
        targetCat = await prisma.incomeCategory.create({
          data: {
            masjidId,
            name: catNameToMatch,
            isDefault: false,
          },
        });
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
