import { describe, it, expect } from "vitest";
import { reduceActiveSlug, type CallbackEntry } from "@/lib/active-section";

describe("reduceActiveSlug", () => {
  it("sets activeSlug to the intersecting entry's id when one intersects", () => {
    const state = new Map<string, boolean>([
      ["section-1", true],
      ["section-2", false],
    ]);
    const result = reduceActiveSlug(state, [
      { target: { id: "section-1" }, isIntersecting: true },
      { target: { id: "section-2" }, isIntersecting: false },
    ] as CallbackEntry[]);
    expect(result).toBe("section-1");
  });

  it("does NOT clear activeSlug when a non-intersecting entry leaves but another is still visible (the partial-callback bug)", () => {
    // Section-1 was visible and is now scrolling out (isIntersecting: false).
    // Section-2 is still visible but unchanged — so it's NOT in this callback's
    // entries array. The naive `entries.every(!isIntersecting)` would clear
    // activeSlug; the correct behavior keeps section-2 as active.
    const state = new Map<string, boolean>([
      ["section-1", true],
      ["section-2", true],
    ]);
    const result = reduceActiveSlug(state, [
      { target: { id: "section-1" }, isIntersecting: false },
    ] as CallbackEntry[]);
    expect(result).toBe("section-2");
  });

  it("clears activeSlug when every observed entry reports not-intersecting and the map has no true entries", () => {
    const state = new Map<string, boolean>([
      ["section-1", false],
      ["section-2", false],
    ]);
    const result = reduceActiveSlug(state, [
      { target: { id: "section-1" }, isIntersecting: false },
      { target: { id: "section-2" }, isIntersecting: false },
    ] as CallbackEntry[]);
    expect(result).toBe("");
  });

  it("clears activeSlug when the previously-active section leaves and no other section is visible", () => {
    const state = new Map<string, boolean>([["section-1", true]]);
    const result = reduceActiveSlug(state, [
      { target: { id: "section-1" }, isIntersecting: false },
    ] as CallbackEntry[]);
    expect(result).toBe("");
  });

  it("handles an empty entries array by returning the current active id", () => {
    const state = new Map<string, boolean>([
      ["section-1", true],
      ["section-2", false],
    ]);
    const result = reduceActiveSlug(state, []);
    expect(result).toBe("section-1");
  });

  it("prefers the first intersecting entry in insertion order", () => {
    const state = new Map<string, boolean>([
      ["section-1", false],
      ["section-2", true],
      ["section-3", true],
    ]);
    const result = reduceActiveSlug(state, [
      { target: { id: "section-2" }, isIntersecting: true },
      { target: { id: "section-3" }, isIntersecting: true },
    ] as CallbackEntry[]);
    expect(result).toBe("section-2");
  });
});
