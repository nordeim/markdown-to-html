# AGENTS.md — Markdown-to-Web Pipeline

## What This Is

A zero-backend React app that renders a Markdown document (`src/content/document.md`) as a polished, navigable, single-file web page. Output: `dist/index.html` with JS/CSS inlined (165 KB gzipped).

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
npm run test:coverage    # Vitest with coverage (enforces 80/75/80/80 thresholds)
npm run test:bundle-size # Bundle < 250KB gzipped gate

npm run lint             # ESLint (flat config, zero-warning policy)
npm run lint:format      # Prettier check
npm run lint:markdown    # markdownlint-cli2

npm run a11y             # Accessibility (Playwright + axe) — WCAG 2.2 AA gate
```

## Quality Gates (8 gates, run in order)

```bash
npm run typecheck        # Gate 1: TypeScript strict
npm run lint             # Gate 2: ESLint
npm run lint:format      # Gate 3: Prettier
npm run lint:markdown    # Gate 4: markdownlint
npm run test             # Gate 5: vitest (unit + integration + bundle-size)
npm run test:coverage    # Gate 6: coverage thresholds (80/75/80/80)
npm run build            # Gate 7: vite production build
npm run a11y             # Gate 8: axe-core WCAG 2.2 AA (requires `npx playwright install chromium`)
```

The CI workflow (`.github/workflows/ci.yml`) runs gates 1–7 on every push/PR. The a11y gate runs in a separate CI job.

## Test Runner Split

**Two different test runners. Do not confuse them.**

| Runner     | Command        | What it runs                                              |
| ---------- | -------------- | --------------------------------------------------------- |
| vitest     | `npm run test` | `tests/unit/`, `tests/integration/`, `tests/performance/` |
| Playwright | `npm run a11y` | `tests/accessibility/`                                    |

- `tests/accessibility/**` is **excluded from vitest** — it cannot run there.
- Playwright browsers must be installed first: `npx playwright install chromium`

## Test Inventory (124 tests across 20 files)

| Suite              | File                          | Tests          |
| ------------------ | ----------------------------- | -------------- |
| Unit               | `fence.test.ts`               | 5              |
| Unit               | `enhance.test.ts`             | 10             |
| Unit               | `toc.test.ts`                 | 9              |
| Unit               | `frontmatter.test.ts`         | 7              |
| Unit               | `tags.test.ts`                | 6              |
| Unit               | `slug-parity.test.ts`         | 9              |
| Unit               | `config.test.ts`              | 14             |
| Unit               | `reading-time.test.ts`        | 8              |
| Integration        | `markdown-rendering.test.tsx` | 4              |
| Integration        | `code-block.test.tsx`         | 5              |
| Integration        | `images.test.tsx`             | 5              |
| Integration        | `task-lists.test.tsx`         | 4              |
| Integration        | `dev-warnings.test.tsx`       | 1              |
| Integration        | `theme-toggle.test.tsx`       | 9              |
| Integration        | `error-boundary.test.tsx`     | 4              |
| Integration        | `back-to-top.test.tsx`        | 5              |
| Integration        | `mobile-nav.test.tsx`         | 9              |
| Integration        | `copy-button.test.tsx`        | 4              |
| Integration        | `editorial-template.test.tsx` | 5              |
| Performance        | `bundle-size.test.ts`         | 1              |
| **Total (vitest)** |                               | **124**        |
| Accessibility      | `axe.test.ts`                 | 2 (Playwright) |

## Critical Architecture

### Rendering Pipeline (order matters)

```
document.md → parseDocument() → { frontmatter, body }
    body → enhanceMarkdown() → enhanced string (badge backtick-wrapping)
    body → buildToc()         → TocItem[] (H2–H4 extraction)
    body → estimateReadingTime() → "N min read"
    enhanced → MarkdownRenderer → React elements (react-markdown)
```

- `enhanceMarkdown` **must run before** `MarkdownRenderer` — badges only render from pre-wrapped backtick code.
- `buildToc` consumes **`body` (not `enhanced`)** — TOC doesn't need badge wrapping.
- `estimateReadingTime` consumes **`body`** — strips fenced code and markdown syntax before counting words.

### Badge System (Backtick-Wrapping Pattern)

```markdown
- **Severity:** critical ← Author writes this
- **Severity:** `critical` ← enhanceMarkdown wraps value
```

react-markdown parses `` `critical` `` as inline code → `code` component → `resolveBadge()` → `<Badge>`.

- Badge values must be **unique across all tags** (registry collision detection).
- Tag registry: per-template `tags.json` (e.g. `src/templates/technical/tags.json`).
- Resolver: `src/lib/tags.ts` — first match wins.

### github-slugger Import

```typescript
// CORRECT — default export class
import GithubSlugger from "github-slugger";

// WRONG — no named export exists
import { slug } from "github-slugger";
```

### Template Switching

Two templates are implemented: `technical` (default) and `editorial`.

Edit **only** `src/templates/active.ts`:

- Change the four import paths (`theme.css`, `components`, `layout`, `tags.json`)
- Change `TEMPLATE_NAME`

The template provides: theme CSS (side-effect import), component map overrides, layout component, default tag registry.

### Dark Mode (Two-Layer Token Pattern)

**Never nest `@theme` inside `@media`** — it silently breaks dark mode.

Correct pattern (`src/templates/{technical,editorial}/theme.css`):

1. **Layer 1:** `:root` variables flipped by `@media` / `[data-theme]`
2. **Layer 2:** `@theme inline` bridges variables into Tailwind utilities

Dark mode is applied via `data-theme="dark"` on `<html>`, **not** Tailwind `dark:` utilities.

### Theme Toggle

`ThemeToggle` uses `lucide-react` icons (`Sun`, `Moon`, `Monitor`) — not emojis. It subscribes to `matchMedia("(prefers-color-scheme: dark)")` change events when in system mode, so OS theme changes are reflected immediately without page reload. A visually-hidden `aria-live="polite"` region announces theme changes to screen readers.

### Mobile Navigation

`MobileNav` is a slide-in drawer for the TOC, visible on screens below the `lg` breakpoint. It uses `role="dialog"` + `aria-modal="true"`, closes on Escape / link click / backdrop click, traps focus while open, and locks body scroll.

### Reading Time

`estimateReadingTime(body)` returns a string like `"5 min read"`. It strips fenced code blocks, counts Latin words + CJK characters (each CJK char = 1 word), divides by 200 wpm, rounds up.

### Code Block Copy Button

Each `<pre>` is wrapped by `CodeBlockWrapper`, which renders a `CopyButton` at the top-right. The button uses `navigator.clipboard.writeText` with a `document.execCommand` fallback for older browsers.

### Back to Top

`BackToTop` is a floating button that appears after scrolling past one viewport. Clicking it scrolls to top smoothly (or instantly when `prefers-reduced-motion` is enabled). `aria-hidden` and `tabIndex` reflect visibility.

## TypeScript Strictness

- `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` — all enabled.
- With `noUncheckedIndexedAccess`, use optional chaining: `toc[0]?.slug`
- `import type` for type-only imports (enforced by linter).
- No `baseUrl` in tsconfig — TS 6 deprecates it. Use `paths` with relative `./` prefix.

## CSS Import Order

`src/index.css`:

```css
@import url("https://fonts.googleapis.com/css2?..."); /* Must be FIRST */
@import "tailwindcss"; /* Must be SECOND */
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

