# Family Budget Web App Plan

## 1. Product Goal

Build a web app that looks and feels like a budget worksheet for monthly household finances from July 2026 through December 2026.

The app is for a household using shared financial planning. It should help the users know whether each month is affordable before it starts, track actual spending during the month, plan bills, pay down credit card debt, build savings, forecast cash flow, and compare planned vs actual results.

The app should be written as a practical family finance tool, not a generic accounting system. It should prioritize clarity, worksheet-style planning, cash-flow visibility, and zero-based budgeting.

Do not include tax preparation features in version 1. A normal `Taxes` budget/savings category may exist, but there should be no tax-specific reporting, tax flags, or tax export logic.

## 2. Build Scope

### In Scope

- Web app used in a browser.
- Login with password.
- Shared household use with user labels `CS` and `TCH`.
- App opens to dashboard after login.
- Dashboard shows two months side by side.
- Budget period starts July 2026 and runs through December 2026.
- App automatically creates months from July 2026 through December 2026.
- Worksheet-style tables plus safe forms/buttons for adding and editing data.
- Desktop/tablet worksheet experience and mobile-friendly quick entry experience.
- Dark mode and light mode, with dark mode as the default.
- Zero-based budgeting.
- Daily cash-flow timeline by calendar day.
- Monthly calendar view.
- Income tracking.
- Bill tracking.
- Variable spending and transactions.
- Planned one-time expenses.
- Savings and sinking funds.
- Credit-card debt tracker.
- Reports and charts.
- CSV exports.
- Receipt uploads for spending transactions.
- Split transactions.
- Detailed audit history.
- Spouse communication thread.
- In-app reminders.
- Search and filters.
- Printable tables and reports.
- Undo option for recent changes where technically feasible.

### Out Of Scope For Version 1

- Tax preparation reports.
- Bank import.
- Bank connection.
- Email reminders.
- Text/SMS reminders.
- Separate technical architecture decisions.
- Prescribed tech stack.
- Mortgage debt tracking.
- Student loan balance tracking.
- Automatic credit card purchase balance updates.
- Debt payoff recommendations such as snowball or avalanche.
- Advanced tax tagging.

## 3. Users And Login

The app is for one household.

Use a shared household login with password. After login, the app should know which household member is acting, using labels:

- `CS`
- `TCH`

Edits should be attributed to the active user.

Both users should be treated as equal users unless a future technical design decides otherwise.

## 4. Main Navigation

The app should include these primary sections:

- Dashboard
- Cash Flow
- Calendar
- Income
- Bills
- Spending
- Savings
- Debt
- Reports
- Setup
- Notes
- Audit History

## 5. Budget Period And Month Generation

The budget starts in July 2026 and runs through December 2026.

The app should automatically create these months:

- July 2026
- August 2026
- September 2026
- October 2026
- November 2026
- December 2026

Each month must be separately editable.

Recurring income, recurring bills, recurring savings contributions, and recurring planned items should generate monthly or scheduled instances through December 2026.

Debt payoff projections may extend beyond December 2026.

Savings targets may reference obligations beyond December 2026, such as car insurance due January 30, 2027.

## 6. Rounding Rules

The app should preserve exact cents internally whenever possible, but display and calculate conservatively using rounded whole-dollar values.

Rules:

- Expenses round up to the next whole dollar.
- Income rounds down to the nearest whole dollar.
- Balances display rounded values, but exact cents should be preserved internally if possible.

Examples:

| Original Amount | Type | Display / Planning Value |
|---:|---|---:|
| $70.87 | Expense | $71 |
| $142.01 | Expense | $143 |
| $160.00 | Expense | $160 |
| $2,456.78 | Income | $2,456 |
| $5,414.69 | Balance | Display rounded, exact stored |

## 7. Starting Balances And Roll Forward Rules

July 2026 starting checking/cash-flow balance:

```text
$5,414.69
```

Each month should start from the previous month's ending projected cash balance unless the user inputs a different starting value.

All balances except checking should roll forward automatically, including:

- Savings fund balances
- Debt balances, unless manually updated
- Variable category carryovers

Checking normally rolls forward from the previous month ending projected balance, but the user can override the starting checking balance for a month.

Positive and negative budget effects should remain visible. If a month is underfunded or cash flow goes negative, the app should warn the user rather than hide the issue.

## 8. Zero-Based Budgeting

The app should support zero-based budgeting.

Monthly planning calculation:

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

