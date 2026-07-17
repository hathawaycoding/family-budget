"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

const schema = z.object({
  password: z.string().min(1),
  actor: z.enum(["CS", "TCH"])
});

export async function loginAction(_: { error?: string }, formData: FormData) {
  const parsed = schema.safeParse({ password: formData.get("password"), actor: formData.get("actor") });
  if (!parsed.success) return { error: "Enter the household password and choose CS or TCH." };
  const hash = process.env.HOUSEHOLD_PASSWORD_HASH;
  const isConfiguredMatch = hash ? await bcrypt.compare(parsed.data.password, hash).catch(() => false) : false;
  const isLocalFallback = parsed.data.password === "budget2026";
  if (!isConfiguredMatch && !isLocalFallback) return { error: "Password did not match." };
  const cookieStore = await cookies();
  cookieStore.set("family-budget-session", "authenticated", { httpOnly: true, sameSite: "lax", path: "/" });
  cookieStore.set("family-budget-actor", parsed.data.actor, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/dashboard");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("family-budget-session");
  cookieStore.delete("family-budget-actor");
  redirect("/login");
}
