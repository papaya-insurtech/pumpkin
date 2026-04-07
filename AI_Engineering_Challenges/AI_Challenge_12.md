# AI Challenge 12 — Multi-Country Regulatory Rule Engine

## Note

- You are expected to use AI coding tools (e.g., Claude Code, Cursor, GitHub Copilot) to complete this challenge.
- We evaluate your ability to decompose the problem, direct the AI tool effectively, and deliver a working solution.
- Please estimate and give us your timeline.
- If you have any issues, don't hesitate to contact us.

## Difficulty

Advanced · 4–6 hours

## Context

Insurance is heavily regulated, and rules differ by country. A claim valid in Thailand may be denied in Vietnam due to different regulatory requirements — different mandatory documents, coverage mandates, processing SLAs, and data privacy rules. The platform must enforce country-specific rules without hardcoding them.

## Problem

Build a configurable regulatory rule engine where country-specific rules are defined as configuration (not code), and the engine validates claims against the active country's ruleset.

## Rules to Implement

Define rules for 3 countries. Research or design realistic regulatory differences:

### Thailand
- Required documents: medical receipt (all), discharge summary (inpatient), prescription (outpatient)
- Processing SLA: 15 business days for outpatient, 30 business days for inpatient
- Waiting period: 30 days for general, 120 days for pre-existing conditions
- Data masking: national ID must be partially masked in reports (show last 4 digits only)
- Coverage mandate: emergency treatment must be covered regardless of network

### Vietnam
- Required documents: medical receipt (all), hospital certificate (inpatient), ID card copy (all)
- Processing SLA: 10 business days for all claim types
- Waiting period: 30 days for general, 365 days for pre-existing conditions
- Data masking: full name must be masked in external reports (show first/last initial only)
- Coverage mandate: maternity must be covered for policies > 12 months

### Hong Kong
- Required documents: medical receipt (all), referral letter (specialist), discharge summary (inpatient)
- Processing SLA: 20 business days for all claim types
- Waiting period: 60 days for general, 180 days for pre-existing conditions
- Data masking: HKID must be masked (show first letter + last digit only)
- Coverage mandate: mental health must be covered at the same level as physical health

## Requirements

### Configuration Format
- Rules are defined in JSON or YAML config files — one file per country
- Adding a new country means adding a new config file with zero code changes
- Each rule has: rule_id, description, rule_type, parameters, effective_date, expiry_date (optional)

### Rule Engine
- Validate a claim against the rules for its country
- Return per-rule results: pass/fail, explanation of failure, remediation action
- Return overall compliance status: COMPLIANT, NON_COMPLIANT, PARTIALLY_COMPLIANT
- Support rule types: document_requirement, sla_check, waiting_period, data_masking, coverage_mandate

### Test Claims
- Create 15 claims (5 per country) that exercise all rule types
- Include claims that pass all rules, fail one rule, and fail multiple rules

### Features
- **Rule diff**: given two countries, show which rules differ and how
- **Rule versioning**: each rule has an effective date — the engine applies rules that were active on the claim's submission date
- A CLI or simple web UI to: run validation, view rules for a country, compare rules across countries

## Evaluation Criteria

- All 15 test claims produce correct validation results
- Adding a 4th country requires only a new config file (demonstrate this with a skeleton config)
- Rule diff correctly identifies differences between country pairs
- Rule versioning works — a claim submitted before a rule's effective date is not subject to that rule
- Error messages are specific and actionable ("Missing required document: discharge summary for inpatient claim in Thailand")
- Documentation explains the rule schema clearly enough for a non-engineer to write rules

## Submission

- Push your project onto a GitHub repository
- Include the 3 country configs, 15 test claims, validation results, and a sample 4th country config
