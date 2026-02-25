# Claude Code Best Practices

Best practices for working effectively with Claude Code, sourced from [official Anthropic documentation](https://code.claude.com/docs/en/best-practices).

## Give Claude a Way to Verify Its Work

Claude produces better results when it can check its own output:
- **Write tests first** -- let Claude run them to confirm correctness.
- **Provide expected outputs** -- paste expected behavior or screenshots so Claude can compare.
- **Use linters and type checkers** -- Claude can run `tsc`, `eslint`, or `bun test` to catch errors before you review.
- **Ask for screenshots** -- for UI work, have Claude take screenshots and compare against the design.

## Explore First, Then Plan, Then Code

Use Plan Mode for non-trivial tasks:
1. **Explore** -- let Claude read the relevant files and understand the codebase.
2. **Plan** -- Claude proposes an approach. You review and approve.
3. **Code** -- Claude implements the approved plan.

This prevents wasted effort on wrong approaches. For small changes, skip straight to code.

## Provide Specific Context in Prompts

- **Scope the task** -- "Fix the date formatting in `ClaimCaseScreen`" is better than "fix the dates."
- **Reference files** -- use `@filename` to point Claude at specific files.
- **Paste images** -- paste screenshots of bugs, designs, or error messages directly.
- **Pipe data** -- use `cat file | claude` or `command | claude` to feed context.
- **Link Jira tasks** -- include the task description and acceptance criteria.

## Configure Your Environment

### CLAUDE.md
The `CLAUDE.md` file at the project root tells Claude about your project. Keep it concise:
- Project structure overview
- Build and test commands
- Key conventions (or reference installed skills)
- Common gotchas

Avoid over-specifying. A 50-line CLAUDE.md is better than a 500-line one. Let skills handle conventions.

### Permissions
Configure allowed and denied tools in `.claude/settings.json` to avoid repetitive permission prompts.

### MCP Servers
Connect external tools (databases, APIs, design tools) via MCP servers so Claude can interact with them directly.

### Hooks
Set up pre/post hooks for common workflows (e.g., auto-format after edits, run tests after changes).

### Skills and Plugins
Install team convention skills from the marketplace:
```
/plugin marketplace add papaya-insurtech/pumpkin
/plugin install typescript-convention@papaya-pumpkin
```

## Manage Sessions Effectively

- **Course-correct early** -- if Claude is heading in the wrong direction after 2-3 turns, redirect immediately. Don't wait for it to finish.
- **`/clear` between tasks** -- start fresh for unrelated tasks to avoid context pollution.
- **Use subagents** -- for investigation tasks within a larger session, let Claude spawn a subagent to research without polluting the main session context.
- **Rewind with checkpoints** -- if Claude makes a wrong turn, use git to revert and try a different approach.

## Automate and Scale

- **Headless mode** -- `claude -p "task description"` for scripting and CI/CD pipelines.
- **Parallel sessions** -- run multiple Claude Code sessions for independent tasks.
- **Fan-out** -- break large tasks into independent subtasks and run them in parallel.

## Avoid Common Failure Patterns

### Kitchen-Sink Sessions
Don't ask Claude to do too many unrelated things in one session. Context gets muddled and quality drops. One task per session.

### Over-Correcting
If Claude makes a small mistake, point out the specific issue. Don't rewrite the entire prompt or add excessive guardrails.

### Over-Specified CLAUDE.md
A CLAUDE.md that tries to cover every edge case becomes noise. Keep it focused on what Claude genuinely needs to know for every task in the project.

### Trust-Then-Verify Gap
Don't blindly trust Claude's output and commit without reviewing. Always verify, especially for:
- Security-sensitive code
- Database migrations
- External API integrations
- Business logic

### Infinite Exploration
If Claude keeps reading files without making progress, interrupt and give it a more specific direction.

## References

- [Claude Code Official Docs](https://code.claude.com/docs/en/best-practices)
- [Anthropic Skills Repo](https://github.com/anthropics/skills)
- [Community Skills Marketplace](https://github.com/daymade/claude-code-skills)
- [Awesome Claude Skills](https://github.com/travisvn/awesome-claude-skills)
