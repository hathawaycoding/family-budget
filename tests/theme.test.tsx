// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ThemeToggle } from "@/components/app-shell/theme-toggle";
import { applyTheme, getStoredTheme, nextTheme, resolveTheme, THEME_STORAGE_KEY, themeHydrationScript } from "@/components/app-shell/theme";

describe("theme behavior", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    cleanup();
  });

  it("defaults to dark when no saved theme exists", () => {
    expect(getStoredTheme(window.localStorage)).toBe("dark");
    expect(resolveTheme(null)).toBe("dark");
  });

  it("resolves saved light and dark themes", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(getStoredTheme(window.localStorage)).toBe("light");
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(getStoredTheme(window.localStorage)).toBe("dark");
  });

  it("falls back to dark for invalid saved values", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "neon");
    expect(getStoredTheme(window.localStorage)).toBe("dark");
  });

  it("applies light theme classes and metadata", () => {
    applyTheme(document.documentElement, "light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("applies dark theme classes and metadata", () => {
    document.documentElement.classList.add("light");
    applyTheme(document.documentElement, "dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("toggles theme values", () => {
    expect(nextTheme("dark")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
  });

  it("renders saved light theme without overwriting it to dark", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    render(<ThemeToggle />);

    expect(await screen.findByRole("button", { name: "Switch to dark mode" })).toBeTruthy();
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("defaults to dark and switches to light on click", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Switch to light mode" });

    fireEvent.click(button);

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeTruthy();
  });

  it("switches back to dark on a second click", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });

  it("preserves light theme after component remount", async () => {
    const firstRender = render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));
    firstRender.unmount();
    document.documentElement.className = "";

    render(<ThemeToggle />);

    expect(await screen.findByRole("button", { name: "Switch to dark mode" })).toBeTruthy();
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("pre-hydration script applies saved light before React mounts", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");

    Function(themeHydrationScript)();

    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
