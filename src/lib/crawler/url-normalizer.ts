export function normalizeUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);

    // Filter out unsafe protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    // SSRF Check: Prevent private IPs, localhost
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.')
    ) {
      return null;
    }

    // Strip tracking query parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
    trackingParams.forEach((param) => url.searchParams.delete(param));

    // Sort remaining query params for canonical consistency
    url.searchParams.sort();

    // Standardize trailing slash for root paths
    if (url.pathname === '') {
      url.pathname = '/';
    }

    return url.toString();
  } catch {
    return null;
  }
}
