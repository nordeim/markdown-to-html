import type { TagRegistry } from "./tag";
import type { TemplateName } from "./template";

export interface MarkdownToWebConfig {
  /** Path to the markdown file (relative to project root) */
  markdown: string;
  /** Template name; defaults to "editorial" */
  template?: TemplateName;
  /** Tag registry override; defaults to template's defaultTags */
  tags?: TagRegistry;
  /** TOC maximum depth; defaults to template's tocMaxDepth */
  tocMaxDepth?: 2 | 3 | 4;
  /** Inline fonts as base64 for offline use; defaults to template's offlineFonts */
  offlineFonts?: boolean;
  /** Enable rehype-highlight for code blocks; defaults to false */
  syntaxHighlighting?: boolean;
  /** Error reporting endpoint (optional); if unset, errors are logged but not sent */
  errorReportingEndpoint?: string;
}
