# AI Challenge 09 — Claims Analytics Dashboard

## Note

- You are expected to use AI coding tools (e.g., Claude Code, Cursor, GitHub Copilot) to complete this challenge.
- We evaluate your ability to decompose the problem, direct the AI tool effectively, and deliver a working solution.
- Please estimate and give us your timeline.
- If you have any issues, don't hesitate to contact us.

## Difficulty

Intermediate · 3–5 hours

## Context

An insurance operations team needs visibility into claims performance. They currently export CSVs and build Excel reports manually. They need an interactive dashboard that updates as new data comes in.

## Problem

Build an interactive claims analytics dashboard from a generated dataset.

## Dataset

Generate a CSV dataset of 5,000 claims with these columns:

| Column | Type | Notes |
|--------|------|-------|
| claim_id | string | CLM-NNNNN |
| policy_id | string | POL-NNNNN |
| member_name | string | Realistic names |
| claim_type | enum | OUTPATIENT, INPATIENT, DENTAL, MATERNITY |
| diagnosis_icd10 | string | Use 20 common ICD-10 codes |
| submitted_amount | number | Range: 500–2,000,000 (skewed: most small, few large) |
| approved_amount | number | 0 for rejected, ≤ submitted for others |
| status | enum | APPROVED, REJECTED, PENDING, IN_REVIEW |
| submitted_date | date | Spread across 12 months (2024) |
| processed_date | date | 1–30 days after submitted_date (null for PENDING) |
| assessor | string | 5 assessor names |
| insurer | string | 3 insurer names |
| country | string | Thailand, Vietnam, Hong Kong |

Ensure the data has realistic distributions — most claims are outpatient, rejection rate ~15%, average processing time ~7 days.

## Requirements

### KPI Cards (top of dashboard)
- Total claims count
- Approval rate (%)
- Average processing time (days)
- Total approved amount
- Average claim amount

### Charts
- Claims by status (pie/donut chart)
- Claims over time (line chart, groupable by week or month)
- Top 10 diagnoses by frequency (horizontal bar chart)
- Top 10 diagnoses by total cost (horizontal bar chart)
- Processing time distribution (histogram)
- Approval rate by insurer (grouped bar chart)

### Interactivity
- Global filters: date range, claim type, insurer, country, status
- All filters apply to all KPIs and charts simultaneously
- Click a diagnosis bar → show all claims for that diagnosis in a table below
- Hover on chart elements → show tooltip with exact values

### Data Table
- Sortable, paginated table of individual claims
- Responds to all active filters
- Export filtered data as CSV

## Evaluation Criteria

- All KPI calculations are correct
- Charts are readable with proper labels, legends, and tooltips
- Filters work across all visualizations simultaneously
- Drill-down from chart to table works correctly
- Dashboard loads in < 3 seconds
- Responsive layout (desktop + tablet)

## Submission

- Push your project onto a GitHub repository
- Deploy to any free hosting and provide a live URL
- Include the generated dataset in the repository
