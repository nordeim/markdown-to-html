import { cn } from "@/utils/cn";
import type { TocItem } from "@/types/toc";

interface TableOfContentsProps {
  items: TocItem[];
  activeSlug?: string;
  onNavigate?: () => void;
}

export function TableOfContents({ items, activeSlug, onNavigate }: TableOfContentsProps) {
  if (items.length === 0) {
    return <p className="text-sm text-text-tertiary">No sections</p>;
  }

  return (
    <nav aria-label="Table of contents">
      <ul className="space-y-1">
        {items.map((item) => (
          <TocItemComponent
            key={item.slug}
            item={item}
            activeSlug={activeSlug}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </nav>
  );
}

function TocItemComponent({
  item,
  activeSlug,
  onNavigate,
}: {
  item: TocItem;
  activeSlug?: string;
  onNavigate?: () => void;
}) {
  return (
    <li>
      <a
        href={`#${item.slug}`}
        onClick={onNavigate}
        className={cn(
          "block rounded px-2 py-1.5 text-sm transition-colors",
          item.slug === activeSlug
            ? "bg-accent-bg font-medium text-accent"
            : "text-text-secondary hover:bg-bg-tertiary hover:text-text",
          item.level === 3 && "ml-3 border-l border-border pl-3",
          item.level === 4 && "ml-6 border-l border-border pl-3",
        )}
      >
        {item.text}
      </a>
      {item.children.length > 0 && (
        <ul className="mt-1 space-y-1">
          {item.children.map((child) => (
            <TocItemComponent
              key={child.slug}
              item={child}
              activeSlug={activeSlug}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
