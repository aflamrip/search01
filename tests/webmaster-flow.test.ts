import { describe, it, expect } from 'vitest';
import { AuthSignupSchema, AuthLoginSchema, SiteAddSchema, SitemapSubmitSchema } from '../src/lib/security/schemas';
import { hashPassword, verifyPassword } from '../src/lib/auth/session';

describe('Webmaster Signup, Login & Dashboard Suite Tests', () => {
  const testEmail = 'webmaster.test@domain.com';
  const testPassword = 'SecurePassword123!';
  let storedHash = '';

  it('1. should validate signup data and securely hash password', async () => {
    const signupData = {
      name: 'أحمد مشرف المواقع',
      email: testEmail,
      password: testPassword,
    };

    const validation = AuthSignupSchema.safeParse(signupData);
    expect(validation.success).toBe(true);

    storedHash = await hashPassword(testPassword);
    expect(storedHash).toContain(':');
    expect(storedHash.length).toBeGreaterThan(32);
  });

  it('2. should verify correct login credentials and reject wrong passwords', async () => {
    const loginData = { email: testEmail, password: testPassword };
    const validation = AuthLoginSchema.safeParse(loginData);
    expect(validation.success).toBe(true);

    const isMatch = await verifyPassword(testPassword, storedHash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword('WrongPass123', storedHash);
    expect(isWrongMatch).toBe(false);
  });

  it('3. should validate site domain registration for Webmasters', () => {
    const validSite = { domain: 'my-site.com', name: 'موقعي التجاري', ownerId: 'user-uuid-1' };
    const validation = SiteAddSchema.safeParse(validSite);
    expect(validation.success).toBe(true);

    const invalidSite = { domain: 'invalid_domain_format', ownerId: 'user-uuid-1' };
    const invalidValidation = SiteAddSchema.safeParse(invalidSite);
    expect(invalidValidation.success).toBe(false);
  });

  it('4. should validate sitemap submission URLs', () => {
    const validSitemap = { siteId: 'site-123', sitemapUrl: 'https://my-site.com/sitemap.xml' };
    const validation = SitemapSubmitSchema.safeParse(validSitemap);
    expect(validation.success).toBe(true);

    const invalidSitemap = { siteId: 'site-123', sitemapUrl: 'not-a-url' };
    const invalidValidation = SitemapSubmitSchema.safeParse(invalidSitemap);
    expect(invalidValidation.success).toBe(false);
  });
});
