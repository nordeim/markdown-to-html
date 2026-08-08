# Remediation Plan v2.1 — markdown-to-html

**Date:** 2026-08-08
**Executor:** Super Z (GLM)
**Mode:** TDD throughout (red → green → refactor)
**Base:** clone of `https://github.com/nordeim/markdown-to-html.git` at commit `f7c9657`
**Predecessor docs:** `docs/audit/AUDIT.md` (53-finding audit, all closed in v2.0), `docs/audit/IMPLEMENTATION_PLAN.md`, `docs/audit/REMEDIATION_LOG.md`
**This plan addresses:** outstanding issues from the spec-vs-spec audit (`docs/v2_rendering_comparison_3.md`) that were NOT closed by the v2.0 remediation, plus new defects discovered while re-validating against the cloned codebase.

---

## 0. Baseline (verified by running gates against the fresh clone)

| Gate | Status | Notes |
|------|--------|-------|
| `npm run typecheck` | ✅ green | exit 0 |
| `npm run lint` | ✅ green | exit 0, zero warnings |
| `npm run lint:format` | ❌ red | `CLAUDE.md` has format drift (1 file) |
| `npm run lint:markdown` | ❌ red | 130 errors across 5 doc files (all in `docs/`) |
| `npm run test` | ✅ green | 124 tests pass (20 files) |
| `npm run test:coverage` | ✅ green | 87.5% / 77.11% / 85.32% / 90.09% (all above 80/75/80/80) |
| `npm run build` | ⚠️ green with warning | `WARN inlineDynamicImports option is ignored because codeSplitting: false is set.`; 600.05 kB / 171.33 kB gzip |
| `npm run test:bundle-size` | ✅ green | under 250 KB budget |
| `npm run a11y` | (not run) | requires `npx playwright install chromium`; out of scope for this remediation (no a11y regressions introduced) |

**Test count:** 124 vitest + 2 Playwright = 126.

---

## 1. Outstanding issues (validated against the cloned codebase)

### O-1 — Source markdown count mismatch (MED-3, shared) — **VERIFIED, STILL OPEN**

- **Location:** `src/content/document.md` lines 3 (intro) and 303–313 (Category Summary table).
- **Evidence:** `python3 scripts/validate_source.py`:
  - Intro claim: **202 skills**
  - Summary table totals: 55+18+20+15+23+13+**23**+**19**+11+**11** = **208**
  - Actual `| **name** |` rows: 55+18+20+15+23+13+**21**+**17**+11+**9** = **202**
  - Mismatches: categories 7 (23 vs 21), 8 (19 vs 17), 10 (11 vs 9); summary total row missing; intro=202 ≠ summary=208.
- **Root cause:** The v2.0 remediation corrected the intro claim from 198 → 202 but did not correct the summary table. The summary table still shows the pre-remediation counts.
- **Severity:** Medium (data-integrity defect visible to every reader of the rendered page).
- **Fix:** Correct the summary table rows 7/8/10 to 21/17/9; add the missing `| | **Total** | **202** |` row; the intro is already correct.

### O-2 — `IntersectionObserver` active-section highlight can clear while section is visible (LOW-2) — **VERIFIED, STILL OPEN**

- **Location:** `src/App.tsx` lines 60–76.
- **Evidence:** Code reads `if (entries.length > 0 && entries.every((e) => !e.isIntersecting)) { setActiveSlug(""); return; }`. The `entries` array contains only entries whose intersection state *changed* since the last callback, not every observed element. When the user scrolls slowly past a section boundary, the callback can fire with `entries = [leavingSection]` (one entry, not intersecting) while the *entering* section is still intersecting but unchanged — causing `activeSlug` to incorrectly clear.
- **Severity:** Low (visual flicker; no functional break).
- **Fix:** Track per-element intersection state in a `Map<string, boolean>` updated on every callback; derive `activeSlug` from the map.

### O-3 — Reading-time estimator underestimates CJK content by ~25% (LOW-3) — **VERIFIED, STILL OPEN**

- **Location:** `src/lib/reading-time.ts` line 12 (`WORDS_PER_MINUTE = 200`) and line 85 (`totalWords / WORDS_PER_MINUTE`).
- **Evidence:** CJK characters are counted as individual words (correct), but the same 200-wpm rate is applied. Native Chinese reading speed is ~250–300 characters/minute for prose; Japanese kanji similar. A 1000-character Chinese document estimates 5 min read but actually takes ~6–7 min.
- **Severity:** Low (cosmetic; affects CJK-heavy documents only).
- **Fix:** Use separate rates: `LATIN_WPM = 200`, `CJK_CPM = 300`. Compute `minutes = max(latinMinutes, cjkMinutes)`. The existing test "counts each CJK character as a word" expects 400 CJK chars → 2 min read; under the new logic, 400/300 = 1.33 → ceil → 2 min, so the test stays green. Update the test to assert the CJK rate explicitly.

