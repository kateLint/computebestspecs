/**
 * Physical Validation Runner & Disagreement Detector
 * Executes evaluations on physical reference hardware and compares predicted
 * adequacy/pressure against actual observed physical telemetry.
 */

import { REFERENCE_PHYSICAL_MACHINES, REFERENCE_TELEMETRY_RUNS, PhysicalMachineProfile, PhysicalTelemetryRun, RealExperienceLevel } from './physical-machine-matrix';
import { evaluateCompatibility } from '../../engine/evaluate';
import { HardwareProfile, StorageDevice, DeviceType } from '../../domain/hardware';
import { SOFTWARE_VERSIONS } from '../../data/software-catalog';
import { SelectedWorkload } from '../../domain/software';

export interface ValidationDiscrepancy {
  runId: string;
  machineId: string;
  machineName: string;
  workloadName: string;
  predictedVerdict: string;
  predictedScore: number;
  groundTruthExperience: RealExperienceLevel;
  predictedBottleneck: string;
  observedBottleneck: string;
  isDisagreement: boolean;
  severity: 'MATCH' | 'MINOR_BIAS' | 'MODERATE_DISAGREEMENT' | 'CRITICAL_DISAGREEMENT';
  analysis: string;
  telemetryDelta: {
    predictedRamPressure: number;
    measuredPeakRamGib: number;
    ramCapacityGib: number;
    swapUsedGib: number;
    thermalThrottled: boolean;
  };
}

export interface ValidationSummaryReport {
  totalPhysicalRuns: number;
  exactOrMinorMatches: number;
  moderateDisagreements: number;
  criticalDisagreements: number;
  overallAccuracyPercent: number;
  meanRamPressureError: number;
  discrepancies: ValidationDiscrepancy[];
  recommendations: string[];
}

/**
 * Converts a PhysicalMachineProfile into a Canonical HardwareProfile for the engine
 */
export function convertPhysicalToNormalized(machine: PhysicalMachineProfile): HardwareProfile {
  const osFamily = machine.os === 'WINDOWS' ? 'windows' : machine.os === 'MACOS' ? 'macos' : 'linux';
  const arch = machine.cpu.architecture === 'ARM64' ? 'arm64' : 'x86_64';
  const deviceType: DeviceType = machine.formFactor === 'DESKTOP' ? 'desktop' : machine.formFactor === 'MINI_PC' ? 'mini-pc' : 'laptop';

  const storageDevices: StorageDevice[] = [
    {
      type: machine.storage.type.includes('NVME') ? 'NVME_SSD' : machine.storage.type === 'SATA_SSD' ? 'SATA_SSD' : 'HDD',
      totalGb: machine.storage.freeSpaceGib * 2,
      freeGb: machine.storage.freeSpaceGib,
      isSystemDrive: true
    }
  ];

  return {
    cpu: {
      model: machine.cpu.name,
      manufacturer: machine.cpu.name.includes('Intel')
        ? 'Intel'
        : machine.cpu.name.includes('AMD')
        ? 'AMD'
        : machine.cpu.name.includes('Apple')
        ? 'Apple'
        : machine.cpu.name.includes('Snapdragon')
        ? 'Qualcomm'
        : 'Other',
      architecture: arch,
      physicalCores: machine.cpu.cores,
      threads: machine.cpu.threads,
      performanceScore: Math.min(100, Math.round(machine.cpu.cores * 4.5 + machine.cpu.boostClockGhz * 10)),
      isVerified: true
    },
    gpu: {
      model: machine.gpu.name,
      manufacturer: machine.gpu.name.includes('NVIDIA')
        ? 'NVIDIA'
        : machine.gpu.name.includes('AMD') || machine.gpu.name.includes('Radeon')
        ? 'AMD'
        : machine.gpu.name.includes('Apple')
        ? 'Apple'
        : machine.gpu.name.includes('Arc') || machine.gpu.name.includes('Iris')
        ? 'Intel'
        : 'Other',
      type: machine.gpu.isUnifiedMemory ? 'unified' : machine.gpu.isDiscrete ? 'dedicated' : 'integrated',
      vramGb: machine.gpu.vramGib,
      performanceScore: Math.min(100, Math.round(machine.gpu.vramGib * 4 + (machine.gpu.isDiscrete ? 30 : 10))),
      supportsCuda: machine.gpu.name.includes('NVIDIA') || machine.gpu.name.includes('RTX') || machine.gpu.name.includes('GTX'),
      supportsMetal: machine.os === 'MACOS',
      supportsVulkan: true,
      supportsDirectX12: true,
      isVerified: true
    },
    ram: {
      totalGb: machine.ram.totalGib,
      type: machine.ram.type === 'UNIFIED' ? 'Unified' : (machine.ram.type as any),
      topology: machine.gpu.isUnifiedMemory ? 'UNIFIED_MEMORY' : machine.gpu.isDiscrete ? 'DISCRETE' : 'SHARED_IGPU',
      memoryBandwidthGBps: machine.gpu.memoryBandwidthGbps
    },
    storage: storageDevices,
    os: {
      family: osFamily,
      version: machine.osVersion,
      architecture: arch
    },
    architecture: arch,
    deviceType,
    supportsVirtualization: true,
    isVirtualizationEnabled: true
  };
}

/**
 * Runs validation comparison across all physical telemetry records
 */
