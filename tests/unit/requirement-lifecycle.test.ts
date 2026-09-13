import { describe, it, expect } from 'vitest';
import {
  RequirementRevision,
  transitionRequirementState,
  auditRequirementRevision,
  canTransitionState
} from '@/lib/lifecycle/requirement-lifecycle';

describe('Software Requirement Revision Lifecycle & Freshness Auditor', () => {
  const sampleValidRevision: RequirementRevision = {
    revisionId: 'rev-blender-4-001',
    softwareId: 'blender-4',
    softwareVersion: '4.0.2',
    state: 'FETCHED',
    minRamGib: 8,
    recommendedRamGib: 32,
    minVramGib: 4,
    recommendedVramGib: 12,
    minStorageGib: 5,
    supportedArchitectures: ['X86_64', 'ARM64'],
    requiredInstructionSets: ['SSE4_2'],
    sources: [
      {
        sourceType: 'OFFICIAL_DOCS',
        url: 'https://www.blender.org/download/requirements/',
        retrievedAt: new Date().toISOString(),
        sourceTrustScore: 1.0
      }
    ],
    lastAuditedAt: new Date().toISOString()
  };

  it('correctly executes full valid lifecycle transition: FETCHED -> PARSED -> VALIDATED -> VERIFIED -> PUBLISHED -> SUPERSEDED', () => {
    let rev = { ...sampleValidRevision };

    rev = transitionRequirementState(rev, 'PARSED', 'parser-bot', 'Parsed JSON AST');
    expect(rev.state).toBe('PARSED');

    rev = transitionRequirementState(rev, 'VALIDATED', 'schema-validator', 'Passed schema assertions');
    expect(rev.state).toBe('VALIDATED');

    rev = transitionRequirementState(rev, 'VERIFIED', 'lead-engineer', 'Verified against official vendor site');
    expect(rev.state).toBe('VERIFIED');
    expect(rev.verifiedBy).toBe('lead-engineer');

    rev = transitionRequirementState(rev, 'PUBLISHED', 'admin', 'Released to production engine');
    expect(rev.state).toBe('PUBLISHED');
    expect(rev.publishedAt).toBeDefined();

    rev = transitionRequirementState(rev, 'SUPERSEDED', 'system', 'Archived for Blender 4.1');
    expect(rev.state).toBe('SUPERSEDED');
  });

  it('rejects invalid or illegal lifecycle state transitions with informative error', () => {
    const rev = { ...sampleValidRevision, state: 'FETCHED' as const };

    // Cannot jump from FETCHED directly to PUBLISHED
    expect(canTransitionState('FETCHED', 'PUBLISHED')).toBe(false);
    expect(() => {
      transitionRequirementState(rev, 'PUBLISHED', 'hacker');
    }).toThrow(/Illegal requirement lifecycle state transition/);
  });

  it('detects contradictory requirement conflicts (e.g. minRam > recommendedRam)', () => {
    const conflictedRevision: RequirementRevision = {
      ...sampleValidRevision,
      minRamGib: 32,
      recommendedRamGib: 16 // Contradiction!
    };

    const audit = auditRequirementRevision(conflictedRevision);
    expect(audit.isConflicted).toBe(true);
    expect(audit.suggestedAction).toBe('FLAG_FOR_MANUAL_REVIEW');
    expect(audit.conflictDetails[0]).toContain('Minimum RAM (32GB) exceeds recommended RAM (16GB)');
  });

  it('flags stale revisions when last audited timestamp is older than 90 days', () => {
    const oldTimestamp = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(); // 120 days ago
    const staleRevision: RequirementRevision = {
      ...sampleValidRevision,
      lastAuditedAt: oldTimestamp
    };

    const audit = auditRequirementRevision(staleRevision);
    expect(audit.isStale).toBe(true);
    expect(audit.daysSinceLastAudit).toBeGreaterThanOrEqual(120);
    expect(audit.suggestedAction).toBe('TRIGGER_BACKGROUND_REFRESH');
  });
});
