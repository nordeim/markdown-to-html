import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import { TableOfContents } from "@/components/TableOfContents";
import type { TocItem } from "@/types/toc";

interface MobileNavProps {
  toc: TocItem[];
  activeSlug?: string;
}

/**
 * Slide-in mobile navigation drawer for the table of contents.
 *
 * Visible on screens below the `lg` breakpoint (where the persistent left
 * sidebar is hidden). Triggered by a hamburger button in the header.
 *
 * Accessibility:
 *   - The drawer is a `role="dialog"` with `aria-modal="true"` and an
 *     `aria-label` so screen readers announce it as a separate context.
 *   - Escape closes the drawer.
 *   - Clicking a TOC link closes the drawer (so navigation feels immediate).
 *   - Clicking the backdrop closes the drawer.
 *   - Focus is moved to the drawer's close button on open and returned to
 *     the hamburger button on close.
 *
 * The drawer is rendered inline (not via a portal) because the layout
 * already establishes the correct stacking context. z-50 keeps it above the
 * sticky header (z-40).
 */
export function MobileNav({ toc, activeSlug }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Move focus to the close button on open, back to the hamburger on close
  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    } else {
      // Don't steal focus on initial mount
      openButtonRef.current?.focus();
    }
    // Only fire when `open` changes, not on mount.
  }, [open]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const handleNavigate = () => setOpen(false);

  return (
    <>
      <button
        ref={openButtonRef}
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-md border border-border bg-bg-secondary p-2.5 text-text-secondary hover:text-text hover:bg-bg-tertiary lg:hidden"
        aria-label="Open table of contents"
        aria-expanded={open}
        aria-controls="mobile-nav-dialog"
      >
        <Menu aria-hidden="true" className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="presentation"
          onClick={(e) => {
            // Close when the backdrop (not the drawer) is clicked
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

          {/* Drawer */}
          <div
            id="mobile-nav-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Table of contents"
            className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-bg shadow-xl overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">
                On this page
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-md text-text-secondary hover:text-text hover:bg-bg-tertiary"
                aria-label="Close table of contents"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <TableOfContents items={toc} activeSlug={activeSlug} onNavigate={handleNavigate} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
