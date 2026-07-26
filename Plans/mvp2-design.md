# Family Budget MVP2 Design

## 1. Purpose

MVP2 turns the current app from a mostly read-only preview into a database-backed household budgeting tool.

MVP1 established:

- Next.js app shell and required pages.
- Docker Compose with app, PostgreSQL, and Adminer.
- Prisma schema foundation.
- Login screen with household password and actor labels.
- Sample data driven dashboard, reports, cash flow, bills, income, spending, savings, debt, notes, and audit pages.
- Calculation helpers and unit tests.

MVP2 should focus on persistence, editing, safe mutations, audit history, and the household workflows needed to use the app for real local budgeting.

`Plans/plan.md` remains the product source of truth. This file defines the MVP2 implementation plan and must not override `Plans/plan.md`.

## 2. MVP2 Goal

MVP2 should make the app usable for real local household budgeting by storing core data in PostgreSQL and allowing the household to add, edit, and delete the most important planning records.

Primary MVP2 outcome:

A user can log in, choose `CS` or `TCH`, configure starting budget data, add/edit/delete spending transactions, manage bills, update income actuals, manage savings funds, manage credit card debt, and see dashboard/cash-flow/report values recalculate from PostgreSQL data instead of `lib/sample-data.ts`.

## 3. MVP2 In Scope

MVP2 includes:

- Replace runtime page reads from `lib/sample-data.ts` with Prisma-backed queries.
- Expand Prisma schema to cover MVP2 editable entities.
- Create formal Prisma migration for current and new schema.
- Seed initial household data into PostgreSQL.
- Add service functions for database reads and mutations.
- Add Zod validation for all MVP2 mutations.
- Add server actions for forms.
- Add audit events for every meaningful create/update/delete/skip/paid/withdrawal/payment action.
- Make Setup editable for core defaults.
- Make Spending transactions fully editable.
- Add Shopping Guardrail checks, spouse approval requests, warning confirmations, and conversion to transactions.
- Make Bills editable enough for monthly operation.
- Make Income actuals editable.
- Make Savings funds and activities editable.
- Make Debt accounts, snapshots, and payments editable.
- Recalculate dashboard, cash flow, and reports from database data.
- Keep Docker local workflow working on `http://localhost:3200`.
- Keep Adminer available on `http://localhost:8080`.
- Add unit/integration tests for positive and negative mutation scenarios.

## 4. MVP2 Out Of Scope

MVP2 should not attempt to finish every version 1 feature.

Defer:

- Multi-household support.
- Separate user passwords.
- Bank imports.
- Bank connections.
- Email reminders.
- Text/SMS reminders.
- Advanced recurring template scope prompts for every entity.
- Full undo system beyond transaction delete recovery if simple.
- Playwright E2E coverage for every page.
- Production deployment.
- Tax reporting or tax exports.
- Debt payoff recommendations such as snowball or avalanche.

## 5. Current Gap Summary

Current app state:

- Pages mostly import from `lib/sample-data.ts`.
- Prisma schema only includes `Household`, `HouseholdMember`, `BudgetMonth`, `Account`, and `AuditEvent`.
- `prisma db push` runs in Docker startup.
- `prisma/seed.ts` seeds only partial household/month/account data.
- Spending quick-add form is UI only.
- Bills, income, setup, notes, savings, debt, and reports are read-only.
- CSV exports are sample-data backed.
- Receipt upload route stores files but does not connect metadata to a persisted transaction.
- Audit history page displays sample data instead of database events.

MVP2 should remove those limitations for the core workflow.

## 6. Database Strategy

Use formal Prisma migrations for MVP2.

Recommended first migration command during implementation:

```sh
npx prisma migrate dev --name mvp2_persistence
```

Docker startup may continue using `prisma db push` during local development, but the repo should have a real migration committed for MVP2 schema.

MVP2 should preserve:

- Money as integer cents.
- Date-only financial semantics.
- Household ID on major tables.
- Actor attribution using `CS` and `TCH`.
- Audit events for meaningful mutations.

## 7. Prisma Models To Add Or Expand

MVP2 should add these models:

```text
IncomeSource
IncomeEntry
BillTemplate
BillInstance
SpendingCategory
Transaction
TransactionSplit
ShoppingCheck
Receipt
PlannedExpense
SavingsFund
SavingsActivity
DebtAccount
DebtSnapshot
DebtPayment
Note
Reminder
Transfer
```

