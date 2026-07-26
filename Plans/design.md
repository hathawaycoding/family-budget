# Family Budget Technical Design

## 1. Purpose

This document describes the technical design for the Family Budget web app. It translates the product requirements in `Plans/plan.md` into an implementation-oriented architecture.

The app should be local-first for MVP, runnable through Docker Desktop on the user's machine, and deployable later without major restructuring.

## 2. Product Source

Primary product specification:

```text
Plans/plan.md
```

This technical design should not override product behavior from `plan.md`. If there is a conflict, treat `plan.md` as the product source and update this design accordingly.

## 3. Confirmed Stack

Use this stack for MVP:

- Framework: Next.js
- Package manager: npm
- Database: PostgreSQL
- ORM: Prisma
- Database migrations: Prisma migrations from the start
- Authentication: Auth.js credentials provider
- Styling: Tailwind CSS
- UI components: shadcn/ui
- Tables: TanStack Table
- Charts: Recharts
- Forms: React Hook Form
- Validation: Zod
- Testing: Vitest and Playwright
- Runtime: Docker Compose
- Local database admin UI: Adminer

## 4. Runtime Goals

The MVP should run locally through Docker Desktop.

Expected local URLs:

```text
App: http://localhost:3200
Adminer: http://localhost:8080
```

The app should be deployable later, but MVP design should prioritize simple local operation.

## 5. Architecture Overview

Recommended architecture:

```text
Browser
  -> Next.js App Router
  -> Server Components / Client Components
  -> Server Actions and Route Handlers
  -> Domain Services
  -> Prisma ORM
  -> PostgreSQL
```

Receipt upload flow:

```text
Browser upload
  -> Next.js upload route handler
  -> /app/uploads Docker volume
  -> Receipt metadata stored in PostgreSQL
```

CSV export flow:

```text
Browser request
  -> Export route handler
  -> Report/query service
  -> CSV response download
```

## 6. Repository Structure

Recommended structure:

```text
family-budget/
  Plans/
    plan.md
    design.md

  app/
    login/
    dashboard/
    cash-flow/
    calendar/
    income/
    bills/
    spending/
    future-expenses/
    savings/
    debt/
    reports/
    setup/
    notes/
    audit-history/
    api/

  components/
    app-shell/
    dashboard/
    tables/
    forms/
    charts/
    future-expenses/
    cash-flow/
    calendar/
    ui/

  lib/
    auth/
    db/
    services/
    calculations/
    validation/
    uploads/
    exports/
    audit/
    dates/
    money/

  prisma/
    schema.prisma
    migrations/
    seed.ts

  public/
  uploads/

  Dockerfile
  docker-compose.yml
  .dockerignore
  .gitignore
  .env.example
  package.json
  README.md
```

## 7. Docker Design

Docker Compose should include these services:

- `app`
- `postgres`
- `adminer`

The app should run on port `3200`.

Adminer should run on port `8080`.

PostgreSQL should be available to the app over the Docker network.

Suggested volumes:

- PostgreSQL data volume
- Uploads volume mounted at `/app/uploads`

The development Docker Compose flow should run Prisma migrations automatically on startup for convenience.

Also document manual migration commands in the README.

Example developer command:

```text
docker compose up --build
```

## 8. Required Docker Files

Implementation should include:

- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`
- `.env.example`

`.dockerignore` should exclude at least:

```text
node_modules
.next
.git
.env
uploads
coverage
playwright-report
test-results
```

## 9. Environment Variables

Provide `.env.example` with safe placeholder values.

Expected variables:

```text
DATABASE_URL=
AUTH_SECRET=
AUTH_URL=http://localhost:3200
UPLOAD_DIR=/app/uploads
MAX_RECEIPT_UPLOAD_MB=10
HOUSEHOLD_TIMEZONE=
```

Do not commit real `.env` files.

## 10. Git Initialization

When implementation begins, initialize Git at the project root:

```text
git init
```

Create `.gitignore` before installing dependencies or running builds.

`.gitignore` should exclude:

```text
node_modules
.next
.env
.env.local
coverage
playwright-report
test-results
uploads
*.log
```

Do not commit secrets, local database volumes, local uploads, dependency folders, or build outputs.

Do not make commits unless explicitly requested.

## 11. Authentication And Sessions

Use Auth.js credentials provider.

MVP auth flow:

```text
1. User opens app.
2. User logs in with household password.
3. User chooses active actor: CS or TCH.
4. Active actor is stored in session.
5. All mutations require authenticated session and active actor.
6. Audit logs record the active actor.
```

MVP is for one household only, but include `householdId` in major tables to reduce future migration pain.

Password must be stored as a secure hash, not plain text.

Use secure cookie/session settings appropriate for local development, with a future path to production hardening.

## 12. Routing And Pages

Use Next.js App Router.

Required pages:

- `/login`
- `/dashboard`
- `/cash-flow`
- `/calendar`
- `/income`
- `/bills`
- `/spending`
- `/future-expenses`
- `/savings`
- `/debt`
- `/reports`
- `/setup`
- `/notes`
- `/audit-history`

API/route handler areas:

- `/api/uploads/receipts`
- `/api/exports/transactions.csv`
- `/api/exports/bills.csv`
- `/api/exports/monthly-summary.csv`
- `/api/exports/cash-flow.csv`
- `/api/exports/planned-vs-actual.csv`
- `/api/exports/future-expenses.csv`
- `/api/exports/debt-balances.csv`
- `/api/exports/savings-goals.csv`

## 13. UI/UX Design System

The UI should feel like a polished financial worksheet, not a generic admin dashboard.

Use:

- Tailwind CSS for styling
- shadcn/ui for core components
- TanStack Table for worksheet-style tables
- Recharts for charts

Default theme:

```text
Dark mode
```

Also support light mode.

Status colors:

- Green: balanced/good
- Yellow: needs attention
- Red: underfunded/negative cash flow
- Blue: informational/closed

Do not rely on color alone. Pair color with icons/text/status labels.

## 14. Responsive Design

Desktop/tablet layout:

- Left sidebar navigation
- Top bar with app name, active actor, theme toggle, logout
- Two-month dashboard side by side
- Worksheet tables with sticky headers
- Summary cards near top of views

Mobile layout:

- Single-column dashboard
- Compact navigation or bottom navigation
- Prominent quick-add transaction action
- Tables become cards or horizontally scrollable grids
- Cash-flow warnings remain highly visible

Mobile and desktop should have equal priority.

### Future Expenses UI

Future Expenses should be modern, friendly, and uncluttered.

Desktop layout:

- Compact worksheet table with expandable detail rows.
- Show description, amount, due date, category, priority, status, set-aside progress, and risk badge upfront.
- Use `Review` as the primary row action.
- Put edit, convert, cancel, and complete actions in an overflow menu.

Mobile layout:

- Stacked cards with amount, due date, category, priority, and risk first.
- Keep custom schedules, recurrence details, notes, and detailed cash-flow impact behind expandable sections.

Create/edit flow:

- Use a guided form with a live impact preview panel.
- Include `Include in monthly plan preview` as a clear checkbox in the planning behavior section.
- Keep notes, recurrence details, and custom contribution schedules collapsed until needed.

Use concise badges such as:

- Fits plan
- Needs set-aside
- Low-balance risk
- Negative risk
- Funded

## 15. Accessibility Requirements

Follow basic WCAG-minded requirements:

- Keyboard navigable forms, dialogs, and menus
- Visible focus states
- Semantic buttons, links, labels, and table headers
- Sufficient color contrast in dark and light mode
- Warnings and statuses must not depend on color alone
- Form validation messages should be tied to fields
- Dialogs should trap focus correctly
- Use ARIA labels where needed
- Respect reduced motion where practical

## 16. Money Handling

Store money as integer cents.

Do not store money as floating-point values.

Examples:

```text
$70.87 -> 7087
$5,414.69 -> 541469
```

Planning/display rules:

- Expenses round up to the next whole dollar.
- Income rounds down to the nearest whole dollar.
- Balances display rounded values while preserving exact cents internally.

Recommended helper functions:

```text
toCents(input)
formatMoney(cents)
expensePlanningDollars(cents)
incomePlanningDollars(cents)
balanceDisplayDollars(cents)
```

Raw `amountCents` should remain the source of truth.

## 17. Date Handling

Use household-local date semantics.

The app is USD-only and household-local-timezone-only.

Financial dates such as paycheck dates, bill due dates, transaction dates, and budget month boundaries should behave like date-only values.

Avoid timezone drift where a stored date such as `2026-07-03` displays as a different day.

Prefer database `DATE` semantics or a strict date-only convention.

## 18. Database Schema Overview

Use Prisma with PostgreSQL.

Run Prisma migrations from the start.

Core model groups:

- Household
- HouseholdMember
- BudgetMonth
- Account
- IncomeSource
- IncomeEntry
- RecurrenceRule
- BillTemplate
- BillInstance
- SpendingCategory
- Transaction
- TransactionSplit
- ShoppingCheck
- Receipt
- PlannedExpense
- FutureExpense
- FutureExpenseContribution
- SavingsFund
- SavingsActivity
- DebtAccount
- DebtSnapshot
- DebtPayment
- Note
- AuditEvent
- Reminder
- Transfer

## 19. Core Data Models

Recommended model intent. Exact Prisma syntax can be refined during implementation.

### Household

```text
id
name
lowBalanceThresholdCents nullable
createdAt
updatedAt
```

### HouseholdMember

```text
id
householdId
label: CS | TCH
displayName
createdAt
updatedAt
```

### BudgetMonth

```text
id
householdId
year
month
startDate
endDate
startingCheckingBalanceCents
startingBalanceOverrideCents nullable
projectedEndingBalanceCents nullable
actualEndingBalanceCents nullable
status
closedAt nullable
closedByMemberId nullable
createdAt
updatedAt
```

### Account

```text
id
householdId
name
type: CHECKING | SAVINGS | CREDIT_CARD
startingBalanceCents
currentBalanceCents nullable
isActive
createdAt
updatedAt
```

## 20. Income Models

### IncomeSource

```text
id
householdId
name
defaultExpectedAmountCents nullable
recurrenceRuleId nullable
isActive
createdAt
updatedAt
```

### IncomeEntry

```text
id
householdId
budgetMonthId
incomeSourceId
date
expectedAmountCents
actualAmountCents nullable
isRecurringGenerated
recurrenceGroupId nullable
createdByMemberId
updatedByMemberId nullable
createdAt
updatedAt
```

Forecasting rule:

```text
Use actual amount if entered; otherwise use expected amount.
```

## 21. Recurrence Model

### RecurrenceRule

```text
id
householdId
frequency: DAILY | WEEKLY | EVERY_14_DAYS | MONTHLY | EVERY_6_MONTHS | YEARLY | CUSTOM
interval
dayOfMonth nullable
startDate
customRuleJson nullable
createdAt
updatedAt
```

Recurring item changes should ask how to apply the change:

- This item only
- This month only
- This and future months
- All generated months

## 22. Bill Models

### BillTemplate

```text
id
householdId
name
category
expectedAmountCents
dueDay nullable
recurrenceRuleId
isAutopay
isActive
createdAt
updatedAt
```

### BillInstance

```text
id
householdId
budgetMonthId
templateId nullable
name
category
expectedAmountCents
actualAmountCents nullable
dueDate
paidDate nullable
isPaid
isAutopay
isSkipped
createdByMemberId
updatedByMemberId nullable
createdAt
updatedAt
```

Cash-flow rule:

```text
Bills affect projected cash flow on due date.
Paid date is stored for recordkeeping.
Skipped bills do not affect cash flow.
```

## 23. Spending Models

### SpendingCategory

```text
id
householdId
name
baseMonthlyBudgetCents
isActive
sortOrder
createdAt
updatedAt
```

### Transaction

```text
id
householdId
budgetMonthId
date
merchant
totalAmountCents
cashFlowTreatment: CASH_DEBIT | CREDIT_CARD
plannedStatus: PLANNED | UNPLANNED
isReimbursable
notes nullable
receiptId nullable
createdByMemberId
updatedByMemberId nullable
createdAt
updatedAt
```

### TransactionSplit

```text
id
transactionId
categoryId
amountCents
createdAt
updatedAt
```

Use transaction splits for all transactions, even single-category transactions. A normal single-category transaction should have one split equal to the total.

Validation:

```text
Sum of splits must equal transaction total.
```

### ShoppingCheck

```text
id
householdId
budgetMonthId
date
merchant
categoryId
amountCents
cashFlowTreatment: CASH_DEBIT | CREDIT_CARD
status: DRAFT | PENDING_APPROVAL | APPROVED | WAIT_REQUESTED | CONVERTED_TO_TRANSACTION | CANCELLED | EXPIRED
requestedByMemberId
reviewedByMemberId nullable
reviewedAt nullable
requestNote nullable
reviewResponseNote nullable
convertedTransactionId nullable
createdAt
updatedAt
```

Shopping checks support both pre-purchase checks and transaction quick-add guardrail previews.

Rules:

- Shopping checks are preview/approval records until converted to transactions.
- Unconverted shopping checks should not affect official spending totals, category actuals, cash flow, or debt balances.
- Every shopping check should preview category impact.
- Cash/debit shopping checks should preview checking cash-flow impact.
- Credit-card shopping checks should not preview checking cash-flow impact and should not update debt balances.
- Warning overrides should create audit events.
- Approval requests should expire after the purchase date passes.
- Cancelled and expired checks should not convert to transactions unless the user explicitly confirms a warning override or reopens the request.

Suggested warning labels:

- Looks okay
- Near category limit
- Over category
- Low-balance risk
- Negative cash-flow risk
- Approval pending
- Wait requested
- Expired

Spouse approval behavior:

- Either household member may create a request.
- The other member may approve, request waiting, or add a response note.
- Approval does not hard-block transaction creation.
- Converting while approval is pending, wait requested, expired, or while budget/cash-flow warnings exist requires explicit confirmation.

## 24. Receipt Model

### Receipt

```text
id
householdId
transactionId nullable
originalFileName
storedFileName
mimeType
sizeBytes
storagePath
uploadedByMemberId
createdAt
```

Receipt upload constraints:

- Max file size: 10 MB
- Store under `/app/uploads`
- Store metadata in PostgreSQL
- Receipt upload is optional
- Support images and PDFs if practical for MVP

## 25. Planned Expense Model

### PlannedExpense

```text
id
householdId
budgetMonthId
date
description
categoryId
expectedAmountCents
actualAmountCents nullable
isPaid
sourceFutureExpenseId nullable
createdByMemberId
updatedByMemberId nullable
createdAt
updatedAt
```

Planned one-time expenses should appear in cash flow by date and count toward category budgets unless configured otherwise.

### FutureExpense

```text
id
householdId
budgetMonthId nullable
description
expectedAmountCents
dueDate
categoryId
priority: LOW | MEDIUM | HIGH | MUST_PAY
notes nullable
type: ONE_TIME | RECURRING
recurrenceRuleId nullable
status: DRAFT | ACTIVE | CONVERTED_TO_PLANNED_EXPENSE | CONVERTED_TO_SINKING_FUND | COMPLETED | CANCELLED
setAsideMode: EQUAL_MONTHLY | CUSTOM
includeInPlanPreview
convertedPlannedExpenseId nullable
convertedSavingsFundId nullable
createdByMemberId
updatedByMemberId nullable
createdAt
updatedAt
```

Future expenses are planning objects until converted. They should not affect official monthly budget or cash-flow totals directly.

Only active future expenses with `includeInPlanPreview = true` should participate in preview calculations.

Category is required.

When converted to a planned one-time expense, `convertedPlannedExpenseId` should reference the official planned expense that affects budget and cash flow.

When converted to a sinking fund, `convertedSavingsFundId` should reference the official savings fund. The original due-date obligation should remain visible as an obligation paid from that fund, without double counting the due-date expense against checking cash flow.

### FutureExpenseContribution

```text
id
householdId
futureExpenseId
budgetMonthId
date nullable
plannedAmountCents
createdByMemberId
updatedByMemberId nullable
createdAt
updatedAt
```

Use contribution rows for custom future expense set-aside schedules.

Equal monthly set-aside schedules do not need persisted contribution rows unless the user customizes them.

Custom contribution schedules should show scheduled total, remaining amount, and whether the future expense is funded by its due date.

## 26. Savings Models

### SavingsFund

```text
id
householdId
name
type: EMERGENCY | SINKING
mode: KNOWN_DUE_DATE | OPEN_ENDED
targetAmountCents nullable
dueDate nullable
currentBalanceCents
linkedFutureExpenseId nullable
isActive
createdAt
updatedAt
```

### SavingsActivity

```text
id
householdId
fundId
budgetMonthId
date
type: CONTRIBUTION | WITHDRAWAL
plannedAmountCents nullable
actualAmountCents nullable
description nullable
createdByMemberId
updatedByMemberId nullable
createdAt
updatedAt
```

Savings balances roll forward.

Savings funds cannot go negative.

Savings contributions and withdrawals affect cash flow.

## 27. Debt Models

### DebtAccount

```text
id
householdId
name
startingBalanceCents
currentBalanceCents
interestRatePercent
minimumPaymentCents
dueDay
isActive
createdAt
updatedAt
```

### DebtSnapshot

```text
id
householdId
debtAccountId
budgetMonthId
statementBalanceCents
interestRatePercent
minimumPaymentCents
estimatedInterestCents
createdByMemberId
createdAt
updatedAt
```

### DebtPayment

```text
id
householdId
debtAccountId
budgetMonthId
billInstanceId nullable
dueDate
minimumPaymentCents
extraPaymentCents
actualPaymentCents nullable
createdByMemberId
updatedByMemberId nullable
createdAt
updatedAt
```

Debt balances are manually updated monthly.

Debt trend should be shown as a line chart.

Estimated monthly interest:

```text
current balance * annual interest rate / 12
```

Label interest as an estimate.

## 28. Notes And Audit Models

### Note

```text
id
householdId
body
createdByMemberId
updatedByMemberId nullable
createdAt
updatedAt
deletedAt nullable
```

Notes are a household spouse communication thread and are not tied to a month.

### AuditEvent

```text
id
householdId
actorMemberId
entityType
entityId
action
fieldName nullable
oldValueJson nullable
newValueJson nullable
createdAt
```

All meaningful mutations should create audit events.

Do not rely on the UI alone to create audit events. Mutations should pass through service functions that write audit events.

## 29. Reminder Model

### Reminder

```text
id
householdId
entityType
entityId
remindOnDate
message
isDismissed
createdAt
updatedAt
```

MVP reminders are in-app only.

Bill reminders should appear 5 days before due date.

Paid or skipped bills should not trigger reminders.

## 30. Transfer Model

### Transfer

```text
id
householdId
budgetMonthId
date
fromAccountId nullable
toAccountId nullable
amountCents
description nullable
createdByMemberId
updatedByMemberId nullable
createdAt
updatedAt
```

Transfers out of checking should affect available checking cash flow.

If household total cash is shown later, distinguish checking cash-flow impact from total household net cash.

## 31. Calculation Engine

Keep financial calculations out of UI components.

Recommended modules:

```text
lib/money.ts
lib/dates.ts
lib/calculations/rounding.ts
lib/calculations/recurrence.ts
lib/calculations/cash-flow.ts
lib/calculations/zero-based-budget.ts
lib/calculations/category-carryover.ts
lib/calculations/future-expenses.ts
lib/calculations/savings.ts
lib/calculations/debt.ts
lib/calculations/reports.ts
```

Calculation functions should be unit-testable without a database where practical.

## 32. Cash-Flow Engine

Cash flow should be derived from stored financial events, not manually stored as primary state.

Inputs:

- Budget month
- Starting checking balance or override
- Income entries
- Bill instances
- Cash/debit transactions
- Cash/debit shopping checks in preview mode only
- Planned one-time expenses
- Active future expenses included in preview mode
- Savings contributions
- Savings withdrawals
- Credit card payments
- Debt extra payments
- Transfers

Daily calculation:

```text
starting balance
+ rounded-down income
- rounded-up bills due that day
- rounded-up cash/debit spending transactions
- rounded-up planned one-time expenses
- rounded-up preview future expenses when preview mode is enabled
- rounded-up savings contributions
+ rounded-down savings withdrawals
- rounded-up credit card payments
- rounded-up debt extra payments
+/- transfers
= ending daily balance
```

Credit card spending transactions:

```text
Count toward category budgets.
Do not reduce checking cash flow.
Do not update credit card balance.
```

Shopping checks:

```text
Preview category impact for all shopping checks.
Preview checking cash-flow impact only for cash/debit shopping checks.
Do not include shopping checks in official cash-flow calculations until converted to a transaction.
```

The timeline should include every calendar day.

Flag days where projected balance is below $0.

If `Household.lowBalanceThresholdCents` is set, flag days where projected checking balance is below that threshold but not negative.

Keep negative balance warnings separate and more severe than low-balance warnings.

Future expense cash-flow rules:

- Official cash-flow calculations should exclude unconverted future expenses.
- Preview cash-flow calculations should include only active future expenses with `includeInPlanPreview = true`.
- Converted planned expenses affect official cash flow through the linked `PlannedExpense`.
- Converted sinking funds affect official cash flow through savings contributions and withdrawals.
- A future expense converted to a sinking fund should keep the due-date obligation visible as paid from the linked fund, without double counting the original expense against checking cash flow.

## 33. Zero-Based Budget Engine

Monthly calculation:

```text
Income
- Bills
- Variable spending budgets
- Planned one-time expenses
- Savings contributions
- Credit card minimum payments
- Credit card extra payments
= Unassigned money / Shortfall
```

Statuses:

- Balanced
- Needs Assignment
- Underfunded
- Cash-Flow Risk
- Closed
- Needs Review

Zero-based status should recalculate after relevant data changes.

Future expense zero-based rules:

- Official zero-based calculations should exclude unconverted future expenses.
- Preview zero-based calculations should include active future expenses with `includeInPlanPreview = true`.
- Converted planned expenses should count through the linked `PlannedExpense`.
- Converted sinking funds should count through linked savings contributions.

## 33.1 Future Expense Planning Engine

Future expense calculations should live outside UI components.

Recommended functions:

```text
calculateFutureExpenseAffordabilityPreview
calculateFutureExpenseCashFlowRisk
calculateEqualMonthlySetAside
calculateCustomSetAsideProgress
projectRecurringFutureExpenses
```

Equal monthly set-aside:

```text
ceil(expected amount / available monthly periods)
```

Custom set-aside progress:

```text
scheduled total = sum planned contribution rows
remaining amount = expected amount - scheduled total
```

If the custom schedule does not fully fund the expense by the due date, show a warning.

Preview calculations should not mutate stored budget months, planned expenses, savings funds, or cash-flow state.

## 33.2 Shopping Guardrail Engine

Shopping Guardrail calculations should live outside UI components and should reuse the category carryover and cash-flow calculation behavior where practical.

Recommended functions:

```text
calculateShoppingGuardrailPreview
calculateShoppingCategoryImpact
calculateShoppingCashFlowImpact
expireShoppingChecksAfterPurchaseDate
```

Preview behavior:

- Category impact applies to cash/debit and credit-card checks.
- Cash-flow impact applies only to cash/debit checks.
- Credit-card checks should not reduce checking cash flow and should not update credit card debt.
- Low-balance warnings should require `Household.lowBalanceThresholdCents`.
- Negative cash-flow warnings should not require a low-balance threshold.
- Preview calculations should not mutate official transactions, category actuals, debt balances, or cash-flow state.

Expiration behavior:

- A pending or draft shopping check should be treated as expired after its purchase date passes.
- Expiration may be calculated lazily during reads or persisted through a scheduled/manual maintenance action.
- If persisted, expiration should create an audit event.
- Manual cancellation should create an audit event.

## 34. Category Carryover Engine

Each category should track:

- Base monthly budget
- Prior month carryover
- Available budget
- Actual spent
- Remaining or overage
- Carryover to next month

Unused money rolls forward.

Overspending rolls forward as a reduction to next month's available budget.

Alert when a category reaches 80% of available budget.

## 35. Recurrence Engine

Required recurrence behavior:

- Generate July 2026 through December 2026 budget months.
- Generate CS paychecks every 14 days starting July 3, 2026.
- Generate TCH paychecks every 14 days starting July 9, 2026.
- Generate recurring bills through December 2026.
- Support custom recurrence rules.

Generated item edits should affect only that item unless the user chooses otherwise.

Recurring template changes should prompt for scope.

## 36. Server Actions And API Routes

Use server actions for normal form mutations where practical.

Suggested server actions:

```text
createIncomeEntry
updateIncomeEntry
createBillTemplate
updateBillTemplate
createBillInstance
updateBillInstance
markBillPaid
skipBill
createTransaction
updateTransaction
deleteTransaction
createShoppingCheck
updateShoppingCheck
requestShoppingApproval
respondToShoppingCheck
cancelShoppingCheck
convertShoppingCheckToTransaction
confirmShoppingWarningOverride
expireShoppingChecks
createFutureExpense
updateFutureExpense
deleteFutureExpense
cancelFutureExpense
completeFutureExpense
convertFutureExpenseToPlannedExpense
convertFutureExpenseToSinkingFund
createFutureExpenseContribution
updateFutureExpenseContribution
deleteFutureExpenseContribution
createSavingsActivity
updateSavingsActivity
createDebtSnapshot
createDebtPayment
closeMonth
createNote
updateNote
deleteNote
```

Use route handlers for uploads and CSV exports:

```text
POST /api/uploads/receipts
GET /api/exports/transactions.csv
GET /api/exports/bills.csv
GET /api/exports/monthly-summary.csv
GET /api/exports/cash-flow.csv
GET /api/exports/planned-vs-actual.csv
GET /api/exports/future-expenses.csv
GET /api/exports/debt-balances.csv
GET /api/exports/savings-goals.csv
```

Every mutation must validate input and create audit history.

## 37. Validation Rules

Use Zod schemas for server-side validation.

Client-side validation should improve UX but must not replace server-side validation.

Required rules:

- Expense amounts must be positive.
- Income amounts must be positive.
- Transaction requires date, merchant, amount, and category/splits.
- Split transaction split total must equal transaction total.
- Shopping check requires date, merchant, positive amount, category, and cash-flow treatment.
- Shopping check conversion with warnings requires explicit confirmation.
- Shopping approval requests expire after the purchase date passes.
- Future expense requires description, positive expected amount, due date, category, and priority.
- Recurring future expense requires a recurrence rule.
- Future expense custom contribution rows require positive amount and valid month or date.
- Converted future expenses must not be converted again unless explicitly reset.
- Savings withdrawal cannot exceed available fund balance.
- Bill requires name, expected amount, and due date.
- Delete actions require confirmation.
- Skipped bills must not affect cash flow.
- Paid/skipped bills should not trigger reminders.
- Receipt uploads must respect max file size of 10 MB.
- Receipt upload file type must be allowed.
- Zero-based budget status should recalculate after relevant mutations.

## 38. CSV Exports

CSV exports required:

- Transactions
- Bills
- Monthly summary
- Cash-flow timeline
- Planned vs actual report
- Future expenses
- Debt balances
- Savings goals

Exports should be generated server-side.

Exports should respect household scope.

## 39. Charts And Reports

Use Recharts.

Required charts:

- Spending by category pie chart
- Total outflows by type pie chart
- Debt trend line chart

Reports should derive from the same calculation services used by the dashboard where possible.

## 40. Testing Strategy

Use Vitest for unit/integration tests.

Use Playwright for E2E tests.

Unit tests:

- Money rounding
- Cash-flow calculation
- Zero-based budget calculation
- Category carryover
- Recurrence generation
- Savings withdrawal validation
- Debt interest estimate
- Split transaction validation
- Shopping Guardrail preview and warning confirmation
- Future expense validation
- Future expense set-aside calculations
- Future expense preview affordability and cash-flow risk

Integration tests:

- Generate budget months
- Generate recurring paychecks
- Generate recurring bills
- Create transaction with receipt metadata
- Create and convert future expense
- Create audit event on mutation
- CSV export generation
- Month close

E2E tests:

- Login
- Select active actor
- Dashboard loads
- Add transaction
- Create Shopping Guardrail request and convert it to a transaction
- Add split transaction
- Add future expense and review preview impact
- Mark bill paid
- View negative cash-flow warning
- Export CSV

## 41. Performance Targets

Reasonable local performance targets:

- Dashboard should load in under 1 second with normal household data on a typical machine.
- Cash-flow calculation for one month should feel instant.
- Tables should handle several thousand transactions without becoming unusable.
- CSV exports should complete within a few seconds for household-scale data.
- Receipt uploads up to 10 MB should complete reliably locally.

Use pagination, filtering, server queries, and memoized/pure calculations where appropriate.

## 42. Seed Data

Seed data should be inserted through a manual seed command, not automatically during normal app startup.

Document seed usage in README.

Seed should create:

- One household
- Members `CS` and `TCH`
- Budget months July through December 2026
- Starting July checking balance of $5,414.69
- Income sources `CS` and `TCH`
- Recurring paycheck schedules
- Known bills
- Spending categories
- Known category budgets
- Car insurance sinking fund
- Example credit card debt data using generic card labels

Do not include personal identifiers, real bank names, account numbers, addresses, or real names.

## 43. Implementation Phases

### Phase 1: Project Foundation

- Initialize Git.
- Scaffold Next.js app with npm.
- Add Tailwind CSS and shadcn/ui.
- Add linting and formatting.
- Add Dockerfile, docker-compose.yml, .dockerignore, .gitignore, and .env.example.
- Add README local setup instructions.

### Phase 2: Database And Auth

- Add PostgreSQL service.
- Add Prisma.
- Create initial schema and migrations.
- Add seed script.
- Add Auth.js credentials login.
- Add actor selection for `CS` and `TCH`.

### Phase 3: App Shell And UI System

- Build responsive app shell.
- Add sidebar/topbar navigation.
- Add dark/light theme support with dark as default.
- Add core cards, tables, badges, dialogs, forms, and empty states.

### Phase 4: Budget Months, Income, And Bills

- Generate July through December 2026.
- Build income setup and entries.
- Generate CS/TCH recurring paychecks.
- Build bill templates and bill instances.
- Implement paid/skipped bill behavior.
- Add in-app bill reminders.

### Phase 5: Cash Flow And Dashboard

- Implement money/date helpers.
- Implement cash-flow engine.
- Implement zero-based budget engine.
- Build two-month dashboard.
- Build daily cash-flow timeline.
- Add negative balance warnings.

### Phase 6: Spending

- Add spending categories.
- Add transaction quick-add.
- Add Shopping Guardrail pre-purchase check and quick-add warning preview.
- Add spouse approval request, response, cancellation, expiration, and conversion flows.
- Add split transactions.
- Add category carryover.
- Add 80% category alerts.
- Add receipt upload.

### Phase 6.1: Future Expense Planning

- Add future expense and contribution schedule models.
- Add future expense validation schemas.
- Add future expense calculation helpers for affordability preview, cash-flow risk, equal monthly set-aside, custom set-aside progress, and recurring projections.
- Add server actions for create, update, cancel, complete, delete, and conversion flows.
- Build `/future-expenses` page with uncluttered desktop table and mobile card layouts.
- Add guided create/edit form with `Include in monthly plan preview` and live impact preview.
- Add conversion to planned one-time expense.
- Add conversion to sinking fund while keeping the due-date obligation visible as paid from the fund.
- Add future expenses to dashboard, calendar, cash-flow preview, setup checklist, reports, exports, and audit history.
- Add tests for validation, set-aside calculations, preview behavior, cash-flow risk, conversion, and double-count prevention.

### Phase 7: Savings

- Add savings funds.
- Add savings activities.
- Add savings roll-forward logic.
- Add car insurance sinking fund behavior.
- Prevent negative savings fund balances.

### Phase 8: Debt

- Add credit card debt accounts.
- Add monthly debt snapshots.
- Add debt payments.
- Add estimated interest.
- Add payoff projection.
- Add debt trend line chart.

### Phase 9: Reports And Exports

- Add planned vs actual report.
- Add spending pie chart.
- Add outflow type pie chart.
- Add CSV exports.
- Add printable report/table styles.

### Phase 10: Collaboration And Audit

- Add notes thread.
- Add detailed audit history.
- Add search and filters.
- Add undo for recent common actions where feasible.

### Phase 11: Mobile, Accessibility, And Polish

- Improve mobile quick-add flow.
- Ensure responsive tables/cards.
- Add accessibility pass.
- Add performance checks.
- Complete tests.

## 44. Future Technical Enhancements

- Multi-household UI and permissions.
- Separate user passwords.
- Admin roles.
- Production deployment design.
- Cloud object storage for receipts.
- Bank CSV import.
- Direct bank integrations.
- Email reminders.
- SMS reminders.
- Push notifications.
- Receipt OCR.
- Advanced debt payoff recommendations.
- Full backup and restore.
- Account reconciliation.
- Advanced audit recovery/undo.
- More formal accounting accuracy mode.
