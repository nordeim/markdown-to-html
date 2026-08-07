import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "@/components/ThemeToggle";

describe("ThemeToggle", () => {
  let matchMediaSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    // Clear localStorage so the storage-read effect doesn't pick up a previous
    // test's persisted theme — that would change the initial state.
    localStorage.clear();

    // Mock matchMedia with controllable matches value + listener registry.
    let currentMatches = false;
    const listeners = new Set<(e: { matches: boolean }) => void>();
    matchMediaSpy = vi.fn().mockImplementation((query: string) => ({
      matches: currentMatches,
      media: query,
      onchange: null,
      addEventListener: (_event: string, listener: (e: { matches: boolean }) => void) => {
        listeners.add(listener);
      },
      removeEventListener: (_event: string, listener: (e: { matches: boolean }) => void) => {
        listeners.delete(listener);
      },
      addListener: (listener: (e: { matches: boolean }) => void) => listeners.add(listener),
      removeListener: (listener: (e: { matches: boolean }) => void) => listeners.delete(listener),
      dispatchEvent: () => false,
    }));
    globalThis.matchMedia = matchMediaSpy as unknown as typeof matchMedia;

    // Helper attached to the spy to simulate OS theme change events.
    (globalThis.matchMedia as unknown as { __emit: (matches: boolean) => void }).__emit = (
      matches: boolean,
    ) => {
      currentMatches = matches;
      for (const listener of listeners) listener({ matches });
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a button with an accessible label containing the current theme", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label");
    expect(button.getAttribute("aria-label")).toMatch(/theme/i);
  });

  it("renders an SVG icon (not an emoji)", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    const svg = button.querySelector("svg");
    expect(svg).not.toBeNull();
    // No emoji characters in the button text content
    expect(button.textContent).not.toMatch(/[\u2600\u{1F319}\u{1F4BB}]/u);
  });

  it("cycles through light → dark → system → light on click", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    // Initial: system
    expect(button.getAttribute("aria-label")).toContain("system");

    fireEvent.click(button);
    expect(button.getAttribute("aria-label")).toContain("light");

    fireEvent.click(button);
    expect(button.getAttribute("aria-label")).toContain("dark");

    fireEvent.click(button);
    expect(button.getAttribute("aria-label")).toContain("system");
  });

  it("sets data-theme=dark when theme is dark", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    // system → light → dark
    fireEvent.click(button);
    fireEvent.click(button);

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("sets data-theme=light when theme is light", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    // system → light
    fireEvent.click(button);

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("removes data-theme when theme is system and OS prefers light", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    // cycle to light then back to system
    fireEvent.click(button); // → light
    fireEvent.click(button); // → dark
    fireEvent.click(button); // → system

    // OS prefers light (currentMatches = false), so attribute should be removed
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
  });

  it("announces theme changes via aria-live region for screen readers", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    // The aria-live region should exist on initial render
    const liveRegions = document.querySelectorAll('[aria-live="polite"]');
    expect(liveRegions.length).toBeGreaterThan(0);

    fireEvent.click(button); // → light

    // The live region should now mention "light"
    const liveText = Array.from(liveRegions)
      .map((el) => el.textContent)
      .join(" ");
    expect(liveText).toMatch(/light/i);
  });

  it("calls matchMedia to subscribe to system theme changes in system mode", () => {
    render(<ThemeToggle />);

    // In system mode (default), the component should query matchMedia for
    // prefers-color-scheme: dark at least once (during applyTheme or subscribe).
    expect(matchMediaSpy).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
  });

  it("responds to system theme change events while in system mode", () => {
    render(<ThemeToggle />);

    // Verify clean state: system + OS-light → no data-theme attribute
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();

    // Simulate OS theme change to dark
    const emit = (globalThis.matchMedia as unknown as { __emit: (m: boolean) => void }).__emit;
    emit(true);

    // The data-theme attribute should now be "dark" — either via the
    // change-event listener OR via the next applyTheme call.
    // We accept either path; what matters is that the page reflects the OS.
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
