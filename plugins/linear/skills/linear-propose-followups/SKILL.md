---
name: linear-propose-followups
description: |
  Draft post-deploy follow-up issues from a list of observations, then apply
  human-gate review before creating anything.
  Uses the propose-followups verb via linear.mjs. Every issue gets tech-debt +
  post-deploy + ai-suggested labels.
  Use when: engineer says "propose follow-ups", "log these after the deploy",
  "file follow-ups for that deploy", or /linear-propose-followups.
  Skip when: the work is a single obvious fix (use /linear-log-bug); or the
  observations don't come from a real post-deploy signal.
---

# linear-propose-followups

Draft a set of post-deploy follow-up Linear issues with human gate.

## Procedure

1. Collect observations — one per line — from the engineer. Examples:
   - "router cache hit rate dropped from 92% to 78% after deploy"
   - "cold start on Lambda regressed to 3s"
2. Run the script in proposal mode (default, no `--go`):
   ```bash
   printf "%s\n" "router caching 92%% -> 78%%" "cold start 1s -> 3s" \
     | node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" propose-followups \
         --project "My Project Name" \
         --env prod
   ```
   Prints the draft titles and waits.
3. Show the drafts to the engineer. If they say yes, re-run with `--go`:
   ```bash
   printf "%s\n" "router caching 92%% -> 78%%" "cold start 1s -> 3s" \
     | node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" propose-followups \
         --project "My Project Name" \
         --env prod --go
   ```
4. Report the created `TEAM-<id>` numbers.

## Important

- **Batches of 3+ require human gate** — never skip step 3.
- PII scan rejects observations that contain DOB / IDs.
- Project name is a substring match; if ambiguous, the script errors and
  asks for a more specific query.
- The team key is resolved from `LINEAR_TEAM_KEY` env or the plugin's
  configured default.
