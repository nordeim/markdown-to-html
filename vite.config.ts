import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "path";
import { readFileSync } from "node:fs";

/**
 * Build-time `<title>` injection.
 *
 * Reads the markdown source, extracts the title (frontmatter `title:` or first
 * H1), and rewrites `<title>` in `index.html` so the static HTML matches the
 * document — eliminating the pre-hydration flash of the wrong title that the
 * runtime `useEffect` in App.tsx cannot prevent.
 *
 * Dev mode: runs on every server transform (cheap — the markdown is small).
 * Build mode: runs once during HTML generation.
 */
function documentTitlePlugin(): Plugin {
  const docPath = resolve(import.meta.dirname, "src", "content", "document.md");
  return {
    name: "markdown-to-web:document-title",
    transformIndexHtml(html: string) {
      let title: string | null = null;
      try {
        const md = readFileSync(docPath, "utf8");
        title = extractTitleFromMarkdown(md);
      } catch {
        // If the markdown can't be read (e.g. dev server started before the
        // file exists), leave the static title alone.
      }
      if (!title) return html;
      return html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
    },
  };
}

// Inlined minimal copy of src/lib/extract-title.ts so vite.config.ts can run
// in Node without the TS path alias resolved. The full implementation (with
// fence-aware scanning and frontmatter parsing) lives in src/lib/extract-title.ts
// and is unit-tested; this mirror is kept in sync manually.
function extractTitleFromMarkdown(markdown: string): string | null {
  if (!markdown) return null;
  // Frontmatter
  const fm = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fm) {
    for (const line of fm[1]!.split("\n")) {
      const m = line.match(/^title:\s*(.+?)\s*$/);
      if (m) {
        return m[1]!.replace(/^["']|["']$/g, "").trim();
      }
    }
  }
  // First non-fenced H1
  const lines = markdown.split("\n");
  let inFence = false;
  for (const line of lines) {
    if (/^(```|~~~)/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^#\s+(.+?)\s*$/);
    if (m) {
      return m[1]!
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/__([^_]+)__/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/_([^_]+)_/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .trim();
    }
  }
  return null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default defineConfig({
  plugins: [react(), tailwindcss(), documentTitlePlugin(), viteSingleFile()],
  resolve: { alias: { "@": resolve(import.meta.dirname, "src") } },
  build: {
    target: "es2022",
    cssCodeSplit: false,
  },
});