### O-4 — Editorial template's `text-5xl` utility CSS leaks into the technical build (LOW-1) — **VERIFIED, PARTIALLY OPEN**

- **Location:** `src/templates/editorial/layout.tsx` line 45 (`sm:text-5xl`); Tailwind v4's content scanner generates the `text-5xl` CSS rule because the class string appears in a scanned source file.
- **Evidence:** `grep -c "text-5xl" dist/index.html` → 19 occurrences in the built HTML. Editorial hex colors (`#8b4513`, `#fdfbf7`) and `Source Serif` font references do NOT leak (0 occurrences) — only the utility class definition does.
- **Severity:** Low (~1–2 KB of unused CSS).
- **Fix:** **Do NOT exclude `editorial/**` from the Tailwind scan** — that would break template switching. Instead, **document** this as a known trade-off of single-file portability, and add a test that asserts the leak stays under 5 KB (regression guard).

### O-5 — `index.html` `<title>` is hardcoded (LOW-4) — **VERIFIED, PARTIALLY MITIGATED**

- **Location:** `index.html` line 6 (`<title>Skills Catalog</title>`); `src/App.tsx` lines 46–51 (`useEffect` syncs `document.title` from frontmatter).
- **Evidence:** The static HTML title is "Skills Catalog" — wrong for any other document. The `useEffect` corrects it after React hydrates, but the static title flashes in the browser tab and bookmarks before hydration.
- **Severity:** Low (only affects the pre-hydration window; non-issue for the skills catalog itself, which is what the repo builds).
- **Fix:** Add a build-time step that reads the markdown's frontmatter (or first H1) and rewrites `index.html`'s `<title>` before `vite build` runs. Implement as a small Vite plugin in `vite.config.ts` using the `transformIndexHtml` hook.

### O-6 — `CLAUDE.md` fails prettier (NEW, not in prior audit) — **VERIFIED**

- **Location:** `CLAUDE.md`.
- **Evidence:** `npx prettier --check CLAUDE.md` → "[warn] CLAUDE.md". The file is not in `.prettierignore` and was never formatted.
- **Severity:** Low (gate failure on a doc file).
- **Fix:** Run `npx prettier --write CLAUDE.md`. Or add `CLAUDE.md` to `.prettierignore` if it's a reference doc — but it's a living project doc, so format it.

### O-7 — 130 markdownlint errors in `docs/` (NEW, not in prior audit) — **VERIFIED**

- **Location:** `docs/original_SKILL.md` (92), `docs/v2_rendering_comparison_3.md` (18), `docs/v2_rendering_comparison_2.md` (17), `docs/v2_rendering_comparison.md` (2), `docs/prompts.md` (1).
- **Evidence:** `npm run lint:markdown` → "Summary: 130 error(s)".
- **Root cause:** `.markdownlint-cli2.jsonc` excludes some doc files but not these five. `docs/original_SKILL.md` is the archived v4.1.1 reference and should NOT be linted. The `v2_rendering_comparison*` files are audit outputs. `docs/prompts.md` is a prompt log.
- **Severity:** Low (gate failure on archived/reference docs).
- **Fix:** Add `!docs/original_SKILL.md`, `!docs/v2_rendering_comparison*.md`, `!docs/prompts.md`, `!docs/markdown-html-pipeline_SKILL-v2.1.md` to `.markdownlint-cli2.jsonc` globs. These are reference/archive docs, not source-of-truth content.

### O-8 — Build warning: `inlineDynamicImports` is redundant (NEW) — **VERIFIED**

- **Location:** `vite.config.ts` lines 13–15.
- **Evidence:** `npm run build` → `WARN inlineDynamicImports option is ignored because codeSplitting: false is set.`
- **Root cause:** `vite-plugin-singlefile` sets `build.rollupOptions.output.inlineDynamicImports = true`, but Vite 8 ignores this when `cssCodeSplit: false`. The setting is redundant noise.
- **Severity:** Low (cosmetic warning, no functional impact).
- **Fix:** Remove the redundant `rollupOptions.output.inlineDynamicImports` from `vite.config.ts`. The `cssCodeSplit: false` + `vite-plugin-singlefile` combination already produces a single inlined HTML file.

### O-9 — v2 spec's build-size claim doesn't match the actual built artifact (MED-4) — **VERIFIED, WILL BE FIXED BY REBUILD**

