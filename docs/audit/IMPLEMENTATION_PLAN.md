# Implementation Plan — markdown-to-html Remediation

**Date:** 2026-08-07
**Author:** Super Z (GLM)
**Mode:** A — Generation (TDD)
**Companion:** `docs/audit/AUDIT.md` (findings), `docs/audit/REMEDIATION_LOG.md` (execution log)
**Approach:** Test-Driven Development (red → green → refactor) per §10 of the agent contract. Each work item below is sized to a single atomic commit.

---

## 0. Strategic Principles

1. **Fix the gates first.** A broken lint/format/markdownlint gate makes every subsequent change unverifiable. Restore the gates before adding features.
2. **TDD everywhere.** New behavior gets a failing test first. Bug fixes get a regression test first. No exceptions.
3. **Surgical diffs.** One logical change per commit. No speculative abstractions, no unrequested refactors.
4. **Never weaken a guardrail to make a gate pass.** If a test fails after a change, fix the cause, not the test (§10, §B-5).
5. **Verify at the end.** The Definition of Done (§19) requires `typecheck` + `lint` + `test` + `build` all green. The final tar archive must contain a codebase that achieves this.
6. **Honest documentation.** Every doc claim traces to verified behavior. No "49 tests" if the actual count is 49 — and no "35 unit tests" if the actual count is 44.

---

## 1. Phase Order

The work is sequenced so each phase is independently shippable and the next phase builds on the previous.

| Phase | Theme | Findings addressed | Tests added |
|-------|-------|--------------------|-------------|
| 1 | Restore quality gates | C-1, C-2, C-3, C-8, C-9, L-1 | 0 (config-only) |
| 2 | Dead code & duplication cleanup | C-4, C-5, C-6, C-7, L-6, L-8 | 0 (refactor) |
| 3 | Renderer robustness | H-4, H-6, H-7, H-8, M-11, M-16 | 6 |
| 4 | Theme & a11y polish | H-3, H-5, M-12, M-13, H-9, M-14, M-15 | 5 |
| 5 | Layout & UX features | M-2, M-3, M-4, M-5, M-6 | 7 |
| 6 | Optional: second template | M-1 | 3 |
| 7 | CI & pre-commit | H-1, H-2, M-9 | 0 (config-only) |
| 8 | Build modernization | M-8 | 0 (config-only) |
| 9 | Documentation sync | M-10, M-17, L-3, L-4, L-5, L-7, L-9, all above | 0 (docs) |
| 10 | Final verification & archive | (definition of done) | 0 |

