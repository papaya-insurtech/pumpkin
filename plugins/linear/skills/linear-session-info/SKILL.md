---
name: linear-session-info
description: |
  Show the Linear issue + uploaded plans + PRs attached to the current
  Claude Code session. Uses the session-info verb via linear.mjs.
  Use when: engineer asks "which Linear issue am I on", "what plans have
  I uploaded", "is this session linked", or /linear-session-info.
  Skip when: engineer is not using Linear at all.
---

# linear-session-info

Inspect the session <-> Linear mapping.

## Current session

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" session-info
```

Prints the linked issue, linked-at timestamp, uploaded plans (digest +
title + source path), PR numbers associated with the session, and the
session's Linear attachment id.

If the session has no mapping, the script says so and suggests
`/linear-link-session <TEAM-NN>`.

## All sessions in this repo

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" session-info --all
```

Lists every linked session for this repo. Walks the shared-state
location `<git-common-dir>/.claude-linear/`.

## Machine-readable

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" session-info --json
node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" session-info --all --json
```

Useful when another script needs to reason about session state.

## Unlinking

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" unlink-session
```

Removes the local mapping only. Plans and attachments stay on the Linear
issue — you are only severing the local auto-sync. Relink later with
`/linear-link-session <TEAM-NN>` at no cost.
