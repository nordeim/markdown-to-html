---
name: markdown-to-web
description: Renders an arbitrary Markdown document as a polished, single-file, accessible web page. Accepts any .md file plus an optional template (technical three-column / editorial long-form) and an optional tag registry (severity, confidence, status, custom). Built on React 19 + Vite 8 + Tailwind v4 + react-markdown + lucide-react. Includes mobile TOC drawer, back-to-top, code-block copy buttons, reading-time estimation, print stylesheet, CI workflow, and Husky pre-commit hook.
triggers:
  - render this markdown as a web page
  - convert .md to HTML
  - publish this document as a site
  - make a polished web version of this README/report/spec
version: 2.0.0
tags:
  - react
  - vite
  - tailwindcss
  - markdown
  - html
  - single-file-build
  - accessibility
  - documentation
  - tdd
  - ci
---

> **⚠ SUPERSEDED.** This is version 2.0.0 of the skill, preserved as a historical
> reference. The canonical current version is
> [`docs/markdown-html-pipeline_SKILL-v2.1.md`](./markdown-html-pipeline_SKILL-v2.1.md),
> which addresses the outstanding issues identified in the v2.0 spec-vs-spec
> audit (`docs/v2_rendering_comparison_3.md`):
>
> - Source-markdown count mismatch (198/208/202) — fixed and prevented by a new `lint:source` gate.
> - `IntersectionObserver` partial-callback bug — fixed with a stateful `Map<id, boolean>` reducer.
> - CJK reading-time underestimation — fixed with a separate 300 cpm rate (max-of with Latin 200 wpm).
> - Pre-hydration title flash — fixed with a build-time `transformIndexHtml` plugin.
> - Redundant `inlineDynamicImports` build warning — removed.
> - `CLAUDE.md` prettier drift + 130 markdownlint errors in `docs/` — fixed.
>
> Use v2.1 for new work. This document is kept for traceability.

---

# markdown-to-web — Pipeline Skill v2.0.0

**Document version:** 2.0.0
**Date:** 2026-08-07
**Scope:** Unified, technically-correct replacement for `markdown-html-pipeline_SKILL.md` v1.0.0, distilled from a full TDD remediation of the `nordeim/markdown-to-html` codebase. Captures every lesson, pattern, and anti-pattern encountered across a 53-finding audit and a 10-phase remediation that took the test count from 49 to 124 and restored all 8 quality gates.
**Reviewer:** Super Z (GLM)
**Base document:** `markdown-html-pipeline_SKILL.md` v1.0.0 (itself based on `draft_q3.md` v3.0.0 → `SKILL.md` v4.0.0 → v4.1.1)
**Verification protocol:** Desk review + executed commands. Findings tagged Verified / Reasoned / Assumed per the evidence contract in §17. Every claim about the codebase traces to an executed command (`npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`) — see the verification ledger in Appendix B.

---

## Part 1 — Remediation Context (Why v2 Exists)

v1.0.0 of this skill was technically correct in its patterns but the codebase it described had **three of its four documented quality gates silently broken**: `eslint.config.js` was missing (so `npm run lint` could not run), `.prettierrc` was missing (so `npm run lint:format` failed on 28 files), and no markdownlint config existed (so `npm run lint:markdown` errored out). The CLAUDE.md, AGENTS.md, and README all asserted a "zero-warning policy" lint gate that could not fire.

A 53-finding audit (`docs/audit/AUDIT.md`) classified these as 9 Critical, 9 High, 17 Medium, 9 Low, and 9 Informational issues. A 10-phase TDD remediation (`docs/audit/IMPLEMENTATION_PLAN.md`, `docs/audit/REMEDIATION_LOG.md`) resolved all Critical and High findings, added 75 new tests, restored all gates, and added features v1.0.0 only described (mobile drawer, back-to-top, copy buttons, reading-time, second template, print styles, CI, pre-commit).

**v2 captures the result.** Every pattern, lesson, and anti-pattern below is grounded in code that was actually written, tested, and built green. Where v1.0.0 said "the gate enforces X," v2 says "the gate enforces X — and here is the config file that makes it real, and here is the lesson from when it wasn't."

**What changed from v1.0.0:**

| Area | v1.0.0 | v2.0.0 |
|------|--------|--------|
| Tests | 49 (35 unit + 4 integration + 2 a11y + 1 perf) | 124 vitest + 2 Playwright (68 unit + 55 integration + 1 perf + 2 a11y) |
| Templates | 1 (`technical`) | 2 (`technical` + `editorial`) |
| Components | 7 | 10 (+ BackToTop, MobileNav, CopyButton) |
| Lib modules | 5 | 7 (+ reading-time, config) |
| Quality gates | 4 documented, 3 broken | 8 documented, 8 real |
| CI | none | `.github/workflows/ci.yml` (quality + accessibility jobs) |
| Pre-commit | documented "(if configured)" | `.husky/pre-commit` wired with lint-staged |
| Bundle | 162 KB gzipped | 171 KB gzipped (+5.4% for new features; still 79 KB under budget) |
| Coverage | thresholds defined, not enforced | thresholds enforced via `test:coverage` script + CI |

---

## Part 2 — Skill Specification

### §1 Identity & Design Philosophy

**One-sentence description:** A zero-backend React application that renders any Markdown document as a polished, navigable, single-file web page, where the document's structure drives the UI, a swappable template drives the look, registered inline annotations render as semantic badges, and an eight-gate quality pipeline (typecheck → lint → format → markdownlint → test → coverage → build → a11y) enforces production-grade correctness.

**Design thesis:** *Content is data; rendering is configuration; gates are real.* The Markdown file is the input. The template chooses the look. The tag registry chooses which inline annotations become badges. The build produces one self-contained `dist/index.html` that runs anywhere a browser can open a file — online or offline. Every quality claim is backed by a config file and a CI job, not by documentation alone.

**Core tenets:**

1. **Content is sovereign.** The markdown file determines structure. The renderer never invents content. Editing markdown never requires code changes. The frontmatter block is metadata and is *stripped before render* — it never leaks into the document body.
2. **One rendering pipeline.** `react-markdown` + components map. No `dangerouslySetInnerHTML`, no HTML-string serialization, no raw-HTML injection into the markdown source.
3. **Tags are registered, not hardcoded.** Badges are data in a registry; the resolver is generic; value collisions fail fast at load; badge resolution cannot misfire on code blocks.
4. **Single-file portability, honestly stated.** JS/CSS are inlined; fonts are a runtime dependency by default, with an opt-in offline build path documented.
5. **Accessibility is gated, not claimed.** Conformance claim: **WCAG 2.2 AA, enforced by an axe gate; AAA where feasible.** The gate runs in both light and dark modes.
6. **No generic UI (per template).** The technical template uses a utilitarian cool-gray palette. The editorial template uses a warm cream-and-serif palette. The anti-generic mandate applies per template, not globally.
7. **Gates are real, not claimed.** Every documented quality gate has a config file, an npm script, and (where applicable) a CI job. A documented gate that cannot run is worse than no gate — it misleads maintainers. (This tenet is new in v2, learned from the v1.0.0 audit.)
8. **Types are canonical, not duplicated.** Every interface lives in `src/types/` exactly once. `lib/` modules import from `types/` and may re-export for convenience, but never redefine. (New in v2.)
9. **TDD is the default.** New behavior gets a failing test first. Bug fixes get a regression test first. The test count is a first-class metric — a feature without tests is incomplete. (New in v2.)

**Anti-generic mandate (per template):**

- **Technical:** rejects purple gradients, card grids, generic Inter-on-white neutrality. Embraces cool gray + blue, three-column density, monospace code.
- **Editorial:** rejects the same generic patterns but embraces warm cream + serif, single-column measure, drop-cap-ready hero.

---

### §2 When to Use / When Not To

**Use this skill when:**

- The user provides a Markdown file (`.md`) and asks for a "web version," "HTML rendering," "polished page," or "publishable site."
- The document is long-form (1,000–50,000 words) and benefits from a Table of Contents.
- The document contains structured annotations (`**Severity:** critical`, `**Status:** done`) that should render as visual badges.
- The artifact must run offline or from `file://`.
- Accessibility conformance (AA minimum, AAA aspirational) is a requirement.
- The user wants a single self-contained HTML file with no external runtime dependencies.
- The user wants a second template (editorial vs technical) without forking the codebase.

**Do NOT use this skill when:**

- The user wants a full Next.js application with server-side rendering, API routes, or database. Use `fullstack-dev` instead.
- The user wants a slide deck / presentation. Use `pptx` instead.
- The user wants a PDF. Use `pdf` instead.
- The document is a code project README that needs interactive code execution.
- The document is shorter than ~500 words; a styled HTML page is overkill — render inline.
- The user needs multi-page navigation, search across documents, or user accounts. This skill renders one document into one HTML file.

**Template selection guide:**

| If the document is… | Use template | Why |
|---------------------|--------------|-----|
| API reference, technical spec, RFC, developer guide, skills catalog | `technical` (default) | Three-column layout; code blocks first-class; cool, utilitarian palette; persistent TOC sidebar |
| Audit report, essay, comparative analysis, design critique, long-form article | `editorial` | Single-column reading; narrow measure; warm serif; hero with subtitle + meta line |
| Manuscript, legal document, printable report, archival content | `minimal` (not yet implemented — deferred) | Single column; print CSS; no chrome; system fonts |

If unsure, start with `technical`. The build is identical across templates — switching is a one-file edit, not a fork.

---

### §3 Inputs Contract

The skill accepts the following inputs. All except the Markdown file are optional with sensible defaults.

| Input | Required | Format | Default | Notes |
|-------|----------|--------|---------|-------|
| Markdown file | Yes | `.md`, UTF-8 | — | GFM extensions supported: tables, strikethrough, task lists, autolinks |
| Template | No | `technical` \| `editorial` \| `minimal` | `technical` | See §12 |
| Tag registry | No | TS module or JSON | Template's default | See §11 |
| Frontmatter | No | flat `key: value` YAML | — | title/subtitle/author/date/template; §3.1 |
| Theme override | No | Partial Layer-1 variables | None | Merges with template's `:root` tokens |
| Offline fonts | No | build flag | `false` | When `true`, inlines fonts as base64 (extension path) |
| Syntax highlighting | No | Boolean | `false` | When `true`, enables `rehype-highlight` (extension path; not in base build) |

**Markdown features supported:**

- Headings H1–H6 (TOC indexes H2–H4 by default; configurable `maxDepth: 2 | 3 | 4`)
- Paragraphs, bold, italic, strikethrough
- Inline code, fenced code blocks (with copy-to-clipboard button on every `<pre>`)
- Blockquotes
- Ordered/unordered lists, **task lists** (GFM `- [ ]` / `- [x]` rendered as disabled checkboxes)
- Tables (GFM)
- Links (external links get `target="_blank" rel="noopener noreferrer"` automatically)
- Horizontal rules
- **Inline images** (lazy-loaded, async-decoded, responsive max-width)
- YAML frontmatter (parsed for `title`, `subtitle`, `author`, `date`, `template`; remaining keys ignored)
- **Reading time** (auto-calculated from prose-word count, displayed in layout meta line)

**Markdown features NOT supported (out of scope):**

- Footnotes (`[^1]`) — add via `remark-footnotes` if a template needs it
- Math (`$...$`) — add via `remark-math` + `rehype-katex` if a template needs it
- Mermaid code blocks — add via `rehype-mermaid` if a template needs it
- Setext headings (`Title\n=====`) in TOC — invisible to the line-based extractor but real to `rehype-slug`; content convention is ATX headings only
- Raw HTML pass-through — by default, react-markdown escapes raw HTML
- Multi-document sets — this skill renders one document into one HTML file

#### 3.1 Frontmatter schema

```yaml
---
title: "Document Title"           # overrides first H1; also sets document.title
subtitle: "Optional subtitle"     # renders below title in hero (editorial) or meta line (technical)
author: "Author Name"             # renders in meta line
date: "2026-08-07"                # renders in meta line, ISO 8601
template: "technical"             # technical | editorial | minimal
---
```

**Known limitations (disclosed, by design):** flat `key: value` only; no nested YAML, arrays, or multiline values; malformed frontmatter is silently ignored and the whole input is treated as body (still renders). CRLF line endings are normalized; BOM is stripped. If a document needs real YAML semantics, swap in `gray-matter` — it is the one dependency upgrade that preserves every contract in this document.

---

### §4 Tech Stack & Pinned Versions

Every dependency below is pinned. The pre-ship checklist (§16) includes `npm ls --depth=0` to verify the installed versions match this table. Drift from these versions risks breaking the slug-parity contract (§9) and the `@theme` token generation (§6).

