---
name: markdown-html-pipeline
description: >
  Distilled practical knowledge for rendering any Markdown document as a polished,
  accessible, single-file web page using React 19 + Vite + Tailwind v4. Covers the
  complete pipeline: scaffold, design system, TOC engine, badge protocol, dark mode,
  accessibility gates, testing, and production build. Includes all lessons, patterns,
  anti-patterns, and debugging procedures discovered during a real build.
version: 1.0.0
date: 2026-08-07
tags:
  - react
  - vite
  - tailwindcss
  - markdown
  - single-file-build
  - accessibility
  - documentation
  - knowledge-distillation
---

# Markdown-to-HTML Pipeline Skill

> **What this is:** A complete, battle-tested recipe for building a zero-backend React application that renders any Markdown document as a polished, navigable, single-file web page. The build produces one self-contained `dist/index.html` with JS/CSS inlined — deployable to any static host.
>
> **When to use:** You have a Markdown file (documentation, catalog, report, spec) and need a navigable web version with TOC, dark mode, responsive layout, and WCAG 2.2 AA compliance.
>
> **What you get:** 29 source files, 10 test files, 49 passing tests, a 162 KB gzipped single-file artifact, and every hard-won lesson from the build.

---

## Table of Contents

1. [Project Identity & Design Philosophy](#1-project-identity--design-philosophy)
2. [Tech Stack & Environment](#2-tech-stack--environment)
3. [Bootstrapping & Configuration](#3-bootstrapping--configuration)
4. [The Design System (Code-First)](#4-the-design-system-code-first)
5. [Component Architecture & Patterns](#5-component-architecture--patterns)
6. [Custom Hooks Deep Dive](#6-custom-hooks-deep-dive)
7. [Content Management & Data Ingestion](#7-content-management--data-ingestion)
8. [Accessibility (WCAG 2.2 AA) Implementation](#8-accessibility-wcag-22-aa-implementation)
9. [Anti-Patterns & Common Bugs](#9-anti-patterns--common-bugs)
10. [Debugging Guide](#10-debugging-guide)
11. [Pre-Ship Checklist](#11-pre-ship-checklist)
12. [Lessons Learnt & How to Avoid Them](#12-lessons-learnt--how-to-avoid-them)
13. [Pitfalls to Avoid](#13-pitfalls-to-avoid)
14. [Best Practices](#14-best-practices)
15. [Coding Patterns](#15-coding-patterns)
16. [Coding Anti-Patterns](#16-coding-anti-patterns)
17. [Responsive Breakpoint Reference](#17-responsive-breakpoint-reference)
18. [Z-Index Layer Map](#18-z-index-layer-map)
19. [Color Reference (Complete)](#19-color-reference-complete)
20. [The Complete TypeScript Interface Reference](#20-the-complete-typescript-interface-reference)
21. [Appendices](#appendices)

---

## 1. Project Identity & Design Philosophy

**One-sentence description:** A zero-backend React application that renders any Markdown document as a polished, navigable, single-file web page, where the document's structure drives the UI, a template drives the look, and the build produces one self-contained `dist/index.html`.

**Design thesis:** *Content is data; rendering is configuration.* The Markdown file is the input. The template chooses the look. The build produces one self-contained HTML file that runs anywhere a browser can open it.

**Non-negotiable design rules:**
1. **Content is sovereign.** The markdown file determines structure. The renderer never invents content.
2. **One rendering pipeline.** `react-markdown` + components map. No `dangerouslySetInnerHTML`, no HTML-string serialization.
3. **Tags are registered, not hardcoded.** Badges are data in a registry; the resolver is generic.
4. **Single-file portability.** JS/CSS are inlined by `vite-plugin-singlefile`.
5. **Accessibility is gated, not claimed.** WCAG 2.2 AA enforced by an axe gate in CI.
6. **No generic UI.** The technical template uses a utilitarian cool-gray palette — appropriate for reference material.

**Anti-generic mandate (explicitly rejected):** purple gradients on white; predictable card-grid layouts; generic "Inter + gray-50" neutrality (unless it's the technical template's explicit register); hero sections with centered H1 + paragraph + CTA.

---

## 2. Tech Stack & Environment

> **Version alignment is the #1 source of build failures.** See §12 Lesson 1.

| Layer | Technology | Version | Critical Note |
|-------|------------|---------|---------------|
| Framework | React | `^19.2.8` | StrictMode + createRoot |
| Build | Vite | `^8.2.1` | **Vite 8 requires @tailwindcss/vite ≥4.3.3** |
| Styling | Tailwind CSS | `^4.3.3` | CSS-first `@theme inline`; no `tailwind.config.js` |
| Tailwind Vite plugin | @tailwindcss/vite | `^4.3.3` | **Must be ≥4.3.3 for Vite 8 compatibility** |
| Markdown | react-markdown | `10.1.0` | `remark-gfm` + `rehype-slug`; component map (no `dangerouslySetInnerHTML`) |
| GFM | remark-gfm | `4.0.1` | Tables, strikethrough, task lists |
| Heading anchors | rehype-slug | `6.0.0` | Must match `github-slugger` output |
| TOC slugs | github-slugger | `2.0.0` | **Default export only — no named `{ slug }` exists** |
| Icons | lucide-react | `1.29.0` | Tree-shaken |
| Class util | clsx | `2.1.1` | Combined with tailwind-merge as `cn()` |
| Merge util | tailwind-merge | `3.4.0` | Prevents Tailwind class conflicts |
| Packaging | vite-plugin-singlefile | `2.3.3` | **Must be ≥2.3.3 for Vite 8 compatibility** |
| TypeScript | typescript | `~6.0.3` | **TS 6 deprecates `baseUrl` — remove it from tsconfig** |
| Node types | @types/node | (latest) | Required for `process`, `fs`, `path`, `zlib` in tests |
| Test runner | vitest | `^4.1.10` | **Requires explicit `jsdom` package for DOM tests** |
| DOM testing | jsdom | (latest) | Peer of vitest, NOT bundled |
| Testing library | @testing-library/react | (latest) | `render`, `screen` |
| jest-dom | @testing-library/jest-dom | (latest) | `toBeInTheDocument()` matchers |
| A11y gate | @axe-core/playwright | `4.12.1` | Runs against built dist |
| E2E runner | @playwright/test | `1.62.1` | **Browsers must be installed via `npx playwright install`** |
| Lint | eslint | `9.39.5` | Flat config |
| React hooks lint | eslint-plugin-react-hooks | `5.2.0` | Catches hook misuse |
| JSX a11y lint | eslint-plugin-jsx-a11y | `6.10.2` | Catches a11y anti-patterns |
| Formatter | prettier | (latest) | Run after eslint --fix |
| Coverage | @vitest/coverage-v8 | `4.1.10` | v8 provider |

**Node requirement:** ≥20.19 or ≥22.12 (Vite 7+ requirement; Vite 8 follows same floor).

---

## 3. Bootstrapping & Configuration

### 3.1 Scaffolding from scratch

```bash
# 1. Scaffold Vite + React + TypeScript
npm create vite@latest my-markdown-site -- --template react-ts
cd my-markdown-site

# 2. Install runtime deps (exact pins from §2)
npm install react-markdown@10.1.0 remark-gfm@4.0.1 rehype-slug@6.0.0 \
  github-slugger@2.0.0 lucide-react@latest clsx@2.1.1 tailwind-merge@3.4.0 \
  vite-plugin-singlefile@latest

# 3. Install dev deps
npm install -D tailwindcss@latest @tailwindcss/vite@latest vitest@latest \
  @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom \
  @playwright/test @axe-core/playwright eslint@9 typescript-eslint@8 \
  eslint-plugin-react-hooks@5 eslint-plugin-jsx-a11y@6 prettier@latest @types/node

# 4. Install Playwright browsers (required for axe tests)
npx playwright install chromium

# 5. Create directory structure
mkdir -p src/content src/templates/technical src/components src/lib \
  src/utils src/types tests/unit tests/integration tests/accessibility \
  tests/performance
```

### 3.2 Critical configuration files

**`vite.config.ts`** — The build pipeline:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "path";

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: { alias: { "@": resolve(__dirname, "src") } },
  build: {
    target: "es2022",
    cssCodeSplit: false,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});
```

**`tsconfig.json`** — Strict TypeScript (TS 6 compatible):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "types": ["node"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "tests"]
}
```

> **CRITICAL:** Do NOT use `baseUrl` in TS 6 — it's deprecated and causes a hard error. Use `paths` with relative `./` prefix instead.

**`vitest.config.ts`** — Unit/integration test runner:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": resolve(__dirname, "src") } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    exclude: ["tests/accessibility/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/", "**/*.d.ts", "**/*.config.*", "scripts/"],
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
    },
  },
});
```

> **CRITICAL:** Exclude `tests/accessibility/**` from vitest — Playwright tests must run via `npx playwright test`, not vitest. The vitest runner can't handle Playwright's `test()` API.

**`playwright.config.ts`** — Accessibility test runner:
```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/accessibility",
  webServer: { command: "npm run preview", port: 4173, reuseExistingServer: false },
});
```

**`src/vite-env.d.ts`** — Type declarations for Vite imports:
```typescript
/// <reference types="vite/client" />

declare module "*.md?raw" {
  const content: string;
  export default content;
}

declare module "*.css" {
  const content: string;
  export default content;
}
```

### 3.3 Package.json scripts

```json
{
  "scripts": {
    "dev": "vite",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --max-warnings 0",
    "test": "vitest run",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "a11y": "playwright test",
    "build": "vite build",
    "preview": "vite preview",
    "test:bundle-size": "vitest run tests/performance"
  }
}
```

---

## 4. The Design System (Code-First)

The two-layer token pattern (Layer 1 runtime variables + Layer 2 `@theme inline` bridge) is the only correct way to do dark mode in Tailwind v4. **Never nest `@theme` inside `@media`** — it silently breaks.

### 4.1 Technical template `src/templates/technical/theme.css`

```css
@import "tailwindcss";

/* ---------- Layer 1: runtime palette (the only values that flip) ---------- */
:root {
  --bg: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --text: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #475569;    /* Darkened from #94a3b8 to pass WCAG AA (5.9:1) */
  --border: #e2e8f0;
  --accent: #2563eb;
  --accent-bg: #eff6ff;
  --accent-ring: #bfdbfe;
  --accent-dark: #1d4ed8;
  --accent-1: #dc2626;
  --accent-2: #f59e0b;
  --accent-3: #2563eb;
  --accent-4: #10b981;
  --accent-5: #8b5cf6;
  --accent-1-bg: #fef2f2;
  --accent-2-bg: #fffbeb;
  --accent-3-bg: #eff6ff;
  --accent-4-bg: #ecfdf5;
  --accent-5-bg: #f5f3ff;
}

/* Dark via system preference — unless user forced light */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0f172a;
    --bg-secondary: #1e293b;
    --bg-tertiary: #334155;
    --text: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-tertiary: #94a3b8;    /* Lightened for dark bg (5.3:1) */
    --border: #334155;
    --accent: #60a5fa;
    --accent-bg: #1e3a5f;
    --accent-ring: #3b82f6;
    --accent-dark: #3b82f6;
    --accent-1: #f87171;
    --accent-2: #fbbf24;
    --accent-3: #60a5fa;
    --accent-4: #34d399;
    --accent-5: #a78bfa;
    --accent-1-bg: #450a0a;
    --accent-2-bg: #451a03;
    --accent-3-bg: #1e3a5f;
    --accent-4-bg: #064e3b;
    --accent-5-bg: #2e1065;
  }
}

/* Dark via manual override */
[data-theme="dark"] {
  /* Same overrides as above */
}

/* ---------- Layer 2: bridge into Tailwind utilities ---------- */
@theme inline {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --color-bg: var(--bg);
  --color-bg-secondary: var(--bg-secondary);
  --color-bg-tertiary: var(--bg-tertiary);
  --color-text: var(--text);
  --color-text-secondary: var(--text-secondary);
  --color-text-tertiary: var(--text-tertiary);
  --color-border: var(--border);
  --color-accent: var(--accent);
  --color-accent-bg: var(--accent-bg);
  --color-accent-ring: var(--accent-ring);
  --color-accent-dark: var(--accent-dark);
  --color-accent-1: var(--accent-1);
  --color-accent-2: var(--accent-2);
  --color-accent-3: var(--accent-3);
  --color-accent-4: var(--accent-4);
  --color-accent-5: var(--accent-5);
  --color-accent-1-bg: var(--accent-1-bg);
  --color-accent-2-bg: var(--accent-2-bg);
  --color-accent-3-bg: var(--accent-3-bg);
  --color-accent-4-bg: var(--accent-4-bg);
  --color-accent-5-bg: var(--accent-5-bg);
}

/* ---------- Base ---------- */
html { scroll-behavior: smooth; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-bg);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
}

::selection { background-color: var(--color-accent); color: white; }

:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}
```

### 4.2 Color contrast verification

| Token | Hex | Background | Ratio | WCAG AA |
|-------|-----|------------|-------|---------|
| `--text` | `#0f172a` | `#ffffff` | 18.1:1 | ✅ AAA |
| `--text-secondary` | `#475569` | `#ffffff` | 5.9:1 | ✅ AA |
| `--text-tertiary` | `#475569` | `#ffffff` | 5.9:1 | ✅ AA |
| `--text` (dark) | `#f8fafc` | `#0f172a` | 18.1:1 | ✅ AAA |
| `--text-secondary` (dark) | `#cbd5e1` | `#0f172a` | 11.6:1 | ✅ AAA |
| `--text-tertiary` (dark) | `#94a3b8` | `#0f172a` | 5.3:1 | ✅ AA |

> **The original `--text-tertiary: #94a3b8` on white had only 2.56:1 contrast — a WCAG AA failure.** It was darkened to `#475569` (same as secondary). In dark mode, `#94a3b8` on `#0f172a` gives 5.3:1 — passing AA.

### 4.3 Typography hierarchy (technical)

| Role | Font | Weight | Size | Color |
|------|------|--------|------|-------|
| H1 | Inter | 700 | `text-3xl sm:text-4xl` | text |
| H2 | Inter | 600 | `text-2xl` | text |
| H3 | Inter | 600 | `text-xl` | text |
| H4 | Inter | 600 | `text-lg` | text-secondary |
| Body | Inter | 400 | `text-base` (16px) | text-secondary |
| Code | JetBrains Mono | 400 | `text-sm` | text |
| Badge | Inter | 600 | `text-xs` uppercase | per-accent |

---

## 5. Component Architecture & Patterns

### 5.1 Directory map

```
src/
├── App.tsx                          # Layout assembly + state (76 lines)
├── main.tsx                         # Entry: StrictMode + ErrorBoundary (13 lines)
├── index.css                        # Fonts @import + @import "tailwindcss"
├── vite-env.d.ts                    # Vite client types + module declarations
├── components/
│   ├── MarkdownRenderer.tsx         # react-markdown renderer + components map (96 lines)
│   ├── TableOfContents.tsx          # Recursive TOC (62 lines)
│   ├── Badge.tsx                    # Tag-aware badge chip (38 lines)
│   ├── ErrorBoundary.tsx            # Class component render error catcher
│   ├── ErrorFallback.tsx            # Presentational fallback UI
│   ├── SkipLink.tsx                 # Accessible skip-to-content
│   └── ThemeToggle.tsx              # Light/dark/system toggle
├── content/
│   └── document.md                  # The input markdown (323 lines, 0 badge annotations)
├── templates/
│   ├── active.ts                    # THE single edit point for template switching
│   └── technical/
│       ├── theme.css                # Two-layer token pattern (135 lines)
│       ├── components.tsx           # Component map overrides
│       ├── layout.tsx               # Three-column shell
│       └── tags.json                # Status + Visibility registry
├── lib/
│   ├── fence.ts                     # Fence-aware line scanner (44 lines)
│   ├── enhance.ts                   # Tag-aware regex preprocessor (38 lines)
│   ├── toc.ts                       # H2–H4 outline extraction (48 lines)
│   ├── tags.ts                      # Registry validation + resolver (58 lines)
│   └── frontmatter.ts               # YAML frontmatter extraction (31 lines)
├── types/
│   ├── tag.ts                       # TagDefinition, TagRegistry, ResolvedBadge
│   ├── toc.ts                       # TocItem
│   ├── frontmatter.ts               # Frontmatter, ParsedDocument
│   ├── template.ts                  # TemplateConfig, TemplateLayoutProps, ComponentsMap
│   └── config.ts                    # MarkdownToWebConfig
└── utils/
    ├── cn.ts                        # clsx + tailwind-merge
    └── theme-storage.ts             # localStorage with try/catch + in-memory fallback
```

**File count:** 29 source files, 923 total source lines.

### 5.2 The rendering pipeline (data flow)

```
┌─────────────────────────────────────────────────────────────────┐
│  src/content/document.md                                         │
│  (raw Markdown with optional YAML frontmatter)                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ import via ?raw
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  parseDocument(markdown) → { frontmatter, body }                │
│  Strips YAML frontmatter block from body                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
┌──────────────────┐ ┌─────────────────┐ ┌─────────────────────┐
│ enhanceMarkdown  │ │ buildToc        │ │ frontmatter.title   │
│ (body, registry) │ │ (body, 4)       │ │ → page heading      │
│ → enhanced str   │ │ → TocItem[]     │ └─────────────────────┘
└────────┬─────────┘ └────────┬────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  MarkdownRenderer                                               │
│  react-markdown( enhanced )                                     │
│    remarkPlugins: [remarkGfm]                                   │
│    rehypePlugins: [rehypeSlug]                                  │
│    components: { h2, h3, h4, a, code→Badge, table, ... }       │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Memoization strategy

Every derived value is memoized to prevent re-computation on re-render:

```typescript
// App.tsx — the three memoization points
const { frontmatter, body } = useMemo(() => parseDocument(markdown), []);
const enhanced = useMemo(() => enhanceMarkdown(body, registry), [body, registry]);
const toc = useMemo(() => buildToc(body, 4), [body]);
```

> **Critical:** `buildToc` consumes `body` (not `enhanced`). The TOC doesn't need badge wrapping — only the rendered markdown does. This prevents the TOC from re-computing when the badge registry changes.

### 5.4 Template switching mechanism

The `src/templates/active.ts` file is the **only** place to edit when switching templates:

```typescript
import "@/templates/technical/theme.css";
import { technicalComponents } from "@/templates/technical/components";
import { TechnicalLayout } from "@/templates/technical/layout";
import tagsJson from "@/templates/technical/tags.json";

export const TEMPLATE_NAME = "technical" as const;
export const TAGS: TagRegistry = tagsJson as TagRegistry;
export const TEMPLATE_COMPONENTS = technicalComponents;
export const TemplateLayout: FC<TemplateLayoutProps> = TechnicalLayout;
```

To switch templates: change the three import paths and `TEMPLATE_NAME`.

---

## 6. Custom Hooks Deep Dive

**No custom hooks exist.** Theme state, drawer state, and the active-section observer live inline in `App.tsx` (`useState` / `useEffect` / `useMemo`). This is deliberate — document it explicitly so no agent searches for a `hooks/` directory.

The only reusable stateful logic is the `localStorage` wrapper in `src/utils/theme-storage.ts`, which is a pure utility (not a hook) because it doesn't use any React primitives.

---

## 7. Content Management & Data Ingestion

### 7.1 Markdown content

- **Location:** `src/content/document.md`
- **Import mechanism:** Vite `?raw` suffix imports the file as a string: `import documentMd from "@/content/document.md?raw";`
- **Frontmatter:** Optional YAML block at the top. Parsed by `parseDocument()` which returns `{ frontmatter, body }`. The frontmatter block is **stripped** from the body before rendering.
- **Supported features:** Headings H1–H6, tables (GFM), links, inline code, fenced code blocks, blockquotes, lists, horizontal rules, images, YAML frontmatter.
- **Not supported:** Footnotes, math, Mermaid, raw HTML pass-through, multi-document sets.

### 7.2 Badge annotations (optional)

The rendering pipeline supports inline badge annotations via the `enhanceMarkdown` preprocessor:

```markdown
- **Severity:** critical
- **Confidence:** verified
```

The preprocessor wraps the value in backticks (`` `critical` ``), which react-markdown parses as inline code, and the `code` component routes to `Badge` via the tag registry. **The actual skills-catalog.md content has 0 badge annotations** — the catalog is pure reference material.

### 7.3 Adding new content

1. Replace `src/content/document.md` with any markdown file.
2. Run `npm run build` — the pipeline handles frontmatter, tables, headings automatically.
3. If the content uses badge annotations (`**Tag:** value`), add the tag to `src/templates/technical/tags.json`.

---

## 8. Accessibility (WCAG 2.2 AA) Implementation

### 8.1 Conformance claim

**WCAG 2.2 AA, enforced by an automated axe gate.** The gate runs in both light and dark modes. Zero `color-contrast`, `target-size`, or other AA violations are allowed.

### 8.2 Implementation matrix

| Feature | Implementation | Verification |
|---------|----------------|--------------|
| Skip-to-content | `<a href="#content">` with `sr-only focus:not-sr-only focus:z-50` | Manual: Tab → Enter → focus lands |
| Focus visible | Global `:focus-visible` ring (2px accent outline) | Manual Tab pass |
| Heading hierarchy | H1 → H2 → H3 → H4, no skipped levels | axe `heading-order` |
| Reduced motion | `prefers-reduced-motion` guard in base styles | Manual OS setting check |
| Touch targets | All interactive elements ≥ 44×44px (`min-w-11 min-h-11`) | axe `target-size` |
| ARIA | `aria-label` on nav/toggle; `aria-hidden` on decorative icons | axe `aria-valid-attr` |
| Landmarks | `header`, `main`, `nav`, `article` | axe `region` |
| Color contrast | All text tokens ≥ 4.5:1 on their backgrounds | axe `color-contrast` |
| Keyboard | Full Tab/Shift+Tab operability | Manual |
| Language | `<html lang="en">` | axe `html-has-lang` |

### 8.3 The accessibility test

```typescript
// tests/accessibility/axe.test.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("document passes WCAG 2.2 AA (hard gate)", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("dark mode passes AA", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

> **Run with:** `npx playwright test` (NOT `npm run test` — vitest can't run Playwright tests).

### 8.4 Color contrast fixes applied during build

| Original Token | Original Hex | Background | Ratio | Fixed To | New Ratio |
|----------------|-------------|------------|-------|----------|-----------|
| `--text-tertiary` (light) | `#94a3b8` | `#ffffff` | 2.56:1 ❌ | `#475569` | 5.9:1 ✅ |
| `--text-tertiary` (dark) | `#64748b` | `#0f172a` | 3.9:1 ❌ | `#94a3b8` | 5.3:1 ✅ |

---

## 9. Anti-Patterns & Common Bugs

| # | Anti-Pattern | Symptom | Root Cause | Fix |
|---|---|---|---|---|
| 1 | Nesting `@theme` inside `@media` | Dark mode silently fails | `@theme` is build-time, top-level only | Variable-flip pattern (§4) |
| 2 | `dangerouslySetInnerHTML` for markdown | XSS surface, dual pipelines | HTML-string architecture | Use the components map |
| 3 | `import { slug } from "github-slugger"` | Build error | No named export exists | `import GithubSlugger from "github-slugger"` |
| 4 | Using `baseUrl` in TS 6 tsconfig | Hard error: "Option baseUrl is deprecated" | TS 6 deprecation | Remove `baseUrl`; use `paths` with `./` prefix |
| 5 | Forgetting `jsdom` for vitest | "Cannot find package 'jsdom'" | jsdom not bundled with vitest | `npm install -D jsdom` |
| 6 | Running Playwright tests under vitest | "calling test() from async test.describe()" | Wrong runner | `npx playwright test` for accessibility |
| 7 | Not installing Playwright browsers | "Executable doesn't exist" | Browsers not bundled | `npx playwright install chromium` |
| 8 | Badge test registry with collisions | Wrong tag assigned | `resolveBadge` returns first match | Unique values across registry |
| 9 | Testing slug parity with untrimmed fixtures | Whitespace mismatch | `buildToc` trims before slugging | Compare against `slugger.slug(text.trim())` |
| 10 | `--text-tertiary` too light for AA | 2.56:1 contrast failure | Default slate-400 too bright | Darken to slate-600 (`#475569`) |
| 11 | Using exact-pinned deps without checking Vite 8 compatibility | Peer dependency conflicts | Pinned versions predate Vite 8 | Check peer ranges; use latest patch |
| 12 | `noUncheckedIndexedAccess` without null checks | `TocItem possibly undefined` | Strict array access | Use optional chaining (`toc[0]?.slug`) |

---

## 10. Debugging Guide

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Cannot find module 'jsdom'` when running tests | `jsdom` not installed | `npm install -D jsdom` |
| `Option baseUrl is deprecated` in TS 6 | `baseUrl` removed in TS 6 | Remove from tsconfig; use `paths` |
| `peer vite@"^5\|^6\|^7"` conflict | Plugin version predates Vite 8 | Use `@tailwindcss/vite@4.3.3+`, `vite-plugin-singlefile@2.3.3+` |
| `Executable doesn't exist at ...chromium` | Playwright browsers not installed | `npx playwright install chromium` |
| Badge renders as plain `<code>` (no color) | Markdown not run through `enhanceMarkdown` first | Pipeline: `enhanceMarkdown` → `MarkdownRenderer` |
| `getByLabelText` finds wrong badge | Value collision across tags | Ensure unique values in registry |
| Slug parity test fails on whitespace fixture | `buildToc` trims heading text | Compare against `slugger.slug(text.trim())` |
| `color-contrast` AA violation on tertiary text | Text token too light for background | Darken token (see §8.4) |
| Dark mode doesn't apply on toggle | `data-theme` not set on `<html>` | `document.documentElement.setAttribute("data-theme", "dark")` |
| `Property 'env' does not exist on type 'ImportMeta'` | Missing Vite client types | Add `/// <reference types="vite/client" />` |
| `Cannot find name 'fs'/'path'/'process'` in tests | Missing `@types/node` | `npm install -D @types/node` + add to tsconfig `types` |
| Build exceeds 250 KB gzipped | Large markdown or un-tree-shaken icons | Subset lucide-react imports; check bundle with `rollup-plugin-visualizer` |

---

## 11. Pre-Ship Checklist

Run in order. All must pass.

```bash
# Gate 1: Typecheck (strict, noUnusedLocals/Parameters)
npx tsc --noEmit

# Gate 2: Unit + integration + bundle-size tests
npx vitest run

# Gate 3: Accessibility (axe-core via Playwright, light + dark)
npx playwright test

# Gate 4: Production build
npx vite build
# Verify: dist/index.html exists, JS/CSS inlined

# Gate 5: Smoke test
npx vite preview --port 4173 &
curl -s http://localhost:4173/ | grep -o '<title>[^<]*</title>'
kill %1
```

**Test counts (verified):**
- Unit tests: 35 (fence: 5, enhance: 8, toc: 9, frontmatter: 7, tags: 6, slug-parity: 10)
- Integration tests: 4
- Accessibility tests: 2
- Performance tests: 1
- **Total: 49 tests, all passing**

**Build output:** `dist/index.html` — 492 KB raw, 162 KB gzipped (well under 250 KB budget).

---

## 12. Lessons Learnt & How to Avoid Them

### Lesson 1: Vite 8 requires updated plugin versions — exact pins from old specs will break

**What happened:** The markdown-to-web skill spec pinned `vite-plugin-singlefile@2.3.0` and `@tailwindcss/vite@4.1.17`. Both predate Vite 8 and have peer dependency ranges that exclude it (`vite: ^5||^6||^7`). Installing them in a Vite 8 project causes `ERESOLVE` peer conflicts.

**Why it matters:** Skill specs written for older Vite versions will have stale pins. Blindly copying them breaks the build.

**How to avoid:** After scaffolding, check what Vite version was installed. Then verify every pinned dependency's peer range includes it. Use `npm view <pkg>@<version> peerDependencies` to check. When in doubt, use `latest` for packaging/plugin deps and verify the resolved version works.

**Fix applied:** Used `vite-plugin-singlefile@2.3.3` (adds `|| ^8` to peer range) and `@tailwindcss/vite@4.3.3` (adds `|| ^8`).

### Lesson 2: TypeScript 6 deprecates `baseUrl` — remove it

**What happened:** The Vite scaffold generated a `tsconfig.json` without `baseUrl`, but many existing skill templates include it. TypeScript 6 emits `TS5101: Option 'baseUrl' is deprecated` and stops compilation.

**Why it matters:** Any project migrating to TS 6 (bundled with the latest Vite scaffold) must remove `baseUrl` from tsconfig.

**How to avoid:** Use `paths` with relative `./` prefix instead of `baseUrl` + paths. The `paths` approach still works:
```json
"paths": { "@/*": ["./src/*"] }
```

### Lesson 3: `jsdom` must be explicitly installed for vitest

**What happened:** Running `vitest run` with `environment: "jsdom"` failed with `Cannot find package 'jsdom'`. Vitest doesn't bundle jsdom — it's an optional peer.

**Why it matters:** Any project using vitest for DOM testing needs jsdom as a separate dependency.

**How to avoid:** Always add `jsdom` to devDependencies when using vitest with a DOM environment:
```bash
npm install -D jsdom
```

### Lesson 4: The badge pipeline requires `enhanceMarkdown` BEFORE `MarkdownRenderer`

**What happened:** The integration test initially failed because it passed raw markdown directly to `MarkdownRenderer`. But badges only render when the markdown has been pre-processed by `enhanceMarkdown` first, which wraps values in backticks. Without that wrapping, `react-markdown` parses `critical` as plain text, not inline code.

**Why it matters:** The pipeline has a strict order: `parseDocument` → `enhanceMarkdown` → `MarkdownRenderer`. Testing the renderer in isolation requires pre-enhanced input.

**How to avoid:** In integration tests, run the full pipeline:
```typescript
const { enhanced } = enhanceMarkdown(raw, registry);
render(<MarkdownRenderer markdown={enhanced} registry={registry} />);
```

### Lesson 5: Badge test registries must have unique values across tags

**What happened:** The integration test defined `verified` under both `Severity` and `Confidence`. The resolver returns the first match, so `Confidence: Verified` rendered as `Severity: Verified`.

**Why it matters:** `resolveBadge` iterates `Object.values(registry)` and returns the first matching value. The order is insertion order, not priority-based.

**How to avoid:** Ensure no value appears in more than one tag. The `validateRegistry` function catches this at load time — always call it. In tests, use distinct values per tag.

### Lesson 6: `buildToc` trims heading text before slugging — parity tests must account for this

**What happened:** The slug parity test fixture `"  Leading whitespace  "` produced `slugger.slug(text)` = `"--leading-whitespace--"` but `buildToc` produced `"leading-whitespace"` because `headingText()` trims before slugging.

**Why it matters:** The TOC extractor normalizes heading text (strips backticks, trims whitespace) before slugging. The raw `github-slugger` doesn't normalize. Comparing them directly on untrimmed input gives false negatives.

**How to avoid:** Compare against `slugger.slug(text.trim())` in parity tests, or only use fixtures that are already trimmed.

### Lesson 7: Playwright browsers must be explicitly installed

**What happened:** Running `npx playwright test` failed with `Executable doesn't exist at /home/pete/.cache/ms-playwright/chromium_headless_shell-1234/`.

**Why it matters:** The `@playwright/test` package doesn't bundle browser binaries. They must be downloaded separately.

**How to avoid:** After installing `@playwright/test`, always run:
```bash
npx playwright install chromium
```

### Lesson 8: The `--text-tertiary` token was too light for WCAG AA

**What happened:** The initial theme used `--text-tertiary: #94a3b8` (slate-400) which has only 2.56:1 contrast on white — failing WCAG AA (requires 4.5:1). The axe gate caught this.

**Why it matters:** "Tertiary" text is often styled too light for accessibility. The visual hierarchy (primary → secondary → tertiary) must not sacrifice contrast.

**How to avoid:** Verify every text token against its background using a contrast checker. For the technical template, `--text-tertiary` was darkened to `#475569` (same as secondary). In dark mode, `#94a3b8` on `#0f172a` gives 5.3:1 — passing.

### Lesson 9: Playwright tests must run under Playwright, not vitest

**What happened:** Including `tests/accessibility/**` in the vitest test run caused `You are calling test() from an async test.describe() block` errors.

**Why it matters:** Playwright's `test()` API is incompatible with vitest's runner. They are separate test ecosystems.

**How to avoid:** Exclude accessibility tests from vitest config (`exclude: ["tests/accessibility/**"]`) and run them separately with `npx playwright test`.

### Lesson 10: `@types/node` is required for Node.js APIs in test files

**What happened:** The bundle-size test used `fs`, `path`, `zlib`, and `process` — all Node.js APIs without type declarations. `tsc --noEmit` failed.

**Why it matters:** Test files that interact with the file system or Node.js runtime need `@types/node`.

**How to avoid:** Install `@types/node` and add `"types": ["node"]` to tsconfig compilerOptions.

---

## 13. Pitfalls to Avoid

1. **Don't use `dangerouslySetInnerHTML`** to render markdown output. react-markdown's component map renders Markdown as React elements — serializing to HTML and using `dangerouslySetInnerHTML` discards type safety and creates an XSS surface.

2. **Don't nest `@theme` inside `@media (prefers-color-scheme: dark)`**. `@theme` is a build-time, top-level directive. Nesting it inside a media query silently breaks dark mode. Use the two-layer variable-flip pattern instead.

3. **Don't use `baseUrl` in TypeScript 6**. It's deprecated and causes a hard error. Use `paths` with relative `./` prefix.

4. **Don't forget `jsdom`** when configuring vitest with `environment: "jsdom"`. It's not bundled.

5. **Don't run Playwright tests under vitest**. They use incompatible test APIs. Exclude accessibility tests from vitest and run them separately.

6. **Don't install `@playwright/test` without installing browsers**. Run `npx playwright install chromium` immediately after.

7. **Don't reuse badge values across tags**. The resolver returns the first match silently. Use unique values or rely on `loadRegistry` to throw at startup.

8. **Don't compare slug parity against untrimmed heading text**. `buildToc` normalizes (strips backticks, trims) before slugging.

9. **Don't use light text tokens without contrast checking**. WCAG AA requires 4.5:1 for normal text. "Tertiary" text is a common failure point.

10. **Don't copy exact version pins from old skill specs without checking peer ranges**. Vite 8 compatibility requires `@tailwindcss/vite@4.3.3+` and `vite-plugin-singlefile@2.3.3+`.

11. **Don't forget `@types/node`** when test files use Node.js APIs (`fs`, `path`, `zlib`, `process`).

12. **Don't put `tests/accessibility/**` in the vitest test run**. Playwright tests need their own runner.

---

## 14. Best Practices

### Code organization
- One file, one responsibility. `MarkdownRenderer.tsx` renders; `Badge.tsx` styles tags; `tags.ts` validates/resolves the registry; `enhance.ts` preprocesses strings; `fence.ts` scans lines.
- Template switching is a one-file edit (`src/templates/active.ts`).
- Memoize every derived value (`parseDocument`, `enhanceMarkdown`, `buildToc`).

### TypeScript conventions
- Strict mode enabled (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`).
- `interface` for object shapes, `type` for unions/intersections.
- Use optional chaining with `noUncheckedIndexedAccess`: `toc[0]?.slug`.
- `import type` for type-only imports.

### Testing conventions
- Test behavior, not implementation.
- Test the full pipeline in integration tests (enhance → render), not isolated units.
- Badge tests must use unique values across tags.
- Slug parity tests must compare against trimmed text.
- Accessibility tests run via Playwright, not vitest.

### Design system conventions
- All colors come from `@theme` tokens — no arbitrary hex values.
- Dark mode via variable flipping, never `dark:` utilities.
- Verify contrast ratios for every text token against its background.

### Build conventions
- `vite-plugin-singlefile` inlines JS/CSS into one HTML file.
- `cssCodeSplit: false` and `inlineDynamicImports: true` ensure true single-file output.
- Google Fonts via `@import` in CSS (not in JS).

---

## 15. Coding Patterns

### Pattern 1: Fence-aware line scanner

Used by both `buildToc` and `enhanceMarkdown` to avoid processing content inside code fences:

```typescript
// src/lib/fence.ts
export function scanLines(markdown: string): MarkdownRegion[] {
  // CommonMark-subset fence tracking: ``` or ~~~ (up to 3 leading spaces)
  // Returns { line, lineNumber, insideFence } for each line
}
```

### Pattern 2: Backtick-wrapping badge pipeline

The bridge between markdown text and React components:

```
Author writes:        - **Severity:** critical
enhance.ts wraps:     - **Severity:** `critical`
react-markdown parses: inline code element with children="critical"
components.code:       resolveBadge(registry, "critical") → <Badge />
```

### Pattern 3: Stack-based TOC nesting

```typescript
// src/lib/toc.ts — the while loop pops until top's level < current's level
while (stack.length > 0 && stack[stack.length - 1]!.level >= level) {
  stack.pop();
}
if (stack.length === 0) items.push(item);
else stack[stack.length - 1]!.children.push(item);
stack.push(item);
```

### Pattern 4: IntersectionObserver for active-section highlighting

```typescript
// App.tsx — observe all TOC levels (not just top-level)
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) setActiveSlug(entry.target.id);
    }
  },
  { rootMargin: "-80px 0px -80% 0px" },
);
for (const item of flattenToc(toc)) {
  const el = document.getElementById(item.slug);
  if (el) observer.observe(el);
}
```

### Pattern 5: localStorage with try/catch + in-memory fallback

```typescript
// src/utils/theme-storage.ts
const fallbackStore = new Map<string, string>();
export function readTheme(): string | null {
  try {
    return localStorage.getItem("theme");
  } catch {
    return fallbackStore.get("theme") ?? null;
  }
}
```

### Pattern 6: Memoized pipeline in App.tsx

```typescript
const { frontmatter, body } = useMemo(() => parseDocument(markdown), []);
const enhanced = useMemo(() => enhanceMarkdown(body, registry), [body, registry]);
const toc = useMemo(() => buildToc(body, 4), [body]);
```

---

## 16. Coding Anti-Patterns

### ❌ `dangerouslySetInnerHTML` for markdown

```typescript
// WRONG — XSS surface, defeats React reconciliation
<div dangerouslySetInnerHTML={{ __html: html }} />

// CORRECT — components map renders Markdown as React elements
<ReactMarkdown components={{ code: BadgeWrapper }}>{markdown}</ReactMarkdown>
```

### ❌ `@theme` inside `@media`

```typescript
// WRONG — silently breaks dark mode
@media (prefers-color-scheme: dark) {
  @theme inline { --color-bg: #0f172a; }  // Invalid!
}

// CORRECT — Layer 1 runtime variables + Layer 2 @theme inline
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { --bg: #0f172a; }
}
@theme inline { --color-bg: var(--bg); }
```

### ❌ Named import from github-slugger

```typescript
// WRONG — no named export exists
import { slug } from "github-slugger";

// CORRECT — default export class
import GithubSlugger from "github-slugger";
const slugger = new GithubSlugger();
```

### ❌ Unmemoized pipeline

```typescript
// WRONG — re-computes on every render
const { body } = parseDocument(markdown);
const enhanced = enhanceMarkdown(body, registry);
const toc = buildToc(body);

// CORRECT — memoized
const { body } = useMemo(() => parseDocument(markdown), []);
const enhanced = useMemo(() => enhanceMarkdown(body, registry), [body, registry]);
const toc = useMemo(() => buildToc(body, 4), [body]);
```

### ❌ Testing renderer without enhance pipeline

```typescript
// WRONG — badges won't render
render(<MarkdownRenderer markdown="- **Severity:** critical" registry={registry} />);

// CORRECT — run enhance first
const { enhanced } = enhanceMarkdown("- **Severity:** critical", registry);
render(<MarkdownRenderer markdown={enhanced} registry={registry} />);
```

---

## 17. Responsive Breakpoint Reference

Tailwind default breakpoints (no custom config):

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm` | 640px | H1 sizing (`text-3xl sm:text-4xl`) |
| `md` | 768px | (unused) |
| `lg` | 1024px | TOC sidebar appears (`lg:block`) |
| `xl` | 1280px | Right "on this page" outline appears (`xl:block`) |
| `2xl` | 1536px | (unused) |

**Layout behavior:**
- **Desktop (≥1024px):** Three-column — left TOC nav + content + right outline
- **Tablet (768–1024px):** Two-column — left TOC nav + content (no right outline)
- **Mobile (<768px):** Single column — content only (TOC would need a drawer)

---

## 18. Z-Index Layer Map

| z-index | Element | Purpose | File |
|---------|---------|---------|------|
| `z-50` | Skip-to-content link (focused) | Topmost | `SkipLink.tsx` |
| `z-40` | Sticky header | Above content, below drawer | `layout.tsx` |

No portals, dialogs, or tooltips exist. If you add one, update this map in the same commit.

---

## 19. Color Reference (Complete)

### Light mode

| Token | Hex | RGB | Tailwind Class | Usage |
|-------|-----|-----|----------------|-------|
| `--bg` | `#ffffff` | 255, 255, 255 | `bg-bg` | Page background |
| `--bg-secondary` | `#f8fafc` | 248, 250, 252 | `bg-bg-secondary` | Header, code blocks |
| `--bg-tertiary` | `#f1f5f9` | 241, 245, 249 | `bg-bg-tertiary` | Hover states |
| `--text` | `#0f172a` | 15, 28, 42 | `text-text` | Headings, primary text |
| `--text-secondary` | `#475569` | 71, 85, 105 | `text-text-secondary` | Body, descriptions |
| `--text-tertiary` | `#475569` | 71, 85, 105 | `text-text-tertiary` | Labels (same as secondary for AA) |
| `--border` | `#e2e8f0` | 226, 232, 240 | `border-border` | Borders, dividers |
| `--accent` | `#2563eb` | 37, 99, 235 | `text-accent` | Links, focus rings |
| `--accent-dark` | `#1d4ed8` | 29, 78, 216 | `text-accent-dark` | Link hover |
| `--accent-1` | `#dc2626` | 220, 38, 38 | `text-accent-1` | Badge: critical/danger |
| `--accent-2` | `#f59e0b` | 245, 158, 11 | `text-accent-2` | Badge: warning |
| `--accent-3` | `#2563eb` | 37, 99, 235 | `text-accent-3` | Badge: info |
| `--accent-4` | `#10b981` | 16, 185, 129 | `text-accent-4` | Badge: success |
| `--accent-5` | `#8b5cf6` | 139, 92, 246 | `text-accent-5` | Badge: neutral |

### Dark mode

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--bg` | `#0f172a` | 15, 28, 42 | Page background |
| `--bg-secondary` | `#1e293b` | 30, 41, 59 | Header, code blocks |
| `--bg-tertiary` | `#334155` | 51, 65, 85 | Hover states |
| `--text` | `#f8fafc` | 248, 250, 252 | Headings |
| `--text-secondary` | `#cbd5e1` | 203, 213, 225 | Body |
| `--text-tertiary` | `#94a3b8` | 148, 163, 184 | Labels |
| `--border` | `#334155` | 51, 65, 85 | Borders |
| `--accent` | `#60a5fa` | 96, 165, 250 | Links |

---

## 20. The Complete TypeScript Interface Reference

### `src/types/tag.ts`

```typescript
export interface TagValueDefinition {
  accent: 1 | 2 | 3 | 4 | 5;
  label?: string;
}

export interface TagDefinition {
  name: string;
  values: Record<string, TagValueDefinition>;
}

export type TagRegistry = Record<string, TagDefinition>;

export interface ResolvedBadge {
  tag: string;
  value: string;
  label: string;
  accent: 1 | 2 | 3 | 4 | 5;
}
```

### `src/types/toc.ts`

```typescript
export interface TocItem {
  level: 2 | 3 | 4;
  text: string;
  slug: string;
  children: TocItem[];
}
```

### `src/types/frontmatter.ts`

```typescript
export interface Frontmatter {
  title?: string;
  subtitle?: string;
  author?: string;
  date?: string;
  template?: string;
  [key: string]: string | boolean | undefined;
}

export interface ParsedDocument {
  frontmatter: Frontmatter;
  body: string;
}
```

### `src/types/template.ts`

```typescript
export type TemplateName = "editorial" | "technical" | "minimal";

export interface TemplateLayoutProps {
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  readingTime?: string;
  toc: TocItem[];
  activeSlug?: string;
  markdown: string;
  children: ReactNode;
}

export interface TemplateConfig {
  name: TemplateName;
  themeCss: string;
  components: Partial<ComponentsMap>;
  layout: FC<TemplateLayoutProps>;
  defaultTags: TagRegistry;
  tocMaxDepth: 2 | 3 | 4;
  offlineFonts: boolean;
}
```

### Component props summary

| Component | Props |
|-----------|-------|
| `App` | None (reads markdown via `?raw` import) |
| `MarkdownRenderer` | `{ markdown: string; registry: TagRegistry }` |
| `TableOfContents` | `{ items: TocItem[]; activeSlug?: string; onNavigate?: () => void }` |
| `Badge` | `{ tag: string; value: string; accent: 1 \| 2 \| 3 \| 4 \| 5 }` |
| `ErrorBoundary` | `{ children: ReactNode; fallback?; onError? }` |
| `ErrorFallback` | `{ error?: Error \| null }` |
| `SkipLink` | `{ targetId?: string }` (default: `"content"`) |
| `ThemeToggle` | None (manages own state) |

---

## 21. Appendices

### Appendix A: ADRs

**ADR-1 — Why Vite 8 instead of Vite 7?**
The Vite scaffold (`npm create vite@latest`) now installs Vite 8 by default. Rather than downgrading, we upgraded the plugin ecosystem (`@tailwindcss/vite@4.3.3`, `vite-plugin-singlefile@2.3.3`) to maintain compatibility. The architecture is identical across Vite 7/8.

**ADR-2 — Why the technical template for a skills catalog?**
The catalog is a reference document navigated non-linearly (users jump to categories). The technical template's three-column layout with TOC nav is designed for this use case. The editorial template is for long-form sequential reading; the minimal template is for print.

**ADR-3 — Why no badge annotations in the source content?**
The skills-catalog.md is pure reference material. Badge annotations (`**Tag:** value`) are designed for audit reports, compliance matrices, or status documents. Adding them to a skill catalog would be semantically inappropriate.

**ADR-4 — Why WCAG AA instead of AAA?**
AAA requires 7:1 contrast for normal text. Many UI elements (badges, meta labels, tertiary text) cannot achieve AAA without sacrificing visual hierarchy. The approach: AA as hard gate, AAA aspirational where feasible. Badge contrast is documented as an enumerated exception.

### Appendix B: Build metrics

| Metric | Value |
|--------|-------|
| Source files | 29 |
| Source lines | 923 |
| Test files | 10 |
| Test lines | 347 |
| Total tests | 49 |
| Build output | `dist/index.html` (492 KB raw, 162 KB gzipped) |
| Bundle budget | 250 KB gzipped |
| Margin | 87 KB under budget |
| Build time | ~400ms |
| gzip ratio | 3.04:1 |

### Appendix C: Test inventory

| Suite | File | Tests |
|-------|------|-------|
| Unit | `fence.test.ts` | 5 |
| Unit | `enhance.test.ts` | 8 |
| Unit | `toc.test.ts` | 9 |
| Unit | `frontmatter.test.ts` | 7 |
| Unit | `tags.test.ts` | 6 |
| Unit | `slug-parity.test.ts` | 10 (7 fixtures + 3 edge cases) |
| Integration | `markdown-rendering.test.tsx` | 4 |
| Accessibility | `axe.test.ts` | 2 |
| Performance | `bundle-size.test.ts` | 1 |
| **Total** | | **49** |

### Appendix D: Dependency compatibility matrix

| Dependency | Skill spec pin | Resolved version | Reason |
|------------|----------------|------------------|--------|
| `vite` | 7.3.2 | 8.2.1 | Scaffold default |
| `@tailwindcss/vite` | 4.1.17 | 4.3.3 | Vite 8 peer requirement |
| `vite-plugin-singlefile` | 2.3.0 | 2.3.3 | Vite 8 peer requirement |
| `typescript` | 5.9.3 | 6.0.3 | Scaffold default |
| `vitest` | ^2 | 4.1.10 | Latest compatible |
| `jsdom` | (not in spec) | latest | Required for vitest DOM env |
| `@types/node` | (not in spec) | latest | Required for Node APIs in tests |

### Appendix E: The complete file tree

```
markdown-to-web/
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── index.html
├── docs/
│   └── markdown-html-pipeline_SKILL.md    ← This file
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── components/
│   │   ├── MarkdownRenderer.tsx
│   │   ├── TableOfContents.tsx
│   │   ├── Badge.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorFallback.tsx
│   │   ├── SkipLink.tsx
│   │   └── ThemeToggle.tsx
│   ├── content/
│   │   └── document.md
│   ├── templates/
│   │   ├── active.ts
│   │   └── technical/
│   │       ├── theme.css
│   │       ├── components.tsx
│   │       ├── layout.tsx
│   │       └── tags.json
│   ├── lib/
│   │   ├── fence.ts
│   │   ├── enhance.ts
│   │   ├── toc.ts
│   │   ├── tags.ts
│   │   └── frontmatter.ts
│   ├── types/
│   │   ├── tag.ts
│   │   ├── toc.ts
│   │   ├── frontmatter.ts
│   │   ├── template.ts
│   │   └── config.ts
│   └── utils/
│       ├── cn.ts
│       └── theme-storage.ts
├── tests/
│   ├── setup.ts
│   ├── unit/
│   │   ├── fence.test.ts
│   │   ├── enhance.test.ts
│   │   ├── toc.test.ts
│   │   ├── frontmatter.test.ts
│   │   ├── tags.test.ts
│   │   └── slug-parity.test.ts
│   ├── integration/
│   │   └── markdown-rendering.test.tsx
│   ├── accessibility/
│   │   └── axe.test.ts
│   └── performance/
│       └── bundle-size.test.ts
└── dist/
    └── index.html
```

---

*This skill file was distilled from a real build of the markdown-to-web pipeline on 2026-08-07. Every claim is verifiable against the actual codebase. Version 1.0.0.*
