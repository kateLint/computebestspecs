import { NextRequest } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

// Per-instance, in-memory sliding-window counter. On Vercel this resets
// whenever a serverless instance recycles and isn't shared across
// concurrently-running instances, so it's a best-effort abuse brake, not a
// hard guarantee — enough to stop naive scripted spam. For real enforced
// limits under real traffic, swap this Map for Vercel KV / Upstash Redis.
const buckets = new Map<string, Bucket>();

const MAX_BUCKETS = 50_000;

function pruneIfNeeded(now: number) {
  if (buckets.size <= MAX_BUCKETS) return;
  buckets.forEach((bucket, key) => {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  });
}

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  { windowMs, max }: { windowMs: number; max: number }
): RateLimitResult {
  const now = Date.now();
  pruneIfNeeded(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, limit: max, remaining: max - 1, resetAt };
  }

  if (existing.count >= max) {
    return { allowed: false, limit: max, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, limit: max, remaining: max - existing.count, resetAt: existing.resetAt };
}

export function rateLimitResponseHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "Retry-After": String(Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000))),
  };
}
