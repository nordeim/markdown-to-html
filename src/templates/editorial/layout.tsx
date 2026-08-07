import type { TemplateLayoutProps } from "@/types/template";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BackToTop } from "@/components/BackToTop";
import { MobileNav } from "@/components/MobileNav";

/**
 * Editorial layout — single-column, long-form reading register.
 *
 * Differs from the technical layout:
 *   - No right "on this page" outline (the reading flow is sequential,
 *     not navigated non-linearly).
 *   - Narrower content measure (max-w-3xl vs max-w-7xl) for readability.
 *   - Larger hero with title, subtitle, author, date, reading time.
 *   - Drop-cap on the first paragraph (achieved via CSS, not a component
 *     override — the renderer's `<p>` is shared with the technical template).
 *
 * The mobile drawer is shared with the technical template via `MobileNav`.
 */
export function EditorialLayout({
  title,
  subtitle,
  author,
  date,
  readingTime,
  toc,
  activeSlug,
  children,
}: TemplateLayoutProps) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/60">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <MobileNav toc={toc} activeSlug={activeSlug} />
            <span className="truncate text-sm font-medium uppercase tracking-wider text-text-tertiary">
              {title}
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero */}
      <div className="mx-auto max-w-3xl px-4 pt-12 pb-8 sm:px-6">
        <h1 className="text-4xl font-bold tracking-tight text-text sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 text-xl text-text-secondary">{subtitle}</p>}
        {(author || date || readingTime) && (
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-tertiary">
            {author && <span>By {author}</span>}
            {date && <span>{date}</span>}
            {readingTime && <span>{readingTime}</span>}
          </div>
        )}
      </div>

      <main id="content" className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        <article className="prose prose-slate max-w-none">{children}</article>
      </main>

      <BackToTop />
    </div>
  );
}
