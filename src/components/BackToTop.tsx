import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Floating "back to top" button. Becomes visible after the user scrolls past
 * one viewport. Clicking it scrolls to the top smoothly (or instantly when
 * the user has prefers-reduced-motion enabled).
 *
 * Accessibility:
 *   - `aria-label` provides a screen-reader label.
 *   - `aria-hidden` reflects visibility so screen readers don't announce
 *     a button the sighted user can't see.
 *   - `tabIndex` is set to -1 when hidden so keyboard users can't focus it.
 *   - The button is always in the DOM (just visually + a11y-hidden) to
 *     avoid layout thrash.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => {
      const viewport = window.innerHeight;
      const threshold = viewport; // one full viewport
      setVisible(window.scrollY > threshold);
    };

    // Initial check (in case the page loads scrolled — e.g., on fragment navigation)
    handler();

    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleClick = () => {
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      aria-hidden={visible ? "false" : "true"}
      tabIndex={visible ? 0 : -1}
      className={[
        "fixed bottom-6 right-6 z-30",
        "min-h-11 min-w-11 inline-flex items-center justify-center",
        "rounded-full border border-border bg-bg-secondary p-3",
        "text-text-secondary shadow-lg",
        "transition-all duration-200",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto hover:text-text hover:bg-bg-tertiary"
          : "opacity-0 translate-y-2 pointer-events-none",
        "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
      ].join(" ")}
    >
      <ArrowUp aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}
