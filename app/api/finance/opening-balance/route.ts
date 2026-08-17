import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, getOrResolveMasjid } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

function getPreviousFY(fy: string): string {
  const parts = fy.split('-');
  if (parts.length === 2) {
    const start = parseInt(parts[0], 10);
    const end = parseInt(parts[1], 10);
    if (!isNaN(start) && !isNaN(end)) {
      return `${start - 1}-${end - 1}`;
    }
  }
  return '2024-2025';
}

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
    const previousFY = getPreviousFY(selectedFY);

    // 1. Fetch current FY configuration from MasjidFinancialYear or fallback to Masjid
    const [currentFYRecord, previousFYRecord, bankAccounts] = await Promise.all([
      prisma.masjidFinancialYear.findUnique({
        where: { masjidId_year: { masjidId: masjid.id, year: selectedFY } },
      }),
      prisma.masjidFinancialYear.findUnique({
        where: { masjidId_year: { masjidId: masjid.id, year: previousFY } },
      }),
      prisma.bankAccount.findMany({
        where: { masjidId: masjid.id, status: 'ACTIVE' },
        include: {
          yearlyOpenings: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const openingCash = currentFYRecord?.openingCash ?? Number(masjid.openingCashBalance || masjid.openingBalance || 0);

    // Prepare bank accounts with current FY opening balance
    const accountsData = bankAccounts.map((b) => {
      const yearOpening = b.yearlyOpenings.find((y) => y.financialYear === selectedFY);
      const prevYearOpening = b.yearlyOpenings.find((y) => y.financialYear === previousFY);
      return {
        id: b.id,
        bankName: b.bankName,
        accountName: b.accountName,
        accountNumber: b.accountNumber,
        ifscCode: b.ifscCode,
        openingBalance: yearOpening ? yearOpening.openingBalance : b.openingBalance,
        currentBalance: b.currentBalance,
        prevYearClosingBalance: prevYearOpening?.closingBalance ?? b.openingBalance,
      };
    });

    const totalOpeningBank = accountsData.reduce((sum, b) => sum + (Number(b.openingBalance) || 0), 0);

    // Calculate or fetch previous FY closing balances
    const prevCashClosing = previousFYRecord?.closingCash ?? (previousFYRecord?.openingCash || 0);
    const prevBankClosing = previousFYRecord?.closingBank ?? (previousFYRecord?.openingBank || 0);

    return NextResponse.json({
      financialYear: selectedFY,
      previousFinancialYear: previousFY,
      openingCashBalance: openingCash,
      totalOpeningBankBalance: totalOpeningBank,
      totalOpeningBalance: openingCash + totalOpeningBank,
      previousYearClosing: {
        year: previousFY,
        closingCash: prevCashClosing,
        closingBank: prevBankClosing,
        totalClosing: prevCashClosing + prevBankClosing,
      },
      bankAccounts: accountsData,
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
    const { financialYear, openingCashBalance, bankOpeningBalances, previousYearClosing, action } = body;

    const selectedFY = financialYear || masjid.financialYear || '2026-2027';
    const previousFY = getPreviousFY(selectedFY);

    let numCash = Number(openingCashBalance || 0);

    // If action is IMPORT_PREVIOUS_CLOSING, use previous year closing figures
    if (action === 'IMPORT_PREVIOUS_CLOSING' && previousYearClosing) {
      numCash = Number(previousYearClosing.closingCash || 0);
    }

    // 1. Upsert MasjidFinancialYear for current FY
    let totalBank = 0;
    if (Array.isArray(bankOpeningBalances)) {
      totalBank = bankOpeningBalances.reduce((sum: number, b: any) => sum + (Number(b.openingBalance) || 0), 0);
    }

    await prisma.masjidFinancialYear.upsert({
      where: { masjidId_year: { masjidId: masjid.id, year: selectedFY } },
      create: {
        masjidId: masjid.id,
        year: selectedFY,
        openingCash: numCash,
        openingBank: totalBank,
      },
      update: {
        openingCash: numCash,
        openingBank: totalBank,
      },
    });

    // 2. Also record previous FY record if closing numbers provided
    if (previousYearClosing) {
      await prisma.masjidFinancialYear.upsert({
        where: { masjidId_year: { masjidId: masjid.id, year: previousFY } },
        create: {
          masjidId: masjid.id,
          year: previousFY,
          closingCash: Number(previousYearClosing.closingCash || 0),
          closingBank: Number(previousYearClosing.closingBank || 0),
          isClosed: true,
        },
        update: {
          closingCash: Number(previousYearClosing.closingCash || 0),
          closingBank: Number(previousYearClosing.closingBank || 0),
          isClosed: true,
        },
      });
    }

    // 3. Update Masjid base model
    await prisma.masjid.update({
      where: { id: masjid.id },
      data: {
        openingCashBalance: numCash,
        openingBalance: numCash,
        financialYear: selectedFY,
      },
    });

    // 4. Update each bank account opening balance for this FY
    if (Array.isArray(bankOpeningBalances)) {
      for (const item of bankOpeningBalances) {
        if (!item.id) continue;
        const currentAcc = await prisma.bankAccount.findUnique({ where: { id: item.id } });
        if (currentAcc && currentAcc.masjidId === masjid.id) {
          const newOpening = Number(item.openingBalance || 0);
          const diff = newOpening - currentAcc.openingBalance;

          // Upsert BankAccountYearlyOpening
          await prisma.bankAccountYearlyOpening.upsert({
            where: { bankAccountId_financialYear: { bankAccountId: item.id, financialYear: selectedFY } },
            create: {
              bankAccountId: item.id,
              financialYear: selectedFY,
              openingBalance: newOpening,
            },
            update: {
              openingBalance: newOpening,
            },
          });

          // Update current bank account
          await prisma.bankAccount.update({
            where: { id: item.id },
            data: {
              openingBalance: newOpening,
              currentBalance: currentAcc.currentBalance + diff,
              financialYear: selectedFY,
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
        afterState: { financialYear: selectedFY, openingCash: numCash, totalBank },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: `Opening balances for FY ${selectedFY} updated successfully`,
    });
  } catch (error: any) {
    console.error('Error saving opening balances:', error);
    return NextResponse.json({ error: 'Failed to save opening balances' }, { status: 500 });
  }
}
