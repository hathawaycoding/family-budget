import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import type { Actor } from "@/lib/types";

export async function requireSession() {
  const cookieStore = await cookies();
  if (cookieStore.get("family-budget-session")?.value !== "authenticated") {
    throw new Error("Unauthorized");
  }
}

export async function requireActor(): Promise<Actor> {
  await requireSession();
  const actor = (await cookies()).get("family-budget-actor")?.value;
  if (actor !== "CS" && actor !== "TCH") throw new Error("Missing active actor");
  return actor;
}

export async function getCurrentHousehold() {
  await requireSession();
  const household = await prisma.household.findFirst({ orderBy: { createdAt: "asc" } });
  if (!household) throw new Error("No household has been seeded yet. Run npm run prisma:seed.");
  return household;
}

export async function getCurrentMember() {
  const actor = await requireActor();
  const household = await getCurrentHousehold();
  const member = await prisma.householdMember.findUnique({ where: { householdId_label: { householdId: household.id, label: actor } } });
  if (!member) throw new Error(`Missing household member ${actor}. Run npm run prisma:seed.`);
  return { household, member, actor };
}
