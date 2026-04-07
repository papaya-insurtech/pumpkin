# AI Challenge 06 — Policy Benefits Calculator

## Note

- You are expected to use AI coding tools (e.g., Claude Code, Cursor, GitHub Copilot) to complete this challenge.
- We evaluate your ability to decompose the problem, direct the AI tool effectively, and deliver a working solution.
- Please estimate and give us your timeline.
- If you have any issues, don't hesitate to contact us.

## Difficulty

Intermediate · 2–4 hours

## Context

When a member submits medical expenses, the insurance system must determine how much is covered based on their policy terms — annual limits, sub-limits per visit, co-pay percentages, deductibles, and waiting periods. Getting this calculation wrong means either overpaying (loss for the insurer) or underpaying (bad member experience).

## Problem

Build a calculator that takes a policy definition (JSON) and a list of medical expenses, then returns the covered amount per expense with explanations.

### Input

**Policy** — JSON defining benefits, limits, copay, waiting periods (use the structure from Challenge 05 or design your own with at least: annual limit, per-visit sub-limits, copay percentage, deductible, and waiting periods).

**Expenses** — A list of 20 medical expenses:

```json
{
  "expense_id": "EXP-001",
  "date": "2024-03-15",
  "benefit_type": "OUTPATIENT",
  "sub_benefit": "Doctor Visit",
  "amount": 2500,
  "diagnosis": "Acute bronchitis",
  "provider": "Bangkok Hospital"
}
```

Design 20 expenses that exercise all the rules: normal covered expenses, partially covered (copay), denied (waiting period), denied (exclusion), denied (limit exhausted), and partially covered (remaining limit less than expense).

### Output Per Expense

```json
{
  "expense_id": "EXP-001",
  "submitted_amount": 2500,
  "covered_amount": 2000,
  "copay_amount": 500,
  "member_pays": 500,
  "decision": "PARTIALLY_COVERED",
  "reason": "20% copay applied. Covered: 2000 THB. Member copay: 500 THB.",
  "remaining_annual_limit": 98000,
  "remaining_visit_limit": 29
}
```

## Requirements

- Handle annual limits, per-visit sub-limits, copay (percentage and fixed), deductibles, waiting periods
- Process expenses chronologically — earlier claims consume limits that affect later ones
- When an expense is denied or reduced, provide the specific reason
- Output a summary showing remaining balance per benefit after all expenses are processed
- At least 10 unit tests covering: normal coverage, copay, limit exhaustion, waiting period denial, multiple expenses consuming the same limit
- The calculator must be a reusable function/module, not a script with hardcoded data

## Evaluation Criteria

- Correct coverage calculation for all 20 test expenses
- Clear, human-readable explanation for each decision
- Handles edge cases: overlapping benefits, zero remaining balance, partial coverage
- Test coverage of core logic
- Code is modular and reusable

## Submission

- Push your project onto a GitHub repository
- Include the policy JSON, expense data, expected outputs, and test results
