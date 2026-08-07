const STORAGE_KEY = "theme";
const fallbackStore = new Map<string, string>();

export function readTheme(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return fallbackStore.get(STORAGE_KEY) ?? null;
  }
}

export function writeTheme(theme: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    fallbackStore.set(STORAGE_KEY, theme);
  }
}