MVP2 should also expand existing models where needed:

- `Household` should relate to all household-owned data.
- `HouseholdMember` should relate to created/updated records where useful.
- `BudgetMonth` should relate to income, bills, transactions, planned expenses, savings activities, debt snapshots, debt payments, and transfers.
- `Account` should support checking, savings, and credit card account types, even if UI focuses on main checking and credit cards.
- `AuditEvent` should support structured old/new values and enough metadata to display meaningful change history.

## 8. MVP2 Data Ownership

Database-backed in MVP2:

- Dashboard summary.
- Cash-flow rows.
- Calendar events.
- Income page.
- Bills page.
- Spending page.
- Savings page.
- Debt page.
- Notes page.
- Audit History page.
- Setup page core configuration.
- Reports summary.
- CSV exports for implemented entities.

Sample-data-backed allowed only as test fixtures:

- Unit tests.
- Demo fallback if database is empty.
- Temporary migration aid.

Runtime pages should not import `lib/sample-data.ts` once their entity is implemented.

## 9. Services Layer

Add service modules under `lib/services/`.

Recommended modules:

- `lib/services/household-service.ts`
- `lib/services/month-service.ts`
- `lib/services/setup-service.ts`
- `lib/services/income-service.ts`
- `lib/services/bill-service.ts`
- `lib/services/spending-service.ts`
- `lib/services/savings-service.ts`
- `lib/services/debt-service.ts`
- `lib/services/report-service.ts`
- `lib/services/note-service.ts`
- `lib/services/audit-service.ts`
- `lib/services/reminder-service.ts`

Service rules:

- Pages may call read services.
- Server actions call mutation services.
- Mutation services validate actor/household scope.
- Mutation services write audit events.
- Calculation services remain database-independent where practical.
- Service mappers should normalize Prisma rows into the domain types used by calculation functions.

## 10. Authentication And Actor Handling

MVP2 can keep the current household password flow, but mutations must require:

- Authenticated session cookie.
- Active actor cookie with value `CS` or `TCH`.
- Server-side validation inside each server action.

Do not rely only on middleware for mutation protection.

MVP2 should add helper functions:

- `requireSession()`
- `requireActor()`
- `getCurrentHousehold()`
- `getCurrentMember()`

Remove or clearly isolate fallback password behavior before any real data use. If fallback remains for local MVP2, label it as local-only.

## 11. Setup Page MVP2

Setup should become the control center for editable defaults.

Editable setup fields:

- July 2026 starting checking balance.
- CS expected paycheck amount.
- TCH expected paycheck amount.
- Known bill due dates.
- Known bill expected amounts.
- Category monthly budgets.
- Active/inactive categories.
- Savings default planned contributions.
- Debt minimum payments and due dates.

Setup actions:

- Save starting balance.
- Save paycheck defaults.
- Save category budgets.
- Save bill defaults.
- Save savings defaults.
- Save debt defaults.
- Regenerate missing July-Dec paycheck entries.
- Regenerate missing July-Dec bill instances.
- Regenerate missing recurring savings contributions.

Validation:

- Amounts must be positive unless the field explicitly supports zero.
- Due day must be valid for the month.
- Category name cannot be blank.
- Duplicate active category names should be blocked.
- Starting balance may be positive, zero, or negative if the user explicitly enters it.

Audit:

- Record changed field, old value, new value, and actor.

## 12. Spending MVP2

Spending is the highest-priority editable daily workflow.

Required capabilities:

- Add transaction.
- Edit transaction.
- Delete transaction with confirmation.
- Add single-category transaction.
- Add split transaction.
- Validate split total equals transaction total.
- Mark transaction as cash/debit or credit card.
- Mark planned/unplanned.
- Mark reimbursable.
- Add notes.
- Attach optional receipt.
- Show transactions table from database.
- Show category budget/carryover from database.

Cash-flow rules:

- Cash/debit spending reduces checking cash flow on transaction date.
- Credit-card spending counts against category budget but does not reduce checking.
- Credit-card spending does not automatically update credit card debt balance.
- Split transaction subtracts total once from cash flow.
- Split amounts count toward their categories.

Validation:

- Date required.
- Merchant required.
- Amount must be positive.
- Category or splits required.
- Split total must equal transaction total.
- Receipt must be image or PDF.
- Receipt size max remains `MAX_RECEIPT_UPLOAD_MB`.

Audit:

