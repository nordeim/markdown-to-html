import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import type { TagRegistry } from "@/types/tag";

const registry: TagRegistry = {};

describe("MarkdownRenderer image component", () => {
  it("renders an image with the given alt text", () => {
    render(
      <MarkdownRenderer markdown="![Alt text](https://example.com/x.png)" registry={registry} />,
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", "Alt text");
    expect(img).toHaveAttribute("src", "https://example.com/x.png");
  });

  it("renders an image with loading=lazy", () => {
    render(<MarkdownRenderer markdown="![Alt](https://example.com/x.png)" registry={registry} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("renders an image with decoding=async", () => {
    render(<MarkdownRenderer markdown="![Alt](https://example.com/x.png)" registry={registry} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("decoding", "async");
  });

  it("renders an image with empty alt text", () => {
    const { container } = render(
      <MarkdownRenderer markdown="![](https://example.com/x.png)" registry={registry} />,
    );
    // Images with empty alt are presentation-role, so query by tag instead of role
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("alt", "");
  });

  it("renders an image with responsive max-width class", () => {
    render(<MarkdownRenderer markdown="![Alt](https://example.com/x.png)" registry={registry} />);
    const img = screen.getByRole("img");
    expect(img.className).toContain("max-w-full");
  });
});
