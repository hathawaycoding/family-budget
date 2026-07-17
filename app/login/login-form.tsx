"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, { error: "" });
  return (
    <form action={formAction} className="space-y-5 rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-sheet backdrop-blur md:p-8">
      <div>
        <label className="text-sm font-semibold" htmlFor="password">Household password</label>
        <input id="password" name="password" type="password" className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-white focus:outline focus:outline-2 focus:outline-ledger-blue" placeholder="budget2026" />
      </div>
      <fieldset>
        <legend className="text-sm font-semibold">Acting as</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {(["CS", "TCH"] as const).map((actor) => (
            <label key={actor} className="flex cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-3 font-mono text-lg has-[:checked]:border-ledger-amber has-[:checked]:bg-ledger-amber/20">
              <input className="sr-only" type="radio" name="actor" value={actor} defaultChecked={actor === "CS"} />
              {actor}
            </label>
          ))}
        </div>
      </fieldset>
      {state.error ? <p className="rounded-xl bg-ledger-rose/20 px-4 py-3 text-sm text-red-100">{state.error}</p> : null}
      <button disabled={pending} className="w-full rounded-xl bg-ledger-amber px-4 py-3 font-bold text-ledger-ink transition hover:brightness-110 disabled:opacity-60">
        {pending ? "Opening worksheet..." : "Open budget worksheet"}
      </button>
    </form>
  );
}
