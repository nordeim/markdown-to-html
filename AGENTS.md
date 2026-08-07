# AGENTS.md — Markdown-to-Web Pipeline

## What This Is

A zero-backend React app that renders a Markdown document (`src/content/document.md`) as a polished, navigable, single-file web page. Output: `dist/index.html` with JS/CSS inlined (162 KB gzipped).

## Commands

```bash
npm install              # First time only
npm run dev              # Dev server (Vite)
npm run build            # Production build → dist/index.html
npm run preview          # Serve dist/ on :4173

npm run typecheck        # tsc --noEmit (strict, noUnusedLocals)
npm run test             # All vitest tests (unit + integration + bundle-size)
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:bundle-size # Bundle < 250KB gzipped gate
npm run a11y             # Accessibility (Playwright + axe) — WCAG 2.2 AA gate
```

## Test Runner Split

**Two different test runners. Do not confuse them.**

| Runner | Command | What it runs |
|--------|---------|-------------|
| vitest | `npm run test` | `tests/unit/`, `tests/integration/`, `tests/performance/` |
| Playwright | `npm run a11y` | `tests/accessibility/` |

- `tests/accessibility/**` is **excluded from vitest** — it cannot run there.
- Playwright browsers must be installed first: `npx playwright install chromium`

## Critical Architecture

### Rendering Pipeline (order matters)

```
document.md → parseDocument() → { frontmatter, body }
    body → enhanceMarkdown() → enhanced string (badge backtick-wrapping)
    body → buildToc()         → TocItem[] (H2–H4 extraction)
    enhanced → MarkdownRenderer → React elements (react-markdown)
```

- `enhanceMarkdown` **must run before** `MarkdownRenderer` — badges only render from pre-wrapped backtick code.
- `buildToc` consumes **`body` (not `enhanced`)** — TOC doesn't need badge wrapping.

### Badge System (Backtick-Wrapping Pattern)

```markdown
- **Severity:** critical     ← Author writes this
- **Severity:** `critical`    ← enhanceMarkdown wraps value
```

react-markdown parses `` `critical` `` as inline code → `code` component → `resolveBadge()` → `<Badge>`.

- Badge values must be **unique across all tags** (registry collision detection).
- Tag registry: `src/templates/technical/tags.json`.
- Resolver: `src/lib/tags.ts` — first match wins.

### github-slugger Import

```typescript
// CORRECT — default export class
import GithubSlugger from "github-slugger";

// WRONG — no named export exists
import { slug } from "github-slugger";
```

### Template Switching

Edit **only** `src/templates/active.ts`:
- Change the three import paths
- Change `TEMPLATE_NAME`

### Dark Mode (Two-Layer Token Pattern)

**Never nest `@theme` inside `@media`** — it silently breaks dark mode.

Correct pattern (`src/templates/technical/theme.css`):
1. **Layer 1:** `:root` variables flipped by `@media` / `[data-theme]`
2. **Layer 2:** `@theme inline` bridges variables into Tailwind utilities

Dark mode is applied via `data-theme="dark"` on `<html>`, **not** Tailwind `dark:` utilities.

## TypeScript Strictness

- `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` — all enabled.
- With `noUncheckedIndexedAccess`, use optional chaining: `toc[0]?.slug`
- `import type` for type-only imports (enforced by linter).

## CSS Import Order

`src/index.css`:
```css
@import url("https://fonts.googleapis.com/css2?...");  /* Must be FIRST */
@import "tailwindcss";                                   /* Must be SECOND */
```

## Content Import

Markdown is imported as a raw string via Vite:
```typescript
import documentMd from "@/content/document.md?raw";
```

Type declaration: `src/vite-env.d.ts`.

## Coverage Thresholds

- Lines/Functions/Statements: 80%
- Branches: 75%

## Key File Map

| Path | Purpose |
|------|---------|
| `src/App.tsx` | Layout assembly + memoized pipeline state |
| `src/main.tsx` | Entry: StrictMode + ErrorBoundary + createRoot |
| `src/content/document.md` | Input markdown (the catalog) |
| `src/templates/active.ts` | Template switching (single edit point) |
| `src/templates/technical/theme.css` | Design tokens (two-layer dark mode) |
| `src/lib/fence.ts` | Fence-aware line scanner (shared by TOC + enhance) |
| `src/lib/enhance.ts` | Badge backtick-wrapping preprocessor |
| `src/lib/toc.ts` | H2–H4 TOC extraction with slug reservation |
| `src/lib/tags.ts` | Registry validation + badge resolver |
| `src/lib/frontmatter.ts` | YAML frontmatter parse + strip |
| `src/utils/cn.ts` | `clsx` + `tailwind-merge` |
| `src/utils/theme-storage.ts` | `localStorage` with try/catch fallback |

## Don't

- Don't use `dangerouslySetInnerHTML` for markdown — use the components map.
- Don't run `npx playwright test` via vitest — they're incompatible.
- Don't put `tests/accessibility/**` in the vitest run (already excluded).
- Don't reuse badge values across different tags.
- Don't forget `npx playwright install chromium` before first `npm run a11y`.
