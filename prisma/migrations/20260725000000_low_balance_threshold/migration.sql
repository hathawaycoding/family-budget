-- Add nullable household-level checking cushion setting.
ALTER TABLE "Household" ADD COLUMN "lowBalanceThresholdCents" INTEGER;
