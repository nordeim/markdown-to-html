import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileNav } from "@/components/MobileNav";
import type { TocItem } from "@/types/toc";

const toc: TocItem[] = [
  {
    level: 2,
    text: "First Section",
    slug: "first-section",
    children: [
      {
        level: 3,
        text: "Subsection",
        slug: "subsection",
        children: [],
      },
    ],
  },
  {
    level: 2,
    text: "Second Section",
    slug: "second-section",
    children: [],
  },
];

describe("MobileNav", () => {
  beforeEach(() => {
    // jsdom doesn't implement matchMedia — provide a stub.
    if (!window.matchMedia) {
      window.matchMedia = ((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      })) as unknown as typeof matchMedia;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a hamburger menu button", () => {
    render(<MobileNav toc={toc} />);
    const button = screen.getByRole("button", { name: /open table of contents/i });
    expect(button).toBeInTheDocument();
  });

  it("does not show the drawer by default", () => {
    render(<MobileNav toc={toc} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the drawer when the menu button is clicked", () => {
    render(<MobileNav toc={toc} />);
    fireEvent.click(screen.getByRole("button", { name: /open table of contents/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("the dialog has an accessible label", () => {
    render(<MobileNav toc={toc} />);
    fireEvent.click(screen.getByRole("button", { name: /open table of contents/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-label");
  });

  it("renders a close button inside the drawer", () => {
    render(<MobileNav toc={toc} />);
    fireEvent.click(screen.getByRole("button", { name: /open table of contents/i }));
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("closes the drawer when the close button is clicked", () => {
    render(<MobileNav toc={toc} />);
    fireEvent.click(screen.getByRole("button", { name: /open table of contents/i }));
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the drawer when a TOC link is clicked", () => {
    render(<MobileNav toc={toc} />);
    fireEvent.click(screen.getByRole("button", { name: /open table of contents/i }));
    const link = screen.getByRole("link", { name: "First Section" });
    fireEvent.click(link);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the drawer when the Escape key is pressed", () => {
    render(<MobileNav toc={toc} />);
    fireEvent.click(screen.getByRole("button", { name: /open table of contents/i }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders all top-level TOC entries as links", () => {
    render(<MobileNav toc={toc} />);
    fireEvent.click(screen.getByRole("button", { name: /open table of contents/i }));
    expect(screen.getByRole("link", { name: "First Section" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Second Section" })).toBeInTheDocument();
  });
});
