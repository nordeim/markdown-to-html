---
IMPORTANT: File is read fresh for every conversation. Be brief and practical.
---

# Skills Catalog — Markdown-to-Web Pipeline

A zero-backend React application that renders a Markdown document (`src/content/document.md`) as a polished, navigable, single-file web page. The build produces one self-contained `dist/index.html` (598 KB raw, 171 KB gzipped) with JS/CSS inlined — deployable to any static host.

**Tech Stack:** React 19 + Vite 8 + Tailwind CSS v4 (CSS-first `@theme`) + react-markdown + remark/rehype ecosystem + lucide-react (icons) + Playwright (accessibility)

**Version:** 1.1.0 (2026-08-07) — remediated. See `docs/audit/REMEDIATION_LOG.md` for the full change log.

## Core Identity & Purpose

This project solves one problem: turn any Markdown file into a production-quality web page with zero backend, zero runtime dependencies, and full WCAG 2.2 AA compliance. The pipeline handles frontmatter parsing, heading-to-anchor linking, TOC extraction with active-section highlighting, badge annotation rendering, dark mode, responsive layout, and a single-file build output.

The content is a catalog of 198 skills across 10 categories, but the pipeline is content-agnostic — replace `src/content/document.md` with any Markdown file and rebuild.

## Foundational Principles

### Meticulous Approach (Six-Phase Workflow)

Follow this six-phase workflow for all implementation tasks:

1. **ANALYZE** — Deep, multi-dimensional requirement mining. Never make surface-level assumptions. Identify explicit requirements, implicit needs, and potential ambiguities.
2. **PLAN** — Structured execution roadmap with sequential phases. Present the plan for explicit user confirmation. Never proceed without validation.
3. **VALIDATE** — Explicit confirmation checkpoint. Obtain explicit user approval before implementation.
4. **IMPLEMENT** — Modular, tested, documented builds. Set up proper environment. Implement in logical, testable components. Test each component before integration.
5. **VERIFY** — Rigorous QA against success criteria. Execute comprehensive testing. Review for best practices, security, performance. Consider edge cases and accessibility.
6. **DELIVER** — Complete handoff with knowledge transfer. Provide complete solution with instructions. Document challenges and solutions.

### Project-Specific Principles

- **Content is sovereign.** The Markdown file determines structure. The renderer never invents content.
- **One rendering pipeline.** `react-markdown` + components map. No `dangerouslySetInnerHTML`.
- **Tags are registered, not hardcoded.** Badges are data in a JSON registry; the resolver is generic with collision detection.
- **Accessibility is gated, not claimed.** WCAG 2.2 AA enforced by an axe gate in CI — zero violations allowed.
- **Single-file portability.** JS/CSS are inlined by `vite-plugin-singlefile`. Output runs from any static host or `file://`.

## Implementation Standards

### TypeScript Strict Mode

- `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` — all enabled.
- With `noUncheckedIndexedAccess`, use optional chaining: `toc[0]?.slug`.
- Never use `any` — prefer `unknown`.
- Use `interface` for object shapes, `type` for unions/intersections.
- `import type` for type-only imports (enforced by linter).
- **No `baseUrl` in tsconfig** — deprecated in TypeScript 6. Use `paths` with relative `./` prefix instead.

### React Development

- All components are function components. The only class component is `ErrorBoundary` (required for `componentDidCatch`).
- All components use named exports (no default exports).
- Content is imported via Vite `?raw`: `import documentMd from "@/content/document.md?raw"`.
- The `?raw` import requires a type declaration in `src/vite-env.d.ts`.
- Handle all UI states: loading, error, empty, success. The `ErrorBoundary` + `ErrorFallback` pattern catches render failures.
- Memoize every derived value (`parseDocument`, `enhanceMarkdown`, `buildToc`) to prevent re-computation on re-render.

### Tailwind CSS v4 (CSS-First)

- **No `tailwind.config.js`** — all design tokens live in CSS via `@theme inline`.
- The two-layer token pattern is the only correct dark mode approach:
  - **Layer 1:** `:root` runtime variables flipped by `@media` / `[data-theme]`
  - **Layer 2:** `@theme inline` bridges variables into Tailwind utilities