Goal:

```text
Unassigned money = $0
```

Statuses:

- Balanced: unassigned money is $0.
- Needs Assignment: positive unassigned money remains.
- Underfunded: planned outflows exceed available money.
- Cash-Flow Risk: monthly plan may balance, but projected cash flow goes negative on a specific date.
- Closed: month has been marked finished.
- Needs Review: actuals are missing or bills remain unpaid.

The dashboard and monthly worksheet should clearly show zero-based status.

## 9. Dashboard

The app should open to the dashboard after login.

The dashboard should show two months side by side.

Example pairs:

- July 2026 and August 2026
- September 2026 and October 2026
- November 2026 and December 2026

Dashboard should include:

- Current selected months
- Expected income
- Expected bills
- Actual bills
- Expected spending
- Actual spending
- Money assigned
- Unassigned money
- Monthly surplus or shortfall
- Projected ending cash balance
- Month status
- Cash-flow timeline shortcut
- Category alerts when spending reaches 80% of available budget
- Negative cash-flow warning if projected balance goes below $0

Savings and debt should not appear as detailed dashboard widgets. They should have their own tabs.

## 10. Dashboard Charts

Include these chart views:

- Pie chart 1: variable spending by category.
- Pie chart 2: total outflows by major type.
- Debt trend line chart in the Debt tab.

Major outflow types for pie chart 2:

- Bills
- Spending
- Savings
- Debt

## 11. Cash Flow

Cash flow is one of the core features.

The cash-flow timeline should show every calendar day, not just activity dates.

Example:

| Date | Activity | Balance |
|---|---|---:|
| July 1 | Starting balance | $5,415 |
| July 2 | No activity | $5,415 |
| July 3 | CS paycheck | Updated balance |
| July 4 | No activity | Updated balance |

Cash flow should include:

- Income
- Bills
- Variable spending transactions
- Planned one-time expenses
- Savings contributions
- Savings withdrawals
- Credit card payments
- Debt extra payments
- Transfers between accounts

The app should warn when projected cash flow goes negative.

No minimum checking cushion is required.

Cash-flow rows should be color-coded.

Suggested colors:

- Income: green
- Bills: red
- Spending: orange or yellow
- Savings: blue
- Debt: purple or red
- Transfers: gray
- Negative balance warning: red

Cash-flow timeline should support filters such as:

- Month
- Date range
- Income
- Bills
- Spending
- Savings
- Transfers
- Debt
- Paid/unpaid
- Category
- User/editor where relevant

## 12. Accounts

The app should track:

- Main checking account
- Savings balance
- Credit cards

Accounts/cash-flow tracking should be detailed.

Savings may be mixed across different actual bank accounts. The app should track savings by goal/fund, not force every goal into a specific bank account.

Transfers between accounts should be supported. For planning purposes, transfers out of checking should affect available cash flow. Builder should clearly distinguish checking cash-flow impact from total household net cash if implemented.

## 13. Calendar

The app should include a monthly calendar view.

Calendar should be filterable.

Calendar should show:

- Income dates
- Bill due dates
- Planned expenses
- Due dates
- Savings contribution dates if scheduled
- Credit card payment due dates

## 14. Income

There are two recurring income sources:

- `CS`
- `TCH`

Both are recurring paychecks every 14 days.

Known first July 2026 paycheck dates:

- `CS`: July 3, 2026
- `TCH`: July 9, 2026

The app should auto-create paychecks every 14 days from those starting dates through December 2026.

Income details should use medium entry:

- Date
- Source
- Expected amount
- Actual amount

Optional account assignment can be supported if needed.

Income should use net take-home income only.

Do not track:

- Gross pay
- Taxes withheld
- Deductions
- Income tax categories
- Income status such as expected, received, late, or cancelled

For forecasting, use actual amount if entered. If actual amount is blank, use expected amount.

The app should support one-time income entries.

Expected paycheck amounts are builder/user setup inputs and were not finalized during planning.

## 15. Bills

The app should include a bill setup area where recurring bills are entered once and repeated through December 2026.

Each generated bill instance should be editable for a specific month.

Bill fields:

- Bill name
- Expected amount
- Actual amount
- Due date
- Paid date
- Paid yes/no checkbox
- Autopay yes/no

Do not require account paid from in version 1.

Bill cash-flow rule:

- Bills appear in cash flow on due date.
- Paid date is stored for recordkeeping.
- Unpaid bills still affect projected cash flow on due date.

