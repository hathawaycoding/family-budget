import { PrismaClient } from "@prisma/client";
import { months } from "../lib/sample-data";

const prisma = new PrismaClient();

async function main() {
  const household = await prisma.household.upsert({ where: { id: "seed-household" }, update: {}, create: { id: "seed-household", name: "Family Budget Household" } });
  for (const label of ["CS", "TCH"] as const) {
    await prisma.householdMember.create({ data: { householdId: household.id, label, displayName: label } }).catch(() => undefined);
  }
  for (const month of months) {
    await prisma.budgetMonth.create({ data: { householdId: household.id, year: month.year, month: month.month, startDate: new Date(`${month.startDate}T00:00:00.000Z`), endDate: new Date(`${month.endDate}T00:00:00.000Z`), startingCheckingBalanceCents: month.startingBalanceCents } }).catch(() => undefined);
  }
  await prisma.account.create({ data: { householdId: household.id, name: "Main checking", type: "CHECKING", startingBalanceCents: 541469, currentBalanceCents: 541469 } }).catch(() => undefined);
}

main().finally(async () => prisma.$disconnect());
