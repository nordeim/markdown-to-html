# Skills Catalog — Master Project Architecture Document (PAD) v1.1

**Classification:** Internal Engineering Reference
**Status:** DEFINITIVE, PRODUCTION-LOCKED BLUEPRINT
**Companion Documents:** `CLAUDE.md` (agent instructions), `AGENTS.md` (compact onboarding), `README.md` (project overview), `docs/markdown-html-pipeline_SKILL.md` (detailed skill reference)
**Last Updated:** 2026-08-07
**Audience:** Senior Engineers, Tech Leads, DevOps, and Onboarding Engineers
**Rule:** Every architectural decision in this document traces to a specific rationale.
           Nothing is here "because it's popular."

---

#### Revision Block — v1.1

- `[SR, UPDATE]` Full alignment audit against current codebase. Fixed 30+ discrepancies across 9 of 11 sections.
- `[CA, VERSIONS]` Corrected Vite (`^8.2.1` → `^8.2.0`), TypeScript (`~6.0.3` → `~6.0.2`), Playwright (`1.62.1` → `^1.40.0`). Added missing packages (@vitest/coverage-v8, husky, lint-staged, prettier, markdownlint-cli2).
- `[CA, TESTS]` Rebuilt test inventory: 9 files/42 tests → 21 files/126 tests. Added 10 missing integration test files. Fixed per-file test counts.
- `[CA, STRUCTURE]` Added 17 missing files to directory structure (BackToTop, MobileNav, CopyButton, reading-time, config, enhance type, editorial template files, CI workflow, Husky, configs).
- `[CA, METRICS]` Updated all size metrics (492→598 KB raw, 162→165 KB gzipped), file counts (29→39), line counts (923→2,474), and 11 file line counts in key files table.
- `[CA, SECURITY]` Rewrote §8.4 CI/CD from "None configured" to actual 2-job pipeline description.
- `[CA, ISSUES]` Removed 3 false known issues (README.md, MobileNav, CI/CD). Added 2 new items (editorial template, __dirname monitoring).
- `[CA, HEADER]` Bumped version v1.0 → v1.1. Added README.md to companion documents.

---

## Table of Contents

