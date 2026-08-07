import type { ReactNode, FC, ComponentPropsWithoutRef } from "react";
import type { TagRegistry } from "./tag";
import type { TocItem } from "./toc";

export type TemplateName = "editorial" | "technical" | "minimal";

export interface TemplateLayoutProps {
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  readingTime?: string;
  toc: TocItem[];
  activeSlug?: string;
  /** The enhanced markdown string. Provided for templates that want to
   * render it themselves (e.g., via a custom renderer). Most templates use
   * `children` instead, which is the already-rendered React element tree. */
  markdown?: string;
  children: ReactNode;
}

export type ComponentsMap = {
  h1: FC<ComponentPropsWithoutRef<"h1">>;
  h2: FC<ComponentPropsWithoutRef<"h2">>;
  h3: FC<ComponentPropsWithoutRef<"h3">>;
  h4: FC<ComponentPropsWithoutRef<"h4">>;
  p: FC<ComponentPropsWithoutRef<"p">>;
  a: FC<ComponentPropsWithoutRef<"a">>;
  strong: FC<ComponentPropsWithoutRef<"strong">>;
  em: FC<ComponentPropsWithoutRef<"em">>;
  ul: FC<ComponentPropsWithoutRef<"ul">>;
  ol: FC<ComponentPropsWithoutRef<"ol">>;
  li: FC<ComponentPropsWithoutRef<"li">>;
  hr: FC<ComponentPropsWithoutRef<"hr">>;
  blockquote: FC<ComponentPropsWithoutRef<"blockquote">>;
  code: FC<ComponentPropsWithoutRef<"code">>;
  pre: FC<ComponentPropsWithoutRef<"pre">>;
  table: FC<ComponentPropsWithoutRef<"table">>;
  thead: FC<ComponentPropsWithoutRef<"thead">>;
  tbody: FC<ComponentPropsWithoutRef<"tbody">>;
  tr: FC<ComponentPropsWithoutRef<"tr">>;
  th: FC<ComponentPropsWithoutRef<"th">>;
  td: FC<ComponentPropsWithoutRef<"td">>;
};

export interface TemplateConfig {
  name: TemplateName;
  themeCss: string;
  components: Partial<ComponentsMap>;
  layout: FC<TemplateLayoutProps>;
  defaultTags: TagRegistry;
  tocMaxDepth: 2 | 3 | 4;
  offlineFonts: boolean;
}
