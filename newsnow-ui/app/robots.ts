import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/privacy/settings',
          '/privacy/test',
          '/_next/',
          '/static/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/privacy/settings',
          '/privacy/test',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/privacy/settings',
          '/privacy/test',
        ],
      },
    ],
    sitemap: 'https://shishixinwen.news/sitemap.xml',
    host: 'https://shishixinwen.news',
  }
}
