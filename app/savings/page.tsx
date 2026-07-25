import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/tables/simple-table";
import { activeSavingsFunds, getSavingsActivityAmount, getSavingsActivityKind, getSavingsBalance, getSavingsFundStatus } from "@/lib/calculations/savings";
import { dateInputValue, formatDateLabel } from "@/lib/dates";
import { formatWholeMoney } from "@/lib/money";
import { getBudgetData } from "@/lib/services/budget-data-service";
import { recentItems } from "@/lib/categories";
import { createSavingsActivityAction, createSavingsFundAction, deleteSavingsActivityAction, deleteSavingsFundAction, disableSavingsFundAction, updateSavingsFundAction } from "@/app/actions";
import type { SavingsFund } from "@/lib/types";

export const dynamic = "force-dynamic";

const fieldClass = "rounded-xl border border-white/15 bg-black/20 px-4 py-3";
const smallFieldClass = "rounded-lg border border-white/15 bg-black/20 px-2 py-1 text-xs";
const saveButtonClass = "rounded-lg bg-ledger-blue px-3 py-1 text-xs font-bold text-ledger-ink";
const dangerButtonClass = "rounded-lg border border-ledger-rose/50 px-3 py-1 text-xs text-red-100";

function typeValue(fund: SavingsFund) {
  return fund.type === "Emergency" ? "EMERGENCY" : "SINKING";
}

function modeValue(fund: SavingsFund) {
  return fund.mode === "Known Due Date" ? "KNOWN_DUE_DATE" : "OPEN_ENDED";
}

function optionalMoneyValue(value?: number | null) {
  return value == null ? "" : (value / 100).toFixed(2);
}

function StatusBadge({ label }: { label: string }) {
  const tone = label === "Goal met" ? "border-ledger-mint/60 bg-ledger-mint/10 text-ledger-mint" : label === "Short" ? "border-ledger-rose/60 bg-ledger-rose/10 text-red-100" : label === "Due soon" ? "border-ledger-amber/60 bg-ledger-amber/10 text-ledger-amber" : "border-white/15 bg-white/[0.04] text-slate-200";
  return <span className={`rounded-full border px-3 py-1 text-xs font-bold ${tone}`}>{label}</span>;
}

function ActivityKindBadge({ kind }: { kind: string }) {
  const tone = kind === "Planned" ? "border-ledger-blue/60 bg-ledger-blue/10 text-blue-100" : "border-ledger-mint/60 bg-ledger-mint/10 text-ledger-mint";
  return <span className={`rounded-full border px-2 py-1 text-xs font-bold ${tone}`}>{kind}</span>;
}

function FundManageForm({ fund }: { fund: SavingsFund }) {
  return (
    <details className="rounded-2xl border border-white/10 bg-black/10 p-3">
      <summary className="cursor-pointer list-none text-sm font-bold text-ledger-blue outline-none focus-visible:ring-2 focus-visible:ring-ledger-blue">Manage fund</summary>
      <div className="mt-3 grid gap-3 border-t border-white/10 pt-3">
        <form action={updateSavingsFundAction} className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <input type="hidden" name="fundId" value={fund.id} />
          <input name="name" defaultValue={fund.name} className={smallFieldClass} placeholder="Fund name" />
          <select name="type" defaultValue={typeValue(fund)} className={smallFieldClass}>
            <option value="EMERGENCY">Emergency</option>
            <option value="SINKING">Sinking fund</option>
          </select>
          <select name="mode" defaultValue={modeValue(fund)} className={smallFieldClass}>
            <option value="OPEN_ENDED">Open ended</option>
            <option value="KNOWN_DUE_DATE">Known due date</option>
          </select>
          <input name="startingBalance" defaultValue={(fund.startingBalanceCents / 100).toFixed(2)} className={smallFieldClass} placeholder="Starting" />
          <input name="targetAmount" defaultValue={optionalMoneyValue(fund.targetAmountCents)} className={smallFieldClass} placeholder="Target" />
          <input name="plannedContribution" defaultValue={(fund.plannedContributionCents / 100).toFixed(2)} className={smallFieldClass} placeholder="Monthly" />
          <input type="date" name="dueDate" defaultValue={fund.dueDate ?? ""} className={smallFieldClass} />
          <p className="text-xs text-slate-400 md:col-span-2 xl:col-span-3">Due date is required when mode is Known due date. Open-ended funds can leave it blank.</p>
          <button className={saveButtonClass}>Save changes</button>
        </form>
        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
          <form action={disableSavingsFundAction} className="flex items-center gap-2">
            <input type="hidden" name="fundId" value={fund.id} />
            <label className="flex items-center gap-1"><input required type="checkbox" /> Confirm</label>
            <button className={dangerButtonClass}>Disable</button>
          </form>
          <form action={deleteSavingsFundAction} className="flex items-center gap-2">
            <input type="hidden" name="fundId" value={fund.id} />
            <label className="flex items-center gap-1"><input required type="checkbox" /> Confirm unused</label>
            <button className={dangerButtonClass}>Delete unused</button>
          </form>
        </div>
      </div>
    </details>
  );
}

