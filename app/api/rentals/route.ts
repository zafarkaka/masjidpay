import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, requireTenantWriteAccess, getOrResolveMasjid } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
      return NextResponse.json({ shops: [], payments: [] });
    }

    let shops: any[] = [];
    let payments: any[] = [];
    let settings: any[] = [];

    try {
      [shops, payments, settings] = await Promise.all([
        prisma.rentalShop.findMany({ where: { masjidId: masjid.id }, orderBy: { createdAt: 'desc' } }).catch(() => []),
        prisma.rentalPayment.findMany({ where: { masjidId: masjid.id }, orderBy: { paymentDate: 'desc' } }).catch(() => []),
        prisma.setting.findMany({ where: { masjidId: masjid.id, key: { startsWith: 'rental_meta_' } } }).catch(() => []),
      ]);
    } catch (dbErr) {
      console.warn('Prisma query warning in rentals GET:', dbErr);
    }

    // Fallback if empty and Supabase configured
    if ((!shops || shops.length === 0) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: sbShops } = await supabaseAdmin.from('RentalShop').select('*').eq('masjidId', masjid.id).order('createdAt', { ascending: false });
      if (sbShops) shops = sbShops;
    }
    if ((!payments || payments.length === 0) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: sbPayments } = await supabaseAdmin.from('RentalPayment').select('*').eq('masjidId', masjid.id).order('paymentDate', { ascending: false });
      if (sbPayments) payments = sbPayments;
    }

    // Attach metadata (photos, idCards, revisions) to shops
    const metaMap: Record<string, any> = {};
    settings.forEach((s) => {
      try {
        const shopId = s.key.replace(/^rental_meta_/, '');
        metaMap[shopId] = JSON.parse(s.value);
      } catch (e) {}
    });

    const enrichedShops = (shops || []).map((shop) => {
      const meta = metaMap[shop.id] || {};
      return {
        ...shop,
        photos: meta.photos || [],
        idCards: meta.idCards || [],
        revisions: meta.revisions || [],
      };
    });

    return NextResponse.json({
      shops: enrichedShops,
      payments: payments || [],
      masjidName: masjid.name,
      masjidSlug: masjid.slug,
    });
  } catch (error: any) {
    console.error('Failed to fetch rental data:', error);
    return NextResponse.json({ shops: [], payments: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      masjidId: reqMasjidId,
      shopId,
      shopNo,
      unitName,
      unitType,
      address,
      monthlyRent,
      securityDeposit,
      advanceBalance,
      dueDay,
      tenancyStartDate,
      status,
      tenantName,
      tenantPhone,
      internalNotes,
      amount,
      forMonth,
      paymentMethod,
      // Checkout/End Tenancy fields
      settlementType,
      returnAmount,
      deductionAmount,
      duesAmount,
      checkoutNotes,
    } = body;

    let session: any = null;
    try {
      session = requireTenantWriteAccess(reqMasjidId);
    } catch (e: any) {
      return NextResponse.json(
        { error: e.message || 'Read-Only Mode: Guests cannot manage rentals.' },
        { status: 403 }
      );
    }

    const masjid = await getOrResolveMasjid(session?.masjidId, reqMasjidId);

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid not found' }, { status: 404 });
    }

    // 1. ADD / REGISTER NEW RENTAL PROPERTY
    if (action === 'ADD_SHOP' || action === 'REGISTER_UNIT') {
      const cleanShopNo = (shopNo || unitName || 'Unit #1').trim();
      const parsedRent = Number(monthlyRent) || 0;
      const parsedDeposit = Number(securityDeposit) || 0;
      const cleanStatus = status || (tenantName ? 'OCCUPIED' : 'VACANT');
      const cleanId = `shop-${crypto.randomUUID()}`;

      const shop = await prisma.rentalShop.create({
        data: {
          id: cleanId,
          masjidId: masjid.id,
          shopNo: cleanShopNo,
          tenantName: tenantName?.trim() || 'Vacant Unit',
          tenantPhone: tenantPhone?.trim() || '',
          monthlyRent: parsedRent,
          status: cleanStatus,
        },
      });

      // If security deposit / advance was collected upon registration, record Advance Received entry
      if (parsedDeposit > 0 && cleanStatus === 'OCCUPIED') {
        const receiptNo = `ADV-${Date.now().toString().slice(-6)}`;
        await prisma.rentalPayment.create({
          data: {
            masjidId: masjid.id,
            shopId: shop.id,
            shopNo: shop.shopNo,
            tenantName: shop.tenantName,
            amount: parsedDeposit,
            forMonth: 'Advance Received • Security Deposit',
            paymentMethod: paymentMethod || 'BANK_TRANSFER',
            receiptNo,
          },
        });
      }

      // Save metadata (photos, idCards, revisions) if provided
      if (body.photos || body.idCards || body.revisions) {
        const metaKey = `rental_meta_${shop.id}`;
        const metaVal = JSON.stringify({
          photos: body.photos || [],
          idCards: body.idCards || [],
          revisions: body.revisions || [],
        });
        await prisma.setting.upsert({
          where: { masjidId_key: { masjidId: masjid.id, key: metaKey } },
          create: { masjidId: masjid.id, key: metaKey, value: metaVal },
          update: { value: metaVal },
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, shop });
    }

    // 2. EDIT / UPDATE RENTAL PROPERTY DETAILS
    if (action === 'EDIT_SHOP' || action === 'UPDATE_UNIT') {
      const existing = await prisma.rentalShop.findUnique({ where: { id: shopId } });
      if (!existing) {
        return NextResponse.json({ error: 'Rental unit not found' }, { status: 404 });
      }

      const cleanShopNo = (shopNo || unitName || existing.shopNo).trim();
      const parsedRent = Number(monthlyRent ?? existing.monthlyRent) || 0;

      const updated = await prisma.rentalShop.update({
        where: { id: shopId },
        data: {
          shopNo: cleanShopNo,
          tenantName: tenantName !== undefined ? tenantName.trim() : existing.tenantName,
          tenantPhone: tenantPhone !== undefined ? tenantPhone.trim() : existing.tenantPhone,
          monthlyRent: parsedRent,
          status: status || existing.status,
        },
      });

      // Save metadata (photos, idCards, revisions)
      if (body.photos !== undefined || body.idCards !== undefined || body.revisions !== undefined) {
        const metaKey = `rental_meta_${shopId}`;
        const existingSetting = await prisma.setting.findUnique({
          where: { masjidId_key: { masjidId: masjid.id, key: metaKey } },
        }).catch(() => null);

        let currentMeta: any = {};
        if (existingSetting?.value) {
          try {
            currentMeta = JSON.parse(existingSetting.value);
          } catch (e) {}
        }

        const newMeta = {
          photos: body.photos !== undefined ? body.photos : (currentMeta.photos || []),
          idCards: body.idCards !== undefined ? body.idCards : (currentMeta.idCards || []),
          revisions: body.revisions !== undefined ? body.revisions : (currentMeta.revisions || []),
        };

        await prisma.setting.upsert({
          where: { masjidId_key: { masjidId: masjid.id, key: metaKey } },
          create: { masjidId: masjid.id, key: metaKey, value: JSON.stringify(newMeta) },
          update: { value: JSON.stringify(newMeta) },
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, shop: updated });
    }

    // 2B. REVISE RENT / APPLY RATE CHANGE
    if (action === 'REVISE_RENT' || action === 'APPLY_RATE_CHANGE') {
      const existing = await prisma.rentalShop.findUnique({ where: { id: shopId } });
      if (!existing) {
        return NextResponse.json({ error: 'Rental unit not found' }, { status: 404 });
      }

      const newRentAmount = Number(body.newRent || monthlyRent || 0);
      const effectiveMonthStr = body.effectiveMonth || 'August 2026';
      const oldRentAmount = Number(existing.monthlyRent || 0);

      // Update shop rent
      const updated = await prisma.rentalShop.update({
        where: { id: shopId },
        data: {
          monthlyRent: newRentAmount,
        },
      });

      // Append to revisions history in Setting
      const metaKey = `rental_meta_${shopId}`;
      const existingSetting = await prisma.setting.findUnique({
        where: { masjidId_key: { masjidId: masjid.id, key: metaKey } },
      }).catch(() => null);

      let currentMeta: any = { photos: [], idCards: [], revisions: [] };
      if (existingSetting?.value) {
        try {
          currentMeta = JSON.parse(existingSetting.value);
        } catch (e) {}
      }

      const revisionEntry = {
        effectiveMonth: effectiveMonthStr,
        oldRent: oldRentAmount,
        newRent: newRentAmount,
        date: new Date().toISOString(),
        notes: body.notes || `Rate revised from ₹${oldRentAmount} to ₹${newRentAmount}`,
      };

      const updatedRevisions = [revisionEntry, ...(currentMeta.revisions || [])];

      await prisma.setting.upsert({
        where: { masjidId_key: { masjidId: masjid.id, key: metaKey } },
        create: {
          masjidId: masjid.id,
          key: metaKey,
          value: JSON.stringify({ ...currentMeta, revisions: updatedRevisions }),
        },
        update: {
          value: JSON.stringify({ ...currentMeta, revisions: updatedRevisions }),
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        shop: updated,
        revisions: updatedRevisions,
      });
    }

    // 3. END CURRENT TENANCY & PROCESS SECURITY DEPOSIT SETTLEMENT
    if (action === 'END_TENANCY' || action === 'CHECKOUT_TENANCY') {
      const shop = await prisma.rentalShop.findUnique({ where: { id: shopId } });
      if (!shop) {
        return NextResponse.json({ error: 'Rental unit not found' }, { status: 404 });
      }

      const depositAmount = Number(securityDeposit || 0);
      const parsedReturn = Number(returnAmount || 0);
      const parsedDeduction = Number(deductionAmount || 0);
      const parsedDues = Number(duesAmount || 0);
      const receiptNo = `RET-${Date.now().toString().slice(-6)}`;

      let forMonthText = 'Advance Returned • Security Deposit Return';

      if (settlementType === 'FULLY_RETURNED') {
        forMonthText = 'Advance Returned • Security Deposit Return';
      } else if (settlementType === 'PARTIALLY_RETURNED') {
        forMonthText = `Advance Returned • Partial Return (Deduction: ₹${parsedDeduction.toLocaleString('en-IN')})`;
      } else if (settlementType === 'ADJUSTED_DUES') {
        forMonthText = `Advance Adjusted • Adjusted Against Rent Dues (Refund: ₹${parsedReturn.toLocaleString('en-IN')})`;
      } else if (settlementType === 'RETAINED') {
        forMonthText = 'Advance Retained • Retained by Mosque for Damages / Forfeit';
      }

      // Record Advance Returned / Adjusted transaction in Ledger
      const returnPayment = await prisma.rentalPayment.create({
        data: {
          masjidId: masjid.id,
          shopId: shop.id,
          shopNo: shop.shopNo,
          tenantName: shop.tenantName,
          amount: parsedReturn > 0 ? parsedReturn : (settlementType === 'FULLY_RETURNED' ? depositAmount : 0),
          forMonth: forMonthText,
          paymentMethod: paymentMethod || 'BANK_TRANSFER',
          receiptNo,
        },
      });

      // Update unit status to VACANT and archive tenant name
      const updatedShop = await prisma.rentalShop.update({
        where: { id: shopId },
        data: {
          status: 'VACANT',
          tenantName: `Vacant (Former: ${shop.tenantName})`,
          tenantPhone: '',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Tenancy ended and security deposit settlement recorded in Finance Statement.',
        payment: returnPayment,
        shop: updatedShop,
      });
    }

    // 4. RECORD ADVANCE / SECURITY DEPOSIT PAYMENT
    if (action === 'RECORD_ADVANCE') {
      const shop = await prisma.rentalShop.findUnique({ where: { id: shopId } });
      if (!shop) {
        return NextResponse.json({ error: 'Rental unit not found' }, { status: 404 });
      }

      const receiptNo = `ADV-${Date.now().toString().slice(-6)}`;
      const parsedAmount = Number(amount || 0);

      const payment = await prisma.rentalPayment.create({
        data: {
          masjidId: masjid.id,
          shopId: shop.id,
          shopNo: shop.shopNo,
          tenantName: shop.tenantName,
          amount: parsedAmount,
          forMonth: 'Advance Received • Security Deposit',
          paymentMethod: paymentMethod || 'BANK_TRANSFER',
          receiptNo,
        },
      });

      return NextResponse.json({ success: true, payment });
    }

    // 5. COLLECT MONTHLY RENT
    const shop = await prisma.rentalShop.findUnique({ where: { id: shopId } });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const receiptNo = `RNT-${Date.now().toString().slice(-6)}`;
    const parsedAmount = Number(amount || shop.monthlyRent);
    const cleanMonth = forMonth || 'August 2026';

    const payment = await prisma.rentalPayment.create({
      data: {
        masjidId: masjid.id,
        shopId,
        shopNo: shop.shopNo,
        tenantName: shop.tenantName,
        amount: parsedAmount,
        forMonth: `Rent • ${cleanMonth}`,
        paymentMethod: paymentMethod || 'BANK_TRANSFER',
        receiptNo,
      },
    });

    // Record as Income entry in finance ledger
    const catGeneral = await prisma.donationCategory.findFirst({ where: { masjidId: masjid.id } });
    const fundGeneral = await prisma.fund.findFirst({ where: { masjidId: masjid.id } });

    if (catGeneral && fundGeneral) {
      await prisma.donation.create({
        data: {
          masjidId: masjid.id,
          donorId: null,
          categoryId: catGeneral.id,
          fundId: fundGeneral.id,
          amount: parsedAmount,
          date: new Date(),
          paymentMethod: paymentMethod || 'BANK_TRANSFER',
          referenceNo: receiptNo,
          notes: `Rent Payment - ${shop.shopNo} (${cleanMonth})`,
          receiptNo,
        },
      });

      await prisma.fund.update({
        where: { id: fundGeneral.id },
        data: { currentBalance: { increment: parsedAmount } },
      });
    }

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    console.error('Rental API error:', error);
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Failed to process rental action' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    const paymentId = searchParams.get('paymentId');
    const masjidIdParam = searchParams.get('masjidId');

    const session = requireTenantWriteAccess(masjidIdParam);
    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid not found' }, { status: 404 });
    }

    if (paymentId) {
      await prisma.rentalPayment.deleteMany({
        where: { id: paymentId, masjidId: masjid.id },
      });
      return NextResponse.json({ success: true, message: 'Payment record removed.' });
    }

    if (shopId) {
      await prisma.rentalShop.deleteMany({
        where: { id: shopId, masjidId: masjid.id },
      });
      return NextResponse.json({ success: true, message: 'Rental property deleted.' });
    }

    return NextResponse.json({ error: 'Missing shopId or paymentId parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('Rental DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete record' }, { status: 500 });
  }
}
