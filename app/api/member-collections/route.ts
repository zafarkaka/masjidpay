import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, requireTenantWriteAccess, getOrResolveMasjid } from '@/lib/tenant';
import { generateWhatsAppInvoiceUrl } from '@/lib/whatsapp';
import { recordAuditLog } from '@/lib/audit';
import { supabaseAdmin } from '@/lib/supabase';
import { extractPaidMonths, getAllPaidMonthsForMember, getPendingMonthsUpToCurrent } from '@/lib/memberMonths';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');
    const query = searchParams.get('q');

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {
      // fallback
    }

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam || undefined);

    if (!masjid) {
      return NextResponse.json({ collections: [], masjidName: 'Jama Masjid Vaniyambadi' });
    }

    let collections: any[] = [];

    try {
      const where: any = { masjidId: masjid.id };
      if (query) {
        where.OR = [
          { memberName: { contains: query } },
          { memberPhone: { contains: query } },
          { receiptNo: { contains: query } },
          { forMonths: { contains: query } },
        ];
      }

      collections = await prisma.memberCollection.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
      });
    } catch (dbErr) {
      console.warn('Prisma query fallback to Supabase client:', dbErr);
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { data } = await supabaseAdmin
          .from('MemberCollection')
          .select('*')
          .eq('masjidId', masjid.id)
          .order('paymentDate', { ascending: false });
        if (data) collections = data;
      }
    }

    return NextResponse.json({ collections: collections || [], masjidName: masjid.name });
  } catch (error: any) {
    console.error('Member Collections GET API error:', error);
    return NextResponse.json({ collections: [], masjidName: 'Jama Masjid' });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      masjidId: reqMasjidId,
      memberId,
      memberName,
      memberPhone,
      memberAddress,
      amount,
      paymentType,
      monthsCount: reqMonthsCount,
      forMonths,
      paymentDate: reqPaymentDate,
      paymentMethod,
      referenceNo,
      notes,
    } = body;

    if (!memberName || !memberPhone || !amount) {
      return NextResponse.json({ error: 'Member name, phone, and amount are required' }, { status: 400 });
    }

    let session: any = null;
    try {
      session = requireTenantWriteAccess(reqMasjidId);
    } catch (e: any) {
      return NextResponse.json(
        { error: e.message || 'Read-Only Mode: Guests and Viewers cannot record member collections.' },
        { status: 403 }
      );
    }

    const masjid = await getOrResolveMasjid(session?.masjidId, reqMasjidId);

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid record could not be initialized' }, { status: 500 });
    }

    const receiptNo = `MC-${Date.now().toString().slice(-6)}`;
    const parsedAmount = Number(amount);
    const monthsCount = Number(reqMonthsCount || 1);
    const paymentDate = reqPaymentDate ? new Date(reqPaymentDate) : new Date();
    const cleanForMonths = forMonths || 'Current Month';
    const cleanMethod = paymentMethod || 'CASH';
    const cleanId = `mc-${crypto.randomUUID()}`;

    // Fetch member and previous collections to validate pending months & prevent duplicates
    let existingCollections: any[] = [];
    let memberRecord: any = null;

    try {
      if (memberId) {
        memberRecord = await prisma.member.findUnique({ where: { id: memberId } });
      }

      existingCollections = await prisma.memberCollection.findMany({
        where: {
          masjidId: masjid.id,
          OR: [
            ...(memberId ? [{ memberId }] : []),
            { memberPhone: memberPhone.trim() },
            { memberName: memberName.trim() },
          ],
        },
      });
    } catch (err) {
      console.warn('Could not fetch existing collections for validation:', err);
    }

    const previouslyPaidMonths = getAllPaidMonthsForMember(existingCollections);
    const requestedMonths = extractPaidMonths(cleanForMonths);

    // 1. Check for duplicate overlapping months
    const duplicateMonths = requestedMonths.filter((m) => previouslyPaidMonths.includes(m));
    if (duplicateMonths.length > 0) {
      return NextResponse.json(
        {
          error: `Duplicate payment rejected: The month(s) "${duplicateMonths.join(', ')}" have already been paid for this member.`,
        },
        { status: 400 }
      );
    }

    // 2. Check if member is already fully paid up to current month
    const { pendingMonths, isFullyPaid, currentMonthStr } = getPendingMonthsUpToCurrent(
      memberRecord,
      existingCollections
    );

    if (isFullyPaid && previouslyPaidMonths.length > 0 && requestedMonths.length > 0) {
      return NextResponse.json(
        {
          error: `Member is already fully paid up to the current month (${currentMonthStr}). No extra payment accepted.`,
        },
        { status: 400 }
      );
    }

    let collection: any = null;

    // Direct, resilient Supabase write with all schema compatibility fields
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const recordPayload = {
        id: cleanId,
        masjidId: masjid.id,
        memberId: memberId || null,
        memberName: memberName.trim(),
        memberPhone: memberPhone.trim(),
        memberAddress: memberAddress || null,
        amount: parsedAmount,
        paymentType: paymentType || 'MONTHLY',
        monthsCount,
        forMonths: cleanForMonths,
        month: cleanForMonths, // Legacy column compatibility
        paymentDate: paymentDate.toISOString(),
        paymentMethod: cleanMethod,
        paymentMode: cleanMethod, // Legacy column compatibility
        referenceNo: referenceNo || null,
        receiptNo,
        notes: notes || null,
      };

      const { data, error: sbError } = await supabaseAdmin
        .from('MemberCollection')
        .insert([recordPayload])
        .select();

      if (sbError) {
        console.warn('Supabase Admin insert note:', sbError);
      } else if (data && data.length > 0) {
        collection = data[0];
      }
    }

    // Prisma fallback if Supabase client direct was not used
    if (!collection) {
      collection = await prisma.memberCollection.create({
        data: {
          masjidId: masjid.id,
          memberId: memberId || null,
          memberName: memberName.trim(),
          memberPhone: memberPhone.trim(),
          memberAddress: memberAddress || null,
          amount: parsedAmount,
          paymentType: paymentType || 'MONTHLY',
          monthsCount,
          forMonths: cleanForMonths,
          paymentDate,
          paymentMethod: cleanMethod,
          referenceNo: referenceNo || null,
          receiptNo,
          notes: notes || null,
        },
      });
    }

    const whatsappUrl = generateWhatsAppInvoiceUrl({
      phone: memberPhone,
      memberName: memberName,
      amount: parsedAmount,
      monthsCount,
      forMonths: cleanForMonths,
      receiptNo,
      masjidName: masjid.name,
      paymentDate: paymentDate.toLocaleDateString('en-IN'),
      transparencyUrl: `https://masjidpay.org/masjid/${masjid.slug}/transparency`,
    });

    try {
      await recordAuditLog({
        masjidId: masjid.id,
        userId: session?.userId || 'system',
        userEmail: session?.email || 'admin@masjidpay.org',
        userRole: session?.role || 'MASJID_ADMIN',
        action: 'MEMBER_COLLECTION_RECORD',
        entity: 'MemberCollection',
        entityId: collection?.id || cleanId,
        afterState: { memberName, amount: parsedAmount, forMonths: cleanForMonths, receiptNo },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      collection,
      receiptNo,
      whatsappUrl,
    });
  } catch (error: any) {
    console.error('Create member collection error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to record collection' }, { status: 500 });
  }
}