Verified by `npm run test:coverage`. The CI workflow enforces this.

## Configuration Surface (Optional)

`src/lib/config.ts` exports `resolveConfig(input: unknown): MarkdownToWebConfig` and `DEFAULT_CONFIG`. The type lives in `src/types/config.ts`. This is the team-extension surface — consume it if you need to validate config objects from external sources (e.g., a CLI or build-time plugin). The base pipeline does not require it.

## Key File Map

| Path                                  | Purpose                                                             |
| ------------------------------------- | ------------------------------------------------------------------- |
| `src/App.tsx`                         | Layout assembly + memoized pipeline state + active-section observer |
| `src/main.tsx`                        | Entry: StrictMode + ErrorBoundary + createRoot                      |
| `src/content/document.md`             | Input markdown (the catalog)                                        |
| `src/templates/active.ts`             | Template switching (single edit point)                              |
| `src/templates/technical/`            | Technical template (three-column, cool palette)                     |
| `src/templates/editorial/`            | Editorial template (single-column, warm serif)                      |
| `src/templates/{name}/theme.css`      | Design tokens (two-layer dark mode + print)                         |
| `src/lib/fence.ts`                    | Fence-aware line scanner (shared by TOC + enhance + reading-time)   |
| `src/lib/enhance.ts`                  | Badge backtick-wrapping preprocessor                                |
| `src/lib/toc.ts`                      | H2–H4 TOC extraction with slug reservation                          |
| `src/lib/tags.ts`                     | Registry validation + badge resolver                                |
| `src/lib/frontmatter.ts`              | YAML frontmatter parse + strip                                      |
| `src/lib/reading-time.ts`             | Reading-time estimator (200 wpm, CJK-aware)                         |
| `src/lib/config.ts`                   | Optional config validator (MarkdownToWebConfig)                     |
| `src/components/MarkdownRenderer.tsx` | react-markdown renderer + components map + CodeBlockWrapper         |
| `src/components/TableOfContents.tsx`  | Recursive TOC with active-section styling                           |
| `src/components/Badge.tsx`            | Tag-aware badge chip (5 accent steps)                               |
| `src/components/ErrorBoundary.tsx`    | Class component render error catcher                                |
| `src/components/ErrorFallback.tsx`    | Presentational fallback UI with reload                              |
| `src/components/SkipLink.tsx`         | Accessible skip-to-content                                          |
| `src/components/ThemeToggle.tsx`      | Light/dark/system toggle (lucide icons + aria-live)                 |
| `src/components/BackToTop.tsx`        | Floating scroll-to-top button                                       |
| `src/components/MobileNav.tsx`        | Mobile TOC drawer (dialog + focus trap)                             |
| `src/components/CopyButton.tsx`       | Clipboard copy with execCommand fallback                            |
| `src/utils/cn.ts`                     | `clsx` + `tailwind-merge`                                           |
| `src/utils/theme-storage.ts`          | `localStorage` with try/catch fallback                              |

