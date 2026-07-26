CREATE TYPE "ShoppingCheckStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'WAIT_REQUESTED', 'CONVERTED_TO_TRANSACTION', 'CANCELLED', 'EXPIRED');

CREATE TABLE "ShoppingCheck" (
  "id" TEXT NOT NULL,
  "householdId" TEXT NOT NULL,
  "budgetMonthId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "merchant" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "cashFlowTreatment" "CashFlowTreatment" NOT NULL DEFAULT 'CASH_DEBIT',
  "status" "ShoppingCheckStatus" NOT NULL DEFAULT 'DRAFT',
  "requestedByMemberId" TEXT NOT NULL,
  "reviewedByMemberId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "requestNote" TEXT,
  "reviewResponseNote" TEXT,
  "convertedTransactionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShoppingCheck_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShoppingCheck_convertedTransactionId_key" ON "ShoppingCheck"("convertedTransactionId");

ALTER TABLE "ShoppingCheck" ADD CONSTRAINT "ShoppingCheck_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShoppingCheck" ADD CONSTRAINT "ShoppingCheck_budgetMonthId_fkey" FOREIGN KEY ("budgetMonthId") REFERENCES "BudgetMonth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShoppingCheck" ADD CONSTRAINT "ShoppingCheck_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SpendingCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShoppingCheck" ADD CONSTRAINT "ShoppingCheck_requestedByMemberId_fkey" FOREIGN KEY ("requestedByMemberId") REFERENCES "HouseholdMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShoppingCheck" ADD CONSTRAINT "ShoppingCheck_reviewedByMemberId_fkey" FOREIGN KEY ("reviewedByMemberId") REFERENCES "HouseholdMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShoppingCheck" ADD CONSTRAINT "ShoppingCheck_convertedTransactionId_fkey" FOREIGN KEY ("convertedTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
