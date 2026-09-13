/**
 * Calculation Trace Subsystem
 * Records step-by-step diagnostic reasoning for engine transparency and debugging.
 */

export interface TraceStep {
  step: string;
  inputs: Record<string, unknown>;
  output: Record<string, unknown>;
  ruleIds: string[];
  notes?: string;
}

export class CalculationTraceBuilder {
  private steps: TraceStep[] = [];

  public recordStep(
    step: string,
    inputs: Record<string, unknown>,
    output: Record<string, unknown>,
    ruleIds: string[] = [],
    notes?: string
  ): void {
    this.steps.push({
      step,
      inputs,
      output,
      ruleIds,
      notes,
    });
  }

  public getSteps(): TraceStep[] {
    return [...this.steps];
  }

  public toSummary(): Record<string, unknown> {
    return {
      totalSteps: this.steps.length,
      steps: this.steps,
    };
  }
}
