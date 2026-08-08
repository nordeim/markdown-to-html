import { describe, it, expect } from "vitest";
import { validateSourceDocument, type ValidationResult } from "@/lib/validate-source";

describe("validateSourceDocument", () => {
  it("returns ok for a fully consistent document", () => {
    const md = `# Test Catalog

> **3 skills** organized into 1 category.

---

## 1. Category One

| Skill | Description |
|-------|-------------|
| **alpha** | First. |
| **beta** | Second. |
| **gamma** | Third. |

---

## Category Summary

| # | Category | Count |
|---|----------|-------|
| 1 | Category One | 3 |
|   | **Total**    | **3** |
`;
    const result: ValidationResult = validateSourceDocument(md);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.introCount).toBe(3);
    expect(result.summaryTotal).toBe(3);
    expect(result.actualRows).toBe(3);
  });

  it("fails when intro count does not match actual rows", () => {
    const md = `# Test

> **5 skills**

## 1. Cat

| **a** | x |
| **b** | y |

## Category Summary

| # | Category | Count |
|---|----------|-------|
| 1 | Cat | 2 |
|   | **Total** | **2** |
`;
    const result = validateSourceDocument(md);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Intro claim (5) does not match actual row count (2).");
  });

  it("fails when a per-category summary count does not match actual rows", () => {
    const md = `# Test

> **2 skills**

## 1. Cat

| **a** | x |
| **b** | y |

## Category Summary

| # | Category | Count |
|---|----------|-------|
| 1 | Cat | 5 |
|   | **Total** | **2** |
`;
    const result = validateSourceDocument(md);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("Category 1"))).toBe(true);
  });

  it("fails when summary total does not match sum of rows", () => {
    const md = `# Test

> **2 skills**

## 1. Cat

| **a** | x |
| **b** | y |

## Category Summary

| # | Category | Count |
|---|----------|-------|
| 1 | Cat | 2 |
|   | **Total** | **5** |
`;
    const result = validateSourceDocument(md);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "Summary total row (5) does not match sum of summary rows (2).",
    );
  });

  it("fails when summary total row is missing", () => {
    const md = `# Test

> **2 skills**

## 1. Cat

| **a** | x |
| **b** | y |

## Category Summary

| # | Category | Count |
|---|----------|-------|
| 1 | Cat | 2 |
`;
    const result = validateSourceDocument(md);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Summary table is missing the Total row.");
  });

  it("handles a document with no intro claim gracefully", () => {
    const md = `# Test

## 1. Cat

| **a** | x |

## Category Summary

| # | Category | Count |
|---|----------|-------|
| 1 | Cat | 1 |
|   | **Total** | **1** |
`;
    const result = validateSourceDocument(md);
    // No intro claim — skip the intro check, but other checks still run.
    expect(result.introCount).toBeNull();
    expect(result.actualRows).toBe(1);
    expect(result.summaryTotal).toBe(1);
    expect(result.ok).toBe(true);
  });
});
