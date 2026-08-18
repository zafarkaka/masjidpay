import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, requireTenantWriteAccess, getOrResolveMasjid } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');

    let session: any = null;
    try {
      session = requireTenantWriteAccess(masjidIdParam);
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Read-Only Mode: Guests cannot modify bank accounts.' }, { status: 403 });
    }

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);
    if (!masjid) {
      return NextResponse.json({ error: 'Masjid context required' }, { status: 400 });
    }

    const existing = await prisma.bankAccount.findFirst({
      where: { id: params.id, masjidId: masjid.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
    }

    const body = await req.json();
    const { bankName, accountName, accountNumber, ifscCode, branchName, openingBalance, financialYear } = body;

    const newOpening = openingBalance !== undefined ? Number(openingBalance) : existing.openingBalance;
    const openingDiff = newOpening - existing.openingBalance;
    const newCurrent = existing.currentBalance + openingDiff;

    const updated = await prisma.bankAccount.update({
      where: { id: params.id },
      data: {
        bankName: bankName || existing.bankName,
        accountName: accountName !== undefined ? accountName : existing.accountName,
        accountNumber: accountNumber || existing.accountNumber,
        ifscCode: ifscCode !== undefined ? ifscCode : existing.ifscCode,
        branchName: branchName !== undefined ? branchName : existing.branchName,
        financialYear: financialYear || existing.financialYear,
        openingBalance: newOpening,
        currentBalance: newCurrent,
      },
    });

    try {
      await recordAuditLog({
        masjidId: masjid.id,
        userId: session?.userId,
        userEmail: session?.email,
        userRole: session?.role,
        action: 'UPDATE_BANK_ACCOUNT',
        entity: 'BankAccount',
        entityId: updated.id,
      });
    } catch (e) {}

    return NextResponse.json({ success: true, bankAccount: updated });
  } catch (error: any) {
    console.error('Error updating bank account:', error);
    return NextResponse.json({ error: 'Failed to update bank account' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');

    let session: any = null;
    try {
      session = requireTenantWriteAccess(masjidIdParam);
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Read-Only Mode: Guests cannot delete bank accounts.' }, { status: 403 });
    }

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);
    if (!masjid) {
      return NextResponse.json({ error: 'Masjid context required' }, { status: 400 });
    }

    const existing = await prisma.bankAccount.findFirst({
      where: { id: params.id, masjidId: masjid.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
    }

    // Soft-delete or mark inactive
    await prisma.bankAccount.update({
      where: { id: params.id },
      data: { status: 'DELETED' },
    });

    try {
      await recordAuditLog({
        masjidId: masjid.id,
        userId: session?.userId,
        userEmail: session?.email,
        userRole: session?.role,
        action: 'DELETE_BANK_ACCOUNT',
        entity: 'BankAccount',
        entityId: params.id,
      });
    } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting bank account:', error);
    return NextResponse.json({ error: 'Failed to delete bank account' }, { status: 500 });
  }
}