Known fixed bills:

| Bill | Amount | Notes |
|---|---:|---|
| Mortgage | $4,340 | HOA included in mortgage category |
| Cell phone | $160 | Recurring |
| Internet | $70.87 | Display/planning value $71 |
| Student loans | $1,595 | Monthly bill only, not debt tracking |

Known variable bills or budget areas:

- Utilities: electric, water, gas
- Credit card payments
- Food
- Fuel

Car insurance is not a normal monthly bill. It is a sinking fund contribution of $245/month toward a six-month bill.

Bill due dates were not finalized during planning and should be user setup inputs.

## 16. Recurring Bills And Template Changes

Recurring bills should automatically repeat.

Recurring item frequencies should support custom rules. At minimum, support:

- Every 14 days
- Monthly
- Every 6 months
- Yearly
- Custom interval

Recurring items do not require an end date in version 1.

The app should allow regenerating future recurring items when setup changes.

Before changing a recurring template, the app should ask how to apply the change:

- This item only
- This month only
- This and future months
- All generated months

Generated monthly items do not need to be visibly marked as generated from a template.

If a generated item is edited for one month, the change should affect only that month unless the user chooses otherwise.

Example:

```text
Internet is normally $71.
August is manually changed to $90.
Future months still use $71 unless changed.
```

## 17. Skipped Bills

Skipped bills should be supported.

Rules:

- Hide skipped bills from normal cash flow.
- Show skipped bills in a skipped list.
- Exclude skipped bills from cash-flow calculations.
- Include skipped bills in audit history.
- Do not send/show reminders for skipped bills.

Bill reminders should ignore bills marked paid or skipped.

## 18. Bill Reminders

Bill reminders should be in-app only.

No email or SMS reminders in version 1.

Bill reminders should appear 5 days before due date.

## 19. Spending Categories

Variable spending categories should include:

- Groceries
- Restaurants
- Fuel
- Household Supplies
- Clothing
- Kids
- Entertainment
- Medical
- Gifts
- Personal Care
- School
- Transportation
- Taxes

Transportation should include gasoline separately as Fuel, plus additional transportation-related categories or subcategories such as:

- Car maintenance
- Registration
- Tolls

Known monthly budgets:

| Category | Monthly Budget |
|---|---:|
| Groceries | $1,000 |
| Restaurants | $150 |
| Fuel | $250 |
| Taxes | $20 |

Other category budgets should be user setup inputs or future planning details.

The app should allow adding, editing, renaming, disabling, and deleting categories, with delete confirmation and audit history.

## 20. Spending Transactions

The app should track individual transactions.

Transaction detail level should be detailed, without tax flags.

Transaction fields:

- Date
- Merchant
- Category
- Amount
- Planned/unplanned
- Reimbursable
- Receipt upload
- Receipt note
- Notes
- Cash-flow treatment: cash/debit or credit card

Payment method tracking is not broadly required, but the app must include enough cash-flow treatment to distinguish cash/debit from credit card.

Default transaction treatment:

- Every spending transaction is treated as cash/debit unless marked otherwise.

Cash/debit transaction:

- Counts against category budget.
- Reduces cash flow on transaction date.

Credit card transaction:

- Counts against category budget.
- Does not automatically reduce checking cash flow.
- Does not automatically update credit card debt balance.

Credit card balances are updated manually once per month by the user.

Spending transactions should affect cash flow by date when treated as cash/debit.

The spending screen should include a quick-add form.

The spending screen should show remaining budget by category.

## 21. Category Carryover

Variable category budgets should reset each month, but unused money and overspending should carry forward by category.

Example unused carryover:

```text
July grocery base budget: $1,000
July actual: $900
July unused: $100
August grocery base budget: $1,000
August available grocery budget: $1,100
```

Example overspending carryover:

```text
July fuel budget: $250
July actual: $300
July overspent: $50
August fuel base budget: $250
August available fuel budget: $200
```

Category carryover should be visible.

Each category should show:

- Base monthly budget
- Prior month carryover
- Available budget
- Actual spent
- Remaining or overage
- Carryover to next month

The app should alert when a category reaches 80% of available budget.

## 22. Planned One-Time Expenses

The app should support planned one-time expenses such as:

- Gifts
- School expenses
- Car repair
- Travel

Planned one-time expenses should:

