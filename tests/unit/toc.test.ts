import { describe, it, expect } from "vitest";
import { buildToc } from "@/lib/toc";

describe("buildToc", () => {
  it("nests H3 under H2 and H4 under H3", () => {
    expect(buildToc("## A\n### B\n#### C\n", 4)[0]!.children[0]!.children[0]!.slug).toBe("c");
  });
  it("re-nests an H2 after deeper levels", () => {
    const toc = buildToc("## A\n### B\n## C\n", 4);
    expect(toc.map((t) => t.slug)).toEqual(["a", "c"]);
    expect(toc[1]!.children).toEqual([]);
  });
  it("promotes orphan headings to top level", () => {
    expect(buildToc("### Orphan\n## Real\n", 4).map((t) => t.slug)).toEqual(["orphan", "real"]);
  });
  it("ignores fenced headings", () => {
    expect(buildToc("```\n## Hidden\n```\n## Visible\n", 4).map((t) => t.slug)).toEqual(["visible"]);
  });
  it("respects maxDepth but still reserves slugs", () => {
    expect(buildToc("## A\n#### Deep\n## A\n", 3).map((t) => t.slug)).toEqual(["a", "a-1"]);
  });
  it("returns [] for empty markdown", () => {
    expect(buildToc("", 4)).toEqual([]);
  });
  it("strips backticks from heading text", () => {
    const toc = buildToc("## `Code` in Heading");
    expect(toc[0]!.text).toBe("Code in Heading");
    expect(toc[0]!.slug).toBe("code-in-heading");
  });
  it("handles repeated headings (github-slugger dedup)", () => {
    const toc = buildToc("## Section\n## Section");
    expect(toc[0]!.slug).toBe("section");
    expect(toc[1]!.slug).toBe("section-1");
  });
  it("handles CJK headings", () => {
    const toc = buildToc("## 中文标题");
    expect(toc[0]!.text).toBe("中文标题");
    expect(toc[0]!.slug).toBeTruthy();
  });
});
