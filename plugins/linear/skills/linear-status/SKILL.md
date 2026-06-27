---
name: linear-status
description: |
  Print a Linear Project's state: WIP per workflow state, milestone breakdown,
  link to the native Project Update. Uses the project-status verb via linear.mjs.
  Tech-lead hot path. Native Linear Project Updates come first — MCP fallback
  only if the native view is insufficient.
  Use when: tech lead or engineer says "project status", "how is X going",
  "show milestones for X", or /linear-status.
  Skip when: the ask is about a single issue (use the Linear UI or MCP) or
  about the whole team (no script covers that; use the Linear UI).
---

# linear-status

Tech-lead breakdown of a Linear Project.

## Procedure

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" project-status "My Project Name"
# or by id:
node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" project-status <project-uuid>
```

Output includes: Project metadata, a link to open the native Project
Update in Linear, WIP counts per state, and progress per Milestone.

## Important

- **Always surface the native Project Update first.** It has narrative,
  velocity, and stakeholder-visible summary that the MCP breakdown doesn't.
- If the engineer asks a question the native view already answers,
  point at the URL — don't re-query via MCP.
- The project name is a substring match against your team's projects;
  if ambiguous, the script will error and ask for a more specific name.
