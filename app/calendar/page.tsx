import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";
import { daysInMonth } from "@/lib/dates";
import { getMonthBundle } from "@/lib/services/budget-data-service";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const { bills, income, plannedExpenses, futureExpenses, savingsActivities, cashFlowRows } = await getMonthBundle("2026-07");
  const negativeDates = new Set(cashFlowRows.filter((row) => row.isNegative).map((row) => row.date));
  const lowBalanceDates = new Set(cashFlowRows.filter((row) => row.isLowBalance).map((row) => row.date));
  const days = Array.from({ length: daysInMonth(2026, 7) }, (_, index) => `2026-07-${String(index + 1).padStart(2, "0")}`);
  return <AppShell><h1 className="mb-5 font-display text-5xl">Calendar</h1><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">{days.map((day) => { const events = [...income.filter((item) => item.date === day).map((item) => `${item.source} paycheck`), ...bills.filter((item) => item.dueDate === day).map((item) => item.name), ...plannedExpenses.filter((item) => item.date === day).map((item) => item.description), ...futureExpenses.filter((item) => item.dueDate === day).map((item) => `Future: ${item.description}`), ...savingsActivities.filter((item) => item.date === day).map((item) => item.description ?? "Savings"), ...(negativeDates.has(day) ? ["Negative balance risk"] : []), ...(lowBalanceDates.has(day) ? ["Low balance risk"] : [])]; return <Card key={day} className="min-h-32"><p className="font-mono text-sm text-ledger-amber">{day.slice(-2)}</p><div className="mt-3 space-y-2">{events.length ? events.map((event) => <p key={event} className={`rounded-lg px-2 py-1 text-sm ${event === "Negative balance risk" ? "bg-ledger-rose/20 text-red-100" : event === "Low balance risk" ? "bg-ledger-amber/20 text-yellow-100" : event.startsWith("Future:") ? "bg-ledger-blue/20 text-blue-100" : "bg-white/10"}`}>{event}</p>) : <p className="text-sm text-slate-500">No activity</p>}</div></Card>; })}</div></AppShell>;
}
