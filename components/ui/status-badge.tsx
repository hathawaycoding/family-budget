import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  Balanced: "border-ledger-mint/50 bg-ledger-mint/15 text-ledger-mint",
  "Needs Assignment": "border-ledger-amber/50 bg-ledger-amber/15 text-ledger-amber",
  Underfunded: "border-ledger-rose/50 bg-ledger-rose/15 text-ledger-rose",
  "Cash-Flow Risk": "border-ledger-rose/50 bg-ledger-rose/15 text-ledger-rose",
  Closed: "border-ledger-blue/50 bg-ledger-blue/15 text-ledger-blue",
  "Needs Review": "border-ledger-amber/50 bg-ledger-amber/15 text-ledger-amber"
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-bold", styles[status] ?? styles.Balanced, className)}>{status}</span>;
}
