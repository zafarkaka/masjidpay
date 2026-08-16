import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');

    const session = requireTenantAccess(masjidIdParam);
    const masjid = await prisma.masjid.findFirst({
      where: {
        OR: [
          { id: session.masjidId || '' },
          { id: masjidIdParam || '' },
          { slug: masjidIdParam || 'jama-masjid' },
        ],
      },
    });

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid not found' }, { status: 404 });
    }

    const [staff, payrolls] = await Promise.all([
      prisma.staff.findMany({ where: { masjidId: masjid.id }, orderBy: { createdAt: 'desc' } }),
      prisma.payroll.findMany({ where: { masjidId: masjid.id }, orderBy: { paymentDate: 'desc' } }),
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
    const { action, masjidId: reqMasjidId, name, roleTitle, monthlySalary, phone, staffId, amount, monthPaid, paymentMethod } = body;

    const session = requireTenantAccess(reqMasjidId);
    const masjid = await prisma.masjid.findFirst({
      where: {
        OR: [
          { id: session.masjidId || '' },
          { id: reqMasjidId || '' },
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

      const payroll = await prisma.payroll.create({
        data: {
          masjidId: masjid.id,
          staffId,
          staffName: staffMember.name,
          amount: Number(amount || staffMember.monthlySalary),
          monthPaid: monthPaid || 'August 2026',
          paymentMethod: paymentMethod || 'CASH',
          receiptNo,
        },
      });

      // Record as expense entry
      const catExpSalary = await prisma.expenseCategory.findFirst({ where: { masjidId: masjid.id, name: 'Staff Salaries' } });
      const fundGeneral = await prisma.fund.findFirst({ where: { masjidId: masjid.id } });

      if (catExpSalary && fundGeneral) {
        await prisma.expense.create({
          data: {
            masjidId: masjid.id,
            categoryId: catExpSalary.id,
            fundId: fundGeneral.id,
            title: `Salary - ${staffMember.name} (${monthPaid})`,
            amount: Number(amount || staffMember.monthlySalary),
            vendor: staffMember.name,
            paymentMethod: paymentMethod || 'CASH',
            referenceNo: receiptNo,
          },
        });

        await prisma.fund.update({
          where: { id: fundGeneral.id },
          data: { currentBalance: { decrement: Number(amount || staffMember.monthlySalary) } },
        });
      }

      return NextResponse.json({ success: true, payroll });
    }
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to save payroll record' }, { status: 500 });
  }
}
