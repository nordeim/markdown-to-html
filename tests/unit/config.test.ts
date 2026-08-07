import { describe, it, expect } from "vitest";
import { resolveConfig, DEFAULT_CONFIG } from "@/lib/config";
import type { MarkdownToWebConfig } from "@/types/config";

describe("resolveConfig", () => {
  it("returns DEFAULT_CONFIG for undefined input", () => {
    expect(resolveConfig(undefined)).toEqual(DEFAULT_CONFIG);
  });

  it("returns DEFAULT_CONFIG for null input", () => {
    expect(resolveConfig(null)).toEqual(DEFAULT_CONFIG);
  });

  it("returns DEFAULT_CONFIG for empty object input", () => {
    expect(resolveConfig({})).toEqual(DEFAULT_CONFIG);
  });

  it("applies provided markdown path", () => {
    const config = resolveConfig({ markdown: "src/content/custom.md" });
    expect(config.markdown).toBe("src/content/custom.md");
  });

  it("applies provided template name", () => {
    const config = resolveConfig({ template: "editorial" });
    expect(config.template).toBe("editorial");
  });

  it("applies provided tocMaxDepth", () => {
    const config = resolveConfig({ tocMaxDepth: 3 });
    expect(config.tocMaxDepth).toBe(3);
  });

  it("applies provided offlineFonts flag", () => {
    const config = resolveConfig({ offlineFonts: true });
    expect(config.offlineFonts).toBe(true);
  });

  it("applies provided syntaxHighlighting flag", () => {
    const config = resolveConfig({ syntaxHighlighting: true });
    expect(config.syntaxHighlighting).toBe(true);
  });

  it("throws on invalid template name", () => {
    expect(() =>
      resolveConfig({ template: "fancy" as unknown as MarkdownToWebConfig["template"] }),
    ).toThrow(/template/i);
  });

  it("throws on invalid tocMaxDepth", () => {
    expect(() => resolveConfig({ tocMaxDepth: 5 as unknown as 2 | 3 | 4 })).toThrow(/tocMaxDepth/i);
  });

  it("throws on non-object input", () => {
    expect(() => resolveConfig("not a config" as unknown as MarkdownToWebConfig)).toThrow(
      /object/i,
    );
  });

  it("throws on non-string markdown path", () => {
    expect(() => resolveConfig({ markdown: 123 as unknown as string })).toThrow(/markdown/i);
  });

  it("throws on non-string errorReportingEndpoint", () => {
    expect(() => resolveConfig({ errorReportingEndpoint: 123 as unknown as string })).toThrow(
      /errorReportingEndpoint/i,
    );
  });

  it("DEFAULT_CONFIG has sensible defaults", () => {
    expect(DEFAULT_CONFIG.template).toBe("technical");
    expect(DEFAULT_CONFIG.tocMaxDepth).toBe(4);
    expect(DEFAULT_CONFIG.offlineFonts).toBe(false);
    expect(DEFAULT_CONFIG.syntaxHighlighting).toBe(false);
    expect(DEFAULT_CONFIG.markdown).toBe("src/content/document.md");
  });
});
