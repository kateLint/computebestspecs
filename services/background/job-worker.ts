import { RawRequirementRecord, parseRawRequirementText, evaluateDataFreshness, ImportStatus } from "../ingestion/ingestion-pipeline";
import { SoftwareVersion } from "../../lib/domain/software";

export type JobType = "INGEST_RAW_REQUIREMENT" | "AUDIT_DATA_FRESHNESS" | "GENERATE_REPORT";

export interface BackgroundJob<T = any> {
  id: string;
  type: JobType;
  idempotencyKey: string;
  payload: T;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  retries: number;
  maxRetries: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  result?: any;
}

export class BackgroundJobWorker {
  private jobs: Map<string, BackgroundJob> = new Map();
  private processedKeys: Set<string> = new Set();

  enqueue<T>(type: JobType, idempotencyKey: string, payload: T, maxRetries: number = 3): BackgroundJob<T> {
    // Idempotent Job Execution (§17)
    if (this.processedKeys.has(idempotencyKey)) {
      const existing = Array.from(this.jobs.values()).find(j => j.idempotencyKey === idempotencyKey);
      if (existing) return existing;
    }

    const job: BackgroundJob<T> = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      idempotencyKey,
      payload,
      status: "PENDING",
      retries: 0,
      maxRetries,
      createdAt: new Date().toISOString(),
    };

    this.jobs.set(job.id, job);
    return job;
  }

  async processNextJob(): Promise<BackgroundJob | null> {
    const pendingJob = Array.from(this.jobs.values()).find(j => j.status === "PENDING");
    if (!pendingJob) return null;

    pendingJob.status = "PROCESSING";

    try {
      if (pendingJob.type === "INGEST_RAW_REQUIREMENT") {
        const raw = pendingJob.payload as RawRequirementRecord;
        const candidate = parseRawRequirementText(raw);
        pendingJob.result = candidate;
      } else if (pendingJob.type === "AUDIT_DATA_FRESHNESS") {
        const versions = pendingJob.payload as SoftwareVersion[];
        const auditResults = versions.map(v => {
          const source = v.sourceRecords[0];
          return {
            versionId: v.id,
            freshness: source?.retrievedAt ? evaluateDataFreshness(source.retrievedAt) : { isFresh: false, qualityStatus: "INSUFFICIENT" },
          };
        });
        pendingJob.result = auditResults;
      }

      pendingJob.status = "COMPLETED";
      pendingJob.completedAt = new Date().toISOString();
      this.processedKeys.add(pendingJob.idempotencyKey);
    } catch (err: any) {
      pendingJob.retries++;
      if (pendingJob.retries >= pendingJob.maxRetries) {
        pendingJob.status = "FAILED";
        pendingJob.error = err?.message || "Unknown error";
      } else {
        pendingJob.status = "PENDING";
      }
    }

    return pendingJob;
  }

  getJob(id: string): BackgroundJob | undefined {
    return this.jobs.get(id);
  }

  listJobs(): BackgroundJob[] {
    return Array.from(this.jobs.values());
  }
}

export const jobWorker = new BackgroundJobWorker();
