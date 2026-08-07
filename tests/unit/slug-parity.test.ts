import { describe, it, expect } from "vitest";
import GithubSlugger from "github-slugger";
import { buildToc } from "@/lib/toc";

const FIXTURES = [
  "Simple Heading",
  "Heading with emoji 🎉",
  "中文标题",
  "CamelCase",
  "snake_case",
  "kebab-case",
  "  Leading whitespace  ",
];

describe("slug parity: github-slugger === rehype-slug", () => {
  for (const text of FIXTURES) {
    it(`matches for "${text}"`, () => {
      const slugger = new GithubSlugger();
      const toc = buildToc(`## ${text}`, 4);
      // buildToc trims heading text before slugging (headingText normalization)
      expect(toc[0]?.slug).toBe(slugger.slug(text.trim()));
    });
  }

  it("buildToc dedup counters stay in sync across heading levels", () => {
    const toc = buildToc("# Dup\n\n## Dup\n\n## Dup\n", 4);
    expect(toc.map((t) => t.slug)).toEqual(["dup-1", "dup-2"]);
  });

  it("fenced headings consume no slugs anywhere", () => {
    const toc = buildToc("```\n## Not Indexed\n```\n\n## Real\n", 4);
    expect(toc.map((t) => t.slug)).toEqual(["real"]);
  });
});