- Create transaction: created event.
- Update transaction: field-level or summary update event.
- Delete transaction: deleted event.
- Receipt attach: updated event.

## 12.1 Shopping Guardrail MVP2

Shopping Guardrail should be implemented as part of the Spending workflow.

Required capabilities:

- Create a pre-purchase shopping check.
- Use the same guardrail preview during transaction quick-add.
- Enter date, merchant, category, amount, cash/debit or credit-card treatment, and optional request note.
- Show category budget impact for all checks.
- Show checking cash-flow impact only for cash/debit checks.
- Ask spouse for in-app approval.
- Allow the other spouse to approve, request waiting, or comment.
- Convert an approved or confirmed shopping check to a transaction.
- Require explicit confirmation before saving or converting when warnings exist, approval is pending, wait was requested, or the request expired.
- Expire pending or draft requests after the purchase date passes.
- Allow manual cancellation.
- Show pending requests on the Spending page and dashboard where practical.
- Explain the workflow in the in-app Guide page.

Rules:

- Unconverted shopping checks do not affect official spending totals, category actuals, cash flow, or debt balances.
- Credit-card shopping checks trigger category warnings only.
- Cash/debit shopping checks trigger category and cash-flow warnings.
- Expired and cancelled checks should not convert to transactions without explicit confirmation or reopening.

Validation:

- Date required.
- Merchant required.
- Amount must be positive.
- Category required.
- Cash-flow treatment required.
- Conversion with warnings requires confirmation.

Audit:

- Shopping check created.
- Approval requested.
- Approval response saved.
- Warning override confirmed.
- Converted to transaction.
- Cancelled.
- Expired if persisted.

## 13. Bills MVP2

Bills should support monthly operation.

Required capabilities:

- Show bill instances from database.
- Edit a bill instance.
- Create a one-time bill if needed.
- Mark bill paid.
- Store paid date.
- Mark bill skipped.
- Show skipped bills distinctly.
- Unskip bill if needed.
- Edit expected amount.
- Edit actual amount.
- Edit due date.
- Edit autopay flag.

Cash-flow rules:

- Bills affect projected cash flow on due date.
- Paid date does not move cash-flow date.
- Skipped bills are excluded from cash flow.
- Paid/skipped bills do not trigger reminders.

Validation:

- Bill name required.
- Expected amount positive.
- Due date required.
- Actual amount positive if provided.
- Paid date optional.
- Skipped bill must not affect cash flow.

Audit:

- Mark paid.
- Mark skipped.
- Unskip.
- Field edits.
- Delete if implemented.

## 14. Income MVP2

Income should support real expected and actual amounts.

Required capabilities:

- Show paycheck entries from database.
- Edit expected amount.
- Enter actual amount.
- Add one-time income.
- Regenerate CS/TCH 14-day recurring paychecks through Dec 2026.

Rules:

- CS starts July 3, 2026, every 14 days.
- TCH starts July 9, 2026, every 14 days.
- Forecast uses actual amount if present.
- Otherwise forecast uses expected amount.
- Income uses net take-home only.

Validation:

- Date required.
- Source required.
- Expected amount positive.
- Actual amount positive if provided.

Audit:

- Income created.
- Expected amount updated.
- Actual amount updated.
- One-time income added/deleted.

## 15. Savings MVP2

Savings should be database-backed and editable in MVP2.

Required capabilities:

- Create savings fund.
- Edit savings fund.
- Disable or delete savings fund with confirmation.
- Support fund type: Emergency or Sinking Fund.
- Support goal mode: Known Due Date or Open Ended.
- Store starting balance.
- Store current balance or derive current balance from starting balance plus activities.
- Store target amount.
- Store due date for known due date funds.
- Store planned monthly contribution.
- Add planned or actual contribution.
- Add withdrawal.
- Prevent withdrawals that exceed available fund balance.
- Show remaining amount to target.
- Show linked future obligation where applicable.
- Show fund activity history.

Required seeded savings fund:

```text
Car Insurance
Monthly contribution: $245
Target/estimated bill: $1,400
Due date: January 30, 2027
```

Cash-flow rules:

- Savings contributions reduce checking cash flow on activity date.
- Savings withdrawals increase checking cash flow on activity date.
- Savings goals should not go negative.

Budget rules:

- Savings contributions count in monthly affordability and zero-based budgeting.
- Savings details should stay on the Savings tab and not become detailed dashboard widgets.

Validation:

