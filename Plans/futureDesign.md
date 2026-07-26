# Future Design Goals

## 1. Purpose

This document captures future product and technical goals that extend the family budget app beyond the core MVP described in `Plans/plan.md` and `Plans/design.md`.

These goals should not override the product source of truth in `Plans/plan.md`. If promoted into MVP scope later, the relevant requirements should be added to `Plans/plan.md` first and then reflected in `Plans/design.md`.

## 2. Low Balance Forecasting

The app should help the household see low-balance risk before it happens, not only after projected cash flow goes negative.

The app should not assume a default low-balance threshold. The household should enter its own threshold during setup.

The threshold represents the checking-account cushion where the household wants warnings to begin. It applies only to projected checking cash flow, not savings funds or total household net worth.

If no low-balance threshold has been entered, low-balance warnings should remain inactive. Negative balance warnings should still appear because they do not depend on the threshold.

Future behavior:

- Ask the household to enter its own low-balance warning threshold during setup.
- Do not assume a default threshold.
- Explain that the threshold is the checking-account cushion where warnings begin.
- Allow the threshold to be changed later in Setup.
- Keep low-balance forecasting inactive until a threshold is entered.
- Continue showing negative balance warnings even if no low-balance threshold is configured.
- Forecast checking balance day by day using known and planned financial events.
- Show the earliest date when projected checking balance falls below the configured threshold.
- Show the lowest projected balance in the selected month or date range.
- Identify major upcoming events contributing to the low-balance risk.
- Show low-balance warnings on the dashboard, cash-flow timeline, calendar, and mobile summary.
- Keep negative balance warnings separate and more severe than low-balance warnings.

Suggested setup prompt:

```text
What checking balance feels too low for your household?

We will warn you when your projected checking balance drops below this amount.
This does not include savings funds.
```

Example:

```text
Low balance risk:
August 14, 2026
Projected balance: $312
Threshold: $500
Main causes: Mortgage, groceries budget, student loans
```

## 3. Future Expense Planning

Status: promoted into MVP scope. The source of truth for this feature is now `Plans/plan.md`, with implementation guidance in `Plans/design.md`.

The app should make it easy to plan for upcoming expenses before they become urgent.

Future behavior:

- Add a future expense planning flow.
- Track expected amount, due date, category, priority, and notes.
- Require a category.
- Support one-time and recurring future expenses.
- Support an `Include in monthly plan preview` option per future expense.
- Show whether a future expense fits in the monthly plan.
- Show whether the expense creates a low-balance or negative-balance risk.
- If the expense is not affordable immediately, calculate a suggested monthly set-aside.
- Support both equal monthly set-asides and custom contribution schedules.
- Allow converting a future expense into a planned one-time expense or sinking fund.
- When converted to a sinking fund, keep the original due-date expense visible as an obligation paid from that fund.
- Keep the UI modern, friendly, and uncluttered by showing key status first and hiding detailed calculations behind review/expand controls.
- Show future expenses in the calendar, cash-flow timeline, setup checklist, and relevant reports.

Example:

```text
School supplies
Due: August 5, 2026
Expected amount: $450
Impact: Projected balance drops to $214 on August 6
Suggested set-aside: $225/month for 2 months
```

## 4. Shopping App Popup / Shopping Guardrail

The household wants the app to help interrupt or warn before spending inside shopping apps or shopping websites.

This goal has platform constraints.

Possible approaches:

- Browser extension: Detect shopping websites such as Amazon, Target, Walmart, or grocery sites and show a budget reminder overlay.
- Android companion app: Potentially detect when selected shopping apps are opened and show a warning or quick budget check, depending on Android permissions.
- iOS companion app: Limited, because iOS generally does not allow arbitrary popups over other apps.
- MVP fallback: Add an in-app `Shopping Check` screen, mobile shortcut, or installable PWA entry point that shows remaining category budgets before shopping.

Future behavior:

- Let the user define shopping merchants, websites, or app names to watch.
- Let the user choose which budget categories are relevant for each merchant.
- Show remaining budget before shopping.
- Show active low-balance warnings before shopping.
- Provide quick actions such as `Log Purchase`, `View Groceries Budget`, or `Dismiss`.
- Avoid storing sensitive browsing or app usage history unless explicitly needed.
- Make privacy behavior clear to the household.

Example:

```text
Before shopping at Target:
Groceries remaining: $184
Household Supplies remaining: $62
Kids remaining: $40
Projected low-balance risk: August 14
```

## 5. Recommended Implementation Order

Recommended future phases:

1. Add a setup prompt for the household's low-balance threshold.
2. Store the user-entered threshold.
3. Add low-balance forecasting warnings after a threshold exists.
4. Add future expense planner and affordability checks. This has been promoted into MVP scope and should be implemented from `Plans/plan.md` and `Plans/design.md`.
5. Add mobile `Shopping Check` screen or PWA shortcut.
6. Consider browser extension support for shopping websites.
7. Consider Android companion support if native app detection is still desired.
8. Treat iOS native app popup support as limited unless platform capabilities change.