| Layer | Technology | Version | Provenance / note |
|-------|------------|---------|-------------------|
| Framework | React | `^19.2.8` | StrictMode + createRoot |
| Build | Vite | `^8.2.0` | `?raw` imports for Markdown; **Vite 8 deprecates `__dirname`** — use `import.meta.dirname` |
| Styling | Tailwind CSS | `^4.3.3` | CSS-first `@theme inline`; **no `tailwind.config.js`** |
| Tailwind Vite plugin | @tailwindcss/vite | `^4.3.3` | Must be ≥4.3.3 for Vite 8 compatibility |
| Markdown | react-markdown | `10.1.0` | `remark-gfm` + `rehype-slug`; component map renders Markdown as React elements (no `dangerouslySetInnerHTML`) |
| GFM | remark-gfm | `4.0.1` | Tables, strikethrough, task lists, autolinks |
| Heading anchors | rehype-slug | `6.0.0` | Must match `github-slugger` output (verified by `slug-parity.test.ts`) |
| TOC slugs | github-slugger | `2.0.0` | **Default export class only — no named `{ slug }` export exists** |
| Icons | lucide-react | `1.29.0` | Tree-shaken SVG icons: `Sun`, `Moon`, `Monitor`, `ArrowUp`, `Menu`, `X`, `Copy`, `Check` |
| Class util | clsx | `2.1.1` | Combined with tailwind-merge as `cn()` |
| Merge util | tailwind-merge | `3.4.0` | Prevents Tailwind class conflicts |
| Packaging | vite-plugin-singlefile | `2.3.3` | Must be ≥2.3.3 for Vite 8 compatibility; inlines JS/CSS into `dist/index.html` |
| TypeScript | typescript | `~6.0.2` | `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`; **TS 6 deprecates `baseUrl`** — use `paths` with `./` prefix |
| Node types | @types/node | `^26.1.2` | Required for `process`, `fs`, `path`, `zlib` in tests |
| Test runner | vitest | `^4.1.10` | Unit + integration + bundle-size + coverage; **requires explicit `jsdom` package** |
| DOM testing | jsdom | `^30.0.1` | Peer of vitest, NOT bundled |
| Testing library | @testing-library/react | `^16.0.0` | `render`, `screen`, `fireEvent` |
| jest-dom | @testing-library/jest-dom | `^6.0.0` | `toBeInTheDocument()` and other matchers |
| Coverage | @vitest/coverage-v8 | `^4.1.10` | v8 provider; thresholds 80/75/80/80 |
| A11y gate | @axe-core/playwright | `^4.12.1` | Runs against built dist |
| E2E runner | @playwright/test | `^1.40.0` | **Browsers must be installed via `npx playwright install`** |
| Lint | eslint | `^9.39.5` | Flat config (`eslint.config.js`); zero-warning policy |
| TypeScript ESLint | typescript-eslint | `^8.66.0` | Recommended rules; `consistent-type-imports`; `no-explicit-any` |
| React hooks lint | eslint-plugin-react-hooks | `^5.2.0` | Catches hook misuse; `rules-of-hooks` + `exhaustive-deps` |
| JSX a11y lint | eslint-plugin-jsx-a11y | `^6.10.2` | Catches a11y anti-patterns |
| Formatter | prettier | `^3.0.0` | 100-char print width, double quotes, trailing comma all; run AFTER `eslint --fix` |
| Markdown lint | markdownlint-cli2 | `^0.14.0` | **v0.14+ requires `.markdownlint-cli2.jsonc` with explicit globs** (not `.markdownlint.json`) |
| Pre-commit | husky | `^9.0.0` | `.husky/pre-commit` runs lint-staged + typecheck |
| Staged lint | lint-staged | `^15.0.0` | ESLint --fix + Prettier --write + markdownlint --fix on staged files |

**Node requirement:** ≥20.19 or ≥22.12 (Vite 8 requirement).

**Version discipline:** exact pins for everything lineage-verified; caret ranges only for additions, each tagged *Assumed* until install.

**Gate V-1 (version verification, mandatory):**

```bash
npm ls --depth=0
# Every row above must appear at the stated version.
# lucide-react: confirm the resolved version (1.x line is correct; 0.x is the old line).
```

Never repeat a version number from memory or from another document. `npm ls` is the only source of truth.

---

### §5 Project Skeleton

```
markdown-to-web/
├── package.json                     # Dependencies + scripts + lint-staged config
├── package-lock.json                # Committed — never hand-edit
├── vite.config.ts                   # Build pipeline (uses import.meta.dirname, not __dirname)
├── tsconfig.json                    # Strict TypeScript (TS 6 compatible; no baseUrl)
├── eslint.config.js                 # ESLint 9 flat config (NEW in v2 — was missing in v1.0)
├── .prettierrc.json                 # Prettier config (NEW in v2)
├── .prettierignore                  # Excludes dist/, node_modules/, coverage/, large docs
├── .markdownlint-cli2.jsonc         # markdownlint config (NEW in v2 — v0.14+ format)
├── vitest.config.ts                 # Test runner config (uses import.meta.dirname)
├── playwright.config.ts             # Accessibility test runner config
├── index.html                       # <div id="root"> + module script
├── .husky/
│   └── pre-commit                   # lint-staged + typecheck (NEW in v2)
├── .github/
│   └── workflows/
│       └── ci.yml                   # Quality + accessibility CI jobs (NEW in v2)
├── src/
│   ├── main.tsx                     # Entry: StrictMode + ErrorBoundary + createRoot
│   ├── App.tsx                      # Layout, memoized pipeline, IntersectionObserver, dev warnings
│   ├── index.css                    # Tailwind v4 @import + Google Fonts (NO template @theme)
│   ├── vite-env.d.ts                # Vite client types + *.md?raw declaration
│   ├── content/
│   │   └── document.md              # The input markdown (?raw import)
│   ├── templates/
│   │   ├── active.ts                # THE single edit point for template switching
│   │   ├── technical/               # Three-column technical docs template (default)
│   │   │   ├── theme.css            # @theme tokens + print styles
│   │   │   ├── components.tsx       # Component map overrides (h2, h3, h4, a)
│   │   │   ├── layout.tsx           # Three-column shell + meta line + MobileNav + BackToTop
│   │   │   └── tags.json            # Status + Visibility registry
│   │   └── editorial/               # Single-column long-form reading template (NEW in v2)
│   │       ├── theme.css            # Warm cream-and-serif palette + print styles
│   │       ├── components.tsx       # Larger headings, italic H3
│   │       ├── layout.tsx           # Hero + single-column shell
│   │       └── tags.json            # Severity + Confidence registry
│   ├── components/
│   │   ├── MarkdownRenderer.tsx     # react-markdown renderer + components map + CodeBlockWrapper
│   │   ├── TableOfContents.tsx      # Recursive TOC with active-section styling + aria-label
│   │   ├── Badge.tsx                # Tag-aware badge chip (5 accent steps)
│   │   ├── ErrorBoundary.tsx        # Class component render error catcher (stores errorInfo)
│   │   ├── ErrorFallback.tsx        # Presentational fallback UI with reload
│   │   ├── SkipLink.tsx             # Accessible skip-to-content
│   │   ├── ThemeToggle.tsx          # Light/dark/system toggle (lucide icons + aria-live + matchMedia)
│   │   ├── BackToTop.tsx            # Floating scroll-to-top button (NEW in v2)
│   │   ├── MobileNav.tsx            # Mobile TOC drawer (dialog + focus trap) (NEW in v2)
│   │   └── CopyButton.tsx           # Clipboard copy with execCommand fallback (NEW in v2)
│   ├── lib/
│   │   ├── fence.ts                 # Fence-aware line scanner (CommonMark subset)
│   │   ├── enhance.ts               # Tag-aware regex preprocessor (3-space indent rule)
│   │   ├── toc.ts                   # H2–H4 outline extraction with slug reservation
│   │   ├── tags.ts                  # Registry validation + collision detection + resolver
│   │   ├── frontmatter.ts           # YAML frontmatter parse + strip (BOM-safe, CRLF-safe)
│   │   ├── reading-time.ts          # Prose-word reading-time estimator (NEW in v2)
│   │   └── config.ts                # Optional MarkdownToWebConfig validator (NEW in v2)
│   ├── types/
│   │   ├── tag.ts                   # TagDefinition, TagRegistry, ResolvedBadge (canonical)
│   │   ├── toc.ts                   # TocItem (canonical)
│   │   ├── frontmatter.ts           # Frontmatter, ParsedDocument
│   │   ├── template.ts              # TemplateConfig, TemplateLayoutProps, ComponentsMap
│   │   ├── config.ts                # MarkdownToWebConfig
│   │   └── enhance.ts               # EnhanceResult (NEW in v2 — moved from lib/)
│   └── utils/
│       ├── cn.ts                    # clsx + tailwind-merge
│       └── theme-storage.ts         # localStorage with try/catch + in-memory fallback
├── tests/
│   ├── setup.ts                     # jest-dom + IntersectionObserver mock + matchMedia mock
│   ├── unit/                        # 68 tests across 8 files
│   │   ├── fence.test.ts            # 5
│   │   ├── enhance.test.ts          # 10
│   │   ├── toc.test.ts              # 9
│   │   ├── frontmatter.test.ts      # 7
│   │   ├── tags.test.ts             # 6
│   │   ├── slug-parity.test.ts      # 9
│   │   ├── config.test.ts           # 14 (NEW in v2)
│   │   └── reading-time.test.ts     # 8 (NEW in v2)
│   ├── integration/                 # 55 tests across 10 files
│   │   ├── markdown-rendering.test.tsx     # 4
│   │   ├── code-block.test.tsx            # 5 (NEW in v2)
│   │   ├── images.test.tsx                # 5 (NEW in v2)
│   │   ├── task-lists.test.tsx            # 4 (NEW in v2)
│   │   ├── dev-warnings.test.tsx          # 1 (NEW in v2)
│   │   ├── theme-toggle.test.tsx          # 9 (NEW in v2)
│   │   ├── error-boundary.test.tsx        # 4 (NEW in v2)
│   │   ├── back-to-top.test.tsx           # 5 (NEW in v2)
│   │   ├── mobile-nav.test.tsx            # 9 (NEW in v2)
│   │   ├── copy-button.test.tsx           # 4 (NEW in v2)
│   │   └── editorial-template.test.tsx    # 5 (NEW in v2)
│   ├── accessibility/
│   │   └── axe.test.ts               # 2 (Playwright)
│   └── performance/
│       └── bundle-size.test.ts       # 1
└── docs/
    ├── Project_Architecture_Document.md
    ├── markdown-html-pipeline_SKILL.md       # v1.0.0 (preserved)
    ├── markdown-html-pipeline_SKILL-v2.md    # This file
    ├── source_SKILL.md
    ├── prompt-to-improve.md
    ├── status.md
    └── audit/                                # NEW in v2
        ├── AUDIT.md                          # 53-finding audit
        ├── IMPLEMENTATION_PLAN.md            # 10-phase TDD plan
        └── REMEDIATION_LOG.md                # Execution log + verification ledger
```

**File counts (v2):** 38 source files, 20 test files, 124 vitest tests + 2 Playwright tests = 126 total.

---

### §6 The Design System (Code-First)

The two-layer token pattern (Layer 1 runtime variables + Layer 2 `@theme inline` bridge) is the only correct way to do dark mode in Tailwind v4. **Never nest `@theme` inside `@media`** — it silently breaks.

#### 6.1 Technical template `src/templates/technical/theme.css`

```css
@import "tailwindcss";

/* ---------- Layer 1: runtime palette ---------- */
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

[data-theme="dark"] {
  /* Same overrides as the @media block above */
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

:focus:not(:focus-visible) { outline: none; }
```

#### 6.2 Editorial template `src/templates/editorial/theme.css` (NEW in v2)

Same two-layer structure, different values — warm cream-and-ink palette suited to long-form reading:

```css
:root {
  --bg: #fdfbf7;             /* warm cream */
  --bg-secondary: #f5f0e6;
  --bg-tertiary: #ebe3d2;
  --text: #1c1814;           /* warm ink */
  --text-secondary: #3a342c;
  --text-tertiary: #5e5448;
  --border: #d8cdb6;
  --accent: #8b4513;         /* saddle brown */
  --accent-bg: #f5efe2;
  --accent-ring: #c19a6b;
  --accent-dark: #6e360f;
  /* accent-1..5 and -bg variants same as technical */
}

/* Dark mode + @theme inline bridge identical in structure to technical */
```

The editorial template uses a serif font stack (`"Source Serif 4", "Georgia", ui-serif, serif`) to reinforce the long-form reading register.

#### 6.3 Print stylesheet (NEW in v2 — both templates)

Both templates include a `@media print` block that:

