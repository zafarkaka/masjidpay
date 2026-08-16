import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidId = searchParams.get('masjidId');

    if (!masjidId) {
      return NextResponse.json({ error: 'masjidId is required' }, { status: 400 });
    }

    requireTenantAccess(masjidId);

    const budgets = await prisma.budget.findMany({
      where: { masjidId },
      include: {
        expenseCategory: true,
        fund: true,
      },
      orderBy: { year: 'desc' },
    });

    return NextResponse.json({ budgets });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { masjidId, categoryId, period, year, budgetedAmount } = body;

    if (!masjidId || !categoryId || !year || !budgetedAmount) {
      return NextResponse.json({ error: 'masjidId, categoryId, year, and budgetedAmount are required' }, { status: 400 });
    }

    requireTenantAccess(masjidId);

    // Compute actual spending for this category in the specified year
    const startOfYear = new Date(Number(year), 0, 1);
    const endOfYear = new Date(Number(year), 11, 31, 23, 59, 59);

    const actualAgg = await prisma.expense.aggregate({
      where: {
        masjidId,
        categoryId,
        isVoided: false,
        date: { gte: startOfYear, lte: endOfYear },
      },
      _sum: { amount: true },
    });

    const budget = await prisma.budget.upsert({
      where: {
        id: body.id || 'new-budget',
      },
      update: {
        period: period || 'ANNUAL',
        budgetedAmount: Number(budgetedAmount),
        actualAmount: actualAgg._sum.amount || 0,
      },
      create: {
        masjidId,
        categoryId,
        period: period || 'ANNUAL',
        year: Number(year),
        budgetedAmount: Number(budgetedAmount),
        actualAmount: actualAgg._sum.amount || 0,
      },
      include: {
        expenseCategory: true,
      },
    });

    return NextResponse.json({ success: true, budget });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to save budget' }, { status: 500 });
  }
}
