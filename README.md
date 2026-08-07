# Transform Markdown to HTML

<!-- Badges -->
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Tests](https://img.shields.io/badge/tests-49%20passing-brightgreen)
![Accessibility](https://img.shields.io/badge/accessibility-WCAG%202.2%20AA-green)
![Build](https://img.shields.io/badge/build-162%20KB%20gzipped-orange)
![License](https://img.shields.io/badge/license-private-lightgrey)

> Transform any Markdown document into a polished, navigable, single-file web page — with zero backend and full WCAG 2.2 AA compliance.
> Turn any Markdown → polished, accessible, single-file web page. Zero backend. 162 KB. WCAG 2.2 AA enforced.  

## Overview

Skills Catalog is a zero-backend React application that renders a Markdown document as a production-quality web page. The pipeline handles frontmatter parsing, heading-to-anchor linking, TOC extraction with active-section highlighting, badge annotation rendering, dark mode, responsive layout, and a single-file build output.

The content is a catalog of 198 skills across 10 categories, but the pipeline is content-agnostic — replace `src/content/document.md` with any Markdown file and rebuild.

## Key Features

| Feature | Description |
|---------|-------------|
| 📝 **Markdown Rendering** | Full GFM support via `react-markdown` — tables, strikethrough, task lists, code blocks |
| 🔗 **TOC + Navigation** | Auto-generated table of contents with active-section highlighting via `IntersectionObserver` |
| 🏷️ **Badge System** | Inline annotations (`**Tag:** value`) render as colored badge chips via backtick-wrapping pipeline |
| 🌗 **Dark Mode** | Two-layer CSS token pattern — system preference + manual toggle with `localStorage` persistence |
| ♿ **WCAG 2.2 AA** | Automated accessibility gate via `axe-core` + Playwright — zero violations enforced |
| 📦 **Single-File Build** | `vite-plugin-singlefile` inlines JS + CSS into one `dist/index.html` (162 KB gzipped) |
| 🎨 **Template System** | Swappable layouts (technical, editorial, minimal) via one file edit |
| 🧪 **49 Tests** | Unit, integration, accessibility, and bundle-size tests — all green |

## Quick Start

**Requirements:** Node.js ≥20.19 or ≥22.12

```bash
# 1. Clone and install
git clone <repo-url>
cd skills-catalog
npm install

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
npm run test         # Should pass 49 tests
npm run build        # Should produce dist/index.html (~162 KB gzipped)
```

## How to Use the Pipeline

The pipeline transforms a Markdown file into a web page through these steps:

### 1. Add Your Content

Replace `src/content/document.md` with any Markdown file. The pipeline supports:

- **Headings** (H1–H6) — auto-linked with anchor `id` attributes
- **Tables** (GFM) — rendered with styled `<table>` markup
- **Links** — external links auto-open in new tabs (`target="_blank"`)
- **Code blocks** — fenced code with optional syntax highlighting
- **Frontmatter** — YAML metadata (title, author, date) parsed and stripped

### 2. Add Badge Annotations (Optional)

Badge annotations render inline metadata as colored chips:

```markdown
- **Status:** stable
- **Visibility:** public
```

**Register tags** in `src/templates/technical/tags.json`:

```json
{
  "Status": {
    "name": "Status",
    "values": {
      "stable":       { "accent": 4 },
      "experimental": { "accent": 2 },
      "deprecated":   { "accent": 1 }
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
// Change these imports to switch templates
import "@/templates/technical/theme.css";     // or editorial/minimal
import { technicalComponents } from "@/templates/technical/components";
import { TechnicalLayout } from "@/templates/technical/layout";
import tagsJson from "@/templates/technical/tags.json";

export const TEMPLATE_NAME = "technical" as const;  // or "editorial" / "minimal"
```

### 4. Customize the Design System

All design tokens live in `src/templates/technical/theme.css` — no `tailwind.config.js`.

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

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| UI Runtime | React | `^19.2.8` | Component rendering |
| Build Tool | Vite | `^8.2.1` | Dev server + production build |
| Styling | Tailwind CSS | `^4.3.3` | CSS-first `@theme` design tokens |
| Markdown | react-markdown | `10.1.0` | Component-based Markdown rendering |
| GFM | remark-gfm | `4.0.1` | Tables, strikethrough, task lists |
| Anchors | rehype-slug | `6.0.0` | Heading `id` generation |
| TOC Slugs | github-slugger | `2.0.0` | Slug generation matching rehype-slug |
| Icons | lucide-react | `1.29.0` | Tree-shaken SVG icons |
| Language | TypeScript | `~6.0.3` | Strict mode + `noUncheckedIndexedAccess` |
| Test Runner | vitest | `^4.1.10` | Unit + integration + bundle-size |
| E2E Runner | Playwright | `1.62.1` | Accessibility testing |
| A11y Scanner | @axe-core/playwright | `4.12.1` | WCAG 2.2 AA automated gate |

### Data Flow

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

## File Hierarchy

```
skills-catalog/
├── src/
│   ├── main.tsx                         # Entry: StrictMode + ErrorBoundary
│   ├── App.tsx                          # Pipeline orchestrator (memoized state)
│   ├── index.css                        # Fonts + Tailwind import
│   ├── components/
│   │   ├── MarkdownRenderer.tsx         # react-markdown renderer + components map
│   │   ├── TableOfContents.tsx          # Recursive TOC with active highlighting
│   │   ├── Badge.tsx                    # Tag-aware badge chip (5 accent steps)
│   │   ├── ErrorBoundary.tsx            # Render error catcher (class component)
│   │   ├── ErrorFallback.tsx            # Fallback UI with reload button
│   │   ├── SkipLink.tsx                 # Accessible skip-to-content link
│   │   └── ThemeToggle.tsx              # Light/dark/system toggle
│   ├── content/
│   │   └── document.md                  # Input markdown (the catalog)
│   ├── lib/
│   │   ├── fence.ts                     # Fence-aware line scanner
│   │   ├── enhance.ts                   # Badge backtick-wrapping preprocessor
│   │   ├── toc.ts                       # H2–H4 outline + slug generation
│   │   ├── tags.ts                      # Registry validation + resolver
│   │   └── frontmatter.ts               # YAML parse + strip
│   ├── templates/
│   │   ├── active.ts                    # Template switching (single edit point)
│   │   └── technical/
│   │       ├── theme.css                # Two-layer design tokens (light + dark)
│   │       ├── components.tsx           # Component map overrides
│   │       ├── layout.tsx               # Three-column shell
│   │       └── tags.json                # Status + Visibility registry
│   ├── types/                           # TypeScript interfaces
│   └── utils/                           # cn() + theme-storage
├── tests/
│   ├── unit/                            # 35 unit tests (pure functions)
│   ├── integration/                     # 4 integration tests (full pipeline)
│   ├── accessibility/                   # 2 a11y tests (WCAG 2.2 AA)
│   └── performance/                     # 1 bundle-size test (< 250 KB)
├── docs/
│   ├── Project_Architecture_Document.md # Full architecture reference
│   └── markdown-html-pipeline_SKILL.md  # Detailed skill reference
├── CLAUDE.md                            # Comprehensive agent instructions
├── AGENTS.md                            # Compact agent onboarding
├── package.json                         # Dependencies + scripts
├── vite.config.ts                       # Build configuration
├── vitest.config.ts                     # Test configuration
└── playwright.config.ts                 # Accessibility test configuration
```

## Testing

```bash
# All vitest tests (unit + integration + bundle-size)
npm run test
# → 49 tests across 8 files

# Unit tests only (pure functions in src/lib/)
npm run test:unit
# → 35 tests across 6 files

# Integration tests only (full pipeline rendering)
npm run test:integration
# → 4 tests

# Bundle size gate
npm run test:bundle-size
# → 1 test (< 250 KB gzipped)

# Accessibility (WCAG 2.2 AA via Playwright + axe-core)
npm run a11y
# → 2 tests (light mode + dark mode)
# Note: Requires npx playwright install chromium first
```

**Coverage targets:** Lines 80% · Functions 80% · Branches 75% · Statements 80%

## Design System

### Color Tokens (Light Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#ffffff` | Page background |
| `--text` | `#0f172a` | Headings (18.1:1 AAA) |
| `--text-secondary` | `#475569` | Body text (5.9:1 AA) |
| `--border` | `#e2e8f0` | Borders, dividers |
| `--accent` | `#2563eb` | Links, focus rings (5.0:1 AA) |
| `--accent-1` | `#dc2626` | Badge: critical |
| `--accent-2` | `#f59e0b` | Badge: warning |
| `--accent-3` | `#2563eb` | Badge: info |
| `--accent-4` | `#10b981` | Badge: success |
| `--accent-5` | `#8b5cf6` | Badge: neutral |

### Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| H1 | Inter | 700 | `text-3xl sm:text-4xl` |
| H2 | Inter | 600 | `text-2xl` |
| Body | Inter | 400 | `text-base` (16px) |
| Code | JetBrains Mono | 400 | `text-sm` |

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| `Cannot find package 'jsdom'` | `jsdom` not installed | `npm install -D jsdom` |
| `Option baseUrl is deprecated` | TS 6 removed `baseUrl` | Remove from `tsconfig.json`; use `paths` with `./` prefix |
| `peer vite@"^5\|^6\|^7"` conflict | Plugin predates Vite 8 | Use `@tailwindcss/vite@4.3.3+` or `vite-plugin-singlefile@2.3.3+` |
| Badge renders as plain `<code>` | Markdown not pre-processed | Ensure `enhanceMarkdown` runs before `MarkdownRenderer` |
| `color-contrast` AA violation | Text token too light | Darken token or use `text-text-secondary` instead of `text-text-tertiary` |
| `Executable doesn't exist` (Playwright) | Browsers not installed | `npx playwright install chromium` |
| `calling test() from async test.describe()` | Playwright tests under vitest | Run `npx playwright test` instead of `npm run test` |

## License

Private project. All rights reserved.
