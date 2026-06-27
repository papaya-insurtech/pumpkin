# Linear plugin for Claude Code

Integrates [Linear](https://linear.app) into Claude Code via a dependency-free Node CLI, eight `/linear-*` slash skills, an AI sub-agent, and three lifecycle hooks. Everything is scripts-first; Linear MCP is a fallback of last resort.

## Prerequisites

- **Node.js 18+** (ESM, global `fetch` — no `npm install`, no Bun, no external packages)
- A [Linear personal API key](https://linear.app/settings/api) (not an OAuth token)
- `gh` CLI (for PR-transition hooks)

## Setup

### 1. Store your API key

Option A — environment variable (preferred for CI / shared machines):
```bash
export LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxx
```

Option B — local file (preferred for personal machines; survives shell restarts):
```bash
mkdir -p ~/.config/claude-linear
echo "lin_api_xxxxxxxxxxxxxxxx" > ~/.config/claude-linear/api-key
chmod 600 ~/.config/claude-linear/api-key
```

Resolution order: `LINEAR_API_KEY` env → `~/.config/claude-linear/api-key` (mode 600) → fail with setup instructions.

### 2. Set your team key

```bash
export LINEAR_TEAM_KEY=YOUR-TEAM    # e.g. ENG, CORE, INFRA
```

Add both variables to your shell profile (`~/.zshrc`, `~/.bashrc`) to make them permanent.

### 3. Install the plugin

Inside a Claude Code session:
```
/plugin install linear@papaya-pumpkin
```

The plugin sets `CLAUDE_PLUGIN_ROOT` automatically after install.

## Skills (`/linear-*`)

Eight slash skills are available. Invoke them by name inside Claude Code.

| Skill | What it does |
|---|---|
| `/linear-pick-task` | List `Todo` (Ready) issues; claim one → `In Progress`, assign to you |
| `/linear-link-session` | Attach the current Claude Code session to a Linear issue |
| `/linear-session-info` | Show the Linear issue + uploaded plans linked to the current session |
| `/linear-log-bug` | File a bug with required Type / Area / env labels and PII scan |
| `/linear-status` | Print a project's WIP per state, milestone breakdown, and project update link |
| `/linear-upload-plan` | Upload the active plan from `~/.claude/plans/` to the linked issue |
| `/linear-triage-todos` | Scan repo for `TODO`/`FIXME`/`HACK` comments; propose tech-debt issues (human-gated) |
| `/linear-propose-followups` | Draft post-deploy follow-up issues from observations; human-gated before creating |

## CLI reference

Every operation the plugin performs is available as a standalone CLI verb. Useful for scripting, debugging, and confirming what the plugin will do.

```bash
node plugins/linear/scripts/linear.mjs --help
```

Full verb list:

| Verb | Purpose |
|---|---|
| `read-issue <TEAM-N>` | Full issue context: description, related issues, attachments, documents, comments |
| `pick-task` | List `Todo` issues and pick one interactively |
| `start-task <TEAM-N>` | Claim an issue → `In Progress`, assign to you |
| `update-status <TEAM-N> <state>` | Move an issue to a new workflow state |
| `update-issue <TEAM-N> [flags]` | Edit title, description, due date, priority, assignee, milestone |
| `add-comment <TEAM-N> "<text>"` | Post a comment (PII-scanned before sending) |
| `list-my-issues` | List all issues assigned to you |
| `create-issue` | Create an issue (quick-capture or batch via stdin) |
| `log-bug` | Create a bug with required env + severity labels |
| `link-issues <TEAM-N> [--parent\|--related-to\|--blocks\|--blocked-by\|--duplicate-of] <TEAM-M>` | Connect two issues via Linear native relations |
| `set-project <TEAM-N> --project "<name>"` | Set an issue's project |
| `project-status` | Print a project's milestone + state breakdown |
| `link-session <TEAM-N>` | Attach current session to an issue |
| `session-info` | Show the issue linked to the current session |
| `unlink-session` | Remove the session → issue link |
| `upload-plan --plan-file <path> --issue <TEAM-N>` | Upload a plan as a Linear Document + comment |
| `triage-todos` | Scan repo TODOs and propose issues |
| `propose-followups` | Propose follow-up issues from a list of observations |

Add `--json` to most read verbs for structured output. Add `--with-doc-bodies` to `read-issue` to inline full document content.

```bash
# Examples
node plugins/linear/scripts/linear.mjs read-issue TEAM-123
node plugins/linear/scripts/linear.mjs list-my-issues --json
node plugins/linear/scripts/linear.mjs log-bug --title "Cache miss on tenant switch" --area platform --env prod --severity S2
node plugins/linear/scripts/linear.mjs link-issues TEAM-501 --blocked-by TEAM-487
```

## Hooks

Three hooks fire automatically at lifecycle events. All hooks are **silent no-ops** when the relevant condition (session link, `Ref:` line, or plan file) is absent. Logs go to `${LINEAR_HOOK_LOG_OVERRIDE:-/tmp/linear-hook.log}`.

### `pr-transitions.sh` (PostToolUse / Bash)

Watches every `gh` command. When the PR body contains `Ref: TEAM-<id>`:

| `gh` command | Linear transition |
|---|---|
| `gh pr create` (non-draft) | Issue → **In Review** |
| `gh pr merge` | Issue → **Done** |

Draft PRs and other PR commands (`gh pr ready`, `gh pr close`, `gh pr reopen`) are not handled in v1. The `Ref:` line is optional. PRs without it are unaffected.

### `plan-upload.sh` (PostToolUse / ExitPlanMode)

When the current session is linked to a Linear issue and you approve a plan (`ExitPlanMode`), the plan uploads automatically as a Linear Document attached to the issue plus a short note comment. Silent no-op when the session is not linked.

### `session-start.sh` (SessionStart)

When a session resumes and is linked to a Linear issue, posts a "session resumed" comment to the issue — at most once per calendar day per (issue, engineer) pair. Silent no-op for unlinked sessions, `/compact` continuations, and repeat same-day runs.

## Session linking

A Claude Code session can be attached to a Linear issue so plans travel with the issue between engineers:

```
/linear-link-session TEAM-123                           # attach and upload any active plan
/linear-session-info                                    # see what's linked
node scripts/linear.mjs unlink-session                  # detach the current session
```

The mapping is stored in `<git-common-dir>/.claude-linear/<session-id>/linear.json` — inside `.git/`, never committed, shared across all worktrees of the same repo.

Second engineer picking up the issue:
```
/linear-link-session TEAM-123          # sees all prior plans on the Linear issue
```

## Workflow states

| State | Meaning |
|---|---|
| Backlog | Accepted, not yet scoped |
| Todo | Ready to pick — scoped and estimated |
| In Progress | Dev coding (draft PR is fine here) |
| In Review | PR is ready for review (non-draft) |
| Blocked | Waiting on external dependency |
| Done | PR merged |
| Canceled / Duplicate | Won't fix / consolidated |

Linear refs (`Ref: TEAM-<id>` in PR bodies) are always optional. Claude Code never demands one — hooks and scripts are silent no-ops when no ref is present.

## Tool priority

The plugin always follows **scripts-first** routing:

1. **CLI script** (`scripts/linear.mjs <verb>`) — default for all operations.
2. **Linear sub-agent** (`agents/linear.md`) — main agent dispatches this instead of running scripts inline; returns a bounded ≤300-line Markdown digest.
3. **Linear MCP** — last resort only; every MCP use is flagged in the digest's "PII / rule flags" section.

## Reference documentation

Full workflow-state tables, session-linking details, PII policy, issue-relationship rules, label taxonomy, and the complete verb reference live in [`rules/linear.md`](rules/linear.md). That file is standalone reference documentation — it is not auto-loaded by Claude Code.

## Security notes

- API key is sent raw in the `Authorization` header (no `Bearer` prefix) — this is correct for Linear personal API keys.
- The key file must be mode `0600`; the scripts will refuse a world-readable key file.
- Never put the key in `.env`, shared credential stores, or version control.
- PII scan (DOB, government ID numbers) runs before every `create-issue`, `log-bug`, `add-comment`, and `update-issue` call; rejected content is surfaced rather than silently stripped.