- Fund name required.
- Fund type required.
- Goal mode required.
- Target amount positive if provided.
- Due date required for Known Due Date mode.
- Contribution amount positive.
- Withdrawal amount positive.
- Withdrawal cannot exceed available fund balance.

Audit:

- Fund created.
- Fund updated.
- Fund deleted/disabled.
- Contribution created/updated/deleted.
- Withdrawal created/updated/deleted.
- Blocked withdrawals should not create financial activity but can show validation errors.

## 16. Debt MVP2

Debt should be database-backed and editable in MVP2.

Scope:

- Credit card debt only.
- Do not include mortgage in debt tracking.
- Do not include student loans in debt tracking.

Required capabilities:

- Create credit card debt account.
- Edit credit card debt account.
- Disable or delete credit card debt account with confirmation.
- Store starting balance.
- Store current balance.
- Store interest rate.
- Store minimum payment.
- Store due day/date.
- Enter monthly balance snapshot.
- Enter actual payment.
- Enter extra payment.
- Link debt payment to bill instance where practical.
- Show estimated monthly interest.
- Show total payment.
- Show projected payoff date if practical.
- Show debt trend chart from database snapshots/projections.

Rules:

- Credit card balances are manually updated by the user once per month.
- Credit-card spending transactions do not automatically update debt balance.
- Credit-card purchases do not reduce checking cash flow unless marked cash/debit.
- Credit card payments appear in cash flow on due date.
- Debt payments reduce related debt balance when recorded as debt payments.
- Extra debt payments count in monthly affordability and zero-based budgeting.
- Debt payoff projections may extend beyond December 2026.

Interest estimate:

```text
estimated monthly interest = current balance * annual interest rate / 12
```

Label interest as an estimate, not an exact statement value.

Validation:

- Debt account name required.
- Current balance cannot be negative.
- Interest rate cannot be negative.
- Minimum payment cannot be negative.
- Extra payment cannot be negative.
- Due day/date required.
- Actual payment cannot be negative.
- Snapshot balance cannot be negative.

Audit:

- Debt account created.
- Debt account updated.
- Debt account deleted/disabled.
- Snapshot created/updated/deleted.
- Payment created/updated/deleted.
- Linked bill payment update if applicable.

## 17. Notes MVP2

Notes should become database-backed.

Required capabilities:

- Create note.
- Edit note.
- Soft-delete note.
- Search notes.
- Show actor and timestamp.

Rules:

- Notes are household-wide.
- Notes are not tied to a month.

Audit:

- Note created.
- Note updated.
- Note deleted.

## 18. Audit History MVP2

Audit History should read from PostgreSQL.

Required capabilities:

- Show audit events.
- Filter by actor.
- Filter by entity type.
- Search field/entity/new value where practical.
- Sort newest first.

Audit event shape:

- Date/time.
- User: `CS` or `TCH`.
- Entity changed.
- Entity ID.
- Field changed.
- Old value.
- New value.
- Action type.

MVP2 should prioritize meaningful audit entries over perfect field-by-field diffs.

## 19. Dashboard MVP2

Dashboard should derive from PostgreSQL.

Required capabilities:

- Show July/August side by side initially.
- Support month pair selection if simple.
- Show expected income.
- Show expected bills.
- Show actual bills.
- Show expected spending.
- Show actual spending.
- Show money assigned.
- Show unassigned money.
- Show projected ending cash balance.
- Show month status.
- Show category 80% alerts.
- Show negative cash-flow warning.

Dashboard should include savings and debt in monthly affordability calculations, but should not show detailed savings or debt widgets.

## 20. Cash Flow MVP2

Cash flow should derive from database records.

Inputs:

- Budget month.
- Starting checking balance or override.
- Income entries.
- Bill instances.
- Cash/debit transactions.
- Planned one-time expenses.
- Savings contributions.
- Savings withdrawals.
- Credit card payments.
- Debt extra payments.
- Transfers if implemented.

Requirements:

- Include every calendar day.
- Show no-activity days.
- Apply conservative rounding.
- Flag negative projected balances.
- Filter by month and type if practical.

## 21. Reports And CSV MVP2

Reports should use database-backed report services.

MVP2 report focus:

- Monthly summary.
- Cash-flow timeline.
- Bills list.
- Spending transactions.
- Planned vs actual by category for spending.
- Savings goals.
- Debt balances.

CSV routes should no longer read from `lib/sample-data.ts`.

