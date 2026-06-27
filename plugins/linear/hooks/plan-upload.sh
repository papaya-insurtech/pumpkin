#!/usr/bin/env bash
# plan-upload.sh — PostToolUse hook for ExitPlanMode.
#
# When the user approves a plan and Claude Code exits plan mode, the plan
# content is in tool_input. If the current session is linked to a Linear
# issue (via the session link file), upload the plan as a Linear comment.
# Silent no-op otherwise. Never blocks plan-mode exit.
# All logs go to ${LINEAR_HOOK_LOG_OVERRIDE:-/tmp/linear-hook.log}.

set -u

LOG="${LINEAR_HOOK_LOG_OVERRIDE:-/tmp/linear-hook.log}"
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-}"

log() {
  echo "[linear-plan-upload] $(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >> "$LOG" 2>/dev/null || true
}

if [ -z "$PLUGIN_ROOT" ]; then
  log "CLAUDE_PLUGIN_ROOT unset — skipping"
  exit 0
fi

INPUT=$(cat)

SESSION_ID=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('session_id', ''))
except Exception:
    pass
" 2>/dev/null || echo "")

PLAN=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    ti = d.get('tool_input', {})
    plan = ti.get('plan') or ti.get('content') or ''
    print(plan)
except Exception:
    pass
" 2>/dev/null || echo "")

if [ -z "$SESSION_ID" ]; then
  log "no session_id — skipping"
  exit 0
fi
if [ -z "$PLAN" ]; then
  log "no plan content in tool_input — skipping"
  exit 0
fi

[ "${LINEAR_HOOKS_DISABLED:-0}" = "1" ] && { log "LINEAR_HOOKS_DISABLED=1 — skip"; exit 0; }

# Only fire if the session is linked to a Linear issue.
# shellcheck disable=SC1091
. "${PLUGIN_ROOT}/hooks/lib/resolve-link-path.sh"
LINK_FILE=$(linear_link_file_existing "$SESSION_ID") || {
  log "session $SESSION_ID not linked — skipping"
  exit 0
}

log "uploading plan for session $SESSION_ID"

(
  export CLAUDE_SESSION_ID="$SESSION_ID"
  printf '%s' "$PLAN" | node "${PLUGIN_ROOT}/scripts/linear.mjs" upload-plan --plan-stdin --session "$SESSION_ID" >> "$LOG" 2>&1 || \
    log "upload-plan failed for session $SESSION_ID"
) &

exit 0