export function runPhysicalValidationMatrix(): ValidationSummaryReport {
  const discrepancies: ValidationDiscrepancy[] = [];
  let ramErrorSum = 0;

  for (const telemetryRun of REFERENCE_TELEMETRY_RUNS) {
    const machine = REFERENCE_PHYSICAL_MACHINES.find(m => m.id === telemetryRun.machineId);
    if (!machine) continue;

    const hwProfile = convertPhysicalToNormalized(machine);

    // Map software IDs to SoftwareVersion
    const targetSoftware = telemetryRun.softwareIds
      .map(id => SOFTWARE_VERSIONS.find(v => v.softwareId === id || v.id === id || v.softwareId.includes(id)))
      .filter(Boolean);

    const softwareList = targetSoftware.length > 0 ? targetSoftware : [SOFTWARE_VERSIONS[0]];

    const selectedWorkloads: SelectedWorkload[] = softwareList.map(v => ({
      softwareId: v!.softwareId,
      softwareName: v!.softwareId,
      softwareVersionId: v!.id,
      workloadId: v!.workloads?.[0]?.id || 'main',
      workloadName: v!.workloads?.[0]?.name || 'Standard Workload',
      intensity: 'medium',
      concurrency: 'foreground'
    }));

    // Run engine evaluation
    const evaluation = evaluateCompatibility({
      hardware: hwProfile,
      workloads: selectedWorkloads,
      softwareVersions: softwareList as any,
      scenarioMode: 'TYPICAL'
    });

    const predictedVerdict = evaluation.compatibilityStatus || 'compatible';
    const predictedScore = evaluation.score ?? evaluation.overallScore ?? 50;
    const groundTruth = telemetryRun.groundTruthExperience;

    // Determine predicted vs observed primary bottleneck
    const predictedBottleneck = evaluation.bottlenecks.length > 0 ? evaluation.bottlenecks[0].component : 'none';
    const observedBottleneck = telemetryRun.primaryRealBottleneck;

    // Calculate RAM pressure delta
    const actualRamRatio = telemetryRun.measuredTelemetry.peakRamGib / machine.ram.totalGib;
    const predictedRamPressure = evaluation.concurrencyMetrics?.ramPressureRatio || 0.5;
    const ramDelta = Math.abs(predictedRamPressure - actualRamRatio);
    ramErrorSum += ramDelta;

    // Classify severity of disagreement
    let severity: ValidationDiscrepancy['severity'] = 'MATCH';
    let isDisagreement = false;
    let analysis = 'Engine prediction matches physical telemetry observation.';

    // Check for critical misclassifications
    if (
      (groundTruth === 'CRITICAL_OOM' || groundTruth === 'HARD_BLOCKED') &&
      (predictedVerdict === 'compatible' && predictedScore >= 80)
    ) {
      severity = 'CRITICAL_DISAGREEMENT';
      isDisagreement = true;
      analysis = `CRITICAL: Engine predicted ${predictedVerdict} (${predictedScore}), but machine experienced ${groundTruth} with ${telemetryRun.measuredTelemetry.measuredSwapUsageGib}GB swap thrashing!`;
    } else if (
      (groundTruth === 'EXCELLENT' || groundTruth === 'GOOD') &&
      (predictedVerdict === 'incompatible')
    ) {
      severity = 'CRITICAL_DISAGREEMENT';
      isDisagreement = true;
      analysis = `CRITICAL: Engine overly penalized machine as ${predictedVerdict}, but real machine operated smoothly (${groundTruth}).`;
    } else if (
      (groundTruth === 'POOR_HITCHING' && predictedScore >= 85) ||
      (groundTruth === 'EXCELLENT' && predictedVerdict === 'incompatible')
    ) {
      severity = 'MODERATE_DISAGREEMENT';
      isDisagreement = true;
      analysis = `Moderate drift: Engine gave ${predictedScore} points, real experience was ${groundTruth}.`;
    } else if (isDisagreement === false && (predictedBottleneck !== observedBottleneck.toLowerCase() && observedBottleneck !== 'NONE')) {
      severity = 'MINOR_BIAS';
      analysis = `Minor nuance: Engine identified ${predictedBottleneck} while telemetry showed ${observedBottleneck}.`;
    }

    discrepancies.push({
      runId: telemetryRun.runId,
      machineId: machine.id,
      machineName: machine.name,
      workloadName: telemetryRun.workloadName,
      predictedVerdict,
      predictedScore,
      groundTruthExperience: groundTruth,
      predictedBottleneck,
      observedBottleneck,
      isDisagreement,
      severity,
      analysis,
      telemetryDelta: {
        predictedRamPressure,
        measuredPeakRamGib: telemetryRun.measuredTelemetry.peakRamGib,
        ramCapacityGib: machine.ram.totalGib,
        swapUsedGib: telemetryRun.measuredTelemetry.measuredSwapUsageGib,
        thermalThrottled: telemetryRun.measuredTelemetry.thermalThrottled
      }
    });
  }

  const matchCount = discrepancies.filter(d => d.severity === 'MATCH' || d.severity === 'MINOR_BIAS').length;
  const modCount = discrepancies.filter(d => d.severity === 'MODERATE_DISAGREEMENT').length;
  const critCount = discrepancies.filter(d => d.severity === 'CRITICAL_DISAGREEMENT').length;
  const total = discrepancies.length;
  const accuracyPct = Math.round((matchCount / (total || 1)) * 100);

  const recommendations: string[] = [];
  if (accuracyPct >= 80) {
    recommendations.push('Physical validation accuracy is above 80% threshold. Engine predictions are reliable for production.');
  } else {
    recommendations.push('Calibration tuning required for unified memory swap behavior and low-power chassis thermal throttling.');
  }

  return {
    totalPhysicalRuns: total,
    exactOrMinorMatches: matchCount,
    moderateDisagreements: modCount,
    criticalDisagreements: critCount,
    overallAccuracyPercent: accuracyPct,
    meanRamPressureError: Math.round((ramErrorSum / (total || 1)) * 100) / 100,
    discrepancies,
    recommendations
  };
}