1. **Forces light-mode color tokens** regardless of OS / user preference (paper is always light).
2. **Hides chrome**: `header`, `aside`, `[aria-label="Back to top"]`, `[aria-label="Open table of contents"]`, `[aria-label="Copy code"]` all get `display: none !important`.
3. **Expands content** to full width.
4. **Appends href after links** via `a[href]::after { content: " (" attr(href) ")"; }` so printed links are usable.
5. **Avoids page-breaks inside** `pre`, `table`, `figure`, `blockquote`.
6. **Avoids page-breaks after** headings (`h1`–`h6`).

```css
@media print {
  :root {
    --bg: #ffffff;
    --text: #000000;
    --text-secondary: #1a1a1a;
    --border: #cccccc;
    --accent: #000000;
    --accent-bg: transparent;
    /* ... */
  }

  header, aside,
  [aria-label="Back to top"],
  [aria-label="Open table of contents"],
  [aria-label="Copy code"] {
    display: none !important;
  }

  main { max-width: 100% !important; padding: 0 !important; }

  body { background: #ffffff !important; color: #000000 !important; font-size: 11pt; }

  a { color: #000000 !important; text-decoration: underline; }
  a[href]::after { content: " (" attr(href) ")"; font-size: 9pt; color: #444444; }

  pre, table, figure, blockquote { page-break-inside: avoid; }
  h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
}
```

#### 6.4 Color contrast verification

| Token | Hex | Background | Ratio | WCAG AA |
|-------|-----|------------|-------|---------|
| `--text` (technical, light) | `#0f172a` | `#ffffff` | 18.1:1 | ✅ AAA |
| `--text-secondary` (technical, light) | `#475569` | `#ffffff` | 5.9:1 | ✅ AA |
| `--text-tertiary` (technical, light) | `#475569` | `#ffffff` | 5.9:1 | ✅ AA |
| `--text` (technical, dark) | `#f8fafc` | `#0f172a` | 18.1:1 | ✅ AAA |
| `--text-secondary` (technical, dark) | `#cbd5e1` | `#0f172a` | 11.6:1 | ✅ AAA |
| `--text-tertiary` (technical, dark) | `#94a3b8` | `#0f172a` | 5.3:1 | ✅ AA |
| `--text` (editorial, light) | `#1c1814` | `#fdfbf7` | 16.2:1 | ✅ AAA |
| `--text-secondary` (editorial, light) | `#3a342c` | `#fdfbf7` | 9.1:1 | ✅ AAA |
| `--text-tertiary` (editorial, light) | `#5e5448` | `#fdfbf7` | 6.4:1 | ✅ AA |

> **The original `--text-tertiary: #94a3b8` on white had only 2.56:1 contrast — a WCAG AA failure.** It was darkened to `#475569` (same as secondary) in the technical template. In dark mode, `#94a3b8` on `#0f172a` gives 5.3:1 — passing AA.

#### 6.5 Typography hierarchy

| Role | Font | Weight | Size | Color |
|------|------|--------|------|-------|
| H1 (technical) | Inter | 700 | `text-3xl sm:text-4xl` | text |
| H2 (technical) | Inter | 600 | `text-2xl` | text |
| H3 (technical) | Inter | 600 | `text-xl` | text |
| H4 (technical) | Inter | 600 | `text-lg` | text-secondary |
| H1 (editorial) | Source Serif 4 | 700 | `text-4xl sm:text-5xl` | text |
| H2 (editorial) | Source Serif 4 | 700 | `text-3xl` | text |
| H3 (editorial) | Source Serif 4 | 600 | `text-2xl italic` | text |
| Body | Inter / Source Serif 4 | 400 | `text-base` (16px) | text-secondary |
| Code | JetBrains Mono | 400 | `text-sm` | text |
| Badge | Inter | 600 | `text-xs` uppercase | per-accent |

---

### §7 Component Architecture & Patterns

#### 7.1 The rendering pipeline (data flow)

```
┌─────────────────────────────────────────────────────────────────┐
│  src/content/document.md                                         │
│  (raw Markdown with optional YAML frontmatter)                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ import via ?raw
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  parseDocument(markdown) → { frontmatter, body }                │
│  Strips YAML frontmatter block from body (BOM-safe, CRLF-safe)  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┬────────────────┐
              ▼                ▼                ▼                ▼
┌──────────────────┐ ┌─────────────────┐ ┌─────────────┐ ┌──────────────┐
│ enhanceMarkdown  │ │ buildToc        │ │ estimate    │ │ frontmatter  │
│ (body, registry) │ │ (body, 4)       │ │ ReadingTime │ │ .title →     │
│ → { enhanced,    │ │ → TocItem[]     │ │ (body)      │ │ document.    │
│   warnings }     │ │                 │ │ → "N min"   │ │ title        │
└────────┬─────────┘ └────────┬────────┘ └─────────────┘ └──────────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  MarkdownRenderer                                               │
│  react-markdown( enhanced )                                     │
│    remarkPlugins: [remarkGfm]                                   │
│    rehypePlugins: [rehypeSlug]                                  │
│    components: { h2, h3, h4, a, code→Badge, img, input,         │
│                  pre→CodeBlockWrapper+CopyButton, ... }         │
└─────────────────────────────────────────────────────────────────┘
```

#### 7.2 Memoization strategy

Every derived value is memoized to prevent re-computation on re-render:

```typescript
// App.tsx — the memoization points
const { frontmatter, body } = useMemo(() => parseDocument(documentMd), []);
const registry = useMemo(() => loadRegistry(TAGS), []);
const enhanced = useMemo(() => enhanceMarkdown(body, registry), [body, registry]);
const toc = useMemo(() => buildToc(body, 4), [body]);
const readingTime = useMemo(() => estimateReadingTime(body), [body]);
```

> **Critical:** `buildToc` consumes `body` (not `enhanced`). The TOC doesn't need badge wrapping — only the rendered markdown does. This prevents the TOC from re-computing when the badge registry changes.

#### 7.3 Component inventory (10 components)

| Component | File | Purpose | Lines |
|-----------|------|---------|-------|
| `MarkdownRenderer` | `MarkdownRenderer.tsx` | react-markdown renderer + components map + CodeBlockWrapper | ~160 |
| `TableOfContents` | `TableOfContents.tsx` | Recursive TOC with active-section styling + `aria-label` | ~70 |
| `Badge` | `Badge.tsx` | Tag-aware badge chip (5 accent steps) | ~33 |
| `ErrorBoundary` | `ErrorBoundary.tsx` | Class component render error catcher (stores `errorInfo`) | ~45 |
| `ErrorFallback` | `ErrorFallback.tsx` | Presentational fallback UI with reload button | ~31 |
| `SkipLink` | `SkipLink.tsx` | Accessible skip-to-content link | ~10 |
| `ThemeToggle` | `ThemeToggle.tsx` | Light/dark/system toggle (lucide icons + aria-live + matchMedia subscription) | ~115 |
| `BackToTop` | `BackToTop.tsx` | Floating scroll-to-top button (respects reduced motion) | ~60 |
| `MobileNav` | `MobileNav.tsx` | Mobile TOC drawer (dialog + focus trap + body scroll lock) | ~110 |
| `CopyButton` | `CopyButton.tsx` | Clipboard copy with execCommand fallback | ~75 |

---

### §8 Custom Hooks Deep Dive

**No custom hooks exist.** Theme state, drawer state, scroll state, clipboard state, and the active-section observer live inline in their respective components (`useState` / `useEffect` / `useMemo`). This is deliberate — document it explicitly so no agent searches for a `hooks/` directory.

The only reusable stateful logic is the `localStorage` wrapper in `src/utils/theme-storage.ts`, which is a pure utility (not a hook) because it doesn't use any React primitives.

**Why no hooks?** Each stateful concern is local to one component. Extracting a `useTheme` or `useActiveSection` hook would add a layer of indirection without enabling reuse. If a second component needed the same logic, the extraction would become worthwhile — but currently, no two components share stateful logic.

---

### §9 Content Management & Data Ingestion

#### 9.1 Markdown content

- **Location:** `src/content/document.md`
- **Import mechanism:** Vite `?raw` suffix imports the file as a string: `import documentMd from "@/content/document.md?raw";`
- **Frontmatter:** Optional YAML block at the top. Parsed by `parseDocument()` which returns `{ frontmatter, body }`. The frontmatter block is **stripped** from the body before rendering.
- **Supported features:** Headings H1–H6, tables (GFM), links, inline code, fenced code blocks, blockquotes, lists, task lists, horizontal rules, images, YAML frontmatter.
- **Not supported:** Footnotes, math, Mermaid, raw HTML pass-through, multi-document sets.

#### 9.2 Badge annotations (optional)

The rendering pipeline supports inline badge annotations via the `enhanceMarkdown` preprocessor:

```markdown
- **Severity:** critical
- **Confidence:** verified
```

The preprocessor wraps the value in backticks (`` `critical` ``), which react-markdown parses as inline code, and the `code` component routes to `Badge` via the tag registry.

#### 9.3 Reading-time estimation (NEW in v2)

`estimateReadingTime(body)` returns a string like `"5 min read"`. The estimator:

1. Strips fenced code blocks (via `scanLines` — code is read slower, not as prose words).
2. Strips markdown syntax (headers, bold, italic, links, images, list markers, blockquotes, horizontal rules, HTML tags).
3. Counts Latin words (sequences of Latin letters/digits/apostrophes).
4. Counts CJK characters individually (each CJK char = 1 word — they carry more semantic density than Latin words).
5. Divides by 200 wpm, rounds up to the nearest minute, minimum 1 minute.

