# AI Challenge 07 — Claims Intake Wizard

## Note

- You are expected to use AI coding tools (e.g., Claude Code, Cursor, GitHub Copilot) to complete this challenge.
- We evaluate your ability to decompose the problem, direct the AI tool effectively, and deliver a working solution.
- Please estimate and give us your timeline.
- If you have any issues, don't hesitate to contact us.

## Difficulty

Intermediate · 3–5 hours

## Context

Insurance members submit claims through a multi-step form. The form adapts based on claim type (outpatient, inpatient, dental) — each type requires different documents and information. A well-designed intake form reduces back-and-forth with the member and speeds up claim processing.

## Problem

Build a multi-step claim submission wizard (web UI) with conditional logic, document upload, validation, and a final review step.

## Requirements

### Step 1 — Claim Type Selection
- Options: Outpatient, Inpatient, Dental
- Selection determines the fields and documents required in subsequent steps

### Step 2 — Member & Policy Information
- Pre-fill from mock data (editable): member name, policy number, member ID, date of birth
- Add dependent selector if the claim is for a dependent (list of dependents from mock data)

### Step 3 — Diagnosis & Treatment
- Diagnosis description (free text)
- ICD-10 code with autocomplete search from a provided list of at least 100 common codes
- Treatment date(s) — single date for outpatient/dental, date range for inpatient
- Provider/hospital name (free text with suggestions from a mock list)
- For inpatient: admission reason, length of stay (auto-calculated from dates)

### Step 4 — Document Upload
- Show required vs optional documents based on claim type:
  - Outpatient: medical receipt (required), prescription (optional)
  - Inpatient: discharge summary (required), itemized bill (required), medical receipt (required)
  - Dental: dental receipt (required), treatment plan (required for major dental)
- File type validation (PDF, JPG, PNG only, max 10MB each)
- Upload progress indicator
- Prevent proceeding if required documents are missing

### Step 5 — Review & Submit
- Summary of all entered data across all steps
- Allow back-navigation to edit any step without losing data
- Checkbox: "I confirm this information is accurate"
- Submit button (mock submission — log to console or show success message)

### General
- Form state persists across steps (no data loss on back/forward navigation)
- Responsive layout (desktop and mobile)
- Keyboard accessible (tab navigation, enter to proceed)

## Evaluation Criteria

- All 5 steps are functional with correct conditional logic per claim type
- Validation prevents invalid submissions (missing required fields, wrong file types, missing documents)
- ICD-10 autocomplete works with reasonable performance (filter 100+ codes as user types)
- Review step accurately reflects all entered data
- Smooth UX: progress indicator, back/forward navigation, no data loss
- Responsive design

## Submission

- Push your project onto a GitHub repository
- Deploy to any free hosting and provide a live URL
