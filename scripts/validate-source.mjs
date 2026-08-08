#!/usr/bin/env node
/**
 * Source-document validator CLI.
 *
 * Usage: node scripts/validate-source.mjs [path-to-markdown]
 *
 * Default: src/content/document.md
 *
 * Exits 0 if the document is internally consistent (intro count matches the
 * sum of summary-table rows matches the actual count of `| **name** |` rows).
 * Exits 1 with a diagnostic list on mismatch.
 *
 * Used by the `lint:source` quality gate (package.json scripts).
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const docPath = resolve(
  process.argv[2] ?? resolve(__dirname, "..", "src", "content", "document.md"),
);

// Inline the validator (ESM, no build step needed) — mirror of
// src/lib/validate-source.ts. Kept in sync manually; the unit tests exercise
// the TS version, this script exercises the same logic at build time.
function validateSourceDocument(markdown) {
  const errors = [];

  const introMatch = markdown.match(/\*\*(\d+)\s*skills?\*\*/);
  const introCount = introMatch ? parseInt(introMatch[1], 10) : null;

  const summarySection = markdown.split(/^##\s+Category\s+Summary/im)[1] ?? "";
  const summaryRowRe = /^\|\s*(\d+)?\s*\|\s*([^|]+?)\s*\|\s*\*{0,2}(\d+)\*{0,2}\s*\|\s*$/gm;
  const perCategory = [];
  let summaryTotal = null;
  let match;
  while ((match = summaryRowRe.exec(summarySection)) !== null) {
    const numStr = match[1];
    const name = match[2].replace(/\*\*/g, "").trim();
    const count = parseInt(match[3], 10);
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

  const sections = markdown.split(/^(?=##\s+\d+\.\s)/m);
  const actualPerCategory = new Map();
  let actualRows = 0;
  for (const section of sections) {
    const headingMatch = section.match(/^##\s+(\d+)\.\s+(.+?)$/m);
    if (!headingMatch) continue;
    const num = parseInt(headingMatch[1], 10);
    const body = section.split(/^##\s+Category\s+Summary/im)[0] ?? section;
    const rowRe = /^\|\s*\*\*([^|]+?)\*\*\s*\|/gm;
    let count = 0;
    while (rowRe.exec(body) !== null) count++;
    actualPerCategory.set(num, count);
    actualRows += count;
  }

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

const markdown = readFileSync(docPath, "utf8");
const result = validateSourceDocument(markdown);

console.log(`Validating: ${docPath}`);
console.log(`  Intro claim:     ${result.introCount ?? "(none)"}`);
console.log(`  Summary total:   ${result.summaryTotal ?? "(missing)"}`);
console.log(`  Summary sum:     ${result.summarySum}`);
console.log(`  Actual rows:     ${result.actualRows}`);

if (result.ok) {
  console.log("Source document is internally consistent.");
  process.exit(0);
} else {
  console.error(`${result.errors.length} consistency error(s):`);
  for (const err of result.errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}
