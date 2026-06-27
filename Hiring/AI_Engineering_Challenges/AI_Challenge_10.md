# AI Challenge 10 — Fraud Detection Scoring Engine

## Note

- You are expected to use AI coding tools (e.g., Claude Code, Cursor, GitHub Copilot) to complete this challenge.
- We evaluate your ability to decompose the problem, direct the AI tool effectively, and deliver a working solution.
- Please estimate and give us your timeline.
- If you have any issues, don't hesitate to contact us.

## Difficulty

Advanced · 4–6 hours

## Context

Insurance fraud costs the industry billions annually. Common patterns include duplicate claims, billing for services not rendered, upcoding (billing for more expensive procedures than performed), and provider-member collusion. Catching fraud early saves money and protects honest members.

## Problem

Build a rule-based fraud scoring engine that analyzes claims and assigns a risk score (0–100) with itemized evidence for each flagged rule.

## Dataset

Generate a dataset of 2,000 claims with these columns:

| Column | Type | Notes |
|--------|------|-------|
| claim_id | string | Unique |
| member_id | string | ~500 unique members |
| provider_id | string | ~50 unique providers |
| provider_name | string | Hospital/clinic name |
| claim_date | date | 2024-01-01 to 2024-12-31 |
| claim_type | string | OUTPATIENT, INPATIENT, DENTAL |
| diagnosis_code | string | ICD-10 code |
| procedure_codes | string[] | List of procedure codes |
| submitted_amount | number | Varies by procedure |
| is_weekend | boolean | Derived from claim_date |

Intentionally embed ~200 fraudulent claims (~10%) with these patterns:
- 30 duplicate claims (same member, provider, date, diagnosis)
- 30 rapid re-submissions (same member, same diagnosis within 7 days)
- 30 upcoded claims (amount > 2 standard deviations above mean for that procedure)
- 25 unbundled claims (individual procedures that should be a single bundled code)
- 25 phantom billing (providers with > 30 claims in a single day)
- 20 weekend surgical anomalies (surgical procedures on weekends from providers who never operate on weekends)
- 20 diagnosis-procedure mismatches
- 20 amount clustering (amounts just below the 50,000 auto-approval threshold)

## Requirements

### Detection Rules

Implement all 8 rules:

1. **Duplicate claim** — same member + provider + date + diagnosis
2. **Rapid re-submission** — same member + same diagnosis within 7 days
3. **Upcoding** — amount > 2 standard deviations above mean for that procedure code
4. **Unbundling** — multiple individual procedures when a bundled code exists (provide a mapping of at least 5 bundles)
5. **Phantom billing** — provider submits > 30 claims in a single day
6. **Weekend anomaly** — surgical procedures on weekends from providers with < 5% historical weekend volume
7. **Diagnosis-procedure mismatch** — procedure not clinically associated with diagnosis (provide a mapping of at least 10 valid diagnosis-procedure pairs)
8. **Amount clustering** — claim amounts within 5% below the 50,000 auto-approval threshold (47,500–49,999)

### Output Per Claim

```json
{
  "claim_id": "CLM-00123",
  "risk_score": 78,
  "flags": [
    {
      "rule": "upcoding",
      "severity": 4,
      "evidence": "Submitted amount 85,000 for procedure P-1234 is 2.8 standard deviations above the mean of 32,000"
    },
    {
      "rule": "amount_clustering",
      "severity": 2,
      "evidence": "Amount 49,500 is 99% of the 50,000 auto-approval threshold"
    }
  ]
}
```

### Scoring
- Each rule has a configurable severity weight (1–5)
- Composite score = weighted sum of triggered rules, normalized to 0–100
- Output ranked list of claims by risk score

### Metrics
- Report precision and recall against the known fraudulent claims
- Target: ≥ 70% recall with ≤ 20% false positive rate

## Evaluation Criteria

- All 8 rules implemented correctly
- Each flag includes specific, actionable evidence (not just "flagged by rule 3")
- Scoring weights are justified (explain why certain rules are weighted higher)
- Metrics meet the recall/FPR targets
- At least 15 unit tests covering individual rules and edge cases
- Processing 2,000 claims completes in < 30 seconds

## Submission

- Push your project onto a GitHub repository
- Include the dataset, scored output, and metrics report
