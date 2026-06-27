# Claude Code Best Practices

Best practices for working effectively with Claude Code, combining official Anthropic guidance with Papaya's AI-agent-first workflow.

## Start With the Agent

Before doing work manually, ask: **"Can Claude Code do this?"**

Use Claude Code for coding, git operations, PRs, tests, docs-from-code, codebase investigation, and automation scripts. The engineer's job is to direct the work, provide context, review decisions, and verify outcomes.

For non-trivial work, start with exploration and planning before implementation:
1. **Explore** -- let Claude read the relevant files and understand the codebase.
2. **Plan** -- Claude proposes an approach, trade-offs, and verification steps.
3. **Review** -- you approve, reject, or revise the plan.
4. **Code** -- Claude implements the approved plan.
5. **Verify** -- Claude runs checks, self-reviews, and reports what remains.

For small, obvious fixes, it is fine to skip formal planning. Still give Claude a clear goal and a way to verify the result.

## Give What and Why Before How

The best prompts explain:
- **What** needs to change
- **Why** it matters
- **Who** is affected
- **Where** to look
- **What must stay unchanged**
- **How to verify success**

Avoid over-directing the implementation too early. Let Claude propose the how, then review the proposal. If you already know a likely direction, provide it as context:

> I think the issue may be in `ClaimCaseScreen` because it owns the date formatting. Please investigate that direction, but also check whether the formatting comes from a shared helper. Propose the safest fix before editing.

This gives Claude useful signal without forcing it into a single path.

## Ask Why More Often

Ask Claude "why" whenever something is unclear, surprising, or risky:
- **Why did you choose this approach?**
- **Why is this safer than the alternative?**
- **Why do you believe this API exists?**
- **Why is this information current?**
- **Why did you touch this file?**
- **Why did you skip this edge case?**

Do this especially when Claude:
- Does something that looks wrong
- Proposes a solution without explaining the reasoning
- Gives information that may be outdated
- Appears to guess
- Makes a broad change for a narrow task

Good Claude Code usage is not passive approval. The engineer should actively interrogate assumptions.

## When Claude Gives Options

Sometimes Claude Code asks you to choose between options before continuing. If you are not fully clear which option to select, do not guess silently. Use the decision point to give Claude more signal.

- **If you are 70-80% confident** -- choose "tell more," copy the option you are leaning toward, and add the concerns or missing details Claude should pay attention to.
- **If you are about 50% confident** -- choose "tell more" and list all concerns, requirements, and constraints. Ask Claude to pick the option that best covers them.
- **If you are not clear at all** -- ask Claude to explain the options, trade-offs, risks, and recommended choice in simpler terms before deciding.

The goal is not to always make the decision immediately. The goal is to keep Claude informed about what you understand, what you are unsure about, and what matters most.

## Use Meta Prompts

Meta prompts force Claude to reveal information it might otherwise compress away:

- **List all concerns, risks, and assumptions you see.**
- **What did you defer, skip, or leave unverified in this session?**
- **What are the trade-offs, cons, and failure modes of this approach?**
- **Verify this against the source of truth before using it.**
- **Before editing, explain which files you plan to touch and why.**
- **Self-review your diff for bugs, scope creep, convention violations, and missing tests.**

For risky work, explicitly name the risk:

> You are working with production/customer data. Be careful with irreversible actions. Do not delete data, update all rows, create dummy data in customer accounts, or run destructive commands without explaining the exact impact and asking for confirmation.

> I approve this direction, but you must keep it safe: inspect first, avoid destructive commands, and stop if you find ambiguity.

## Give Claude a Way to Verify Its Work

Claude produces better results when it can check its own output:
- **Write tests first** -- let Claude run them to confirm correctness.
- **Provide expected outputs** -- paste expected behavior, screenshots, API responses, or acceptance criteria.
- **Use linters and type checkers** -- ask Claude to run `tsc`, `eslint`, `bun test`, or the project's equivalent.
- **Ask for screenshots** -- for UI work, have Claude take screenshots and compare against the design.
- **Ask for self-review** -- before human review, ask Claude to review its own diff.

When information may be stale, ask Claude to verify from the latest source:
- Official documentation
- The actual code in the repository
- `node_modules` or generated types
- Database schema, GraphQL schema, or API contract
- Jira acceptance criteria
- Product or customer source-of-truth

Prefer original sources over summaries, blog posts, memory, or guesses.

## Manage Context Deliberately

Context is not free. A bigger context window does not automatically mean better work.

- **Start a new session for a new task.** Do not reuse one long session for unrelated tasks.
- **Use `/clear` between unrelated tasks.** Rename or summarize first if you need to find the session later.
- **Use `/compact` before context becomes stale.** A good compact summary is better than dragging a long, noisy history forward.
- **Do not rely on a 1M-token window by default.** Large context can hide stale assumptions, irrelevant files, and old decisions.
- **Use subagents for noisy investigation.** Keep logs, broad search, and one-off research out of the main conversation when possible.
- **Use `/usage` or a statusline.** Watch context and cost instead of guessing.

The goal is not to maximize tokens. The goal is to preserve the smallest useful context for the current task.

## Manage Sessions Effectively

