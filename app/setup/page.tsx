import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";

const checklist = ["Confirm starting checking balance", "Review CS and TCH paycheck dates and expected amounts", "Review recurring bills", "Review variable category budgets", "Review savings contributions", "Review credit card minimum payments and extra payments", "Confirm planned one-time expenses", "Check zero-based budget equals $0", "Check projected cash flow for negative days"];

export default function SetupPage() {
  return <AppShell><Card><h1 className="font-display text-5xl">Setup</h1><div className="mt-5 grid gap-3">{checklist.map((item, index) => <label key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"><input type="checkbox" defaultChecked={index < 4} /> <span>{item}</span></label>)}</div><button className="mt-5 rounded-xl bg-ledger-blue px-4 py-3 font-bold text-ledger-ink">Close Month</button><p className="mt-3 text-sm text-slate-400">Closed is a status marker; months remain editable.</p></Card></AppShell>;
}
