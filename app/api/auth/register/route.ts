import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { sendIntroMessageEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body.name || body.adminName;
    const email = body.email || body.adminEmail;
    const { password, phone, masjidName, address, city, state, country, zipCode, currency } = body;

    if (!name || !email || !password || !masjidName) {
      return NextResponse.json({ error: 'Name, email, password, and masjid name are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    // Generate clean slug
    let baseSlug = masjidName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!baseSlug) baseSlug = 'masjid';
    let slug = baseSlug;
    let count = 1;
    while (await prisma.masjid.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    const hashedPassword = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Masjid in PENDING state
      const masjid = await tx.masjid.create({
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
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          phone: phone || null,
          role: 'MASJID_ADMIN',
        },
      });

      // 3. Bind User to Masjid
      await tx.masjidUser.create({
        data: {
          masjidId: masjid.id,
          userId: user.id,
          role: 'MASJID_ADMIN',
        },
      });

      // 4. Seed Default Categories
      const donationCats = ['General Donation', 'Zakat', 'Sadaqah', 'Construction & Renovation', 'Masjid Maintenance', 'Education & Madrasa'];
      for (const catName of donationCats) {
        await tx.donationCategory.create({
          data: { masjidId: masjid.id, name: catName, isDefault: true },
        });
      }

      const expenseCats = ['Electricity & Utilities', 'Staff Salaries & Imam Support', 'Repairs & Maintenance', 'Water & Sanitation', 'Office Supplies & Admin'];
      for (const expName of expenseCats) {
        await tx.expenseCategory.create({
          data: { masjidId: masjid.id, name: expName, isDefault: true },
        });
      }

      const incCats = ['Rental Income', 'Hall Booking', 'Other Income'];
      for (const incName of incCats) {
        await tx.incomeCategory.create({
          data: { masjidId: masjid.id, name: incName, isDefault: true },
        });
      }

      // 5. Default General Fund
      await tx.fund.create({
        data: {
          masjidId: masjid.id,
          name: 'General Fund',
          description: 'Default operational fund',
          openingBalance: 0,
          currentBalance: 0,
        },
      });

      return { user, masjid };
    });

    // Send Intro & Welcome Email to newly registered Masjid Admin
    sendIntroMessageEmail({
      toEmail: normalizedEmail,
      adminName: name,
      masjidName,
      masjidSlug: result.masjid.slug,
    }).catch((e) => console.warn('Intro email error:', e));

    await recordAuditLog({
      masjidId: result.masjid.id,
      userId: result.user.id,
      userEmail: result.user.email,
      userRole: result.user.role,
      action: 'REGISTER_MASJID',
      entity: 'Masjid',
      entityId: result.masjid.id,
      afterState: { name: masjidName, slug: result.masjid.slug, email: normalizedEmail },
    });

    // Generate JWT token
    const token = await signToken({
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      masjidId: result.masjid.id,
    });

    setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
      masjid: {
        id: result.masjid.id,
        name: result.masjid.name,
        slug: result.masjid.slug,
        status: result.masjid.status,
      },
    });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json({ error: 'Failed to register masjid account' }, { status: 500 });
  }
}
