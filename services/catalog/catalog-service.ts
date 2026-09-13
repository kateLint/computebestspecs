import { Cpu, Gpu } from "../../lib/domain/hardware";
import { Software } from "../../lib/domain/software";

export interface CatalogRepository {
  searchCpus(query: string, limit?: number): Promise<Cpu[]>;
  searchGpus(query: string, limit?: number): Promise<Gpu[]>;
  searchSoftware(query: string, limit?: number): Promise<Software[]>;
  getCpuById(id: string): Promise<Cpu | null>;
  getGpuById(id: string): Promise<Gpu | null>;
  getSoftwareById(id: string): Promise<Software | null>;
}

export class IsolatedCatalogService {
  private primaryRepo: CatalogRepository;
  private readReplicaRepo?: CatalogRepository;
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();
  private cacheTtlMs = 60000; // 1 min local cache

  constructor(primary: CatalogRepository, readReplica?: CatalogRepository) {
    this.primaryRepo = primary;
    this.readReplicaRepo = readReplica;
  }

  private getActiveSearchRepo(): CatalogRepository {
    // Isolate search queries onto read replica to protect transactional primary DB (§1)
    return this.readReplicaRepo || this.primaryRepo;
  }

  async searchCpus(query: string, limit: number = 10): Promise<Cpu[]> {
    const cacheKey = `cpu_search_${query.toLowerCase()}_${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const results = await this.getActiveSearchRepo().searchCpus(query, limit);
    this.cache.set(cacheKey, { data: results, expiresAt: Date.now() + this.cacheTtlMs });
    return results;
  }

  async searchGpus(query: string, limit: number = 10): Promise<Gpu[]> {
    const cacheKey = `gpu_search_${query.toLowerCase()}_${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const results = await this.getActiveSearchRepo().searchGpus(query, limit);
    this.cache.set(cacheKey, { data: results, expiresAt: Date.now() + this.cacheTtlMs });
    return results;
  }

  async searchSoftware(query: string, limit: number = 10): Promise<Software[]> {
    const cacheKey = `software_search_${query.toLowerCase()}_${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const results = await this.getActiveSearchRepo().searchSoftware(query, limit);
    this.cache.set(cacheKey, { data: results, expiresAt: Date.now() + this.cacheTtlMs });
    return results;
  }
}
