import { HardwareProfile } from "../../domain/hardware";
import { SoftwareVersion } from "../../domain/software";
import { RuleEvaluation } from "../../domain/capabilities";

export function evaluateCapabilitiesRule(
  hardware: HardwareProfile,
  version: SoftwareVersion,
  softwareName: string
): RuleEvaluation[] {
  const evaluations: RuleEvaluation[] = [];
  const minGpu = version.minimumRequirements.gpu;
  const caps = hardware.cpu.capabilities || hardware.gpu?.capabilities;

  // 1. CUDA requirement (NVIDIA GPU required for CUDA-specific compute)
  if (minGpu?.supportsCuda && hardware.os.family !== "macos") {
    const hasCuda = hardware.gpu?.supportsCuda ?? (hardware.gpu?.manufacturer === "NVIDIA");
    if (!hasCuda) {
      evaluations.push({
        ruleId: "RULE_CAPABILITY_CUDA",
        capability: "CUDA",
        outcome: "FAIL",
        observedState: `${hardware.gpu?.manufacturer ?? "Non-NVIDIA"} (${hardware.gpu?.model ?? "Integrated"})`,
        requiredState: "NVIDIA CUDA GPU Required",
        reasonCode: "CUDA_UNSUPPORTED",
        message: `${softwareName} strictly requires an NVIDIA GPU with CUDA acceleration.`,
      });
    } else {
      evaluations.push({
        ruleId: "RULE_CAPABILITY_CUDA",
        capability: "CUDA",
        outcome: "PASS",
        observedState: `NVIDIA CUDA Supported (${hardware.gpu?.model})`,
        requiredState: "NVIDIA CUDA Support",
      });
    }
  }

  // 2. Metal requirement (Applies on macOS only)
  if (minGpu?.supportsMetal && hardware.os.family === "macos") {
    const hasMetal = hardware.gpu?.supportsMetal ?? true; // All modern Apple Silicon supports Metal
    if (!hasMetal) {
      evaluations.push({
        ruleId: "RULE_CAPABILITY_METAL",
        capability: "METAL",
        outcome: "FAIL",
        observedState: `${hardware.gpu?.model ?? "GPU"} on ${hardware.os.family}`,
        requiredState: "Apple Metal Graphics API Required",
        reasonCode: "METAL_UNSUPPORTED",
        message: `${softwareName} requires Apple Metal graphics acceleration.`,
      });
    } else {
      evaluations.push({
        ruleId: "RULE_CAPABILITY_METAL",
        capability: "METAL",
        outcome: "PASS",
        observedState: `Apple Metal Supported`,
        requiredState: "Apple Metal Support",
      });
    }
  }

  // 3. DirectX 12 requirement (Applies on Windows only)
  if (minGpu?.supportsDirectX12 && hardware.os.family === "windows") {
    const hasDx12 = hardware.gpu?.supportsDirectX12 ?? true;
    if (!hasDx12) {
      evaluations.push({
        ruleId: "RULE_CAPABILITY_DIRECTX12",
        capability: "DIRECTX_12",
        outcome: "FAIL",
        observedState: `${hardware.gpu?.model ?? "GPU"} on ${hardware.os.family}`,
        requiredState: "DirectX 12 Feature Level 12_0+ Required",
        reasonCode: "DIRECTX_12_UNSUPPORTED",
        message: `${softwareName} requires DirectX 12 hardware acceleration.`,
      });
    } else {
      evaluations.push({
        ruleId: "RULE_CAPABILITY_DIRECTX12",
        capability: "DIRECTX_12",
        outcome: "PASS",
        observedState: `DirectX 12 Supported`,
        requiredState: "DirectX 12 Support",
      });
    }
  }

  // 4. Vulkan requirement
  if (minGpu?.supportsVulkan && hardware.os.family === "linux") {
    const hasVulkan = hardware.gpu?.supportsVulkan ?? (hardware.gpu?.type !== "integrated");
    if (!hasVulkan) {
      evaluations.push({
        ruleId: "RULE_CAPABILITY_VULKAN",
        capability: "VULKAN",
        outcome: "FAIL",
        observedState: `${hardware.gpu?.model ?? "GPU"}`,
        requiredState: "Vulkan 1.3+ API Required",
        reasonCode: "VULKAN_UNSUPPORTED",
        message: `${softwareName} requires Vulkan API acceleration.`,
      });
    } else {
      evaluations.push({
        ruleId: "RULE_CAPABILITY_VULKAN",
        capability: "VULKAN",
        outcome: "PASS",
        observedState: `Vulkan Supported`,
        requiredState: "Vulkan Support",
      });
    }
  }

  // 5. Virtualization requirement
  if (version.minimumRequirements.requiresVirtualization) {
    const supported = hardware.supportsVirtualization ?? true;
    const enabled = hardware.isVirtualizationEnabled ?? true;

    if (!supported) {
      evaluations.push({
        ruleId: "RULE_CAPABILITY_VIRTUALIZATION",
        capability: "VIRTUALIZATION",
        outcome: "FAIL",
        observedState: "CPU lacks hardware virtualization extensions",
        requiredState: "Hardware Virtualization (VT-x / AMD-V)",
        reasonCode: "VIRTUALIZATION_UNSUPPORTED",
        message: `${softwareName} requires hardware virtualization (VT-x/AMD-V).`,
      });
    } else if (!enabled) {
      evaluations.push({
        ruleId: "RULE_CAPABILITY_VIRTUALIZATION",
        capability: "VIRTUALIZATION",
        outcome: "FAIL",
        observedState: "Virtualization is disabled in system BIOS / UEFI",
        requiredState: "Virtualization enabled in BIOS/UEFI",
        reasonCode: "VIRTUALIZATION_DISABLED_IN_BIOS",
        message: `${softwareName} requires hardware virtualization enabled in system BIOS.`,
      });
    } else {
      evaluations.push({
        ruleId: "RULE_CAPABILITY_VIRTUALIZATION",
        capability: "VIRTUALIZATION",
        outcome: "PASS",
        observedState: "Virtualization enabled and supported",
        requiredState: "Hardware Virtualization",
      });
    }
  }

  return evaluations;
}
