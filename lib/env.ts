import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string({ required_error: "DATABASE_URL is required (postgresql://...)" }),
  NEXT_PUBLIC_ENGINE_VERSION: z.string().default("1.0.0"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().default("https://us.i.posthog.com"),
  NEXT_PUBLIC_ANALYTICS_DEBUG: z.string().optional(),
  // No fallback on purpose: a default here would mean every deployment
  // that forgets to set this signs snapshots with the same public secret
  // documented in .env.example, making signatures forgeable.
  RESULT_SIGNING_SECRET: z
    .string({ required_error: "RESULT_SIGNING_SECRET is required and must not use the .env.example placeholder" })
    .min(16, "RESULT_SIGNING_SECRET must be at least 16 characters")
    .refine((v) => v !== "cbs_signing_secret_dev_2026", {
      message: "RESULT_SIGNING_SECRET is still set to the public .env.example placeholder — generate a real secret (e.g. `openssl rand -hex 32`)",
    }),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export const env = envSchema.parse(process.env);
