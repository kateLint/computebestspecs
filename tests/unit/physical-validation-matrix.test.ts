import { describe, it, expect } from 'vitest';
import { REFERENCE_PHYSICAL_MACHINES, REFERENCE_TELEMETRY_RUNS } from '@/lib/validation/physical/physical-machine-matrix';
import { runPhysicalValidationMatrix, convertPhysicalToNormalized } from '@/lib/validation/physical/physical-validation-runner';

describe('Physical Machine Validation Matrix', () => {
  it('contains at least 15 comprehensive reference physical machines across all form factors', () => {
    expect(REFERENCE_PHYSICAL_MACHINES.length).toBeGreaterThanOrEqual(15);
    
    const formFactors = new Set(REFERENCE_PHYSICAL_MACHINES.map(m => m.formFactor));
    expect(formFactors.has('DESKTOP')).toBe(true);
    expect(formFactors.has('LAPTOP')).toBe(true);
    expect(formFactors.has('MINI_PC')).toBe(true);
    expect(formFactors.has('HANDHELD')).toBe(true);
  });

  it('converts physical machine to normalized profile without loss of architecture or VRAM details', () => {
    const m1Air = REFERENCE_PHYSICAL_MACHINES.find(m => m.id === 'macbook-air-m1-8g')!;
    const normalized = convertPhysicalToNormalized(m1Air);

    expect(normalized.cpu.architecture).toBe('arm64');
    expect(normalized.ram.totalGb).toBe(8);
    expect(normalized.gpu?.type).toBe('unified');
    expect(normalized.storage[0].isSystemDrive).toBe(true);
  });

  it('runs physical validation matrix against all 15 telemetry runs with high accuracy', () => {
    const report = runPhysicalValidationMatrix();

    expect(report.totalPhysicalRuns).toBe(REFERENCE_TELEMETRY_RUNS.length);
    expect(report.overallAccuracyPercent).toBeGreaterThanOrEqual(80);
    expect(report.criticalDisagreements).toBeLessThanOrEqual(1);
    expect(report.discrepancies.length).toBe(REFERENCE_TELEMETRY_RUNS.length);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it('identifies heavy swap thrashing and RAM capacity bottleneck on 8GB machines under creative/AI workloads', () => {
    const report = runPhysicalValidationMatrix();
    const m1AiRun = report.discrepancies.find(d => d.runId === 'run-02-m1-ai-llama8b');

    expect(m1AiRun).toBeDefined();
    expect(m1AiRun?.telemetryDelta.swapUsedGib).toBeGreaterThan(4.0);
    expect(m1AiRun?.observedBottleneck).toBe('RAM_CAPACITY');
  });
});
