# Codebase Audit — markdown-to-html (Skills Catalog)

**Date:** 2026-08-07
**Auditor:** Super Z (GLM)
**Mode:** C — Audit / Review (per §12 of the agent contract)
**Scope:** Full repository at commit cloned from `https://github.com/nordeim/markdown-to-html.git`.
**Methodology:** Read every file in `src/**`, `tests/**`, root configs, and docs. Ran `npm install`, `npm run typecheck`, `npm run lint`, `npm run lint:format`, `npm run lint:markdown`, `npm run test`, and `npm run build` to capture ground truth. Findings are tagged per §13 of the agent contract:
- **Verified** — executed and observed directly.
- **Reasoned** — logical inference from code, not executed.
- **Assumed** — based on a stated assumption.

Severity taxonomy follows §12 of the agent contract (Critical / High / Medium / Low / Informational).

---

## 0. Executive Summary

The codebase is a competent, working implementation of the markdown-to-web pipeline described in `docs/markdown-html-pipeline_SKILL.md`. The build succeeds, all 49 tests pass, the bundle is 162 KB gzipped (well under the 250 KB budget), and the architecture (memoized pipeline, fence-aware scanning, slug-parity verification, two-layer dark-mode tokens) is sound.

However, the codebase is **not as complete as its own documentation claims**. Three of the four documented quality gates (`lint`, `lint:format`, `lint:markdown`) do not actually run — `eslint.config.js` is missing, `.prettierrc` is missing, and no markdownlint config file exists. The CLAUDE.md, AGENTS.md, and README all assert a "zero-warning policy" lint gate that cannot fire. The Husky pre-commit hook is documented as "(if configured)" but `husky` + `lint-staged` are installed dependencies with no `.husky/` directory to consume them. There is no CI workflow. Several TypeScript types and tsconfigs are dead code. The `lucide-react` icon library is listed as a dependency but `ThemeToggle` uses emoji instead — an inconsistency with the documented design system.

Beyond the gate failures, the codebase implements only one of the three templates the spec describes (`technical`), has no mobile TOC drawer, no print stylesheet, no copy-to-clipboard for code blocks, no reading-time calculation, and no system-theme-change subscription. The `MarkdownToWebConfig` type — the documented extension surface for teams that want richer build configuration — is unused dead code.

**Severity counts:**

| Severity | Count |
|----------|------|
| Critical | 9 |
| High | 9 |
| Medium | 17 |
| Low | 9 |
| Informational | 9 |
| **Total** | **53** |

---

## 1. Critical Findings (release blockers)

### C-1 — `npm run lint` fails: no `eslint.config.js`
- **Location:** repo root; `package.json:11` `"lint": "eslint . --max-warnings 0"`
- **Description:** ESLint 9 (installed at 9.39.5) requires a flat-config file (`eslint.config.{js,mjs,cjs}`). None exists. Running `npm run lint` produces: *"ESLint couldn't find an eslint.config.(js|mjs|cjs) file."* The `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-jsx-a11y` packages are installed but unconsumed.
- **Evidence:** Verified — executed `npm run lint`, observed the error directly.
- **Impact:** The documented "zero-warning policy" lint gate (CLAUDE.md §Code Quality Standards, README §Testing) does not run. CI cannot enforce it. The claim "ESLint 9 with flat config" in CLAUDE.md is false.
- **Severity:** Critical
- **Confidence:** Verified
- **Recommended fix:** Create `eslint.config.js` at repo root with `typescript-eslint` recommended config, `react-hooks` plugin, `jsx-a11y` plugin, and `--max-warnings 0` semantics enforced by setting `warn`-as-`error` where appropriate. Ignore `dist/`, `node_modules/`, `test-results/`, and `*.config.ts` build artifacts.

### C-2 — `npm run lint:markdown` fails: no markdownlint config
- **Location:** `package.json:13` `"lint:markdown": "markdownlint-cli2"`
- **Description:** `markdownlint-cli2` requires a config file (`.markdownlint-cli2.jsonc`, `.markdownlint.json`, etc.). None exists. Running the command produces a usage error and exit code != 0.
- **Evidence:** Verified — executed `npm run lint:markdown`, observed the error.
- **Impact:** The markdown content quality gate cannot run. Malformed markdown (long lines, missing alt text, etc.) is undetected.
- **Severity:** Critical
- **Confidence:** Verified
- **Recommended fix:** Create `.markdownlint.json` at repo root with sensible defaults (allow long lines for table content, since the catalog has long table rows; enable MD013/MD022/MD032/MD041).

