import { StorageDevice } from "../../domain/hardware";
import { SoftwareVersion } from "../../domain/software";
import { RuleEvaluation } from "../../domain/capabilities";

export function evaluateStorageRule(
  storage: StorageDevice[],
  version: SoftwareVersion,
  softwareName: string
): RuleEvaluation {
  const minStorageReq = version.minimumRequirements.storage;
  const primaryDrive = storage[0] || { type: "NVME_SSD", totalGb: 512, freeGb: 200 };

  if (!minStorageReq) {
    return {
      ruleId: "RULE_STORAGE_REQUIREMENT",
      capability: "STORAGE",
      outcome: "PASS",
      observedState: `${primaryDrive.freeGb ?? primaryDrive.totalGb} GB Free`,
      requiredState: "Standard Storage",
    };
  }

  const installGb = minStorageReq.installGb ?? 2;
  const scratchGb = minStorageReq.scratchDiskGb ?? 0;
  const totalRequired = installGb + scratchGb;

  if (primaryDrive.freeGb !== undefined && primaryDrive.freeGb < totalRequired) {
    return {
      ruleId: "RULE_STORAGE_CAPACITY",
      capability: "STORAGE",
      outcome: "FAIL",
      observedState: `${primaryDrive.freeGb} GB Free`,
      requiredState: `Minimum ${totalRequired} GB Free (${installGb} GB install + ${scratchGb} GB scratch)`,
      reasonCode: "STORAGE_SPACE_INSUFFICIENT",
      message: `${softwareName} requires at least ${totalRequired} GB free disk space. Available: ${primaryDrive.freeGb} GB.`,
    };
  }

  // Check preferred drive type (e.g. SSD required for video editing/sample libraries)
  if (minStorageReq.preferredType && minStorageReq.preferredType !== "UNKNOWN") {
    if (minStorageReq.preferredType === "NVME_SSD" && primaryDrive.type === "HDD") {
      return {
        ruleId: "RULE_STORAGE_SPEED",
        capability: "STORAGE",
        outcome: "FAIL",
        observedState: `HDD (${primaryDrive.type})`,
        requiredState: `High-speed SSD required (${minStorageReq.preferredType})`,
        reasonCode: "STORAGE_DRIVE_SPEED_INSUFFICIENT",
        message: `${softwareName} requires an SSD for streaming assets/cache. Mechanical HDD will bottleneck operations.`,
      };
    }
  }

  return {
    ruleId: "RULE_STORAGE_REQUIREMENT",
    capability: "STORAGE",
    outcome: "PASS",
    observedState: `${primaryDrive.freeGb ?? primaryDrive.totalGb} GB Free (${primaryDrive.type})`,
    requiredState: `Minimum ${totalRequired} GB Free`,
  };
}
