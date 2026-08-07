import type { MarkdownToWebConfig } from "@/types/config";
import type { TemplateName } from "@/types/template";

/**
 * Default configuration — used when no override is provided.
 *
 * `template: "technical"` matches the existing active template in
 * `src/templates/active.ts`. Changing the default here without also updating
 * `active.ts` would leave the project in an inconsistent state.
 */
export const DEFAULT_CONFIG: MarkdownToWebConfig = {
  markdown: "src/content/document.md",
  template: "technical",
  tocMaxDepth: 4,
  offlineFonts: false,
  syntaxHighlighting: false,
};

const VALID_TEMPLATES: readonly TemplateName[] = ["editorial", "technical", "minimal"];
const VALID_TOC_DEPTHS: readonly number[] = [2, 3, 4];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Validate and normalize a `MarkdownToWebConfig` from untrusted input.
 *
 * Throws on any invalid field — the team-extension surface is typed, so a
 * config that doesn't match the type is a programmer error, not a runtime
 * fallback case.
 *
 * Missing fields fall back to `DEFAULT_CONFIG`.
 */
export function resolveConfig(input: unknown): MarkdownToWebConfig {
  if (input === undefined || input === null) {
    return { ...DEFAULT_CONFIG };
  }

  if (!isObject(input)) {
    throw new Error(`Invalid config: expected an object or null/undefined, got ${typeof input}.`);
  }

  const result: MarkdownToWebConfig = { ...DEFAULT_CONFIG };

  if ("markdown" in input) {
    const markdown = input.markdown;
    if (!isString(markdown)) {
      throw new Error(`Invalid config.markdown: expected a string, got ${typeof markdown}.`);
    }
    result.markdown = markdown;
  }

  if ("template" in input) {
    const template = input.template;
    if (!isString(template)) {
      throw new Error(`Invalid config.template: expected a string, got ${typeof template}.`);
    }
    if (!VALID_TEMPLATES.includes(template as TemplateName)) {
      throw new Error(
        `Invalid config.template: "${template}" is not one of ${VALID_TEMPLATES.join(", ")}.`,
      );
    }
    result.template = template as TemplateName;
  }

  if ("tocMaxDepth" in input) {
    const tocMaxDepth = input.tocMaxDepth;
    if (typeof tocMaxDepth !== "number" || !Number.isInteger(tocMaxDepth)) {
      throw new Error(
        `Invalid config.tocMaxDepth: expected an integer, got ${String(tocMaxDepth)}.`,
      );
    }
    if (!VALID_TOC_DEPTHS.includes(tocMaxDepth)) {
      throw new Error(
        `Invalid config.tocMaxDepth: ${tocMaxDepth} is not one of ${VALID_TOC_DEPTHS.join(", ")}.`,
      );
    }
    result.tocMaxDepth = tocMaxDepth as 2 | 3 | 4;
  }

  if ("offlineFonts" in input) {
    const offlineFonts = input.offlineFonts;
    if (!isBoolean(offlineFonts)) {
      throw new Error(
        `Invalid config.offlineFonts: expected a boolean, got ${typeof offlineFonts}.`,
      );
    }
    result.offlineFonts = offlineFonts;
  }

  if ("syntaxHighlighting" in input) {
    const syntaxHighlighting = input.syntaxHighlighting;
    if (!isBoolean(syntaxHighlighting)) {
      throw new Error(
        `Invalid config.syntaxHighlighting: expected a boolean, got ${typeof syntaxHighlighting}.`,
      );
    }
    result.syntaxHighlighting = syntaxHighlighting;
  }

  if ("errorReportingEndpoint" in input) {
    const endpoint = input.errorReportingEndpoint;
    if (!isString(endpoint)) {
      throw new Error(
        `Invalid config.errorReportingEndpoint: expected a string, got ${typeof endpoint}.`,
      );
    }
    result.errorReportingEndpoint = endpoint;
  }

  if ("tags" in input && input.tags !== undefined) {
    const tags = input.tags;
    if (!isObject(tags)) {
      throw new Error(`Invalid config.tags: expected an object, got ${typeof tags}.`);
    }
    result.tags = tags as MarkdownToWebConfig["tags"];
  }

  return result;
}