### C-3 — `npm run lint:format` fails on 28 files: no `.prettierrc`
- **Location:** `package.json:12` `"lint:format": "prettier --check ."`
- **Description:** Prettier (installed at `^3.0.0`) is invoked with no config. It runs against default settings and finds 28 files that violate them, including every source file in `src/lib/`, every test file, both template files, `vitest.config.ts`, and even `test-results/.last-run.json` (which should be gitignored, not formatted).
- **Evidence:** Verified — executed `npm run lint:format`, observed the 28-file warning list.
- **Impact:** The documented "Run after eslint --fix" formatter gate (CLAUDE.md §Code Quality Standards, SKILL.md §15.2) cannot pass. Pre-commit hooks that invoke prettier would fail.
- **Severity:** Critical
- **Confidence:** Verified
- **Recommended fix:** Create `.prettierrc.json` with project-consistent settings (printWidth 100, singleQuote, trailingComma "all", semi true). Add `test-results/` and `dist/` to `.prettierignore`. Then run `npx prettier --write .` once to establish the formatted baseline.

### C-4 — `MarkdownToWebConfig` type is dead code
- **Location:** `src/types/config.ts`
- **Description:** The `MarkdownToWebConfig` interface is defined and exported but never imported anywhere in `src/`, `tests/`, or config files. The documented "configuration surface for teams that want to build their own config helper" (source_SKILL.md §3.2) exists only as an orphan.
- **Evidence:** Verified — `rg "MarkdownToWebConfig"` returns only the definition file.
- **Impact:** Misleading API surface. Maintainers may assume the type is wired into the build system; it is not.
- **Severity:** Critical
- **Confidence:** Verified
- **Recommended fix:** Either delete it (and document the deletion as a non-goal) or actually consume it in a new `src/lib/config.ts` runtime parser that validates an optional config object. Given the spec explicitly mentions the type as the team-extension surface, consume it.

### C-5 — `ResolvedBadge` interface duplicated across two files
- **Location:** `src/types/tag.ts:18-23` and `src/lib/tags.ts:3-8`
- **Description:** Both files export a `ResolvedBadge` interface with identical shape. The `tags.ts` version is the one actually used by `resolveBadge()`. The `types/tag.ts` version is imported by nothing.
- **Evidence:** Verified — `rg "interface ResolvedBadge"` returns both files.
- **Impact:** Risk of drift if one is updated and the other is not. Violates DRY. The `types/` directory is supposed to be the canonical type home (per CLAUDE.md).
- **Severity:** Critical
- **Confidence:** Verified
- **Recommended fix:** Delete the `ResolvedBadge` from `src/lib/tags.ts` and re-export from `src/types/tag.ts`. Update imports in `MarkdownRenderer.tsx` and `tags.test.ts` accordingly.

### C-6 — `TocItem` interface duplicated across two files
- **Location:** `src/types/toc.ts:1-6` and `src/lib/toc.ts:4-9`
- **Description:** Same pattern as C-5. Both define `TocItem` with identical shape. `App.tsx` imports from `@/types/toc`, but `toc.ts` exports its own copy.
- **Evidence:** Verified.
- **Impact:** Same as C-5.
- **Severity:** Critical
- **Confidence:** Verified
- **Recommended fix:** Delete `TocItem` from `src/lib/toc.ts` and import from `@/types/toc`.

### C-7 — `tsconfig.app.json` and `tsconfig.node.json` are orphaned
- **Location:** repo root
- **Description:** `tsconfig.json` is the only config used by `tsc --noEmit` (it does not use `references`). `tsconfig.app.json` and `tsconfig.node.json` are not referenced by anything — not by `tsconfig.json`, not by `vite.config.ts`, not by `vitest.config.ts`. They have inconsistent settings with `tsconfig.json` (e.g., `target: "es2023"` vs `"ES2022"`, `verbatimModuleSyntax: true` vs absent, `erasableSyntaxOnly: true` vs absent).
- **Evidence:** Verified — `rg "tsconfig.app.json|tsconfig.node.json"` returns no references in any source/config file.
- **Impact:** Misleading project structure. Maintainers may "fix" `tsconfig.app.json` thinking it affects the build. The two orphaned configs silently drift from the active config.
- **Severity:** Critical
- **Confidence:** Verified
- **Recommended fix:** Either delete the two orphaned files, or restructure `tsconfig.json` to use `references` properly (the standard Vite scaffold pattern). Deletion is the smaller, safer diff given the project's single-config history.

