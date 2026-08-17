import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');
    const categoryId = searchParams.get('categoryId');
    const query = searchParams.get('q');

    const session = requireTenantAccess(masjidIdParam);
    const masjidId = session.masjidId || masjidIdParam || (await prisma.masjid.findFirst({ where: { status: 'APPROVED' } }))?.id;

    if (!masjidId) {
      return NextResponse.json({ error: 'masjidId is required' }, { status: 400 });
    }

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

    return NextResponse.json({ expenses });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
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

    const session = requireTenantAccess(reqMasjidId);
    const masjidId = session.masjidId || reqMasjidId || (await prisma.masjid.findFirst({ where: { status: 'APPROVED' } }))?.id;

    if (!masjidId || !title || !amount) {
      return NextResponse.json({ error: 'masjidId, title, and amount are required' }, { status: 400 });
    }

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
