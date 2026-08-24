import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_MAINTENANCE_CONFIG } from '@/lib/maintenance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'MAINTENANCE_MODE' },
    });

    if (!setting) {
      return NextResponse.json(DEFAULT_MAINTENANCE_CONFIG);
    }

    try {
      const parsed = JSON.parse(setting.value);
      return NextResponse.json({
        ...DEFAULT_MAINTENANCE_CONFIG,
        ...parsed,
      });
    } catch {
      return NextResponse.json(DEFAULT_MAINTENANCE_CONFIG);
    }
  } catch (error) {
    console.error('Error fetching maintenance mode:', error);
    return NextResponse.json(DEFAULT_MAINTENANCE_CONFIG);
  }
}
