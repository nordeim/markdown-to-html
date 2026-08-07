import type { Frontmatter, ParsedDocument } from "@/types/frontmatter";

/**
 * Parses AND STRIPS YAML frontmatter from the top of a markdown file.
 * The pipeline MUST consume `body`, never the raw input.
 * BOM-safe: a leading U+FEFF is stripped before parsing.
 * CRLF-safe: \r\n is normalized to \n before parsing.
 */
export function parseDocument(markdown: string): ParsedDocument {
  const normalized = markdown.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { frontmatter: {}, body: normalized };

  const frontmatter: Frontmatter = {};
  for (const line of match[1]!.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;
    const key = trimmed.slice(0, colonIndex).trim();
    let value = trimmed.slice(colonIndex + 1).trim();
    value = value.replace(/^["']|["']$/g, "");
    if (value === "true") frontmatter[key] = true;
    else if (value === "false") frontmatter[key] = false;
    else frontmatter[key] = value;
  }

  // Strip the frontmatter block AND any blank lines separating it from the body.
  const body = normalized.slice(match[0]!.length).replace(/^\n+/, "");
  return { frontmatter, body };
}
