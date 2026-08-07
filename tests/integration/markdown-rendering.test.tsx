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
      high: { accent: 2 },
    },
  },
  Confidence: {
    name: "Confidence",
    values: { verified: { accent: 1 } },
  },
};

describe("MarkdownRenderer integration", () => {
  it("renders markdown with badges (after enhance pipeline)", () => {
    // Simulate the real pipeline: enhanceMarkdown runs first (in App.tsx),
    // then the enhanced markdown is passed to MarkdownRenderer.
    const raw = `
## Security Finding

This is a critical issue.

- **Severity:** critical
- **Confidence:** verified
    `;

    const { enhanced } = enhanceMarkdown(raw, registry);
    render(<MarkdownRenderer markdown={enhanced} registry={registry} />);

    expect(screen.getByRole("heading", { level: 2, name: "Security Finding" }))
      .toBeInTheDocument();

    expect(screen.getByLabelText("Severity: Critical")).toBeInTheDocument();
    expect(screen.getByLabelText("Confidence: Verified")).toBeInTheDocument();
  });

  it("renders external links with target=_blank", () => {
    const md = "[Example](https://example.com)";
    render(<MarkdownRenderer markdown={md} registry={registry} />);
    const link = screen.getByRole("link", { name: "Example" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders tables with GFM", () => {
    const md = `
| Col1 | Col2 |
|------|------|
| A    | B    |
    `;
    render(<MarkdownRenderer markdown={md} registry={registry} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Col1" })).toBeInTheDocument();
  });

  it("handles malformed markdown without crashing", () => {
    const md = "## Valid\n\n```\nUnclosed code block";
    render(<MarkdownRenderer markdown={md} registry={registry} />);
    expect(screen.getByRole("heading", { level: 2, name: "Valid" }))
      .toBeInTheDocument();
  });
});