- **One task per session** -- avoid kitchen-sink sessions.
- **Course-correct early** -- if Claude is heading in the wrong direction after 2-3 turns, interrupt and redirect.
- **Use `/btw` for side questions while Claude is running** -- keep the main task moving without derailing the session.
- **Use checkpoints** -- commit working code frequently so you can restart from a known-good state.
- **Rewind when needed** -- if Claude takes a wrong turn, restore the previous checkpoint and choose another approach.

Do not pressure Claude to "just do it quickly" or "make it work at any cost." That kind of instruction encourages shortcuts, hacks, and unsafe workarounds. Ask for the smallest safe step instead.

## Configure Your Environment

### CLAUDE.md

The `CLAUDE.md` file at the project root tells Claude about your project. Keep it concise:
- Project structure overview
- Build and test commands
- Key conventions or installed skills
- Common gotchas
- Compact instructions
- Safety rules that must apply every session

Avoid over-specifying. A short `CLAUDE.md` is better than a long one full of rarely relevant details. Put specialized conventions in skills so they load only when needed.

### Permissions and Auto Mode

Configure allowed, ask, and denied tools in `.claude/settings.json` to avoid repetitive prompts while preserving safety.

Auto mode can be a good default when the task is clear. It balances autonomy and safety by allowing routine actions while blocking destructive or suspicious ones. For team use, configure trusted repositories, domains, and internal services so routine work is not blocked while production and data-exfiltration risks remain protected.

### MCP, CLI, API, and SDK

Prefer CLI, API, or SDK access when it is stable, scriptable, and context-efficient. MCP is useful when Claude needs a rich tool interface, but MCP tool definitions can add overhead.

Good default:
- Use CLI tools such as `gh`, `aws`, `gcloud`, `sentry-cli`, project CLIs, or internal CLIs when available.
- Use SDK/API calls for repeatable automation.
- Use MCP when the task needs an interactive tool surface or when no practical CLI/API path exists.

Agents can help turn repeated autonomous work into scripts and automation.

### Hooks, Skills, and Subagents

Use harnesses to keep the workflow smooth:
- **Skills** -- load team conventions and specialized knowledge on demand.
- **Hooks** -- enforce safety rules, format after edits, filter noisy output, or run lightweight checks.
- **Subagents** -- isolate investigation, review, QA, debugging, or documentation work.
- **Statusline** -- show model, branch, worktree, context usage, and other session state.

Keep stable rules in tools and harnesses. Do not rely on every engineer remembering the perfect prompt.

## Use Team Plugins and Conventions

Install Papaya plugins from the marketplace:

```bash
/plugin marketplace add papaya-insurtech/pumpkin
/plugin install linear@papaya-pumpkin
```

Follow the team's documented coding conventions when writing or reviewing code.

## Review the Right Things

Human review has the highest leverage before code exists:
- Review the task understanding.
- Review the proposed solution.
- Review trade-offs and risks.
- Review test strategy.
- Review rollout and rollback considerations.

Then ask Claude to review 100% of the generated code before you do final human review. Human code review should focus on:
- Business logic
- Security-sensitive code
- Permissions and data access
- Database migrations
- External API integrations
- Production/customer data
- Areas where Claude made assumptions

Do not blindly trust generated code, even when it passes automated checks.

## Automate and Scale

- **Headless mode** -- use `claude -p "task description"` for scripting and CI/CD pipelines.
- **Parallel sessions** -- run multiple Claude Code sessions only for independent tasks.
- **Subagents** -- delegate review, investigation, test running, or log analysis.
- **Automation discovery** -- after repeating an agent-assisted task, ask: "Can this become a script, hook, CLI command, or workflow?"

Autonomous agent work is useful for ambiguous work. Automation is better for stable repeated work.

## Avoid Common Failure Patterns

### Kitchen-Sink Sessions

Do not ask Claude to do too many unrelated things in one session. Context gets muddled and quality drops.

### Over-Correcting

If Claude makes a small mistake, point out the specific issue. Do not rewrite the entire prompt or add excessive guardrails.

### Over-Specified CLAUDE.md

A `CLAUDE.md` that tries to cover every edge case becomes noise. Keep it focused on what Claude genuinely needs every session.

### Trust-Then-Verify Gap

Do not commit or merge without verification. Ask Claude what it verified, what it did not verify, and what remains risky.

### Infinite Exploration

If Claude keeps reading files without making progress, interrupt and give it a more specific direction.

### Forced Solution Bias

When you know a possible solution, share it as a hypothesis. Do not force Claude to implement it without checking whether it is actually the best path.

## References

- [Claude Code Official Docs](https://code.claude.com/docs/en/best-practices)
- [Claude Code Costs and Context Guidance](https://code.claude.com/docs/en/costs)
- [Claude Code Settings](https://code.claude.com/docs/en/settings)
- [Claude Code Subagents](https://code.claude.com/docs/en/sub-agents)
- [Claude Code Auto Mode](https://code.claude.com/docs/en/auto-mode-config)
- [Anthropic Skills Repo](https://github.com/anthropics/skills)
- [Community Skills Marketplace](https://github.com/daymade/claude-code-skills)
- [Awesome Claude Skills](https://github.com/travisvn/awesome-claude-skills)
