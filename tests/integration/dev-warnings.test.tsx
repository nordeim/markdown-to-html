import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { App } from "@/App";

// Mock the markdown import to use a document with an unknown badge value
// ("catastrophic" is not in the technical template's tags.json — only
// "stable", "experimental", "deprecated", "removed", "public", "internal",
// "restricted" are registered).
vi.mock("@/content/document.md?raw", () => ({
  default: "---\ntitle: Test Document\n---\n\n## Heading\n\n- **Status:** catastrophic\n",
  __esModule: true,
}));

describe("App dev-mode enhance warnings", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("surfaces enhance warnings via console.warn when an unknown badge value is encountered", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(<App />);

    // The App should call console.warn at least once with the warning text.
    expect(warnSpy).toHaveBeenCalled();
    const allCalls = warnSpy.mock.calls.flat().map(String).join(" ");
    expect(allCalls).toContain("catastrophic");
  });
});