- **Never nest `@theme` inside `@media`** — it silently breaks dark mode.
- Dark mode is applied via `data-theme="dark"` on `<html>`, **not** Tailwind `dark:` utilities.
- All colors come from `@theme` tokens — no arbitrary hex values in components.
- CSS import order matters: Google Fonts `@import` must come before `@import "tailwindcss"`.

### react-markdown Pipeline

- Uses `remark-gfm` (tables, strikethrough, task lists) and `rehype-slug` (heading anchors).
- Components map renders Markdown as React elements — no `dangerouslySetInnerHTML`.
- The `code` component routes inline code to `Badge` via the tag registry.
- **The badge pipeline has a strict order:** `enhanceMarkdown` wraps values in backticks → react-markdown parses as inline code → `code` component calls `resolveBadge()` → renders `<Badge>`.

## Development Workflow

### Environment Setup

```bash
npm install                  # First time only
npx playwright install chromium  # Required before first a11y test
```

### Build Commands

| Command                    | Purpose                                             |
| -------------------------- | --------------------------------------------------- |
| `npm run dev`              | Start development server (Vite)                     |
| `npm run build`            | Production build → `dist/index.html`                |
| `npm run preview`          | Serve `dist/` on :4173                              |
| `npm run typecheck`        | `tsc --noEmit` (strict)                             |
| `npm run lint`             | ESLint (flat config, zero-warning policy)           |
| `npm run lint:format`      | Prettier check                                      |
| `npm run lint:markdown`    | markdownlint-cli2                                   |
| `npm run test`             | All vitest tests (unit + integration + bundle-size) |
| `npm run test:unit`        | Unit tests only (68 tests across 8 files)           |
| `npm run test:integration` | Integration tests only (55 tests across 10 files)   |
| `npm run test:coverage`    | Vitest with coverage (enforces 80/75/80/80)         |
| `npm run test:bundle-size` | Bundle < 250 KB gzipped gate (1 test)               |
| `npm run a11y`             | Accessibility tests (Playwright + axe, 2 tests)     |

### Test Runner Split

**Two different test runners. Do not confuse them.**

| Runner     | Command        | What it runs                                              |
| ---------- | -------------- | --------------------------------------------------------- |
| vitest     | `npm run test` | `tests/unit/`, `tests/integration/`, `tests/performance/` |
| Playwright | `npm run a11y` | `tests/accessibility/`                                    |

- `tests/accessibility/**` is **excluded from vitest** — it cannot run there.
- Playwright browsers must be installed first: `npx playwright install chromium`.

### Running a Single Test File

```bash
npx vitest run tests/unit/toc.test.ts        # Single unit test file
npx playwright test tests/accessibility/axe.test.ts  # Single a11y test file
```

## Testing Strategy

### Test Pyramid

- **Unit Tests (~55%)**: Pure functions in `lib/` — fence scanner, enhance preprocessor, TOC extraction, frontmatter parsing, tag registry, slug parity, config validator, reading-time estimator. 68 tests across 8 files.
- **Integration Tests (~45%)**: Full pipeline rendering with `react-markdown` — badges, external links, tables, malformed markdown, code blocks, images, task lists, theme toggle, error boundary, back-to-top, mobile nav, copy button, editorial template, dev warnings. 55 tests across 10 files.
- **Accessibility**: axe-core via Playwright — WCAG 2.2 AA in light and dark modes. 2 tests in 1 file.
- **Performance**: Bundle size gate (< 250 KB gzipped). 1 test.
- **Total**: 124 vitest tests + 2 Playwright tests = 126.

### Test Standards

- Unit tests use vitest with `jsdom` environment and `@testing-library/jest-dom`.
- Integration tests use `@testing-library/react` with `render` and `screen`.
- The badge integration test must run `enhanceMarkdown` before `MarkdownRenderer` — badges only render from pre-wrapped backtick code.
- Badge test registries must have unique values across tags — the resolver returns the first match.
- Slug parity tests must compare against `slugger.slug(text.trim())` — `buildToc` trims heading text before slugging.
- Accessibility tests run via Playwright against the built `dist/` served on :4173.

### Coverage Thresholds