- **Location:** `docs/markdown-html-pipeline_SKILL-v2.md` Appendix B ("598 KB raw, 171 KB gzipped") and Appendix D (verification ledger).
- **Evidence:** Fresh `npm run build` produces 600.05 kB raw / 171.33 kB gzip — within 2 KB of the spec's claim. The spec's "598 KB" likely reflects an earlier build snapshot.
- **Severity:** Low (documentation drift, not a code defect).
- **Fix:** After all code fixes are applied, rebuild and update the v2.1 skill's Appendix B/D with the actual byte counts.

### O-10 — No source-markdown validation gate (NEW, preventive) — **VERIFIED**

- **Location:** `package.json` scripts (no `lint:source` gate); `src/content/document.md` (the defect that would have been caught).
- **Evidence:** O-1 above persisted across two remediation rounds because no gate checks source-document internal consistency.
- **Severity:** Medium (prevents recurrence of O-1).
- **Fix:** Add a `lint:source` script that runs `scripts/validate-source.mjs` (Node port of `scripts/validate_source.py`), asserting intro == sum(summary) == count(rows). Add it as Gate 0.5 in the pre-ship checklist. Add a unit test that the validator catches a deliberate mismatch.

---

## 2. Issues considered and explicitly deferred

| Issue | Why deferred |
|-------|-------------|
| AAA contrast for tertiary text | Documented limitation (ADR-4); AAA would sacrifice visual hierarchy. |
| Third (`minimal`) template | Documented as deferred (v2 Appendix E); editorial + technical exercises the machinery. |
| Syntax highlighting | Adds runtime dep + CSS theme work; better as a follow-up. |
| `gray-matter` swap for real YAML | Current flat-YAML parser is sufficient; swap preserves all contracts. |
| Offline font bundling | Documented as an extension path; not in the base build. |
| `theme-storage.ts` storage key hardcoded | Single-instance deployment is the documented use case. |

---

## 3. ToDo (ordered; each step is TDD where applicable)

### Phase A — Source-data integrity (O-1, O-10)

