import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { BackToTop } from "@/components/BackToTop";

describe("BackToTop", () => {
  let originalScrollY: number;
  let scrollListeners: EventListener[];

  beforeEach(() => {
    originalScrollY = window.scrollY;
    scrollListeners = [];

    // jsdom doesn't implement scrollY or scroll event effects — mock them.
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 0,
    });

    vi.spyOn(window, "addEventListener").mockImplementation((type, listener) => {
      if (type === "scroll") {
        scrollListeners.push(listener as EventListener);
      }
      return;
    });

    vi.spyOn(window, "removeEventListener").mockImplementation((type, listener) => {
      if (type === "scroll") {
        scrollListeners = scrollListeners.filter((l) => l !== listener);
      }
      return;
    });

    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: originalScrollY,
    });
    vi.restoreAllMocks();
  });

  function emitScroll(scrollY: number): void {
    (window as unknown as { scrollY: number }).scrollY = scrollY;
    for (const listener of scrollListeners) {
      listener(new Event("scroll"));
    }
  }

  it("is not visible on initial render (scrollY = 0)", () => {
    render(<BackToTop />);
    // Button exists in DOM but is aria-hidden (not in a11y tree).
    const button = document.querySelector('button[aria-label="Back to top"]');
    expect(button).not.toBeNull();
    expect(button?.getAttribute("aria-hidden")).toBe("true");
  });

  it("becomes visible after scrolling past one viewport", () => {
    // Mock window.innerHeight to 800
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 800,
    });

    render(<BackToTop />);

    // Scroll past one viewport
    act(() => {
      emitScroll(900);
    });

    const button = document.querySelector('button[aria-label="Back to top"]');
    expect(button).not.toBeNull();
    expect(button?.getAttribute("aria-hidden")).toBe("false");
  });

  it("becomes hidden again when scrolled back to top", () => {
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 800,
    });

    render(<BackToTop />);

    act(() => emitScroll(900));
    act(() => emitScroll(0));

    const button = document.querySelector('button[aria-label="Back to top"]');
    expect(button?.getAttribute("aria-hidden")).toBe("true");
  });

  it("calls window.scrollTo({ top: 0 }) when clicked", () => {
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 800,
    });

    render(<BackToTop />);
    act(() => emitScroll(900));

    const button = document.querySelector('button[aria-label="Back to top"]') as HTMLButtonElement;
    fireEvent.click(button);

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("has an accessible label", () => {
    render(<BackToTop />);
    const button = document.querySelector('button[aria-label="Back to top"]');
    expect(button).not.toBeNull();
    expect(button).toHaveAttribute("aria-label", "Back to top");
  });
});
