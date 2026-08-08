/**
 * Active-section tracking logic, extracted from App.tsx for testability.
 *
 * The browser's `IntersectionObserver` callback fires with a *partial* list of
 * entries — only those whose intersection state *changed* since the last
 * callback, not every observed element. A naive implementation that clears
 * `activeSlug` when `entries.every((e) => !e.isIntersecting)` will incorrectly
 * clear the active section when a leaving section's entry is the only one in
 * the callback, even though other (unchanged) sections are still visible.
 *
 * The correct approach maintains a `Map<string, boolean>` of element-id →
 * isIntersecting, updated on every callback. The active slug is derived from
 * the map: the first entry (in insertion order) with `true`.
 *
 * This module is pure — no React, no DOM. It is exercised by unit tests that
 * simulate the partial-callback scenario directly.
 */

/** Minimal shape of an IntersectionObserverEntry used by the reducer. */
export interface CallbackEntry {
  target: { id: string };
  isIntersecting: boolean;
}

/**
 * Update the visibility map from a batch of callback entries, then return the
 * new active slug (the first id in insertion order whose visibility is `true`,
 * or `""` if no entry is visible).
 *
 * @param state - mutable Map<id, isIntersecting>; modified in place.
 * @param entries - the IntersectionObserver callback's entries array.
 * @returns the new active slug (id or empty string).
 */
export function reduceActiveSlug(state: Map<string, boolean>, entries: CallbackEntry[]): string {
  // Apply the incoming deltas to the visibility map.
  for (const entry of entries) {
    state.set(entry.target.id, entry.isIntersecting);
  }

  // Derive the active slug from the map's current state.
  for (const [id, visible] of state) {
    if (visible) return id;
  }
  return "";
}
