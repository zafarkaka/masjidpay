import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, requireTenantWriteAccess, getOrResolveMasjid } from '@/lib/tenant';
import { ensureDatabaseTables } from '@/lib/db-init';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');

    await ensureDatabaseTables(prisma);

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {}

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);

    if (!masjid) {
      return NextResponse.json({ staff: [], payrolls: [] });
    }

    let staff: any[] = [];
    let payrolls: any[] = [];

    try {
      [staff, payrolls] = await Promise.all([
        prisma.staff.findMany({ where: { masjidId: masjid.id }, orderBy: { createdAt: 'desc' } }).catch(() => []),
        prisma.payroll.findMany({ where: { masjidId: masjid.id }, orderBy: { paymentDate: 'desc' } }).catch(() => []),
      ]);
    } catch (dbErr) {
      console.warn('Prisma query note in Payroll GET, using Supabase client:', dbErr);
    }

    // Supabase fallback if empty/cold
    if ((!staff || staff.length === 0) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: sbStaff } = await supabaseAdmin.from('Staff').select('*').eq('masjidId', masjid.id).order('createdAt', { ascending: false });
      if (sbStaff) staff = sbStaff;
    }
    if ((!payrolls || payrolls.length === 0) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: sbPayrolls } = await supabaseAdmin.from('Payroll').select('*').eq('masjidId', masjid.id).order('paymentDate', { ascending: false });
      if (sbPayrolls) payrolls = sbPayrolls;
    }

    return NextResponse.json({ staff: staff || [], payrolls: payrolls || [] });
  } catch (error: any) {
    console.error('Failed to fetch payroll data:', error);
    return NextResponse.json({ staff: [], payrolls: [] });
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
      session = requireTenantWriteAccess(reqMasjidId);
    } catch (e: any) {
      return NextResponse.json(
        { error: e.message || 'Read-Only Mode: Guests and Viewers cannot manage payroll or staff.' },
        { status: 403 }
      );
    }

    const masjid = await getOrResolveMasjid(session?.masjidId, reqMasjidId);

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid not found' }, { status: 404 });
    }

    if (action === 'ADD_STAFF') {
      const cleanId = `staff-${crypto.randomUUID()}`;
      const parsedSalary = Number(monthlySalary) || 0;
      const cleanRole = roleTitle || 'Staff';
      let newStaff: any = null;

      // Resilient Supabase direct insert with all legacy and modern column aliases
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const staffPayload = {
          id: cleanId,
          masjidId: masjid.id,
          name: name.trim(),
          roleTitle: cleanRole,
          designation: cleanRole, // Legacy column compatibility
          phone: phone || null,
          monthlySalary: parsedSalary,
          salary: parsedSalary, // Legacy column compatibility
          status: 'ACTIVE',
        };

        const { data, error: sbErr } = await supabaseAdmin.from('Staff').insert([staffPayload]).select();
        if (sbErr) {
          console.warn('Supabase Staff insert warning:', sbErr);
        } else if (data && data.length > 0) {
          newStaff = data[0];
        }
      }

      if (!newStaff) {
        newStaff = await prisma.staff.create({
          data: {
            masjidId: masjid.id,
            name: name.trim(),
            roleTitle: cleanRole,
            phone: phone || null,
            monthlySalary: parsedSalary,
          },
        });
      }

      return NextResponse.json({ success: true, staff: newStaff });
    } else {
      // RECORD PAYROLL SALARY PAYMENT
      let staffMember: any = null;
      try {
        staffMember = await prisma.staff.findUnique({ where: { id: staffId } });
      } catch (e) {}

      if (!staffMember && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { data } = await supabaseAdmin.from('Staff').select('*').eq('id', staffId).single();
        if (data) staffMember = data;
      }

      if (!staffMember) {
        return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
      }

      const cleanMonth = (monthPaid || 'August 2026').trim();

      // STRICT CHECK: PREVENT PAYING SALARY TWICE TO THE SAME STAFF IN THE SAME MONTH
      let existingPayroll: any = null;
      try {
        existingPayroll = await prisma.payroll.findFirst({
          where: {
            masjidId: masjid.id,
            staffId,
            monthPaid: cleanMonth,
          },
        });
      } catch (e) {}

      if (!existingPayroll && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { data: sbExisting } = await supabaseAdmin
          .from('Payroll')
          .select('id, receiptNo, paymentDate, amount, netSalary')
          .eq('masjidId', masjid.id)
          .eq('staffId', staffId)
          .or(`monthPaid.eq.${cleanMonth},month.eq.${cleanMonth}`)
          .maybeSingle();

        if (sbExisting) existingPayroll = sbExisting;
      }

      if (existingPayroll) {
        return NextResponse.json(
          {
            error: `Salary for ${staffMember.name} has already been paid for ${cleanMonth} (Receipt: ${existingPayroll.receiptNo || 'Processed'}). Duplicate salary payments in the same month are not allowed.`,
          },
          { status: 400 }
        );
      }

      const receiptNo = `PAY-${Date.now().toString().slice(-6)}`;
      const finalBaseSalary = Number(baseSalary || staffMember.monthlySalary || staffMember.salary || amount || 0);
      const finalWorkingDays = Number(workingDays || 30);
      const finalPresentDays = Number(presentDays ?? finalWorkingDays);
      const finalAbsentDays = Number(absentDays ?? Math.max(0, finalWorkingDays - finalPresentDays));
      const finalPerDay = finalWorkingDays > 0 ? (finalBaseSalary / finalWorkingDays) : 0;
      const finalEarned = Number(earnedSalary || (finalPerDay * finalPresentDays));
      const finalAllowance = Number(allowance || 0);
      const finalDeduction = Number(deduction || 0);
      const finalNet = Number(netSalary || (finalEarned + finalAllowance - finalDeduction));
      const cleanMethod = paymentMethod || 'CASH';
      const cleanPayrollId = `pay-${crypto.randomUUID()}`;

      let payroll: any = null;

      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const payPayload = {
          id: cleanPayrollId,
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
          monthPaid: cleanMonth,
          month: cleanMonth, // Legacy compatibility
          paymentMethod: cleanMethod,
          paymentMode: cleanMethod, // Legacy compatibility
          receiptNo,
          notes: notes || null,
          status: 'PAID',
        };

        const { data, error: pErr } = await supabaseAdmin.from('Payroll').insert([payPayload]).select();
        if (pErr) console.warn('Supabase Payroll insert note:', pErr);
        else if (data && data.length > 0) payroll = data[0];
      }

      if (!payroll) {
        payroll = await prisma.payroll.create({
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
            monthPaid: cleanMonth,
            paymentMethod: cleanMethod,
            receiptNo,
            notes: notes || null,
          },
        });
      }

      return NextResponse.json({ success: true, payroll });
    }
  } catch (error: any) {
    console.error('Payroll API Error:', error);
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error?.message || 'Failed to save payroll record' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const masjidIdParam = searchParams.get('masjidId');

    if (!id) {
      return NextResponse.json({ error: 'Payroll ID is required' }, { status: 400 });
    }

    const session = requireTenantWriteAccess(masjidIdParam);
    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid not found' }, { status: 404 });
    }

    await prisma.payroll.deleteMany({
      where: {
        id,
        masjidId: masjid.id,
      },
    });

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await supabaseAdmin.from('Payroll').delete().eq('id', id).eq('masjidId', masjid.id);
    }

    return NextResponse.json({ success: true, message: 'Payroll voucher removed successfully' });
  } catch (error: any) {
    console.error('Payroll DELETE API error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete payroll record' }, { status: 500 });
  }
}