export default async function SavingsPage() {
  const { savingsActivities, savingsFunds } = await getBudgetData();
  const today = dateInputValue();
  const visibleFunds = activeSavingsFunds(savingsFunds);
  const fundById = new Map(savingsFunds.map((fund) => [fund.id, fund]));
  const recentActivities = recentItems(savingsActivities.toSorted((a, b) => b.date.localeCompare(a.date)), 12);

  return (
    <AppShell>
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h1 className="font-display text-5xl">Savings</h1>
          <p className="mt-2 text-slate-300">Track money set aside for future jobs. Goal met is shown as a status only; the plan never changes automatically.</p>
          <form action={createSavingsActivityAction} className="mt-5 grid gap-3">
            <select name="fundId" className={fieldClass}>{visibleFunds.map((fund) => <option key={fund.id} value={fund.id}>{fund.name}</option>)}</select>
            <input type="date" name="date" defaultValue={today} className={fieldClass} />
            <select name="type" className={fieldClass}><option value="CONTRIBUTION">Contribution</option><option value="WITHDRAWAL">Withdrawal</option></select>
            <input name="amount" className={fieldClass} placeholder="Amount" />
            <input name="description" className={fieldClass} placeholder="Description" />
            <button className="rounded-xl bg-ledger-amber px-4 py-3 font-bold text-ledger-ink">Add activity</button>
          </form>
        </Card>

        <Card>
          <h2 className="font-display text-3xl">Add fund</h2>
          <p className="mt-2 text-sm text-slate-400">Create another emergency bucket or sinking fund without changing existing goals.</p>
          <form action={createSavingsFundAction} className="mt-5 grid gap-3 md:grid-cols-2">
            <input name="name" className={fieldClass} placeholder="Fund name" />
            <select name="type" className={fieldClass}><option value="EMERGENCY">Emergency</option><option value="SINKING">Sinking fund</option></select>
            <select name="mode" className={fieldClass}><option value="OPEN_ENDED">Open ended</option><option value="KNOWN_DUE_DATE">Known due date</option></select>
            <input name="startingBalance" className={fieldClass} placeholder="Starting balance" />
            <input name="targetAmount" className={fieldClass} placeholder="Target amount" />
            <input name="plannedContribution" className={fieldClass} placeholder="Monthly contribution" />
            <input type="date" name="dueDate" className={fieldClass} />
            <p className="text-xs text-slate-400 md:col-span-2">Due date is required when mode is Known due date. Open-ended funds can leave it blank.</p>
            <button className="rounded-xl bg-ledger-amber px-4 py-3 font-bold text-ledger-ink">Add fund</button>
          </form>
        </Card>
      </div>

      <Card className="mt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl">Funds</h2>
            <p className="mt-1 text-sm text-slate-400">Cards show status and progress first. Editing stays tucked behind Manage.</p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-400">{visibleFunds.length} active</span>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {visibleFunds.map((fund) => {
            const balance = getSavingsBalance(fund, savingsActivities);
            const status = getSavingsFundStatus(fund, balance, today);
            return (
              <article key={fund.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-2xl">{fund.name}</h3>
                    <p className="text-sm text-slate-400">{fund.type} · {fund.mode}</p>
                  </div>
                  <StatusBadge label={status.label} />
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Current</p><p className="mt-1 font-mono text-2xl font-bold">{formatWholeMoney(balance)}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Target</p><p className="mt-1 font-mono text-xl font-bold">{fund.targetAmountCents ? formatWholeMoney(fund.targetAmountCents) : "No target"}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Monthly</p><p className="mt-1 font-mono text-xl font-bold">{formatWholeMoney(fund.plannedContributionCents)}</p></div>
                </div>
                {status.progressPercent == null ? null : <div className="mt-5"><div className="flex justify-between text-xs text-slate-400"><span>Progress</span><span>{status.progressPercent}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-black/30"><div className="h-full rounded-full bg-ledger-mint" style={{ width: `${status.progressPercent}%` }} /></div></div>}
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                  <span>Due: {fund.dueDate ? formatDateLabel(fund.dueDate) : "No due date"}</span>
                  {status.shortfallCents > 0 ? <span>Short by {formatWholeMoney(status.shortfallCents)}</span> : null}
                </div>
                <div className="mt-5"><FundManageForm fund={fund} /></div>
              </article>
            );
          })}
        </div>
      </Card>

      <Card className="mt-5">
        <h2 className="font-display text-3xl">Recent activity</h2>
        <div className="mt-5 max-h-[28rem] overflow-auto rounded-2xl border border-white/10">
          <SimpleTable
            headers={["Date", "Fund", "Kind", "Type", "Amount", "Description", "Action"]}
            rows={recentActivities.map((activity) => {
              const kind = getSavingsActivityKind(activity);
              return [
                activity.date,
                fundById.get(activity.fundId)?.name ?? "Unknown fund",
                <ActivityKindBadge key={`${activity.id}-kind`} kind={kind} />,
                activity.type,
                formatWholeMoney(getSavingsActivityAmount(activity)),
                activity.description ?? "",
                <form key={activity.id} action={deleteSavingsActivityAction} className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <input type="hidden" name="id" value={activity.id} />
                  <label className="flex items-center gap-1"><input required type="checkbox" /> Confirm</label>
                  <button className={dangerButtonClass}>{kind === "Planned" ? "Remove plan" : "Delete activity"}</button>
                </form>
              ];
            })}
          />
        </div>
      </Card>
    </AppShell>
  );
}
