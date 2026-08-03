import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://event-management-lac-eight.vercel.app';
  
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/logo/', '/opengraph-image.png', '/twitter-image.png'],
      disallow: ['/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
