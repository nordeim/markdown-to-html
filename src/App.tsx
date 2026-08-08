import { useState, useEffect, useMemo } from "react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { SkipLink } from "@/components/SkipLink";
import { enhanceMarkdown } from "@/lib/enhance";
import { buildToc } from "@/lib/toc";
import { parseDocument } from "@/lib/frontmatter";
import { loadRegistry } from "@/lib/tags";
import { estimateReadingTime } from "@/lib/reading-time";
import { reduceActiveSlug } from "@/lib/active-section";
import { TAGS, TemplateLayout } from "@/templates/active";
import type { TocItem } from "@/types/toc";

// Import markdown content via Vite ?raw
import documentMd from "@/content/document.md?raw";

export function App() {
  // Parse frontmatter and strip it from the body
  const { frontmatter, body } = useMemo(() => parseDocument(documentMd), []);

  // Load and validate the tag registry
  const registry = useMemo(() => loadRegistry(TAGS), []);

  // Memoize the enhanced markdown (regex preprocessing + fence scan)
  const enhanced = useMemo(() => enhanceMarkdown(body, registry), [body, registry]);

  // Memoize the TOC
  const toc = useMemo(() => buildToc(body, 4), [body]);

  // Memoize the reading-time estimate (prose-word count, not raw character count)
  const readingTime = useMemo(() => estimateReadingTime(body), [body]);

  // Surface enhance warnings (unknown badge values, etc.) to the console.
  // Warnings indicate authoring mistakes — they should never silently
  // disappear. Production builds keep the same behavior because the warning
  // text is small and the call only fires when warnings exist.
  useEffect(() => {
    if (enhanced.warnings.length === 0) return;
    console.warn(
      `[markdown-to-web] ${enhanced.warnings.length} enhance warning(s):\n` +
        enhanced.warnings.map((w) => `  - ${w}`).join("\n"),
    );
  }, [enhanced.warnings]);

  // Keep document.title in sync with frontmatter.title so browser tabs,
  // bookmarks, and history reflect the actual document, not the hardcoded
  // "Skills Catalog" placeholder in index.html.
  useEffect(() => {
    const title = frontmatter.title ?? "Skills Catalog";
    if (document.title !== title) {
      document.title = title;
    }
  }, [frontmatter.title]);

  // Active section tracking
  const [activeSlug, setActiveSlug] = useState<string>("");

  useEffect(() => {
    const flattened = flattenToc(toc);
    if (flattened.length === 0) return;

    // Maintain a per-element visibility map so that partial IntersectionObserver
    // callbacks (which only contain *changed* entries, not every observed
    // element) don't cause the active section to incorrectly clear when a
    // leaving section's entry is the only one in the callback. See
    // src/lib/active-section.ts and tests/unit/active-section.test.ts.
    const visible = new Map<string, boolean>();

    const observer = new IntersectionObserver(
      (entries) => {
        const next = reduceActiveSlug(
          visible,
          entries.map((e) => ({
            target: { id: e.target.id },
            isIntersecting: e.isIntersecting,
          })),
        );
        setActiveSlug(next);
      },
      { rootMargin: "-80px 0px -80% 0px" },
    );

    for (const item of flattened) {
      const el = document.getElementById(item.slug);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [toc]);

  const title = frontmatter.title ?? "Skills Catalog";

  return (
    <>
      <SkipLink />
      <TemplateLayout
        title={title}
        subtitle={frontmatter.subtitle}
        author={frontmatter.author}
        date={frontmatter.date}
        readingTime={readingTime}
        toc={toc}
        activeSlug={activeSlug}
        markdown={enhanced.enhanced}
      >
        <MarkdownRenderer markdown={enhanced.enhanced} registry={registry} />
      </TemplateLayout>
    </>
  );
}

function flattenToc(items: TocItem[]): TocItem[] {
  return items.flatMap((i) => [i, ...flattenToc(i.children)]);
}
