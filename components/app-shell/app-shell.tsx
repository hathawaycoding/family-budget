import Link from "next/link";
import { cookies } from "next/headers";
import { logoutAction } from "@/app/login/actions";
import { ThemeToggle } from "./theme-toggle";

const nav = [
  ["Dashboard", "/dashboard"], ["Cash Flow", "/cash-flow"], ["Calendar", "/calendar"], ["Income", "/income"], ["Bills", "/bills"], ["Spending", "/spending"], ["Savings", "/savings"], ["Debt", "/debt"], ["Reports", "/reports"], ["Setup", "/setup"], ["Notes", "/notes"], ["Audit History", "/audit-history"]
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const actor = (await cookies()).get("family-budget-actor")?.value ?? "CS";
  return (
    <div className="min-h-screen md:grid md:grid-cols-[17rem_1fr]">
      <aside className="no-print border-b border-white/10 bg-black/20 p-4 backdrop-blur md:min-h-screen md:border-b-0 md:border-r">
        <div className="rounded-3xl border border-ledger-amber/40 bg-ledger-amber/10 p-4">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-ledger-amber">Family Budget</p>
          <p className="mt-2 font-display text-3xl">Worksheet</p>
        </div>
        <nav className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-1">
          {nav.map(([label, href]) => <Link key={href} href={href} className="rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/10">{label}</Link>)}
        </nav>
      </aside>
      <div>
        <header className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-ledger-dusk/80 px-4 py-3 backdrop-blur md:px-8">
          <div className="font-mono text-sm">Active actor: <span className="rounded bg-ledger-blue/20 px-2 py-1 text-ledger-blue">{actor}</span></div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={logoutAction}><button className="rounded-xl border border-white/15 px-3 py-2 text-sm">Log out</button></form>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