## Pre-Commit Hook

`.husky/pre-commit` runs `npx lint-staged` (ESLint + Prettier + markdownlint on staged files) followed by `npm run typecheck`. A failure blocks the commit. Per project policy, no guardrail is weakened to make a commit pass — fix the cause, not the symptom.

## CI Workflow

`.github/workflows/ci.yml` defines two jobs:

- `quality`: typecheck → lint → format → markdown → test:coverage → build → bundle-size. Uploads coverage + dist artifacts.
- `accessibility`: build → install Playwright chromium → `npm run a11y`. Uploads Playwright report.

Triggers: push and PR to main/master. Concurrency cancels in-progress runs.

## Known Limitations

- **`parseDocument` supports flat `key: value` YAML only.** No nested YAML, arrays, or multiline values. Swap in `gray-matter` if needed (preserves all contracts).
- **`index.html` `lang="en"` is hardcoded.** For non-English documents, update `index.html` or set `lang` dynamically.
- **`theme-storage.ts` storage key is hardcoded to `"theme"`.** Two markdown-to-web instances on the same domain collide. Namespace if needed.
- **`tests/accessibility/**` requires `npx playwright install chromium`** before the first `npm run a11y` run.

## Don't

- Don't use `dangerouslySetInnerHTML` for markdown — use the components map.
- Don't run `npx playwright test` via vitest — they're incompatible.
- Don't put `tests/accessibility/**` in the vitest run (already excluded).
- Don't reuse badge values across different tags.
- Don't forget `npx playwright install chromium` before first `npm run a11y`.
- Don't nest `@theme` inside `@media` — it silently breaks dark mode.
- Don't use `baseUrl` in TS 6 — deprecated.
- Don't edit `package.json` `lint-staged` config without verifying the hook still works.
