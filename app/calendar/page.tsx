import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";
import { daysInMonth } from "@/lib/dates";
import { getBudgetData } from "@/lib/services/budget-data-service";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const { bills, income, plannedExpenses, savingsActivities } = await getBudgetData();
  const days = Array.from({ length: daysInMonth(2026, 7) }, (_, index) => `2026-07-${String(index + 1).padStart(2, "0")}`);
  return <AppShell><h1 className="mb-5 font-display text-5xl">Calendar</h1><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">{days.map((day) => { const events = [...income.filter((item) => item.date === day).map((item) => `${item.source} paycheck`), ...bills.filter((item) => item.dueDate === day).map((item) => item.name), ...plannedExpenses.filter((item) => item.date === day).map((item) => item.description), ...savingsActivities.filter((item) => item.date === day).map((item) => item.description ?? "Savings")]; return <Card key={day} className="min-h-32"><p className="font-mono text-sm text-ledger-amber">{day.slice(-2)}</p><div className="mt-3 space-y-2">{events.length ? events.map((event) => <p key={event} className="rounded-lg bg-white/10 px-2 py-1 text-sm">{event}</p>) : <p className="text-sm text-slate-500">No activity</p>}</div></Card>; })}</div></AppShell>;
}