1. [System Overview & Decisions](#1-system-overview--decisions)
2. [High-Level System Topology](#2-high-level-system-topology)
3. [Application Architecture](#3-application-architecture)
4. [Data Architecture](#4-data-architecture)
5. [Design System Reference](#5-design-system-reference)
6. [Security Architecture](#6-security-architecture)
7. [Testing Strategy](#7-testing-strategy)
8. [Build & Deployment](#8-build--deployment)
9. [Developer Handbook](#9-developer-handbook)
10. [Known Issues & Outstanding Tasks](#10-known-issues--outstanding-tasks)
11. [Key Files Reference](#11-key-files-reference)

---

## 1. System Overview & Decisions

### 1.1 Document Metadata & Purpose

This PAD is the single source of truth for the Skills Catalog markdown-to-web pipeline. It captures not just _what_ the system is, but _why_ every decision was made and _how_ every component fits together.

**How to use this document:**
- **New engineer:** Read §1–§3 for architecture, §9 for setup, §11 for file map
- **Debugging:** See §6 (security), §10 (known issues), code patterns in §3.3
- **Reviewing tech choices:** See §1.3 (ADRs) for rationale behind every major decision
- **Extending the system:** See §3.1 (layer model), §3.3 (critical patterns), §5 (design system)

### 1.2 Technology Stack Summary

| Layer | Technology | Version | Key Rationale |
|-------|------------|---------|---------------|
| UI Runtime | React | `^19.2.8` | Latest stable; StrictMode + createRoot |
| Build Tool | Vite | `^8.2.0` | Latest scaffold default; fast HMR, single-file plugin ecosystem |
| Build Plugin | @tailwindcss/vite | `^4.3.3` | **Must be ≥4.3.3 for Vite 8 peer compatibility** |
| Build Plugin | @vitejs/plugin-react | `^6.0.4` | Required for JSX transform |
| Build Plugin | vite-plugin-singlefile | `2.3.3` | **Must be ≥2.3.3 for Vite 8 peer compatibility** |
| Styling | Tailwind CSS | `^4.3.3` | CSS-first `@theme`; no JS config needed |
| Markdown | react-markdown | `10.1.0` | Component-based rendering (no `dangerouslySetInnerHTML`) |
| GFM | remark-gfm | `4.0.1` | Tables, strikethrough, task lists |
| Heading Anchors | rehype-slug | `6.0.0` | Auto-generates `id` attributes on headings |
| TOC Slugs | github-slugger | `2.0.0` | Default export class; matches rehype-slug output |
| Class Utilities | clsx + tailwind-merge | `2.1.1` / `3.4.0` | Composable class merging without conflicts |
| Icons | lucide-react | `1.29.0` | Tree-shaken SVG icons |
| Language | TypeScript | `~6.0.2` | Strict mode with `noUncheckedIndexedAccess` |
| Test Runner | vitest | `^4.1.10` | Unit + integration + bundle-size + coverage |
| Coverage | @vitest/coverage-v8 | `^4.1.10` | v8 provider; enforces 80/75/80/80 thresholds |
| DOM Testing | jsdom | `^30.0.1` | Peer of vitest; NOT bundled |
| Testing Library | @testing-library/react | `^16.0.0` | Component rendering for integration tests |
| jest-dom | @testing-library/jest-dom | `^6.0.0` | DOM matchers (`toBeInTheDocument`) |
| E2E Runner | @playwright/test | `^1.40.0` | Accessibility testing with axe-core |
| A11y Scanner | @axe-core/playwright | `^4.12.1` | WCAG 2.2 AA automated gate |
| Node Types | @types/node | `^26.1.2` | Required for `fs`, `path`, `zlib`, `process` in tests |
| Lint | eslint | `^9.39.5` | Flat config; zero-warning policy |
| Lint Plugin | eslint-plugin-react-hooks | `^5.2.0` | Hook misuse detection |
| Lint Plugin | eslint-plugin-jsx-a11y | `^6.10.2` | JSX accessibility rules |
| Pre-commit | husky | `^9.0.0` | Runs lint-staged + typecheck on commit |
| Staging | lint-staged | `^15.0.0` | ESLint + Prettier + markdownlint on staged files |
| Format | prettier | `^3.0.0` | 100-char width, double quotes, trailing comma |
| Markdown lint | markdownlint-cli2 | `^0.14.0` | Content quality gate |

### 1.3 Architecture Decision Records (ADRs)

**ADR-001: Vite 8 Instead of Vite 7**

- **Context:** The Vite scaffold (`npm create vite@latest`) now installs Vite 8 by default. The original markdown-to-web skill spec pinned Vite 7.3.2.
- **Decision:** Use Vite 8 with updated plugin ecosystem (`@tailwindcss/vite@4.3.3`, `vite-plugin-singlefile@2.3.3`).
- **Rationale:** Using the latest scaffold default avoids manual downgrade and ensures ongoing security patches. Both plugins added Vite 8 support in their latest patch versions with no breaking changes.
- **Consequences:** Positive — latest features, security patches. Negative — original skill spec pins are stale; must verify peer ranges.
- **Alternatives Rejected:** Downgrading to Vite 7 — rejected because it requires manual intervention and misses security updates.

**ADR-002: react-markdown with Components Map (No `dangerouslySetInnerHTML`)**

- **Context:** Markdown must be rendered to HTML. Two approaches exist: (1) convert to HTML string and inject via `dangerouslySetInnerHTML`, or (2) use react-markdown's component map to render Markdown as React elements.
- **Decision:** Use react-markdown with a full components map. Never use `dangerouslySetInnerHTML`.
- **Rationale:** The component map approach provides type safety, React reconciliation, and enables the badge system (inline code elements route to `Badge` components). `dangerouslySetInnerHTML` creates an XSS surface and prevents the badge pipeline from working.
- **Consequences:** Positive — type safety, extensibility, badge support. Negative — larger bundle than a simple `marked` + sanitize approach.
- **Alternatives Rejected:** `marked` + `dompurify` + `dangerouslySetInnerHTML` — rejected due to XSS surface and inability to support the badge system.

**ADR-003: Two-Layer Token Pattern for Dark Mode**

- **Context:** Dark mode requires flipping color values at runtime. Tailwind v4 offers two approaches: (1) nest `@theme` inside `@media (prefers-color-scheme: dark)`, or (2) use runtime CSS variables flipped by media queries, bridged to Tailwind via `@theme inline`.
- **Decision:** Use the two-layer pattern — Layer 1 `:root` runtime variables flipped by `@media` / `[data-theme]`, Layer 2 `@theme inline` bridges to utilities.
- **Rationale:** Nesting `@theme` inside `@media` is invalid Tailwind v4 — `@theme` is a build-time, top-level directive. Nesting it silently breaks dark mode. The two-layer pattern is the only correct idiom.
- **Consequences:** Positive — dark mode works via variable flipping, manual override via `data-theme` attribute. Negative — requires duplicating the `@theme inline` block.
- **Alternatives Rejected:** `@theme`-in-`@media` — rejected because it silently fails. Tailwind `dark:` utilities — rejected because they require a `tailwind.config.js` (CSS-first config is the v4 idiom).

**ADR-004: github-slugger Default Export (Not Named)**

- **Context:** The TOC engine needs a slug generator that produces slugs matching `rehype-slug`'s output. `github-slugger` 2.0.0 is the standard package.
- **Decision:** Import as default export class: `import GithubSlugger from "github-slugger"`.
- **Rationale:** `github-slugger` 2.0.0 exports only the default `GithubSlugger` class. There is no named `{ slug }` export. Using a named import causes a build error.
- **Consequences:** Positive — matches rehype-slug output exactly (verified by `slug-parity.test.ts`). Negative — easy to guess wrong (many packages do export named functions).
- **Alternatives Rejected:** Custom slug function — rejected because it would diverge from rehype-slug's output, breaking anchor links.

**ADR-005: Dual Test Runners (vitest + Playwright)**

- **Context:** The project needs unit tests, integration tests, AND accessibility tests. Accessibility testing requires a real browser environment.
- **Decision:** Use vitest for unit/integration/bundle-size tests, and Playwright for accessibility tests. Exclude `tests/accessibility/**` from vitest.
- **Rationale:** vitest's jsdom environment cannot run Playwright's `test()` API (they're incompatible). Playwright provides a real browser for axe-core accessibility scanning. Splitting runners keeps each focused on its strength.
- **Consequences:** Positive — real-browser accessibility testing, fast unit tests. Negative — two test commands to remember (`npm run test` + `npm run a11y`), separate browser installation step.
- **Alternatives Rejected:** Running everything under vitest — rejected because jsdom doesn't support axe-core's full capabilities. Running everything under Playwright — rejected because it's slower for pure unit tests.

**ADR-006: Backtick-Wrapping Badge Pipeline**

- **Context:** The system needs to render inline annotations (e.g., `- **Severity:** critical`) as colored badge chips. This requires intercepting the markdown-to-React pipeline.
- **Decision:** Use a preprocessor (`enhanceMarkdown`) that wraps badge values in backticks (`` `critical` ``), which react-markdown parses as inline code, which the `code` component routes to `Badge` via the tag registry.
- **Rationale:** This approach requires no changes to react-markdown itself, no custom remark plugins, and no AST manipulation. The backtick-wrapping is a simple regex transform that leverages existing react-markdown behavior.
- **Consequences:** Positive — simple, extensible, no custom plugins. Negative — requires running `enhanceMarkdown` before `MarkdownRenderer` (ordering constraint).
- **Alternatives Rejected:** Custom remark plugin — rejected because it's more complex and harder to debug. AST-based badge processor — rejected because it disconnects from the React component that renders badges.

---

## 2. High-Level System Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         React Application                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │  App.tsx │→ │ parseDoc │→ │ enhance  │→ │ MarkdownRenderer │   │   │
│  │  │ (state)  │  │ (YAML)   │  │ (badges) │  │ (react-markdown) │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │   │
│  │       ↑              ↑              ↑              ↑                │   │
│  │  useMemo         useMemo        useMemo        components map       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                    ┌─────────┴─────────┐                                     │
│                    │  src/content/      │                                     │
│                    │  document.md       │                                     │
│                    │  (imported ?raw)   │                                     │
│                    └───────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           BUILD TIME (Vite)                                  │
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────────┐      │
│  │  React   │ +  │ Tailwind │ +  │  Single  │ →  │  dist/index.html │      │
│  │  Plugin  │    │  Plugin  │    │  File    │    │  (JS/CSS inlined)│      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────────────┘      │
│                                                                              │
│  Source: 39 files, ~2,474 lines → Output: 598 KB raw, 165 KB gzipped       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Google Fonts CDN (fonts.googleapis.com)                             │   │
│  │  ── Inter (400, 500, 600, 700) + JetBrains Mono (400, 500)         │   │
│  │  ── Loaded via @import in index.css (not JS)                        │   │
│  │  ── Failover: system fonts via Tailwind's font stack                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  No APIs. No databases. No authentication. No external data sources.        │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Scaling characteristics:** The output is a single static HTML file. It scales infinitely on any static host (GitHub Pages, Netlify, Vercel, S3, nginx) because there is no server-side computation. The only runtime dependency is the Google Fonts CDN (optional — system fonts failover gracefully).

---

## 3. Application Architecture

### 3.1 The Layer Model

This project uses a **pipeline architecture** with strict data flow:

**Layer 0 — Content (`src/content/`)** — The raw Markdown file. This is the single source of truth for all rendered content. **Rule:** Content is never generated in code — it always comes from this file.

**Layer 1 — Parsing (`src/lib/`)** — Pure functions that transform the raw string into structured data. **Rule:** All functions here are pure (no side effects, no React, no DOM). They can be unit-tested in isolation. The pipeline order is: `parseDocument` → `enhanceMarkdown` + `buildToc`.

**Layer 2 — State (`src/App.tsx`)** — React state management via `useMemo`. **Rule:** Every derived value is memoized. State flows down via props — no context, no global stores, no external state management.

**Layer 3 — Rendering (`src/components/`)** — React components that consume parsed data and produce UI. **Rule:** Components receive data via props — they never import content directly. The only exception is `App.tsx` which imports the markdown file.

**Layer 4 — Templates (`src/templates/`)** — Layout shells, theme CSS, component overrides. **Rule:** Templates are swappable via a single file edit (`active.ts`). The active template provides: theme CSS, component map overrides, layout component, default tag registry.

### 3.2 Annotated Directory Structure

```
skills-catalog/
├── CLAUDE.md                          # Agent instructions (comprehensive)
├── AGENTS.md                          # Compact agent onboarding
├── README.md                          # Project overview + quick start
├── index.html                         # HTML shell (<div id="root">)
├── package.json                       # Dependencies + scripts + lint-staged
├── package-lock.json                  # Locked dependency tree
├── vite.config.ts                     # Build: react + tailwind + singlefile
├── tsconfig.json                      # Strict TypeScript config (no baseUrl)
├── vitest.config.ts                   # Unit/integration/coverage config
├── playwright.config.ts               # Accessibility test runner
├── eslint.config.js                   # ESLint flat config (zero-warning)
├── .prettierrc.json                   # Prettier: 100-char width, double quotes
├── .markdownlint-cli2.jsonc           # Markdown lint rules
├── .husky/pre-commit                  # Pre-commit: lint-staged + typecheck
├── .github/workflows/ci.yml           # CI: quality + accessibility jobs
├── docs/
│   ├── Project_Architecture_Document.md  # This file
│   ├── markdown-html-pipeline_SKILL.md  # Detailed skill reference
│   ├── audit/                         # Audit + remediation logs
│   └── status.md                      # Current project status
├── src/
│   ├── main.tsx                       # Entry: StrictMode + ErrorBoundary + createRoot
│   ├── App.tsx                        # ← Pipeline orchestrator (memoized state)
│   │                                    # Imports markdown via ?raw
│   │                                    # Runs parseDocument, enhanceMarkdown, buildToc
│   │                                    # Manages IntersectionObserver for active section
│   ├── index.css                      # Fonts @import + @import "tailwindcss"
│   ├── vite-env.d.ts                  # Type declarations for *.md?raw and *.css
│   ├── components/
│   │   ├── MarkdownRenderer.tsx       # ← react-markdown renderer + full components map
│   │                                    # code component routes inline code to Badge
│   │                                    # pre wrapped by CodeBlockWrapper
│   │   ├── TableOfContents.tsx        # Recursive TOC with active-section styling
│   │   ├── Badge.tsx                  # Tag-aware badge chip (5 accent steps)
│   │   ├── ErrorBoundary.tsx          # Class component render error catcher
│   │   ├── ErrorFallback.tsx          # Presentational fallback with reload
│   │   ├── SkipLink.tsx               # Accessible skip-to-content link
│   │   ├── ThemeToggle.tsx            # Light/dark/system toggle (lucide + aria-live)
│   │   ├── BackToTop.tsx              # Floating scroll-to-top button
│   │   ├── MobileNav.tsx              # Mobile TOC drawer (dialog + focus trap)
│   │   └── CopyButton.tsx             # Clipboard copy with execCommand fallback
│   ├── content/
│   │   └── document.md                # ← THE INPUT (323 lines, 202 skills, 10 categories)
│   ├── lib/
│   │   ├── fence.ts                   # ← Fence-aware line scanner (CommonMark subset)
│   │                                    # Shared by buildToc, enhance, reading-time
│   │   ├── enhance.ts                 # ← Badge backtick-wrapping preprocessor
│   │                                    # Regex: wraps **Tag:** value → **Tag:** `value`
│   │   ├── toc.ts                     # ← H2–H4 outline extraction + slug generation
│   │                                    # Stack algorithm for correct nesting
│   │                                    # headingText() normalizes before slugging
│   │   ├── tags.ts                    # ← Registry validation + collision detection
│   │                                    # resolveBadge() returns first match
│   │   ├── frontmatter.ts             # ← YAML frontmatter parse + strip
│   │                                    # BOM-safe (strips U+FEFF), CRLF-safe
│   │   ├── reading-time.ts            # ← Prose-word reading-time estimator
│   │                                    # 200 wpm, CJK-aware, strips fenced code
│   │   └── config.ts                  # ← Optional MarkdownToWebConfig validator
│   ├── templates/
│   │   ├── active.ts                  # ← THE single edit point for template switching
│   │   ├── technical/                 # Three-column technical docs template (default)
│   │   │   ├── theme.css              # ← Two-layer token pattern (light + dark + print)
│   │   │   ├── components.tsx         # Component map overrides (h2, h3, h4, a)
│   │   │   ├── layout.tsx             # Three-column shell + meta line + MobileNav
│   │   │   └── tags.json              # Status + Visibility registry
│   │   └── editorial/                 # Single-column long-form reading template
│   │       ├── theme.css              # Warm cream-and-serif palette (light + dark + print)
│   │       ├── components.tsx         # Larger headings, italic H3
│   │       ├── layout.tsx             # Hero + single-column shell
│   │       └── tags.json              # Severity + Confidence registry
│   ├── types/
│   │   ├── tag.ts                     # TagDefinition, TagRegistry, ResolvedBadge
│   │   ├── toc.ts                     # TocItem
│   │   ├── frontmatter.ts             # Frontmatter, ParsedDocument
│   │   ├── template.ts                # TemplateConfig, TemplateLayoutProps, ComponentsMap
│   │   ├── config.ts                  # MarkdownToWebConfig
│   │   └── enhance.ts                 # EnhanceResult
│   └── utils/
│       ├── cn.ts                      # clsx + tailwind-merge
│       └── theme-storage.ts           # localStorage with try/catch + in-memory fallback
├── tests/
│   ├── setup.ts                       # @testing-library/jest-dom setup
│   ├── unit/                         # 68 tests across 8 files
│   │   ├── fence.test.ts              # 5 tests: fence delimiter tracking
│   │   ├── enhance.test.ts            # 10 tests: badge backtick-wrapping
│   │   ├── toc.test.ts                # 9 tests: TOC nesting + slug dedup
│   │   ├── frontmatter.test.ts        # 7 tests: YAML parse + strip
│   │   ├── tags.test.ts               # 6 tests: registry validation + resolver
│   │   ├── slug-parity.test.ts        # 9 tests: github-slugger === rehype-slug
│   │   ├── reading-time.test.ts       # 8 tests: reading-time estimator
│   │   └── config.test.ts             # 14 tests: config validator
│   ├── integration/                   # 55 tests across 11 files
│   │   ├── markdown-rendering.test.tsx # 4 tests: full pipeline rendering
│   │   ├── code-block.test.tsx         # 5 tests: code block + copy button
│   │   ├── images.test.tsx             # 5 tests: image rendering
│   │   ├── task-lists.test.tsx         # 4 tests: GFM task lists
│   │   ├── dev-warnings.test.tsx       # 1 test: enhance warnings
│   │   ├── theme-toggle.test.tsx       # 9 tests: theme cycling + aria-live
│   │   ├── error-boundary.test.tsx     # 4 tests: error catching
│   │   ├── back-to-top.test.tsx        # 5 tests: scroll-to-top
│   │   ├── mobile-nav.test.tsx         # 9 tests: mobile drawer
│   │   ├── copy-button.test.tsx        # 4 tests: clipboard copy
│   │   └── editorial-template.test.tsx # 5 tests: editorial template
│   ├── accessibility/                 # 2 tests (Playwright + axe)
│   │   └── axe.test.ts                # 2 tests: WCAG 2.2 AA (light + dark)
│   └── performance/                   # 1 test (bundle gate)
│       └── bundle-size.test.ts        # 1 test: < 250 KB gzipped
└── dist/
    └── index.html                     # ← OUTPUT (598 KB raw, 165 KB gzipped)
```

### 3.3 Critical Code Patterns

#### Pattern 1: Pipeline Memoization (App.tsx)

```typescript
// All three parsing steps are memoized to prevent re-computation on re-render.
// parseDocument: strips YAML frontmatter, returns { frontmatter, body }
const { frontmatter, body } = useMemo(() => parseDocument(markdown), []);

// enhanceMarkdown: wraps badge values in backticks for react-markdown parsing
const enhanced = useMemo(
  () => enhanceMarkdown(body, registry),
  [body, registry],  // Only re-computes when body or registry changes
);

// buildToc: extracts H2–H4 headings, generates slugs matching rehype-slug
// NOTE: consumes `body`, NOT `enhanced` — TOC doesn't need badge wrapping
const toc = useMemo(() => buildToc(body, 4), [body]);
```

**Why this pattern:** Without memoization, every re-render (e.g., from `activeSlug` state change) would re-run all three parsing functions, including regex scanning the entire 323-line document. With memoization, parsing runs once on mount and never again unless the markdown changes.

#### Pattern 2: Stack-Based TOC Nesting (toc.ts)

```typescript
const ANY_HEADING_RE = /^(#{1,6})\s+(.+)$/;

export function buildToc(markdown: string, maxDepth: 2 | 3 | 4 = 4): TocItem[] {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const { line, insideFence } of scanLines(markdown)) {
    if (insideFence) continue;  // Skip code fence content
    const match = line.match(ANY_HEADING_RE);
    if (!match) continue;

    const level = match[1]!.length;
    const text = headingText(match[2]!);  // Normalize: strip backticks, images, links
    const slug = slugger.slug(text);       // Reserve slug at EVERY level (H1–H6)

    if (level < 2 || level > maxDepth) continue;

    const item: TocItem = { level: level as 2 | 3 | 4, text, slug, children: [] };

    // THE STACK ALGORITHM: pop until top's level < current's level
    // This correctly handles: H2→H3 (nest), H3→H2 (un-nest), H2→H4 (skip level)
    while (stack.length > 0 && stack[stack.length - 1]!.level >= level) {
      stack.pop();
    }
    if (stack.length === 0) items.push(item);      // Top-level heading
    else stack[stack.length - 1]!.children.push(item);  // Nested under parent
    stack.push(item);
  }
  return items;
}
```

**Why this pattern:** The stack algorithm correctly handles all heading transitions: nesting (H2→H3), un-nesting (H3→H2), skip levels (H2→H4), and orphans (H3 before any H2). The `while` loop pops until the top of the stack has a level strictly less than the current heading — this is the invariant that ensures correct nesting.

#### Pattern 3: Backtick-Wrapping Badge Pipeline (enhance.ts)

```typescript
// Matches: "- **Tag:** value", "* **Tag:** value", "1. **Tag:** value"
const BADGE_LINE_RE = /^(\s*(?:[-*+]\s+|\d{1,9}[.)]\s+))\*\*([^*]+):\*\*\s+(.+)$/;

export function enhanceMarkdown(markdown: string, registry: TagRegistry): EnhanceResult {
  const warnings: string[] = [];
  const out: string[] = [];

  for (const { line, lineNumber, insideFence } of scanLines(markdown)) {
    if (insideFence) { out.push(line); continue; }  // Leave fenced content untouched

    const match = line.match(BADGE_LINE_RE);
    if (!match) { out.push(line); continue; }  // Not a badge line — leave unchanged

    const [, bullet, rawTag, rawValue] = match;
    const def = findTag(registry, rawTag!.trim());
    if (!def) { out.push(line); continue; }  // Tag not registered — leave unchanged

    const value = rawValue!.trim();
    if (!def.values[value.toLowerCase()]) {
      warnings.push(`line ${lineNumber}: unknown value "${value}" for tag "${def.name}"`);
      out.push(line);  // Unknown value — leave unchanged, emit warning
      continue;
    }

    // THE CRITICAL TRANSFORM: wrap value in backticks
    // "- **Severity:** critical" → "- **Severity:** `critical`"
    // react-markdown parses `critical` as inline code → code component → Badge
    out.push(`${bullet}**${def.name}:** \`${value}\``);
  }
  return { enhanced: out.join("\n"), warnings };
}
```

**Why this pattern:** The backtick-wrapping is the bridge between markdown text and React components. By wrapping the value in backticks, react-markdown naturally parses it as inline code. The `code` component map entry then checks if that inline code matches a registered badge value and renders a `<Badge>` instead of `<code>`. No custom remark plugins needed.

#### Pattern 4: Fence-Aware Scanning (fence.ts)

```typescript
export function scanLines(markdown: string): MarkdownRegion[] {
  const regions: MarkdownRegion[] = [];
  let inFence = false;
  let fenceChar = "";
  let fenceLen = 0;

  const lines = markdown.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const m = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (m) {
      const marker = m[1]!;
      const rest = m[2]!;
      if (!inFence) {
        // Opening fence: ``` or ~~~ (up to 3 leading spaces)
        inFence = true;
        fenceChar = marker.charAt(0);
        fenceLen = marker.length;
        regions.push({ line, lineNumber: i + 1, insideFence: true });
        continue;
      }
      if (marker.charAt(0) === fenceChar && marker.length >= fenceLen && rest.trim() === "") {
        // Closing fence: same char, at least as long, no other content
        inFence = false;
        fenceChar = "";
        fenceLen = 0;
        regions.push({ line, lineNumber: i + 1, insideFence: true });
        continue;
      }
    }
    regions.push({ line, lineNumber: i + 1, insideFence: inFence });
  }
  return regions;
}
```

**Why this pattern:** Both `buildToc` and `enhanceMarkdown` must ignore content inside code fences. A `## comment` inside a ``` fence must neither enter the TOC nor be processed for badges. The scanner tracks fence state (character + length) and reports `insideFence: true` for both fence delimiters and their body. This is shared logic — without it, a badge annotation inside a code block would be incorrectly rendered.

#### Pattern 5: Registry Validation with Collision Detection (tags.ts)

```typescript
export function validateRegistry(registry: TagRegistry): string[] {
  const errors: string[] = [];
  const owners = new Map<string, string>();  // value → tag name

  for (const def of Object.values(registry)) {
    if (!def.name) errors.push("tag definition missing name");

    for (const [value, v] of Object.entries(def.values)) {
      if (value !== value.toLowerCase()) {
        errors.push(`tag "${def.name}": value "${value}" must be registered lowercase`);
      }
      if (v.accent < 1 || v.accent > 5) {
        errors.push(`tag "${def.name}", value "${value}": accent must be 1–5`);
      }
      // COLLISION DETECTION: same value in two tags = ambiguous badge
      const owner = owners.get(value);
      if (owner !== undefined) {
        errors.push(
          `badge value collision: "${value}" is registered in both "${owner}" and "${def.name}"`
        );
      } else {
        owners.set(value, def.name);
      }
    }
  }
  return errors;
}

export function loadRegistry(registry: TagRegistry): TagRegistry {
  const errors = validateRegistry(registry);
  if (errors.length > 0) {
    throw new Error(`Invalid tag registry:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  }
  return registry;
}
```

**Why this pattern:** Badge values must resolve unambiguously. If `"draft"` exists in both `Status` and `Priority`, the resolver would silently return the first match — a subtle bug that's hard to detect visually. The collision detection catches this at startup (fail-fast), naming both tags in the error message so the developer can fix it immediately.

---

## 4. Data Architecture

**This project has no database, no API, and no persistent data store.** The only "data" is:

1. **Static content:** `src/content/document.md` — the Markdown file imported at build time via Vite `?raw`.
2. **Client-side preference:** Theme choice (light/dark/system) persisted to `localStorage` with an in-memory fallback for sandboxed contexts.

The build is fully static — no runtime data fetching, no API calls, no server-side rendering.

---

## 5. Design System Reference

### 5.1 Typographic System

| Role | Font | Weight | Size | Tracking | Color |
|------|------|--------|------|----------|-------|
| H1 | Inter | 700 | `text-3xl sm:text-4xl` | `tracking-tight` | `text-text` |
| H2 | Inter | 600 | `text-2xl` | `tracking-tight` | `text-text` |
| H3 | Inter | 600 | `text-xl` | — | `text-text` |
| H4 | Inter | 600 | `text-lg` | — | `text-text-secondary` |
| Body | Inter | 400 | `text-base` (16px) | — | `text-text-secondary` |
| Code | JetBrains Mono | 400 | `text-sm` / `text-[0.85em]` | — | `text-text` |
| Badge | Inter | 600 | `text-xs` | `tracking-wide` uppercase | per-accent |

**Font loading:** Google Fonts via CSS `@import` (not JS). Failover to system fonts via Tailwind's font stack: `"Inter", ui-sans-serif, system-ui, sans-serif`.

### 5.2 Color Tokens

#### Light Mode

| Token | Hex | RGB | Class | Usage | Contrast on `--bg` |
|-------|-----|-----|-------|------|-------------------|
| `--bg` | `#ffffff` | 255,255,255 | `bg-bg` | Page background | — |
| `--bg-secondary` | `#f8fafc` | 248,250,252 | `bg-bg-secondary` | Header, code blocks | — |
| `--bg-tertiary` | `#f1f5f9` | 241,245,249 | `bg-bg-tertiary` | Hover states | — |
| `--text` | `#0f172a` | 15,28,42 | `text-text` | Headings | 18.1:1 AAA |
| `--text-secondary` | `#475569` | 71,85,105 | `text-text-secondary` | Body text | 5.9:1 AA |
| `--text-tertiary` | `#475569` | 71,85,105 | `text-text-tertiary` | Labels | 5.9:1 AA |
| `--border` | `#e2e8f0` | 226,232,240 | `border-border` | Borders | — |
| `--accent` | `#2563eb` | 37,99,235 | `text-accent` | Links, focus rings | 5.0:1 AA |
| `--accent-1` | `#dc2626` | 220,38,38 | `text-accent-1` | Badge: critical | 4.6:1 AA |
| `--accent-2` | `#f59e0b` | 245,158,11 | `text-accent-2` | Badge: warning | 2.6:1 (on bg) / 7.1:1 (on chip) |
| `--accent-3` | `#2563eb` | 37,99,235 | `text-accent-3` | Badge: info | 5.0:1 AA |
| `--accent-4` | `#10b981` | 16,185,129 | `text-accent-4` | Badge: success | 3.3:1 (on bg) / 5.9:1 (on chip) |
| `--accent-5` | `#8b5cf6` | 139,92,246 | `text-accent-5` | Badge: neutral | 3.7:1 (on bg) / 6.3:1 (on chip) |

#### Dark Mode

| Token | Hex | Class | Contrast on `--bg` (`#0f172a`) |
|-------|-----|-------|-------------------------------|
| `--bg` | `#0f172a` | `bg-bg` | — |
| `--text` | `#f8fafc` | `text-text` | 18.1:1 AAA |
| `--text-secondary` | `#cbd5e1` | `text-text-secondary` | 11.6:1 AAA |
| `--text-tertiary` | `#94a3b8` | `text-text-tertiary` | 5.3:1 AA |
| `--accent` | `#60a5fa` | `text-accent` | 7.0:1 AAA |

### 5.3 Component Primitives

The project uses no external UI library (no Shadcn, Radix, MUI). All components are hand-built with Tailwind CSS. The only third-party UI dependency is `lucide-react` for icons (tree-shaken).

### 5.4 Motion / Animation

- **Smooth scrolling:** `html { scroll-behavior: smooth; }` for TOC anchor navigation.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disables smooth scroll and sets all animations/transitions to `0.01ms`.
- **No Framer Motion, no CSS keyframes, no micro-interactions.** The design is intentionally static — this is a reference document, not a marketing site.

---

## 6. Security Architecture

### 6.1 Security Rules

| Rule | Enforcement | Verification |
|------|-------------|--------------|
| **No `dangerouslySetInnerHTML`** | Code review + lint | `grep -rn "dangerouslySetInnerHTML" src/` returns 0 results |
| **No external data fetching** | Architecture | No `fetch()`, `axios`, or `XMLHttpRequest` in source |
| **No authentication/session** | Architecture | No auth tokens, cookies, or session storage |
| **No user input processing** | Architecture | Content is static markdown; no forms, no input fields |
| **No environment variables** | Architecture | `import.meta.env.DEV` is the only env access (build-time constant) |
| **XSS via markdown** | react-markdown | Component map renders Markdown as React elements (HTML is escaped) |
| **Google Fonts CDN** | CSS `@import` | Only external dependency; loaded via `<link>` equivalent, not JS |

### 6.2 Security Utilities

- **`ErrorBoundary`:** Prevents a single render error from crashing the entire app. Shows a fallback UI with a reload button.
- **`theme-storage.ts`:** Wraps `localStorage` in try/catch to prevent crashes in sandboxed iframes (where `localStorage` access throws).

### 6.3 Authentication & Authorization

**None.** The application has no authentication, no authorization, no user accounts, and no protected routes. It is a fully public static page.

### 6.4 Threat Model

| Threat | Vector | Mitigation |
|--------|--------|------------|
| **XSS via markdown** | Malicious HTML in markdown content | react-markdown escapes raw HTML by default; no `rehype-raw` enabled |
| **XSS via badge injection** | Malicious badge values | Badge rendering uses React text nodes (not innerHTML); values are escaped by React |
| **Supply chain attack** | Compromised npm package | Locked versions in `package-lock.json`; no runtime dependencies beyond build output |
| **CDN compromise** | Google Fonts serves malicious CSS | Fonts loaded via CSS `@import` (not JS); failover to system fonts if CDN fails |
| **localStorage poisoning** | Tampered theme value | Theme value is validated against `"light" \| "dark" \| "system"` before application |

---

## 7. Testing Strategy

### 7.1 Test Distribution

| Category | Files | Tests | Location | Framework |
|----------|-------|-------|----------|-----------|
| Unit | 8 | 68 | `tests/unit/` | vitest + jsdom |
| Integration | 11 | 55 | `tests/integration/` | vitest + @testing-library/react |
| Accessibility | 1 | 2 | `tests/accessibility/` | Playwright + @axe-core/playwright |
| Performance | 1 | 1 | `tests/performance/` | vitest |
| **Total** | **21** | **126** | | |

### 7.2 Test Patterns

**Unit tests** cover pure functions in `src/lib/` (68 tests across 8 files):
- `fence.test.ts` — Fence delimiter tracking (5 tests)
- `enhance.test.ts` — Badge backtick-wrapping (10 tests)
- `toc.test.ts` — TOC nesting + slug dedup (9 tests)
- `frontmatter.test.ts` — YAML parse + strip (7 tests)
- `tags.test.ts` — Registry validation + resolver (6 tests)
- `slug-parity.test.ts` — github-slugger === rehype-slug (9 tests: 7 fixtures + 2 edge cases)
- `reading-time.test.ts` — Reading-time estimator (8 tests)
- `config.test.ts` — MarkdownToWebConfig validator (14 tests)

**Integration tests** cover the full rendering pipeline (55 tests across 11 files):
- `markdown-rendering.test.tsx` — Full pipeline rendering (4 tests)
- `code-block.test.tsx` — Code block + copy button (5 tests)
- `images.test.tsx` — Image rendering (5 tests)
- `task-lists.test.tsx` — GFM task lists (4 tests)
- `dev-warnings.test.tsx` — Enhance warnings (1 test)
- `theme-toggle.test.tsx` — Theme cycling + aria-live (9 tests)
- `error-boundary.test.tsx` — Error catching (4 tests)
- `back-to-top.test.tsx` — Scroll-to-top (5 tests)
- `mobile-nav.test.tsx` — Mobile drawer (9 tests)
- `copy-button.test.tsx` — Clipboard copy (4 tests)
- `editorial-template.test.tsx` — Editorial template (5 tests)

**Accessibility tests** cover WCAG 2.2 AA compliance:
- `axe.test.ts` — Light mode + dark mode (2 tests)

**Performance tests** cover bundle size:
- `bundle-size.test.ts` — Under 250 KB gzipped (1 test)

### 7.3 Coverage Thresholds

| Metric | Threshold |
|--------|-----------|
| Lines | 80% |
| Functions | 80% |
| Branches | 75% |
| Statements | 80% |

### 7.4 Pre-Deploy Checklist

```bash
# 1. Typecheck (strict, zero errors)
npx tsc --noEmit

# 2. Unit + integration + bundle-size tests (124 tests)
npm run test

# 3. Accessibility tests (2 tests, WCAG 2.2 AA)
npm run a11y

# 4. Production build
npm run build

# 5. Verify output
ls -lh dist/index.html  # Should exist, ~598 KB
```

---

## 8. Build & Deployment

### 8.1 Production Build

```bash
npm run build
```

**Output:** `dist/index.html` — a single self-contained HTML file with all JS/CSS inlined.

| Metric | Value |
|--------|-------|
| Raw size | 598 KB |
| Gzipped size | 165 KB |
| Bundle budget | 250 KB gzipped |
| Margin | 85 KB under budget |
| gzip ratio | 3.62:1 |

**Build pipeline:**
1. Vite transforms TypeScript/TSX via esbuild
2. `@tailwindcss/vite` processes CSS-first `@theme` config
3. `vite-plugin-singlefile` inlines JS + CSS into `dist/index.html`
4. Output: single file, zero external runtime dependencies

### 8.2 Environment Variables

| Variable | Required | Purpose | Notes |
|----------|----------|---------|-------|
| `import.meta.env.DEV` | Build-time | Dev-only error details in `ErrorFallback` | Set by Vite; `true` in dev mode, `false` in production |

**No other environment variables.** The app has no runtime configuration, no API keys, no feature flags.

### 8.3 Docker Configuration

**None.** The output is a static HTML file deployable to any static host. No Docker, no server, no container orchestration needed.

### 8.4 CI/CD Pipeline

Configured in `.github/workflows/ci.yml` with two jobs:

**Job 1 — `quality`** (7 steps):
1. Typecheck (`tsc --noEmit`)
2. Lint (ESLint, zero-warning)
3. Format (Prettier check)
4. Markdown (markdownlint-cli2)
5. Test with coverage (vitest + v8 coverage)
6. Build (`vite build`)
7. Bundle size verification (< 250 KB gzipped)

Uploads coverage + dist artifacts.

**Job 2 — `accessibility`** (depends on `quality`):
1. Build for a11y test
2. Install Playwright chromium `--with-deps`
3. Run `npm run a11y`

Uploads Playwright report.

**Triggers:** Push and PR to `main`/`master`. Concurrency cancels in-progress runs.

**Deployment targets:** Any static host — GitHub Pages, Netlify, Vercel, S3 + Cloudflare, nginx. The single-file output requires no server-side configuration.

---

## 9. Developer Handbook

### 9.1 Local Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd skills-catalog
npm install

# 2. Install Playwright browsers (required for accessibility tests)
npx playwright install chromium

# 3. Verify setup
npm run typecheck    # Should pass with zero errors
npm run lint         # Should pass with zero warnings
npm run test         # Should pass 124 vitest tests
npm run a11y         # Should pass 2 Playwright tests
npm run build        # Should produce dist/index.html (~598 KB)
```

### 9.2 Common Commands

| Command | Location | Purpose |
|---------|----------|---------|
| `npm run dev` | root | Start Vite dev server |
| `npm run build` | root | Production build → `dist/index.html` |
| `npm run preview` | root | Serve `dist/` on :4173 |
| `npm run typecheck` | root | `tsc --noEmit` (strict, noUnusedLocals) |
| `npm run lint` | root | ESLint (flat config, zero-warning policy) |
| `npm run lint:format` | root | Prettier check |
| `npm run lint:markdown` | root | markdownlint-cli2 |
| `npm run test` | root | All vitest tests (unit + integration + bundle-size) |
| `npm run test:unit` | root | Unit tests only (68 tests across 8 files) |
| `npm run test:integration` | root | Integration tests only (55 tests across 11 files) |
| `npm run test:coverage` | root | Vitest with coverage (enforces 80/75/80/80) |
| `npm run test:bundle-size` | root | Bundle < 250 KB gzipped gate (1 test) |
| `npm run a11y` | root | Accessibility tests via Playwright (2 tests) |
| `npm run prepare` | root | Install Husky pre-commit hook |

### 9.3 Code Style Rules

| Rule | Enforcement |
|------|-------------|
| TypeScript strict mode | `tsconfig.json` (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`) |
| No `any` | `typescript-eslint` + code review |
| `import type` for type-only imports | `eslint-plugin-react-hooks` |
| Zero-warning lint policy | `eslint --max-warnings 0` |
| No `dangerouslySetInnerHTML` | Code review (no lint rule, but grep-verified) |
| No Tailwind `dark:` utilities | Architecture (dark mode via `data-theme` attribute) |
| CSS import order | Google Fonts `@import` before `@import "tailwindcss"` |

### 9.4 Git Workflow

- Branching: Feature branches from main
- Commits: Conventional Commits format (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`)
- Atomic commits: One logical change per commit
- Pre-deploy: Run the full checklist in §7.4

---

## 10. Known Issues & Outstanding Tasks

| Priority | Issue | Impact | Status |
|----------|-------|--------|--------|
| LOW | No syntax highlighting for code blocks | Code blocks render as plain `<pre>` | Open — `rehype-highlight` is opt-in, not wired |
| LOW | Google Fonts CDN dependency | `file://` viewing fails to load fonts | Documented — offline font build not implemented |
| INFO | Badge annotations absent from content | Badge system is unused (0 annotations in content) | By design — the catalog is pure reference material |
| INFO | No JSDoc on all public functions | Some lib functions lack full JSDoc | Low — functions are private and tested |
| INFO | Editorial template not exposed in UI | No runtime switch between technical/editorial | By design — template is a build-time choice via `active.ts` |
| INFO | `__dirname` deprecation in Vite 8 | Potential future migration needed | Monitored — `import.meta.dirname` already used in configs |

---

## 11. Key Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| `src/App.tsx` | 109 | Pipeline orchestrator — memoized state, IntersectionObserver |
| `src/main.tsx` | 13 | Entry point — StrictMode + ErrorBoundary + createRoot |
| `src/components/MarkdownRenderer.tsx` | 159 | react-markdown renderer + full components map + CodeBlockWrapper |
| `src/templates/technical/theme.css` | 219 | Two-layer token pattern (light + dark + print) |
| `src/templates/technical/layout.tsx` | 117 | Three-column layout shell + meta line + MobileNav + BackToTop |
| `src/components/TableOfContents.tsx` | 70 | Recursive TOC with active-section styling |
| `src/components/BackToTop.tsx` | 67 | Floating scroll-to-top button (respects reduced motion) |
| `src/components/MobileNav.tsx` | 126 | Mobile TOC drawer (dialog + focus trap + scroll lock) |
| `src/components/ThemeToggle.tsx` | 123 | Light/dark/system toggle (lucide + aria-live + matchMedia) |
| `src/components/CopyButton.tsx` | 89 | Clipboard copy with execCommand fallback |
| `src/components/SkipLink.tsx` | 10 | Accessible skip-to-content |
| `src/components/Badge.tsx` | 32 | Tag-aware badge chip (5 accent steps) |
| `src/components/ErrorBoundary.tsx` | 50 | Class component render error catcher |
| `src/components/ErrorFallback.tsx` | 28 | Presentational fallback UI with reload |
| `src/lib/toc.ts` | 44 | H2–H4 outline extraction + slug generation |
| `src/lib/tags.ts` | 53 | Registry validation + collision detection + resolver |
| `src/lib/fence.ts` | 44 | Fence-aware line scanner (CommonMark subset) |
| `src/lib/enhance.ts` | 48 | Badge backtick-wrapping preprocessor |
| `src/lib/frontmatter.ts` | 31 | YAML frontmatter parse + strip |
| `src/lib/reading-time.ts` | 87 | Prose-word reading-time estimator (200 wpm, CJK-aware) |
| `src/lib/config.ts` | 129 | Optional MarkdownToWebConfig validator |
| `src/content/document.md` | 323 | The input markdown (202 skills, 10 categories) |
| `src/templates/active.ts` | 14 | Template switching (single edit point) |
| `src/types/template.ts` | 54 | TemplateConfig, TemplateLayoutProps, ComponentsMap |
| `src/utils/cn.ts` | 7 | clsx + tailwind-merge |
| `src/utils/theme-storage.ts` | 18 | localStorage with try/catch + in-memory fallback |
| `tests/unit/slug-parity.test.ts` | 34 | Most critical test — slug parity verification |
| `tests/integration/theme-toggle.test.tsx` | ~45 | Largest integration suite (9 tests) |

---

*End of Project Architecture Document v1.0. This document is the definitive engineering reference for the Skills Catalog markdown-to-web pipeline. Every architectural decision traces to a specific rationale.*
