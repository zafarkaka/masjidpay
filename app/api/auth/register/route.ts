import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, TOKEN_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { sendIntroMessageEmail } from '@/lib/email';
import { ensureDatabaseTables } from '@/lib/db-init';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body.name || body.adminName;
    const email = body.email || body.adminEmail;
    const { password, phone, masjidName, address, city, state, country, zipCode, currency } = body;

    if (!name || !email || !password || !masjidName) {
      return NextResponse.json({ error: 'Name, email, password, and masjid name are required' }, { status: 400 });
    }

    await ensureDatabaseTables(prisma);

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } }).catch(() => null);
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    // Generate clean slug
    let baseSlug = masjidName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!baseSlug) baseSlug = 'masjid';
    let slug = baseSlug;
    let count = 1;
    while (await prisma.masjid.findUnique({ where: { slug } }).catch(() => null)) {
      slug = `${baseSlug}-${count++}`;
    }

    const hashedPassword = await hashPassword(password);

    // 1. Create Masjid in PENDING state
    const masjid = await prisma.masjid.create({
      data: {
        name: masjidName,
        slug,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || 'IN',
        zipCode: zipCode || null,
        phone: phone || null,
        email: normalizedEmail,
        currency: currency || 'INR',
        status: 'PENDING',
        openingBalance: 0,
      },
    });

    // 2. Create User
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone || null,
        role: 'MASJID_ADMIN',
      },
    });

    // 3. Link User to Masjid
    await prisma.masjidUser.create({
      data: {
        masjidId: masjid.id,
        userId: user.id,
        role: 'MASJID_ADMIN',
      },
    });

    // 4. Create default categories & fund
    const generalFund = await prisma.fund.create({
      data: {
        masjidId: masjid.id,
        name: 'General Fund',
        openingBalance: 0,
        currentBalance: 0,
      },
    });

    await prisma.donationCategory.createMany({
      data: [
        { masjidId: masjid.id, name: 'General Donation', isDefault: true },
        { masjidId: masjid.id, name: 'Zakat Fund' },
        { masjidId: masjid.id, name: 'Sadaqah' },
        { masjidId: masjid.id, name: 'Construction & Renovation' },
      ],
    });

    await prisma.expenseCategory.createMany({
      data: [
        { masjidId: masjid.id, name: 'Electricity & Utilities', isDefault: true },
        { masjidId: masjid.id, name: 'Maintenance & Repairs' },
        { masjidId: masjid.id, name: 'Staff Salary' },
      ],
    });

    // 5. Send Welcome & Intro Email to new Masjid Admin from domain masjidpay.org
    try {
      await sendIntroMessageEmail({
        toEmail: normalizedEmail,
        adminName: name,
        masjidName,
        masjidSlug: slug,
      });
    } catch (emailErr) {
      console.warn('Intro email warning:', emailErr);
    }

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      masjidId: masjid.id,
      masjidSlug: masjid.slug,
      masjidStatus: masjid.status,
    };

    const token = signToken(sessionPayload);

    try {
      await recordAuditLog({
        masjidId: masjid.id,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'REGISTER',
        entity: 'Masjid',
        entityId: masjid.id,
      });
    } catch (auditErr) {
      // Non-fatal
    }

    const response = NextResponse.json({
      success: true,
      masjid: {
        id: masjid.id,
        name: masjid.name,
        slug: masjid.slug,
        status: masjid.status,
      },
      user: sessionPayload,
    });

    response.cookies.set(TOKEN_NAME, token, AUTH_COOKIE_OPTIONS);

    return response;
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to complete registration' }, { status: 500 });
  }
}
