import { describe, it, expect } from 'vitest';
import { normalizeUrl, inspectUrl } from '../src/lib/crawler/url-normalizer';

describe('URL Normalizer & tldts Tests', () => {
  it('should normalize URLs and strip tracking parameters', () => {
    const raw = 'https://EXAMPLE.com/path/?utm_source=google&q=astro';
    const normalized = normalizeUrl(raw);
    expect(normalized).toBe('https://example.com/path/?q=astro');
  });

  it('should parse domain, subdomain, and TLD using tldts', () => {
    const raw = 'https://blog.news.co.uk/article/123';
    const info = inspectUrl(raw);
    expect(info.isValid).toBe(true);
    expect(info.domain).toBe('news.co.uk');
    expect(info.subdomain).toBe('blog');
    expect(info.hostname).toBe('blog.news.co.uk');
  });

  it('should block SSRF attempts (localhost, private IPs)', () => {
    expect(normalizeUrl('http://localhost:8080/admin')).toBeNull();
    expect(normalizeUrl('http://127.0.0.1/')).toBeNull();
    expect(normalizeUrl('http://192.168.1.1/secret')).toBeNull();
  });
});
