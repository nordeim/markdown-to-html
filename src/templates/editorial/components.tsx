import type { ComponentsMap } from "@/types/template";

/**
 * Editorial template component overrides — long-form reading register.
 *
 * Differs from the technical template:
 *   - Larger heading sizes (editorial favors bigger type)
 *   - No bottom border on H2 (cleaner reading flow)
 *   - Subtle decoration on H3 (italic, not uppercase)
 *   - External link indicator stays the same (the rule is universal)
 *
 * Merges with the default map in MarkdownRenderer.tsx.
 */
export const editorialComponents: Partial<ComponentsMap> = {
  h2: ({ id, children }) => (
    <h2 id={id} className="mt-14 scroll-mt-24 text-3xl font-bold tracking-tight text-text">
      {children}
    </h2>
  ),
  h3: ({ id, children }) => (
    <h3 id={id} className="mt-10 scroll-mt-24 text-2xl font-semibold italic text-text">
      {children}
    </h3>
  ),
  h4: ({ id, children }) => (
    <h4 id={id} className="mt-8 scroll-mt-24 text-xl font-semibold text-text-secondary">
      {children}
    </h4>
  ),
  a: ({ href, children }) => {
    const external = href?.startsWith("http");
    return (
      <a
        href={href}
        className="text-accent underline decoration-accent-ring decoration-1 underline-offset-2 hover:decoration-accent"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },
};
