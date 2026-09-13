/**
 * Software Requirement Revision Lifecycle & Freshness Auditor
 * Implements a deterministic state machine for requirement revisions,
 * automated staleness auditing (TTL), conflict detection, and quality gates.
 */

export type RequirementLifecycleState = 
  | 'FETCHED'         // Raw scrape/ingest payload received from vendor documentation or manifest
  | 'PARSED'          // Normalized into typed AST / requirements schema
  | 'VALIDATED'       // Passed deterministic schema validation & sanity bounds
  | 'REVIEW_REQUIRED' // Conflict or anomaly detected (e.g. min > rec, contradictory sources)
  | 'VERIFIED'        // Signed off by automated property tests or human domain maintainer
  | 'PUBLISHED'       // Active canonical source of truth used by compatibility engine
  | 'SUPERSEDED'      // Archived/deprecated in favor of a newer revision or major version update
  | 'REJECTED';       // Failed validation and discarded

export interface RequirementSourceMetadata {
  sourceType: 'OFFICIAL_DOCS' | 'STEAM_API' | 'PUBLISHER_MANIFEST' | 'COMMUNITY_BENCHMARK' | 'VENDOR_PRESS';
  url: string;
  retrievedAt: string;
  etagOrChecksum?: string;
  sourceTrustScore: number; // 0.0 - 1.0 (Official docs = 1.0, Community = 0.7)
}

export interface RequirementRevision {
  revisionId: string;
  softwareId: string;
  softwareVersion: string;
  state: RequirementLifecycleState;
  minRamGib: number;
  recommendedRamGib: number;
  minVramGib: number;
  recommendedVramGib: number;
  minStorageGib: number;
  supportedArchitectures: ('X86_64' | 'ARM64')[];
  requiredInstructionSets: string[];
  sources: RequirementSourceMetadata[];
  publishedAt?: string;
  lastAuditedAt: string;
  verifiedBy?: string;
  validationNotes?: string[];
}

export interface LifecycleAuditResult {
  revisionId: string;
  softwareId: string;
  state: RequirementLifecycleState;
  isStale: boolean;
  daysSinceLastAudit: number;
  isConflicted: boolean;
  conflictDetails: string[];
  completenessScorePercent: number;
  missingFields: string[];
  suggestedAction: 'KEEP_ACTIVE' | 'TRIGGER_BACKGROUND_REFRESH' | 'FLAG_FOR_MANUAL_REVIEW' | 'AUTO_SUPERSEDE';
}

/**
 * Valid state transitions table
 */
const VALID_TRANSITIONS: Record<RequirementLifecycleState, RequirementLifecycleState[]> = {
  FETCHED: ['PARSED', 'REJECTED'],
  PARSED: ['VALIDATED', 'REVIEW_REQUIRED', 'REJECTED'],
  VALIDATED: ['VERIFIED', 'REVIEW_REQUIRED', 'REJECTED'],
  REVIEW_REQUIRED: ['VERIFIED', 'REJECTED'],
  VERIFIED: ['PUBLISHED', 'REJECTED'],
  PUBLISHED: ['SUPERSEDED', 'REVIEW_REQUIRED'],
  SUPERSEDED: [],
  REJECTED: []
};

/**
 * Validates whether a state machine transition is allowed
 */
export function canTransitionState(
  fromState: RequirementLifecycleState,
  toState: RequirementLifecycleState
): boolean {
  return VALID_TRANSITIONS[fromState]?.includes(toState) ?? false;
}

/**
 * Transitions a revision to a new state with safety checks
 */
