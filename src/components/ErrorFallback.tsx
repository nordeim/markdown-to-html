export function ErrorFallback({ error }: { error: Error | null }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mx-auto my-16 max-w-xl rounded-lg border border-border bg-bg-secondary p-6"
    >
      <h2 className="text-xl font-semibold text-text">
        This document couldn't be rendered
      </h2>
      <p className="mt-2 text-sm text-text-secondary">
        The content failed to render. Try reloading; if the problem persists, the
        markdown source may be malformed.
      </p>
      {import.meta.env.DEV && error && (
        <pre className="mt-4 overflow-auto rounded bg-text p-3 text-xs text-bg whitespace-pre-wrap">
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
      )}
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-4 min-h-11 min-w-11 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white"
      >
        Reload page
      </button>
    </div>
  );
}