- Have date
- Have category
- Have expected amount
- Allow actual amount
- Appear in cash flow by date
- Be markable as paid/done if implemented
- Count toward category budgets unless builder/user config says otherwise

## 23. Split Transactions

The app should support split transactions.

Rules:

- Split amounts must equal the total transaction.
- Split transaction appears as one row.
- Row can expand to show category splits.
- Cash flow subtracts the total once.
- Category reports count each split amount toward its own category.

Example:

```text
Target - $175
Expanded splits:
Groceries - $80
Household Supplies - $65
Kids - $30
```

## 24. Receipt Uploads

Receipt uploads are in scope for version 1.

Receipt uploads should attach to spending transactions.

Support image and PDF receipts if practical. If implementation constraints require narrowing scope, builder may start with image uploads and list PDFs as a future enhancement.

Receipt upload should be optional, not required.

## 25. Savings And Sinking Funds

Savings should have its own tab and should not be shown as detailed widgets on the main dashboard.

Savings tracking should be detailed.

Savings should include emergency funds and sinking funds.

Savings/sinking funds:

- Taxes
- Emergency Fund
- Car Insurance
- Car Repairs
- Vacation
- Christmas
- Back To School
- Travel
- Clothing
- Kids
- Home Repairs
- Annual Subscriptions

Savings should be tracked by goal/fund, not necessarily by bank account.

Savings fields:

- Fund name
- Fund type: Emergency or Sinking Fund
- Starting balance
- Current balance
- Target amount
- Planned contribution
- Actual contribution
- Withdrawals
- Remaining amount
- Linked future obligation if applicable

Savings balances roll forward every month.

Savings contributions should appear in cash flow.

Savings withdrawals should appear in cash flow.

Savings goals should not be allowed to go negative.

If a withdrawal exceeds available fund balance, the app should prevent it or show a blocking validation message.

Savings contributions count in monthly affordability and zero-based budgeting.

Do not include savings priority ranking.

Do not include off-track savings alerts in version 1.

## 26. Savings Goal Modes

The app should support two savings goal modes.

Mode 1: Known Due Date Fund

Used when a future obligation has a due date.

Example:

```text
Car insurance due January 30, 2027
Estimated bill: $1,400
App calculates needed monthly contribution
```

Mode 2: Open-Ended Goal

Used when there is no target date.

Example:

```text
Emergency fund target: $10,000
User chooses monthly contribution manually
```

## 27. Car Insurance Sinking Fund

Car insurance is billed every six months.

The household sets aside $245/month.

Known details:

| Item | Value |
|---|---:|
| Monthly set-aside | $245 |
| Next bill due | January 30, 2027 |
| Estimated bill | $1,400 |

The app should accumulate the fund balance month to month.

When the six-month premium is due, the bill should be paid from this fund.

Although the budget period ends December 2026, the app should still support this known January 2027 savings obligation for planning purposes.

## 28. Debt Tracker

Debt should have its own tab and should not appear as detailed widgets on the main dashboard.

Debt tracker should include credit cards only.

Do not include mortgage in debt tracking. Mortgage is a monthly housing bill only.

Do not include student loans in debt tracking. Student loans are monthly bills only.

Debt fields:

- Debt/card name
- Starting balance
- Current balance
- Interest rate
- Minimum payment
- Due date
- Actual payment
- Extra payment

Debt tracker should also calculate/show:

- Estimated monthly interest
- Total payment
- Projected payoff date
- Monthly balance trend

Credit card balances should be entered manually by the user once per month.

Do not automatically update credit card balance from spending transactions.

Do not separate old carried credit card debt from new credit card spending.

Credit card payments should appear in cash flow as bills and should also reduce the related debt balance in the debt section.

The app should support extra debt payments.

Debt payoff should be included in monthly affordability and zero-based budgeting.

Debt payoff projections may go beyond December 2026.

Interest estimate may use a simple planning formula:

```text
Estimated monthly interest = current balance * annual interest rate / 12
```

Label interest as an estimate, not an exact bank statement value.

Debt trend should be shown as a line chart.

No debt payoff recommendations are needed. The user decides manually which debt receives extra payments.

## 29. Credit Card Payments And Bills Link

Recommended behavior:

- Debt tab stores credit card debt details.
- Bills tab contains generated or linked credit card payment bills.
- Credit card payment appears in cash flow on due date.
- Payment update should reflect in both Bills and Debt if linked.

Builder should avoid double counting.

