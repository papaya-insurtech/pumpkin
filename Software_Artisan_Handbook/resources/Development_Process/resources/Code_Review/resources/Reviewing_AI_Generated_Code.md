# Reviewing AI Generated Code

AI agents produce code that compiles, passes linting, and often looks correct at first glance. But AI-generated code has characteristic failure modes that human reviewers must watch for.

## Common AI Mistakes

### 1. Hallucinated APIs

The agent invents function signatures, uses deprecated methods, or calls libraries with incorrect parameters. The code looks plausible but doesn't work.

**How to catch:**
- Verify imports actually exist in the project or `node_modules`.
- Check function signatures against the actual source code or docs.
- Run `bun tsc --noEmit` to catch type errors the agent may have missed.

### 2. Scope Creep

The agent "improves" code beyond the task scope -- refactoring adjacent functions, adding error handling for impossible scenarios, renaming variables, adding comments.

**How to catch:**
- Compare the diff against the Jira task requirements. Every changed line should trace back to the task.
- Check if the agent touched files it shouldn't have.
- Look for added abstractions, utilities, or helpers that weren't asked for.

### 3. Wrong Business Logic

The agent doesn't understand insurance domain concepts. It may use "policy" when it should use "certificate," or implement a claim flow incorrectly.

**How to catch:**
- Verify domain-specific terms match the Jira task and product requirements.
- Trace the data flow end-to-end against the use cases.
- Ask: "Does this make sense for our business?" -- not just "Does this compile?"

### 4. Incomplete Context

The agent may not know about related features, recent changes by other developers, or system-wide patterns. It writes code that works in isolation but breaks in context.

**How to catch:**
- Check if the change conflicts with recent PRs or ongoing work.
- Verify the agent followed existing patterns in the codebase (not just conventions).
- Test integration points manually.

### 5. Security Gaps

The agent may introduce vulnerabilities: unsanitized inputs to Hasura, missing permission checks, exposed environment variables, or improper error messages that leak internal details.

**How to catch:**
- Check Hasura permission configurations for new tables/fields.
- Verify input validation at system boundaries.
- Ensure error messages don't expose internal details to users.
- Check for hardcoded secrets or credentials.

### 6. Over-Engineering

The agent may create unnecessary abstractions, add configuration options nobody asked for, or build for hypothetical future requirements.

**How to catch:**
- Ask: "Is this the simplest solution that solves the task?"
- Look for feature flags, configuration objects, or factory patterns that serve only the current use case.
- Count the files changed -- if a simple feature touches 10+ files, something may be over-engineered.

## Verifying the Agent Understood the Task

1. Read the **Agent Instructions** section in the PR description (see [Reviewee Convention](./Reviewee_Convention.md)).
2. Compare the prompts given to the agent against the Jira task requirements.
3. Check if the agent's interpretation matches the intended behavior.
4. If the PR description doesn't include agent instructions, ask the developer to add them.

## Ensuring Skill Compliance

Convention skills installed from the marketplace define how code should be written. When reviewing:

1. Check if the code follows the relevant convention skills (typescript-convention, react-convention, etc.).
2. Pay special attention to Papaya-specific patterns: `usePQuery`/`usePMutation`, `<ExternalLink>`, notification patterns, modal usage patterns.
3. If the agent used standard library patterns instead of Papaya wrappers, flag it.

## Review Workflow for AI-Generated PRs

1. **Read the PR description** -- understand what the agent was asked to do and what the developer verified.
2. **Check the diff for scope** -- ensure changes are limited to the task.
3. **Verify API correctness** -- imports, function signatures, and types are real.
4. **Check business logic** -- domain concepts are correct.
5. **Run the code** -- don't just read it. Test the actual behavior.
6. **Provide feedback** -- include both code-level feedback and prompting suggestions for next time.
