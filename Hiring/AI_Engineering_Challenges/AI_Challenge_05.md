# AI Challenge 05 — Policy Summary Generator

## Note

- You are expected to use AI coding tools (e.g., Claude Code, Cursor, GitHub Copilot) to complete this challenge.
- We evaluate your ability to decompose the problem, direct the AI tool effectively, and deliver a working solution.
- Please estimate and give us your timeline.
- If you have any issues, don't hesitate to contact us.

## Difficulty

Beginner · 2–4 hours

## Context

Insurance policies are complex legal documents with nested benefit structures, exclusions, and conditions. Members need a clear, readable summary of what they're covered for — not a wall of legal text.

## Problem

Build a tool that takes a policy JSON and generates a well-formatted, human-readable summary page (HTML or PDF).

### Sample Policy Data

```json
{
  "policy_number": "POL-2024-TH-00789",
  "policyholder": {
    "name": "Acme Corporation Ltd.",
    "type": "CORPORATE",
    "industry": "Technology",
    "employee_count": 250
  },
  "plan": {
    "name": "Corporate Health Plus",
    "tier": "Gold",
    "effective_date": "2024-01-01",
    "expiry_date": "2024-12-31",
    "currency": "THB"
  },
  "members": {
    "total": 250,
    "employee": 250,
    "dependent_spouse": 180,
    "dependent_child": 320
  },
  "benefits": [
    {
      "type": "INPATIENT",
      "annual_limit": 2000000,
      "sub_benefits": [
        { "name": "Room & Board", "limit_per_day": 8000, "max_days": 120 },
        { "name": "ICU", "limit_per_day": 16000, "max_days": 30 },
        { "name": "Surgery", "limit_per_event": 500000 },
        { "name": "Ambulance", "limit_per_event": 5000 }
      ]
    },
    {
      "type": "OUTPATIENT",
      "annual_limit": 100000,
      "sub_benefits": [
        { "name": "Doctor Visit", "limit_per_visit": 3000, "visits_per_year": 30 },
        { "name": "Prescribed Medicine", "limit_per_visit": 3000 },
        { "name": "Diagnostic Tests", "limit_per_year": 20000 }
      ]
    },
    {
      "type": "DENTAL",
      "annual_limit": 30000,
      "waiting_period_days": 90,
      "sub_benefits": [
        { "name": "Basic Dental", "limit_per_year": 20000 },
        { "name": "Major Dental", "limit_per_year": 10000 }
      ]
    },
    {
      "type": "MATERNITY",
      "lifetime_limit": 200000,
      "waiting_period_days": 270,
      "sub_benefits": [
        { "name": "Normal Delivery", "limit_per_event": 100000 },
        { "name": "C-Section", "limit_per_event": 200000 },
        { "name": "Prenatal Care", "limit_per_pregnancy": 30000 }
      ]
    }
  ],
  "exclusions": [
    "Pre-existing conditions within first 12 months",
    "Cosmetic surgery and elective procedures",
    "Self-inflicted injuries",
    "Injuries from extreme sports without prior declaration",
    "Treatment outside network hospitals without pre-authorization"
  ],
  "copay": {
    "outpatient": { "percentage": 20, "max_per_visit": 500 },
    "inpatient": { "percentage": 0 },
    "dental": { "percentage": 30 }
  },
  "network": {
    "type": "PREFERRED_PROVIDER",
    "hospital_count": 450,
    "countries": ["Thailand", "Singapore", "Malaysia"]
  }
}
```

## Requirements

- Generate a formatted summary page with clear sections:
  - Policy overview (number, holder, plan, dates)
  - Member count breakdown
  - Benefits table with limits, organized by type
  - Copay schedule
  - Waiting periods (highlighted for benefits that have them)
  - Exclusions list
  - Network information
- Amounts should be formatted with currency symbol and thousand separators
- Waiting periods and exclusions should be visually distinct (e.g., warning styling)
- Include a "quick reference" card at the top with the most important numbers (total annual limit, copay rates, number of benefits)
- The tool should work with any policy JSON matching this schema — not hardcoded to this example
- Provide at least 2 different policy JSONs to demonstrate flexibility

## Evaluation Criteria

- Summary is easy to read and well-structured
- All data from the JSON is represented accurately
- Formatting is consistent (currency, dates, numbers)
- Works with different policy shapes (different benefit types, different copay structures)
- Design is professional enough to share with a client

## Submission

- Push your project onto a GitHub repository
- Deploy to any free hosting and provide a live URL
