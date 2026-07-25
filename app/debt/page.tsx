import { AppShell } from "@/components/app-shell/app-shell";
import { getBudgetData } from "@/lib/services/budget-data-service";
import { DebtClient } from "./debt-client";

export const dynamic = "force-dynamic";

export default async function DebtPage() {
  const { debtAccounts } = await getBudgetData();
  return <AppShell><DebtClient debtAccounts={debtAccounts} /></AppShell>;
}
