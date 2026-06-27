#!/usr/bin/env bash
# pr-transitions.sh — PostToolUse hook for Bash tool.
#
# v1 scope:
#   gh pr create (non-draft, has Ref: TEAM-<id> in body) → update-status in-review
#   gh pr merge  (has Ref: TEAM-<id> in body)            → update-status done
#
# Optional-ref semantics: if no Ref: TEAM-<id> in the PR body, the hook is
# a silent no-op. Never blocks or affects the Bash tool result.
# Never writes to stdout/stderr — logs go to ${LINEAR_HOOK_LOG_OVERRIDE:-/tmp/linear-hook.log}.

set -u

LOG="${LINEAR_HOOK_LOG_OVERRIDE:-/tmp/linear-hook.log}"
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-}"

log() {
  echo "[linear-pr-transitions] $(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >> "$LOG" 2>/dev/null || true
}

[ "${LINEAR_HOOKS_DISABLED:-0}" = "1" ] && { log "LINEAR_HOOKS_DISABLED=1 — skip"; exit 0; }

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_input', {}).get('command', ''))
" 2>/dev/null || echo "")

STDOUT=$(echo "$INPUT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
out = d.get('tool_response', d.get('tool_output', d.get('stdout', '')))
if isinstance(out, dict):
    out = out.get('stdout', '')
print(str(out))
" 2>/dev/null || echo "")

EXIT_CODE=$(echo "$INPUT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
out = d.get('tool_response', d.get('tool_output', {}))
if isinstance(out, dict):
    print(out.get('exit_code', out.get('returncode', 0)))
else:
    print(0)
" 2>/dev/null || echo "0")

# Only act on successful commands
if [ "$EXIT_CODE" != "0" ]; then
  exit 0
fi

# Extract a team-agnostic Ref: TEAM-<id> from body text.
extract_ref() {
  local body="$1"
  # Case-insensitive match; capture just the identifier part
  echo "$body" | grep -Eio 'Ref:[[:space:]]*[A-Za-z]+-[0-9]+' | head -1 | \
    grep -Eio '[A-Za-z]+-[0-9]+' | tr '[:lower:]' '[:upper:]' || true
}

# Fetch PR body for a given PR number or URL argument.
pr_body_for_arg() {
  local pr_arg="$1"
  gh pr view "$pr_arg" --json body --jq .body 2>>"$LOG" || true
}

# Fetch PR body from a PR URL extracted from stdout.
pr_body_for_url() {
  local pr_url="$1"
  local pr_number
  pr_number=$(echo "$pr_url" | grep -oE '/pull/[0-9]+' | grep -oE '[0-9]+' || true)
  if [ -z "$pr_number" ]; then
    return 1
  fi
  gh pr view "$pr_number" --json body --jq .body 2>>"$LOG" || true
}

# Transition a Linear issue to a target state via the node CLI.
transition_ref() {
  local ref_id="$1"
  local target_state="$2"
  local context="$3"
  if [ -z "$ref_id" ]; then
    return 0
  fi
  log "$context: transitioning $ref_id -> $target_state"
  if [ -z "$PLUGIN_ROOT" ]; then
    log "$context: CLAUDE_PLUGIN_ROOT unset — cannot call linear.mjs"
    return 0
  fi
  (
    node "${PLUGIN_ROOT}/scripts/linear.mjs" update-status "$ref_id" "$target_state" >> "$LOG" 2>&1 || \
      log "$context: update-status failed for $ref_id -> $target_state"
  ) &
}

# === gh pr create (non-draft only) ===
if echo "$COMMAND" | grep -qE 'gh[[:space:]]+pr[[:space:]]+create'; then
  # Drop draft PRs for v1
  if echo "$COMMAND" | grep -qE '(^|[[:space:]])--draft([[:space:]]|$)'; then
    log "gh pr create --draft — skipping (v1: draft not handled)"
    exit 0
  fi
  CLEAN=$(echo "$STDOUT" | tr -d '\\' | tr -d '\n' | tr -d '\r')
  PR_URL=$(echo "$CLEAN" | grep -oE 'https://github\.com/[^[:space:]"]*pull/[0-9]+' | head -1 || true)
  if [ -z "$PR_URL" ]; then
    log "gh pr create: no PR URL found in stdout — skipping"
    exit 0
  fi
  BODY=$(pr_body_for_url "$PR_URL")
  if [ -z "$BODY" ]; then
    log "gh pr create: failed to fetch body for $PR_URL — skipping"
    exit 0
  fi
  REF_ID=$(extract_ref "$BODY")
  if [ -z "$REF_ID" ]; then
    log "gh pr create: no Ref: TEAM-<id> in body — skipping"
    exit 0
  fi
  transition_ref "$REF_ID" "in-review" "gh pr create"
  exit 0
fi

# === gh pr merge ===
if echo "$COMMAND" | grep -qE 'gh[[:space:]]+pr[[:space:]]+merge'; then
  PR_ARG=$(echo "$COMMAND" | grep -oE 'gh[[:space:]]+pr[[:space:]]+merge[[:space:]]+[^[:space:]]+' | awk '{print $4}' || true)
  if [ -z "$PR_ARG" ]; then
    log "gh pr merge: no PR number/URL in command — skipping"
    exit 0
  fi
  BODY=$(pr_body_for_arg "$PR_ARG")
  if [ -z "$BODY" ]; then
    log "gh pr merge: failed to fetch body for $PR_ARG — skipping"
    exit 0
  fi
  REF_ID=$(extract_ref "$BODY")
  if [ -z "$REF_ID" ]; then
    log "gh pr merge: no Ref: TEAM-<id> in body — skipping"
    exit 0
  fi
  transition_ref "$REF_ID" "done" "gh pr merge"
  exit 0
fi

exit 0
