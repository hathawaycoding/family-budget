import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="grid max-w-5xl gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <p className="font-mono text-sm uppercase tracking-[0.35em] text-ledger-amber">July to December 2026</p>
          <h1 className="mt-4 font-display text-5xl leading-tight md:text-7xl">The household ledger before the month starts.</h1>
          <p className="mt-5 max-w-xl text-lg text-slate-300">A shared planning worksheet for cash flow, bills, spending, savings, debt, notes, and audit history. Dark mode is the default because late-night budget meetings are real.</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
