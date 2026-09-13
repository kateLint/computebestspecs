export interface SystemMetrics {
  totalEvaluations: number;
  totalRecommendations: number;
  evaluationErrors: number;
  lowConfidenceEvaluations: number;
  ambiguousHardwareQueries: number;
  staleRecordsEncountered: number;
  p95EvaluationLatencyMs: number;
}

class MetricsCollector {
  private totalEvaluations = 0;
  private totalRecommendations = 0;
  private evaluationErrors = 0;
  private lowConfidenceEvaluations = 0;
  private ambiguousHardwareQueries = 0;
  private staleRecordsEncountered = 0;
  private latencies: number[] = [];

  recordEvaluation(latencyMs: number, confidence: number, isAmbiguousHardware: boolean = false, hasStaleData: boolean = false) {
    this.totalEvaluations++;
    this.latencies.push(latencyMs);
    if (this.latencies.length > 1000) this.latencies.shift();

    if (confidence < 65) this.lowConfidenceEvaluations++;
    if (isAmbiguousHardware) this.ambiguousHardwareQueries++;
    if (hasStaleData) this.staleRecordsEncountered++;
  }

  recordRecommendation(latencyMs: number) {
    this.totalRecommendations++;
    this.latencies.push(latencyMs);
    if (this.latencies.length > 1000) this.latencies.shift();
  }

  recordError() {
    this.evaluationErrors++;
  }

  getMetrics(): SystemMetrics {
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95 = sorted[p95Index] || 0;

    return {
      totalEvaluations: this.totalEvaluations,
      totalRecommendations: this.totalRecommendations,
      evaluationErrors: this.evaluationErrors,
      lowConfidenceEvaluations: this.lowConfidenceEvaluations,
      ambiguousHardwareQueries: this.ambiguousHardwareQueries,
      staleRecordsEncountered: this.staleRecordsEncountered,
      p95EvaluationLatencyMs: p95,
    };
  }

  reset() {
    this.totalEvaluations = 0;
    this.totalRecommendations = 0;
    this.evaluationErrors = 0;
    this.lowConfidenceEvaluations = 0;
    this.ambiguousHardwareQueries = 0;
    this.staleRecordsEncountered = 0;
    this.latencies = [];
  }
}

export const metrics = new MetricsCollector();
