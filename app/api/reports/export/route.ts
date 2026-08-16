import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');
    const reportType = searchParams.get('reportType') || 'daily'; // daily, monthly, member_collections, donations, expenses, income
    const dateParam = searchParams.get('date'); // e.g. 2026-08-15
    const monthParam = searchParams.get('month'); // e.g. 2026-08
    const format = searchParams.get('format') || 'json'; // json, excel

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

    const masjidId = masjid.id;

    // Filter date boundaries
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (reportType === 'daily' && dateParam) {
      const target = new Date(dateParam);
      startDate = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 0, 0, 0);
      endDate = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 23, 59, 59);
    } else if (reportType === 'monthly' && monthParam) {
      const [y, m] = monthParam.split('-').map(Number);
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 0, 23, 59, 59);
    }

    let records: any[] = [];
    let summary = { totalIncome: 0, totalExpenses: 0, totalMemberCollections: 0, netBalance: 0 };

    if (reportType === 'daily' || reportType === 'donations' || reportType === 'income') {
      const whereDon: any = { masjidId, isVoided: false };
      const whereInc: any = { masjidId, isVoided: false };
      const whereCol: any = { masjidId };

      if (startDate && endDate) {
        whereDon.date = { gte: startDate, lte: endDate };
        whereInc.date = { gte: startDate, lte: endDate };
        whereCol.paymentDate = { gte: startDate, lte: endDate };
      }

      const [donations, incomes, collections] = await Promise.all([
        prisma.donation.findMany({ where: whereDon, include: { donor: true, category: true, fund: true }, orderBy: { date: 'desc' } }),
        prisma.income.findMany({ where: whereInc, include: { category: true, fund: true }, orderBy: { date: 'desc' } }),
        prisma.memberCollection.findMany({ where: whereCol, orderBy: { paymentDate: 'desc' } }),
      ]);

      const donRecords = donations.map((d) => ({
        receiptNo: d.receiptNo || 'REC-N/A',
        date: new Date(d.date).toLocaleDateString('en-IN'),
        name: d.isAnonymous ? 'Anonymous' : d.donor?.name || d.notes || 'General Contribution',
        category: d.category.name,
        fund: d.fund.name,
        amount: d.amount,
        paymentMethod: d.paymentMethod,
        sourceType: 'Donation',
      }));

      const incRecords = incomes.map((i) => ({
        receiptNo: `INC-${i.id.slice(0, 6).toUpperCase()}`,
        date: new Date(i.date).toLocaleDateString('en-IN'),
        name: i.payer || i.title,
        category: i.category.name,
        fund: i.fund.name,
        amount: i.amount,
        paymentMethod: i.paymentMethod,
        sourceType: 'Mosque Income',
      }));

      const colRecords = collections.map((c) => ({
        receiptNo: c.receiptNo || 'REC-N/A',
        date: new Date(c.paymentDate).toLocaleDateString('en-IN'),
        name: c.memberName,
        category: 'Member Collection',
        fund: 'General Fund',
        amount: c.amount,
        paymentMethod: c.paymentMethod,
        sourceType: 'Member Collection',
      }));

      records = [...donRecords, ...incRecords, ...colRecords];
      summary.totalIncome = records.reduce((acc, r) => acc + r.amount, 0);
      summary.totalMemberCollections = collections.reduce((acc, c) => acc + c.amount, 0);
      summary.netBalance = summary.totalIncome;
    } else if (reportType === 'member_collections') {
      const where: any = { masjidId };
      if (startDate && endDate) {
        where.paymentDate = { gte: startDate, lte: endDate };
      }

      const collections = await prisma.memberCollection.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
      });

      records = collections.map((c) => ({
        receiptNo: c.receiptNo || 'REC-N/A',
        date: new Date(c.paymentDate).toLocaleDateString('en-IN'),
        name: c.memberName,
        phone: c.memberPhone,
        address: c.memberAddress || 'N/A',
        forMonths: c.forMonths || 'Single Month',
        amount: c.amount,
        paymentMethod: c.paymentMethod,
      }));

      summary.totalMemberCollections = records.reduce((acc, r) => acc + r.amount, 0);
      summary.totalIncome = summary.totalMemberCollections;
      summary.netBalance = summary.totalMemberCollections;
    } else if (reportType === 'expenses') {
      const where: any = { masjidId, isVoided: false };
      if (startDate && endDate) {
        where.date = { gte: startDate, lte: endDate };
      }

      const expenses = await prisma.expense.findMany({
        where,
        include: { category: true, fund: true },
        orderBy: { date: 'desc' },
      });

      records = expenses.map((e) => ({
        id: e.id,
        date: new Date(e.date).toLocaleDateString('en-IN'),
        title: e.title,
        vendor: e.vendor || 'N/A',
        category: e.category.name,
        fund: e.fund.name,
        amount: e.amount,
        paymentMethod: e.paymentMethod,
      }));

      summary.totalExpenses = records.reduce((acc, r) => acc + r.amount, 0);
      summary.netBalance = -summary.totalExpenses;
    } else if (reportType === 'monthly') {
      const whereInc: any = { masjidId, isVoided: false };
      const whereExp: any = { masjidId, isVoided: false };
      const whereCol: any = { masjidId };

      if (startDate && endDate) {
        whereInc.date = { gte: startDate, lte: endDate };
        whereExp.date = { gte: startDate, lte: endDate };
        whereCol.paymentDate = { gte: startDate, lte: endDate };
      }

      const [donations, incomes, collections, expenses] = await Promise.all([
        prisma.donation.findMany({ where: whereInc, include: { category: true } }),
        prisma.income.findMany({ where: whereInc, include: { category: true } }),
        prisma.memberCollection.findMany({ where: whereCol }),
        prisma.expense.findMany({ where: whereExp, include: { category: true } }),
      ]);

      const incTotal = donations.reduce((acc, d) => acc + d.amount, 0) +
                        incomes.reduce((acc, i) => acc + i.amount, 0) +
                        collections.reduce((acc, c) => acc + c.amount, 0);

      const expTotal = expenses.reduce((acc, e) => acc + e.amount, 0);

      records = [
        ...donations.map((d) => ({
          type: 'INCOME',
          date: new Date(d.date).toLocaleDateString('en-IN'),
          title: d.notes || d.category.name,
          amount: d.amount,
          paymentMethod: d.paymentMethod,
        })),
        ...incomes.map((i) => ({
          type: 'INCOME',
          date: new Date(i.date).toLocaleDateString('en-IN'),
          title: i.title || i.payer || 'Mosque Income',
          amount: i.amount,
          paymentMethod: i.paymentMethod,
        })),
        ...collections.map((c) => ({
          type: 'INCOME',
          date: new Date(c.paymentDate).toLocaleDateString('en-IN'),
          title: `Member Fee - ${c.memberName}`,
          amount: c.amount,
          paymentMethod: c.paymentMethod,
        })),
        ...expenses.map((e) => ({
          type: 'EXPENSE',
          date: new Date(e.date).toLocaleDateString('en-IN'),
          title: e.title,
          amount: e.amount,
          paymentMethod: e.paymentMethod,
        })),
      ];

      summary.totalIncome = incTotal;
      summary.totalExpenses = expTotal;
      summary.totalMemberCollections = collections.reduce((acc, c) => acc + c.amount, 0);
      summary.netBalance = incTotal - expTotal;
    }

    // EXCEL / CSV FORMAT DOWNLOAD
    if (format === 'excel') {
      let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel

      if (reportType === 'member_collections') {
        csvContent += 'Receipt No,Payment Date,Member Name,Phone,Address,Period Covered,Amount (INR),Payment Mode\n';
        records.forEach((r) => {
          csvContent += `"${r.receiptNo}","${r.date}","${r.name}","${r.phone}","${r.address}","${r.forMonths}",${r.amount},"${r.paymentMethod}"\n`;
        });
        csvContent += `\n,,,,,TOTAL COLLECTION,${summary.totalMemberCollections},\n`;
      } else if (reportType === 'expenses') {
        csvContent += 'Date,Expense Title,Vendor,Category,Fund,Amount (INR),Payment Mode\n';
        records.forEach((r) => {
          csvContent += `"${r.date}","${r.title}","${r.vendor}","${r.category}","${r.fund}",${r.amount},"${r.paymentMethod}"\n`;
        });
        csvContent += `\n,,,,,TOTAL EXPENSES,${summary.totalExpenses},\n`;
      } else {
        csvContent += 'Receipt No,Date,Contributor / Payer Name,Category,Fund,Source,Amount (INR),Payment Mode\n';
        records.forEach((r) => {
          csvContent += `"${r.receiptNo || 'N/A'}","${r.date}","${r.name || r.title}","${r.category || 'Income'}","${r.fund || 'General'}","${r.sourceType || 'Income'}",${r.amount},"${r.paymentMethod}"\n`;
        });
        csvContent += `\n,,,,,,TOTAL AMOUNT,${summary.totalIncome},\n`;
      }

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${reportType}-report-${Date.now()}.csv"`,
        },
      });
    }

    // JSON FORMAT FOR LIVE PREVIEW & PDF PRINTING
    return NextResponse.json({
      success: true,
      masjidName: masjid.name,
      reportType,
      dateParam: dateParam || new Date().toISOString().split('T')[0],
      monthParam: monthParam || 'August 2026',
      summary,
      records,
    });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Reports Export API error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
