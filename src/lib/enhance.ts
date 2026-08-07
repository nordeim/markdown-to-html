import { scanLines } from "@/lib/fence";
import type { TagDefinition, TagRegistry } from "@/types/tag";

const BADGE_LINE_RE = /^(\s*(?:[-*+]\s+|\d{1,9}[.)]\s+))\*\*([^*]+):\*\*\s+(.+)$/;

export interface EnhanceResult {
  enhanced: string;
  warnings: string[];
}

function findTag(registry: TagRegistry, raw: string): TagDefinition | undefined {
  const lower = raw.toLowerCase();
  return Object.values(registry).find((d) => d.name.toLowerCase() === lower);
}

export function enhanceMarkdown(markdown: string, registry: TagRegistry): EnhanceResult {
  const warnings: string[] = [];
  const out: string[] = [];
  for (const { line, lineNumber, insideFence } of scanLines(markdown)) {
    if (insideFence) { out.push(line); continue; }
    const match = line.match(BADGE_LINE_RE);
    if (!match) { out.push(line); continue; }
    const [, bullet, rawTag, rawValue] = match;
    const def = findTag(registry, rawTag!.trim());
    if (!def) { out.push(line); continue; }
    const value = rawValue!.trim();
    if (!def.values[value.toLowerCase()]) {
      warnings.push(
        `line ${lineNumber}: unknown value "${value}" for tag "${def.name}". ` +
        `Allowed: ${Object.keys(def.values).join(", ")}`,
      );
      out.push(line);
      continue;
    }
    out.push(`${bullet}**${def.name}:** \`${value}\``);
  }
  return { enhanced: out.join("\n"), warnings };
}
