import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/tables/simple-table";
import { auditEvents } from "@/lib/sample-data";

export default function AuditHistoryPage() {
  return <AppShell><Card><h1 className="font-display text-5xl">Audit History</h1><p className="mt-2 text-slate-300">Meaningful changes are attributed to CS or TCH.</p><div className="mt-5"><SimpleTable headers={["When", "Actor", "Entity", "Action", "Field", "Old", "New"]} rows={auditEvents.map((event) => [new Date(event.createdAt).toLocaleString(), event.actor, event.entityType, event.action, event.fieldName ?? "", event.oldValue ?? "", event.newValue ?? ""])} /></div></Card></AppShell>;
}
