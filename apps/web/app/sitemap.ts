import { MetadataRoute } from 'next';
import { getAllOrganizationSlugs } from '@/lib/queries/organizations';
import { getAllPersonSlugs } from '@/lib/queries/people';
import { getAllBillSlugs } from '@/lib/queries/bills';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://wa-transparency.org';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/activity`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/lists`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/lists/top-donors`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/lists/top-recipients`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/lists/top-contractors`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/lists/top-lobbyists`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  // Dynamic pages - organizations
  const orgSlugs = await getAllOrganizationSlugs();
  const orgPages: MetadataRoute.Sitemap = orgSlugs.map((slug) => ({
    url: `${BASE_URL}/org/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // Dynamic pages - people
  const personSlugs = await getAllPersonSlugs();
  const personPages: MetadataRoute.Sitemap = personSlugs.map((slug) => ({
    url: `${BASE_URL}/person/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // Dynamic pages - bills
  const billSlugs = await getAllBillSlugs();
  const billPages: MetadataRoute.Sitemap = billSlugs.map((bill) => ({
    url: `${BASE_URL}/bill/${bill.session}/${bill.number}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticPages, ...orgPages, ...personPages, ...billPages];
}
