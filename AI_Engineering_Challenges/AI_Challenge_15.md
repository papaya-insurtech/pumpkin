# AI Challenge 15 — Multi-Tenant Configuration Platform

## Note

- You are expected to use AI coding tools (e.g., Claude Code, Cursor, GitHub Copilot) to complete this challenge.
- We evaluate your ability to decompose the problem, direct the AI tool effectively, and deliver a working solution.
- Please estimate and give us your timeline.
- If you have any issues, don't hesitate to contact us.

## Difficulty

Advanced · 5–8 hours

## Context

An insurance platform serves multiple insurance companies (tenants). Each tenant has different branding, claim workflows, document requirements, benefit structures, and approval rules. The platform must be configurable per tenant without code changes — an operations team member should be able to onboard a new insurer by filling out a configuration form.

## Problem

Build a tenant configuration system with an admin UI where each tenant's claim processing behavior is fully configurable, and a runtime that processes claims differently based on tenant config.

## Tenant Configuration Schema

Each tenant's config covers:

### Branding
- Company name, logo URL, primary color, secondary color

### Claim Types
- Which claim types are enabled (OUTPATIENT, INPATIENT, DENTAL, MATERNITY, OPTICAL)
- Required documents per claim type
- Optional documents per claim type

### Approval Rules
- Auto-approval threshold (claims under this amount are approved automatically)
- Approval tiers: amount ranges mapped to required approver roles
  - e.g., < 10,000: auto-approve, 10,000–100,000: assessor, 100,000–500,000: team lead, > 500,000: director

### Notifications
- Events that trigger notifications (claim_submitted, approved, rejected, payment_sent)
- Channels per event (email, SMS, webhook)
- Custom email templates per event (or use default)

### SLA
- Target processing time per claim type (in business days)
- Escalation rules: if SLA breached, notify whom

### Custom Fields
- Additional data fields required during claim submission (e.g., "Employee ID" for corporate clients, "Department" for government clients)

## Sample Tenants

Create 3 tenant configurations with meaningful differences:

**Tenant A — "SafeGuard Insurance" (Corporate)**
- Enabled types: OUTPATIENT, INPATIENT, DENTAL
- Auto-approval: 20,000
- 3-tier approval (assessor, team lead, director)
- Notifications: email only
- SLA: 5 days outpatient, 10 days inpatient
- Custom field: Employee ID (required)

**Tenant B — "HealthFirst" (Retail)**
- Enabled types: OUTPATIENT, INPATIENT, DENTAL, MATERNITY, OPTICAL
- Auto-approval: 5,000
- 2-tier approval (assessor, manager)
- Notifications: email + SMS
- SLA: 7 days all types
- No custom fields

**Tenant C — "GovHealth" (Government)**
- Enabled types: OUTPATIENT, INPATIENT
- Auto-approval: 0 (all claims require manual review)
- Single-tier approval (committee)
- Notifications: email + webhook
- SLA: 15 days all types
- Custom fields: Department (required), Budget Code (required)

## Requirements

### Admin UI
- CRUD interface for tenant configurations
- Form validation: auto-approval threshold must be ≥ 0, at least one claim type enabled, SLA must be positive
- **Preview mode**: select a tenant + enter a sample claim → show how it would be processed (which approval tier, which notifications fire, which documents required)
- **Config diff**: select two tenants → side-by-side comparison highlighting differences
- **Config history**: every save creates a version — view past versions and rollback to any previous version

### Runtime Processing
- A function/API: `processClaim(tenantId, claimData)` that returns:
  - Required documents for this claim type (based on tenant config)
  - Approval routing (which tier and approver role)
  - Notifications to send (which channels)
  - SLA deadline (calculated from submission date + tenant's SLA days)
  - Custom fields required (with validation)
- Demonstrate with 3 identical claims submitted to 3 different tenants — each produces different processing behavior

### Adding a New Tenant
- Onboarding a 4th tenant must require zero code changes — only configuration via the admin UI
- Demonstrate by creating a 4th tenant through the UI and processing a claim against it

## Evaluation Criteria

- All 3 tenants produce different claim processing behavior for the same claim
- Admin UI validates config and prevents invalid configurations
- Preview mode accurately predicts processing outcome for a sample claim
- Config diff correctly identifies all differences between tenant pairs
- Config history and rollback work correctly
- 4th tenant onboarding requires zero code changes
- Runtime processing function returns correct results for each tenant
- Code is modular — adding a new config dimension (e.g., "currency settings") requires minimal changes

## Submission

- Push your project onto a GitHub repository
- Deploy to any free hosting and provide a live URL for the admin UI
- Include a brief demo script showing: create tenant, configure it, process claims, compare configs
