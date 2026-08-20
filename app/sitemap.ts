import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masjidpay.in';

  // 1. Static Core Public Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/status`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];

  // 2. Dynamic Public Masjid Donation & Transparency Pages
  try {
    const masjids = await prisma.masjid.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    const dynamicRoutes: MetadataRoute.Sitemap = masjids.flatMap((m) => {
      if (!m.slug) return [];
      return [
        {
          url: `${baseUrl}/donate/${m.slug}`,
          lastModified: m.updatedAt || new Date(),
          changeFrequency: 'daily',
          priority: 0.85,
        },
        {
          url: `${baseUrl}/masjid/${m.slug}/transparency`,
          lastModified: m.updatedAt || new Date(),
          changeFrequency: 'daily',
          priority: 0.8,
        },
      ];
    });

    return [...staticRoutes, ...dynamicRoutes];
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    return staticRoutes;
  }
}
