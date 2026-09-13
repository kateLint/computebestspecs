# ComputeBestSpecs — Production Observability, Sentry & PostHog Runbook

> **Document Type:** Operations & Observability Runbook  
> **Status:** Active Foundation • Version 1.0

---

## 1. Environment Variable Configuration

Configure the following environment variables in your production hosting platform (e.g. Vercel, Docker, Fly.io):

```bash
# Sentry Error Monitoring
NEXT_PUBLIC_SENTRY_DSN="https://<publicKey>@o<orgId>.ingest.sentry.io/<projectId>"
SENTRY_DSN="https://<publicKey>@o<orgId>.ingest.sentry.io/<projectId>"
SENTRY_ENVIRONMENT="production"
SENTRY_RELEASE="1.0.0"

# PostHog Product Analytics
NEXT_PUBLIC_POSTHOG_KEY="phc_<your_public_client_key>"
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com" # Or https://eu.i.posthog.com

# Server Logging
LOG_LEVEL="info" # "debug" | "info" | "warn" | "error"

# Application Release
NEXT_PUBLIC_ENGINE_VERSION="1.0.0"
```

---

## 2. Security Headers & CSP Configuration

The Next.js middleware enforces strict Content Security Policy (CSP) headers:
- `connect-src 'self' https://*.posthog.com https://*.sentry.io;`
- `frame-ancestors 'none';` (Clickjacking protection)
- `X-Content-Type-Options: nosniff;`
- `Referrer-Policy: strict-origin-when-cross-origin;`
- `Permissions-Policy: camera=(), microphone=(), geolocation=();`

---

## 3. Health Checks & Uptime Monitoring

Configure your load balancer or uptime checker (e.g., BetterStack, Datadog, AWS Route53) to ping:

```text
GET /api/health
```

Expected response (`HTTP 200`):
```json
{
  "status": "healthy",
  "release": "1.0.0",
  "timestamp": "2026-09-13T16:00:00.000Z",
  "database": "connected"
}
```

---

## 4. Incident Debugging Workflow

1. **Locate Request ID**: When a user reports an issue or an error boundary triggers, extract the correlation ID (`cbs_req_...`) from the UI error message or response header `X-Request-ID`.
2. **Search Logs**: Search structured server JSON logs for `{"requestId": "cbs_req_..."}`.
3. **Inspect Sentry**: In Sentry, query `tags.requestId:"cbs_req_..."` to view the full sanitized stack trace and environment tags.
4. **PostHog Funnel**: Inspect the aggregate conversion funnel `homepage_viewed -> journey_started -> compatibility_check_completed` to detect drop-offs.
