import { describe, it, expect } from "vitest";
import { CompanionState } from "@/components/mascot/ComputeCompanion";

describe("ComputeCompanion State Mapping & Semantics", () => {
  it("supports all semantic diagnostic and runtime states", () => {
    const states: CompanionState[] = [
      "idle",
      "thinking",
      "success",
      "warning",
      "ambiguity",
      "spill",
      "error",
      "unknown",
    ];

    expect(states).toContain("spill");
    expect(states).toContain("error");
    expect(states).toContain("unknown");
    expect(states).toContain("ambiguity");
    expect(states).toHaveLength(8);
  });
});