- Lines/Functions/Statements: 80%
- Branches: 75%

## Code Quality Standards

### Linting & Formatting

```bash
npm run lint              # ESLint (flat config, zero-warning policy)
npm run lint:format       # Prettier check
npm run lint:markdown     # markdownlint-cli2
```

- ESLint 9 with flat config (`eslint.config.js`).
- `typescript-eslint` recommended rules for TypeScript-specific checks.
- `eslint-plugin-react-hooks` catches hook misuse.
- `eslint-plugin-jsx-a11y` catches accessibility anti-patterns.
- `@typescript-eslint/consistent-type-imports` enforces `import type`.
- `@typescript-eslint/no-explicit-any` blocks `any` (use `unknown`).
- Zero-warning policy: `--max-warnings 0`.
- Prettier: 100-char print width, double quotes, trailing comma all, semi true (`.prettierrc.json`).
- markdownlint: MD022/MD031/MD032/MD037/MD038/MD039/MD047/MD050 enabled; MD013/MD033/MD034/MD041/MD036/MD040/MD046 disabled (`.markdownlint-cli2.jsonc`).

### Pre-commit Hook (configured)

The `.husky/pre-commit` hook runs `npx lint-staged` (ESLint --fix + Prettier --write + markdownlint --fix on staged files) followed by `npm run typecheck`. A failure blocks the commit. Per project policy, no guardrail is weakened to make a commit pass — fix the cause, not the symptom.

```bash
npx husky install         # One-time setup (auto-runs via `npm run prepare`)
```

The `lint-staged` config lives in `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css}": ["prettier --write"],
    "*.md": ["prettier --write", "markdownlint-cli2 --fix"]
  }
}
```

### CI Workflow (configured)

`.github/workflows/ci.yml` defines two jobs that run on every push and PR to `main`/`master`:

- **quality**: typecheck → lint → lint:format → lint:markdown → test:coverage → build → test:bundle-size. Uploads coverage + dist artifacts.
- **accessibility**: build → `npx playwright install chromium --with-deps` → `npm run a11y`. Uploads Playwright report.

Concurrency cancels in-progress runs when a new commit is pushed.

## Architecture

### Rendering Pipeline (Data Flow)

```
src/content/document.md
    ↓ import via ?raw
documentMd (string)
    ↓ parseDocument()
{ frontmatter, body }
    ↓
    ├──→ enhanceMarkdown(body, registry) → enhanced string
    ├──→ buildToc(body, 4) → TocItem[]
    └──→ frontmatter.title → page heading
         ↓
    MarkdownRenderer(enhanced, registry) → React elements
```

**Critical ordering:** `enhanceMarkdown` **must** run before `MarkdownRenderer`. Badges only render from pre-wrapped backtick code.

**Critical detail:** `buildToc` consumes **`body`** (not `enhanced`). The TOC doesn't need badge wrapping — it needs raw heading text.

### Memoization in App.tsx

Every derived value is memoized to prevent re-computation:

```typescript
const { frontmatter, body } = useMemo(() => parseDocument(markdown), []);
const registry = useMemo(() => loadRegistry(TAGS), []);
const enhanced = useMemo(() => enhanceMarkdown(body, registry), [body, registry]);
const toc = useMemo(() => buildToc(body, 4), [body]);
```

### Badge System (Backtick-Wrapping Pattern)

The bridge between markdown text and React components:

1. Author writes: `- **Severity:** critical`
2. `enhanceMarkdown` wraps: `- **Severity:** \`critical\``
3. react-markdown parses: inline code element with `children="critical"`
4. `code` component: `resolveBadge(registry, "critical")` → `<Badge tag="Severity" value="Critical" accent={1} />`

- Badge values must be **unique across all tags** — registry collision detection throws at load time.
- Tag registry: `src/templates/technical/tags.json`.
- Resolver: `src/lib/tags.ts` — first match wins.

### TOC + Navigation Engine

- Extracts H2–H4 headings from `body` (not `enhanced`).
- Uses a stack algorithm for correct nesting: the `while` loop pops until the top's level < current's level.
- Slug parity between `github-slugger` (TOC) and `rehype-slug` (rendered headings) is verified by `slug-parity.test.ts`.
- `headingText()` normalizes heading text: strips backticks, images → alt text, links → link text, trims.
- Active-section highlighting uses `IntersectionObserver` with `rootMargin: "-80px 0px -80% 0px"`.

