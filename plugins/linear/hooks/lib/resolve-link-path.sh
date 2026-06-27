#!/usr/bin/env bash
# resolve-link-path.sh — shared helper for Linear hooks.
#
# Source this file from a hook to get functions for resolving where a
# session's linear.json lives. Mirrors the logic in scripts/lib/session.mjs
# so hooks (which run as plain bash) stay consistent with the JS layer.
#
#   linear_state_root            → echoes <git-common-dir>/.claude-linear
#                                  (shared across all worktrees of the repo)
#   linear_link_file <sid>       → echoes new-style absolute linear.json path
#   linear_legacy_link_file <sid>→ echoes legacy per-worktree absolute path
#   linear_link_file_existing <sid>
#                                → echoes whichever path actually exists, preferring new.
#                                  Returns exit code 1 (and no output) if neither exists.
#
# Anchors via `git rev-parse` from $CLAUDE_PROJECT_DIR (or $PWD if unset).

linear__anchor_cwd() {
  if [ -n "${CLAUDE_PROJECT_DIR:-}" ] && [ -d "${CLAUDE_PROJECT_DIR:-}" ]; then
    printf '%s' "$CLAUDE_PROJECT_DIR"
  else
    printf '%s' "$PWD"
  fi
}

linear_state_root() {
  local cwd output rc
  cwd=$(linear__anchor_cwd)
  if ! command -v git >/dev/null 2>&1; then
    echo "linear_state_root: git binary not found in PATH" >&2
    return 1
  fi
  output=$(git -C "$cwd" rev-parse --path-format=absolute --git-common-dir 2>&1)
  rc=$?
  if [ $rc -ne 0 ]; then
    case "$output" in
      *"not a git repository"*) return 1 ;;
      *)
        echo "linear_state_root: git failed in $cwd (rc=$rc): $output" >&2
        return 1
        ;;
    esac
  fi
  printf '%s/.claude-linear' "$output"
}

linear_link_file() {
  local sid="$1" root
  [ -z "$sid" ] && return 1
  root=$(linear_state_root) || return 1
  printf '%s/%s/linear.json' "$root" "$sid"
}

linear_legacy_link_file() {
  local sid="$1" cwd top
  [ -z "$sid" ] && return 1
  cwd=$(linear__anchor_cwd)
  top=$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null) || return 1
  printf '%s/.claude/sessions/%s/linear.json' "$top" "$sid"
}

linear_link_file_existing() {
  local sid="$1" new legacy
  new=$(linear_link_file "$sid") || return 1
  if [ -f "$new" ]; then
    printf '%s' "$new"
    return 0
  fi
  legacy=$(linear_legacy_link_file "$sid") || return 1
  if [ -f "$legacy" ]; then
    printf '%s' "$legacy"
    return 0
  fi
  return 1
}
