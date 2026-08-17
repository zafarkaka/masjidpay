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
    const categoryId = searchParams.get('categoryId');
    const query = searchParams.get('q');

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {}

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);

    if (!masjid) {
      return NextResponse.json({ expenses: [] });
    }

    const masjidId = masjid.id;

    const where: any = { masjidId };
    if (categoryId && categoryId !== 'ALL') where.categoryId = categoryId;
    if (query) {
      where.OR = [
        { title: { contains: query } },
        { vendor: { contains: query } },
        { referenceNo: { contains: query } },
      ];
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        category: true,
        fund: true,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ expenses: expenses || [] });
  } catch (error: any) {
    console.error('Failed to fetch expenses:', error);
    return NextResponse.json({ expenses: [] });
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
      vendor,
      paymentMethod,
      referenceNo,
      description,
      date,
    } = body;

    let session: any = null;
    try {
      session = requireTenantAccess(reqMasjidId);
    } catch (e) {}

    const masjid = await getOrResolveMasjid(session?.masjidId, reqMasjidId);

    if (!masjid || !title || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Valid mosque, title, and amount are required' }, { status: 400 });
    }

    const masjidId = masjid.id;

    let categoryId = reqCatId;
    if (!categoryId || categoryId === 'default-exp-cat') {
      const firstCat = await prisma.expenseCategory.findFirst({ where: { masjidId } });
      categoryId = firstCat?.id;
    }

    let fundId = reqFundId;
    if (!fundId || fundId === 'default-fund') {
      const firstFund = await prisma.fund.findFirst({ where: { masjidId } });
      fundId = firstFund?.id;
    }

    if (!categoryId || !fundId) {
      return NextResponse.json({ error: 'Valid category and fund are required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          masjidId,
          categoryId,
          fundId,
          title,
          amount: Number(amount),
          date: date ? new Date(date) : new Date(),
          vendor: vendor || null,
          paymentMethod: paymentMethod || 'CASH',
          referenceNo: referenceNo || null,
          description: description || null,
        },
        include: {
          category: true,
          fund: true,
        },
      });

      await tx.fund.update({
        where: { id: fundId },
        data: { currentBalance: { decrement: Number(amount) } },
      });

      return expense;
    });

    await recordAuditLog({
      masjidId,
      userId: session.userId,
      userEmail: session.email,
      userRole: session.role,
      action: 'EXPENSE_CREATE',
      entity: 'Expense',
      entityId: result.id,
      afterState: { title, amount, vendor, categoryId },
    });

    return NextResponse.json({ success: true, expense: result });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Create Expense API error:', error);
    return NextResponse.json({ error: 'Failed to record expense' }, { status: 500 });
  }
}
