import { useState, useEffect } from "react";
import { readTheme, writeTheme } from "@/utils/theme-storage";

type Theme = "light" | "dark" | "system";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = readTheme();
    if (stored === "light" || stored === "dark" || stored === "system") {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else if (theme === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
    writeTheme(theme);
  }, [theme]);

  const cycle = () => {
    setTheme((prev) => (prev === "light" ? "dark" : prev === "dark" ? "system" : "light"));
  };

  return (
    <button
      type="button"
      onClick={cycle}
      className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-md border border-border bg-bg-secondary p-2.5 text-text-secondary hover:text-text hover:bg-bg-tertiary"
      aria-label={`Toggle theme (current: ${theme})`}
      title={`Theme: ${theme}`}
    >
      {theme === "light" ? "☀️" : theme === "dark" ? "🌙" : "💻"}
    </button>
  );
}
