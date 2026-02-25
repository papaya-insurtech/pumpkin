# AI Agent Philosophy

## Why We Use AI Agents for All Tasks

Our team operates with an **AI-agent-first** model. Every task -- coding, research, documentation, brainstorming -- starts with an AI agent. Engineers are **directors, reviewers, context-providers, and decision-makers**, not typists.

This isn't about replacing skill. It's about leverage. An engineer who directs an AI agent effectively produces higher-quality work faster than one who types everything manually. The skill shifts from "how to write code" to "how to direct, verify, and refine AI-generated work."

## The Three-Tool Model

### 1. Claude Chat (claude.ai / Claude Desktop)

**Purpose:** Research, learning, brainstorming, rubber-ducking.

Use Claude Chat when you need to:
- Understand a new concept or technology
- Explore solutions before committing to one
- Brainstorm architecture or design decisions
- Get explanations of unfamiliar code or domain concepts
- Rubber-duck a problem -- describe it to Claude and let it ask clarifying questions
- Research libraries, APIs, or best practices

Claude Chat is your first stop for any task that requires **thinking before doing**.

### 2. Claude Cowork (Claude Desktop > Cowork tab)

**Purpose:** Documentation, requirements analysis, test plans, non-code file generation.

Use Claude Cowork when you need to:
- Draft or refine requirements documents
- Create test plans and test cases
- Analyze Jira tasks and break them into subtasks
- Generate non-code files (xlsx, pptx, CSV, etc.)
- Write or update documentation
- Summarize meetings or discussions

Claude Cowork excels at **structured non-code work** that benefits from file system access and multi-step workflows.

### 3. Claude Code (CLI)

**Purpose:** Coding, git operations, PRs, tests, docs-from-code, building agents.

Use Claude Code when you need to:
- Write, modify, or refactor code
- Run git operations (branch, commit, push, rebase, resolve conflicts)
- Create and manage Pull Requests
- Run and write tests
- Generate documentation from code
- Build automation scripts and agents
- Install and use team convention skills from the marketplace

Claude Code is your **primary coding tool**. It reads your codebase, understands context, follows team conventions (via installed skills), and produces code that matches your project's patterns.

## The Human Role

### Director
You define **what** needs to be done. You set the goal, scope, and constraints. You choose which tool to use and how to frame the task.

### Context-Provider
You provide the context that agents can't infer: business requirements, user stories, domain knowledge, team decisions, historical context, and the "why" behind tasks.

### Reviewer
You verify that AI-generated work is correct, complete, and aligned with the task requirements. You catch hallucinations, scope creep, and subtle errors that agents miss. See [Reviewing AI Generated Code](../Development_Process/resources/Code_Review/resources/Reviewing_AI_Generated_Code.md).

### Decision-Maker
When the agent presents options or asks for clarification, you make the call. You own the technical decisions and their consequences.

## Principles

1. **Always start with an agent.** Before writing code manually, ask: "Can an agent do this?" The answer is almost always yes.

2. **Provide rich context.** The better you describe the task, the better the output. Include the "why," not just the "what."

3. **Verify before trusting.** AI agents are powerful but imperfect. Always review generated code for correctness, security, and convention compliance.

4. **Iterate, don't restart.** If the output isn't right, give feedback and let the agent refine. Don't throw away and start over unless the approach is fundamentally wrong.

5. **Use the right tool.** Don't use Claude Code for brainstorming. Don't use Claude Chat for git operations. Each tool has a sweet spot.

6. **Stay in control.** The agent works for you. If it's going in the wrong direction, stop it early and redirect. See [Agent Troubleshooting](./Agent_Troubleshooting.md).