```typescript
const WORDS_PER_MINUTE = 200;

export function estimateReadingTime(markdown: string): string {
  if (!markdown || markdown.trim().length === 0) return "0 min read";

  const proseLines = scanLines(markdown)
    .filter((region) => !region.insideFence)
    .map((region) => region.line);

  const prose = proseLines.join("\n");

  const stripped = prose
    .replace(/^#{1,6}\s+/gm, "")       // headers
    .replace(/```[\s\S]*?```/g, "")    // fenced code (defensive)
    .replace(/`[^`]*`/g, " ")          // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")  // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")  // links → text
    .replace(/[*_~]+/g, " ")           // bold/italic/strikethrough markers
    .replace(/^\s*[-*+]\s+/gm, "")     // unordered list markers
    .replace(/^\s*\d{1,9}[.)]\s+/gm, "")  // ordered list markers
    .replace(/^\s*>\s?/gm, "")         // blockquote markers
    .replace(/^[-*_]{3,}\s*$/gm, " ")  // horizontal rules
    .replace(/<[^>]+>/g, " ");         // raw HTML tags

  const latinWords = stripped.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g);
  const latinCount = latinWords ? latinWords.length : 0;

  const cjkChars = stripped.match(
    /[\u3400-\u9FFF\uF900-\uFAFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/g,
  );
  const cjkCount = cjkChars ? cjkChars.length : 0;

  const totalWords = latinCount + cjkCount;
  if (totalWords === 0) return "0 min read";

  const minutes = Math.max(1, Math.ceil(totalWords / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}
```

The reading time is displayed in the layout's meta line (author, date, reading time).

#### 9.4 Adding new content

1. Replace `src/content/document.md` with any markdown file.
2. Run `npm run build` — the pipeline handles frontmatter, tables, headings, images, task lists, code blocks, and reading time automatically.
3. If the content uses badge annotations (`**Tag:** value`), add the tag to the active template's `tags.json`.

---

### §10 Accessibility (WCAG 2.2 AA) Implementation

#### 10.1 Conformance claim

**WCAG 2.2 AA, enforced by an automated axe gate.** The gate runs in both light and dark modes. Zero `color-contrast`, `target-size`, or other AA violations are allowed.

#### 10.2 Implementation matrix

| Feature | Implementation | Verification |
|---------|----------------|--------------|
| Skip-to-content | `<a href="#content">` with `sr-only focus:not-sr-only focus:z-50` | Manual: Tab → Enter → focus lands |
| Focus visible | Global `:focus-visible` ring (2px accent outline) | Manual Tab pass |
| Heading hierarchy | H1 → H2 → H3 → H4, no skipped levels | axe `heading-order` |
| Reduced motion | `prefers-reduced-motion` guard in base styles; `BackToTop` uses instant scroll | Manual OS setting check |
| Touch targets | All interactive elements ≥ 44×44px (`min-h-11 min-w-11`) | axe `target-size` |
| ARIA | `aria-label` on nav/toggle/drawer/copy button; `aria-hidden` on decorative icons; `aria-live` on theme announcements | axe `aria-valid-attr` |
| Landmarks | `header`, `main`, `nav`, `article` | axe `region` |
| Color contrast | All text tokens ≥ 4.5:1 on their backgrounds | axe `color-contrast` |
| Keyboard | Full Tab/Shift+Tab operability; drawer closes on Escape; focus trap while open | Manual |
| Language | `<html lang="en">` | axe `html-has-lang` |
| Mobile drawer | `role="dialog"` + `aria-modal="true"` + `aria-label`; closes on Escape / link click / backdrop click; focus moves to close button on open, back to trigger on close; body scroll locked while open | Manual + axe |
| Theme announcements | Visually-hidden `aria-live="polite"` region announces "Theme changed to {theme}" | Manual screen reader pass |
| Code copy buttons | `aria-label` reflects state ("Copy code" vs "Copied!"); `aria-live="polite"` for state change | Manual + axe |
| Back-to-top | `aria-hidden` and `tabIndex` reflect visibility; `aria-label="Back to top"` | Manual + axe |
| Task list checkboxes | `disabled` + `readOnly` (not toggleable); `aria-label="Task list item"` | axe |
| Images | `loading="lazy"` + `decoding="async"` + alt text (empty string if decorative) | axe `image-alt` |

#### 10.3 The accessibility test

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

#### 10.4 Color contrast fixes applied during build

| Original Token | Original Hex | Background | Ratio | Fixed To | New Ratio |
|----------------|-------------|------------|-------|----------|-----------|
| `--text-tertiary` (light) | `#94a3b8` | `#ffffff` | 2.56:1 ❌ | `#475569` | 5.9:1 ✅ |
| `--text-tertiary` (dark) | `#64748b` | `#0f172a` | 3.9:1 ❌ | `#94a3b8` | 5.3:1 ✅ |

---

### §11 The Configuration Surface (NEW in v2)

The configuration surface is **frontmatter (§3.1) + template choice + tag registry**. There is **no** `defineConfig` helper, no `virtual:` module, no build-time config-object plugin.

The `MarkdownToWebConfig` type is included for teams that want to build their own config helper. v2 provides `resolveConfig(input: unknown): MarkdownToWebConfig` — a validator that throws on invalid fields. This is the team-extension surface; the base pipeline does not require it.

```typescript
// src/lib/config.ts
import type { MarkdownToWebConfig } from "@/types/config";
import type { TemplateName } from "@/types/template";

export const DEFAULT_CONFIG: MarkdownToWebConfig = {
  markdown: "src/content/document.md",
  template: "technical",
  tocMaxDepth: 4,
  offlineFonts: false,
  syntaxHighlighting: false,
};

const VALID_TEMPLATES: readonly TemplateName[] = ["editorial", "technical", "minimal"];
const VALID_TOC_DEPTHS: readonly number[] = [2, 3, 4];

export function resolveConfig(input: unknown): MarkdownToWebConfig {
  if (input === undefined || input === null) return { ...DEFAULT_CONFIG };
  if (typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`Invalid config: expected an object or null/undefined, got ${typeof input}.`);
  }
  // ... validate each field, throw on invalid ...
  return { ...DEFAULT_CONFIG, ...validFields };
}
```

The validator is covered by 14 unit tests (`tests/unit/config.test.ts`).

---

### §12 Template System

#### 12.1 Template switching mechanism

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

To switch to editorial, change the four import paths and `TEMPLATE_NAME`:

```typescript
import "@/templates/editorial/theme.css";
import { editorialComponents } from "@/templates/editorial/components";
import { EditorialLayout } from "@/templates/editorial/layout";
import tagsJson from "@/templates/editorial/tags.json";

export const TEMPLATE_NAME = "editorial" as const;
// ...
```

#### 12.2 What a template provides

Every template directory (`src/templates/{name}/`) contains exactly four files:

| File | Purpose |
|------|---------|
| `theme.css` | Two-layer token pattern (Layer 1 `:root` variables + Layer 2 `@theme inline` bridge) + print styles. **Never nest `@theme` inside `@media`.** |
| `components.tsx` | A partial `ComponentsMap` that merges with the default map in `MarkdownRenderer.tsx`. Typically overrides `h2`, `h3`, `h4`, `a`. |
| `layout.tsx` | A React component receiving `TemplateLayoutProps`. Renders the page shell (header, nav, main, asides). May use shared components (`MobileNav`, `ThemeToggle`, `BackToTop`). |
| `tags.json` | The default tag registry for the template. Must pass `validateRegistry` (no value collisions). |

#### 12.3 Adding a new template

1. Create `src/templates/<name>/` with `theme.css`, `components.tsx`, `layout.tsx`, and `tags.json`.
2. `theme.css` must follow the two-layer token pattern + print styles.
3. `components.tsx` exports a partial `ComponentsMap` that merges with the default map in `MarkdownRenderer.tsx`.
4. `layout.tsx` exports a React component receiving `TemplateLayoutProps`.
5. Add the template name to `TemplateName` in `src/types/template.ts`.
6. Update `src/templates/active.ts` to switch to it.
7. Write integration tests verifying the template exports and renders correctly (see `tests/integration/editorial-template.test.tsx` for the pattern).

---

### §13 Quality Gates (8 gates, all real)

v1.0.0 documented 4 gates but 3 were broken (no eslint config, no prettier config, no markdownlint config). v2 documents 8 gates and all 8 are real — each has a config file, an npm script, and (where applicable) a CI job.

#### 13.1 The 8 gates

```bash
# Gate 1: Typecheck (strict, noUnusedLocals/Parameters/noUncheckedIndexedAccess)
npm run typecheck        # tsc --noEmit

# Gate 2: Lint (ESLint flat config, zero-warning policy)
npm run lint             # eslint . --max-warnings 0

# Gate 3: Format (Prettier check)
npm run lint:format      # prettier --check .

# Gate 4: Markdown lint (markdownlint-cli2)
npm run lint:markdown    # markdownlint-cli2

# Gate 5: Tests (unit + integration + bundle-size)
npm run test             # vitest run

# Gate 6: Coverage (enforces 80/75/80/80 thresholds)
npm run test:coverage    # vitest run --coverage

# Gate 7: Production build
npm run build            # vite build → dist/index.html

# Gate 8: Accessibility (axe-core via Playwright, light + dark)
npm run a11y             # playwright test (requires `npx playwright install chromium` first)
```

#### 13.2 CI workflow (`.github/workflows/ci.yml`)

Two jobs run on every push and PR to `main`/`master`:

- **quality**: Node 22, `npm ci`, typecheck → lint → lint:format → lint:markdown → test:coverage → build → test:bundle-size. Uploads coverage + dist artifacts.
- **accessibility**: Node 22, `npm ci`, build, `npx playwright install chromium --with-deps`, `npm run a11y`. Uploads Playwright report.

Concurrency cancels in-progress runs when a new commit is pushed.

#### 13.3 Pre-commit hook (`.husky/pre-commit`)

Runs `npx lint-staged` (ESLint --fix + Prettier --write + markdownlint --fix on staged files) followed by `npm run typecheck`. A failure blocks the commit.

```json
// package.json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,css}": ["prettier --write"],
  "*.md": ["prettier --write", "markdownlint-cli2 --fix"]
}
```

> **Per project policy, no guardrail is weakened to make a commit pass — fix the cause, not the symptom.** If `eslint --fix` introduces formatting drift, run `prettier --write` after it (lint-staged does this automatically by ordering the commands). If typecheck fails, fix the types; do not add `// @ts-ignore` or `as any`.

#### 13.4 Coverage thresholds

```typescript
// vitest.config.ts
coverage: {
  provider: "v8",
  reporter: ["text", "json", "html"],
  exclude: ["node_modules/", "tests/", "**/*.d.ts", "**/*.config.*", "scripts/"],
  thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
},
```

v2 actual coverage: 87.5% lines / 77.11% branches / 85.32% functions / 90.09% statements — all above thresholds.

---

### §14 Anti-Patterns & Common Bugs

#### 14.1 The original 12 anti-patterns (from v1.0.0, still apply)

| # | Anti-Pattern | Symptom | Root Cause | Fix |
|---|---|---|---|---|
| 1 | Nesting `@theme` inside `@media` | Dark mode silently fails | `@theme` is build-time, top-level only | Variable-flip pattern (§6) |
| 2 | `dangerouslySetInnerHTML` for markdown | XSS surface, dual pipelines | HTML-string architecture | Use the components map |
| 3 | `import { slug } from "github-slugger"` | Build error | No named export exists | `import GithubSlugger from "github-slugger"` |
| 4 | Using `baseUrl` in TS 6 tsconfig | Hard error: "Option baseUrl is deprecated" | TS 6 deprecation | Remove `baseUrl`; use `paths` with `./` prefix |
| 5 | Forgetting `jsdom` for vitest | "Cannot find package 'jsdom'" | jsdom not bundled with vitest | `npm install -D jsdom` |
| 6 | Running Playwright tests under vitest | "calling test() from async test.describe()" | Wrong runner | `npx playwright test` for accessibility |
| 7 | Not installing Playwright browsers | "Executable doesn't exist" | Browsers not bundled | `npx playwright install chromium` |
| 8 | Badge test registry with collisions | Wrong tag assigned | `resolveBadge` returns first match | Unique values across registry |
| 9 | Testing slug parity with untrimmed fixtures | Whitespace mismatch | `buildToc` trims heading text | Compare against `slugger.slug(text.trim())` |
| 10 | `--text-tertiary` too light for AA | 2.56:1 contrast failure | Default slate-400 too bright | Darken to slate-600 (`#475569`) |
| 11 | Using exact-pinned deps without checking Vite 8 compatibility | Peer dependency conflicts | Pinned versions predate Vite 8 | Check peer ranges; use latest patch |
| 12 | `noUncheckedIndexedAccess` without null checks | `TocItem possibly undefined` | Strict array access | Use optional chaining (`toc[0]?.slug`) |

#### 14.2 New anti-patterns discovered in v2 remediation (13 new)

| # | Anti-Pattern | Symptom | Root Cause | Fix |
|---|---|---|---|---|
| 13 | **Missing `eslint.config.js`** | `npm run lint` errors: "ESLint couldn't find an eslint.config.(js\|mjs\|cjs) file" | ESLint 9 requires flat config; v1.0.0 had none | Create `eslint.config.js` with `js.configs.recommended` + `tseslint.configs.recommended` + react-hooks + jsx-a11y |
| 14 | **Missing `.prettierrc.json`** | `npm run lint:format` fails on 28 files | No Prettier config; defaults don't match project style | Create `.prettierrc.json` (printWidth 100, double quotes, trailingComma all, semi true) + `.prettierignore` |
| 15 | **Missing `.markdownlint-cli2.jsonc`** | `npm run lint:markdown` errors with usage message | markdownlint-cli2 v0.14+ requires its own config format with explicit globs (not `.markdownlint.json`) | Create `.markdownlint-cli2.jsonc` with `config` + `globs` keys |
| 16 | **Dead types** (`MarkdownToWebConfig` defined but never imported) | Misleading API surface; maintainers assume the type is wired in | Type was added as a "team-extension surface" but never consumed | Either delete it or actually consume it (v2 added `resolveConfig` validator with 14 tests) |
| 17 | **Duplicate type definitions** (`ResolvedBadge` in both `lib/tags.ts` and `types/tag.ts`) | Risk of drift; violates DRY; `types/` is supposed to be canonical | Copy-paste during initial development | Delete from `lib/`, import from `types/`, re-export for convenience |
| 18 | **Orphaned tsconfig files** (`tsconfig.app.json`, `tsconfig.node.json` not referenced) | Misleading project structure; maintainers "fix" the wrong config | Vite scaffold generated them but `tsconfig.json` doesn't use `references` | Delete the orphans (single-config is simpler) OR properly wire `references` |
| 19 | **Tracked build artifacts** (`dist/`, `test-results/` committed despite `.gitignore`) | Repo bloat; confusing "modified" state after rebuild; Prettier chokes on generated JSON | Files were committed before `.gitignore` was added | `git rm -r --cached dist test-results` |
| 20 | **Orphaned config files** (`.oxlintrc.json` exists but `oxlint` not installed) | Misleading; `$schema` reference may warn in editors | Tool was considered then dropped; config left behind | Delete the config file |
| 21 | **Emoji icons instead of SVG** (`ThemeToggle` used ☀️🌙💻) | Inconsistent rendering across platforms; `lucide-react` listed as dep but unused | Quick-and-dirty initial implementation | Use `lucide-react` icons (`Sun`, `Moon`, `Monitor`) with `aria-hidden` |
| 22 | **Missing system-theme subscription** (OS theme change doesn't update the page) | "System" mode is non-reactive; requires reload | `ThemeToggle` only set the attribute once; no `matchMedia` listener | Add `useEffect` that subscribes to `matchMedia("(prefers-color-scheme: dark)")` change events when in system mode |
| 23 | **Missing `img` component override** | No lazy loading, no async decoding, no responsive class | Components map didn't cover `img` | Add `img: ({ src, alt, ...rest }) => <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" className="max-w-full h-auto ..." {...rest} />` |
| 24 | **Missing `input` component override** (GFM task list checkboxes are toggleable) | Users can toggle checkboxes but state isn't saved — misleading | `remark-gfm` parses `- [ ]` into `<input type="checkbox">`; default is interactive | Add `input` override: when `type === "checkbox"`, set `disabled` + `readOnly` + `aria-label` |
| 25 | **`ErrorBoundary` function fallback loses `errorInfo`** (passes `{} as ErrorInfo`) | Function fallbacks can't access `componentStack` for debugging | `componentDidCatch` received `errorInfo` but didn't store it; render() used a stub | Store `errorInfo` in component state in `componentDidCatch`; pass the real value to the fallback |

---

### §15 Debugging Guide

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Cannot find module 'jsdom'` when running tests | `jsdom` not installed | `npm install -D jsdom` |
| `Option baseUrl is deprecated` in TS 6 | `baseUrl` removed in TS 6 | Remove from tsconfig; use `paths` |
| `peer vite@"^5\|^6\|^7"` conflict | Plugin version predates Vite 8 | Use `@tailwindcss/vite@4.3.3+`, `vite-plugin-singlefile@2.3.3+` |
| `Executable doesn't exist at ...chromium` | Playwright browsers not installed | `npx playwright install chromium` |
| Badge renders as plain `<code>` (no color) | Markdown not run through `enhanceMarkdown` first | Pipeline: `enhanceMarkdown` → `MarkdownRenderer` |
| `getByLabelText` finds wrong badge | Value collision across tags | Ensure unique values in registry |
| Slug parity test fails on whitespace fixture | `buildToc` trims heading text | Compare against `slugger.slug(text.trim())` |
| `color-contrast` AA violation on tertiary text | Text token too light for background | Darken token (see §10.4) |
| Dark mode doesn't apply on toggle | `data-theme` not set on `<html>` | `document.documentElement.setAttribute("data-theme", "dark")` |
| `Property 'env' does not exist on type 'ImportMeta'` | Missing Vite client types | Add `/// <reference types="vite/client" />` |
| `Cannot find name 'fs'/'path'/'process'` in tests | Missing `@types/node` | `npm install -D @types/node` + add to tsconfig `types` |
| Build exceeds 250 KB gzipped | Large markdown or un-tree-shaken icons | Subset lucide-react imports; check bundle |
| **`ESLint couldn't find an eslint.config.(js\|mjs\|cjs) file`** | Missing `eslint.config.js` (ESLint 9 requires flat config) | Create `eslint.config.js` at repo root |
| **`npm run lint:format` fails on N files** | Missing `.prettierrc.json` or format drift | Create `.prettierrc.json`; run `npx prettier --write .` once |
| **`npm run lint:markdown` prints a usage message and exits non-zero** | Missing `.markdownlint-cli2.jsonc` (v0.14+ needs its own format with explicit globs) | Create `.markdownlint-cli2.jsonc` with `config` + `globs` keys |
| **Prettier format drift after `eslint --fix`** | Autofixers can drift the formatter's fixed point | Always run `prettier --write` AFTER `eslint --fix` (lint-staged orders this correctly) |
| **`__dirname` deprecation warning in Vite 8** | Vite 8 deprecates `__dirname` in config files | Replace `resolve(__dirname, "src")` with `resolve(import.meta.dirname, "src")` |
| **`IntersectionObserver is not defined` in vitest** | jsdom doesn't implement IntersectionObserver | Mock it in `tests/setup.ts` (see §27.3) |
| **`matchMedia is not a function` in vitest** | jsdom doesn't implement matchMedia | Mock it in `tests/setup.ts` (see §27.3) |
| **`navigator.clipboard is undefined` in insecure context** | Clipboard API requires HTTPS (or localhost) | Use `document.execCommand("copy")` fallback (see `CopyButton.tsx`) |
| **GFM task list checkboxes are toggleable** | Default `<input type="checkbox">` is interactive | Add `input` component override with `disabled` + `readOnly` |
| **Theme toggle doesn't update when OS theme changes** | No `matchMedia` change listener | Add `useEffect` subscribing to `change` events when in system mode |
| **`document.title` doesn't reflect frontmatter** | `index.html` title is hardcoded | Add `useEffect` in `App.tsx` that sets `document.title = frontmatter.title` |
| **TOC highlights a section the user scrolled past** | `IntersectionObserver` callback only sets `activeSlug` on positive intersection | Clear `activeSlug` to `""` when every observed entry reports `!isIntersecting` |

---

### §16 Pre-Ship Checklist

Run in order. All must pass.

```bash
# Gate 1: Typecheck (strict, noUnusedLocals/Parameters/noUncheckedIndexedAccess)
npm run typecheck

# Gate 2: Lint (ESLint flat config, zero-warning policy)
npm run lint

# Gate 3: Format (Prettier check)
npm run lint:format

# Gate 4: Markdown lint (markdownlint-cli2)
npm run lint:markdown

# Gate 5: Tests (unit + integration + bundle-size)
npm run test

# Gate 6: Coverage (enforces 80/75/80/80 thresholds)
npm run test:coverage

# Gate 7: Production build
npm run build
# Verify: dist/index.html exists, JS/CSS inlined, < 250 KB gzipped

# Gate 8: Accessibility (axe-core via Playwright, light + dark)
npm run a11y
# Requires: npx playwright install chromium (one-time)

# Gate V-1: Verify dependency versions
npm ls --depth=0
# Every row in §4 must appear at the stated version.
```

**Test counts (v2, verified):**

| Suite | Count |
|-------|-------|
| Unit | 68 (fence: 5, enhance: 10, toc: 9, frontmatter: 7, tags: 6, slug-parity: 9, config: 14, reading-time: 8) |
| Integration | 55 (across 10 files) |
| Accessibility | 2 (Playwright) |
| Performance | 1 (bundle-size) |
| **Total** | **124 vitest + 2 Playwright = 126** |

**Build output:** `dist/index.html` — 598 KB raw, 171 KB gzipped (well under 250 KB budget; 79 KB of headroom).

---

### §17 Lessons Learnt & How to Avoid Them

#### Lessons 1–10 (from v1.0.0, still apply)

**Lesson 1: Vite 8 requires updated plugin versions — exact pins from old specs will break.**
After scaffolding, check what Vite version was installed. Then verify every pinned dependency's peer range includes it. Use `npm view <pkg>@<version> peerDependencies` to check. Fix: `vite-plugin-singlefile@2.3.3` and `@tailwindcss/vite@4.3.3` (both add `|| ^8` to peer range).

**Lesson 2: TypeScript 6 deprecates `baseUrl` — remove it.**
Use `paths` with relative `./` prefix instead: `"paths": { "@/*": ["./src/*"] }`.

**Lesson 3: `jsdom` must be explicitly installed for vitest.**
Vitest doesn't bundle jsdom — it's an optional peer. `npm install -D jsdom`.

**Lesson 4: The badge pipeline requires `enhanceMarkdown` BEFORE `MarkdownRenderer`.**
Badges only render when the markdown has been pre-processed by `enhanceMarkdown` first, which wraps values in backticks. In integration tests, run the full pipeline: `enhanceMarkdown(raw, registry)` → `MarkdownRenderer(enhanced, registry)`.

**Lesson 5: Badge test registries must have unique values across tags.**
`resolveBadge` iterates `Object.values(registry)` and returns the first matching value. The order is insertion order, not priority-based. `validateRegistry` catches this at load time — always call it.

**Lesson 6: `buildToc` trims heading text before slugging — parity tests must account for this.**
Compare against `slugger.slug(text.trim())` in parity tests, or only use fixtures that are already trimmed.

**Lesson 7: Playwright browsers must be explicitly installed.**
After installing `@playwright/test`, always run `npx playwright install chromium`.

**Lesson 8: The `--text-tertiary` token was too light for WCAG AA.**
Verify every text token against its background using a contrast checker. For the technical template, `--text-tertiary` was darkened to `#475569` (same as secondary).

**Lesson 9: Playwright tests must run under Playwright, not vitest.**
Exclude accessibility tests from vitest config (`exclude: ["tests/accessibility/**"]`) and run them separately with `npx playwright test`.

**Lesson 10: `@types/node` is required for Node.js APIs in test files.**
Install `@types/node` and add `"types": ["node"]` to tsconfig compilerOptions.

#### Lessons 11–24 (NEW in v2 — from the remediation)

**Lesson 11: A documented gate that doesn't run is worse than no gate.**
v1.0.0 documented a "zero-warning policy" lint gate but had no `eslint.config.js`. The gate couldn't fire, so lint drift accumulated undetected. *A gate that exists only in documentation actively misleads maintainers.* Fix: every documented gate must have a config file, an npm script, and (where applicable) a CI job. Verify by running the gate command — if it errors with "config not found," the gate is broken regardless of what the docs say.

**Lesson 12: Dead types mislead maintainers.**
v1.0.0 defined `MarkdownToWebConfig` as "the team-extension surface" but never imported it anywhere. Maintainers reading the type assumed it was wired into the build system. Fix: either delete dead types or actually consume them. v2 added `resolveConfig` (a validator) with 14 tests, making the type load-bearing.

**Lesson 13: Duplicate type definitions drift.**
v1.0.0 defined `ResolvedBadge` in both `src/lib/tags.ts` and `src/types/tag.ts`, and `TocItem` in both `src/lib/toc.ts` and `src/types/toc.ts`. The duplicates were identical at creation but would inevitably drift. Fix: `types/` is the canonical home. `lib/` modules import from `types/` and may re-export for convenience, but never redefine. Verify with `rg "interface ResolvedBadge"` — should return exactly one match.

**Lesson 14: Orphaned config files silently rot.**
v1.0.0 had `tsconfig.app.json` and `tsconfig.node.json` that no other file referenced. They had inconsistent settings with the active `tsconfig.json` (different `target`, `verbatimModuleSyntax`, `erasableSyntaxOnly`). Maintainers might "fix" the orphaned configs thinking they affect the build. Fix: delete orphaned configs, or properly wire them with `references`. The single-config approach is simpler for small projects.

**Lesson 15: Emojis render inconsistently across platforms.**
v1.0.0 used `☀️🌙💻` for the theme toggle. Emoji rendering varies by OS (Apple, Google, Microsoft, Samsung all have different glyphs), font support is uneven, and the `lucide-react` dependency was listed but unused. Fix: use `lucide-react` SVG icons (`Sun`, `Moon`, `Monitor`). They render identically everywhere, are tree-shaken, and the dependency is no longer dead.

**Lesson 16: System theme changes don't fire React state updates without a `matchMedia` listener.**
v1.0.0's `ThemeToggle` set `data-theme` once on mount. If the user changed their OS theme while the page was open, the CSS `@media (prefers-color-scheme: dark)` rule would re-apply, but React's `theme` state was stale. Fix: add a `useEffect` that subscribes to `matchMedia("(prefers-color-scheme: dark)")` change events when `theme === "system"`. Re-apply the `data-theme` attribute based on `e.matches`.

**Lesson 17: GFM task list checkboxes are interactive by default — disable them.**
`remark-gfm` parses `- [ ]` and `- [x]` into `<input type="checkbox">` elements. Without an `input` component override, they render as default browser checkboxes that users can toggle. The state isn't persisted, so toggling is misleading. Fix: add an `input` component override that sets `disabled`, `readOnly`, and `aria-label="Task list item"`.

**Lesson 18: `ErrorBoundary` function fallbacks lose `errorInfo` without explicit storage.**
v1.0.0's `ErrorBoundary` called function fallbacks as `this.props.fallback(this.state.error!, {} as ErrorInfo)` — the second argument was a type-cast empty object. The real `errorInfo` (with `componentStack`) was available in `componentDidCatch` but discarded. Fix: store `errorInfo` in component state in `componentDidCatch`. Pass the real value to the fallback.

**Lesson 19: `IntersectionObserver` only fires on positive intersection — clear state explicitly.**
v1.0.0's `App.tsx` set `activeSlug` only when `entry.isIntersecting` was true. When the user scrolled above the first heading, no entry was intersecting, so `activeSlug` retained its previous value — highlighting a section the user wasn't reading. Fix: in the observer callback, check if every observed entry reports `!isIntersecting`. If so, clear `activeSlug` to `""`.

**Lesson 20: `document.title` is not reactive — sync it via `useEffect`.**
v1.0.0's `index.html` had `<title>Skills Catalog</title>` hardcoded. The frontmatter `title` was used for the page heading but not for the browser tab. Fix: add a `useEffect` in `App.tsx` that sets `document.title = frontmatter.title ?? "Default"`.

**Lesson 21: `navigator.clipboard` is unavailable in insecure contexts — keep the `execCommand` fallback.**
The Clipboard API requires HTTPS (or localhost). In insecure contexts, `navigator.clipboard` is `undefined`. Fix: `CopyButton` checks for `navigator.clipboard?.writeText` first; if unavailable, falls back to creating a temporary `<textarea>`, calling `document.execCommand("copy")`, and removing it. The fallback is deprecated but still works in all browsers.

**Lesson 22: jsdom doesn't implement `IntersectionObserver` or `matchMedia` — mock them in `tests/setup.ts`.**
Integration tests that render `<App />` (which uses `IntersectionObserver`) or `<ThemeToggle />` (which uses `matchMedia`) will crash in jsdom with "X is not defined." Fix: add minimal mocks to `tests/setup.ts`. The `IntersectionObserver` mock just needs `observe`, `unobserve`, `disconnect`, and `takeRecords` methods. The `matchMedia` mock needs `matches`, `media`, `addEventListener`, `removeEventListener`.

**Lesson 23: `markdownlint-cli2` v0.14+ requires its own config format with explicit globs.**
v1.0.0 had `"lint:markdown": "markdownlint-cli2"` but no config. Running it produced a usage message and exit code 1. The fix is NOT to create `.markdownlint.json` (the old format) — markdownlint-cli2 v0.14+ ignores it. Fix: create `.markdownlint-cli2.jsonc` with a `config` object (the rule settings) and a `globs` array (which files to lint, with `!`-prefixed exclusions).

**Lesson 24: The `__dirname` deprecation in Vite 8 — use `import.meta.dirname`.**
Vite 8 warns: *"Your Vite config uses features that are unsupported by `configLoader: 'native'`... `__dirname`... Use `import.meta.dirname` instead."* Fix: replace `resolve(__dirname, "src")` with `resolve(import.meta.dirname, "src")` in `vite.config.ts` and `vitest.config.ts`. The warning goes away.

---

### §18 Pitfalls to Avoid

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
13. **Don't document a gate without a config file** (NEW in v2). A documented gate that can't run is worse than no gate — it misleads maintainers. Every gate needs a config file + an npm script + (where applicable) a CI job.
14. **Don't define a type in two places** (NEW in v2). `types/` is canonical; `lib/` imports and re-exports. Duplicates drift.
15. **Don't leave orphaned config files** (NEW in v2). If a tool was considered then dropped, delete its config. Orphaned configs silently rot.
16. **Don't commit `dist/` or `test-results/`** (NEW in v2). They're build artifacts. Add to `.gitignore` and `git rm -r --cached` if already tracked.
17. **Don't use emojis for UI icons** (NEW in v2). They render inconsistently across platforms. Use `lucide-react` (or inline SVGs).
18. **Don't assume OS theme changes will update React state** (NEW in v2). Subscribe to `matchMedia` change events explicitly.
19. **Don't leave GFM task list checkboxes interactive** (NEW in v2). They're not connected to any state. Disable them.
20. **Don't stub `errorInfo` in `ErrorBoundary` function fallbacks** (NEW in v2). Store the real `errorInfo` in state and pass it through.
21. **Don't use `__dirname` in Vite 8 config files** (NEW in v2). Use `import.meta.dirname`.
22. **Don't forget to mock `IntersectionObserver` and `matchMedia` in jsdom** (NEW in v2). Add them to `tests/setup.ts`.
23. **Don't create `.markdownlint.json` for `markdownlint-cli2` v0.14+** (NEW in v2). Use `.markdownlint-cli2.jsonc` with `config` + `globs` keys.
24. **Don't weaken a guardrail to make a gate pass** (NEW in v2). Fix the cause, not the symptom. No `// @ts-ignore`, no `as any`, no disabled lint rules, no skipped tests.

---

### §19 Best Practices

#### Code organization
- One file, one responsibility. `MarkdownRenderer.tsx` renders; `Badge.tsx` styles tags; `tags.ts` validates/resolves the registry; `enhance.ts` preprocesses strings; `fence.ts` scans lines.
- Template switching is a one-file edit (`src/templates/active.ts`).
- Memoize every derived value (`parseDocument`, `enhanceMarkdown`, `buildToc`, `estimateReadingTime`).
- `types/` is the canonical home for interfaces. `lib/` modules import from `types/` and may re-export.

#### TypeScript conventions
- Strict mode enabled (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`).
- `interface` for object shapes, `type` for unions/intersections.
- Use optional chaining with `noUncheckedIndexedAccess`: `toc[0]?.slug`.
- `import type` for type-only imports (enforced by `@typescript-eslint/consistent-type-imports`).
- Never use `any` — use `unknown` (enforced by `@typescript-eslint/no-explicit-any`).

#### Testing conventions (NEW in v2 — expanded)
- **TDD: write the failing test first.** Red → green → refactor.
- Test behavior, not implementation.
- Test the full pipeline in integration tests (enhance → render), not isolated units.
- Badge tests must use unique values across tags.
- Slug parity tests must compare against trimmed text.
- Accessibility tests run via Playwright, not vitest.
- Mock `IntersectionObserver` and `matchMedia` in `tests/setup.ts` — jsdom doesn't implement them.
- When testing components that use `matchMedia`, mock it per-test with controllable `matches` and a way to emit change events.
- When testing clipboard components, mock `navigator.clipboard.writeText` and `document.execCommand` separately to test both paths.
- Use `vi.spyOn(console, "error").mockImplementation(() => {})` to suppress expected React error logging in ErrorBoundary tests.

#### Design system conventions
- All colors come from `@theme` tokens — no arbitrary hex values in components.
- Dark mode via variable flipping, never `dark:` utilities.
- Verify contrast ratios for every text token against its background.
- Print styles in every template's `theme.css` — paper is always light.

#### Build conventions
- `vite-plugin-singlefile` inlines JS/CSS into one HTML file.
- `cssCodeSplit: false` and `inlineDynamicImports: true` ensure true single-file output.
- Google Fonts via `@import` in CSS (not in JS).
- Use `import.meta.dirname` (not `__dirname`) in Vite 8 config files.

#### Gate conventions (NEW in v2)
- Every documented gate has a config file, an npm script, and (where applicable) a CI job.
- Run `prettier --write` AFTER `eslint --fix` to avoid format drift.
- `lint-staged` orders this correctly: `["eslint --fix", "prettier --write"]`.
- Never weaken a guardrail to make a gate pass. Fix the cause.

---

### §20 Coding Patterns

#### Pattern 1: Fence-aware line scanner

Used by `buildToc`, `enhanceMarkdown`, and `estimateReadingTime` to avoid processing content inside code fences:

```typescript
// src/lib/fence.ts
export function scanLines(markdown: string): MarkdownRegion[] {
  // CommonMark-subset fence tracking: ``` or ~~~ (up to 3 leading spaces)
  // Returns { line, lineNumber, insideFence } for each line
}
```

#### Pattern 2: Backtick-wrapping badge pipeline

```
Author writes:        - **Severity:** critical
enhance.ts wraps:     - **Severity:** `critical`
react-markdown parses: inline code element with children="critical"
components.code:       resolveBadge(registry, "critical") → <Badge />
```

#### Pattern 3: Stack-based TOC nesting

```typescript
// src/lib/toc.ts — the while loop pops until top's level < current's level
while (stack.length > 0 && stack[stack.length - 1]!.level >= level) {
  stack.pop();
}
if (stack.length === 0) items.push(item);
else stack[stack.length - 1]!.children.push(item);
stack.push(item);
```

#### Pattern 4: IntersectionObserver for active-section highlighting (UPDATED in v2)

```typescript
// App.tsx — observe all TOC levels; clear activeSlug when none intersect
const observer = new IntersectionObserver(
  (entries) => {
    // Clear when every observed entry reports not-intersecting
    if (entries.length > 0 && entries.every((e) => !e.isIntersecting)) {
      setActiveSlug("");
      return;
    }
    for (const entry of entries) {
      if (entry.isIntersecting) setActiveSlug(entry.target.id);
    }
  },
  { rootMargin: "-80px 0px -80% 0px" },
);
```

#### Pattern 5: localStorage with try/catch + in-memory fallback

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

#### Pattern 6: Memoized pipeline in App.tsx

```typescript
const { frontmatter, body } = useMemo(() => parseDocument(documentMd), []);
const enhanced = useMemo(() => enhanceMarkdown(body, registry), [body, registry]);
const toc = useMemo(() => buildToc(body, 4), [body]);
const readingTime = useMemo(() => estimateReadingTime(body), [body]);
```

#### Pattern 7: Clipboard copy with fallback (NEW in v2)

```typescript
// src/components/CopyButton.tsx
const handleCopy = useCallback(async () => {
  const text = getText();
  let succeeded = false;

  // Modern API
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      succeeded = true;
    } catch {
      // Fall through to execCommand
    }
  }

  // Fallback for older browsers / insecure contexts
  if (!succeeded) {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      succeeded = document.execCommand("copy");
      document.body.removeChild(textarea);
    } catch {
      // Silent failure
    }
  }

  if (succeeded) {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
}, [getText]);
```

#### Pattern 8: Mobile drawer with focus trap + body scroll lock (NEW in v2)

```typescript
// src/components/MobileNav.tsx
// 1. role="dialog" + aria-modal="true" + aria-label
// 2. Close on Escape (useEffect + keydown listener)
// 3. Close on link click (onNavigate callback)
// 4. Close on backdrop click (onClick target === currentTarget)
// 5. Focus management: open → focus close button; close → focus trigger
// 6. Body scroll lock: document.body.style.overflow = "hidden" while open
// 7. z-50 to sit above the sticky header (z-40)
```

#### Pattern 9: Scroll-triggered visibility (NEW in v2)

```typescript
// src/components/BackToTop.tsx
const [visible, setVisible] = useState(false);

useEffect(() => {
  const handler = () => {
    const viewport = window.innerHeight;
    setVisible(window.scrollY > viewport);  // past one viewport
  };
  handler();  // initial check (for fragment navigation)
  window.addEventListener("scroll", handler, { passive: true });
  return () => window.removeEventListener("scroll", handler);
}, []);

// Respect prefers-reduced-motion
const handleClick = () => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
};

// aria-hidden + tabIndex reflect visibility
<button aria-hidden={visible ? "false" : "true"} tabIndex={visible ? 0 : -1} />
```

#### Pattern 10: System theme subscription (NEW in v2)

```typescript
// src/components/ThemeToggle.tsx
useEffect(() => {
  if (theme !== "system") return;
  if (typeof window.matchMedia !== "function") return;

  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (e: MediaQueryListEvent) => {
    if (e.matches) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
}, [theme]);
```

#### Pattern 11: aria-live announcements (NEW in v2)

```typescript
// src/components/ThemeToggle.tsx
const [announcement, setAnnouncement] = useState("");

useEffect(() => {
  applyTheme(theme);
  writeTheme(theme);
  setAnnouncement(`Theme changed to ${THEME_LABEL[theme].toLowerCase()}`);
}, [theme]);

return (
  <>
    <button onClick={cycle} aria-label={`Toggle theme (current: ${theme})`}>
      <Icon aria-hidden="true" />
    </button>
    {/* Visually-hidden live region for screen readers */}
    <span aria-live="polite" className="sr-only">
      {announcement}
    </span>
  </>
);
```

#### Pattern 12: CodeBlockWrapper with copy button (NEW in v2)

```typescript
// src/components/MarkdownRenderer.tsx
function CodeBlockWrapper({ children }: { children: ReactNode }) {
  const codeTextRef: { current: string } = { current: "" };

  const getText = () => codeTextRef.current;
  const captureText = (node: HTMLPreElement | null) => {
    if (node) codeTextRef.current = node.textContent ?? "";
  };

  return (
    <div className="relative my-4">
      <div className="absolute right-2 top-2 z-10">
        <CopyButton getText={getText} />
      </div>
      <pre ref={captureText} className="...">
        {children}
      </pre>
    </div>
  );
}
```

#### Pattern 13: Config validation with resolveConfig (NEW in v2)

```typescript
// src/lib/config.ts
export function resolveConfig(input: unknown): MarkdownToWebConfig {
  if (input === undefined || input === null) return { ...DEFAULT_CONFIG };
  if (!isObject(input)) {
    throw new Error(`Invalid config: expected an object, got ${typeof input}.`);
  }

  const result: MarkdownToWebConfig = { ...DEFAULT_CONFIG };

  if ("template" in input) {
    const template = input.template;
    if (typeof template !== "string") throw new Error("...");
    if (!VALID_TEMPLATES.includes(template as TemplateName)) {
      throw new Error(`Invalid template: "${template}". Valid: ${VALID_TEMPLATES.join(", ")}.`);
    }
    result.template = template as TemplateName;
  }
  // ... validate each field ...

  return result;
}
```

#### Pattern 14: Reading-time estimation with CJK awareness (NEW in v2)

See §9.3 for the full implementation. Key points:
- Strip fenced code blocks first (code is not prose).
- Strip markdown syntax (headers, bold, links, images, list markers).
- Count Latin words as whitespace-separated tokens.
- Count CJK characters individually (each char = 1 word).
- 200 wpm, round up, minimum 1 minute.

#### Pattern 15: Print stylesheet (NEW in v2)

See §6.3 for the full implementation. Key points:
- Force light-mode color tokens in `:root`.
- Hide chrome via attribute selectors (`[aria-label="..."]`).
- Expand `<main>` to full width.
- Append href after links via `a[href]::after { content: " (" attr(href) ")"; }`.
- `page-break-inside: avoid` on code/tables/blockquotes.
- `page-break-after: avoid` on headings.

---

### §21 Coding Anti-Patterns

#### ❌ `dangerouslySetInnerHTML` for markdown

```typescript
// WRONG — XSS surface, defeats React reconciliation
<div dangerouslySetInnerHTML={{ __html: html }} />

// CORRECT — components map renders Markdown as React elements
<ReactMarkdown components={{ code: BadgeWrapper }}>{markdown}</ReactMarkdown>
```

#### ❌ `@theme` inside `@media`

```css
/* WRONG — silently breaks dark mode */
@media (prefers-color-scheme: dark) {
  @theme inline { --color-bg: #0f172a; }
}

/* CORRECT — Layer 1 runtime variables + Layer 2 @theme inline */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { --bg: #0f172a; }
}
@theme inline { --color-bg: var(--bg); }
```

#### ❌ Named import from github-slugger

```typescript
// WRONG — no named export exists
import { slug } from "github-slugger";

// CORRECT — default export class
import GithubSlugger from "github-slugger";
const slugger = new GithubSlugger();
```

#### ❌ Unmemoized pipeline

```typescript
// WRONG — re-computes on every render
const { body } = parseDocument(markdown);
const enhanced = enhanceMarkdown(body, registry);

// CORRECT — memoized
const { body } = useMemo(() => parseDocument(markdown), []);
const enhanced = useMemo(() => enhanceMarkdown(body, registry), [body, registry]);
```

#### ❌ Testing renderer without enhance pipeline

```typescript
// WRONG — badges won't render
render(<MarkdownRenderer markdown="- **Severity:** critical" registry={registry} />);

// CORRECT — run enhance first
const { enhanced } = enhanceMarkdown("- **Severity:** critical", registry);
render(<MarkdownRenderer markdown={enhanced} registry={registry} />);
```

#### ❌ Documenting a gate without a config file (NEW in v2)

```bash
# WRONG — npm run lint errors because eslint.config.js doesn't exist
"lint": "eslint . --max-warnings 0"
# (no eslint.config.js in repo)

# CORRECT — config file + script + CI job
"lint": "eslint . --max-warnings 0"
# + eslint.config.js at repo root
# + .github/workflows/ci.yml runs `npm run lint`
```

#### ❌ Duplicate type definitions (NEW in v2)

```typescript
// WRONG — ResolvedBadge defined in both files; will drift
// src/types/tag.ts
export interface ResolvedBadge { ... }
// src/lib/tags.ts
export interface ResolvedBadge { ... }

// CORRECT — types/ is canonical; lib/ imports and re-exports
// src/types/tag.ts
export interface ResolvedBadge { ... }
// src/lib/tags.ts
import type { ResolvedBadge } from "@/types/tag";
export type { ResolvedBadge };
```

#### ❌ Emoji icons instead of SVG (NEW in v2)

```typescript
// WRONG — renders inconsistently across platforms; lucide-react dep is dead
{theme === "light" ? "☀️" : theme === "dark" ? "🌙" : "💻"}

// CORRECT — consistent SVG icons; lucide-react dep is consumed
import { Sun, Moon, Monitor } from "lucide-react";
const Icon = THEME_ICON[theme];
<Icon aria-hidden="true" className="h-5 w-5" />
```

#### ❌ `__dirname` in Vite 8 config (NEW in v2)

```typescript
// WRONG — Vite 8 deprecation warning
resolve: { alias: { "@": resolve(__dirname, "src") } }

// CORRECT — use import.meta.dirname
resolve: { alias: { "@": resolve(import.meta.dirname, "src") } }
```

#### ❌ Stub `errorInfo` in ErrorBoundary (NEW in v2)

```typescript
// WRONG — function fallbacks lose componentStack
return this.props.fallback(this.state.error!, {} as ErrorInfo);

// CORRECT — store errorInfo in state, pass the real value
componentDidCatch(error, errorInfo) {
  this.setState({ errorInfo });
  // ...
}
render() {
  // ...
  return this.props.fallback(this.state.error!, this.state.errorInfo ?? { componentStack: "" });
}
```

---

### §22 Responsive Breakpoint Reference

Tailwind default breakpoints (no custom config):

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm` | 640px | H1 sizing (`text-3xl sm:text-4xl`); meta line subtitle visibility |
| `md` | 768px | (unused) |
| `lg` | 1024px | **TOC sidebar appears** (`lg:block`); **mobile nav hamburger hides** (`lg:hidden`) |
| `xl` | 1280px | **Right "on this page" outline appears** (`xl:block`) — technical template only |
| `2xl` | 1536px | (unused) |

**Layout behavior:**
- **Desktop (≥1280px, technical):** Three-column — left TOC nav + content + right outline.
- **Desktop (≥1024px, editorial):** Single-column — content only (no right outline).
- **Tablet (768–1023px):** Single column — content only. **Mobile nav hamburger visible** in header.
- **Mobile (<768px):** Single column — content only. Mobile nav hamburger visible.

**BackToTop button visibility:**
- Hidden on initial render (scrollY = 0).
- Becomes visible after scrolling past one viewport (`window.scrollY > window.innerHeight`).
- `opacity-0 translate-y-2 pointer-events-none` when hidden; `opacity-100 translate-y-0 pointer-events-auto` when visible.

---

### §23 Z-Index Layer Map

| z-index | Element | Purpose | File |
|---------|---------|---------|------|
| `z-50` | Skip-to-content link (focused) | Topmost — must be above everything when focused | `SkipLink.tsx` |
| `z-50` | MobileNav drawer + backdrop | Above sticky header when open | `MobileNav.tsx` |
| `z-40` | Sticky header | Above content, below drawer | `layout.tsx` (both templates) |
| `z-30` | BackToTop button | Above content, below header | `BackToTop.tsx` |
| `z-10` | CopyButton inside CodeBlockWrapper | Above `<pre>` content, below everything else | `MarkdownRenderer.tsx` |

**Rule:** if you add a new floating/fixed element, update this map in the same commit. No portals or dialogs exist beyond `MobileNav`. The drawer's `z-50` is intentionally equal to `SkipLink`'s `z-50` because they never co-occur (the drawer is modal; the skip link is only visible on focus, which doesn't happen while a modal is open).

---

### §24 Color Reference (Complete)

#### 24.1 Technical template — Light mode

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

#### 24.2 Technical template — Dark mode

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#0f172a` | Page background |
| `--bg-secondary` | `#1e293b` | Header, code blocks |
| `--bg-tertiary` | `#334155` | Hover states |
| `--text` | `#f8fafc` | Headings |
| `--text-secondary` | `#cbd5e1` | Body |
| `--text-tertiary` | `#94a3b8` | Labels |
| `--border` | `#334155` | Borders |
| `--accent` | `#60a5fa` | Links |

#### 24.3 Editorial template — Light mode (NEW in v2)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#fdfbf7` | Page background (warm cream) |
| `--bg-secondary` | `#f5f0e6` | Header, code blocks |
| `--bg-tertiary` | `#ebe3d2` | Hover states |
| `--text` | `#1c1814` | Headings (warm ink) |
| `--text-secondary` | `#3a342c` | Body |
| `--text-tertiary` | `#5e5448` | Labels |
| `--border` | `#d8cdb6` | Borders |
| `--accent` | `#8b4513` | Links (saddle brown) |
| `--accent-bg` | `#f5efe2` | Link background |
| `--accent-ring` | `#c19a6b` | Link decoration |

#### 24.4 Editorial template — Dark mode (NEW in v2)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#1a1612` | Page background |
| `--bg-secondary` | `#26201a` | Header, code blocks |
| `--text` | `#f5f0e6` | Headings |
| `--text-secondary` | `#d6cdb8` | Body |
| `--accent` | `#d4a574` | Links |

---

### §25 The Complete TypeScript Interface Reference

#### `src/types/tag.ts`

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

#### `src/types/toc.ts`

```typescript
export interface TocItem {
  level: 2 | 3 | 4;
  text: string;
  slug: string;
  children: TocItem[];
}
```

#### `src/types/frontmatter.ts`

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

#### `src/types/template.ts`

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
  markdown?: string;  // Optional — most templates use children
  children: ReactNode;
}

export type ComponentsMap = {
  h1: FC<ComponentPropsWithoutRef<"h1">>;
  h2: FC<ComponentPropsWithoutRef<"h2">>;
  /* ... h3, h4, p, a, strong, em, ul, ol, li, hr, blockquote,
         code, pre, table, thead, tbody, tr, th, td ... */
};

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

#### `src/types/config.ts`

```typescript
export interface MarkdownToWebConfig {
  markdown: string;
  template?: TemplateName;
  tags?: TagRegistry;
  tocMaxDepth?: 2 | 3 | 4;
  offlineFonts?: boolean;
  syntaxHighlighting?: boolean;
  errorReportingEndpoint?: string;
}
```

#### `src/types/enhance.ts` (NEW in v2)

```typescript
export interface EnhanceResult {
  enhanced: string;
  warnings: string[];
}
```

---

### §26 Component Props Summary

| Component | Props |
|-----------|-------|
| `App` | None (reads markdown via `?raw` import) |
| `MarkdownRenderer` | `{ markdown: string; registry: TagRegistry }` |
| `TableOfContents` | `{ items: TocItem[]; activeSlug?: string; onNavigate?: () => void }` |
| `Badge` | `{ tag: string; value: string; accent: 1 \| 2 \| 3 \| 4 \| 5 }` |
| `ErrorBoundary` | `{ children: ReactNode; fallback?: ReactNode \| ((error: Error, errorInfo: ErrorInfo) => ReactNode); onError?: (error: Error, errorInfo: ErrorInfo) => void }` |
| `ErrorFallback` | `{ error?: Error \| null }` |
| `SkipLink` | `{ targetId?: string }` (default: `"content"`) |
| `ThemeToggle` | None (manages own state) |
| `BackToTop` | None (NEW in v2) |
| `MobileNav` | `{ toc: TocItem[]; activeSlug?: string }` (NEW in v2) |
| `CopyButton` | `{ getText: () => string; className?: string }` (NEW in v2) |

---

### §27 Testing Strategy

#### 27.1 Test pyramid

| Layer | Count | What it covers |
|-------|-------|----------------|
| Unit | 68 | Pure functions in `lib/` — fence, enhance, toc, frontmatter, tags, slug-parity, config, reading-time |
| Integration | 55 | Full pipeline rendering with `react-markdown` — badges, code blocks, images, task lists, theme toggle, error boundary, back-to-top, mobile nav, copy button, editorial template, dev warnings |
| Accessibility | 2 | axe-core via Playwright — WCAG 2.2 AA in light and dark modes |
| Performance | 1 | Bundle size gate (< 250 KB gzipped) |
| **Total** | **126** | |

#### 27.2 TDD workflow (NEW in v2)

Every new feature or bug fix follows red → green → refactor:

1. **Write the failing test first.** The test describes the desired behavior. Run it — it should fail (red) because the implementation doesn't exist yet.
2. **Write the minimum implementation to make the test pass.** Don't add anything not covered by a test (green).
3. **Refactor.** Clean up the implementation. Tests should stay green.

Example (from the remediation):

```typescript
// 1. Write failing test
// tests/unit/reading-time.test.ts
it("returns '2 min read' for 400 words", () => {
  const words = Array.from({ length: 400 }, (_, i) => `word${i}`).join(" ");
  expect(estimateReadingTime(words)).toBe("2 min read");
});

// 2. Run — fails because @/lib/reading-time doesn't exist
// npx vitest run tests/unit/reading-time.test.ts
// → "Failed to resolve import "@/lib/reading-time""

// 3. Implement
// src/lib/reading-time.ts
export function estimateReadingTime(markdown: string): string { ... }

// 4. Run — passes
// npx vitest run tests/unit/reading-time.test.ts
// → "✓ tests/unit/reading-time.test.ts (8 tests)"
```

#### 27.3 Test setup — mocking jsdom gaps (NEW in v2)

jsdom doesn't implement `IntersectionObserver` or `matchMedia`. Integration tests that render `<App />` or `<ThemeToggle />` will crash without mocks. Add them to `tests/setup.ts`:

```typescript
// tests/setup.ts
import "@testing-library/jest-dom";

// IntersectionObserver mock
class IntersectionObserverMock {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  private targets: Set<Element> = new Set();

  observe(target: Element): void { this.targets.add(target); }
  unobserve(target: Element): void { this.targets.delete(target); }
  disconnect(): void { this.targets.clear(); }
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

globalThis.IntersectionObserver =
  IntersectionObserverMock as unknown as typeof IntersectionObserver;

// matchMedia mock
if (!globalThis.matchMedia) {
  globalThis.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}
```

For tests that need to control `matchMedia` results (e.g., theme toggle tests), override it per-test with a more sophisticated mock that tracks listeners and can emit change events. See `tests/integration/theme-toggle.test.tsx` for the pattern.

#### 27.4 Coverage thresholds

```typescript
// vitest.config.ts
coverage: {
  thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
}
```

v2 actual: 87.5% / 85.32% / 77.11% / 90.09% — all above thresholds.

#### 27.5 Test inventory (124 vitest + 2 Playwright)

| Suite | File | Tests |
|-------|------|-------|
| Unit | `fence.test.ts` | 5 |
| Unit | `enhance.test.ts` | 10 |
| Unit | `toc.test.ts` | 9 |
| Unit | `frontmatter.test.ts` | 7 |
| Unit | `tags.test.ts` | 6 |
| Unit | `slug-parity.test.ts` | 9 |
| Unit | `config.test.ts` | 14 (NEW) |
| Unit | `reading-time.test.ts` | 8 (NEW) |
| Integration | `markdown-rendering.test.tsx` | 4 |
| Integration | `code-block.test.tsx` | 5 (NEW) |
| Integration | `images.test.tsx` | 5 (NEW) |
| Integration | `task-lists.test.tsx` | 4 (NEW) |
| Integration | `dev-warnings.test.tsx` | 1 (NEW) |
| Integration | `theme-toggle.test.tsx` | 9 (NEW) |
| Integration | `error-boundary.test.tsx` | 4 (NEW) |
| Integration | `back-to-top.test.tsx` | 5 (NEW) |
| Integration | `mobile-nav.test.tsx` | 9 (NEW) |
| Integration | `copy-button.test.tsx` | 4 (NEW) |
| Integration | `editorial-template.test.tsx` | 5 (NEW) |
| Performance | `bundle-size.test.ts` | 1 |
| **vitest total** | | **124** |
| Accessibility | `axe.test.ts` | 2 (Playwright) |

---

### §28 Appendices

#### Appendix A: ADRs

**ADR-1 — Why Vite 8 instead of Vite 7?**
The Vite scaffold installs Vite 8 by default. Rather than downgrading, we upgraded the plugin ecosystem (`@tailwindcss/vite@4.3.3`, `vite-plugin-singlefile@2.3.3`) to maintain compatibility. The architecture is identical across Vite 7/8. Vite 8 deprecates `__dirname` in config files — use `import.meta.dirname`.

**ADR-2 — Why the technical template as default?**
The catalog is a reference document navigated non-linearly (users jump to categories). The technical template's three-column layout with TOC nav is designed for this use case. The editorial template is for long-form sequential reading.

**ADR-3 — Why no badge annotations in the source content?**
The skills-catalog.md is pure reference material. Badge annotations (`**Tag:** value`) are designed for audit reports, compliance matrices, or status documents. Adding them to a skill catalog would be semantically inappropriate.

**ADR-4 — Why WCAG AA instead of AAA?**
AAA requires 7:1 contrast for normal text. Many UI elements (badges, meta labels, tertiary text) cannot achieve AAA without sacrificing visual hierarchy. The approach: AA as hard gate, AAA aspirational where feasible.

**ADR-5 — Why `lucide-react` instead of emojis? (NEW in v2)**
Emojis render inconsistently across platforms (Apple, Google, Microsoft, Samsung all have different glyphs). `lucide-react` provides tree-shaken SVG icons that render identically everywhere. The dependency was listed in v1.0.0 but unused — using it makes the dependency load-bearing and the UI consistent.

**ADR-6 — Why mock `IntersectionObserver` and `matchMedia` in setup.ts instead of per-test? (NEW in v2)**
Every integration test that renders `<App />` needs `IntersectionObserver`. Every test that renders `<ThemeToggle />` needs `matchMedia`. Mocking them once in `setup.ts` (which vitest loads for every test file) avoids repetition. Tests that need controllable mocks (e.g., theme toggle tests that simulate OS theme changes) override the global mock per-test.

**ADR-7 — Why keep the `execCommand` clipboard fallback? (NEW in v2)**
`navigator.clipboard.writeText` requires HTTPS (or localhost). In insecure contexts (HTTP, `file://` in some browsers, sandboxed iframes), it's `undefined`. `document.execCommand("copy")` is deprecated but still works in all browsers and doesn't require HTTPS. The fallback ensures copy-to-clipboard works in `file://` deployments — a documented use case for this skill.

**ADR-8 — Why a second template (`editorial`)? (NEW in v2)**
v1.0.0 documented three templates (`technical`, `editorial`, `minimal`) but only implemented one. The template-switching machinery was untested. Implementing `editorial` exercises the machinery, demonstrates the pattern for adding a third, and provides a real alternative for long-form content. `minimal` is deferred — it would add a third palette without exercising new machinery.

#### Appendix B: Build metrics (v2)

| Metric | Value |
|--------|-------|
| Source files | 38 |
| Test files | 20 |
| Total tests | 124 vitest + 2 Playwright = 126 |
| Build output | `dist/index.html` (598 KB raw, 171 KB gzipped) |
| Bundle budget | 250 KB gzipped |
| Margin | 79 KB under budget |
| Build time | ~545ms |
| Coverage (lines) | 87.5% (threshold: 80%) |
| Coverage (branches) | 77.11% (threshold: 75%) |
| Coverage (functions) | 85.32% (threshold: 80%) |
| Coverage (statements) | 90.09% (threshold: 80%) |

#### Appendix C: Dependency compatibility matrix (v2)

| Dependency | v1.0.0 pin | v2.0.0 resolved | Reason |
|------------|------------|-----------------|--------|
| `vite` | 8.2.1 | `^8.2.0` | Scaffold default |
| `@tailwindcss/vite` | 4.3.3 | `^4.3.3` | Vite 8 peer requirement |
| `vite-plugin-singlefile` | 2.3.3 | `2.3.3` | Vite 8 peer requirement |
| `typescript` | 6.0.3 | `~6.0.2` | Scaffold default; deprecates `baseUrl` |
| `vitest` | 4.1.10 | `^4.1.10` | Latest compatible |
| `jsdom` | latest | `^30.0.1` | Required for vitest DOM env |
| `@types/node` | latest | `^26.1.2` | Required for Node APIs in tests |
| `lucide-react` | 1.29.0 | `1.29.0` | v1.x line; v0.x is the old line (verify with `npm ls`) |
| `eslint` | (not run) | `^9.39.5` | Flat config required |
| `markdownlint-cli2` | (not run) | `^0.14.0` | v0.14+ requires `.markdownlint-cli2.jsonc` |
| `husky` | (not configured) | `^9.0.0` | Pre-commit hook |
| `lint-staged` | (not configured) | `^15.0.0` | Staged-file linting |

#### Appendix D: Verification ledger (v2)

Every claim in this document traces to an executed command:

| Claim | Command | Observed |
|-------|---------|----------|
| Typecheck passes | `npm run typecheck` | exit 0, zero errors |
| ESLint passes | `npm run lint` | exit 0, zero warnings |
| Prettier passes | `npm run lint:format` | "All matched files use Prettier code style!" |
| markdownlint passes | `npm run lint:markdown` | "Summary: 0 error(s)" |
| 124 tests pass | `npm run test` | "Test Files 20 passed (20) / Tests 124 passed (124)" |
| Coverage passes | `npm run test:coverage` | exit 0; 87.5% / 77.11% / 85.32% / 90.09% |
| Build passes | `npm run build` | "✓ built in 545ms"; 171.15 KB gzipped |
| Bundle size passes | `npm run test:bundle-size` | exit 0 |
| `ResolvedBadge` unique | `rg "interface ResolvedBadge"` | 1 match (in `src/types/tag.ts`) |
| `TocItem` unique | `rg "interface TocItem"` | 1 match (in `src/types/toc.ts`) |
| Orphaned tsconfigs removed | `ls tsconfig.app.json tsconfig.node.json 2>&1` | "No such file or directory" |
| `.oxlintrc.json` removed | `ls .oxlintrc.json 2>&1` | "No such file or directory" |
| CI workflow exists | `ls .github/workflows/ci.yml` | file exists |
| Husky pre-commit exists | `ls .husky/pre-commit` | file exists, executable |
| Editorial template exists | `ls src/templates/editorial/` | 4 files |
| `__dirname` warning gone | `npm run build 2>&1 \| rg __dirname` | no output |
| `lucide-react` consumed | `rg "lucide-react" src` | matches in ThemeToggle, BackToTop, MobileNav, CopyButton |

#### Appendix E: Remediation summary (NEW in v2)

The v2 skill captures the result of a 53-finding audit and 10-phase TDD remediation. Full details in:

- `docs/audit/AUDIT.md` — 53 findings classified by severity (9 Critical, 9 High, 17 Medium, 9 Low, 9 Informational).
- `docs/audit/IMPLEMENTATION_PLAN.md` — 10-phase plan with TDD-driven ToDo list.
- `docs/audit/REMEDIATION_LOG.md` — Execution log with verification ledger.

**What was fixed (summary):**
- All 9 Critical findings (broken lint/format/markdownlint gates, dead types, duplicate types, orphaned tsconfigs, tracked build artifacts, orphaned `.oxlintrc.json`).
- All 9 High findings (missing CI, missing pre-commit, emoji icons, missing system-theme subscription, missing `img`/`input` overrides, `ErrorBoundary` errorInfo stub, stale `activeSlug`, hardcoded `document.title`).
- 17 Medium findings (second template, reading-time, mobile drawer, back-to-top, copy button, print styles, `__dirname` deprecation, coverage enforcement, etc.).

**What was deferred (with justification):**
- Syntax highlighting (M-7) — adds runtime dep + CSS theme work; better as a follow-up.
- `gray-matter` swap (M-17) — current flat YAML is sufficient; swap preserves all contracts.
- Third (`minimal`) template — editorial + technical is sufficient to demonstrate template switching.
- `index.html` `lang="en"` hardcoded (L-3) — documented limitation.
- `theme-storage.ts` storage key hardcoded (L-7) — single-instance deployment is the documented use case.

#### Appendix F: The complete file tree (v2)

See §5 for the full project skeleton.

#### Appendix G: Glossary

| Term | Definition |
|------|------------|
| **Two-layer token pattern** | Layer 1: `:root` runtime variables flipped by `@media` / `[data-theme]`. Layer 2: `@theme inline` bridges variables into Tailwind utilities. The only correct way to do dark mode in Tailwind v4. |
| **Fence-aware scanning** | Line-by-line scanning that tracks whether the current line is inside a fenced code block (``` or ~~~). Used by `buildToc`, `enhanceMarkdown`, and `estimateReadingTime` to skip code-block content. |
| **Backtick-wrapping pipeline** | `enhanceMarkdown` wraps badge values in backticks → react-markdown parses as inline code → `code` component calls `resolveBadge` → renders `<Badge>`. |
| **Slug parity** | `github-slugger` (used by `buildToc`) and `rehype-slug` (used by react-markdown) must produce identical slugs for the same heading text. Verified by `slug-parity.test.ts`. |
| **Gate** | A quality check that must pass before code ships. v2 has 8: typecheck, lint, format, markdownlint, test, coverage, build, a11y. |
| **Gate V-1** | Version verification gate: `npm ls --depth=0` confirms installed deps match the pinned versions in §4. |
| **Character-safe rule** | (From the parent agent contract) When generating PDFs, every character must come from registered fonts or literal math operators. Not directly applicable to this skill (which produces HTML, not PDF), but the principle — don't emit characters the runtime can't render — applies to emoji usage (see ADR-5). |

---

*This skill file was distilled from a full TDD remediation of the `nordeim/markdown-to-html` codebase on 2026-08-07. Every claim is verifiable against the actual codebase. Version 2.0.0. Companion documents: `docs/audit/AUDIT.md`, `docs/audit/IMPLEMENTATION_PLAN.md`, `docs/audit/REMEDIATION_LOG.md`.*