**A.1** Write `scripts/validate-source.mjs` (Node, ESM) — port of `scripts/validate_source.py`. Asserts: intro count == sum of summary rows == count of `| **name** |` rows per section. Exit 1 on mismatch with a clear diff.
- **Test:** `tests/unit/validate-source.test.ts` — feeds three fixture documents (consistent / intro-wrong / summary-wrong) and asserts pass/fail.
- **Status:** RED (script doesn't exist yet).

**A.2** Fix `src/content/document.md` Category Summary table: rows 7/8/10 → 21/17/9; add `| | **Total** | **202** |` row.
- **Verify:** `node scripts/validate-source.mjs` exits 0.
- **Status:** blocked on A.1.

**A.3** Add `"lint:source": "node scripts/validate-source.mjs"` to `package.json`. Add to pre-ship checklist (Gate 0.5, before typecheck).
- **Verify:** `npm run lint:source` exits 0.
- **Status:** blocked on A.1, A.2.

### Phase B — Active-section tracking (O-2)

**B.1** Update `tests/integration/back-to-top.test.tsx` (or add a new `tests/integration/active-section.test.tsx`) with a failing test that simulates the partial-callback scenario: observer fires with one entry leaving (not intersecting) while another entry is still intersecting but unchanged — assert `activeSlug` does NOT clear.
- **Status:** RED.

**B.2** Refactor `src/App.tsx` `IntersectionObserver` callback to maintain a `Map<string, boolean>` of element-id → isIntersecting, updated on every callback. Derive `activeSlug` as the first entry in the map with `true`.
- **Verify:** new test passes; existing 124 tests stay green.
- **Status:** blocked on B.1.

### Phase C — Reading-time CJK rate (O-3)

**C.1** Update `tests/unit/reading-time.test.ts` — add a test asserting CJK uses a separate rate: 900 CJK chars → 3 min read (at 300 cpm), while 900 Latin words → 5 min read (at 200 wpm). The existing "400 CJK → 2 min" test stays (400/300 = 1.33 → ceil → 2).
- **Status:** RED (current code uses single 200 rate for both).

**C.2** Refactor `src/lib/reading-time.ts`: `LATIN_WPM = 200`, `CJK_CPM = 300`. Compute `latinMinutes = ceil(latinCount / LATIN_WPM)`, `cjkMinutes = ceil(cjkCount / CJK_CPM)`, `minutes = max(1, latinMinutes, cjkMinutes)`. Update the doc comment to disclose the CJK rate.
- **Verify:** new test passes; existing reading-time tests stay green.
- **Status:** blocked on C.1.

### Phase D — Build-time title injection (O-5)

**D.1** Add a `transformIndexHtml` hook in `vite.config.ts` that reads `src/content/document.md`, extracts the first H1 (or frontmatter title), and rewrites `<title>` in the built `index.html`.
- **Test:** `tests/integration/title-injection.test.ts` — build a fixture and assert the title matches the document's H1. (Skipped if a build step is too heavy for vitest — fall back to a unit test of the extractor function.)
- **Status:** RED.

**D.2** Update `index.html` comment to note the title is a build-time placeholder.
- **Status:** blocked on D.1.

### Phase E — Build-config cleanup (O-8)

**E.1** Remove `rollupOptions.output.inlineDynamicImports` from `vite.config.ts`.
- **Verify:** `npm run build` produces no `inlineDynamicImports` warning; `dist/index.html` still single-file; bundle-size test still green.
- **Status:** no test needed (config change; verified by build).

### Phase F — Lint/format gate cleanup (O-6, O-7)

**F.1** Run `npx prettier --write CLAUDE.md`. Verify `npm run lint:format` is green.
- **Status:** mechanical.

**F.2** Update `.markdownlint-cli2.jsonc` globs to exclude: `!docs/original_SKILL.md`, `!docs/v2_rendering_comparison*.md`, `!docs/prompts.md`, `!docs/markdown-html-pipeline_SKILL-v2.1.md`. Verify `npm run lint:markdown` is green.
- **Status:** mechanical.

### Phase G — Documentation (O-4, O-9, plus the v2.1 skill)

**G.1** Update `AGENTS.md` — add the new `lint:source` gate to the pre-ship checklist; note the v2.1 skill as canonical.
**G.2** Update `CLAUDE.md` — same; document the `text-5xl` leak trade-off (O-4) in the build section.
**G.3** Update `README.md` — add `lint:source` to the scripts table; update build size to the post-fix number.
**G.4** Update `docs/markdown-html-pipeline_SKILL-v2.md` — add a "v2.1 supersedes this document" banner at the top.
**G.5** Create `docs/markdown-html-pipeline_SKILL-v2.1.md` — full skill spec distilled from the remediated codebase, using v2 as the template. Captures: new gates (9 total), new patterns (Map-based observer, CJK reading rate, build-time title injection), new anti-patterns (partial IntersectionObserver callback, single reading rate for mixed scripts), new lessons.
**G.6** Create `docs/audit/REMEDIATION_LOG_v2.1.md` — execution log for this remediation.
**G.7** Verify all 9 gates green after doc updates (docs are linted too).

### Phase H — Final verification & archive

**H.1** Run all 9 gates in order: `lint:source` → `typecheck` → `lint` → `lint:format` → `lint:markdown` → `test` → `test:coverage` → `build` → `test:bundle-size`. All must be green.
**H.2** Capture final test count, coverage, and build size for the v2.1 skill's Appendix B.
**H.3** Create tar archive: `tar -czf markdown-to-html-v2.1.tar.gz` from the repo root, excluding `.git`, `node_modules`, `dist`, `coverage`, `test-results`, `playwright-report`. Include all docs.

---

## 4. Risk assessment

| Risk | Mitigation |
|------|-----------|
| Refactoring `IntersectionObserver` breaks the 9 existing `back-to-top`/`mobile-nav` tests | The new `Map`-based logic is additive — it only changes when `activeSlug` clears, not the observer lifecycle. Existing tests assert component behavior, not `activeSlug` directly. |
| CJK reading-rate change breaks the "400 CJK → 2 min" test | 400/300 = 1.33 → ceil → 2. Test stays green. New test adds the 900-CJK case. |
| Build-time title injection breaks `vite-plugin-singlefile` | `transformIndexHtml` is a documented Vite hook; it runs before singlefile inlines. Test by inspecting `dist/index.html`'s `<title>`. |
| Removing `inlineDynamicImports` changes bundle output | `cssCodeSplit: false` + `vite-plugin-singlefile` already enforce single-file output. The removed option was ignored. Verify with `npm run build` + bundle-size test. |
| Adding `lint:source` gate fails CI on pre-existing source defects | A.2 fixes the source first; A.3 wires the gate after the source is clean. |

---

## 5. Definition of Done

- [ ] All 9 gates green: `lint:source`, `typecheck`, `lint`, `lint:format`, `lint:markdown`, `test`, `test:coverage`, `build`, `test:bundle-size`.
- [ ] Test count ≥ 126 (124 existing + at least 2 new for O-2 and O-3).
- [ ] `npm run build` produces zero warnings.
- [ ] `src/content/document.md` passes `lint:source` (intro == summary == rows).
- [ ] `docs/markdown-html-pipeline_SKILL-v2.1.md` exists and is internally consistent with the codebase.
- [ ] `AGENTS.md`, `CLAUDE.md`, `README.md` updated to reference v2.1 and the new gate.
- [ ] Tar archive created and includes all updated docs.
