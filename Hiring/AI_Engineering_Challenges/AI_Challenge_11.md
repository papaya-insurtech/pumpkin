# AI Challenge 11 — Claim Assessment AI Agent

## Note

- You are expected to use AI coding tools (e.g., Claude Code, Cursor, GitHub Copilot) to complete this challenge.
- We evaluate your ability to decompose the problem, direct the AI tool effectively, and deliver a working solution.
- Please estimate and give us your timeline.
- If you have any issues, don't hesitate to contact us.

## Difficulty

Advanced · 6–8 hours

## Context

After a claim is submitted with supporting documents, an assessor reviews the claim against the policy terms, verifies documents, calculates benefits, and writes an assessment report with a recommendation (approve, reject, or request more information). This process takes 30–60 minutes per claim manually. An AI agent that performs the initial assessment can reduce turnaround from days to minutes.

## Problem

Build a conversational AI agent that performs claim assessment. The agent has access to tools (policy lookup, benefit calculation, document verification) and produces a structured assessment report.

## Setup

- Use any LLM API (Claude, GPT, Gemini). Use your own API key or a free tier.
- Create 3 complete claim test cases, each with:
  - Claim details (type, amount, diagnosis, treatment dates)
  - Policy data (benefits, limits, exclusions, copay)
  - Document list (what was submitted, whether each doc is complete)
  - Expected outcome (approve, reject, or request-more-info)

Design the 3 cases to cover: a straightforward approval, a rejection (exclusion or limit exceeded), and a request-more-info (missing required document).

## Requirements

### Agent Tools

The agent must have access to 4 tools (implement as functions the agent can call):

1. **lookupPolicy(policyId)** — returns policy terms: benefits, limits, exclusions, copay, waiting periods
2. **calculateBenefit(policyId, claimType, amount)** — returns covered amount, copay, remaining limit
3. **verifyDocument(documentId)** — returns document type, completeness status, and any issues found
4. **checkMedicalNecessity(diagnosis, procedures)** — returns whether the treatment is clinically appropriate for the diagnosis

### Agent Behavior

- Agent must call tools in a logical sequence: verify documents → lookup policy → check medical necessity → calculate benefits
- Agent must check ALL submitted documents, not skip any
- Agent must verify the claim is within the policy's coverage period
- If a required document is missing or incomplete, the agent should recommend "request more info" (not reject)

### Assessment Report

The agent produces a structured report with these sections:

1. **Document Review** — list each document, its status (complete/incomplete/missing), and any issues
2. **Policy Verification** — confirm the policy is active, the member is covered, and the claim type is included
3. **Medical Necessity** — is the treatment appropriate for the diagnosis?
4. **Benefit Calculation** — submitted amount, covered amount, copay, member responsibility
5. **Recommendation** — APPROVE, REJECT, or REQUEST_MORE_INFO with specific reasoning
6. **Policy Citations** — every point in the recommendation must cite the specific policy clause it relies on

### Constraints

- Agent must not hallucinate policy terms — it must use the lookupPolicy tool, not invent clauses
- Agent must not approve amounts exceeding the benefit limit
- Agent must handle the case where a document is submitted but does not match the expected type

## Evaluation Criteria

- Correct assessment outcome for all 3 test cases
- All 4 tools are used appropriately (no unnecessary calls, no skipped steps)
- Report contains specific policy clause citations, not generic references
- Agent correctly identifies the case with missing documents and requests them (instead of rejecting)
- Agent reasoning is traceable — tool calls, their inputs, and outputs are logged
- Report is clear enough for a human assessor to review and approve/override

## Submission

- Push your project onto a GitHub repository
- Include the 3 test cases, the agent's output for each, and the tool call logs
- Include a brief writeup of your system prompt and tool design decisions
