import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Badge } from "@/components/Badge";
import { CopyButton } from "@/components/CopyButton";
import { resolveBadge } from "@/lib/tags";
import type { TagRegistry } from "@/types/tag";
import { TEMPLATE_COMPONENTS } from "@/templates/active";

interface Props {
  markdown: string;
  registry: TagRegistry;
}

export function MarkdownRenderer({ markdown, registry }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSlug]}
      components={{
        h1: ({ id, children }: ComponentPropsWithoutRef<"h1">) => (
          <h1 id={id} className="mb-4 text-3xl font-bold tracking-tight text-text sm:text-4xl">
            {children}
          </h1>
        ),
        h2: TEMPLATE_COMPONENTS.h2,
        h3: TEMPLATE_COMPONENTS.h3,
        h4: TEMPLATE_COMPONENTS.h4,
        p: ({ children }: ComponentPropsWithoutRef<"p">) => (
          <p className="my-4 leading-7 text-text-secondary">{children}</p>
        ),
        a: TEMPLATE_COMPONENTS.a,
        code: ({ className, children }: ComponentPropsWithoutRef<"code">) => {
          const text = typeof children === "string" ? children : "";
          // Block code (has className or multiline)
          if (Boolean(className) || text.includes("\n")) {
            return <code className={className}>{children}</code>;
          }
          // Inline code — check if it's a badge
          const badge = resolveBadge(registry, text);
          return badge ? (
            <Badge tag={badge.tag} value={badge.label} accent={badge.accent} />
          ) : (
            <code className="rounded bg-bg-tertiary px-1.5 py-0.5 font-mono text-[0.85em] text-text">
              {children}
            </code>
          );
        },
        pre: ({ children }: ComponentPropsWithoutRef<"pre">) => (
          <CodeBlockWrapper>{children}</CodeBlockWrapper>
        ),
        blockquote: ({ children }: ComponentPropsWithoutRef<"blockquote">) => (
          <blockquote className="my-4 border-l-4 border-accent bg-accent-bg pl-4 py-2 text-text-secondary">
            {children}
          </blockquote>
        ),
        table: ({ children }: ComponentPropsWithoutRef<"table">) => (
          <div className="my-6 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }: ComponentPropsWithoutRef<"thead">) => (
          <thead className="border-b border-border bg-bg-secondary font-semibold text-text">
            {children}
          </thead>
        ),
        tbody: ({ children }: ComponentPropsWithoutRef<"tbody">) => (
          <tbody className="divide-y divide-border">{children}</tbody>
        ),
        th: ({ children }: ComponentPropsWithoutRef<"th">) => (
          <th className="px-4 py-3 font-semibold">{children}</th>
        ),
        td: ({ children }: ComponentPropsWithoutRef<"td">) => (
          <td className="px-4 py-3 text-text-secondary">{children}</td>
        ),
        hr: () => <hr className="my-8 border-border" />,
        ul: ({ children }: ComponentPropsWithoutRef<"ul">) => (
          <ul className="my-4 list-disc pl-6 text-text-secondary">{children}</ul>
        ),
        ol: ({ children }: ComponentPropsWithoutRef<"ol">) => (
          <ol className="my-4 list-decimal pl-6 text-text-secondary">{children}</ol>
        ),
        li: ({ children }: ComponentPropsWithoutRef<"li">) => <li className="my-1">{children}</li>,
        img: ({ src, alt, ...rest }: ComponentPropsWithoutRef<"img">) => (
          <img
            src={src}
            alt={alt ?? ""}
            loading="lazy"
            decoding="async"
            className="my-4 max-w-full h-auto rounded-lg border border-border"
            {...rest}
          />
        ),
        input: ({ type, checked, ...rest }: ComponentPropsWithoutRef<"input">) => {
          if (type === "checkbox") {
            return (
              <input
                type="checkbox"
                checked={checked}
                disabled
                readOnly
                aria-label="Task list item"
                className="mr-2 h-4 w-4 rounded border-border align-middle accent-accent disabled:opacity-70"
                {...rest}
              />
            );
          }
          return <input type={type} className="rounded border-border" {...rest} />;
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}

/**
 * Wraps a `<pre>` element with a relative container holding a copy button.
 *
 * The `<pre>` keeps its original styling (overflow-x-auto, bg-bg-secondary,
 * etc.). The copy button is positioned at the top-right corner of the
 * wrapper and extracts the text content of the `<code>` child on click.
 *
 * The wrapper is a function component (not an inline arrow inside the
 * components map) so that React's reconciler treats it as a stable element
 * type, avoiding unnecessary remounts when the markdown re-renders.
 */
function CodeBlockWrapper({ children }: { children: ReactNode }) {
  const getText = () => {
    if (typeof children === "string") return children;
    // children is the <code> element; extract its text content via a ref-less
    // approach using the DOM after render. We use a callback ref to read the
    // text content on demand.
    return codeTextRef.current ?? "";
  };

  const codeTextRef: { current: string } = { current: "" };

  const captureText = (node: HTMLPreElement | null) => {
    if (node) {
      codeTextRef.current = node.textContent ?? "";
    }
  };

  return (
    <div className="relative my-4">
      <div className="absolute right-2 top-2 z-10">
        <CopyButton getText={getText} />
      </div>
      <pre
        ref={captureText}
        className="overflow-x-auto rounded-lg border border-border bg-bg-secondary p-4 font-mono text-sm text-text"
      >
        {children}
      </pre>
    </div>
  );
}
