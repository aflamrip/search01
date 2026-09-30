import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../schema/index';

export async function seedLocalDatabase(d1: D1Database) {
  const db = drizzle(d1, { schema });

  const userId = 'user_admin_01';
  const siteId = 'site_astro_01';

  // Seed Admin User
  await db.insert(schema.users).values({
    id: userId,
    email: 'admin@searchengine.dev',
    passwordHash: '$2a$12$eImiTXuWVxfM37uY4JANjO',
    name: 'مدير المحرك',
    role: 'super_admin',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing();

  // Seed Site
  await db.insert(schema.sites).values({
    id: siteId,
    ownerId: userId,
    name: 'موقع Astro الرسمي',
    domain: 'astro.build',
    status: 'active',
    verificationStatus: 'verified',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastCrawledAt: new Date(),
  }).onConflictDoNothing();

  // Seed Pages & Contents
  const page1Id = 'page_01';
  await db.insert(schema.pages).values({
    id: page1Id,
    siteId,
    url: 'https://astro.build/blog/astro-5',
    canonicalUrl: 'https://astro.build/blog/astro-5',
    statusCode: 200,
    contentType: 'text/html',
    title: 'إطلاق إطار عمل Astro 5 رسميًا بأداء استثنائي',
    description: 'تعرف على التحديث الجديد Astro 5 والدعم الكامل لميزتي Server Islands و Content Layer مع تحسين سرعة الأداء.',
    language: 'ar',
    wordCount: 450,
    contentHash: 'hash_astro_5_release',
    firstSeenAt: new Date(),
    lastSeenAt: new Date(),
    lastCrawledAt: new Date(),
  }).onConflictDoNothing();

  await db.insert(schema.pageContents).values({
    pageId: page1Id,
    text: 'Astro 5 يمثل جيلًا جديدًا لبناء المواقع السريعة. يتضمن الإطار ميزات متقدمة مثل Server Islands التي تتيح تحميل البيانات الديناميكية من السيرفر بدون دمج كود JavaScript على جهاز العميل، مما يحقق نتائج مبهرة في تقييم أداء الصفحات Google Core Web Vitals.',
    headings: JSON.stringify(['Astro 5', 'Server Islands', 'تحسينات الأداء']),
  }).onConflictDoNothing();

  return { success: true, message: 'تم إدخال البيانات التجريبية بنجاح' };
}
