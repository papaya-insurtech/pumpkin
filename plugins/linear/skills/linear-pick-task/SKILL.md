---
name: linear-pick-task
description: |
  Pick a Todo (Ready) issue from your Linear team to start work on.
  Uses the pick-task and start-task verbs via linear.mjs to list candidates,
  then claim one (move to In Progress, assign self, print branch/worktree hint).
  Use when: engineer says "what's next", "pick a task", "start on a Linear issue",
  "find me something to do", or /linear-pick-task.
  Skip when: engineer has a specific task in mind outside Linear; or wants to start
  coding without claiming an issue (Linear ref is optional).
---

# linear-pick-task

Pick one Todo issue from your Linear team and claim it.

## Procedure

1. List candidates (optionally filter by area):
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" pick-task                 # all areas
   node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" pick-task --area <area>
   ```
2. Offer the list to the engineer. Let them choose — do not auto-pick.
3. Claim it:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" start-task TEAM-123
   ```
   This moves the issue to `In Progress`, assigns the caller, and prints
   the worktree name hint (e.g., `feat-TEAM-123-router-alias`).
4. Create the worktree:
   ```
   EnterWorktree(name: "feat-TEAM-123-router-alias")
   ```
   `worktree-post-enter.sh` rewrites the branch to `feat/TEAM-123-router-alias`.
5. Paste the acceptance criteria printed by `start-task` into local
   context before starting to code.

## Important

- Engineer may decline every listed issue — picking is optional.
- If no Linear issue applies, fall back to `EnterWorktree(name: "feat-<slug>")`
  with no Linear ref. Skip steps 3 onwards.
- The Linear plugin's rules govern the PII + label rules for anything
  you end up creating.
