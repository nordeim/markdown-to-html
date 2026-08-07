import { useState, useEffect, useMemo } from "react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { SkipLink } from "@/components/SkipLink";
import { enhanceMarkdown } from "@/lib/enhance";
import { buildToc } from "@/lib/toc";
import { parseDocument } from "@/lib/frontmatter";
import { loadRegistry } from "@/lib/tags";
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
  const enhanced = useMemo(
    () => enhanceMarkdown(body, registry),
    [body, registry],
  );

  // Memoize the TOC
  const toc = useMemo(() => buildToc(body, 4), [body]);

  // Active section tracking
  const [activeSlug, setActiveSlug] = useState<string>("");

  useEffect(() => {
    const flattened = flattenToc(toc);
    if (flattened.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSlug(entry.target.id);
        }
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
