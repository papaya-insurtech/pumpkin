#!/usr/bin/env bash
# session-start.sh — SessionStart hook.
#
# Fires on every SessionStart (startup, resume). Posts a "session resumed"
# comment to the linked Linear issue at most once per calendar day per
# (issue, engineer) pair. Silent no-op for unlinked sessions, /compact
# continuations, missing env vars, or repeat same-day runs by the same engineer.
# Never blocks startup. All logs go to ${LINEAR_HOOK_LOG_OVERRIDE:-/tmp/linear-hook.log}.

set -u

LOG="${LINEAR_HOOK_LOG_OVERRIDE:-/tmp/linear-hook.log}"
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-}"

log() {
  echo "[linear-session-start] $(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >> "$LOG" 2>/dev/null || true
}

if [ -z "$PLUGIN_ROOT" ]; then
  log "CLAUDE_PLUGIN_ROOT unset — skip"
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

SOURCE=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('source', ''))
except Exception:
    pass
" 2>/dev/null || echo "")

[ -z "$SESSION_ID" ] && { log "no session_id — skip"; exit 0; }

# /compact continuations are not real 'resume' events
if [ "$SOURCE" = "compact" ]; then
  log "source=compact — skip"
  exit 0
fi

[ "${LINEAR_HOOKS_DISABLED:-0}" = "1" ] && { log "LINEAR_HOOKS_DISABLED=1 — skip"; exit 0; }

# shellcheck disable=SC1091
. "${PLUGIN_ROOT}/hooks/lib/resolve-link-path.sh"
LINK_FILE=$(linear_link_file_existing "$SESSION_ID") || {
  log "session $SESSION_ID not linked — skip"
  exit 0
}

# Run in background so SessionStart hook never blocks startup.
(
  export CLAUDE_SESSION_ID="$SESSION_ID"

  TODAY=$(date +%Y-%m-%d)
  EMAIL=$(git config user.email 2>/dev/null || echo "unknown")
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  WORKTREE=$(basename "${CLAUDE_PROJECT_DIR:-$(pwd)}")
  SHORT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

  # Read the linked issue identifier from the session link file.
  ISSUE_ID=$(python3 -c "
import sys, json
try:
    with open('${LINK_FILE}') as f:
        d = json.load(f)
    print(d.get('issueIdentifier', ''))
except Exception:
    pass
" 2>/dev/null || echo "")

  if [ -z "$ISSUE_ID" ]; then
    log "session $SESSION_ID: no issueIdentifier in link file — skip"
    exit 0
  fi

  # Per-day dedup check: look for lastSessionStartCommentDate + lastSessionStartEngineerEmail
  LAST_DATE=$(python3 -c "
import sys, json
try:
    with open('${LINK_FILE}') as f:
        d = json.load(f)
    print(d.get('lastSessionStartCommentDate', ''))
except Exception:
    pass
" 2>/dev/null || echo "")

  LAST_EMAIL=$(python3 -c "
import sys, json
try:
    with open('${LINK_FILE}') as f:
        d = json.load(f)
    print(d.get('lastSessionStartEngineerEmail', ''))
except Exception:
    pass
" 2>/dev/null || echo "")

  if [ "$LAST_DATE" = "$TODAY" ] && [ "$LAST_EMAIL" = "$EMAIL" ]; then
    log "session $SESSION_ID: already posted today ($TODAY) for $EMAIL — skip"
    exit 0
  fi

  MARKER="session-start:${TODAY}:${EMAIL}"
  BODY=$(cat <<MSG
Claude Code session resumed
- Engineer: ${EMAIL}
- Branch: ${BRANCH}
- Worktree: ${WORKTREE}
- Last commit: ${SHORT_SHA}

<!-- ${MARKER} -->
MSG
)

  printf '%s' "$BODY" | node "${PLUGIN_ROOT}/scripts/linear.mjs" add-comment "$ISSUE_ID" - --dedupe-marker "$MARKER" >> "$LOG" 2>&1
  EC=$?
  if [ "$EC" = "0" ]; then
    # Update cache in the link file.
    python3 -c "
import sys, json
try:
    with open('${LINK_FILE}') as f:
        d = json.load(f)
    d['lastSessionStartCommentDate'] = '${TODAY}'
    d['lastSessionStartEngineerEmail'] = '${EMAIL}'
    with open('${LINK_FILE}', 'w') as f:
        json.dump(d, f, indent=2)
except Exception as e:
    sys.exit(str(e))
" 2>>"$LOG"
    log "session $SESSION_ID: POSTED -> $ISSUE_ID"
  else
    log "session $SESSION_ID: add-comment exit $EC"
  fi
) &

exit 0