### C-8 — `dist/` and `test-results/` committed to repo despite `.gitignore`
- **Location:** `dist/`, `test-results/`, `.gitignore`
- **Description:** `.gitignore` lists both `dist` and (implicitly via `*.log`) `test-results/`, yet both directories are tracked in git. `dist/index.html` is 492 KB. `test-results/.last-run.json` is a Playwright artifact that flips between runs.
- **Evidence:** Verified — `ls dist/ test-results/` shows both populated; `.gitignore` lists `dist`.
- **Impact:** Repo bloat. Confusing state for contributors who rebuild and see "modified" files. Prettier chokes on `test-results/.last-run.json` because it's a generated JSON file with non-standard formatting.
- **Severity:** Critical
- **Confidence:** Verified
- **Recommended fix:** `git rm -r --cached dist test-results` to untrack. The `.gitignore` already covers them. The build process regenerates `dist/` on demand.

### C-9 — `.oxlintrc.json` exists but `oxlint` is not installed
- **Location:** `.oxlintrc.json`
- **Description:** An oxlint configuration file exists at the repo root, but `oxlint` is not in `package.json` devDependencies. There is no npm script that invokes oxlint. The config references a `$schema` that points to `./node_modules/oxlint/configuration_schema.json` — a path that does not exist after `npm install`.
- **Evidence:** Verified — `npm ls oxlint` returns "(empty)".
- **Impact:** Misleading. Maintainers may believe oxlint is part of the toolchain. The `$schema` reference may produce a warning in editors.
- **Severity:** Critical
- **Confidence:** Verified
- **Recommended fix:** Delete `.oxlintrc.json`. The project's lint stack is ESLint + Prettier + markdownlint, documented as such.

---

## 2. High Findings (correctness/security gaps)

### H-1 — No CI workflow exists
- **Location:** repo root — `.github/workflows/` does not exist
- **Description:** CLAUDE.md states "Accessibility is gated, not claimed. WCAG 2.2 AA enforced by an axe gate in CI — zero violations allowed." There is no CI. No GitHub Actions, no other CI config.
- **Evidence:** Verified — `ls .github/workflows` returns "No such file or directory".
- **Impact:** The eight-gate pre-ship checklist (SKILL.md §11, CLAUDE.md §Build Commands) is documentation-only. Drift goes undetected. The accessibility gate has no enforcement.
- **Severity:** High
- **Confidence:** Verified
- **Recommended fix:** Add `.github/workflows/ci.yml` running typecheck → lint → test → build on every push and PR. Add a separate job for the a11y gate (with `npx playwright install chromium` first). Cache `~/.npm` and `node_modules` for speed.

### H-2 — Husky pre-commit hook documented but not configured
- **Location:** `package.json` (devDeps: `husky`, `lint-staged`); `.husky/` does not exist
- **Description:** CLAUDE.md §Pre-commit documents `npx husky install` as "one-time setup", but the `.husky/` directory was never created. `lint-staged` is installed but has no config (no `lint-staged` field in `package.json`, no `.lintstagedrc` file).
- **Evidence:** Verified.
- **Impact:** Pre-commit enforcement of lint/format/typecheck is non-existent. The devDeps consume install time and lockfile entropy for no benefit.
- **Severity:** High
- **Confidence:** Verified
- **Recommended fix:** Either remove `husky` and `lint-staged` from devDeps (and update docs to say "pre-commit not configured"), or actually wire up `.husky/pre-commit` with a `lint-staged` config that runs `eslint --fix`, `prettier --write`, and `tsc --noEmit` on staged files. The latter is preferable for a project that claims CI-grade quality.

### H-3 — `ThemeToggle` uses emoji instead of `lucide-react` icons
- **Location:** `src/components/ThemeToggle.tsx:40`
- **Description:** `ThemeToggle` renders `☀️`, `🌙`, `💻` as the visible button content. CLAUDE.md and SKILL.md list `lucide-react` as a dependency for "tree-shaken SVG icons". The library is installed but unused anywhere in the codebase (`rg "lucide-react"` returns zero source imports). The emoji choice also fails the "anti-generic UI" mandate in source_SKILL.md §1 (emojis render inconsistently across platforms).
- **Evidence:** Verified.
- **Impact:** Design-system inconsistency. The `lucide-react` line in the dependency table is dead. Emoji rendering varies by OS, undermining the "polished" claim.
- **Severity:** High
- **Confidence:** Verified
- **Recommended fix:** Replace emojis with `Sun`, `Moon`, `Monitor` icons from `lucide-react`. Add `aria-hidden` to the icon and rely on the existing `aria-label` for the button.