Credit card spending transactions should count against spending categories, but should not automatically reduce checking or update card balance unless marked as cash/debit or manually reflected by user balance updates.

## 30. Reports

Reports should include:

- Monthly summary
- Cash-flow timeline
- Bills list
- Spending transactions
- Planned vs actual by category
- Savings goals
- Debt balances

End-of-month planned vs actual comparison should include:

- Planned income vs actual income
- Expected bills vs actual bills
- Planned spending vs actual spending
- Category variances
- Savings planned vs actual
- Debt payment planned vs actual

Include a pie chart of total spending broken down by categories.

Include total outflow chart by major type:

- Bills
- Spending
- Savings
- Debt

## 31. CSV Exports

CSV export should include:

- Transactions
- Bills
- Monthly summary
- Cash-flow timeline
- Planned vs actual report
- Debt balances
- Savings goals

No tax summary export is required in version 1.

## 32. Month Closing

The app should support closing a month.

Closed months do not require unlocking to edit.

Once a month is closed, the actual ending values become official for reports unless edited later.

If a closed month is edited later, reports should update based on edited actual values.

Closed is a status marker, not a hard lock.

The app should have a `Close Month` or `Complete Month` action.

Builder may include a checklist before closing, but strict checklist requirements were not finalized and can be a future enhancement or configurable behavior.

## 33. Setup Checklist

The app should include a guided monthly setup checklist.

Example checklist:

- Confirm starting checking balance.
- Review CS and TCH paycheck dates and expected amounts.
- Review recurring bills.
- Review variable category budgets.
- Review savings contributions.
- Review credit card minimum payments and extra payments.
- Confirm planned one-time expenses.
- Check zero-based budget equals $0.
- Check projected cash flow for negative days.

## 34. Notes And Communication

The app should include a spouse communication thread.

Notes should not be tied to a specific month.

Example notes:

```text
CS: Please do not pay electric yet; autopay is scheduled.
TCH: Added school supply estimate for August.
```

Notes should be visible to both users.

Notes should be searchable.

Notes activity should be included in audit history if edited or deleted.

## 35. Audit History

The app should keep detailed audit history.

Audit history should show meaningful changes across:

- Income
- Bills
- Transactions
- Spending categories
- Savings
- Debt
- Month close status
- Notes
- Manual balance overrides
- Recurring template changes
- Deletes
- Skipped bills

Audit entry should include:

- Date/time
- User: `CS` or `TCH`
- Entity changed
- Field changed
- Old value
- New value
- Action type: created, updated, deleted, skipped, closed, reopened, etc.

Example:

```text
July 12, 2026 8:35 PM
CS changed Groceries transaction amount from $142.38 to $143.10.
```

Audit history should be searchable and filterable.

## 36. Search And Filters

The app should have search.

Search should cover:

- Transactions by merchant
- Bills by name
- Notes
- Audit history
- Categories where useful
- Income sources where useful

Most tables should have filters.

Useful filters:

- Month
- Date range
- Category
- Paid/unpaid
- User/editor
- Amount range
- Type
- Cash/debit vs credit card
- Skipped
- Closed/open month

## 37. Deleting And Undo

Deleting should be allowed.

Deletes should require confirmation.

Deletes should be recorded in audit history.

Implement undo for recent changes where technically feasible.

If full undo is too complex, builder should at minimum support undo for common recent actions such as accidental transaction add/edit/delete.

## 38. Printing

Tables and reports should be printable.

Printable areas should include:

- Monthly budget
- Cash-flow timeline
- Calendar
- Bills
- Transactions
- Planned vs actual report
- Savings
- Debt
- Reports

## 39. Visual Design Requirements

The app should be clear, practical, and worksheet-like.

Support both dark mode and light mode.

Dark mode should be the default.

Use intuitive status colors:

- Green: balanced/good
- Yellow: needs attention
- Red: underfunded/negative cash flow
- Blue: informational/closed

The app should work well on desktop, tablet, and mobile.

Desktop/tablet should emphasize side-by-side month planning and worksheet tables.

Mobile should emphasize quick transaction entry, dashboard status, bills due, and cash-flow warnings.

## 40. Sample Data For Testing

Include sample data using real amounts but no personal identifiers.

Allowed labels:

- `CS`
- `TCH`

Sample starting balance:

```text
Main checking starting balance July 2026: $5,414.69
```

Sample income:

