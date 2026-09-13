import { createHash } from "crypto";
import { HardwareProfile } from "../../lib/domain/hardware";
import { SelectedWorkload } from "../../lib/domain/software";
import { AggregatedWorkloadDemands } from "../compatibility/concurrency-model";
import { ComponentEvaluation } from "../../lib/domain/compatibility";

export interface EvaluationFingerprintParams {
  hardware: HardwareProfile;
  workloads: SelectedWorkload[];
  engineVersion: string;
  policyVersion: string;
  benchmarkDatasetVersion: string;
  normalizationAlgorithmVersion: string;
}

export function generateEvaluationFingerprint(params: EvaluationFingerprintParams): string {
  const normalizedPayload = {
    cpu: params.hardware.cpu.model,
    gpu: params.hardware.gpu?.model || "none",
    ram: params.hardware.ram.totalGb,
    storage: params.hardware.storage.map(s => `${s.type}:${s.totalGb}`),
    os: `${params.hardware.os.family}:${params.hardware.os.version || ""}:${params.hardware.architecture}`,
    workloads: params.workloads.map(w => `${w.softwareId}:${w.versionString}:${w.workloadId}:${w.intensity}:${w.concurrency}:${w.quantity || 1}`).sort(),
    engineVersion: params.engineVersion,
    policyVersion: params.policyVersion,
    benchmarkDatasetVersion: params.benchmarkDatasetVersion,
    normalizationAlgorithmVersion: params.normalizationAlgorithmVersion,
  };

  return createHash("sha256")
    .update(JSON.stringify(normalizedPayload))
    .digest("hex");
}

export interface CalculationTrace {
  memory: {
    osReserveGb: number;
    backgroundReserveGb: number;
    steadyStateDemandGb: number;
    peakConcurrentDemandGb: number;
    safetyHeadroomGb: number;
    totalRequiredGb: number;
    physicalRamGb: number;
    memoryPressureRatio: number;
  };
  processor: {
    hardwareScore: number;
    requiredScore: number;
    isLaptopThermalConstrained: boolean;
  };
  graphics: {
    hardwareScore: number;
    requiredScore: number;
    vramAvailableGb: number;
    vramRequiredGb: number;
    cudaSupported: boolean;
  };
  bottlenecksDetected: string[];
}

export function buildCalculationTrace(
  hardware: HardwareProfile,
  demands: AggregatedWorkloadDemands,
  components: Record<string, ComponentEvaluation>
): CalculationTrace {
  return {
    memory: {
      osReserveGb: demands.osBackgroundReserveGb - 1.5,
      backgroundReserveGb: 1.5,
      steadyStateDemandGb: demands.steadyStateRamGb,
      peakConcurrentDemandGb: demands.peakConcurrentRamGb,
      safetyHeadroomGb: demands.safetyHeadroomGb,
      totalRequiredGb: demands.effectiveRequiredRamGb,
      physicalRamGb: hardware.ram.totalGb,
      memoryPressureRatio: Math.round((demands.effectiveRequiredRamGb / hardware.ram.totalGb) * 100) / 100,
    },
    processor: {
      hardwareScore: hardware.cpu.performanceScore ?? 50,
      requiredScore: demands.maxCpuScoreRequired,
      isLaptopThermalConstrained: hardware.deviceType === "laptop",
    },
    graphics: {
      hardwareScore: hardware.gpu?.performanceScore ?? 25,
      requiredScore: demands.maxGpuScoreRequired,
      vramAvailableGb: hardware.gpu?.vramGb ?? 0,
      vramRequiredGb: demands.peakSingleAppVramGb,
      cudaSupported: !!hardware.gpu?.supportsCuda,
    },
    bottlenecksDetected: Object.entries(components)
      .filter(([_, evalItem]) => evalItem.status === "FAIL" || evalItem.performanceTier === "poor" || evalItem.performanceTier === "minimum")
      .map(([name]) => name),
  };
}

export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${randomStr}`;
}
