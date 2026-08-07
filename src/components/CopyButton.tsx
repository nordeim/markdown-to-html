import { useState, useCallback, useRef } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  /** Returns the text to copy. Called on click to get the latest content. */
  getText: () => string;
  /** Optional className override. */
  className?: string;
}

/**
 * Copy-to-clipboard button. Renders a small icon button that, when clicked,
 * copies the result of `getText()` to the system clipboard.
 *
 * Uses the modern `navigator.clipboard.writeText` API when available, with a
 * fallback to the deprecated `document.execCommand("copy")` for older
 * browsers and insecure contexts (where the modern API is unavailable).
 *
 * Accessibility:
 *   - `aria-label` reflects the current state ("Copy code" vs "Copied!").
 *   - The visible icon swaps from clipboard to checkmark for ~2 seconds.
 *   - The button is `type="button"` so it never submits a parent form.
 */
export function CopyButton({ getText, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async () => {
    const text = getText();
    let succeeded = false;

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.clipboard === "object" &&
      navigator.clipboard !== null &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      try {
        await navigator.clipboard.writeText(text);
        succeeded = true;
      } catch {
        // Fall through to execCommand fallback.
      }
    }

    if (!succeeded) {
      // Fallback for older browsers / insecure contexts.
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.pointerEvents = "none";
        document.body.appendChild(textarea);
        textarea.select();
        succeeded = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
        // Last resort: silent failure — the button just doesn't show "Copied".
      }
    }

    if (succeeded) {
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [getText]);

  const Icon = copied ? Check : Copy;

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={[
        "min-h-9 min-w-9 inline-flex items-center justify-center",
        "rounded-md border border-border bg-bg-secondary p-2",
        "text-text-tertiary hover:text-text hover:bg-bg-tertiary",
        "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
        className ?? "",
      ].join(" ")}
      aria-label={copied ? "Copied!" : "Copy code"}
      aria-live="polite"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}
