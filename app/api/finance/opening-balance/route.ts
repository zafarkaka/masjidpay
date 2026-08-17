import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, getOrResolveMasjid } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');
    const financialYear = searchParams.get('financialYear');

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {}

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);
    if (!masjid) {
      return NextResponse.json({ error: 'Masjid context required' }, { status: 400 });
    }

    const selectedFY = financialYear || masjid.financialYear || '2026-2027';

    const bankAccounts = await prisma.bankAccount.findMany({
      where: { masjidId: masjid.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });

    const totalOpeningBank = bankAccounts.reduce((sum, b) => sum + (Number(b.openingBalance) || 0), 0);
    const openingCash = Number(masjid.openingCashBalance || masjid.openingBalance || 0);

    return NextResponse.json({
      financialYear: selectedFY,
      openingCashBalance: openingCash,
      totalOpeningBankBalance: totalOpeningBank,
      totalOpeningBalance: openingCash + totalOpeningBank,
      bankAccounts: bankAccounts.map((b) => ({
        id: b.id,
        bankName: b.bankName,
        accountName: b.accountName,
        accountNumber: b.accountNumber,
        ifscCode: b.ifscCode,
        openingBalance: b.openingBalance,
        currentBalance: b.currentBalance,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching opening balances:', error);
    return NextResponse.json({ error: 'Failed to fetch opening balances' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { financialYear, openingCashBalance, bankOpeningBalances } = body;

    const numCash = Number(openingCashBalance !== undefined ? openingCashBalance : masjid.openingCashBalance || 0);

    // 1. Update Masjid opening cash balance & active financial year
    await prisma.masjid.update({
      where: { id: masjid.id },
      data: {
        openingCashBalance: numCash,
        openingBalance: numCash,
        financialYear: financialYear || masjid.financialYear || '2026-2027',
      },
    });

    // 2. Update each bank account opening balance and adjust current balance
    if (Array.isArray(bankOpeningBalances)) {
      for (const item of bankOpeningBalances) {
        if (!item.id) continue;
        const currentAcc = await prisma.bankAccount.findUnique({ where: { id: item.id } });
        if (currentAcc && currentAcc.masjidId === masjid.id) {
          const newOpening = Number(item.openingBalance || 0);
          const diff = newOpening - currentAcc.openingBalance;
          await prisma.bankAccount.update({
            where: { id: item.id },
            data: {
              openingBalance: newOpening,
              currentBalance: currentAcc.currentBalance + diff,
              financialYear: financialYear || currentAcc.financialYear,
            },
          });
        }
      }
    }

    try {
      await recordAuditLog({
        masjidId: masjid.id,
        userId: session?.userId,
        userEmail: session?.email,
        userRole: session?.role,
        action: 'UPDATE_OPENING_BALANCES',
        entity: 'Finance',
        entityId: masjid.id,
      });
    } catch (e) {}

    return NextResponse.json({ success: true, message: 'Opening balances updated successfully' });
  } catch (error: any) {
    console.error('Error saving opening balances:', error);
    return NextResponse.json({ error: 'Failed to save opening balances' }, { status: 500 });
  }
}
