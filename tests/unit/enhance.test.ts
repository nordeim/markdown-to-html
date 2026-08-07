import { describe, it, expect } from "vitest";
import { enhanceMarkdown } from "@/lib/enhance";
import type { TagRegistry } from "@/types/tag";

const REGISTRY: TagRegistry = {
  Severity: { name: "Severity", values: { critical: { accent: 1 }, low: { accent: 4 } } },
  Status:   { name: "Status",   values: { done: { accent: 4 } } },
};

describe("enhanceMarkdown", () => {
  it("wraps registered values in backticks", () => {
    expect(enhanceMarkdown("- **Severity:** critical", REGISTRY).enhanced).toBe("- **Severity:** `critical`");
  });
  it("accepts *, +, and ordered bullets", () => {
    for (const bullet of ["* ", "+ ", "1. ", "2) "]) {
      expect(enhanceMarkdown(`${bullet}**Severity:** low`, REGISTRY).enhanced).toContain("`low`");
    }
  });
  it("matches tags case-insensitively, outputs canonical case", () => {
    expect(enhanceMarkdown("- **severity:** critical", REGISTRY).enhanced).toBe("- **Severity:** `critical`");
  });
  it("leaves fenced badge lines untouched", () => {
    const md = "```\n- **Severity:** critical\n```";
    expect(enhanceMarkdown(md, REGISTRY).enhanced).toBe(md);
  });
  it("leaves blockquoted badges untouched (documented blind spot)", () => {
    const md = "> - **Severity:** critical";
    expect(enhanceMarkdown(md, REGISTRY).enhanced).toBe(md);
  });
  it("warns on unknown values and leaves the line unchanged", () => {
    const { enhanced, warnings } = enhanceMarkdown("- **Severity:** catastrophic", REGISTRY);
    expect(enhanced).toBe("- **Severity:** catastrophic");
    expect(warnings[0]).toContain("catastrophic");
  });
  it("leaves unregistered bold bullets unchanged without warning", () => {
    const md = "- **Note:** just text";
    expect(enhanceMarkdown(md, REGISTRY)).toEqual({ enhanced: md, warnings: [] });
  });
  it("transforms all matching lines in a document", () => {
    const md = "## F1\n- **Severity:** critical\n- **Status:** done\n## F2\n- **Severity:** low";
    const { enhanced } = enhanceMarkdown(md, REGISTRY);
    expect(enhanced).toContain("`critical`");
    expect(enhanced).toContain("`done`");
    expect(enhanced).toContain("`low`");
  });
});
