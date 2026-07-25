"use client";

import { useEffect } from "react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ledger-ink p-6 text-white">
      <section className="max-w-lg rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-sheet">
        <p className="text-xs uppercase tracking-[0.22em] text-ledger-amber">Something needs attention</p>
        <h1 className="mt-3 font-display text-4xl">This page could not finish loading.</h1>
        <p className="mt-3 text-sm text-slate-300">Your data was not erased. Try the page again. If this keeps happening, check the last form entry for a missing or invalid value.</p>
        <button onClick={reset} className="mt-5 rounded-xl bg-ledger-amber px-4 py-3 font-bold text-ledger-ink">Try again</button>
      </section>
    </main>
  );
}
