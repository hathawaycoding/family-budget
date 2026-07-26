// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GuidePage from "@/app/guide/page";

vi.mock("@/components/app-shell/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

function duplicateHrefKeyWarningCalls(errorSpy: ReturnType<typeof vi.spyOn>) {
  return errorSpy.mock.calls.filter((call) => call.some((part) => String(part).includes("Encountered two children with the same key")));
}

describe("guide page", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders spending guide sections without duplicate key warnings", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<GuidePage />);

    expect(screen.getByRole("link", { name: "Open Spending" }).getAttribute("href")).toBe("/spending");
    expect(screen.getByRole("link", { name: "Open Shopping Guardrail" }).getAttribute("href")).toBe("/spending");
    expect(duplicateHrefKeyWarningCalls(errorSpy)).toHaveLength(0);
  });

  it("detects the duplicate-key failure when href is used as the section key", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const sections = [
      { name: "Spending", href: "/spending" },
      { name: "Shopping Guardrail", href: "/spending" }
    ];

    function BrokenGuideSections() {
      return (
        <div>
          {sections.map((section) => (
            <article key={section.href}>{section.name}</article>
          ))}
        </div>
      );
    }

    render(<BrokenGuideSections />);

    const warnings = duplicateHrefKeyWarningCalls(errorSpy);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].some((part) => String(part).includes("/spending"))).toBe(true);
  });
});