Required CSVs for MVP2:

- `transactions.csv`
- `bills.csv`
- `monthly-summary.csv`
- `cash-flow.csv`
- `planned-vs-actual.csv`
- `debt-balances.csv`
- `savings-goals.csv`

Reports should include:

- Savings planned vs actual.
- Debt payment planned vs actual.
- Debt trend from database data.
- Savings fund balances from database data.

## 22. Receipt Upload MVP2

Receipt uploads should be connected to persisted transactions.

Required behavior:

- Upload image or PDF.
- Store file under uploads volume.
- Store receipt metadata in PostgreSQL.
- Attach receipt to transaction.
- Show receipt file name/link in transaction row.
- Validate max size and MIME type.

Do not add OCR in MVP2.

## 23. Validation

Use Zod server-side validation for all mutations.

Required validation modules:

- `lib/validation/setup.ts`
- `lib/validation/income.ts`
- `lib/validation/bills.ts`
- `lib/validation/spending.ts`
- `lib/validation/shopping-guardrail.ts` if not kept inside spending validation
- `lib/validation/savings.ts`
- `lib/validation/debt.ts`
- `lib/validation/notes.ts`
- `lib/validation/uploads.ts`

Client-side validation can improve UX, but server-side validation is required.

## 24. UI Approach

Preserve the current worksheet visual direction.

MVP2 UI changes should:

- Keep dark mode default.
- Keep responsive layout.
- Add forms inside existing pages.
- Prefer safe inline edit panels or modal/dialog forms.
- Use confirm UI for destructive actions.
- Show validation messages near fields.
- Show success/error feedback after mutations.
- Keep mobile quick-add spending prominent.
- Keep savings details on the Savings tab.
- Keep debt details on the Debt tab.

MVP2 should avoid redesigning the visual system unless necessary.

## 25. Testing Strategy

Add tests for services, validation, and calculations.

Unit tests:

- Money parsing/rounding.
- Recurrence generation.
- Cash-flow skipped bill exclusion.
- Cash-flow credit-card spending exclusion.
- Split transaction validation.
- Zero-based status.
- Category 80% warning.
- Shopping Guardrail category warning.
- Shopping Guardrail cash/debit cash-flow warning.
- Shopping Guardrail credit-card cash-flow exclusion.
- Shopping approval expiration after purchase date.
- Savings contribution cash-flow effect.
- Savings withdrawal cash-flow effect.
- Savings withdrawal over balance rejection.
- Car insurance fund monthly accumulation.
- Debt monthly interest estimate.
- Debt payment balance reduction.
- Debt extra payment monthly affordability effect.
- Credit-card purchase not reducing checking or debt balance.

Integration tests with test database or mocked Prisma:

- Create transaction.
- Create shopping check.
- Respond to shopping approval request.
- Convert shopping check to transaction.
- Require warning confirmation before guarded conversion.
- Reject invalid transaction.
- Create split transaction.
- Reject split mismatch.
- Mark bill paid.
- Skip bill.
- Edit income actual.
- Create savings contribution.
- Reject savings withdrawal over balance.
- Create debt snapshot.
- Create debt payment.
- Create audit event on mutation.
- Generate CSV from database rows.

E2E smoke tests if practical:

- Login.
- Dashboard loads.
- Add transaction.
- Mark bill paid.
- Add savings contribution.
- Add debt payment.
- View audit event.

## 26. Docker And Local Workflow

Expected local URLs:

- App: `http://localhost:3200`
- Adminer: `http://localhost:8080`

Recommended command:

```sh
docker compose up --build
```

For migrations:

```sh
docker compose exec app npx prisma migrate dev
```

For seed:

```sh
docker compose exec app npm run prisma:seed
```

MVP2 should update README with the exact workflow.

## 27. Seed Data MVP2

Seed should create complete editable starter data.

Required seed:

- One household.
- Members `CS` and `TCH`.
- Budget months July through December 2026.
- Main checking account with July starting balance `$5,414.69`.
- Income sources `CS` and `TCH`.
- Generated CS paychecks from July 3, 2026.
- Generated TCH paychecks from July 9, 2026.
- Known bills: Mortgage, Cell phone, Internet, Student loans.
- Bill instances through December 2026.
- Spending categories from `Plans/plan.md`.
- Known budgets: Groceries, Restaurants, Fuel, Taxes.
- Sample transactions using no personal identifiers.
- Car Insurance sinking fund with `$245/month`, `$1,400` target, and `2027-01-30` due date.
- Emergency Fund sample.
- Example generic credit card debt accounts.
- Debt snapshots and payments sufficient to render a debt trend.
- Sample notes.
- Sample audit events.

