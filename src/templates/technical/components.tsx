import type { ComponentsMap } from "@/types/template";

/** Technical template component overrides — merges with the default map. */
export const technicalComponents: Partial<ComponentsMap> = {
  h2: ({ id, children }) => (
    <h2
      id={id}
      className="mt-12 scroll-mt-24 border-b border-border pb-2 text-2xl font-semibold tracking-tight text-text"
    >
      {children}
    </h2>
  ),
  h3: ({ id, children }) => (
    <h3 id={id} className="mt-8 scroll-mt-24 text-xl font-semibold text-text">
      {children}
    </h3>
  ),
  h4: ({ id, children }) => (
    <h4 id={id} className="mt-6 scroll-mt-24 text-lg font-semibold text-text-secondary">
      {children}
    </h4>
  ),
  a: ({ href, children }) => {
    const external = href?.startsWith("http");
    return (
      <a
        href={href}
        className="text-accent underline decoration-accent-ring hover:decoration-accent"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },
};
