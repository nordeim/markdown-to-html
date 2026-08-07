import { describe, it, expect } from "vitest";
import { loadRegistry, resolveBadge, validateRegistry } from "@/lib/tags";
import type { TagRegistry } from "@/types/tag";

const OK: TagRegistry = {
  Severity: { name: "Severity", values: { critical: { accent: 1 } } },
  Confidence: { name: "Confidence", values: { verified: { accent: 1 } } },
};

describe("registry validation", () => {
  it("accepts a clean registry", () => {
    expect(validateRegistry(OK)).toEqual([]);
    expect(() => loadRegistry(OK)).not.toThrow();
  });
  it("detects cross-category value collisions", () => {
    const bad: TagRegistry = {
      Status: { name: "Status", values: { draft: { accent: 3 } } },
      Priority: { name: "Priority", values: { draft: { accent: 2 } } },
    };
    const errors = validateRegistry(bad);
    expect(errors.some((e) => e.includes("collision") && e.includes("Status") && e.includes("Priority"))).toBe(true);
    expect(() => loadRegistry(bad)).toThrow(/collision/);
  });
  it("rejects uppercase-registered values and out-of-range accents", () => {
    const bad: TagRegistry = { S: { name: "S", values: { Critical: { accent: 1 }, ok: { accent: 9 as 1 | 2 | 3 | 4 | 5 } } } };
    expect(validateRegistry(bad)).toHaveLength(2);
  });
});

describe("resolveBadge", () => {
  it("resolves across categories from value alone", () => {
    expect(resolveBadge(OK, "verified")?.tag).toBe("Confidence");
    expect(resolveBadge(OK, "  CRITICAL  ")?.tag).toBe("Severity");
  });
  it("returns null for unknown or empty values", () => {
    expect(resolveBadge(OK, "nope")).toBeNull();
    expect(resolveBadge(OK, "   ")).toBeNull();
  });
  it("capitalizes default labels", () => {
    expect(resolveBadge(OK, "critical")?.label).toBe("Critical");
  });
});