Do not seed real bank names, account numbers, addresses, or personal names.

## 28. Implementation Phases

### Phase 1: Schema And Migration

- Expand Prisma schema.
- Create formal migration.
- Update seed script.
- Add Prisma client helper.
- Add household/member lookup helpers.

### Phase 2: Read From Database

- Replace sample-data reads for dashboard, cash flow, income, bills, spending, savings, debt, notes, audit history, and reports.
- Keep calculation functions pure.

### Phase 3: Spending CRUD

- Add transaction actions.
- Add Shopping Guardrail actions and approval workflow.
- Add Shopping Guardrail preview calculations.
- Add split validation.
- Add receipt metadata persistence.
- Add audit events.
- Add tests.

### Phase 4: Bills And Income Editing

- Add bill instance actions.
- Add mark paid/skip/unskip.
- Add income expected/actual editing.
- Add tests.

### Phase 5: Savings Editing

- Add savings fund actions.
- Add contribution and withdrawal actions.
- Block over-withdrawal.
- Add car insurance sinking fund behavior.
- Add tests.

### Phase 6: Debt Editing

- Add debt account actions.
- Add debt snapshot actions.
- Add debt payment actions.
- Add estimated interest and trend from DB data.
- Add tests.

### Phase 7: Setup Editing

- Add setup forms.
- Add regenerate paychecks/bills/savings actions.
- Add starting balance override.
- Add category budget editing.
- Add tests.

### Phase 8: Reports And Exports

- Move CSV routes to database.
- Add planned vs actual report from DB.
- Add debt balances export.
- Add savings goals export.
- Add printable styles check.

### Phase 9: Polish And Verification

- Improve mobile forms.
- Add loading/error states.
- Run tests and build.
- Verify Docker startup.
- Verify Adminer data.
- Update README.

## 29. Acceptance Criteria

MVP2 is complete when:

- A user can run Docker and open the app at `http://localhost:3200`.
- PostgreSQL contains the household seed data.
- Dashboard reads from PostgreSQL.
- Cash flow reads from PostgreSQL and shows every day.
- Spending transactions can be added, edited, deleted, and audited.
- Shopping Guardrail checks can be created, approved, wait-requested, cancelled, expired, and converted to transactions.
- Shopping Guardrail warning overrides require confirmation and are audited.
- Split transactions validate correctly.
- Credit-card spending does not reduce checking cash flow.
- Bills can be edited, marked paid, and skipped.
- Skipped bills do not affect cash flow.
- Income actuals can be entered and affect forecasts.
- Setup can edit core defaults.
- Savings funds can be created and edited.
- Savings contributions and withdrawals can be entered.
- Savings withdrawals over available balance are rejected.
- Car Insurance fund accumulates `$245/month`.
- Debt accounts can be created and edited.
- Debt snapshots can be entered.
- Debt payments and extra payments can be entered.
- Debt estimated monthly interest calculates.
- Debt trend chart uses database data.
- Notes can be created and shown from database.
- Audit history shows real mutation events.
- CSV exports use database rows.
- `npm run test` passes.
- `npm run build` passes.
- Docker app, Postgres, and Adminer start successfully.

## 30. Known Technical Risks

Risks:

- Migrating from sample data to database may require adapting calculation function inputs.
- Server actions must validate auth and actor directly.
- Receipt upload metadata must not create orphaned files if transaction save fails.
- Prisma migrations may conflict with existing local `db push` state.
- Date-only handling must avoid timezone drift.
- Docker bind-mounted `.next` state can cause stale Next dev locks.
- Debt payment and bill payment links can accidentally double-count cash flow if modeled poorly.
- Savings current balance can drift if stored and derived values are both updated inconsistently.

Mitigations:

- Keep calculation functions pure and pass normalized domain objects.
- Add service mappers from Prisma rows to calculation inputs.
- Use database transactions for mutation plus audit event where practical.
- Keep `.env` secrets quoted when values include `$`.
- Continue clearing `.next/dev` in Docker startup during development.
- Model linked debt bill payments carefully and count checking outflow once.
- Prefer deriving savings balances from starting balance plus activities, or enforce a single update path if storing current balance.
