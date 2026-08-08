/**
 * Source-document internal-consistency validator.
 *
 * The markdown-to-web pipeline faithfully renders whatever the source markdown
 * contains. If the source has internal inconsistencies (e.g. the intro says
 * "198 skills" but the summary table totals 208 and the actual rows are 202),
 * the rendered page inherits all three numbers — eroding reader trust.
 *
 * This module parses a markdown document and asserts that three counts agree:
 *
 *   1. introCount  — the "**N skills**" claim in the first blockquote
 *   2. summaryTotal — the "**Total**" row of the "## Category Summary" table
 *   3. actualRows  — count of `| **name** |` rows across all `## n. ...` sections
 *
 * It also asserts that each per-category summary row matches the actual row
 * count for that section.
 *
 * Used by the `lint:source` gate (scripts/validate-source.mjs) to catch
 * source-data drift at build time.
 */

export interface ValidationResult {
  /** True iff every check passed. */
  ok: boolean;
  /** Human-readable error messages (empty when ok). */
  errors: string[];
  /** The intro "**N skills**" claim, or null if no claim was found. */
  introCount: number | null;
  /** The summary table's Total row value, or null if missing. */
  summaryTotal: number | null;
  /** Sum of the summary table's per-category rows. */
  summarySum: number;
  /** Actual count of `| **name** |` rows across all category sections. */
  actualRows: number;
}

/**
 * Validate a markdown document's internal count consistency.
 *
 * @param markdown - the full markdown source (UTF-8).
 * @returns a {@link ValidationResult} with `ok` and any error messages.
 */
export function validateSourceDocument(markdown: string): ValidationResult {
  const errors: string[] = [];

  // --- 1. Intro claim ---
  const introMatch = markdown.match(/\*\*(\d+)\s*skills?\*\*/);
  const introCount = introMatch ? parseInt(introMatch[1]!, 10) : null;

  // --- 2. Summary table ---
  // Split on "## Category Summary" (case-insensitive) and parse the table that
  // follows. Each row matches: | <num> | <name> | <count> |  OR  | | **Total** | <count> |
  const summarySection = markdown.split(/^##\s+Category\s+Summary/im)[1] ?? "";
  // Summary-table row. Matches both per-category rows (`| 1 | Name | 3 |`) and
  // the Total row (`|   | **Total** | **3** |`). The count column may be bold.
  const summaryRowRe = /^\|\s*(\d+)?\s*\|\s*([^|]+?)\s*\|\s*\*{0,2}(\d+)\*{0,2}\s*\|\s*$/gm;
  const perCategory: { num: number; name: string; count: number }[] = [];
  let summaryTotal: number | null = null;
  let match: RegExpExecArray | null;
  while ((match = summaryRowRe.exec(summarySection)) !== null) {
    const numStr = match[1];
    const name = match[2]!.replace(/\*\*/g, "").trim();
    const count = parseInt(match[3]!, 10);
    if (numStr !== undefined) {
      perCategory.push({ num: parseInt(numStr, 10), name, count });
    } else if (/total/i.test(name)) {
      summaryTotal = count;
    }
  }
  const summarySum = perCategory.reduce((acc, r) => acc + r.count, 0);

  if (summarySection.trim().length > 0 && summaryTotal === null) {
    errors.push("Summary table is missing the Total row.");
  }

  // --- 3. Actual rows per `## n. ...` section ---
  // Split on top-level numbered headings; stop each section at "## Category Summary".
  const sections = markdown.split(/^(?=##\s+\d+\.\s)/m);
  const actualPerCategory: Map<number, number> = new Map();
  let actualRows = 0;
  for (const section of sections) {
    const headingMatch = section.match(/^##\s+(\d+)\.\s+(.+?)$/m);
    if (!headingMatch) continue;
    const num = parseInt(headingMatch[1]!, 10);
    // Truncate at "## Category Summary" so we don't count summary-table rows.
    const body = section.split(/^##\s+Category\s+Summary/im)[0] ?? section;
    const rowRe = /^\|\s*\*\*([^|]+?)\*\*\s*\|/gm;
    let count = 0;
    while (rowRe.exec(body) !== null) count++;
    actualPerCategory.set(num, count);
    actualRows += count;
  }

  // --- Cross-checks ---
  if (introCount !== null && introCount !== actualRows) {
    errors.push(`Intro claim (${introCount}) does not match actual row count (${actualRows}).`);
  }
  if (summaryTotal !== null && summaryTotal !== summarySum) {
    errors.push(
      `Summary total row (${summaryTotal}) does not match sum of summary rows (${summarySum}).`,
    );
  }
  if (summaryTotal !== null && introCount !== null && summaryTotal !== introCount) {
    errors.push(`Summary total (${summaryTotal}) does not match intro claim (${introCount}).`);
  }
  if (summaryTotal !== null && summaryTotal !== actualRows) {
    errors.push(`Summary total (${summaryTotal}) does not match actual row count (${actualRows}).`);
  }
  for (const { num, name, count } of perCategory) {
    const actual = actualPerCategory.get(num);
    if (actual !== undefined && actual !== count) {
      errors.push(
        `Category ${num} (${name}): summary count (${count}) does not match actual rows (${actual}).`,
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    introCount,
    summaryTotal,
    summarySum,
    actualRows,
  };
}
