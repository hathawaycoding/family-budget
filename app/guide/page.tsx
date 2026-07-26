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
        does: "Shows two months side by side with income, bills, spending, assigned money, unassigned money, ending cash, risk days, upcoming future expenses, and low-balance warnings when a checking cushion is configured.",
        useWhen: "Start here when you want to know if the month is balanced, underfunded, headed for a cash-flow problem, projected to dip below your low-balance threshold, or affected by upcoming future expenses.",
        action: "Open the cash-flow timeline for balance warnings, or review Future Expenses when an upcoming obligation needs planning."
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
        does: "Shows dated money movement, the projected checking balance after each activity, and a separate preview summary when active future expenses are included in monthly plan preview.",
        useWhen: "Use this when you need to know which exact day the account may fall below the household threshold, go negative, or become risky after previewed future expenses.",
        action: "Review Low balance and Negative balance warnings separately, then edit dates or amounts from the activity row or open Future Expenses when the preview needs adjustment."
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
        does: "Adds household transactions, shows how spending affects category budgets, and runs Shopping Guardrail warnings during quick-add.",
        useWhen: "Use this for groceries, restaurants, fuel, household supplies, and other day-to-day purchases, especially when you need to confirm whether a purchase still fits the plan.",
        action: "Add transactions quickly, choose cash/debit or credit card treatment correctly, and confirm any guardrail warnings before saving."
      },
      {
        name: "Shopping Guardrail",
        href: "/spending",
        does: "Checks a planned or actual purchase before it is saved. It shows category impact for every purchase, cash-flow risk for cash/debit purchases, and spouse approval status when CS or TCH asks before buying.",
        useWhen: "Use this before shopping, while entering a quick-add transaction, or when one spouse wants approval from the other before making a purchase.",
        action: "Enter merchant, category, amount, date, and cash-flow treatment. If warnings appear, confirm before saving, ask spouse, convert to a transaction, or cancel. Pending requests expire after the purchase date passes."
      },
      {
        name: "Future Expenses",
        href: "/future-expenses",
        does: "Plans upcoming costs before they become official budget items. Shows expected amount, due date, category, priority, preview status, set-aside guidance, and cash-flow risk.",
        useWhen: "Use this when you know an expense is coming, like school supplies, travel, car repairs, holidays, or annual fees, but you have not decided whether to make it a planned expense or sinking fund yet.",
        action: "Add the expense, keep Include in monthly plan preview on if you want warnings, then convert it to a planned expense or sinking fund when you are ready."
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
        does: "Shows paychecks, bill due dates, planned expenses, future expense due dates, savings activity, debt payment dates, and cash-flow warning days on a monthly calendar.",
        useWhen: "Use this when you want a date-based view of scheduled money movement, upcoming obligations, and low-balance or negative-balance risk.",
        action: "Scan the month for busy money days, future expense due dates, and warning labels before making spending decisions."
      },
      {
        name: "Reports",
        href: "/reports",
        does: "Summarizes planned versus actual results and provides CSV exports, including future expenses.",
        useWhen: "Use this at the end of the month or when you want to review budget performance and upcoming obligations.",
        action: "Download CSVs, including future-expenses.csv, or compare planned amounts against what actually happened."
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
                <article key={section.name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
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
