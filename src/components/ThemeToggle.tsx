import { useState, useEffect, useRef } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { readTheme, writeTheme } from "@/utils/theme-storage";

type Theme = "light" | "dark" | "system";

const NEXT_THEME: Record<Theme, Theme> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const THEME_LABEL: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const THEME_ICON: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(SYSTEM_DARK_QUERY).matches;
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else if (theme === "light") {
    root.setAttribute("data-theme", "light");
  } else {
    // system: resolve to actual preference so the rest of the page can react
    // to OS theme changes without waiting for CSS repaint, then strip the
    // attribute so the @media (prefers-color-scheme: dark) rule applies.
    if (systemPrefersDark()) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [announcement, setAnnouncement] = useState<string>("");
  const mountedRef = useRef(false);

  // Initial read from storage — runs once.
  useEffect(() => {
    const stored = readTheme();
    if (stored === "light" || stored === "dark" || stored === "system") {
      setTheme(stored);
    }
    mountedRef.current = true;
  }, []);

  // Apply theme + persist + subscribe to system changes when in "system" mode.
  useEffect(() => {
    if (!mountedRef.current) {
      // On first render (before the storage read effect runs), still apply
      // the default theme so the attribute is correct.
      applyTheme(theme);
      return;
    }
    applyTheme(theme);
    writeTheme(theme);
    setAnnouncement(`Theme changed to ${THEME_LABEL[theme].toLowerCase()}`);
  }, [theme]);

  // Subscribe to OS theme changes only when in "system" mode — avoids
  // unnecessary listener work in light/dark modes.
  useEffect(() => {
    if (theme !== "system") return;
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const mql = window.matchMedia(SYSTEM_DARK_QUERY);
    const handler = (e: MediaQueryListEvent) => {
      // Re-apply the system theme so the data-theme attribute reflects the
      // new OS preference immediately.
      if (e.matches) {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    };

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  const cycle = () => {
    setTheme((prev) => NEXT_THEME[prev]);
  };

  const Icon = THEME_ICON[theme];

  return (
    <>
      <button
        type="button"
        onClick={cycle}
        className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-md border border-border bg-bg-secondary p-2.5 text-text-secondary hover:text-text hover:bg-bg-tertiary"
        aria-label={`Toggle theme (current: ${theme})`}
        title={`Theme: ${THEME_LABEL[theme]}`}
      >
        <Icon aria-hidden="true" className="h-5 w-5" />
      </button>
      {/* Visually-hidden live region for screen-reader announcements. */}
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
