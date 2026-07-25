"use client";

import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, nextTheme, persistTheme, type Theme } from "./theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const storedTheme = getStoredTheme(window.localStorage);
    setTheme(storedTheme);
    applyTheme(document.documentElement, storedTheme);
  }, []);

  const targetTheme = nextTheme(theme);

  function handleToggle() {
    const updatedTheme = nextTheme(theme);
    setTheme(updatedTheme);
    applyTheme(document.documentElement, updatedTheme);
    persistTheme(window.localStorage, updatedTheme);
  }

  return (
    <button
      type="button"
      aria-label={`Switch to ${targetTheme} mode`}
      className="rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm text-slate-900 transition hover:bg-white dark:border-white/15 dark:bg-transparent dark:text-slate-100 dark:hover:bg-white/10"
      onClick={handleToggle}
    >
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
