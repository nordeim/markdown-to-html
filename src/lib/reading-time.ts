import { scanLines } from "@/lib/fence";

/**
 * Reading-speed assumption: 200 words per minute (industry standard for
 * adult silent reading of English prose).
 *
 * CJK characters are counted as individual words because they carry
 * significantly more semantic density per character than Latin words.
 * This matches the convention used by Medium, dev.to, and most static-site
 * reading-time estimators.
 */
const WORDS_PER_MINUTE = 200;

/**
 * Rough estimate of reading time for a markdown document.
 *
 * The estimator:
 *   1. Strips fenced code blocks (code is read slower and shouldn't be
 *      counted as prose words).
 *   2. Strips markdown syntax (headers, bold, italic, links, lists).
 *   3. Counts Latin words (whitespace-separated tokens).
 *   4. Counts CJK characters individually (each one = 1 word).
 *   5. Divides by WORDS_PER_MINUTE, rounds up to the nearest minute.
 *
 * The result is a string like "5 min read" suitable for display in the
 * layout's meta line.
 */
export function estimateReadingTime(markdown: string): string {
  if (!markdown || markdown.trim().length === 0) {
    return "0 min read";
  }

  // Strip fenced code blocks — scanLines marks fence delimiters and the
  // lines inside as insideFence: true.
  const proseLines = scanLines(markdown)
    .filter((region) => !region.insideFence)
    .map((region) => region.line);

  const prose = proseLines.join("\n");

  // Strip markdown syntax that would inflate the word count:
  //   - ATX headings: ## Heading → Heading
  //   - Bold/italic markers: **bold**, _italic_ → bold, italic
  //   - Inline code: `code` → (removed, code is not prose)
  //   - Links: [text](url) → text
  //   - Images: ![alt](url) → (removed, alt text not typically read)
  //   - List markers: - item, 1. item → item
  //   - Blockquotes: > quote → quote
  //   - Horizontal rules: --- → (removed)
  //   - HTML tags: <br> → (removed)
  const stripped = prose
    .replace(/^#{1,6}\s+/gm, "") // headers
    .replace(/```[\s\S]*?```/g, "") // fenced code (defensive — already stripped)
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → text
    .replace(/[*_~]+/g, " ") // bold/italic/strikethrough markers
    .replace(/^\s*[-*+]\s+/gm, "") // unordered list markers
    .replace(/^\s*\d{1,9}[.)]\s+/gm, "") // ordered list markers
    .replace(/^\s*>\s?/gm, "") // blockquote markers
    .replace(/^[-*_]{3,}\s*$/gm, " ") // horizontal rules
    .replace(/<[^>]+>/g, " "); // raw HTML tags

  // Count Latin words (sequences of Latin letters/digits/apostrophes).
  const latinWords = stripped.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g);
  const latinCount = latinWords ? latinWords.length : 0;

  // Count CJK characters individually. Unicode ranges covered:
  //   - CJK Unified Ideographs (U+4E00–U+9FFF)
  //   - CJK Extension A (U+3400–U+4DBF)
  //   - CJK Compatibility Ideographs (U+F900–U+FAFF)
  //   - Hiragana (U+3040–U+309F)
  //   - Katakana (U+30A0–U+30FF)
  //   - Hangul Syllables (U+AC00–U+D7AF)
  const cjkChars = stripped.match(
    /[\u3400-\u9FFF\uF900-\uFAFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/g,
  );
  const cjkCount = cjkChars ? cjkChars.length : 0;

  const totalWords = latinCount + cjkCount;
  if (totalWords === 0) {
    return "0 min read";
  }

  const minutes = Math.max(1, Math.ceil(totalWords / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}