### H-4 — `MarkdownRenderer` `code` component brittle for non-string children
- **Location:** `src/components/MarkdownRenderer.tsx:36-51`
- **Description:** The `code` component does `const text = typeof children === "string" ? children : ""` and then checks `text.includes("\n")` to distinguish block vs inline. This works today because react-markdown 10 passes string children for inline code, but it's brittle: if a future plugin (e.g., `rehype-highlight`) wraps children in elements, the multiline check silently fails and block code is routed through `resolveBadge()`, which returns `null` for code-block content — so the visible bug is "block code rendered with inline styling", not a crash. Still wrong.
- **Evidence:** Reasoned — code inspection.
- **Impact:** Brittle to plugin additions. Future syntax-highlighting integration would silently misrender.
- **Severity:** High
- **Confidence:** Reasoned
- **Recommended fix:** Use the `inline` prop that react-markdown 10 passes to the `code` component (it's part of the extra props). Destructure as `{ inline, className, children }` and dispatch on `inline` rather than inferring from children content. This is also the documented pattern in react-markdown 10 docs.

### H-5 — `ThemeToggle` does not subscribe to system theme changes
- **Location:** `src/components/ThemeToggle.tsx:16-26`
- **Description:** When `theme === "system"`, the component sets `data-theme` to nothing (removes the attribute) and relies on the CSS `@media (prefers-color-scheme: dark)` rule. But if the user changes their OS theme while the page is open, no React state updates and the page does not visually change until reload. The `matchMedia("(prefers-color-scheme: dark)")` listener is missing.
- **Evidence:** Reasoned — code inspection; CSS does the right thing on initial paint, but React state is stale.
- **Impact:** "System" mode is non-reactive. Users who change OS theme while the page is open see no update.
- **Severity:** High
- **Confidence:** Reasoned
- **Recommended fix:** Add a `useEffect` that, when `theme === "system"`, attaches a `matchMedia(...)` change listener and re-applies the `data-theme` attribute based on `e.matches`. (Or alternatively, force the attribute to `light`/`dark` based on the matchMedia result, overriding the CSS-driven default.)

### H-6 — `MarkdownRenderer` has no `img` component override
- **Location:** `src/components/MarkdownRenderer.tsx`
- **Description:** The components map covers h1/h2/h3/h4/p/a/code/pre/blockquote/table/thead/tbody/th/td/hr/ul/ol/li — but not `img`. GFM inline images fall through to react-markdown's default `<img>` element, which lacks `loading="lazy"`, `decoding="async"`, and proper error handling. The `headingText()` function in `toc.ts` already handles image alt-text extraction, so images are at least an anticipated input — but the renderer is not prepared.
- **Evidence:** Verified — `rg "img" src/components/MarkdownRenderer.tsx` returns nothing.
- **Impact:** Performance (lazy-loading missed), accessibility (no decoding hint), robustness (no `onError` fallback).
- **Severity:** High
- **Confidence:** Verified
- **Recommended fix:** Add an `img` component that injects `loading="lazy"`, `decoding="async"`, and a CSS class for responsive images (`max-w-full h-auto`). Optionally add `referrerPolicy="no-referrer"` for privacy.

### H-7 — `MarkdownRenderer` has no `input` component for GFM task lists
- **Location:** `src/components/MarkdownRenderer.tsx`
- **Description:** `remark-gfm` is enabled (line 18), which parses `- [ ]` and `- [x]` syntax into `<input type="checkbox">` elements. The components map has no `input` override, so they render as default browser checkboxes — but they are not `disabled`, meaning users can toggle them (which is misleading because the state is not persisted and the change is purely visual). They also lack `aria-label` for screen reader context.
- **Evidence:** Reasoned — `remark-gfm` is enabled; no `input` component override exists.
- **Impact:** Misleading interactivity (checkboxes appear toggleable but state is not saved). Accessibility gap (no label).
- **Severity:** High
- **Confidence:** Reasoned
- **Recommended fix:** Add an `input` component that sets `disabled`, `aria-label="Task list item"`, and `className` for visual consistency. Optionally render a custom styled checkbox with the lucide `Check` icon when checked.

### H-8 — `MarkdownRenderer` does not propagate `node` prop to overridden components
- **Location:** `src/components/MarkdownRenderer.tsx`
- **Description:** The component overrides destructure `{ id, children }` or `{ href, children }` etc., but never accept the `node` prop that react-markdown passes. With `@types/react-markdown` strict typings, this is fine today, but if a future plugin depends on the `node` (e.g., for position-aware rendering), the override silently drops it.
- **Evidence:** Reasoned.
- **Impact:** Minor future-proofing concern. Not a current bug.
- **Severity:** High (downgraded from Medium because the override pattern is documented in source_SKILL.md and the omission could surprise a future maintainer)
- **Confidence:** Reasoned
- **Recommended fix:** Accept `...rest` props on each override and spread them onto the underlying element. This is the documented react-markdown 10 pattern.

### H-9 — `IntersectionObserver` active-section tracking has no "no section intersecting" state
- **Location:** `src/App.tsx:33-52`
- **Description:** When the user scrolls above the first H2 (e.g., the hero/header area), no heading is intersecting. The observer's callback does not fire with `isIntersecting: true` for any entry, so `activeSlug` retains its previous value. This means the TOC highlights a section the user is not currently reading.
- **Evidence:** Reasoned — observer only sets `activeSlug` on positive intersection; no else branch.
- **Impact:** Confusing UX. TOC highlighting is misleading at the top of the page.
- **Severity:** High
- **Confidence:** Reasoned
- **Recommended fix:** In the observer callback, when no entry is intersecting (track this with a local variable in the callback), set `activeSlug` to `""`. Alternatively, add a sentinel element at the top of `<main>` that, when intersecting, clears `activeSlug`.

---

## 3. Medium Findings (maintainability/spec gaps)

### M-1 — Only `technical` template implemented; spec describes three
- **Location:** `src/templates/`
- **Description:** `TemplateName = "editorial" | "technical" | "minimal"` (per `src/types/template.ts:5`), but only `src/templates/technical/` exists. CLAUDE.md and source_SKILL.md describe all three. The "template switching" mechanism in `src/templates/active.ts` has nothing to switch to.
- **Severity:** Medium · **Confidence:** Verified
- **Recommended fix:** Implement at least one additional template (`editorial` for long-form reading, or `minimal` for print). Add tests verifying the template switch mechanism actually works.

### M-2 — `readingTime` declared in `TemplateLayoutProps` but never computed
- **Location:** `src/types/template.ts:13`, `src/App.tsx`
- **Description:** The `readingTime?: string` prop is declared but `App.tsx` never passes it. The `TechnicalLayout` doesn't render it either.
- **Severity:** Medium · **Confidence:** Verified
- **Recommended fix:** Add a small `estimateReadingTime(body)` utility (words / 200 wpm) in `src/lib/reading-time.ts`. Pass the result to the layout. Render in the layout's meta line.

### M-3 — No "back to top" button
- **Location:** `src/templates/technical/layout.tsx`
- **Description:** Long documents with sticky TOC nav have no quick way to jump back to the top without scrolling.
- **Severity:** Medium · **Confidence:** Reasoned
- **Recommended fix:** Add a `<button>` that appears after the user scrolls past one viewport, calls `window.scrollTo({ top: 0, behavior: "smooth" })`, and is keyboard-accessible.

### M-4 — No mobile TOC drawer
- **Location:** `src/templates/technical/layout.tsx:24`
- **Description:** The TOC aside is `hidden lg:block` — on screens < 1024px, the TOC disappears entirely with no alternative. source_SKILL.md §11 mentions "Desktop sidebar + mobile drawer" as a smoke-test item.
- **Severity:** Medium · **Confidence:** Verified
- **Recommended fix:** Add a hamburger-menu button visible on `< lg` screens that opens a slide-in drawer containing the TOC. Close on Escape, on link click, and on outside-click. Trap focus while open.

### M-5 — No print stylesheet
- **Location:** `src/templates/technical/theme.css`
- **Description:** No `@media print` rules exist. The technical template's sticky header, TOC sidebar, and right outline would all print uselessly, wasting paper and obscuring content.
- **Severity:** Medium · **Confidence:** Verified
- **Recommended fix:** Add `@media print` rules: hide header/TOC/outline, expand content to full width, force light-mode colors, add `page-break-inside: avoid` on headings and code blocks.

### M-6 — No copy-to-clipboard button on code blocks
- **Location:** `src/components/MarkdownRenderer.tsx` (pre component)
- **Description:** Common pattern in technical docs. Missing here.
- **Severity:** Medium · **Confidence:** Reasoned
- **Recommended fix:** Wrap the `pre` component in a relative container with a copy button (top-right). Use `navigator.clipboard.writeText` with a fallback. Show a checkmark for 2 seconds after copy.

### M-7 — No opt-in syntax highlighting
- **Location:** `src/components/MarkdownRenderer.tsx:18-19`
- **Description:** `MarkdownToWebConfig.syntaxHighlighting` is declared but no `rehype-highlight` integration exists. Code blocks render as plain monospace.
- **Severity:** Medium · **Confidence:** Verified
- **Recommended fix:** Add `rehype-highlight` as an optional dependency. Wire it into `MarkdownRenderer` based on a prop (e.g., `highlight?: boolean`). Add a `highlight.js` theme CSS side-effect import in the template's `theme.css` (or a separate file).

### M-8 — Vite config uses deprecated `__dirname`
- **Location:** `vite.config.ts:9`, `vitest.config.ts:7`
- **Description:** Vite 8 warns: *"Your Vite config uses features that are unsupported by `configLoader: 'native'`, which is planned to become the default in a future major version of Vite: `__dirname` (vite.config.ts:9:36). Use `import.meta.dirname` instead."*
- **Severity:** Medium · **Confidence:** Verified (warning observed during build)
- **Recommended fix:** Replace `resolve(__dirname, "src")` with `resolve(import.meta.dirname, "src")` in both config files.

### M-9 — Coverage thresholds defined but coverage not run by default
- **Location:** `vitest.config.ts:14-19`, `package.json` test script
- **Description:** `vitest.config.ts` defines `coverage.thresholds` (lines/functions/statements 80%, branches 75%), but `npm run test` does not include `--coverage`. The thresholds only fire if someone explicitly runs `vitest run --coverage`.
- **Severity:** Medium · **Confidence:** Verified
- **Recommended fix:** Either add `--coverage` to the `test` script (slower), or add a separate `test:coverage` script and document it. Either way, wire coverage into CI.

### M-10 — Documentation test-count inaccuracies
- **Location:** `CLAUDE.md`, `README.md`, `AGENTS.md`
- **Description:** CLAUDE.md and README claim "35 unit tests" and "10 (7 fixtures + 3 edge cases)" for slug-parity. Actual: 44 unit tests (fence: 5, enhance: 8, toc: 9, frontmatter: 7, tags: 6, slug-parity: 9). Slug-parity is 7 fixtures + 2 edge cases = 9, not 10. Total is 49 (44 unit + 4 integration + 1 bundle-size) — this number is correct.
- **Severity:** Medium · **Confidence:** Verified
- **Recommended fix:** Update the docs to say "44 unit tests across 6 files" and "slug-parity: 7 fixtures + 2 edge cases = 9 tests".

### M-11 — `enhance.ts` regex allows leading whitespace greedily
- **Location:** `src/lib/enhance.ts:4`
- **Description:** `BADGE_LINE_RE = /^(\s*(?:[-*+]\s+|\d{1,9}[.)]\s+))\*\*([^*]+):\*\*\s+(.+)$/` — the `\s*` at the start matches any whitespace including newlines. In practice this is fine because `scanLines()` already splits on `\n`, but the regex is more permissive than the spec ("up to 3 leading spaces" per CommonMark).
- **Severity:** Medium · **Confidence:** Reasoned
- **Recommended fix:** Tighten to `/^( {0,3}(?:[-*+]\s+|\d{1,9}[.)]\s+))\*\*([^*]+):\*\*\s+(.+)$/` to match CommonMark's 3-space rule.

### M-12 — `ThemeToggle` does not announce theme change
- **Location:** `src/components/ThemeToggle.tsx`
- **Description:** No `aria-live` region announces the theme change. Sighted users see the icon swap; screen-reader users hear nothing.
- **Severity:** Medium · **Confidence:** Reasoned
- **Recommended fix:** Add a visually-hidden `aria-live="polite"` region that updates with "Theme changed to {theme}" on each cycle.

### M-13 — `TableOfContents` `<nav>` has no `aria-label`
- **Location:** `src/components/TableOfContents.tsx:16`
- **Description:** When multiple `<nav>` elements exist on a page (the TOC, the "on this page" outline, the mobile drawer), screen readers cannot distinguish them without `aria-label`.
- **Severity:** Medium · **Confidence:** Reasoned
- **Recommended fix:** Add `aria-label="Table of contents"` to the `<nav>` element.

### M-14 — `index.html` title is hardcoded
- **Location:** `index.html:6`
- **Description:** `<title>Skills Catalog</title>` is hardcoded, but the pipeline is supposed to be content-agnostic. The frontmatter `title` is not propagated to the document title.
- **Severity:** Medium · **Confidence:** Verified
- **Recommended fix:** Either set `document.title` in `App.tsx` based on `frontmatter.title`, or document the limitation explicitly.

### M-15 — `ErrorBoundary` fallback function variant loses `errorInfo`
- **Location:** `src/components/ErrorBoundary.tsx:33`
- **Description:** When `fallback` is a function, it's called as `this.props.fallback(this.state.error!, {} as ErrorInfo)` — the second argument is `{} as ErrorInfo`, a type-cast empty object. The real `errorInfo` (with `componentStack`) is available in `componentDidCatch` but discarded.
- **Severity:** Medium · **Confidence:** Verified
- **Recommended fix:** Store `errorInfo` in component state (set in `componentDidCatch`) and pass the real value to the fallback function.

### M-16 — `App.tsx` does not consume `enhanced.warnings`
- **Location:** `src/App.tsx:22-25, 66-68`
- **Description:** `enhanceMarkdown` returns `{ enhanced, warnings }`. `App.tsx` reads `enhanced.enhanced` but never inspects `enhanced.warnings`. In dev mode, unknown badge values produce warnings that are silently dropped.
- **Severity:** Medium · **Confidence:** Verified
- **Recommended fix:** In dev mode (`import.meta.env.DEV`), `console.warn` the warnings array. Optionally surface a non-blocking toast in the UI.

### M-17 — `parseDocument` only supports flat `key: value` YAML
- **Location:** `src/lib/frontmatter.ts`
- **Description:** Known limitation, documented in source_SKILL.md §3.1. Nested YAML, arrays, and multiline values are not supported. The spec mentions `gray-matter` as an upgrade path.
- **Severity:** Medium · **Confidence:** Verified
- **Recommended fix:** Out of scope for this audit cycle — flat YAML is sufficient for the current catalog content. Document the limitation in `CLAUDE.md` explicitly. If a future document needs nested YAML, swap in `gray-matter` (preserves all contracts).

---

## 4. Low Findings (style/clarity)

### L-1 — `.gitignore` includes `docs/`
- **Location:** `.gitignore:2`
- **Description:** `docs/` is gitignored, but the `docs/` directory is tracked (and contains the spec). The gitignore line is dead.
- **Severity:** Low · **Confidence:** Verified
- **Recommended fix:** Remove `docs/` from `.gitignore`.

### L-2 — `tsconfig.json` settings inconsistent with orphans
- **Location:** `tsconfig.json` vs `tsconfig.app.json` / `tsconfig.node.json`
- **Description:** See C-7. Even after deleting the orphans, the inconsistency suggests the project may have been scaffolded from a Vite template that uses `references` and then collapsed to a single config without cleanup.
- **Severity:** Low · **Confidence:** Verified
- **Recommended fix:** Resolved by C-7.

### L-3 — `index.html` `lang="en"` is hardcoded
- **Location:** `index.html:4`
- **Description:** For non-English documents (the catalog has Chinese content in `document.md`), the `lang` attribute should reflect the document's primary language.
- **Severity:** Low · **Confidence:** Verified
- **Recommended fix:** Either set `lang` dynamically from frontmatter, or document the limitation.

### L-4 — `Badge` ring may be too subtle for AA
- **Location:** `src/components/Badge.tsx:3-8`
- **Description:** `ring-1 ring-inset ring-accent-{n}/30` — the 30% opacity ring is decorative. The text color (`text-accent-{n}`) is what carries semantic meaning. WCAG AA only applies to text, so this is fine — but the ring's 30% opacity may be invisible on some backgrounds.
- **Severity:** Low · **Confidence:** Reasoned
- **Recommended fix:** Optional: bump to `ring-accent-{n}/40` or remove the ring entirely if it's not load-bearing.

### L-5 — `MarkdownRenderer` `code` component doesn't preserve `node` prop
- **Location:** `src/components/MarkdownRenderer.tsx:36`
- **Description:** See H-8.
- **Severity:** Low (duplicate of H-8) · **Confidence:** Reasoned

### L-6 — `EnhanceResult` interface not in `types/`
- **Location:** `src/lib/enhance.ts:6-9`
- **Description:** The `types/` directory is the canonical type home (per CLAUDE.md). `EnhanceResult` lives in `lib/`.
- **Severity:** Low · **Confidence:** Verified
- **Recommended fix:** Move `EnhanceResult` to `src/types/enhance.ts` (or fold into `src/types/tag.ts` since it's tag-related).

### L-7 — `theme-storage.ts` storage key hardcoded
- **Location:** `src/utils/theme-storage.ts:1`
- **Description:** `STORAGE_KEY = "theme"` is hardcoded. If two markdown-to-web instances are deployed on the same domain, they collide.
- **Severity:** Low · **Confidence:** Reasoned
- **Recommended fix:** Accept an optional `key` parameter, defaulting to `"theme"`. Or namespace by document title.

### L-8 — `vite-env.d.ts` `*.css` declaration unused
- **Location:** `src/vite-env.d.ts:8-11`
- **Description:** The `declare module "*.css"` block declares CSS imports as strings. Vite's client types already cover this for `?url` and `?inline` imports, and the project's only CSS imports are side-effect imports (which don't need the declaration).
- **Severity:** Low · **Confidence:** Reasoned
- **Recommended fix:** Remove the `*.css` declaration block. Keep the `*.md?raw` block (which is needed).

### L-9 — `playwright.config.ts` lacks `reporter` and `forbidOnly`
- **Location:** `playwright.config.ts`
- **Description:** No reporter configured (defaults to list mode). No `forbidOnly: true` in CI. No retries configured.
- **Severity:** Low · **Confidence:** Reasoned
- **Recommended fix:** Add `reporter: [["list"], ["html", { open: "never" }]]` and document `--forbid-only` for CI use.

---

## 5. Informational Findings (positive observations + future considerations)

### I-1 — 49 tests pass · **Confidence:** Verified
The test suite is well-organized: unit (44) → integration (4) → performance (1). Coverage thresholds are defined. Slug-parity is verified against `github-slugger`. The fence-aware scanner is correctly tested. This is a strong foundation.

### I-2 — Typecheck passes · **Confidence:** Verified
`tsc --noEmit` with `strict`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` produces zero errors. The strictness settings match CLAUDE.md.

### I-3 — Build succeeds at 162 KB gzipped · **Confidence:** Verified
Well under the 250 KB budget. `vite-plugin-singlefile` correctly inlines JS/CSS. Build time is ~417ms.

### I-4 — Two-layer dark mode pattern correctly implemented · **Confidence:** Verified
Layer 1 (`:root` variables flipped by `@media` and `[data-theme]`) → Layer 2 (`@theme inline` bridge to Tailwind utilities). No `@theme`-inside-`@media` mistakes. This is the pattern documented in source_SKILL.md §6 and the codebase matches.

### I-5 — Memoization correctly applied · **Confidence:** Verified
`App.tsx` memoizes `parseDocument`, `loadRegistry`, `enhanceMarkdown`, and `buildToc` with correct dependency arrays.

### I-6 — Fence-aware scanner shared between TOC and enhance · **Confidence:** Verified
`scanLines()` is correctly DRY — both `toc.ts` and `enhance.ts` consume it. No drift.

### I-7 — Slug-parity test is thorough · **Confidence:** Verified
Tests CJK, emoji, camelCase, snake_case, kebab-case, leading whitespace, repeated headings, and fenced-heading exclusion. Matches the spec.

### I-8 — `Frontmatter` interface allows extension · **Confidence:** Verified
The index signature `[key: string]: string | boolean | undefined` allows arbitrary flat YAML keys without breaking the type system.

### I-9 — Future consideration: bundle visualizer · **Confidence:** Reasoned
For a project with a 250 KB budget, adding `rollup-plugin-visualizer` (dev-only) would help diagnose regressions. Not a current bug — informational only.

---

## 6. Audit Verification Ledger

The following commands were executed to ground this audit:

| Command | Result |
|---------|--------|
| `npm install` | 539 packages installed, no errors |
| `npm run typecheck` | PASS — zero errors |
| `npm run lint` | FAIL — no `eslint.config.js` |
| `npm run lint:format` | FAIL — 28 files unformatted |
| `npm run lint:markdown` | FAIL — no markdownlint config |
| `npm run test` | PASS — 49 tests, 8 files |
| `npm run build` | PASS — 162.32 KB gzipped |
| `ls .github/workflows` | FAIL — no such directory |
| `ls .husky` | FAIL — no such directory |
| `npm ls oxlint` | EMPTY — not installed |
| `rg "MarkdownToWebConfig" src tests` | 1 match (definition only) |
| `rg "interface ResolvedBadge"` | 2 matches (duplicate) |
| `rg "interface TocItem"` | 2 matches (duplicate) |
| `rg "lucide-react" src` | 0 matches (unused dep) |
| `rg "tsconfig.app.json\|tsconfig.node.json"` | 0 references (orphaned) |
| `git ls-files dist test-results` | both tracked (should be ignored) |

---

## 7. Out-of-Scope Notes

The following were considered but explicitly excluded from this audit:

- **Performance profiling** — no Lighthouse run; would require a deployed URL.
- **Accessibility audit beyond the existing axe gate** — the gate exists and (per the test code) covers WCAG 2.2 AA. A manual screen-reader pass was not performed.
- **Content audit of `document.md`** — the catalog content is the user's domain; this audit covers the pipeline, not the catalog.
- **Source skill meta-document (`docs/source_SKILL.md`)** — that file is a 3,924-line validation review of prior skill drafts. Its findings are referenced where relevant but it is not itself audited; it is read-only reference material.

---

*End of audit. Findings will be addressed in `docs/audit/IMPLEMENTATION_PLAN.md`.*
