import { parse as parseHtml } from 'parse5';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface ExtractedPageData {
  title: string | null;
  description: string | null;
  canonicalUrl: string | null;
  headings: string[];
  links: string[];
  cleanText: string;
  articleText: string | null;
  structuredDataJson: string | null;
}

export function parseHtmlDocument(html: string, url: string = 'https://example.com'): ExtractedPageData {
  const headings: string[] = [];
  const links: string[] = [];
  let title: string | null = null;
  let description: string | null = null;
  let canonicalUrl: string | null = null;
  const jsonLdBlocks: any[] = [];
  const textBuffer: string[] = [];

  try {
    const document = parseHtml(html);

    function traverse(node: any) {
      if (!node) return;

      if (node.tagName) {
        const tagName = node.tagName.toLowerCase();

        if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
          const headingText = getTextContent(node).trim();
          if (headingText) headings.push(headingText);
        }

        if (tagName === 'a') {
          const hrefAttr = node.attrs?.find((a: any) => a.name === 'href');
          if (hrefAttr && hrefAttr.value) links.push(hrefAttr.value);
        }

        if (tagName === 'title') {
          title = getTextContent(node).trim();
        }

        if (tagName === 'meta') {
          const nameAttr = node.attrs?.find((a: any) => a.name?.toLowerCase() === 'name');
          const contentAttr = node.attrs?.find((a: any) => a.name?.toLowerCase() === 'content');
          if (nameAttr?.value?.toLowerCase() === 'description' && contentAttr?.value) {
            description = contentAttr.value.trim();
          }
        }

        if (tagName === 'link') {
          const relAttr = node.attrs?.find((a: any) => a.name?.toLowerCase() === 'rel');
          const hrefAttr = node.attrs?.find((a: any) => a.name?.toLowerCase() === 'href');
          if (relAttr?.value?.toLowerCase() === 'canonical' && hrefAttr?.value) {
            canonicalUrl = hrefAttr.value.trim();
          }
        }

        if (tagName === 'script') {
          const typeAttr = node.attrs?.find((a: any) => a.name?.toLowerCase() === 'type');
          if (typeAttr?.value?.toLowerCase() === 'application/ld+json') {
            const scriptText = getTextContent(node).trim();
            if (scriptText) {
              try { jsonLdBlocks.push(JSON.parse(scriptText)); } catch {}
            }
          }
        }

        if (tagName === 'script' || tagName === 'style' || tagName === 'noscript') {
          return;
        }
      }

      if (node.nodeName === '#text' && node.value) {
        const text = node.value.trim();
        if (text) textBuffer.push(text);
      }

      if (node.childNodes && node.childNodes.length > 0) {
        for (const child of node.childNodes) traverse(child);
      }
    }

    traverse(document);
  } catch {}

  const cleanText = textBuffer.join(' ').replace(/\s+/g, ' ').trim();

  // Try extracting main article text via Readability if available
  let articleText: string | null = null;
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (article && article.textContent) {
      articleText = article.textContent.replace(/\s+/g, ' ').trim();
    }
  } catch {
    articleText = null;
  }

  return {
    title,
    description,
    canonicalUrl,
    headings,
    links,
    cleanText,
    articleText: articleText || cleanText,
    structuredDataJson: jsonLdBlocks.length > 0 ? JSON.stringify(jsonLdBlocks) : null,
  };
}

function getTextContent(node: any): string {
  if (!node) return '';
  if (node.nodeName === '#text' && node.value) return node.value;
  if (node.childNodes && node.childNodes.length > 0) {
    return node.childNodes.map(getTextContent).join(' ');
  }
  return '';
}
