# AI Challenge 01 — Insurance Plan Comparison Page

## Note

- You are expected to use AI coding tools (e.g., Claude Code, Cursor, GitHub Copilot) to complete this challenge.
- We evaluate your ability to decompose the problem, direct the AI tool effectively, and deliver a working solution.
- Please estimate and give us your timeline.
- If you have any issues, don't hesitate to contact us.

## Difficulty

Beginner · 2–3 hours

## Context

Insurance companies offer multiple plan tiers with different coverage levels, limits, and pricing. Prospective members need to compare plans side by side to make informed decisions.

## Problem

Build a web page that displays 3 insurance plans in a side-by-side comparison table.

Use the following plan data:

```json
[
  {
    "name": "Bronze",
    "monthly_premium": 150,
    "annual_limit": 500000,
    "benefits": {
      "outpatient": { "limit_per_visit": 3000, "visits_per_year": 30 },
      "inpatient": { "limit_per_day": 10000, "days_per_year": 60 },
      "dental": null,
      "maternity": null
    },
    "copay_percentage": 20,
    "waiting_period_days": 30,
    "highlights": ["Basic coverage", "No dental or maternity"]
  },
  {
    "name": "Silver",
    "monthly_premium": 350,
    "annual_limit": 1500000,
    "benefits": {
      "outpatient": { "limit_per_visit": 5000, "visits_per_year": 60 },
      "inpatient": { "limit_per_day": 25000, "days_per_year": 120 },
      "dental": { "limit_per_year": 30000 },
      "maternity": null
    },
    "copay_percentage": 10,
    "waiting_period_days": 15,
    "highlights": ["Includes dental", "Lower copay", "Higher limits"]
  },
  {
    "name": "Gold",
    "monthly_premium": 700,
    "annual_limit": 5000000,
    "benefits": {
      "outpatient": { "limit_per_visit": 10000, "visits_per_year": -1 },
      "inpatient": { "limit_per_day": 50000, "days_per_year": -1 },
      "dental": { "limit_per_year": 100000 },
      "maternity": { "limit_per_pregnancy": 200000 }
    },
    "copay_percentage": 0,
    "waiting_period_days": 0,
    "highlights": ["Full coverage", "No copay", "No waiting period", "Unlimited visits"]
  }
]
```

Note: `-1` means unlimited.

## Requirements

- Side-by-side comparison table showing all benefits, limits, and pricing
- Visual indicators for included vs not included benefits
- Highlight the best value in each row (e.g., highest limit, lowest copay)
- A "Recommended" badge on one plan based on value-for-money ratio
- Responsive layout — stacks vertically on mobile
- Clean, professional design

## Evaluation Criteria

- Correct data rendering with no missing or incorrect values
- Visual clarity — a non-technical person can understand the comparison at a glance
- Responsive design that works on desktop and mobile
- Code organization and cleanliness

## Submission

- Push your project onto a GitHub repository
- Deploy to any free hosting and provide a live URL
