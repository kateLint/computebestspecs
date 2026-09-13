import { HardwareProfile } from "../../lib/domain/hardware";
import { SoftwareVersion } from "../../lib/domain/software";
import { PlatformEvaluation, PlatformSupportStatus, CapabilityRequirement } from "../../lib/domain/platform-compliance";

export function evaluatePlatformCompliance(
  hardware: HardwareProfile,
  softwareVersion: SoftwareVersion
): PlatformEvaluation {
  // 1. Hardware Capability Layer
  const hwReasons: string[] = [];
  const hwWarnings: string[] = [];
  let hwStatus: PlatformSupportStatus = "SUPPORTED";

  // Check Virtualization
  if (softwareVersion.minimumRequirements.requiresVirtualization) {
    if (hardware.supportsVirtualization === false) {
      hwStatus = "INCOMPATIBLE";
      hwReasons.push("CPU does not support hardware virtualization (VT-x/AMD-V).");
    } else if (hardware.supportsVirtualization === undefined) {
      hwStatus = "UNKNOWN";
      hwWarnings.push("Hardware virtualization capability is unverified.");
    }
  }

  // Check GPU Hardware APIs
  if (softwareVersion.minimumRequirements.gpu?.requiresCuda) {
    if (!hardware.gpu?.supportsCuda) {
      hwStatus = "INCOMPATIBLE";
      hwReasons.push("NVIDIA CUDA compute architecture is required by this software.");
    }
  }

  // 2. OS Eligibility Layer (Is OS officially supported on this hardware?)
  const osReasons: string[] = [];
  const osWarnings: string[] = [];
  let osStatus: PlatformSupportStatus = "SUPPORTED";

  // e.g. Windows 11 on older CPUs or macOS on unsupported hardware
  if (hardware.os.family === "windows" && hardware.os.version === "11") {
    const isModernCpu = (hardware.cpu.performanceScore ?? 50) >= 40;
    if (!isModernCpu) {
      osStatus = "UNSUPPORTED_BY_VENDOR";
      osWarnings.push("Windows 11 may not be officially supported by Microsoft on legacy CPU models (TPM 2.0 / CPU generation eligibility).");
    }
  }

  if (hardware.os.family === "macos" && hardware.cpu.manufacturer !== "Apple" && hardware.cpu.manufacturer !== "Intel") {
    osStatus = "INCOMPATIBLE";
    osReasons.push("macOS is not supported on non-Apple/non-Intel architectures.");
  }

  // 3. Application Platform Support Layer (Does vendor officially support running on this OS?)
  const appReasons: string[] = [];
  const appWarnings: string[] = [];
  let appStatus: PlatformSupportStatus = "SUPPORTED";

  const isOsSupportedByApp = softwareVersion.supportedOperatingSystems.some(
    os => os.family === hardware.os.family
  );

  if (!isOsSupportedByApp) {
    // E.g. Photoshop on Linux: Incompatible or technically possible via Wine
    if (hardware.os.family === "linux") {
      appStatus = "UNSUPPORTED_BY_VENDOR";
      appWarnings.push("Vendor does not officially support Linux, though execution via compatibility layers (e.g. Wine/Proton) may be technically possible.");
    } else {
      appStatus = "INCOMPATIBLE";
      appReasons.push(`Application does not support ${hardware.os.family}.`);
    }
  }

  // Determine Overall Status
  let overallStatus: PlatformSupportStatus = "SUPPORTED";
  if (hwStatus === "INCOMPATIBLE" || appStatus === "INCOMPATIBLE" || osStatus === "INCOMPATIBLE") {
    overallStatus = "INCOMPATIBLE";
  } else if (appStatus === "UNSUPPORTED_BY_VENDOR" || osStatus === "UNSUPPORTED_BY_VENDOR") {
    overallStatus = "UNSUPPORTED_BY_VENDOR";
  } else if (hwStatus === "UNKNOWN") {
    overallStatus = "UNKNOWN";
  }

  return {
    hardwareCapabilities: { status: hwStatus, reasons: hwReasons, warnings: hwWarnings },
    osEligibility: { status: osStatus, reasons: osReasons, warnings: osWarnings },
    applicationPlatformSupport: { status: appStatus, reasons: appReasons, warnings: appWarnings },
    overallStatus,
  };
}

export function resolveCapabilityDependencyGraph(
  hardware: HardwareProfile,
  capabilityRequirements: CapabilityRequirement[]
): { satisfied: boolean; failedRequirements: CapabilityRequirement[] } {
  const failedRequirements: CapabilityRequirement[] = [];

  for (const req of capabilityRequirements) {
    if (req.capability === "virtualization" && req.operator === "REQUIRED") {
      if (hardware.supportsVirtualization === false) {
        failedRequirements.push(req);
      }
    } else if (req.capability === "cuda" && req.operator === "REQUIRED") {
      if (!hardware.gpu?.supportsCuda) {
        failedRequirements.push(req);
      }
    } else if (req.capability === "metal" && req.operator === "REQUIRED") {
      if (!hardware.gpu?.supportsMetal) {
        failedRequirements.push(req);
      }
    }
  }

  return {
    satisfied: failedRequirements.length === 0,
    failedRequirements,
  };
}
