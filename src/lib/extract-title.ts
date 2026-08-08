import { parseDocument } from "@/lib/frontmatter";
import { scanLines } from "@/lib/fence";

/**
 * Extract the document title for use as `<title>` in the built `index.html`.
 *
 * Priority:
 *   1. Frontmatter `title:` field (if present and non-empty).
 *   2. First non-fenced ATX H1 in the body.
 *   3. `null` — caller should fall back to a default.
 *
 * Markdown emphasis (`**bold**`, `_italic_`) is stripped from H1 text so the
 * browser tab title reads as plain text. Fenced code blocks are skipped so a
 * `# comment` line inside a code fence is not mistaken for a heading.
 *
 * Used by the `transformIndexHtml` Vite plugin in `vite.config.ts` to rewrite
 * the static `<title>` at build time, eliminating the pre-hydration flash of
 * the wrong title that the runtime `useEffect` in App.tsx cannot prevent.
 */
export function extractDocumentTitle(markdown: string): string | null {
  if (!markdown) return null;

  const { frontmatter, body } = parseDocument(markdown);

  // 1. Frontmatter title.
  if (typeof frontmatter.title === "string" && frontmatter.title.trim()) {
    return frontmatter.title.trim();
  }

  // 2. First non-fenced H1.
  const regions = scanLines(body);
  for (const region of regions) {
    if (region.insideFence) continue;
    const m = region.line.match(/^#\s+(.+?)\s*$/);
    if (m) {
      const raw = m[1]!;
      // Strip **bold**, _italic_, `code`.
      return raw
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/__([^_]+)__/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/_([^_]+)_/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .trim();
    }
  }

  return null;
}
