import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, getOrResolveMasjid } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {}

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);
    if (!masjid) {
      return NextResponse.json({ error: 'Masjid context required' }, { status: 400 });
    }

    const existing = await prisma.bankTransaction.findFirst({
      where: { id: params.id, masjidId: masjid.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const body = await req.json();
    const { bankAccountId, type, amount, date, chequeNo, chequeDate, referenceNo, notes } = body;

    const newAmount = amount !== undefined ? Number(amount) : existing.amount;
    const newBankAccountId = bankAccountId || existing.bankAccountId;
    const newType = type || existing.type;

    // 1. Revert previous effect on previous bank account
    if (existing.type === 'WITHDRAWAL') {
      await prisma.bankAccount.update({
        where: { id: existing.bankAccountId },
        data: { currentBalance: { increment: existing.amount } },
      });
    } else {
      await prisma.bankAccount.update({
        where: { id: existing.bankAccountId },
        data: { currentBalance: { decrement: existing.amount } },
      });
    }

    // 2. Apply new effect on new/current bank account
    if (newType === 'WITHDRAWAL') {
      await prisma.bankAccount.update({
        where: { id: newBankAccountId },
        data: { currentBalance: { decrement: newAmount } },
      });
    } else {
      await prisma.bankAccount.update({
        where: { id: newBankAccountId },
        data: { currentBalance: { increment: newAmount } },
      });
    }

    // 3. Update the transaction record
    const updated = await prisma.bankTransaction.update({
      where: { id: params.id },
      data: {
        bankAccountId: newBankAccountId,
        type: newType,
        amount: newAmount,
        date: date ? new Date(date) : existing.date,
        chequeNo: chequeNo !== undefined ? chequeNo : existing.chequeNo,
        chequeDate: chequeDate ? new Date(chequeDate) : existing.chequeDate,
        referenceNo: referenceNo !== undefined ? referenceNo : existing.referenceNo,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    try {
      await recordAuditLog({
        masjidId: masjid.id,
        userId: session?.userId,
        userEmail: session?.email,
        userRole: session?.role,
        action: 'UPDATE_DEPOSIT',
        entity: 'BankTransaction',
        entityId: updated.id,
      });
    } catch (e) {}

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {}

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);
    if (!masjid) {
      return NextResponse.json({ error: 'Masjid context required' }, { status: 400 });
    }

    const existing = await prisma.bankTransaction.findFirst({
      where: { id: params.id, masjidId: masjid.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // 1. Revert bank account balance
    if (existing.type === 'WITHDRAWAL') {
      await prisma.bankAccount.update({
        where: { id: existing.bankAccountId },
        data: { currentBalance: { increment: existing.amount } },
      });
    } else {
      await prisma.bankAccount.update({
        where: { id: existing.bankAccountId },
        data: { currentBalance: { decrement: existing.amount } },
      });
    }

    // 2. Delete transaction record
    await prisma.bankTransaction.delete({
      where: { id: params.id },
    });

    try {
      await recordAuditLog({
        masjidId: masjid.id,
        userId: session?.userId,
        userEmail: session?.email,
        userRole: session?.role,
        action: 'DELETE_DEPOSIT',
        entity: 'BankTransaction',
        entityId: params.id,
      });
    } catch (e) {}

    return NextResponse.json({ success: true, message: 'Deposit deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting deposit:', error);
    return NextResponse.json({ error: 'Failed to delete deposit' }, { status: 500 });
  }
}
