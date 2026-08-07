/**
 * Result of the `enhanceMarkdown` preprocessor.
 *
 * `enhanced` is the markdown string with badge values wrapped in backticks.
 * `warnings` lists any lines that matched the badge-line regex but referenced
 * an unknown value — useful for surfacing authoring mistakes in dev mode.
 */
export interface EnhanceResult {
  enhanced: string;
  warnings: string[];
}
