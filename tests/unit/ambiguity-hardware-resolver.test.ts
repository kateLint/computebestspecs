import { describe, it, expect } from 'vitest';
import { resolveHardwareQuery } from '@/lib/normalization/hardware-resolver';

describe('Ambiguity-Aware Hardware Resolver', () => {
  it('resolves exact hardware queries with 1.0 confidence and canonical ID', () => {
    const rtx4090 = resolveHardwareQuery('RTX 4090');
    expect(rtx4090.status).toBe('EXACT');
    expect(rtx4090.canonicalId).toBe('nvidia-rtx-4090');
    expect(rtx4090.confidence).toBe(1.0);

    const m3Max = resolveHardwareQuery('Apple M3 Max');
    expect(m3Max.status).toBe('EXACT');
    expect(m3Max.canonicalId).toBe('apple-m3-max');
  });

  it('detects ambiguous hardware queries and offers discrete candidate options', () => {
    // "RTX 4070" without clarifying Desktop vs Laptop vs Super
    const ambiguous4070 = resolveHardwareQuery('RTX 4070');
    expect(ambiguous4070.status).toBe('AMBIGUOUS');
    expect(ambiguous4070.candidateOptions).toBeDefined();
    expect(ambiguous4070.candidateOptions?.length).toBeGreaterThanOrEqual(2);
    expect(ambiguous4070.disambiguationPrompt).toContain('Desktop 12GB, Laptop 8GB, or Super');

    // "Apple M3" without specifying Base, Pro, or Max
    const ambiguousM3 = resolveHardwareQuery('Apple M3');
    expect(ambiguousM3.status).toBe('AMBIGUOUS');
    expect(ambiguousM3.candidateOptions?.some(opt => opt.id === 'apple-m3-max')).toBe(true);
  });

  it('extracts generic specs when query is not in dictionary but contains core/ram figures', () => {
    const genericPc = resolveHardwareQuery('PC with 32GB RAM and 8 cores');
    expect(genericPc.status).toBe('PARSED_GENERIC');
    expect(genericPc.parsedSpecs?.ramGib).toBe(32);
    expect(genericPc.parsedSpecs?.cores).toBe(8);
  });

  it('falls back to UNKNOWN with low confidence for unparsable garbage input', () => {
    const garbage = resolveHardwareQuery('some random xyz toaster 9000');
    expect(garbage.status).toBe('UNKNOWN');
    expect(garbage.confidence).toBeLessThan(0.3);
  });
});
