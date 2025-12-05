import { z } from 'zod';

// AI Detection API validation schemas
export const aiDetectSchema = z.object({
  text: z.string()
    .min(1, 'Text is required')
    .max(10000, 'Text too long (max 10,000 characters)')
    .trim(),
  mode: z.enum(['basic', 'full', 'detailed']).optional().default('full')
});

// Payment checkout validation schemas
export const createCheckoutSchema = z.object({
  plan: z.enum(['free', 'pro', 'enterprise']),
  billingCycle: z.enum(['monthly', 'annual']).optional().default('monthly'),
  coupon: z.string().optional(),
  teamSize: z.number().min(1).max(100).optional().default(1),
  type: z.enum(['subscription', 'topup']).optional().default('subscription'),
  credits: z.number().min(1000).max(1000000).optional()
});

// Generic pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(50).optional().default(10)
});

// Environment validation schema
export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Service role key required'),
  ANTHROPIC_API_KEY: z.string().min(1, 'Anthropic API key required'),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1, 'Cloudflare account ID required'),
  CLOUDFLARE_API_KEY: z.string().min(1, 'Cloudflare API key required'),
  CLOUDFLARE_API_TOKEN: z.string().min(1, 'Cloudflare API token required'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),
  STRIPE_ENTERPRISE_PRICE_ID: z.string().optional(),
  DATABASE_URL: z.string().min(1, 'Database URL required'),
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL'),
  NEXT_PUBLIC_SITE_URL: z.string().url('Invalid site URL'),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional()
});