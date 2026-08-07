import type { TemplateLayoutProps } from "@/types/template";
import { TableOfContents } from "@/components/TableOfContents";
import { ThemeToggle } from "@/components/ThemeToggle";

export function TechnicalLayout({
  title,
  toc,
  activeSlug,
  children,
}: TemplateLayoutProps) {
  return (
    <div className="min-h-screen bg-bg">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="truncate text-lg font-semibold text-text">{title}</h1>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8 py-8">
          {/* Left nav — TOC */}
          <aside className="hidden w-60 shrink-0 lg:block">
            <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                On this page
              </h2>
              <TableOfContents items={toc} activeSlug={activeSlug} />
            </nav>
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1" id="content">
            <article className="prose prose-slate max-w-none">
              {children}
            </article>
          </main>

          {/* Right outline — "on this page" for H3/H4 */}
          <aside className="hidden w-48 shrink-0 xl:block">
            <div className="sticky top-24">
              <OnThisPage toc={toc} activeSlug={activeSlug} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** Recursive "on this page" outline showing H3/H4 under the active H2. */
function OnThisPage({ toc, activeSlug }: { toc: TemplateLayoutProps["toc"]; activeSlug?: string }) {
  const activeItem = findActive(toc, activeSlug);
  if (!activeItem || activeItem.children.length === 0) return null;

  return (
    <div className="border-l border-border pl-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
        In this section
      </h3>
      <ul className="space-y-1">
        {activeItem.children.map((child) => (
          <li key={child.slug}>
            <a
              href={`#${child.slug}`}
              className={`block text-sm ${
                child.slug === activeSlug
                  ? "font-medium text-accent"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {child.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function findActive(toc: TemplateLayoutProps["toc"], activeSlug?: string): TemplateLayoutProps["toc"][number] | undefined {
  for (const item of toc) {
    if (item.slug === activeSlug) return item;
    const found = findActive(item.children, activeSlug);
    if (found) return found;
  }
  return undefined;
}
