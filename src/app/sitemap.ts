import type { MetadataRoute } from 'next';

import { SITE_CONFIG } from '@/constants/siteConstants';
import {
    getPublishedArticleByPath,
    getPublishedArticleStaticPaths,
    getPublishedArticleTopics,
} from '@/server/new/public/content/article';
import { getPublishedBlogByPath, getPublishedBlogStaticPaths } from '@/server/new/public/content/blog';
import { getPublishedProjectByPath, getPublishedProjectStaticPaths } from '@/server/new/public/content/project';

export const revalidate = 3600;

/**
 * Dynamic Sitemap Generation
 *
 * Uses current public content providers (server-action layer) for dynamic URLs.
 * Includes article topic/detail URLs and blog/project detail URLs where public routes exist.
 */
const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
    const baseUrl = SITE_CONFIG.url;
    const now = new Date();
    const toSafeDate = (value: string | Date | undefined) => (value ? new Date(value) : now);

    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${baseUrl}/articles`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/blogs`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/projects`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/resume`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        ...(SITE_CONFIG.seo.search.enabled
            ? [
                  {
                      url: `${baseUrl}${SITE_CONFIG.seo.search.path}`,
                      lastModified: now,
                      changeFrequency: 'weekly' as const,
                      priority: 0.4,
                  },
              ]
            : []),
    ];

    const [topicResult, articlePathsResult, blogPathsResult, projectPathsResult] = await Promise.all([
        getPublishedArticleTopics({
            pagination: {
                offset: 0,
                limit: 5500,
            },
        }),
        getPublishedArticleStaticPaths(),
        getPublishedBlogStaticPaths(),
        getPublishedProjectStaticPaths(),
    ]);

    const topics = topicResult.success ? topicResult.data : [];
    const articlePaths = articlePathsResult.success ? articlePathsResult.data : [];
    const blogPaths = blogPathsResult.success ? blogPathsResult.data : [];
    const projectPaths = projectPathsResult.success ? projectPathsResult.data : [];

    const topicPages: MetadataRoute.Sitemap = topics.map((topic) => ({
        url: `${baseUrl}/articles/${topic.slug}`,
        lastModified: toSafeDate(topic.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    const [articleDetails, blogDetails, projectDetails] = await Promise.all([
        Promise.all(articlePaths.map((path) => getPublishedArticleByPath(path.topicSlug, path.articleSlug))),
        Promise.all(blogPaths.map((path) => getPublishedBlogByPath(path.blogSlug))),
        Promise.all(projectPaths.map((path) => getPublishedProjectByPath(path.projectSlug))),
    ]);

    const articlePages: MetadataRoute.Sitemap = articlePaths.map((article, index) => {
        const detail = articleDetails[index];
        const updatedAt = detail.success ? (detail.data?.updatedAt ?? detail.data?.publishedAt ?? undefined) : undefined;

        return {
            url: `${baseUrl}/articles/${article.topicSlug}/${article.articleSlug}`,
            lastModified: toSafeDate(updatedAt),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        };
    });

    const blogPages: MetadataRoute.Sitemap = blogPaths.map((blog, index) => {
        const detail = blogDetails[index];
        const updatedAt = detail.success ? (detail.data?.updatedAt ?? detail.data?.publishedAt ?? undefined) : undefined;

        return {
            url: `${baseUrl}/blogs/${blog.blogSlug}`,
            lastModified: toSafeDate(updatedAt),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        };
    });

    const projectPages: MetadataRoute.Sitemap = projectPaths.map((project, index) => {
        const detail = projectDetails[index];
        const updatedAt = detail.success ? (detail.data?.updatedAt ?? detail.data?.publishedAt ?? undefined) : undefined;

        return {
            url: `${baseUrl}/projects/${project.projectSlug}`,
            lastModified: toSafeDate(updatedAt),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        };
    });

    return [...staticPages, ...topicPages, ...articlePages, ...blogPages, ...projectPages];
};

export default sitemap;
