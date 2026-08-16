import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess } from '@/lib/tenant';
import { ensureDatabaseTables } from '@/lib/db-init';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');

    await ensureDatabaseTables(prisma);

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {}

    const masjid = await prisma.masjid.findFirst({
      where: {
        OR: [
          { id: session?.masjidId || 'none' },
          { id: masjidIdParam || 'none' },
          { slug: masjidIdParam || 'jama-masjid' },
        ],
      },
    });

    if (!masjid) {
      return NextResponse.json({ staff: [], payrolls: [] });
    }

    const [staff, payrolls] = await Promise.all([
      prisma.staff.findMany({ where: { masjidId: masjid.id }, orderBy: { createdAt: 'desc' } }).catch(() => []),
      prisma.payroll.findMany({ where: { masjidId: masjid.id }, orderBy: { paymentDate: 'desc' } }).catch(() => []),
    ]);

    return NextResponse.json({ staff, payrolls });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch payroll data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      masjidId: reqMasjidId,
      name,
      roleTitle,
      monthlySalary,
      phone,
      staffId,
      amount,
      workingDays = 30,
      presentDays = 30,
      absentDays = 0,
      baseSalary = 0,
      perDaySalary = 0,
      earnedSalary = 0,
      allowance = 0,
      deduction = 0,
      netSalary = 0,
      monthPaid,
      paymentMethod,
      notes,
    } = body;

    await ensureDatabaseTables(prisma);

    let session: any = null;
    try {
      session = requireTenantAccess(reqMasjidId);
    } catch (e) {}

    const masjid = await prisma.masjid.findFirst({
      where: {
        OR: [
          { id: session?.masjidId || 'none' },
          { id: reqMasjidId || 'none' },
          { slug: reqMasjidId || 'jama-masjid' },
        ],
      },
    });

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid not found' }, { status: 404 });
    }

    if (action === 'ADD_STAFF') {
      const newStaff = await prisma.staff.create({
        data: {
          masjidId: masjid.id,
          name,
          roleTitle,
          phone: phone || null,
          monthlySalary: Number(monthlySalary),
        },
      });
      return NextResponse.json({ success: true, staff: newStaff });
    } else {
      // RECORD PAYROLL SALARY PAYMENT
      const staffMember = await prisma.staff.findUnique({ where: { id: staffId } });
      if (!staffMember) {
        return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
      }

      const receiptCount = await prisma.receipt.count({ where: { masjidId: masjid.id } });
      const receiptNo = `PAY-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(4, '0')}`;

      const finalBaseSalary = Number(baseSalary || staffMember.monthlySalary || amount);
      const finalWorkingDays = Number(workingDays || 30);
      const finalPresentDays = Number(presentDays ?? finalWorkingDays);
      const finalAbsentDays = Number(absentDays ?? Math.max(0, finalWorkingDays - finalPresentDays));
      const finalPerDay = finalWorkingDays > 0 ? (finalBaseSalary / finalWorkingDays) : 0;
      const finalEarned = Number(earnedSalary || (finalPerDay * finalPresentDays));
      const finalAllowance = Number(allowance || 0);
      const finalDeduction = Number(deduction || 0);
      const finalNet = Number(netSalary || (finalEarned + finalAllowance - finalDeduction));

      const payroll = await prisma.payroll.create({
        data: {
          masjidId: masjid.id,
          staffId,
          staffName: staffMember.name,
          amount: finalNet,
          baseSalary: finalBaseSalary,
          workingDays: finalWorkingDays,
          presentDays: finalPresentDays,
          absentDays: finalAbsentDays,
          perDaySalary: Math.round(finalPerDay * 100) / 100,
          earnedSalary: Math.round(finalEarned * 100) / 100,
          allowance: finalAllowance,
          deduction: finalDeduction,
          netSalary: finalNet,
          monthPaid: monthPaid || 'August 2026',
          paymentMethod: paymentMethod || 'CASH',
          receiptNo,
          notes: notes || null,
        },
      });

      // Record as expense entry
      const catExpSalary = await prisma.expenseCategory.findFirst({
        where: {
          masjidId: masjid.id,
          OR: [
            { name: 'Staff & Imam Payroll' },
            { name: 'Staff Salaries' },
            { name: 'Staff Salary' },
          ],
        },
      });
      const fundGeneral = await prisma.fund.findFirst({ where: { masjidId: masjid.id } });

      if (catExpSalary && fundGeneral) {
        await prisma.expense.create({
          data: {
            masjidId: masjid.id,
            categoryId: catExpSalary.id,
            fundId: fundGeneral.id,
            title: `Salary - ${staffMember.name} (${monthPaid || 'Payroll'})`,
            amount: finalNet,
            vendor: staffMember.name,
            paymentMethod: paymentMethod || 'CASH',
            referenceNo: receiptNo,
            description: `Days: ${finalPresentDays}/${finalWorkingDays} | Allow: ₹${finalAllowance} | Ded: ₹${finalDeduction}`,
          },
        });

        await prisma.fund.update({
          where: { id: fundGeneral.id },
          data: { currentBalance: { decrement: finalNet } },
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, payroll });
    }
  } catch (error: any) {
    console.error('Payroll API Error:', error);
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to save payroll record' }, { status: 500 });
  }
}
