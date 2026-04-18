import { OPEN_GRAPH_TYPES, type OpenGraphType } from '@/constants/schemaConstants';
import { SITE_CONFIG } from '@/constants/siteConstants';
import { buildDynamicOgImageUrl } from '@/lib/ogImage';
import { slugify } from '@/lib/utils';
import type { IFieldConfig } from '../FormWrapper';
import type { IFormData } from '../form';

export interface IBaseSeoFormContext {
    title?: string;
    description?: string;
    slug?: string;
    tags?: string[];
    coverImage?: string;
    'seo.ogType'?: string;
}

/**
 * Commonized SEO fields configuration generator.
 * Returns the standard layout for `seo.title`, `seo.description`, `seo.keywords`, etc.
 * 
 * @param formData The current form data used to build dynamic placeholder suggestions
 * @param canonicalBasePath The base path for canonical URL rendering (e.g. '/articles')
 */
export const getSeoFieldConfig = <TFormBody extends IFormData & IBaseSeoFormContext>(
    formData: TFormBody,
    canonicalBasePath: string,
    defaultOgType: OpenGraphType = OPEN_GRAPH_TYPES.WEBSITE
): Array<IFieldConfig<TFormBody>> => {
    // dynamically determine suggestions using the user's current input
    const derivedTitle = formData.title ? `${formData.title} — ${SITE_CONFIG.author.name}` : `SEO Title — ${SITE_CONFIG.author.name}`;
    const derivedSlug = formData.slug || (formData.title ? slugify(formData.title) : 'your-slug-here');
    const derivedCanonical = `${SITE_CONFIG.url}${canonicalBasePath}/${derivedSlug}`;
    const derivedTagsText = formData.tags && formData.tags.length > 0 ? formData.tags.join(', ') : 'Press enter to add SEO keywords';
    const derivedOgTitle = formData.title || 'Untitled Content';
    const derivedOgSubtitle = formData.description || 'Generated social preview image';
    const derivedOgImage = buildDynamicOgImageUrl({
        title: derivedOgTitle,
        subtitle: derivedOgSubtitle,
        tags: formData.tags ?? [],
    });
    const resolvedOgType = formData['seo.ogType'] || defaultOgType;

    return [
        {
            fieldtype: 'group',
            title: 'SEO Settings',
            subText: 'Override search engine metadata. Leave blank to inherit defaults from the fields above.',
            colsize: 'full',
            fields: [
                {
                    fieldtype: 'input',
                    name: 'seo.title',
                    label: 'SEO Title',
                    placeholder: derivedTitle,
                    hint: 'Max 70 chars. Appears in browser tab and search results.',
                    colsize: 'full',
                },
                {
                    fieldtype: 'textArea',
                    name: 'seo.description',
                    label: 'SEO Description',
                    placeholder: formData.description || 'A concise description...',
                    rows: 2,
                    hint: 'Max 160 chars. Shown in search result snippets.',
                    colsize: 'full',
                },
                {
                    fieldtype: 'tagInput',
                    name: 'seo.keywords',
                    label: 'SEO Keywords',
                    placeholder: derivedTagsText,
                    hint: 'Hit enter to add. Supplements topic tags.',
                    colsize: 'full',
                },
                {
                    fieldtype: 'input',
                    name: 'seo.ogImage',
                    label: 'OG Image URL',
                    placeholder: derivedOgImage,
                    type: 'url',
                    hint: 'Open Graph image (1200×630). Auto-generated via /api/og when left blank; custom URL overrides it.',
                    allowCopy: true,
                    colsize: 'full',
                },
                {
                    fieldtype: 'select',
                    name: 'seo.ogType',
                    label: 'Open Graph Type',
                    value: resolvedOgType,
                    options: [
                        { label: 'Website', value: OPEN_GRAPH_TYPES.WEBSITE },
                        { label: 'Article', value: OPEN_GRAPH_TYPES.ARTICLE },
                        { label: 'Video: Movie', value: OPEN_GRAPH_TYPES.VIDEO_MOVIE },
                        { label: 'Video: Episode', value: OPEN_GRAPH_TYPES.VIDEO_EPISODE },
                        { label: 'Video: TV Show', value: OPEN_GRAPH_TYPES.VIDEO_TV_SHOW },
                        { label: 'Video: Other', value: OPEN_GRAPH_TYPES.VIDEO_OTHER },
                        { label: 'Music: Song', value: OPEN_GRAPH_TYPES.MUSIC_SONG },
                        { label: 'Music: Album', value: OPEN_GRAPH_TYPES.MUSIC_ALBUM },
                        { label: 'Music: Playlist', value: OPEN_GRAPH_TYPES.MUSIC_PLAYLIST },
                        { label: 'Music: Radio Station', value: OPEN_GRAPH_TYPES.MUSIC_RADIO_STATION },
                        { label: 'Book', value: OPEN_GRAPH_TYPES.BOOK },
                        { label: 'Profile', value: OPEN_GRAPH_TYPES.PROFILE },
                    ],
                    hint: 'Use article for written posts, website for generic pages, and specialized types only when content truly matches.',
                    colsize: 'full',
                },
                {
                    fieldtype: 'input',
                    name: 'seo.canonicalUrl',
                    label: 'Canonical URL',
                    placeholder: derivedCanonical,
                    type: 'url',
                    hint: 'Override canonical URL. Leave blank to auto-derive.',
                    allowCopy: true,
                    colsize: 'full',
                },
                {
                    fieldtype: 'toggle',
                    name: 'seo.noIndex',
                    label: 'No Index — exclude this page from search engines',
                    colsize: 'full',
                },
            ],
        },
    ];
};
