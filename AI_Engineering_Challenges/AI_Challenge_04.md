# AI Challenge 04 — Insurance Glossary Search App

## Note

- You are expected to use AI coding tools (e.g., Claude Code, Cursor, GitHub Copilot) to complete this challenge.
- We evaluate your ability to decompose the problem, direct the AI tool effectively, and deliver a working solution.
- Please estimate and give us your timeline.
- If you have any issues, don't hesitate to contact us.

## Difficulty

Beginner · 2–3 hours

## Context

Insurance is full of specialized terminology that confuses both new employees and customers. A searchable glossary helps everyone speak the same language.

## Problem

Build a searchable web application for insurance terminology. The app should let users quickly find and understand insurance terms.

### Glossary Data

Include at least 40 terms covering these categories. Research and define each term accurately:

| Category | Example Terms |
|----------|--------------|
| General Insurance | Premium, Policyholder, Underwriting, Endorsement, Rider |
| Claims | Claim, Deductible, Copay, Coinsurance, Adjudication, Subrogation |
| Coverage | Sum Insured, Annual Limit, Sub-limit, Exclusion, Waiting Period, Pre-existing Condition |
| Life & Health | Beneficiary, Maturity, Surrender Value, Mortality Table, Actuarial |
| Reinsurance | Ceding Company, Retrocession, Treaty, Facultative, Loss Ratio |
| Regulatory | Solvency, Reserve, IBNR, Statutory Reporting, Compliance |

Each term should have: name, definition (2–3 sentences), category, and optionally a "related terms" list.

## Requirements

- Display terms grouped by category with expandable sections
- Full-text search that filters terms as the user types (search across name and definition)
- Clicking a term shows its full definition and related terms
- Related terms are clickable — navigate to that term's definition
- Alphabet quick-jump (A–Z sidebar) to scroll to terms starting with that letter
- Clean, readable typography — definitions should be easy to scan
- Works offline after initial load (all data bundled client-side)

## Evaluation Criteria

- Search is fast and intuitive (results update as you type, matches in definitions are highlighted)
- Definitions are accurate and clearly written
- Navigation is smooth (category grouping, alphabet jump, related term links)
- Visual design is clean and professional
- Code is well-organized

## Submission

- Push your project onto a GitHub repository
- Deploy to any free hosting and provide a live URL
