---
name: linear-log-bug
description: |
  File a bug in your Linear team with the required Type/Area/env labels and PII scan.
  Uses the log-bug verb via linear.mjs. Rejects the create when DOB or government ID
  is detected.
  Use when: engineer says "log a bug", "file a bug", "create a bug ticket",
  "report this bug", or /linear-log-bug.
  Skip when: engineer wants to discuss the bug first; or intends to work on it
  without tracking in Linear (Linear ref is optional).
---

# linear-log-bug

File a bug in Linear with enforced labels + PII scan.

## Procedure

```bash
CLAUDE_CODE=1 node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" log-bug \
  --title  "<short title, no PII>" \
  --area   <area-label> \
  --env    <prod|test|sit|uat> \
  --severity <S1|S2|S3|S4> \
  --description "<steps + expected + actual, no PII>"
```

`CLAUDE_CODE=1` tags the issue with `ai-drafted`. Labels applied
automatically: `bug`, `<area>`, `env:<env>`.

## Important

- PII scan enforces NO full names, DOBs, government IDs, or gender.
- Claim codes (e.g. `CLM-*`, `CLAIM-*`) ARE allowed.
- If scan rejects, revise the wording — don't work around the scan.
- Engineer may choose to skip Linear entirely — filing a bug is optional.
- The team key is resolved from `LINEAR_TEAM_KEY` env or the plugin's
  configured default.
