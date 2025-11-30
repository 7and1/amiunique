import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/scan/history/'],
      },
    ],
    sitemap: 'https://amiunique.io/sitemap.xml',
  };
}
