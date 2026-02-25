# Agent Troubleshooting

Common issues when working with AI agents and how to resolve them.

## Agent Stuck in a Loop

**Symptoms:** Claude keeps reading the same files, making the same edits, or repeating similar attempts without progress.

**Solutions:**
1. **Interrupt and redirect** -- press `Esc` to stop, then give a more specific instruction.
2. **Narrow the scope** -- instead of "fix the bug," say "the issue is in `calculateTat` function in `utils.ts` line 45."
3. **Provide the answer** -- if you know what's wrong, tell Claude directly: "The issue is that `x` is null when `y` hasn't loaded yet."
4. **`/clear` and restart** -- start a fresh session with a clearer prompt.

## Incorrect Assumptions

**Symptoms:** Claude writes code that doesn't match the project's patterns, uses wrong APIs, or misunderstands the business logic.

**Solutions:**
1. **Point Claude at examples** -- "Look at how `ClaimCaseScreen` handles this pattern and follow the same approach."
2. **Provide explicit constraints** -- "We use `usePQuery` not `useQuery`. We use `gql.tada` not `@apollo/client`."
3. **Install convention skills** -- `/plugin install typescript-convention@papaya-pumpkin` ensures Claude follows team conventions.
4. **Reference the CLAUDE.md** -- make sure project-specific patterns are documented.

## Context Limit Issues

**Symptoms:** Claude starts forgetting earlier parts of the conversation, loses track of what files it has edited, or contradicts earlier decisions.

**Solutions:**
1. **`/clear` and summarize** -- start a new session and paste a summary of what's been done and what remains.
2. **Break into subtasks** -- instead of one long session, do multiple focused sessions.
3. **Use checkpoints** -- commit working code frequently so you can start fresh sessions from a known good state.
4. **Let Claude use subagents** -- for research/exploration, subagents keep the main session clean.

## Hallucinated APIs or Libraries

**Symptoms:** Claude uses functions, methods, or libraries that don't exist or have a different API than what it wrote.

**Solutions:**
1. **Ask Claude to verify** -- "Run `bun test` to check if this compiles."
2. **Point at actual docs** -- "Check the actual API at `node_modules/@apollo/client/...`."
3. **Provide the correct API** -- paste the actual function signature or link to the docs.
4. **Check during code review** -- this is the #1 thing to watch for in [Reviewing AI Generated Code](../Development_Process/resources/Code_Review/resources/Reviewing_AI_Generated_Code.md).

## Scope Creep

**Symptoms:** Claude starts "improving" code beyond what was asked -- adding error handling, refactoring adjacent code, changing naming conventions, adding comments.

**Solutions:**
1. **Be explicit about scope** -- "Only change the `handleSubmit` function. Don't modify anything else."
2. **Use Plan Mode** -- approve the plan before Claude starts coding.
3. **Interrupt early** -- if you see Claude touching files it shouldn't, stop it immediately.
4. **Review diffs carefully** -- use `git diff` to catch unintended changes.

## Agent Produces Low-Quality Output

**Symptoms:** Code works but is messy, doesn't follow conventions, or uses anti-patterns.

**Solutions:**
1. **Install convention skills** -- skills enforce team standards automatically.
2. **Provide examples** -- "Follow the same pattern as `src/screens/ClaimPortal/index.tsx`."
3. **Iterate** -- give specific feedback: "Use early return instead of nested if-else" rather than "make it better."
4. **Check your prompt** -- vague prompts produce vague results. Be specific about what you want.

## When to Abandon and Restart

Sometimes it's faster to start over than to fix a broken session:
- Claude has made multiple wrong turns and the context is polluted
- The codebase state is messy from multiple failed attempts (use `git checkout .` to reset)
- You've learned something new about the problem that fundamentally changes the approach

Before restarting:
1. `git stash` or `git diff > patch.txt` to save any useful fragments
2. Write down what you learned from the failed attempt
3. Start a fresh session with a clearer, more specific prompt
