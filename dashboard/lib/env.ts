import { z } from 'zod';

/**
 * Environment variable validation schema
 * This ensures all required env vars are present and valid at startup
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // JWT
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters long')
    .refine(
      (val) => val !== 'your-super-secret-jwt-key-min-32-chars-CHANGE-THIS-IN-PRODUCTION',
      'JWT_SECRET must be changed from default value'
    ),

  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // App URLs
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  NEXT_PUBLIC_BASE_URL: z.string().url('NEXT_PUBLIC_BASE_URL must be a valid URL'),

  // Redis (Optional)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  REDIS_URL: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .startsWith('pk_', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_'),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_'),

  // Email (Resend)
  RESEND_API_KEY: z
    .string()
    .startsWith('re_', 'RESEND_API_KEY must start with re_'),
  RESEND_FROM_EMAIL: z.string().email('RESEND_FROM_EMAIL must be a valid email'),

  // Cloudflare R2
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  AWS_REGION: z.string().default('auto'),
  AWS_ENDPOINT: z.string().url('AWS_ENDPOINT must be a valid URL'),
  AWS_BUCKET_NAME: z.string().min(1, 'AWS_BUCKET_NAME is required'),

  // Cron Jobs (Optional in development, required in production)
  CRON_SECRET: z.string().min(32).optional(),

  // Migration (Optional)
  MIGRATION_SECRET: z.string().min(32).optional(),

  // Anthropic AI (Optional)
  ANTHROPIC_API_KEY: z.string().optional(),
});

// Additional validation for production environment
const productionEnvSchema = envSchema.extend({
  CRON_SECRET: z
    .string()
    .min(32, 'CRON_SECRET must be at least 32 characters in production'),
});

/**
 * Validates environment variables at startup
 * Throws descriptive error if validation fails
 */
function validateEnv() {
  try {
    // Choose schema based on environment
    const schema = process.env.NODE_ENV === 'production' ? productionEnvSchema : envSchema;

    const parsed = schema.safeParse(process.env);

    if (!parsed.success) {
      console.error('❌ Invalid environment variables:');
      console.error(JSON.stringify(parsed.error.format(), null, 2));

      throw new Error(
        'Invalid environment variables. Check the errors above and fix your .env file.'
      );
    }

    return parsed.data;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
      });
    }
    throw error;
  }
}

/**
 * Validated and typed environment variables
 * Use this instead of process.env for type safety
 */
export const env = validateEnv();

/**
 * Type-safe access to environment variables
 */
export type Env = z.infer<typeof envSchema>;
