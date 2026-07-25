import Link from "next/link";
import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";

const guideGroups = [
  {
    label: "Start here",
    description: "Use these sections when you need to understand the month before making changes.",
    sections: [
      {
        name: "Dashboard",
        href: "/dashboard",
        does: "Shows two months side by side with income, bills, spending, assigned money, unassigned money, ending cash, risk days, and low-balance warnings when a checking cushion is configured.",
        useWhen: "Start here when you want to know if the month is balanced, underfunded, headed for a cash-flow problem, or projected to dip below your low-balance threshold.",
        action: "Open the cash-flow timeline from the dashboard if a month shows negative balance or low-balance risk."
      },
      {
        name: "Setup",
        href: "/setup",
        does: "Holds the monthly setup checklist, spending category budgets, and optional household low-balance checking threshold.",
        useWhen: "Use this before a month starts to confirm paychecks, bills, category budgets, savings, debt payments, planned expenses, and the checking cushion where warnings should begin.",
        action: "Set or clear the low-balance threshold, then adjust category budgets before entering daily spending."
      },
      {
        name: "Cash Flow",
        href: "/cash-flow",
        does: "Shows dated money movement and the projected checking balance after each activity.",
        useWhen: "Use this when you need to know which exact day the account may fall below the household threshold or go negative.",
        action: "Review Low balance and Negative balance warnings separately, then edit dates or amounts from the activity row when the forecast needs correction."
      }
    ]
  },
  {
    label: "Track money",
    description: "Use these sections to enter what is expected, what happened, and what still needs attention.",
    sections: [
      {
        name: "Income",
        href: "/income",
        does: "Lists CS and TCH paycheck entries and lets you update actual take-home amounts.",
        useWhen: "Use this after payday or when expected paycheck amounts change.",
        action: "Enter actual income so forecasts and reports use the real amount."
      },
      {
        name: "Bills",
        href: "/bills",
        does: "Tracks due dates, expected amounts, actual amounts, paid status, autopay, and skipped bills.",
        useWhen: "Use this when a bill is paid, delayed, skipped, or different from the expected amount.",
        action: "Mark bills paid, save actual amounts, or skip bills that should not affect cash flow."
      },
      {
        name: "Spending",
        href: "/spending",
        does: "Adds household transactions and shows how spending affects category budgets.",
        useWhen: "Use this for groceries, restaurants, fuel, household supplies, and other day-to-day purchases.",
        action: "Add transactions quickly and choose cash/debit or credit card treatment correctly."
      },
      {
        name: "Savings",
        href: "/savings",
        does: "Manages savings funds, sinking funds, planned contributions, actual contributions, withdrawals, and remaining goals.",
        useWhen: "Use this when setting aside money for future needs like car insurance, repairs, holidays, or emergency savings.",
        action: "Record contributions and withdrawals so fund balances roll forward accurately."
      },
      {
        name: "Debt",
        href: "/debt",
        does: "Tracks credit card balances, interest estimates, minimum payments, extra payments, and payoff projections.",
        useWhen: "Use this when updating monthly card balances or deciding how much extra to pay.",
        action: "Update balances manually and review how payments affect the payoff estimate."
      }
    ]
  },
  {
    label: "Review and communicate",
    description: "Use these sections to look back, coordinate with each other, and find what changed.",
    sections: [
      {
        name: "Calendar",
        href: "/calendar",
        does: "Shows paychecks, bill due dates, planned expenses, savings activity, debt payment dates, and cash-flow warning days on a monthly calendar.",
        useWhen: "Use this when you want a date-based view of scheduled money movement and low-balance or negative-balance risk.",
        action: "Scan the month for busy money days and warning labels before making spending decisions."
      },
      {
        name: "Reports",
        href: "/reports",
        does: "Summarizes planned versus actual results and provides CSV exports.",
        useWhen: "Use this at the end of the month or when you want to review budget performance.",
        action: "Download CSVs or compare planned amounts against what actually happened."
      },
      {
        name: "Notes",
        href: "/notes",
        does: "Keeps shared household notes for CS and TCH.",
        useWhen: "Use this when one person needs to leave context for the other, like waiting to pay a bill or changing an estimate.",
        action: "Add short notes that explain decisions or reminders inside the app."
      },
      {
        name: "Audit History",
        href: "/audit-history",
        does: "Shows meaningful changes made in the app, including who made them and what changed.",
        useWhen: "Use this when numbers look different and you need to understand what happened.",
        action: "Search the history of edits before correcting or undoing a recent change."
      }
    ]
  }
];

export default function GuidePage() {
  return (
    <AppShell>
      <div className="mb-6 max-w-4xl">
        <p className="font-mono text-sm uppercase tracking-[0.28em] text-ledger-amber">Stuck or unsure?</p>
        <h1 className="mt-2 font-display text-5xl md:text-6xl">Guide</h1>
        <p className="mt-3 text-lg text-slate-300">Use this page when you are not sure where to go next. Each section below explains what the page does, when to use it, and the next action to take.</p>
      </div>

      <div className="grid gap-5">
        {guideGroups.map((group) => (
          <Card key={group.label}>
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-ledger-blue">{group.label}</p>
                <p className="mt-2 text-sm text-slate-400">{group.description}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {group.sections.map((section) => (
                <article key={section.href} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-display text-3xl">{section.name}</h2>
                    <Link href={section.href} className="rounded-xl border border-ledger-blue/50 px-3 py-2 text-sm font-bold text-ledger-blue hover:bg-ledger-blue/10 focus-visible:ring-2 focus-visible:ring-ledger-blue">
                      Open {section.name}
                    </Link>
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm">
                    <div>
                      <dt className="font-mono text-xs uppercase tracking-[0.18em] text-slate-400">What it does</dt>
                      <dd className="mt-1 text-slate-200">{section.does}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-xs uppercase tracking-[0.18em] text-slate-400">Use it when</dt>
                      <dd className="mt-1 text-slate-200">{section.useWhen}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-xs uppercase tracking-[0.18em] text-slate-400">Next action</dt>
                      <dd className="mt-1 text-slate-200">{section.action}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