```text
CS paycheck starts July 3, 2026 and repeats every 14 days.
TCH paycheck starts July 9, 2026 and repeats every 14 days.
Expected paycheck amounts should be placeholder setup values.
```

Sample bills:

| Bill | Amount |
|---|---:|
| Mortgage | $4,340 |
| Cell phone | $160 |
| Internet | $70.87 |
| Student loans | $1,595 |

Sample category budgets:

| Category | Monthly Budget |
|---|---:|
| Groceries | $1,000 |
| Restaurants | $150 |
| Fuel | $250 |
| Taxes | $20 |

Sample savings:

| Fund | Monthly Contribution | Target / Obligation |
|---|---:|---|
| Car Insurance | $245 | $1,400 due January 30, 2027 |

Do not include real bank names, account numbers, addresses, or personal names.

## 41. Validation Rules

Required validations:

- Expense amounts must be positive numbers.
- Income amounts must be positive numbers.
- Spending transaction must have a date, merchant, amount, and category.
- Split transaction category amounts must equal total transaction amount.
- Savings withdrawal cannot exceed available fund balance.
- Bill must have name, expected amount, and due date.
- Recurring template changes must ask how to apply changes.
- Delete actions must ask for confirmation.
- Skipped bills must not affect cash flow.
- Paid or skipped bills should not trigger reminders.
- Category 80% usage warning should appear when threshold is reached.
- Negative projected cash flow warning should appear when balance drops below $0.
- Zero-based budget status should be recalculated after relevant changes.

## 42. Testing Checklist

The builder should verify:

- App creates July through December 2026.
- Dashboard opens after login.
- Dashboard shows two months side by side.
- CS paychecks generate every 14 days from July 3, 2026.
- TCH paychecks generate every 14 days from July 9, 2026.
- Income uses actual amount if entered, expected amount if actual is blank.
- Expenses round up for display/planning.
- Income rounds down for display/planning.
- Exact cents are preserved internally where feasible.
- Starting balance for July is $5,414.69.
- Cash-flow timeline shows every calendar day.
- Cash-flow warning appears when projected balance is negative.
- Bills appear in cash flow on due date.
- Paid date does not change cash-flow date unless future requirements change.
- Skipped bills are excluded from cash flow and visible in skipped list.
- Category carryover works for unused funds.
- Category carryover works for overspending.
- 80% category warning appears.
- Split transaction subtracts total once from cash flow.
- Split transaction allocates category amounts correctly.
- Receipt upload attaches to transaction.
- Credit card transaction counts toward spending but does not reduce checking unless marked cash/debit.
- Credit card payment appears as bill and reduces debt if linked.
- Debt monthly interest estimate calculates.
- Debt line chart shows monthly trend.
- Savings balances roll forward.
- Savings withdrawals cannot make a fund negative.
- Car insurance sinking fund accumulates $245/month.
- Monthly planned vs actual report works.
- Spending pie chart works.
- Outflow type pie chart works.
- CSV exports produce expected data.
- Closed month status works.
- Closed month remains editable.
- Audit history records meaningful changes.
- Notes thread works.
- Search and filters work.
- In-app reminders appear 5 days before due date.
- Tables are printable.
- Dark mode loads by default.
- Light mode is available.
- Mobile quick-add transaction flow works.

## 43. Future Enhancements

Potential future enhancements:

- Exact paycheck setup wizard with real expected amounts.
- Full due-date setup for all bills.
- Default budgets for all categories not finalized in planning.
- Backup and restore.
- Download full data backup.
- Restore/import backup.
- Session timeout rules.
- Admin permissions.
- Separate user passwords.
- Bank CSV import.
- Direct bank connection.
- Email reminders.
- Text/SMS reminders.
- Mobile push notifications.
- Receipt OCR.
- Receipt PDFs if not included in version 1.
- Recurring item end dates.
- More advanced debt payoff recommendations.
- Debt snowball or debt avalanche.
- Account reconciliation.
- Advanced tax reporting.
- Tax-related transaction flags.
- Charitable giving tax summaries.
- More advanced spouse permissions.
- Import/export full app data.
- More advanced undo/recovery system.
- Technical design document in a separate `design.md`.

## 44. Builder Notes

Do not prescribe a technology stack in this plan. A separate `design.md` should define implementation architecture, framework, database, authentication approach, hosting, file storage, and technical tradeoffs.

This `plan.md` is the product and behavior specification. The technical builder or coding agent should use it to create the functional requirements, data model, UI flows, calculations, and test cases.
