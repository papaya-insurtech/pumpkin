---
name: linear-upload-plan
description: |
  Upload a Claude Code plan to the Linear issue linked to this session.
  Uses the upload-plan verb via linear.mjs. Plans are added as Linear documents
  and comments (full markdown) — never deleted.
  Use when: engineer says "upload this plan to Linear", "sync plan to TEAM-42",
  "push the plan file", or /linear-upload-plan. Also the auto-trigger for
  ExitPlanMode via the linear-plan-upload.sh hook.
  Skip when: session is not linked (script exits silently), or the plan is
  trivial enough that a comment would be noise — engineer's call.
---

# linear-upload-plan

Upload a Claude Code plan to the linked Linear issue.

## Procedure

Default — uses the most recent file under `~/.claude/plans/` and the current
session's linked issue:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" upload-plan
```

Explicit plan file:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" upload-plan --plan-file ~/.claude/plans/<slug>.md
```

Target a specific issue, skipping the session mapping:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" upload-plan --plan-file <path> --issue TEAM-42
```

Feed plan content via stdin (used by the ExitPlanMode hook):

```bash
cat plan.md | node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" upload-plan --plan-stdin
```

## What gets created in Linear

- **Document** — a Linear Document attached to the issue (via `issueId`)
  holding the full plan markdown. Linear's document UI renders long content
  cleanly, and the issue's sidebar already lists linked documents.
- **Comment** — a short note on the issue with a link to the new document,
  session id, digest, source file, and timestamp. This keeps the activity
  log honest without flooding it with plan content.

Both are kept forever. Re-running with the same plan content is deduped
by digest (no-op). Revising the plan produces a new document + note, not an
edit — history is append-only.

## Multiple sessions / multiple plans

One issue can accumulate plans from many sessions. Each upload records on
the session side in `<git-common-dir>/.claude-linear/<id>/linear.json`.
When another engineer picks up the issue, they see every prior plan in
Linear's comment + document list.
