import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidId = searchParams.get('masjidId');

    if (!masjidId) {
      return NextResponse.json({ error: 'masjidId is required' }, { status: 400 });
    }

    requireTenantAccess(masjidId);

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
    return NextResponse.json({ error: 'Failed to fetch income' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { masjidId, title, amount, categoryId, fundId, payer, paymentMethod, referenceNo, description, date } = body;

    if (!masjidId || !title || !amount || !categoryId || !fundId) {
      return NextResponse.json({ error: 'masjidId, title, amount, categoryId, and fundId are required' }, { status: 400 });
    }

    const session = requireTenantAccess(masjidId);

    const result = await prisma.$transaction(async (tx) => {
      const income = await tx.income.create({
        data: {
          masjidId,
          categoryId,
          fundId,
          title,
          amount: Number(amount),
          payer: payer || null,
          paymentMethod: paymentMethod || 'BANK_TRANSFER',
          referenceNo: referenceNo || null,
          description: description || null,
          date: date ? new Date(date) : new Date(),
        },
        include: { category: true, fund: true },
      });

      await tx.fund.update({
        where: { id: fundId },
        data: { currentBalance: { increment: Number(amount) } },
      });

      return income;
    });

    await recordAuditLog({
      masjidId,
      userId: session.userId,
      userEmail: session.email,
      userRole: session.role,
      action: 'INCOME_CREATE',
      entity: 'Income',
      entityId: result.id,
      afterState: { title, amount, payer },
    });

    return NextResponse.json({ success: true, income: result });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to record income' }, { status: 500 });
  }
}
