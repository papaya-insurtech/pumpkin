# DevSecOps Challenge 1 — Agentic DevSecOps at Papaya

## Note

- You are required to use a coding agent (e.g. Claude Code, Codex, Cursor) to complete this challenge.
- Please estimate and give us your timeline.
- If you have any issues or questions, don't hesitate to contact us.

## Difficulty

Advanced · 6–8 hours

## Context

Papaya builds a GenAI-powered enterprise platform for the insurance industry — Claim, Underwriting, Policy Servicing, and FWA (Fraud/Waste/Abuse) — serving insurer partners across SEA and Asia. Our platform processes sensitive data every day: medical documents, diagnoses, claim histories, national IDs, and bank accounts of insured members.

Every engineer at Papaya works agent-first: Claude Code (Team Premium) is the primary tool for writing code, running git, opening PRs, and increasingly for infrastructure work.

This is where we are today (see [Appendix A](#appendix-a--papaya-platform-context) for the full picture):

- Engineers run Claude Code on their laptops, signed in to AWS through their SSO profiles. Most engineers' profiles can reach production.
- Some engineers run Claude Code with permission prompts turned off because "it is faster".
- Engineers install MCP servers and plugins they find useful; there is no review process.
- CI/CD runs on GitHub Actions. Some workflows use a long-lived GitHub token and AWS access keys stored as repository secrets.
- Monitoring and alerting exist but are fragmented across CloudWatch, GCP, and Slack channels. On-call is informal.
- We are working towards ISO 27001 and must satisfy HIPAA and regional data-protection regulations for our partners.

We've heard two strong opinions from inside the company:

> **Engineering:** "Let Claude Code talk to AWS directly. I want to debug and ship my own infra changes without waiting for someone else."
>
> **Compliance:** "Nothing changes in production — by a human or an agent — without a named person who reviewed and approved it."

## Problem

You are joining as our DevSecOps Engineer. Your first mission: **design the framework and workflow for how Papaya uses coding agents for DevSecOps.**

You don't have access to our systems or code, and we don't expect you to.

## Requirements

- The format of the deliverable is up to you.

## Submission

- Your deliverable(s) — via a GitHub repository, a cloud storage link (Google Drive, OneDrive, …), or direct files.
- The **complete, raw, unedited conversation(s)** with your coding agent — every session you used for this challenge. Native session files are preferred (e.g. Claude Code: `~/.claude/projects/**/*.jsonl`; Codex CLI: `~/.codex/sessions/`); for chat apps, an export or a share link.

**Submissions without the agent conversation will be automatically marked as failed.**

---

## Appendix A — Papaya Platform Context

<!-- TODO(hiring): confirm every item below against the real stack before publishing. -->

### Cloud

- **AWS (primary):** Lambda (Serverless Framework), ECS, EC2, Aurora PostgreSQL, SNS, SQS, Step Functions, S3 (claim documents), CloudWatch.
- **GCP:** Vertex AI and Gemini API workloads for document AI and ML models.
- **Kubernetes:** workloads for AI agents and internal services.
- **Hosting:** Firebase Hosting for web frontends.

### Application

- **Backend:** Node.js, TypeScript, GraphQL (Apollo Server, Hasura), PostgreSQL.
- **Frontend / Mobile:** Next.js, React, React Native (Expo).
- **AI/ML:** Python, PyTorch, OpenAI, Vertex AI, Gemini, Claude.
- **AI agents in production:** claim assessment, document extraction and classification, FWA detection — they read documents uploaded by partners and members.

### Engineering

- **Source control & CI/CD:** GitHub (`papaya-insurtech` organization), GitHub Actions.
- **Coding agent:** Claude Code (Team Premium) for every engineer; internal Claude Code plugins are distributed via a plugin marketplace.
- **Work tracking & communication:** Linear, Slack.
- **Tenancy:** multiple insurer partners across countries (e.g. Vietnam, Thailand, Hong Kong), each with their own data and contractual requirements.

### Compliance

- ISO 27001 (in progress), HIPAA, and regional data-protection regulations in the countries we operate in.
