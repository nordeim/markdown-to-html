import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { enhanceMarkdown } from "@/lib/enhance";
import type { TagRegistry } from "@/types/tag";

const registry: TagRegistry = {
  Severity: {
    name: "Severity",
    values: {
      critical: { accent: 1 },
    },
  },
};

describe("MarkdownRenderer code component", () => {
  it("renders inline code without a badge value as <code>", () => {
    render(<MarkdownRenderer markdown="`plain code`" registry={registry} />);
    const code = screen.getByText("plain code");
    expect(code.tagName).toBe("CODE");
    // Inline code (non-badge) gets the styled background class
    expect(code.className).toContain("bg-bg-tertiary");
  });

  it("renders inline code with a registered badge value as <Badge>", () => {
    const { enhanced } = enhanceMarkdown("- **Severity:** critical", registry);
    render(<MarkdownRenderer markdown={enhanced} registry={registry} />);
    expect(screen.getByLabelText("Severity: Critical")).toBeInTheDocument();
  });

  it("does NOT render block code as a Badge even if the content matches a badge value", () => {
    // Fenced code block whose content is exactly "critical" (a registered value)
    const md = "```\ncritical\n```";
    render(<MarkdownRenderer markdown={md} registry={registry} />);
    // Should render as a <code> element inside <pre>, NOT as a Badge
    expect(screen.queryByLabelText("Severity: Critical")).not.toBeInTheDocument();
    expect(screen.getByText("critical")).toBeInTheDocument();
  });

  it("renders block code with a language class inside <pre>", () => {
    const md = "```ts\nconst x = 1;\n```";
    const { container } = render(<MarkdownRenderer markdown={md} registry={registry} />);
    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    const code = pre?.querySelector("code");
    expect(code).not.toBeNull();
    expect(code?.className).toContain("language-ts");
  });

  it("renders multiline block code without badge resolution", () => {
    const md = "```\nline one\nline two\n```";
    render(<MarkdownRenderer markdown={md} registry={registry} />);
    expect(screen.queryByLabelText(/Severity/)).not.toBeInTheDocument();
  });
});
