# AI Challenge 14 — Claims Workflow Orchestrator

## Note

- You are expected to use AI coding tools (e.g., Claude Code, Cursor, GitHub Copilot) to complete this challenge.
- We evaluate your ability to decompose the problem, direct the AI tool effectively, and deliver a working solution.
- Please estimate and give us your timeline.
- If you have any issues, don't hesitate to contact us.

## Difficulty

Advanced · 5–8 hours

## Context

A claim moves through a defined lifecycle: Submitted → Documents Verified → Under Assessment → Approved/Rejected → Payment Initiated → Closed. Each transition has preconditions (must be true to proceed), triggers side effects (notifications, audit log entries), and may require specific roles to authorize. An incorrect transition — like approving a claim before documents are verified — can lead to fraud or compliance violations.

## Problem

Build a state machine-based workflow engine that orchestrates claim lifecycle transitions with preconditions, side effects, role-based authorization, and a complete audit trail.

## State Machine Definition

### States

| State | Description |
|-------|-------------|
| SUBMITTED | Claim received, awaiting document verification |
| DOCUMENTS_VERIFIED | All required documents confirmed present and valid |
| UNDER_ASSESSMENT | Assessor is reviewing the claim |
| PENDING_INFO | Additional information requested from member |
| APPROVED | Claim approved for payment |
| REJECTED | Claim denied |
| PAYMENT_INITIATED | Payment processing started |
| CLOSED | Claim lifecycle complete |

### Transitions

| From | To | Preconditions | Side Effects | Authorized Roles |
|------|----|--------------|--------------|-----------------|
| SUBMITTED | DOCUMENTS_VERIFIED | All required documents present | Notify assessor team | document_clerk |
| DOCUMENTS_VERIFIED | UNDER_ASSESSMENT | Assessor assigned | Log assessment start time | team_lead |
| UNDER_ASSESSMENT | APPROVED | Assessment report complete, amount ≤ policy limit | Notify member, create payment request | assessor |
| UNDER_ASSESSMENT | REJECTED | Assessment report complete, rejection reason provided | Notify member with reason and appeal instructions | assessor |
| UNDER_ASSESSMENT | PENDING_INFO | Missing info description provided | Notify member with request details | assessor |
| PENDING_INFO | DOCUMENTS_VERIFIED | New documents/info received | Reset assessment timer | document_clerk |
| APPROVED | PAYMENT_INITIATED | Payment request created | Trigger payment system | finance |
| PAYMENT_INITIATED | CLOSED | Payment confirmed | Notify member with payment reference | finance |
| REJECTED | CLOSED | Appeal period expired OR member acknowledged | Archive claim | system |

## Requirements

### Core Engine
- State machine defined in configuration (JSON/YAML), not hardcoded in application logic
- Validate transitions: reject invalid transitions with a specific error explaining why
- Check preconditions before allowing a transition
- Execute side effects after a successful transition (mock implementations — log to console)
- Enforce role-based authorization — reject transitions from unauthorized roles

### Audit Trail
- Every transition logged with: timestamp, from_state, to_state, triggered_by (user ID + role), reason/notes
- Audit trail is immutable — entries cannot be modified or deleted
- Query audit trail by claim ID to see full history

### Cycle Detection
- The UNDER_ASSESSMENT → PENDING_INFO → DOCUMENTS_VERIFIED → UNDER_ASSESSMENT loop is allowed, but limit to 3 cycles maximum
- On the 4th attempt, reject the transition with "Maximum information requests exceeded — escalate to team lead"

### Test Scenarios

Implement and run 5 scenarios:

1. **Happy path**: SUBMITTED → DOCUMENTS_VERIFIED → UNDER_ASSESSMENT → APPROVED → PAYMENT_INITIATED → CLOSED
2. **Rejection path**: SUBMITTED → DOCUMENTS_VERIFIED → UNDER_ASSESSMENT → REJECTED → CLOSED
3. **Request more info loop**: SUBMITTED → DOCUMENTS_VERIFIED → UNDER_ASSESSMENT → PENDING_INFO → DOCUMENTS_VERIFIED → UNDER_ASSESSMENT → APPROVED → PAYMENT_INITIATED → CLOSED
4. **Invalid transition**: Attempt SUBMITTED → APPROVED (should fail with clear error)
5. **Unauthorized role**: Attempt a transition with the wrong role (should fail)

### Interface
- CLI or web UI to: view current state + valid transitions, advance a claim through states, view audit trail for a claim
- Show available transitions from current state (including which role is needed)

## Evaluation Criteria

- All 5 test scenarios produce correct results
- Invalid transitions are rejected with specific error messages (not generic "invalid transition")
- Preconditions are enforced (demonstrate with a case where precondition fails)
- Role authorization is enforced
- Audit trail is complete and accurate for all scenarios
- Cycle detection prevents infinite loops
- Adding a new state or transition requires only config changes (demonstrate with a diff)
- At least 15 tests covering valid transitions, invalid transitions, precondition failures, role authorization, and cycle detection

## Submission

- Push your project onto a GitHub repository
- Include the state machine config, test scenario results, and audit trail output
