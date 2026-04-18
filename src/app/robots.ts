import type { MetadataRoute } from 'next';

import { SITE_CONFIG } from '@/constants/siteConstants';

/**
 * Robots.txt Generation
 *
 * Defines crawling rules for search engines:
 * - Allows all public pages
 * - Blocks admin routes
 * - Blocks API routes (except specific ones if needed)
 * - References sitemap and feed locations
 */
const robots = (): MetadataRoute.Robots => {
    const baseUrl = SITE_CONFIG.url;
    const allowPaths: string[] = [
        '/',
        '/resume',
        '/api/og',
        '/api/og/',
        ...(SITE_CONFIG.seo.search.enabled ? [SITE_CONFIG.seo.search.path] : []),
    ];
    const protectedPaths = ['/admin', '/admin/', '/api', '/api/', '/private/'];

    const sitemapEntries = [
        `${baseUrl}/sitemap.xml`,
        ...(SITE_CONFIG.seo.rssEnabled ? [`${baseUrl}/rss.xml`] : []),
    ];

    return {
        rules: [
            {
                userAgent: '*',
                allow: allowPaths,
                disallow: protectedPaths,
            },
            {
                userAgent: ['GPTBot', 'CCBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot'],
                allow: allowPaths,
                disallow: protectedPaths,
            },
        ],
        sitemap: sitemapEntries,
        host: baseUrl,
    };
};

export default robots;