### github-slugger Import

```typescript
// CORRECT — default export class
import GithubSlugger from "github-slugger";

// WRONG — no named { slug } export exists
import { slug } from "github-slugger";
```

### Fence-Aware Scanning

Both `buildToc` and `enhanceMarkdown` consume `scanLines()` from `src/lib/fence.ts` to avoid processing content inside code fences. A `## comment` inside a ``` fence neither enters the TOC nor consumes a slug counter.

### Template Switching

Edit **only** `src/templates/active.ts`:

- Change the three import paths
- Change `TEMPLATE_NAME`

The template provides: theme CSS (side-effect import), component map overrides, layout component, default tag registry.

### Dark Mode (Two-Layer Token Pattern)

**Layer 1** — runtime variables in `:root`, flipped by `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]`:

- System dark: `:root:not([data-theme="light"]) { ... }`
- Manual override: `[data-theme="dark"] { ... }`

**Layer 2** — `@theme inline` bridges variables into Tailwind utilities:

```css
@theme inline {
  --color-bg: var(--bg);
  --color-text: var(--text);
  /* ... */
}
```

### Design Token Reference (Technical Template)

| Token              | Light     | Dark      | Usage              |
| ------------------ | --------- | --------- | ------------------ |
| `--bg`             | `#ffffff` | `#0f172a` | Page background    |
| `--text`           | `#0f172a` | `#f8fafc` | Headings           |
| `--text-secondary` | `#475569` | `#cbd5e1` | Body text          |
| `--text-tertiary`  | `#475569` | `#94a3b8` | Labels             |
| `--border`         | `#e2e8f0` | `#334155` | Borders            |
| `--accent`         | `#2563eb` | `#60a5fa` | Links, focus rings |
| `--accent-1`       | `#dc2626` | `#f87171` | Badge: critical    |
| `--accent-2`       | `#f59e0b` | `#fbbf24` | Badge: warning     |
| `--accent-3`       | `#2563eb` | `#60a5fa` | Badge: info        |
| `--accent-4`       | `#10b981` | `#34d399` | Badge: success     |
| `--accent-5`       | `#8b5cf6` | `#a78bfa` | Badge: neutral     |

All text tokens meet WCAG 2.2 AA (≥ 4.5:1 contrast). Verified by axe-core.

### Z-Index Layer Map

| z-index | Element                        | File           |
| ------- | ------------------------------ | -------------- |
| `z-50`  | Skip-to-content link (focused) | `SkipLink.tsx` |
| `z-40`  | Sticky header                  | `layout.tsx`   |

### Component Architecture

