# AI Challenge 02 — Claims Data Cleanup & Report

## Note

- You are expected to use AI coding tools (e.g., Claude Code, Cursor, GitHub Copilot) to complete this challenge.
- We evaluate your ability to decompose the problem, direct the AI tool effectively, and deliver a working solution.
- Please estimate and give us your timeline.
- If you have any issues, don't hesitate to contact us.

## Difficulty

Beginner · 2–3 hours

## Context

Insurance operations teams receive claims data from multiple sources. The data often contains duplicates, inconsistent formatting, missing values, and typos. Before any analysis can happen, the data must be cleaned and validated.

## Problem

Given a messy CSV of 500 insurance claims, write a script that cleans the data and produces a summary report.

### CSV Schema

Generate a dataset of 500 claims with these columns and intentional data quality issues:

| Column | Type | Example | Issues to introduce |
|--------|------|---------|-------------------|
| claim_id | string | CLM-00123 | Some missing, some duplicated |
| policy_id | string | POL-456 | Some missing |
| member_name | string | John Doe | Inconsistent casing (JOHN DOE, john doe, John Doe) |
| claim_type | string | OUTPATIENT | Typos: "OUTPATIENT", "outpatient", "Outpateint", "OP" |
| diagnosis | string | Flu | Some empty, some "N/A", some "n/a" |
| submitted_amount | number | 15000 | Some negative, some zero, some as strings with commas "15,000" |
| currency | string | THB | Mixed: "THB", "thb", "Baht", "VND", "vnd" |
| submitted_date | string | 2024-03-15 | Mixed formats: "2024-03-15", "15/03/2024", "March 15, 2024" |
| status | string | APPROVED | Valid values: APPROVED, REJECTED, PENDING, IN_REVIEW |

Introduce approximately 15–20% of rows with at least one data quality issue.

## Requirements

**Cleaning script:**
- Remove exact duplicate rows
- Normalize text fields to consistent casing and fix known typos
- Parse all date formats into ISO 8601 (YYYY-MM-DD)
- Remove or flag rows with invalid amounts (negative, zero)
- Standardize currency codes to uppercase ISO format
- Replace "N/A", "n/a", empty strings with a consistent null marker
- Output a clean CSV

**Data quality report showing:**
- Total rows before and after cleaning
- Number of duplicates removed
- Count of rows with each type of issue found
- Summary statistics: total claims by type, by status, average amount by type
- Top 5 most common diagnoses

## Evaluation Criteria

- All data quality issues are detected and handled correctly
- Clean CSV has consistent formatting throughout
- Report is clear and includes all required statistics
- Script is readable and well-organized
- Edge cases are handled (rows with multiple issues)

## Submission

- Push your project onto a GitHub repository
- Include the generated dirty CSV, the clean CSV output, and the report
