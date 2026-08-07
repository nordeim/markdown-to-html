import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { ErrorInfo, ReactElement } from "react";

function Thrower({ message }: { message: string }): ReactElement {
  throw new Error(message);
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <span data-testid="child">Hello</span>
      </ErrorBoundary>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders default ErrorFallback when an error is thrown", () => {
    // Suppress the expected console.error from React's error logging
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      render(
        <ErrorBoundary>
          <Thrower message="boom" />
        </ErrorBoundary>,
      );
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/couldn't be rendered/i)).toBeInTheDocument();
    } finally {
      spy.mockRestore();
    }
  });

  it("passes the real errorInfo (with componentStack) to a function fallback", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const fallback = vi.fn((_error: Error, _info: ErrorInfo): ReactElement => (
        <div data-testid="custom-fallback">Custom</div>
      ));
      render(
        <ErrorBoundary fallback={fallback}>
          <Thrower message="boom" />
        </ErrorBoundary>,
      );

      expect(fallback).toHaveBeenCalled();
      const firstCall = fallback.mock.calls[0];
      expect(firstCall).toBeDefined();
      const error = firstCall?.[0];
      const info = firstCall?.[1];
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe("boom");
      expect(info).toBeDefined();
      expect(typeof info?.componentStack).toBe("string");
    } finally {
      spy.mockRestore();
    }
  });

  it("calls onError with the error and errorInfo", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const onError = vi.fn();
      render(
        <ErrorBoundary onError={onError}>
          <Thrower message="boom" />
        </ErrorBoundary>,
      );
      expect(onError).toHaveBeenCalled();
      const firstCall = onError.mock.calls[0];
      expect(firstCall).toBeDefined();
      const error = firstCall?.[0] as Error | undefined;
      const info = firstCall?.[1] as ErrorInfo | undefined;
      expect(error).toBeInstanceOf(Error);
      expect(info).toBeDefined();
      expect(typeof info?.componentStack).toBe("string");
    } finally {
      spy.mockRestore();
    }
  });
});
