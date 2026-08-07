import { cn } from "@/utils/cn";

const ACCENT_STYLES: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "bg-accent-1-bg ring-accent-1/30 text-accent-1",
  2: "bg-accent-2-bg ring-accent-2/30 text-accent-2",
  3: "bg-accent-3-bg ring-accent-3/30 text-accent-3",
  4: "bg-accent-4-bg ring-accent-4/30 text-accent-4",
  5: "bg-accent-5-bg ring-accent-5/30 text-accent-5",
};

interface BadgeProps {
  tag: string;
  value: string;
  accent: 1 | 2 | 3 | 4 | 5;
}

export function Badge({ tag, value, accent }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5",
        "text-xs font-semibold uppercase tracking-wide",
        "ring-1 ring-inset",
        ACCENT_STYLES[accent],
      )}
      data-tag={tag}
      aria-label={`${tag}: ${value}`}
    >
      {value}
    </span>
  );
}
