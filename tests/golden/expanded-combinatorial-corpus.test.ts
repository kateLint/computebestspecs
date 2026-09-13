import { describe, it, expect } from 'vitest';
import { evaluateCompatibility } from '@/lib/engine/evaluate';
import { convertPhysicalToNormalized } from '@/lib/validation/physical/physical-validation-runner';
import { REFERENCE_PHYSICAL_MACHINES } from '@/lib/validation/physical/physical-machine-matrix';
import { SOFTWARE_VERSIONS } from '@/lib/data/software-catalog';
import { SelectedWorkload } from '@/lib/domain/software';
import { resolveHardwareQuery } from '@/lib/normalization/hardware-resolver';
import { calculateCalibratedScore } from '@/lib/calibration/calibration-service';
import { auditRequirementRevision, RequirementRevision } from '@/lib/lifecycle/requirement-lifecycle';

describe('Expanded Golden Scenario Corpus & Robustness Invariants', () => {
  const getHw = (id: string) => {
    const machine = REFERENCE_PHYSICAL_MACHINES.find(m => m.id === id)!;
    return convertPhysicalToNormalized(machine);
  };

  const getSoftware = (softwareId: string) => {
    return SOFTWARE_VERSIONS.find(v => v.softwareId === softwareId || v.id === softwareId) || SOFTWARE_VERSIONS[0];
  };

  const runEval = (hwId: string, swIds: string[], scenarioMode: 'TYPICAL' | 'PEAK' = 'TYPICAL') => {
    const hw = getHw(hwId);
    const versions = swIds.map(id => getSoftware(id));
    const workloads: SelectedWorkload[] = versions.map(v => ({
      softwareId: v.softwareId,
      softwareName: v.softwareId,
      softwareVersionId: v.id,
      workloadId: v.workloads?.[0]?.id || 'default_workload',
      workloadName: v.workloads?.[0]?.name || 'Standard Workload',
      intensity: 'medium',
      concurrency: 'foreground'
    }));

    return evaluateCompatibility({
      hardware: hw,
      workloads,
      softwareVersions: versions,
      scenarioMode
    });
  };

  // 1. Unified Memory & Low RAM Edge Cases
  it('Scenario 1: 8GB M1 MacBook Air under typical single app vs concurrent dual app', () => {
    const singleApp = runEval('macbook-air-m1-8g', ['photoshop']);
    const dualApp = runEval('macbook-air-m1-8g', ['photoshop', 'blender']);

    expect(singleApp.score).toBeGreaterThanOrEqual(0);
    expect(dualApp.concurrencyMetrics.ramPressureRatio).toBeGreaterThan(singleApp.concurrencyMetrics.ramPressureRatio);
  });

  it('Scenario 2: 64GB M3 Max handles demanding 3D & AI workload without memory bottleneck', () => {
    const result = runEval('macbook-pro-m3-max-64g', ['blender', 'photoshop'], 'PEAK');
    expect(result.compatibilityStatus).toBe('compatible');
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.bottlenecks.some(b => b.component === 'memory')).toBe(false);
  });

  // 2. High-End Discrete GPU vs APU Gaming & Raytracing
  it('Scenario 3: RTX 4090 Workstation achieves excellent score on GPU-bound raytracing', () => {
    const result = runEval('desktop-i9-rtx4090-64g', ['cyberpunk-2077'], 'PEAK');
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.performanceTier).toBe('excellent');
  });

  it('Scenario 4: Steam Deck OLED handles medium raster game but flags OS requirement or performance boundary', () => {
    // Cyberpunk 2077 is Windows-only natively -> Linux SteamOS flags OS incompatibility unless Proton is specified
    const nativeCyberpunk = runEval('steam-deck-oled-16g', ['cyberpunk-2077'], 'TYPICAL');
    expect(nativeCyberpunk.compatibilityStatus).toBe('incompatible');
    expect(nativeCyberpunk.bottlenecks.some(b => b.component === 'os')).toBe(true);

    // Cross-platform Blender 4.0 runs on Linux
    const linuxBlender = runEval('steam-deck-oled-16g', ['blender'], 'TYPICAL');
    expect(linuxBlender.compatibilityStatus).toBe('compatible');
  });

  // 3. Hardware Resolution Invariants
  it('Scenario 5: Hardware resolver never coerces ambiguous GPU models without user option list', () => {
    const res4070 = resolveHardwareQuery('GeForce RTX 4070');
    expect(res4070.status).toBe('AMBIGUOUS');
    expect(res4070.candidateOptions?.length).toBeGreaterThanOrEqual(2);

    const res4060 = resolveHardwareQuery('RTX 4060');
    expect(res4060.status).toBe('AMBIGUOUS');
  });

  it('Scenario 6: Hardware resolver correctly identifies exact flagship CPUs and GPUs', () => {
    const res14900k = resolveHardwareQuery('i9 14900k');
    expect(res14900k.status).toBe('EXACT');
    expect(res14900k.canonicalId).toBe('intel-i9-14900k');

    const res7800x3d = resolveHardwareQuery('Ryzen 7 7800X3D');
    expect(res7800x3d.status).toBe('EXACT');
    expect(res7800x3d.canonicalId).toBe('amd-ryzen-7-7800x3d');
  });

  // 4. Calibration & Confidence Monotonicity
  it('Scenario 7: Higher memory bandwidth monotonically increases LLM inference calibrated score', () => {
    const scoreLowBw = calculateCalibratedScore({
      workloadClass: 'LOCAL_AI_INFERENCE',
      rawMetricValue: 30,
      hardwareMemoryBandwidthGbps: 100 // 100 GB/s
    });

    const scoreHighBw = calculateCalibratedScore({
      workloadClass: 'LOCAL_AI_INFERENCE',
      rawMetricValue: 30,
      hardwareMemoryBandwidthGbps: 800 // 800 GB/s
    });

    expect(scoreHighBw.calibratedScore).toBeGreaterThanOrEqual(scoreLowBw.calibratedScore);
  });

  // 5. Lifecycle Auditor Invariants
  it('Scenario 8: Freshness auditor identifies healthy published vs stale >90d revision', () => {
    const freshRevision: RequirementRevision = {
      revisionId: 'rev_fresh',
      softwareId: 'blender-4',
      softwareVersion: '4.0.0',
      state: 'PUBLISHED',
      minRamGib: 8,
      recommendedRamGib: 16,
      minVramGib: 2,
      recommendedVramGib: 8,
      minStorageGib: 5,
      supportedArchitectures: ['X86_64', 'ARM64'],
      requiredInstructionSets: ['SSE4_2'],
      sources: [{ sourceType: 'OFFICIAL_DOCS', url: 'https://blender.org', retrievedAt: new Date().toISOString(), sourceTrustScore: 1.0 }],
      lastAuditedAt: new Date().toISOString()
    };

    const auditFresh = auditRequirementRevision(freshRevision);
    expect(auditFresh.isStale).toBe(false);
    expect(auditFresh.suggestedAction).toBe('KEEP_ACTIVE');

    const staleRevision: RequirementRevision = {
      ...freshRevision,
      lastAuditedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
    };

    const auditStale = auditRequirementRevision(staleRevision);
    expect(auditStale.isStale).toBe(true);
    expect(auditStale.suggestedAction).toBe('TRIGGER_BACKGROUND_REFRESH');
  });
});
