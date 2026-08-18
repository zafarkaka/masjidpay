import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, requireTenantWriteAccess } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidId = searchParams.get('masjidId');

    if (!masjidId) {
      return NextResponse.json({ error: 'masjidId is required' }, { status: 400 });
    }

    requireTenantAccess(masjidId);

    const transfers = await prisma.fundTransfer.findMany({
      where: { masjidId },
      include: {
        sourceFund: true,
        destFund: true,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ transfers });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch fund transfers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { masjidId, sourceFundId, destFundId, amount, reason, reference } = body;

    if (!masjidId || !sourceFundId || !destFundId || !amount || !reason) {
      return NextResponse.json({ error: 'masjidId, sourceFundId, destFundId, amount, and reason are required' }, { status: 400 });
    }

    if (sourceFundId === destFundId) {
      return NextResponse.json({ error: 'Source and destination fund cannot be the same' }, { status: 400 });
    }

    const session = requireTenantWriteAccess(masjidId);

    const transferAmount = Number(amount);
    if (transferAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }

    const sourceFund = await prisma.fund.findUnique({ where: { id: sourceFundId } });
    if (!sourceFund) {
      return NextResponse.json({ error: 'Source fund not found' }, { status: 404 });
    }

    if (sourceFund.currentBalance < transferAmount) {
      return NextResponse.json({ error: `Insufficient funds in ${sourceFund.name} (Available: ₹${sourceFund.currentBalance})` }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Transfer record
      const transfer = await tx.fundTransfer.create({
        data: {
          masjidId,
          sourceFundId,
          destFundId,
          amount: transferAmount,
          reason,
          reference: reference || null,
          createdByUserId: session.userId,
        },
        include: {
          sourceFund: true,
          destFund: true,
        },
      });

      // 2. Decrement source fund balance
      await tx.fund.update({
        where: { id: sourceFundId },
        data: { currentBalance: { decrement: transferAmount } },
      });

      // 3. Increment destination fund balance
      await tx.fund.update({
        where: { id: destFundId },
        data: { currentBalance: { increment: transferAmount } },
      });

      return transfer;
    });

    await recordAuditLog({
      masjidId,
      userId: session.userId,
      userEmail: session.email,
      userRole: session.role,
      action: 'FUND_TRANSFER',
      entity: 'FundTransfer',
      entityId: result.id,
      afterState: { sourceFund: result.sourceFund.name, destFund: result.destFund.name, amount: transferAmount, reason },
    });

    return NextResponse.json({ success: true, transfer: result });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Fund Transfer API error:', error);
    return NextResponse.json({ error: 'Failed to process fund transfer' }, { status: 500 });
  }
}
