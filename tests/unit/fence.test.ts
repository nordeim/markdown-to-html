import { describe, it, expect } from "vitest";
import { scanLines } from "@/lib/fence";

const flags = (md: string) => scanLines(md).map((r) => r.insideFence);

describe("scanLines fence tracking", () => {
  it("marks fence delimiters and body as inside", () => {
    expect(flags("before\n```\ninside\n```\nafter")).toEqual([false, true, true, true, false]);
  });
  it("handles tilde fences and longer closing markers", () => {
    expect(flags("~~~\nx\n~~~~\nafter")).toEqual([true, true, true, false]);
  });
  it("unclosed fence extends to end of document", () => {
    expect(flags("```\nstill\nstill")).toEqual([true, true, true]);
  });
  it("does not close a backtick fence with tildes", () => {
    expect(flags("```\n~~~\nx\n```")).toEqual([true, true, true, true]);
  });
  it("requires closing fence at least as long", () => {
    expect(flags("````\nx\n```\ny\n````")).toEqual([true, true, true, true, true]);
  });
});
