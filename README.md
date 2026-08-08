# Transform Markdown to HTML

<!-- Badges -->

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![Tests](https://img.shields.io/badge/tests-124%20vitest%20passing-brightgreen)
![Accessibility](https://img.shields.io/badge/accessibility-WCAG%202.2%20AA-green)
![Build](https://img.shields.io/badge/build-171%20KB%20gzipped-orange)
![License](https://img.shields.io/badge/license-private-lightgrey)

> Transform any Markdown document into a polished, navigable, single-file web page — with zero backend and full WCAG 2.2 AA compliance.

## Overview

**Markdown-to-HTML** is a zero-backend React application that renders a Markdown document as a production-quality web page. The pipeline handles frontmatter parsing, heading-to-anchor linking, TOC extraction with active-section highlighting, badge annotation rendering, reading-time estimation, dark mode, responsive layout (with mobile drawer), code-block copy buttons, back-to-top navigation, a print stylesheet, and a single-file build output.

The content is a catalog of 202 skills across 10 categories, but the pipeline is content-agnostic — replace `src/content/document.md` with any Markdown file and rebuild.

## Key Features

| Feature                   | Description                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 📝 **Markdown Rendering** | Full GFM support via `react-markdown` — tables, strikethrough, task lists, code blocks, images, autolinks                |
| 🔗 **TOC + Navigation**   | Auto-generated table of contents with active-section highlighting via `IntersectionObserver`                             |
| 🏷️ **Badge System**       | Inline annotations (`**Tag:** value`) render as colored badge chips via backtick-wrapping pipeline                       |
| 🌗 **Dark Mode**          | Two-layer CSS token pattern — system preference + manual toggle with `localStorage` persistence + OS-change subscription |
| ⏱️ **Reading Time**       | Latin 200 wpm + CJK 300 cpm (max-of, avoids double-counting mixed scripts)                                               |
| 📱 **Mobile Drawer**      | Slide-in TOC drawer on screens < `lg`, with focus trap, Escape-to-close, and body scroll lock                            |
| 🔝 **Back to Top**        | Floating scroll-to-top button that respects `prefers-reduced-motion`                                                     |
| 📋 **Copy Code**          | One-click clipboard copy on every code block (with `execCommand` fallback)                                               |
| 🖨️ **Print Stylesheet**   | Hides chrome, forces light-mode colors, avoids page-breaks inside code/tables                                            |
| ♿ **WCAG 2.2 AA**        | Automated accessibility gate via `axe-core` + Playwright — zero violations enforced                                      |
| 📦 **Single-File Build**  | `vite-plugin-singlefile` inlines JS + CSS into one `dist/index.html` (~171 KB gzipped)                                   |
| 🎨 **Template System**    | Two templates (`technical`, `editorial`) swappable via one file edit                                                     |
| 🧪 **145 Tests**          | Unit, integration, accessibility, and bundle-size tests — all green                                                      |
| 🔧 **CI + Pre-Commit**    | GitHub Actions workflow + Husky pre-commit hook with lint-staged                                                         |
| 🔍 **Source Validation**  | Build-time gate asserts the markdown's intro count == summary table == actual rows (catches data drift)                  |

## Quick Start

**Requirements:** Node.js ≥20.19 or ≥22.12

```bash
# 1. Clone and install
git clone <repo-url>
cd markdown-to-html
npm install
npx playwright install chromium   # Required for a11y tests (one-time)

# 2. Start development server
npm run dev
# → Open http://localhost:5173

# 3. Build for production
npm run build
# → Output: dist/index.html (single self-contained file)

# 4. Preview production build
npm run preview
# → Open http://localhost:4173
```

**Verify Setup:**

```bash
npm run typecheck    # Should pass with zero errors
npm run lint:source  # Should report 202 / 202 / 202 (intro == summary == rows)
npm run lint         # Should pass with zero warnings
npm run test         # Should pass 145 tests
npm run build        # Should produce dist/index.html (~171 KB gzipped)
```

## How to Use the Pipeline

The pipeline transforms a Markdown file into a web page through these steps:

### 1. Add Your Content

Replace `src/content/document.md` with any Markdown file. The pipeline supports:

- **Headings** (H1–H6) — auto-linked with anchor `id` attributes
- **Tables** (GFM) — rendered with styled `<table>` markup
- **Links** — external links auto-open in new tabs (`target="_blank"`)
- **Code blocks** — fenced code with copy-to-clipboard button
- **Images** — lazy-loaded, async-decoded, responsive
- **Task lists** — GFM `- [ ]` / `- [x]` rendered as disabled checkboxes
- **Frontmatter** — YAML metadata (title, author, date, subtitle) parsed and stripped

### 2. Add Badge Annotations (Optional)

Badge annotations render inline metadata as colored chips:

```markdown
- **Status:** stable
- **Visibility:** public
```

**Register tags** in `src/templates/technical/tags.json` (or `editorial/tags.json`):

```json
{
  "Status": {
    "name": "Status",
    "values": {
      "stable": { "accent": 4 },
      "experimental": { "accent": 2 },
      "deprecated": { "accent": 1 }
    }
  }
}
```

**How it works:**

1. `enhanceMarkdown()` wraps the value in backticks: `- **Status:** \`stable\``
2. `react-markdown` parses `` `stable` `` as inline code
3. The `code` component calls `resolveBadge()` → renders `<Badge value="Stable" />`

### 3. Customize the Template

Switch templates by editing **one file** — `src/templates/active.ts`:

```typescript
// Technical (default) — three-column, cool gray + blue
import "@/templates/technical/theme.css";
import { technicalComponents } from "@/templates/technical/components";
import { TechnicalLayout } from "@/templates/technical/layout";
import tagsJson from "@/templates/technical/tags.json";

// OR: Editorial — single-column, warm cream + serif
// import "@/templates/editorial/theme.css";
// import { editorialComponents } from "@/templates/editorial/components";
// import { EditorialLayout } from "@/templates/editorial/layout";
// import tagsJson from "@/templates/editorial/tags.json";

export const TEMPLATE_NAME = "technical" as const; // or "editorial"
export const TAGS: TagRegistry = tagsJson as TagRegistry;
export const TEMPLATE_COMPONENTS = technicalComponents;
export const TemplateLayout: FC<TemplateLayoutProps> = TechnicalLayout;
```

### 4. Customize the Design System

All design tokens live in `src/templates/{name}/theme.css` — no `tailwind.config.js`.

**Two-layer dark mode pattern:**

```css
/* Layer 1: Runtime variables (flip for dark mode) */
:root {
  --bg: #ffffff;
  --text: #0f172a;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0f172a;
    --text: #f8fafc;
  }
}

/* Layer 2: Bridge to Tailwind utilities */
@theme inline {
  --color-bg: var(--bg);
  --color-text: var(--text);
}
```

> **Never nest `@theme` inside `@media`** — it silently breaks dark mode.

### 5. Build and Deploy

```bash
npm run build
# → dist/index.html (single file, JS/CSS inlined)
```

Deploy `dist/index.html` to any static host — GitHub Pages, Netlify, Vercel, S3, nginx. No server required.

## Architecture

### Tech Stack

| Layer         | Technology           | Version    | Purpose                                                            |
| ------------- | -------------------- | ---------- | ------------------------------------------------------------------ |
| UI Runtime    | React                | `^19.2.8`  | Component rendering                                                |
| Build Tool    | Vite                 | `^8.2.0`   | Dev server + production build                                      |
| Styling       | Tailwind CSS         | `^4.3.3`   | CSS-first `@theme` design tokens                                   |
| Markdown      | react-markdown       | `10.1.0`   | Component-based Markdown rendering                                 |
| GFM           | remark-gfm           | `4.0.1`    | Tables, strikethrough, task lists                                  |
| Anchors       | rehype-slug          | `6.0.0`    | Heading `id` generation                                            |
| TOC Slugs     | github-slugger       | `2.0.0`    | Slug generation matching rehype-slug                               |
| Icons         | lucide-react         | `1.29.0`   | Tree-shaken SVG icons (Sun/Moon/Monitor/ArrowUp/Menu/X/Copy/Check) |
| Language      | TypeScript           | `~6.0.2`   | Strict mode + `noUncheckedIndexedAccess`                           |
| Test Runner   | vitest               | `^4.1.10`  | Unit + integration + bundle-size + coverage                        |
| E2E Runner    | Playwright           | `^1.40.0`  | Accessibility testing                                              |
| A11y Scanner  | @axe-core/playwright | `^4.12.1`  | WCAG 2.2 AA automated gate                                         |
| Lint          | ESLint               | `^9.39.5`  | Flat config + react-hooks + jsx-a11y + typescript-eslint           |
| Format        | Prettier             | `^3.0.0`   | 100-char print width, trailing comma all                           |
| Markdown lint | markdownlint-cli2    | `^0.14.0`  | Content quality gate                                               |
| Pre-commit    | Husky + lint-staged  | `^9 / ^15` | ESLint + Prettier + markdownlint on staged files                   |

### Data Flow

```
src/content/document.md
    ↓ import via ?raw
documentMd (string)
    ↓ parseDocument()
{ frontmatter, body }
    ↓
    ├──→ enhanceMarkdown(body, registry) → enhanced string
    ├──→ buildToc(body, 4)               → TocItem[]
    ├──→ estimateReadingTime(body)       → "N min read"
    └──→ frontmatter.title               → page heading + document.title
         ↓
    MarkdownRenderer(enhanced, registry) → React elements
```

## File Hierarchy

```
markdown-to-html/
├── src/
│   ├── main.tsx                         # Entry: StrictMode + ErrorBoundary
│   ├── App.tsx                          # Pipeline orchestrator (memoized state)
│   ├── index.css                        # Fonts + Tailwind import
│   ├── components/
│   │   ├── MarkdownRenderer.tsx         # react-markdown renderer + components map + CodeBlockWrapper
│   │   ├── TableOfContents.tsx          # Recursive TOC with active highlighting
│   │   ├── Badge.tsx                    # Tag-aware badge chip (5 accent steps)
│   │   ├── ErrorBoundary.tsx            # Render error catcher (class component)
│   │   ├── ErrorFallback.tsx            # Fallback UI with reload button
│   │   ├── SkipLink.tsx                 # Accessible skip-to-content link
│   │   ├── ThemeToggle.tsx              # Light/dark/system toggle (lucide icons + aria-live)
│   │   ├── BackToTop.tsx                # Floating scroll-to-top button
│   │   ├── MobileNav.tsx                # Mobile TOC drawer (dialog + focus trap)
│   │   └── CopyButton.tsx               # Clipboard copy with execCommand fallback
│   ├── content/
│   │   └── document.md                  # Input markdown (the catalog)
│   ├── lib/
│   │   ├── fence.ts                     # Fence-aware line scanner
│   │   ├── enhance.ts                   # Badge backtick-wrapping preprocessor
│   │   ├── toc.ts                       # H2–H4 outline + slug generation
│   │   ├── tags.ts                      # Registry validation + resolver
│   │   ├── frontmatter.ts               # YAML parse + strip
│   │   ├── reading-time.ts              # Prose-word reading-time estimator
│   │   └── config.ts                    # Optional MarkdownToWebConfig validator
│   ├── templates/
│   │   ├── active.ts                    # Template switching (single edit point)
│   │   ├── technical/                   # Three-column technical docs template
│   │   │   ├── theme.css                # Two-layer design tokens + print styles
│   │   │   ├── components.tsx           # Component map overrides
│   │   │   ├── layout.tsx               # Three-column shell
│   │   │   └── tags.json                # Status + Visibility registry
│   │   └── editorial/                   # Single-column long-form reading template
│   │       ├── theme.css                # Warm serif palette + print styles
│   │       ├── components.tsx           # Larger headings, italic H3
│   │       ├── layout.tsx               # Hero + single-column shell
│   │       └── tags.json                # Severity + Confidence registry
│   ├── types/                           # TypeScript interfaces
│   └── utils/                           # cn() + theme-storage
├── tests/
│   ├── unit/                            # 68 unit tests (pure functions)
│   ├── integration/                     # 55 integration tests (full pipeline)
│   ├── accessibility/                   # 2 a11y tests (Playwright + axe)
│   └── performance/                     # 1 bundle-size test (< 250 KB)
├── docs/
│   ├── Project_Architecture_Document.md # Full architecture reference
│   ├── markdown-html-pipeline_SKILL.md  # Detailed skill reference
│   ├── audit/                           # Audit + plan + remediation log
│   └── status.md                        # Current project status
├── .github/workflows/ci.yml             # CI: quality + accessibility jobs
├── .husky/pre-commit                    # Pre-commit: lint-staged + typecheck
├── CLAUDE.md                            # Comprehensive agent instructions
├── AGENTS.md                            # Compact agent onboarding
├── eslint.config.js                     # ESLint flat config
├── .prettierrc.json                     # Prettier config
├── .markdownlint-cli2.jsonc             # markdownlint config
├── package.json                         # Dependencies + scripts + lint-staged
├── vite.config.ts                       # Build configuration
├── vitest.config.ts                     # Test configuration
└── playwright.config.ts                 # Accessibility test configuration
```

## Testing

```bash
# All vitest tests (unit + integration + bundle-size)
npm run test
# → 145 tests across 23 files

# Unit tests only (pure functions in src/lib/)
npm run test:unit
# → 89 tests across 11 files

# Integration tests only (full pipeline rendering)
npm run test:integration
# → 55 tests across 10 files

# With coverage (enforces 80/75/80/80 thresholds)
npm run test:coverage

# Bundle size gate
npm run test:bundle-size
# → 1 test (< 250 KB gzipped)

# Accessibility (WCAG 2.2 AA via Playwright + axe-core)
npm run a11y
# → 2 tests (light mode + dark mode)
# Note: Requires npx playwright install chromium first
```

**Coverage targets:** Lines 80% · Functions 80% · Branches 75% · Statements 80% (verified by `npm run test:coverage`).

## Quality Gates

The project enforces nine quality gates. The CI workflow runs them on every push and PR.

```bash
npm run lint:source      # 0. Source-markdown internal consistency (intro == summary == rows)
npm run typecheck        # 1. TypeScript strict
npm run lint             # 2. ESLint (zero-warning policy)
npm run lint:format      # 3. Prettier
npm run lint:markdown    # 4. markdownlint
npm run test             # 5. vitest (unit + integration + bundle-size)
npm run test:coverage    # 6. Coverage thresholds
npm run build            # 7. Production build
npm run test:bundle-size # 8. dist/index.html < 250 KB gzipped
npm run a11y             # 9. axe-core WCAG 2.2 AA (Playwright)
```

## Design System

### Color Tokens (Technical Template, Light Mode)

| Token              | Hex       | Usage                         |
| ------------------ | --------- | ----------------------------- |
| `--bg`             | `#ffffff` | Page background               |
| `--text`           | `#0f172a` | Headings (18.1:1 AAA)         |
| `--text-secondary` | `#475569` | Body text (5.9:1 AA)          |
| `--border`         | `#e2e8f0` | Borders, dividers             |
| `--accent`         | `#2563eb` | Links, focus rings (5.0:1 AA) |
| `--accent-1`       | `#dc2626` | Badge: critical               |
| `--accent-2`       | `#f59e0b` | Badge: warning                |
| `--accent-3`       | `#2563eb` | Badge: info                   |
| `--accent-4`       | `#10b981` | Badge: success                |
| `--accent-5`       | `#8b5cf6` | Badge: neutral                |

### Typography

| Role | Font           | Weight | Size                   |
| ---- | -------------- | ------ | ---------------------- |
| H1   | Inter          | 700    | `text-3xl sm:text-4xl` |
| H2   | Inter          | 600    | `text-2xl`             |
| Body | Inter          | 400    | `text-base` (16px)     |
| Code | JetBrains Mono | 400    | `text-sm`              |

## Configuration Surface (Optional)

`src/lib/config.ts` exports `resolveConfig(input: unknown): MarkdownToWebConfig` and `DEFAULT_CONFIG`. This is the team-extension surface — consume it if you need to validate config objects from external sources (CLI, build-time plugin). The base pipeline does not require it.

## Known Limitations

- **`parseDocument` supports flat `key: value` YAML only.** No nested YAML, arrays, or multiline values. Swap in `gray-matter` if needed (preserves all contracts).
- **`index.html` `lang="en"` is hardcoded.** For non-English documents, update `index.html` or set `lang` dynamically.
- **`theme-storage.ts` storage key is hardcoded to `"theme"`.** Two markdown-to-web instances on the same domain collide. Namespace if needed.

## Troubleshooting

| Issue                                       | Cause                         | Solution                                                                               |
| ------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| `Cannot find package 'jsdom'`               | `jsdom` not installed         | `npm install -D jsdom`                                                                 |
| `Option baseUrl is deprecated`              | TS 6 removed `baseUrl`        | Remove from `tsconfig.json`; use `paths` with `./` prefix                              |
| `peer vite@"^5\|^6\|^7"` conflict           | Plugin predates Vite 8        | Use `@tailwindcss/vite@4.3.3+` or `vite-plugin-singlefile@2.3.3+`                      |
| Badge renders as plain `<code>`             | Markdown not pre-processed    | Ensure `enhanceMarkdown` runs before `MarkdownRenderer`                                |
| `color-contrast` AA violation               | Text token too light          | Darken token or use `text-text-secondary` instead of `text-text-tertiary`              |
| `Executable doesn't exist` (Playwright)     | Browsers not installed        | `npx playwright install chromium`                                                      |
| `calling test() from async test.describe()` | Playwright tests under vitest | Run `npx playwright test` instead of `npm run test`                                    |
| `__dirname` deprecation warning             | Vite 8 deprecation            | Use `import.meta.dirname` (already applied in `vite.config.ts` and `vitest.config.ts`) |

## License

Private project. All rights reserved.