**Out of scope for this cycle:** M-7 (syntax highlighting — would add a runtime dependency and CSS theme work; deferred to a follow-up after the second template lands), M-17 (gray-matter swap — current content doesn't need it).

---

## 2. Detailed ToDo List

### Phase 1 — Restore quality gates (Critical)

**1.1 — Create `eslint.config.js`** *(addresses C-1)*
- File: `eslint.config.js` (new)
- Contents: flat config with `typescript-eslint` recommended, `react-hooks` recommended, `jsx-a11y` recommended. `--max-warnings 0` enforced via `linterOptions.reportUnusedDisableDirectives: "error"`. Ignores: `dist/`, `node_modules/`, `test-results/`, `*.config.ts`, `docs/`.
- Verification: `npm run lint` exits 0.
- TDD: not applicable (config-only). Confirmed by green lint run.

**1.2 — Create `.prettierrc.json` and `.prettierignore`** *(addresses C-3)*
- Files: `.prettierrc.json` (new), `.prettierignore` (new)
- Settings: `printWidth: 100`, `singleQuote: false`, `trailingComma: "all"`, `semi: true`, `tabWidth: 2`. (Project currently uses double quotes per existing source — keep convention.)
- `.prettierignore`: `dist/`, `node_modules/`, `test-results/`, `package-lock.json`, `docs/source_SKILL.md` (preserve existing formatting).
- One-time format pass: `npx prettier --write .`
- Verification: `npm run lint:format` exits 0.

**1.3 — Create `.markdownlint.json`** *(addresses C-2)*
- File: `.markdownlint.json` (new)
- Settings: enable MD022, MD032, MD041; disable MD013 (line length — tables in catalog are long); enable MD036 (emphasis as heading — common in catalog); set `ul-indent: 2`.
- Verification: `npm run lint:markdown` exits 0.

**1.4 — Untrack `dist/` and `test-results/`** *(addresses C-8)*
- Command: `git rm -r --cached dist test-results`
- `.gitignore` already covers them.
- Verification: `git status` shows the removal; `ls dist/` still works after the next build.

**1.5 — Remove orphaned `.oxlintrc.json`** *(addresses C-9)*
- Command: `git rm .oxlintrc.json`
- Verification: no `oxlint` references remain.

**1.6 — Remove `docs/` from `.gitignore`** *(addresses L-1)*
- Edit: `.gitignore` — remove the `docs/` line.
- Verification: `git check-ignore docs/` returns non-zero.

**Phase 1 exit criteria:** `npm run lint && npm run lint:format && npm run lint:markdown && npm run typecheck && npm run test && npm run build` all green.

---

### Phase 2 — Dead code & duplication cleanup (Critical)

**2.1 — Delete `MarkdownToWebConfig` or consume it** *(addresses C-4)*
- Decision: **consume it.** Add `src/lib/config.ts` exporting `resolveConfig(input: unknown): MarkdownToWebConfig` that validates an optional config object. This is the documented team-extension surface.
- TDD: write `tests/unit/config.test.ts` first — tests for valid input, missing fields, invalid types, defaults.
- Implement: validator with explicit error messages.
- Wire: export from `src/templates/active.ts` so templates can accept overrides.

**2.2 — Consolidate `ResolvedBadge`** *(addresses C-5)*
- Delete the duplicate in `src/lib/tags.ts`. Import from `src/types/tag.ts`.
- Update `MarkdownRenderer.tsx` and `tags.test.ts` to import from `@/types/tag`.
- TDD: existing `tags.test.ts` is the regression net. Run after refactor — must stay green.

**2.3 — Consolidate `TocItem`** *(addresses C-6)*
- Delete the duplicate in `src/lib/toc.ts`. Import from `src/types/toc.ts`.
- Update `App.tsx` (already imports from `@/types/toc` — no change needed) and `toc.test.ts` (uses inference — no change needed).
- TDD: existing `toc.test.ts` and `slug-parity.test.ts` are the regression net.

**2.4 — Delete orphaned tsconfigs** *(addresses C-7)*
- `git rm tsconfig.app.json tsconfig.node.json`
- TDD: `npm run typecheck` must still pass.

**2.5 — Move `EnhanceResult` to `src/types/`** *(addresses L-6)*
- Create `src/types/enhance.ts` with `EnhanceResult`. Re-export from `src/lib/enhance.ts` for back-compat. Or just import directly from `@/types/enhance` everywhere.
- TDD: existing `enhance.test.ts` is the regression net.

**2.6 — Remove unused `*.css` declaration** *(addresses L-8)*
- Edit: `src/vite-env.d.ts` — remove the `declare module "*.css"` block.
- TDD: `npm run typecheck` must still pass.

**Phase 2 exit criteria:** all tests + lint + typecheck + build still green. No duplicate type definitions. `rg "interface ResolvedBadge"` and `rg "interface TocItem"` each return exactly one match.

---

### Phase 3 — Renderer robustness (High)

**3.1 — Use `inline` prop in `code` component** *(addresses H-4)*
- TDD: write `tests/integration/code-block.test.tsx` first — tests:
  - Inline code with a registered badge value renders as `<Badge>`.
  - Inline code without a badge value renders as `<code>`.
  - Block code (fenced) with a registered badge value as content does NOT render as `<Badge>`.
  - Block code with newlines and no className renders as `<code>` inside `<pre>`.
- Implement: destructure `{ inline, className, children }` and dispatch on `inline` boolean.

**3.2 — Add `img` component override** *(addresses H-6)*
- TDD: write `tests/integration/images.test.tsx` first — tests:
  - Image renders with `loading="lazy"`.
  - Image renders with `decoding="async"`.
  - Image alt text is preserved.
  - Image with empty alt still renders an `<img>`.
- Implement: `img: ({ src, alt, ...rest }) => <img src={src} alt={alt} loading="lazy" decoding="async" className="max-w-full h-auto rounded" {...rest} />`.

**3.3 — Add `input` component for GFM task lists** *(addresses H-7)*
- TDD: write `tests/integration/task-lists.test.tsx` first — tests:
  - Unchecked task list item renders a disabled checkbox.
  - Checked task list item renders a disabled checkbox with `checked` attribute.
  - Checkbox has `aria-label`.
- Implement: `input: ({ type, checked, ...rest }) => type === "checkbox" ? <input type="checkbox" checked={checked} disabled aria-label="Task list item" className="..." /> : <input type={type} {...rest} />`.

**3.4 — Spread `...rest` props on overridden components** *(addresses H-8, L-5)*
- Edit: each component override in `MarkdownRenderer.tsx` and `src/templates/technical/components.tsx` to accept and spread `...rest` props onto the underlying element.
- TDD: existing integration tests are the regression net. Add one new test verifying `data-*` attributes pass through.

**3.5 — Tighten `enhance.ts` regex** *(addresses M-11)*
- TDD: write failing test in `tests/unit/enhance.test.ts` — a badge line with 4 leading spaces does NOT match (CommonMark only allows 3).
- Implement: change `\s*` to ` {0,3}` in `BADGE_LINE_RE`.

**3.6 — Surface `enhance.warnings` in dev mode** *(addresses M-16)*
- TDD: write test in `tests/integration/dev-warnings.test.tsx` — when `import.meta.env.DEV` is true and `enhanceMarkdown` produces warnings, `console.warn` is called.
- Implement: in `App.tsx`, `useEffect` that `console.warn`s `enhanced.warnings` if non-empty and `import.meta.env.DEV`.

**Phase 3 exit criteria:** new tests pass; existing tests stay green; lint + typecheck + build still green.

---

### Phase 4 — Theme & a11y polish (High + Medium)

**4.1 — Replace `ThemeToggle` emojis with `lucide-react` icons** *(addresses H-3)*
- TDD: write `tests/integration/theme-toggle.test.tsx` first — tests:
  - Light state renders a `Sun` icon (svg with `lucide-sun` class or `data-icon="sun"`).
  - Dark state renders a `Moon` icon.
  - System state renders a `Monitor` icon.
  - Button still has `aria-label` with current theme.
- Implement: `import { Sun, Moon, Monitor } from "lucide-react"`. Render icon with `aria-hidden`. Keep `aria-label` on button.

**4.2 — Subscribe to system theme changes** *(addresses H-5)*
- TDD: write test that simulates `matchMedia` change event while `theme === "system"` and verifies the `data-theme` attribute updates.
- Implement: in `ThemeToggle.tsx`, add `useEffect` that, when `theme === "system"`, attaches `matchMedia("(prefers-color-scheme: dark)")` listener and re-applies `data-theme` based on `e.matches`.

**4.3 — Announce theme change with `aria-live`** *(addresses M-12)*
- TDD: write test that verifies the `aria-live` region updates with "Theme changed to {theme}" on each cycle.
- Implement: add a visually-hidden `<span aria-live="polite">` that updates with the announcement text.

**4.4 — Add `aria-label` to TOC `<nav>`** *(addresses M-13)*
- Edit: `src/components/TableOfContents.tsx:16` — `<nav aria-label="Table of contents">`.
- TDD: existing integration tests cover TOC rendering; add one assertion for `aria-label`.

**4.5 — Clear `activeSlug` when no section is intersecting** *(addresses H-9)*
- TDD: write test that simulates scrolling above the first heading and verifies `activeSlug` becomes `""`.
- Implement: in `App.tsx` IntersectionObserver callback, track whether any entry is intersecting; if none, `setActiveSlug("")`.

**4.6 — Set `document.title` from frontmatter** *(addresses M-14)*
- TDD: write test that verifies `document.title` equals `frontmatter.title` after `App` mounts.
- Implement: `useEffect` in `App.tsx` that sets `document.title = title`.

**4.7 — Fix `ErrorBoundary` fallback function `errorInfo`** *(addresses M-15)*
- TDD: write test that calls the boundary's fallback function and verifies the second argument has a `componentStack` property.
- Implement: store `errorInfo` in component state in `componentDidCatch`; pass the real value to the fallback.

**Phase 4 exit criteria:** all new tests pass; existing tests stay green; a11y gate (`npm run a11y`) still passes (deferred — requires Playwright browser install, may skip in this environment).

---

### Phase 5 — Layout & UX features (Medium)

**5.1 — Add `estimateReadingTime` utility** *(addresses M-2)*
- TDD: write `tests/unit/reading-time.test.ts` first — tests:
  - Empty string → "0 min read".
  - 200 words → "1 min read".
  - 400 words → "2 min read".
  - CJK characters counted as words (each CJK char = 1 word).
- Implement: `src/lib/reading-time.ts` with `estimateReadingTime(body: string): string`.

**5.2 — Add "back to top" button** *(addresses M-3)*
- TDD: write `tests/integration/back-to-top.test.tsx` first — tests:
  - Button is not visible on initial render.
  - Button becomes visible after scrolling past one viewport.
  - Clicking the button calls `window.scrollTo`.
  - Button has `aria-label`.
- Implement: `src/components/BackToTop.tsx`. Renders a fixed-position button. Uses `scroll` listener with throttle. Clicking calls `window.scrollTo({ top: 0, behavior: "smooth" })`.
- Wire: render in `src/templates/technical/layout.tsx`.

**5.3 — Add mobile TOC drawer** *(addresses M-4)*
- TDD: write `tests/integration/mobile-drawer.test.tsx` first — tests:
  - Drawer is closed by default.
  - Clicking the menu button opens the drawer.
  - Pressing Escape closes the drawer.
  - Clicking a TOC link closes the drawer.
  - Drawer has `role="dialog"` and `aria-label`.
- Implement: `src/components/MobileNav.tsx`. Slide-in drawer with backdrop. Focus trap. Close on Escape / link click / outside-click.
- Wire: render in `src/templates/technical/layout.tsx` — hamburger button visible on `< lg` screens.

**5.4 — Add print stylesheet** *(addresses M-5)*
- Edit: `src/templates/technical/theme.css` — add `@media print` block.
- Rules: hide `header`, `aside`, `BackToTop`, `MobileNav`. Expand `<main>` to full width. Force light-mode colors (`--bg: #ffffff`, `--text: #000000`). Add `page-break-inside: avoid` on `h2`, `h3`, `pre`, `table`. Add `page-break-after: avoid` on headings.
- TDD: visual check — no automated test (print CSS is hard to test in jsdom). Document in the audit log.

**5.5 — Add copy-to-clipboard on code blocks** *(addresses M-6)*
- TDD: write `tests/integration/copy-code.test.tsx` first — tests:
  - Each `<pre>` has a copy button.
  - Clicking the button calls `navigator.clipboard.writeText` with the code text.
  - Button shows "Copied!" state for 2 seconds after click.
  - Button has `aria-label`.
- Implement: `src/components/CopyButton.tsx`. Wrap `pre` component in `MarkdownRenderer.tsx` to include the button. Use `navigator.clipboard.writeText` with a `document.execCommand` fallback for older browsers.

**Phase 5 exit criteria:** all new tests pass; existing tests stay green; bundle size still under 250 KB gzipped (verify after each feature).

---

### Phase 6 — Optional: second template (Medium)

**6.1 — Implement `editorial` template** *(addresses M-1)*
- Decision: implement `editorial` (long-form reading) rather than `minimal` (print). Editorial exercises more of the template-switching machinery.
- TDD: write `tests/integration/template-switch.test.tsx` first — tests:
  - `editorial` template exports `EditorialLayout`, `editorialComponents`, `editorialTags`, `theme.css`.
  - Switching `src/templates/active.ts` to `editorial` produces a build with no errors.
  - Editorial layout renders a single-column reading view with no right outline.
- Implement:
  - `src/templates/editorial/theme.css` — warm palette (serif body font, larger text, narrower measure).
  - `src/templates/editorial/components.tsx` — different heading styles, drop-cap on first paragraph.
  - `src/templates/editorial/layout.tsx` — single-column, sticky header with reading-time + progress bar.
  - `src/templates/editorial/tags.json` — Severity + Confidence registry.
- **Do NOT change `src/templates/active.ts`** — keep `technical` as the default. The `editorial` template is a switch target, not the default.

**Phase 6 exit criteria:** new tests pass; existing tests stay green; build still works with `technical` as active template.

---

### Phase 7 — CI & pre-commit (High)

**7.1 — Add `.github/workflows/ci.yml`** *(addresses H-1)*
- File: `.github/workflows/ci.yml` (new)
- Jobs:
  - `quality`: Node 22, `npm ci`, `npm run typecheck`, `npm run lint`, `npm run lint:format`, `npm run lint:markdown`, `npm run test`, `npm run build`.
  - `a11y`: Node 22, `npm ci`, `npx playwright install chromium --with-deps`, `npm run build`, `npm run a11y`.
- Triggers: `push` to `main`, `pull_request` to `main`.
- Cache: `~/.npm` and `node_modules` via `actions/cache@v4`.
- Verification: push to a branch and confirm the workflow runs (out of scope for this local remediation — document in handoff).

**7.2 — Wire Husky pre-commit** *(addresses H-2)*
- Files: `.husky/pre-commit` (new), `package.json` (add `lint-staged` config).
- `package.json` adds:
  ```json
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"],
    "*.md": ["markdownlint-cli2 --fix"]
  }
  ```
- `.husky/pre-commit`: `npx lint-staged && npm run typecheck`.
- Verification: `git commit` triggers the hook.

**7.3 — Add `test:coverage` script** *(addresses M-9)*
- Edit: `package.json` — add `"test:coverage": "vitest run --coverage"`.
- The CI workflow runs `npm run test:coverage` instead of `npm run test` to enforce thresholds.
- Verification: `npm run test:coverage` exits 0 if thresholds met, non-zero otherwise.

**Phase 7 exit criteria:** CI workflow file exists and is syntactically valid YAML. Husky pre-commit runs on `git commit`. Coverage gate runs.

---

### Phase 8 — Build modernization (Medium)

**8.1 — Replace `__dirname` with `import.meta.dirname`** *(addresses M-8)*
- Edit: `vite.config.ts:9`, `vitest.config.ts:7`.
- Replace `resolve(__dirname, "src")` with `resolve(import.meta.dirname, "src")`.
- Verification: `npm run build` no longer emits the `__dirname` warning.

**Phase 8 exit criteria:** build is warning-free.

---

### Phase 9 — Documentation sync (Medium + Low)

**9.1 — Update `CLAUDE.md`**
- Update test counts: "44 unit tests" (not 35), "slug-parity: 7 fixtures + 2 edge cases = 9 tests".
- Add sections for: `MarkdownToWebConfig` and `resolveConfig` usage, mobile drawer, back-to-top, copy-to-clipboard, reading-time, editorial template, print stylesheet.
- Update component architecture diagram.
- Update pre-commit section (now actually wired).
- Add CI section pointing to `.github/workflows/ci.yml`.

**9.2 — Update `AGENTS.md`**
- Add the new components to the file map.
- Add the new lint/format commands to the commands section.
- Add the editorial template to the template-switching section.

**9.3 — Update `README.md`**
- Update test count badge to "49 passing" (already correct).
- Update "35 unit tests" to "44 unit tests" in the Testing section.
- Add a Features section entry for: mobile TOC drawer, back-to-top, copy-to-clipboard, reading-time, print stylesheet, second template.
- Update File Hierarchy diagram.

**9.4 — Update `docs/Project_Architecture_Document.md`**
- Add new components to the component architecture.
- Update the data-flow diagram (reading-time, mobile drawer).
- Add a Templates section covering both `technical` and `editorial`.
- Update the test inventory appendix.

**9.5 — Update `docs/status.md`**
- Replace the outdated Phase 5/6 content with a current Phase summary reflecting the remediation.

**9.6 — Create `docs/audit/REMEDIATION_LOG.md`**
- The execution log. Updated after each phase. Contains: what was changed, what was verified, what was deferred, what failed and how it was fixed.

**9.7 — Document `parseDocument` flat-YAML limitation in `CLAUDE.md`** *(addresses M-17)*
- Add to the "Known Limitations" section: flat `key: value` only; no nested YAML; `gray-matter` is the upgrade path.

**9.8 — Document `index.html` `lang="en"` limitation** *(addresses L-3)*
- Add to CLAUDE.md "Known Limitations": `lang` attribute is hardcoded to `en`; for non-English documents, update `index.html` or set dynamically.

**Phase 9 exit criteria:** every doc claim traces to verified behavior. No stale counts, no missing features.

---

### Phase 10 — Final verification & archive

**10.1 — Run the full gate sequence**
```bash
npm run typecheck
npm run lint
npm run lint:format
npm run lint:markdown
npm run test
npm run test:coverage
npm run build
```
All must pass. The a11y gate (`npm run a11y`) is documented but may be skipped if Playwright browsers cannot be installed in this environment — flag explicitly in the remediation log.

**10.2 — Smoke test the build**
```bash
npm run preview -- --port 4173 &
curl -s http://localhost:4173/ | head -20
kill %1
```
Verify: title renders, no console errors in the HTML, CSS is inlined.

**10.3 — Create the tar archive**
```bash
cd /home/z/my-project
tar -czf markdown-to-html-remediated.tar.gz \
  --exclude='repo/node_modules' \
  --exclude='repo/dist' \
  --exclude='repo/test-results' \
  --exclude='repo/.git' \
  repo/
```
The archive includes:
- The remediated codebase (`src/`, `tests/`, `docs/`, configs).
- All updated documents (`README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/*`).
- The audit document (`docs/audit/AUDIT.md`).
- This implementation plan (`docs/audit/IMPLEMENTATION_PLAN.md`).
- The remediation log (`docs/audit/REMEDIATION_LOG.md`).

**10.4 — Save the tar to `/home/z/my-project/download/`**
- Move/copy the archive to the user-visible download directory.
- Report the absolute path to the user.

---

## 3. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Prettier format pass produces a huge diff that obscures the logical changes | High | Run the format pass as a single isolated commit before any other Phase 1 work. |
| `lucide-react` version 1.29.0 doesn't have the icons we need | Low | The library has had `Sun`, `Moon`, `Monitor` since 0.x. Verify with `npm ls lucide-react` after install. If missing, fall back to inline SVGs. |
| Mobile drawer focus trap is complex to implement correctly | Medium | Use a small, tested implementation. If time-constrained, ship a simpler "click outside to close" pattern and document the deferral. |
| Editorial template's serif font requires a network fetch | Low | Use `@fontsource-variable/source-serif-4` (already in the spec) or fall back to system serif. Document the choice. |
| Coverage thresholds fail after refactors | Medium | Run `npm run test:coverage` after each phase, not just at the end. |
| Playwright a11y gate cannot run in this environment | High | Document explicitly in the remediation log. The a11y tests are unchanged from the original (passing) state, so the gate is unchanged. |
| Tar archive exceeds reasonable size | Low | Exclude `node_modules`, `dist`, `test-results`, `.git`. Expected size: < 1 MB. |

---

## 4. Definition of Done (per §19 of the agent contract)

- [ ] Every Critical finding (C-1 through C-9) is resolved or explicitly deferred with justification.
- [ ] Every High finding (H-1 through H-9) is resolved or explicitly deferred.
- [ ] Medium and Low findings resolved or deferred per the phase plan above.
- [ ] `npm run typecheck` — zero errors.
- [ ] `npm run lint` — zero errors, zero warnings.
- [ ] `npm run lint:format` — zero errors.
- [ ] `npm run lint:markdown` — zero errors.
- [ ] `npm run test` — all tests pass (target: 49 + new tests ≈ 70+).
- [ ] `npm run test:coverage` — meets thresholds (lines/functions/statements 80%, branches 75%).
- [ ] `npm run build` — succeeds, single-file `dist/index.html`, < 250 KB gzipped.
- [ ] `npm run a11y` — passes (or explicitly skipped with justification).
- [ ] All documentation updated to reflect the remediated codebase.
- [ ] Audit document, implementation plan, and remediation log all in `docs/audit/`.
- [ ] Tar archive created at `/home/z/my-project/download/markdown-to-html-remediated.tar.gz`.

---

*End of plan. Execution log lives in `docs/audit/REMEDIATION_LOG.md`.*