```
src/
├── App.tsx                          # Layout assembly + memoized pipeline state + active-section observer + dev warnings
├── main.tsx                         # Entry: StrictMode + ErrorBoundary + createRoot
├── index.css                        # Fonts @import + @import "tailwindcss"
├── vite-env.d.ts                    # Vite client types + *.md?raw declaration
├── components/
│   ├── MarkdownRenderer.tsx         # react-markdown renderer + full components map + CodeBlockWrapper
│   ├── TableOfContents.tsx          # Recursive TOC with active-section styling + aria-label
│   ├── Badge.tsx                    # Tag-aware badge chip (5 accent steps)
│   ├── ErrorBoundary.tsx            # Class component render error catcher (stores errorInfo)
│   ├── ErrorFallback.tsx            # Presentational fallback UI with reload
│   ├── SkipLink.tsx                 # Accessible skip-to-content
│   ├── ThemeToggle.tsx              # Light/dark/system toggle (lucide icons + aria-live + matchMedia subscription)
│   ├── BackToTop.tsx                # Floating scroll-to-top button (respects reduced motion)
│   ├── MobileNav.tsx                # Mobile TOC drawer (dialog + focus trap + Escape + body scroll lock)
│   └── CopyButton.tsx               # Clipboard copy with execCommand fallback
├── content/
│   └── document.md                  # Input markdown (323 lines, 0 badge annotations)
├── templates/
│   ├── active.ts                    # THE single edit point for template switching
│   ├── technical/                   # Three-column technical docs template (default)
│   │   ├── theme.css                # Two-layer token pattern (light + dark + print)
│   │   ├── components.tsx           # Component map overrides (h2, h3, h4, a)
│   │   ├── layout.tsx               # Three-column shell + meta line + MobileNav + BackToTop
│   │   └── tags.json                # Status + Visibility registry
│   └── editorial/                   # Single-column long-form reading template
│       ├── theme.css                # Warm cream-and-serif palette (light + dark + print)
│       ├── components.tsx           # Larger headings, italic H3
│       ├── layout.tsx               # Hero + single-column shell
│       └── tags.json                # Severity + Confidence registry
├── lib/
│   ├── fence.ts                     # Fence-aware line scanner (CommonMark subset)
│   ├── enhance.ts                   # Tag-aware regex preprocessor (backtick-wrapping, 3-space indent)
│   ├── toc.ts                       # H2–H4 outline extraction with slug reservation
│   ├── tags.ts                      # Registry validation + collision detection + resolver
│   ├── frontmatter.ts               # YAML frontmatter parse + strip (BOM-safe, CRLF-safe)
│   ├── reading-time.ts              # Prose-word reading-time estimator (200 wpm, CJK-aware)
│   └── config.ts                    # Optional MarkdownToWebConfig validator
├── types/
│   ├── tag.ts                       # TagDefinition, TagRegistry, ResolvedBadge (canonical home)
│   ├── toc.ts                       # TocItem (canonical home)
│   ├── frontmatter.ts               # Frontmatter, ParsedDocument
│   ├── template.ts                  # TemplateConfig, TemplateLayoutProps, ComponentsMap
│   ├── config.ts                    # MarkdownToWebConfig
│   └── enhance.ts                   # EnhanceResult
└── utils/
    ├── cn.ts                        # clsx + tailwind-merge
    └── theme-storage.ts             # localStorage with try/catch + in-memory fallback
```

**File counts:** 38 source files, 20 test files, 124 vitest tests + 2 Playwright tests = 126 total.

## Git & Version Control

### Commit Standards

