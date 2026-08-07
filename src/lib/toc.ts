import GithubSlugger from "github-slugger";
import { scanLines } from "@/lib/fence";
import type { TocItem } from "@/types/toc";

export type { TocItem };

const ANY_HEADING_RE = /^(#{1,6})\s+(.+)$/;

/** Normalize heading text to match hast text content (what rehype-slug hashes). */
function headingText(raw: string): string {
  return raw
    .replace(/`/g, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // image → alt text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // link → link text
    .replace(/<(https?:\/\/[^>]+)>/g, "$1") // autolink → URL
    .trim();
}

export function buildToc(markdown: string, maxDepth: 2 | 3 | 4 = 4): TocItem[] {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const { line, insideFence } of scanLines(markdown)) {
    if (insideFence) continue;
    const match = line.match(ANY_HEADING_RE);
    if (!match) continue;

    const level = match[1]!.length;
    const text = headingText(match[2]!);
    const slug = slugger.slug(text); // reserve the slug at EVERY level

    if (level < 2 || level > maxDepth) continue;

    const item: TocItem = { level: level as 2 | 3 | 4, text, slug, children: [] };
    while (stack.length > 0 && stack[stack.length - 1]!.level >= level) {
      stack.pop();
    }
    if (stack.length === 0) items.push(item);
    else stack[stack.length - 1]!.children.push(item);
    stack.push(item);
  }
  return items;
}
