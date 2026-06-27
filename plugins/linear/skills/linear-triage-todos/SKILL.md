---
name: linear-triage-todos
description: |
  Scan the repo for TODO/FIXME/HACK comments and propose Linear tech-debt issues
  grouped by Area. Uses the triage-todos verb via linear.mjs. Human-gated for batches.
  Use when: engineer says "triage TODOs", "turn TODOs into issues", "clean up
  FIXMEs", or /linear-triage-todos. One-shot — run occasionally, not daily.
  Skip when: only a few markers exist (hand-edit them); or engineer wants to
  fix the markers directly without tracking.
---

# linear-triage-todos

Turn accumulated `TODO`/`FIXME`/`HACK` comments into Linear tech-debt issues.

## Procedure

1. Run in proposal mode:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" triage-todos
   ```
   Prints one tech-debt issue per repo top-dir (grouped by Area label),
   each containing 40 markers max in the description.
2. Review the proposals with the engineer.
3. Create after approval:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" triage-todos --go
   ```

## Important

- Issues are always human-gated — no direct `--go` on first invocation
  unless the engineer explicitly asks.
- Labels applied: `tech-debt`, `ai-suggested`, `internal`, and the
  computed Area label.
- Marker text is PII-scanned before the description is built; any marker
  with DOB / ID content is logged and dropped.
- The team key is resolved from `LINEAR_TEAM_KEY` env or the plugin's
  configured default.