- Follow Conventional Commits format (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`)
- Atomic commits (one logical change per commit)

## Error Handling & Debugging

### Error Handling Approach

- **Build-time:** `loadRegistry()` throws if tag values collide — fails fast at startup.
- **Render-time:** `ErrorBoundary` catches React render errors, shows `ErrorFallback` with reload button.
- **Storage:** `theme-storage.ts` wraps `localStorage` in try/catch with in-memory fallback for sandboxed contexts.
- **Accessibility:** `ErrorFallback` uses `role="alert"` and `aria-live="assertive"` for screen reader announcements.

### Debugging Guide

| Symptom                                       | Cause                                      | Fix                                                             |
| --------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------- |
| `Cannot find package 'jsdom'`                 | jsdom not installed                        | `npm install -D jsdom`                                          |
| `Option baseUrl is deprecated`                | TS 6 deprecation                           | Remove `baseUrl` from tsconfig; use `paths`                     |
| `peer vite@"^5\|^6\|^7"` conflict             | Plugin predates Vite 8                     | Use `@tailwindcss/vite@4.3.3+`, `vite-plugin-singlefile@2.3.3+` |
| `Executable doesn't exist` (Playwright)       | Browsers not installed                     | `npx playwright install chromium`                               |
| Badge renders as plain `<code>`               | Markdown not run through `enhanceMarkdown` | Pipeline: `enhanceMarkdown` → `MarkdownRenderer`                |
| `getByLabelText` finds wrong badge            | Value collision across tags                | Ensure unique values in registry                                |
| Slug parity test fails on whitespace          | `buildToc` trims heading text              | Compare against `slugger.slug(text.trim())`                     |
| `color-contrast` AA violation                 | Text token too light for background        | Darken token (see Design Token Reference)                       |
| `Property 'env' does not exist on ImportMeta` | Missing Vite client types                  | Add `/// <reference types="vite/client" />`                     |
| `Cannot find name 'fs'/'path'/'process'`      | Missing `@types/node`                      | `npm install -D @types/node` + add to tsconfig `types`          |
| `calling test() from async test.describe()`   | Playwright tests under vitest              | Run `npx playwright test` instead                               |
| Build exceeds 250 KB gzipped                  | Large markdown or un-tree-shaken icons     | Subset lucide-react imports                                     |

## Project-Specific Standards

### Content Update Procedure

1. Replace `src/content/document.md` with any Markdown file.
2. Run `npm run build` — the pipeline handles frontmatter, tables, headings, links automatically.
3. If the content uses badge annotations (`**Tag:** value`), add the tag to `src/templates/technical/tags.json`.
4. Run `npm run a11y` to verify accessibility in both light and dark modes.

### Adding a New Template

1. Create `src/templates/<name>/` with `theme.css`, `components.tsx`, `layout.tsx`, and `tags.json`.
2. `theme.css` must follow the two-layer token pattern (Layer 1 `:root` variables + Layer 2 `@theme inline` bridge). **Never nest `@theme` inside `@media`.**
3. `components.tsx` exports a partial `ComponentsMap` that merges with the default map in `MarkdownRenderer.tsx`.
4. `layout.tsx` exports a React component receiving `TemplateLayoutProps`.
5. Update `src/templates/active.ts` with the new import paths and `TEMPLATE_NAME`.

### Adding a New Tag

1. Add the tag to `src/templates/technical/tags.json` (or a document-local registry).
2. Define allowed values and accent steps (1–5). Values MUST be lowercase.
3. Run `npm run test` — the `tags.test.ts` suite should pick up the new tag automatically. Verify no collision.
4. Markdown usage: `- **TagName:** value`

### Accessibility Requirements

- WCAG 2.2 AA enforced by axe-core via Playwright.
- All interactive elements ≥ 44×44px (`min-w-11 min-h-11`).
- All text tokens ≥ 4.5:1 contrast ratio (verified by axe).
- Skip-to-content link, focus-visible rings, reduced-motion support, semantic landmarks, ARIA labels.
- The axe gate runs in **both light and dark modes**.

## Success Metrics

You are successful when:

- All 124 vitest tests pass (68 unit, 55 integration, 1 performance).
- Both Playwright a11y tests pass (light + dark mode).
- `npm run typecheck` produces zero errors.
- `npm run lint` produces zero warnings.
- `npm run lint:format` reports "All matched files use Prettier code style!".
- `npm run lint:markdown` reports "0 error(s)".
- `npm run test:coverage` meets thresholds (lines/functions/statements 80%, branches 75%).
- `npm run build` produces a single-file `dist/index.html` under 250 KB gzipped.
- `npm run a11y` reports zero WCAG 2.2 AA violations in both light and dark modes.
- The rendered page renders all markdown content (headings, tables, links, code blocks, images, task lists) correctly.
- The mobile TOC drawer opens/closes correctly on screens < `lg`.
- The back-to-top button appears after scrolling past one viewport.
- Code-block copy buttons copy text to the clipboard.
- Reading time displays in the layout meta line.
- Print stylesheet hides chrome and forces light-mode colors.
- Theme toggle cycles light → dark → system and persists across reload.

## Anti-Patterns to Avoid

- **Don't use `dangerouslySetInnerHTML`** to render markdown output — use the components map.
- **Don't nest `@theme` inside `@media`** — it silently breaks dark mode.
- **Don't use `import { slug } from "github-slugger"`** — no named export exists.
- **Don't use `baseUrl` in TypeScript 6** — it's deprecated.
- **Don't run Playwright tests under vitest** — they use incompatible test APIs.
- **Don't forget `jsdom`** when configuring vitest with `environment: "jsdom"`.
- **Don't forget `npx playwright install chromium`** before the first `npm run a11y`.
- **Don't reuse badge values across different tags** — the resolver returns the first match silently.
- **Don't compare slug parity against untrimmed heading text** — `buildToc` trims before slugging.
- **Don't use light text tokens without contrast checking** — WCAG AA requires 4.5:1.
- **Don't use Tailwind `dark:` utilities** — dark mode is via `data-theme` attribute.
- **Don't pass `enhanced` markdown to `buildToc`** — it consumes `body`, not `enhanced`.
