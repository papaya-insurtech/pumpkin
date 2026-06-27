# AI Challenge 03 — Claim Notification Email Templates

## Note

- You are expected to use AI coding tools (e.g., Claude Code, Cursor, GitHub Copilot) to complete this challenge.
- We evaluate your ability to decompose the problem, direct the AI tool effectively, and deliver a working solution.
- Please estimate and give us your timeline.
- If you have any issues, don't hesitate to contact us.

## Difficulty

Beginner · 2–3 hours

## Context

When a claim moves through its lifecycle, members receive email notifications at each stage. These emails need to be professional, clear, and consistent with brand guidelines. The operations team needs a way to preview templates before they go live.

## Problem

Build a set of email templates for 6 insurance claim lifecycle events, plus a preview page to view each template with sample data.

### Events

| Event | Subject Line | Key Data |
|-------|-------------|----------|
| Claim Submitted | Your claim {claim_number} has been received | claim_number, member_name, claim_type, submitted_date |
| Documents Received | Documents received for claim {claim_number} | claim_number, member_name, document_count, documents_list |
| Under Review | Your claim {claim_number} is being reviewed | claim_number, member_name, assessor_name, estimated_days |
| Approved | Good news! Claim {claim_number} has been approved | claim_number, member_name, approved_amount, original_amount, payment_method |
| Rejected | Update on claim {claim_number} | claim_number, member_name, rejection_reason, appeal_deadline |
| Payment Sent | Payment for claim {claim_number} has been processed | claim_number, member_name, payment_amount, payment_date, reference_number |

### Brand Guidelines

- Primary color: `#2563EB` (blue)
- Secondary color: `#10B981` (green, for positive outcomes)
- Warning color: `#EF4444` (red, for rejections/urgent)
- Font: System sans-serif stack
- Logo: Use a text placeholder "Papaya Insurance"
- Tone: Warm, professional, reassuring — avoid jargon

## Requirements

- 6 HTML email templates, one per event
- Templates use variable interpolation (e.g., `{{member_name}}`) — not hardcoded values
- Each email includes: header with logo, body with event-specific content, footer with support contact
- Rejection email includes a clear explanation section and next steps
- Approval email visually highlights the approved amount
- A preview web page where you can select an event type and see the rendered template with sample data
- Templates render correctly in a standard email client layout (single column, max-width 600px)

## Evaluation Criteria

- Templates are visually polished and consistent with brand guidelines
- Copy is clear, warm, and avoids insurance jargon where possible
- All variables are correctly interpolated in the preview
- Responsive email layout (works on mobile email clients)
- Preview page is functional and easy to use

## Submission

- Push your project onto a GitHub repository
- Deploy the preview page and provide a live URL
