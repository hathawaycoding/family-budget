export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "family-budget-theme";

export function resolveTheme(value: string | null | undefined): Theme {
  return value === "light" ? "light" : "dark";
}

export function getStoredTheme(storage: Pick<Storage, "getItem"> | undefined): Theme {
  if (!storage) return "dark";
  return resolveTheme(storage.getItem(THEME_STORAGE_KEY));
}

export function applyTheme(documentElement: HTMLElement, theme: Theme) {
  documentElement.classList.toggle("light", theme === "light");
  documentElement.classList.toggle("dark", theme === "dark");
  documentElement.dataset.theme = theme;
}

export function persistTheme(storage: Pick<Storage, "setItem">, theme: Theme) {
  storage.setItem(THEME_STORAGE_KEY, theme);
}

export function nextTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

export const themeHydrationScript = `
try {
  var theme = localStorage.getItem("${THEME_STORAGE_KEY}") === "light" ? "light" : "dark";
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
} catch (_) {}
`;
