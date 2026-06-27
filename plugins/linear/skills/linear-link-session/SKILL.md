---
name: linear-link-session
description: |
  Attach the current Claude Code session to a Linear issue so plans and PRs
  uploaded later land on that issue. Uses the link-session verb via linear.mjs.
  Use when: engineer says "link this session to TEAM-42", "track this work on
  Linear issue X", pastes a Linear issue URL and asks to pick it up, or
  /linear-link-session <id>.
  Skip when: engineer explicitly wants to work WITHOUT a Linear ref — the
  feature is optional.
---

# linear-link-session

Attach the current Claude Code session to a Linear issue.

## Procedure

1. Identify the issue. Accept `TEAM-42`, `42`, or a full Linear URL.
2. Run:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" link-session TEAM-42
   ```
   To also upload the most recent plan immediately:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" link-session TEAM-42 --upload-plan
   ```
3. The script creates `<git-common-dir>/.claude-linear/<session-id>/linear.json`
   (inside `.git/`, per-engineer, never committed) and registers a sidebar
   attachment on the Linear issue so the session is visible in the issue's
   right-hand pane. The git-common-dir anchor means the link survives
   `worktree remove` and is visible from any worktree of the same repo.

## After linking

- Any plan approved via ExitPlanMode is auto-uploaded by the
  `linear-plan-upload.sh` hook — as a Linear comment with the full
  plan markdown PLUS a sidebar attachment for quick spotting.
- Multiple sessions can link to the same issue; each adds its own attachment
  and its own plans. Nothing is ever deleted on the Linear side.
- Plans uploaded from one session stay visible for future sessions that
  pick up the same issue — that's the handoff contract.

## Switching the link

If the session is already linked to a different issue, the script exits with
a warning. Pass `--force` to replace the link — the old attachments stay on
the old issue.

## Related

- `/linear-upload-plan` — upload a plan explicitly (no auto-trigger).
- `/linear-session-info` — show the current session's link.
