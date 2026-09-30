import { z } from 'zod';

export const SearchQuerySchema = z.object({
  q: z.string().min(1, 'كلمة البحث مطلوبة').max(500, 'كلمة البحث طويلة جداً'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  type: z.enum(['web', 'news', 'images', 'videos']).default('web'),
});

export const SiteAddSchema = z.object({
  domain: z
    .string()
    .min(3, 'اسم النطاق قصير جداً')
    .max(253, 'اسم النطاق طويل جداً')
    .regex(/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/, 'اسم النطاق غير صالح'),
  name: z.string().max(100).optional(),
  ownerId: z.string().min(1, 'معرف المستخدم مطلوب'),
});

export const SitemapSubmitSchema = z.object({
  siteId: z.string().min(1, 'معرف الموقع مطلوب'),
  sitemapUrl: z.string().url('رابط خريطة الموقع غير صالح'),
});

export const AuthSignupSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن لا يقل عن حرفين').max(100),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف'),
});

export const AuthLoginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});
