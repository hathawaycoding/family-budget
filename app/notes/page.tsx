import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";
import { notes } from "@/lib/sample-data";

export default function NotesPage() {
  return <AppShell><Card><h1 className="font-display text-5xl">Notes</h1><form className="mt-5 flex gap-3"><input className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/20 px-4 py-3" placeholder="Add a household note" /><button className="rounded-xl bg-ledger-amber px-4 py-3 font-bold text-ledger-ink" type="button">Add note</button></form><div className="mt-6 space-y-3">{notes.map((note) => <article key={note.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="font-mono text-sm text-ledger-blue">{note.actor} · {new Date(note.createdAt).toLocaleString()}</p><p className="mt-2">{note.body}</p></article>)}</div></Card></AppShell>;
}
