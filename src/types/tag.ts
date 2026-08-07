export interface TagValueDefinition {
  /** Accent step 1–5, mapped to --color-accent-1 through --color-accent-5 in @theme. */
  accent: 1 | 2 | 3 | 4 | 5;
  /** Optional label override; defaults to the value, capitalized. */
  label?: string;
}

export interface TagDefinition {
  /** The tag name as it appears in markdown, e.g. "Severity", "Status". Case-sensitive. */
  name: string;
  /** The allowed values, each mapped to an accent step. Keys MUST be lowercase. */
  values: Record<string, TagValueDefinition>;
}

export type TagRegistry = Record<string, TagDefinition>;

/** Returned by resolveBadge() — the resolved badge to render. */
export interface ResolvedBadge {
  tag: string;
  value: string;
  label: string;
  accent: 1 | 2 | 3 | 4 | 5;
}
