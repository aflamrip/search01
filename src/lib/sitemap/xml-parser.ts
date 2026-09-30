import { XMLParser } from 'fast-xml-parser';

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export function parseSitemapXml(xmlContent: string): { type: 'sitemap' | 'sitemap_index'; urls: SitemapEntry[] } {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const parsed = parser.parse(xmlContent);

  if (parsed.sitemapindex) {
    const sitemaps = Array.isArray(parsed.sitemapindex.sitemap)
      ? parsed.sitemapindex.sitemap
      : [parsed.sitemapindex.sitemap];

    const urls = sitemaps.filter(Boolean).map((item: any) => ({
      url: item.loc,
      lastmod: item.lastmod,
    }));

    return { type: 'sitemap_index', urls };
  }

  if (parsed.urlset) {
    const rawUrls = Array.isArray(parsed.urlset.url)
      ? parsed.urlset.url
      : [parsed.urlset.url];

    const urls = rawUrls.filter(Boolean).map((item: any) => ({
      url: item.loc,
      lastmod: item.lastmod,
      changefreq: item.changefreq,
      priority: item.priority,
    }));

    return { type: 'sitemap', urls };
  }

  return { type: 'sitemap', urls: [] };
}
