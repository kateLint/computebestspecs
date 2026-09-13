import { HardwareProfile } from "../../lib/domain/hardware";
import { SelectedWorkload, SoftwareVersion } from "../../lib/domain/software";
import { evaluateCompatibility } from "../compatibility/compatibility-engine";
import { CompatibilityResult } from "../../lib/domain/compatibility";

export type NotificationChannel = "EMAIL" | "IN_APP" | "PUSH";

export type NotificationEvent =
  | "REQUIREMENT_CHANGED"
  | "COMPATIBILITY_CHANGED"
  | "PRICE_TARGET_REACHED"
  | "REPORT_READY";

export interface WatchlistEntry {
  id: string;
  userId: string;
  userEmail?: string;
  pcName: string;
  hardware: HardwareProfile;
  workloads: SelectedWorkload[];
  lastKnownResult: {
    compatibilityStatus: string;
    performanceTier: string;
    score: number;
    evaluatedAt: string;
  };
  preferredChannels: NotificationChannel[];
}

export interface WatchlistAlert {
  id: string;
  watchlistEntryId: string;
  userId: string;
  event: NotificationEvent;
  subject: string;
  message: string;
  tierDropped: boolean;
  tierBefore: string;
  tierAfter: string;
  scoreBefore: number;
  scoreAfter: number;
  createdAt: string;
}

export class WatchlistEngine {
  /**
   * Evaluates whether updated software requirements cause a tier or score regression on a saved user PC.
   */
  evaluateWatchlistEntry(
    entry: WatchlistEntry,
    updatedVersions: SoftwareVersion[]
  ): WatchlistAlert | null {
    const newResult = evaluateCompatibility(entry.hardware, entry.workloads, updatedVersions, true, false);

    const tierBefore = entry.lastKnownResult.performanceTier;
    const tierAfter = newResult.performanceTier;
    const scoreBefore = entry.lastKnownResult.score;
    const scoreAfter = newResult.score;

    const tierRank: Record<string, number> = {
      poor: 1,
      minimum: 2,
      usable: 3,
      recommended: 4,
      excellent: 5,
    };

    const isTierDropped = (tierRank[tierAfter] || 0) < (tierRank[tierBefore] || 0);
    const isHardRegression = entry.lastKnownResult.compatibilityStatus === "compatible" && newResult.compatibilityStatus === "incompatible";

    if (isTierDropped || isHardRegression || Math.abs(scoreAfter - scoreBefore) >= 10) {
      const subject = isHardRegression
        ? `⚠️ Compatibility Alert: ${entry.pcName} is no longer compatible with updated software requirements`
        : `Requirement Change Alert: ${entry.pcName} dropped from ${tierBefore.toUpperCase()} to ${tierAfter.toUpperCase()}`;

      const message = `Updated system requirements have changed your compatibility score from ${scoreBefore}/100 (${tierBefore}) to ${scoreAfter}/100 (${tierAfter}). Primary bottleneck: ${newResult.bottlenecks[0]?.component || "Memory"}.`;

      return {
        id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        watchlistEntryId: entry.id,
        userId: entry.userId,
        event: "COMPATIBILITY_CHANGED",
        subject,
        message,
        tierDropped: isTierDropped,
        tierBefore,
        tierAfter,
        scoreBefore,
        scoreAfter,
        createdAt: new Date().toISOString(),
      };
    }

    return null;
  }
}

export const watchlistEngine = new WatchlistEngine();
