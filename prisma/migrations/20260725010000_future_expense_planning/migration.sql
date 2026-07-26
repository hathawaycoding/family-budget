CREATE TYPE "FutureExpensePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'MUST_PAY');
CREATE TYPE "FutureExpenseType" AS ENUM ('ONE_TIME', 'RECURRING');
CREATE TYPE "FutureExpenseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CONVERTED_TO_PLANNED_EXPENSE', 'CONVERTED_TO_SINKING_FUND', 'COMPLETED', 'CANCELLED');
CREATE TYPE "FutureExpenseSetAsideMode" AS ENUM ('EQUAL_MONTHLY', 'CUSTOM');

ALTER TABLE "PlannedExpense" ADD COLUMN "sourceFutureExpenseId" TEXT;
ALTER TABLE "SavingsFund" ADD COLUMN "linkedFutureExpenseId" TEXT;

CREATE TABLE "FutureExpense" (
  "id" TEXT NOT NULL,
  "householdId" TEXT NOT NULL,
  "budgetMonthId" TEXT,
  "description" TEXT NOT NULL,
  "expectedAmountCents" INTEGER NOT NULL,
  "dueDate" DATE NOT NULL,
  "categoryId" TEXT NOT NULL,
  "priority" "FutureExpensePriority" NOT NULL,
  "notes" TEXT,
  "type" "FutureExpenseType" NOT NULL DEFAULT 'ONE_TIME',
  "recurrenceRuleId" TEXT,
  "status" "FutureExpenseStatus" NOT NULL DEFAULT 'ACTIVE',
  "setAsideMode" "FutureExpenseSetAsideMode" NOT NULL DEFAULT 'EQUAL_MONTHLY',
  "includeInPlanPreview" BOOLEAN NOT NULL DEFAULT true,
  "convertedPlannedExpenseId" TEXT,
  "convertedSavingsFundId" TEXT,
  "createdByMemberId" TEXT NOT NULL,
  "updatedByMemberId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FutureExpense_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FutureExpenseContribution" (
  "id" TEXT NOT NULL,
  "householdId" TEXT NOT NULL,
  "futureExpenseId" TEXT NOT NULL,
  "budgetMonthId" TEXT NOT NULL,
  "date" DATE,
  "plannedAmountCents" INTEGER NOT NULL,
  "createdByMemberId" TEXT NOT NULL,
  "updatedByMemberId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FutureExpenseContribution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FutureExpense_convertedPlannedExpenseId_key" ON "FutureExpense"("convertedPlannedExpenseId");
CREATE UNIQUE INDEX "FutureExpense_convertedSavingsFundId_key" ON "FutureExpense"("convertedSavingsFundId");
CREATE UNIQUE INDEX "PlannedExpense_sourceFutureExpenseId_key" ON "PlannedExpense"("sourceFutureExpenseId");
CREATE UNIQUE INDEX "SavingsFund_linkedFutureExpenseId_key" ON "SavingsFund"("linkedFutureExpenseId");

ALTER TABLE "PlannedExpense" ADD CONSTRAINT "PlannedExpense_sourceFutureExpenseId_fkey" FOREIGN KEY ("sourceFutureExpenseId") REFERENCES "FutureExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SavingsFund" ADD CONSTRAINT "SavingsFund_linkedFutureExpenseId_fkey" FOREIGN KEY ("linkedFutureExpenseId") REFERENCES "FutureExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FutureExpense" ADD CONSTRAINT "FutureExpense_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FutureExpense" ADD CONSTRAINT "FutureExpense_budgetMonthId_fkey" FOREIGN KEY ("budgetMonthId") REFERENCES "BudgetMonth"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FutureExpense" ADD CONSTRAINT "FutureExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SpendingCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FutureExpense" ADD CONSTRAINT "FutureExpense_recurrenceRuleId_fkey" FOREIGN KEY ("recurrenceRuleId") REFERENCES "RecurrenceRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FutureExpense" ADD CONSTRAINT "FutureExpense_convertedSavingsFundId_fkey" FOREIGN KEY ("convertedSavingsFundId") REFERENCES "SavingsFund"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FutureExpense" ADD CONSTRAINT "FutureExpense_createdByMemberId_fkey" FOREIGN KEY ("createdByMemberId") REFERENCES "HouseholdMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FutureExpense" ADD CONSTRAINT "FutureExpense_updatedByMemberId_fkey" FOREIGN KEY ("updatedByMemberId") REFERENCES "HouseholdMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FutureExpenseContribution" ADD CONSTRAINT "FutureExpenseContribution_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FutureExpenseContribution" ADD CONSTRAINT "FutureExpenseContribution_futureExpenseId_fkey" FOREIGN KEY ("futureExpenseId") REFERENCES "FutureExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FutureExpenseContribution" ADD CONSTRAINT "FutureExpenseContribution_budgetMonthId_fkey" FOREIGN KEY ("budgetMonthId") REFERENCES "BudgetMonth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FutureExpenseContribution" ADD CONSTRAINT "FutureExpenseContribution_createdByMemberId_fkey" FOREIGN KEY ("createdByMemberId") REFERENCES "HouseholdMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FutureExpenseContribution" ADD CONSTRAINT "FutureExpenseContribution_updatedByMemberId_fkey" FOREIGN KEY ("updatedByMemberId") REFERENCES "HouseholdMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
