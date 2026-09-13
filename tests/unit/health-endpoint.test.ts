import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/health/route';
import { NextRequest } from 'next/server';

describe('Health API Endpoint (/api/health)', () => {
  it('returns status healthy with release metadata without leaking secrets or environment variables', async () => {
    const req = new NextRequest('http://localhost:3000/api/health');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.status).toBe('healthy');
    expect(body.release).toBeDefined();
    expect(body.timestamp).toBeDefined();

    // Verify no private environment variables or secrets leaked
    expect(body.env).toBeUndefined();
    expect(body.databaseUrl).toBeUndefined();
    expect(body.secret).toBeUndefined();
    expect(body.headers).toBeUndefined();
  });
});