export function transitionRequirementState(
  revision: RequirementRevision,
  targetState: RequirementLifecycleState,
  actor: string,
  note?: string
): RequirementRevision {
  if (!canTransitionState(revision.state, targetState)) {
    throw new Error(
      `Illegal requirement lifecycle state transition from '${revision.state}' to '${targetState}'. Valid transitions are: [${VALID_TRANSITIONS[revision.state].join(', ')}]`
    );
  }

  const updatedNotes = [...(revision.validationNotes || [])];
  if (note) {
    updatedNotes.push(`[${new Date().toISOString()}] (${actor}) -> ${targetState}: ${note}`);
  }

  return {
    ...revision,
    state: targetState,
    lastAuditedAt: new Date().toISOString(),
    publishedAt: targetState === 'PUBLISHED' ? new Date().toISOString() : revision.publishedAt,
    verifiedBy: targetState === 'VERIFIED' ? actor : revision.verifiedBy,
    validationNotes: updatedNotes
  };
}

/**
 * Audits a requirement revision for freshness (TTL 90 days), data integrity, and conflicts
 */
export function auditRequirementRevision(
  revision: RequirementRevision,
  currentTimestampIso: string = new Date().toISOString()
): LifecycleAuditResult {
  const now = new Date(currentTimestampIso).getTime();
  const lastAudit = new Date(revision.lastAuditedAt).getTime();
  const daysSinceLastAudit = Math.floor((now - lastAudit) / (1000 * 60 * 60 * 24));

  // Staleness Rule: Revisions older than 90 days require re-verification
  const isStale = daysSinceLastAudit > 90;

  // Conflict & Sanity Checks
  const conflictDetails: string[] = [];
  if (revision.minRamGib > revision.recommendedRamGib) {
    conflictDetails.push(`Minimum RAM (${revision.minRamGib}GB) exceeds recommended RAM (${revision.recommendedRamGib}GB)`);
  }
  if (revision.minVramGib > revision.recommendedVramGib) {
    conflictDetails.push(`Minimum VRAM (${revision.minVramGib}GB) exceeds recommended VRAM (${revision.recommendedVramGib}GB)`);
  }

  // Cross-Source Discrepancies
  if (revision.sources.length >= 2) {
    const minTrust = Math.min(...revision.sources.map(s => s.sourceTrustScore));
    const maxTrust = Math.max(...revision.sources.map(s => s.sourceTrustScore));
    if (maxTrust - minTrust > 0.4) {
      conflictDetails.push(`Significant trust variance among ingested sources (${minTrust.toFixed(1)} vs ${maxTrust.toFixed(1)})`);
    }
  }

  const isConflicted = conflictDetails.length > 0;

  // Completeness Audit
  const missingFields: string[] = [];
  if (!revision.minRamGib || revision.minRamGib <= 0) missingFields.push('minRamGib');
  if (!revision.recommendedRamGib || revision.recommendedRamGib <= 0) missingFields.push('recommendedRamGib');
  if (revision.minStorageGib === undefined || revision.minStorageGib <= 0) missingFields.push('minStorageGib');
  if (!revision.supportedArchitectures || revision.supportedArchitectures.length === 0) missingFields.push('supportedArchitectures');
  if (!revision.sources || revision.sources.length === 0) missingFields.push('sources');

  const totalFields = 5;
  const filledFields = totalFields - missingFields.length;
  const completenessScorePercent = Math.round((filledFields / totalFields) * 100);

  // Suggested Action
  let suggestedAction: LifecycleAuditResult['suggestedAction'] = 'KEEP_ACTIVE';
  if (isConflicted) {
    suggestedAction = 'FLAG_FOR_MANUAL_REVIEW';
  } else if (isStale) {
    suggestedAction = 'TRIGGER_BACKGROUND_REFRESH';
  } else if (revision.state === 'SUPERSEDED') {
    suggestedAction = 'AUTO_SUPERSEDE';
  }

  return {
    revisionId: revision.revisionId,
    softwareId: revision.softwareId,
    state: revision.state,
    isStale,
    daysSinceLastAudit,
    isConflicted,
    conflictDetails,
    completenessScorePercent,
    missingFields,
    suggestedAction
  };
}
