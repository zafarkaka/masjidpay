import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantWriteAccess } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { voidReason } = await req.json();
    const expenseId = params.id;

    const existing = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { fund: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const session = requireTenantWriteAccess(existing.masjidId);

    if (existing.isVoided) {
      return NextResponse.json({ error: 'Expense is already voided' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.expense.update({
        where: { id: expenseId },
        data: {
          isVoided: true,
          voidReason: voidReason || 'Voided by administrator',
        },
      });

      // Restore fund balance (increment back)
      await tx.fund.update({
        where: { id: existing.fundId },
        data: { currentBalance: { increment: existing.amount } },
      });

      return updated;
    });

    await recordAuditLog({
      masjidId: existing.masjidId,
      userId: session.userId,
      userEmail: session.email,
      userRole: session.role,
      action: 'EXPENSE_VOID',
      entity: 'Expense',
      entityId: expenseId,
      beforeState: { amount: existing.amount, isVoided: false },
      afterState: { isVoided: true, voidReason },
    });

    return NextResponse.json({ success: true, expense: result });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to void expense' }, { status: 500 });
  }
}
