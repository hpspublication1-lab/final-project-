import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';
export const revalidate = 86400; // 24 hours

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://samyakcee.com';
  const baseUrl = siteUrl.replace(/\/+$/, '');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/teacher/',
        '/login',
        '/auth/',
        '/student-dashboard',
        '/staff/',
        '/account/',
        '/profile/',
        '/checkout/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}