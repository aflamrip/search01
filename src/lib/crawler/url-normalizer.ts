import { parse as parseTld } from 'tldts';

export interface NormalizedUrlResult {
  url: string;
  domain: string | null;
  subdomain: string | null;
  hostname: string;
  isValid: boolean;
}

export function normalizeUrl(rawUrl: string): string | null {
  const parsed = inspectUrl(rawUrl);
  return parsed.isValid ? parsed.url : null;
}

export function inspectUrl(rawUrl: string): NormalizedUrlResult {
  try {
    const url = new URL(rawUrl);

    // Filter out unsafe protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { url: '', domain: null, subdomain: null, hostname: '', isValid: false };
    }

    // SSRF Check: Prevent private IPs & localhost
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.')
    ) {
      return { url: '', domain: null, subdomain: null, hostname, isValid: false };
    }

    // Parse TLD & domain boundaries using tldts
    const tldInfo = parseTld(hostname);
    if (!tldInfo.domain) {
      return { url: '', domain: null, subdomain: null, hostname, isValid: false };
    }

    // Strip tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
    trackingParams.forEach((param) => url.searchParams.delete(param));

    // Sort remaining query params for canonical consistency
    url.searchParams.sort();

    // Standardize trailing slash for root paths
    if (url.pathname === '') {
      url.pathname = '/';
    }

    return {
      url: url.toString(),
      domain: tldInfo.domain,
      subdomain: tldInfo.subdomain || null,
      hostname: tldInfo.hostname || hostname,
      isValid: true,
    };
  } catch {
    return { url: '', domain: null, subdomain: null, hostname: '', isValid: false };
  }
}
