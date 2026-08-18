import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, requireTenantWriteAccess, getOrResolveMasjid } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {}

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);
    if (!masjid) {
      return NextResponse.json({ bankAccounts: [] });
    }

    let accounts = await prisma.bankAccount.findMany({
      where: { masjidId: masjid.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });

    // Auto-bootstrap from legacy Masjid bank info if accounts array is completely empty
    if (accounts.length === 0 && (masjid.bankName || masjid.bankAccNo)) {
      const defaultAccount = await prisma.bankAccount.create({
        data: {
          masjidId: masjid.id,
          bankName: masjid.bankName || 'Primary Bank Account',
          accountName: 'General Mosque Account',
          accountNumber: masjid.bankAccNo || '0000000000',
          ifscCode: masjid.bankIfsc || '',
          openingBalance: 0,
          currentBalance: 0,
          financialYear: masjid.financialYear || '2026-2027',
        },
      });
      accounts = [defaultAccount];
    }

    return NextResponse.json({ bankAccounts: accounts });
  } catch (error: any) {
    console.error('Error fetching bank accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch bank accounts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');

    let session: any = null;
    try {
      session = requireTenantWriteAccess(masjidIdParam);
    } catch (e: any) {
      return NextResponse.json(
        { error: e.message || 'Read-Only Mode: Guests cannot add bank accounts.' },
        { status: 403 }
      );
    }

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);
    if (!masjid) {
      return NextResponse.json({ error: 'Masjid context required' }, { status: 400 });
    }

    const body = await req.json();
    const { bankName, accountName, accountNumber, ifscCode, branchName, openingBalance, financialYear } = body;

    if (!bankName || !accountNumber) {
      return NextResponse.json({ error: 'Bank Name and Account Number are required' }, { status: 400 });
    }

    const numOpeningBalance = Number(openingBalance || 0);

    const bankAccount = await prisma.bankAccount.create({
      data: {
        masjidId: masjid.id,
        bankName,
        accountName: accountName || 'Mosque Account',
        accountNumber,
        ifscCode: ifscCode || '',
        branchName: branchName || '',
        financialYear: financialYear || masjid.financialYear || '2026-2027',
        openingBalance: numOpeningBalance,
        currentBalance: numOpeningBalance,
      },
    });

    try {
      await recordAuditLog({
        masjidId: masjid.id,
        userId: session?.userId,
        userEmail: session?.email,
        userRole: session?.role,
        action: 'CREATE_BANK_ACCOUNT',
        entity: 'BankAccount',
        entityId: bankAccount.id,
      });
    } catch (e) {}

    return NextResponse.json({ success: true, bankAccount });
  } catch (error: any) {
    console.error('Error creating bank account:', error);
    return NextResponse.json({ error: 'Failed to create bank account' }, { status: 500 });
  }
}
