export interface Frontmatter {
  title?: string;
  subtitle?: string;
  author?: string;
  date?: string;
  template?: string;
  [key: string]: string | boolean | undefined;
}

export interface ParsedDocument {
  frontmatter: Frontmatter;
  /** Markdown body with the frontmatter block removed — this is what renders. */
  body: string;
}
