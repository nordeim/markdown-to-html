import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CopyButton } from "@/components/CopyButton";

describe("CopyButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a button with an accessible label", () => {
    render(<CopyButton getText={() => "code"} />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label");
    expect(button.getAttribute("aria-label")).toMatch(/copy/i);
  });

  it("calls getText and navigator.clipboard.writeText when clicked", async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: { writeText: writeTextSpy },
    });

    const getText = vi.fn(() => "const x = 1;");
    render(<CopyButton getText={getText} />);

    fireEvent.click(screen.getByRole("button"));

    expect(getText).toHaveBeenCalled();
    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalledWith("const x = 1;");
    });
  });

  it("shows a 'Copied' state after successful copy", async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: { writeText: writeTextSpy },
    });

    render(<CopyButton getText={() => "code"} />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("button").getAttribute("aria-label")).toMatch(/copied/i);
    });
  });

  it("falls back to execCommand when clipboard API is not available", async () => {
    // Remove clipboard API entirely
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });

    const execCommandSpy = vi.fn().mockReturnValue(true);
    document.execCommand = execCommandSpy;

    render(<CopyButton getText={() => "code"} />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(execCommandSpy).toHaveBeenCalledWith("copy");
    });
  });
});
