# Linear plugin — reference documentation

> **Note:** Claude Code plugins do NOT auto-load a `rules/` directory. This
> file is standalone reference documentation. The agent body
> (`../agents/linear.md`) summarises the operative rules. Link to this file
> from your plugin README for the full details.

Issue tracker is Linear. The team key is configured via the `LINEAR_TEAM_KEY`
environment variable (e.g. `YOUR-KEY`). Issue refs take the form `TEAM-<id>`.

## Linear ref is OPTIONAL on every PR, bug, feature

Engineers decide per unit of work:

- Pick an existing `TEAM-<id>` and start from it, OR
- Open a PR with no Linear ref (treat Linear as "didn't bother"), OR
- Create a `TEAM-<id>` and link it to an in-progress PR, OR
- Ignore Linear entirely.

**Claude Code never demands a `TEAM-<id>`.** Scripts and hooks are silent
no-ops when no ref is present.

## Workflow states

| State | Meaning |
|---|---|
| Backlog | Accepted, not yet scoped |
| Todo | **Serves as "Ready"** — scoped, pickable |
| In Progress | Dev coding. Draft PR is fine in this state. |
| In Review | PR is ready-for-review (not draft) |
| Blocked | Waiting on external dependency |
| Done | PR merged. Prod deploy is tracked separately, if at all. |
| Canceled / Duplicate | Won't fix / consolidated |

No `In QC` state — QC is out of scope of this setup; no CI-driven handoff.

## State transitions Claude Code drives

Only fire when PR body contains `Ref: TEAM-<id>`:

- `hooks/linear-pr-transitions.sh`
  - On `gh pr create` (non-draft) → Linear issue → `In Review`.
  - On `gh pr merge` → Linear issue → `Done`.
  - On `--draft` PRs: no transition (stays `In Progress`).

`/linear-pick-task` picks a `Todo` issue → `In Progress`, assigns caller.

No ref? The hook is a silent no-op. All logs land in
`${LINEAR_HOOK_LOG_OVERRIDE:-/tmp/linear-hook.log}`.
Linear unreachable? Hook never blocks PR create/merge — fails silently.

## Session ↔ Linear issue linking

A Claude Code session can be attached to a Linear issue so plans and
context travel with the issue between engineers. **Linking is optional**;
an engineer who never runs `/linear-link-session` never touches Linear.

- **Mapping storage**: `<git-common-dir>/.claude-linear/<session-id>/linear.json`
  — anchored on `git rev-parse --path-format=absolute --git-common-dir` so
  the file lives inside `.git/` (per-engineer, never committed) and is
  identical across the primary checkout AND every worktree of the same
  repo. Survives `git worktree remove` and `EnterWorktree` / `ExitWorktree`.
  Legacy `.claude/sessions/<session-id>/linear.json` is still read as a
  fallback during the migration window.
- **Session id source**:
  - `$CLAUDE_SESSION_ID` when Claude Code sets it.
  - `<worktree-top-level>/.claude/.current-session-id` (written by the
    SessionStart hook, anchored on `git rev-parse --show-toplevel`) —
    survives `/compact`.
- **Plans on Linear**: each plan upload creates a Linear **Document**
  attached to the issue (holds the full markdown, shown in the issue's
  sidebar automatically) and a short **note comment** linking to the
  document. Nothing is ever deleted; multiple plans per issue is the norm.
- **Auto-upload via hook**: `hooks/linear-plan-upload.sh` fires on
  `ExitPlanMode` — if the session is linked at that moment, the approved
  plan uploads automatically. Silent no-op when session not linked.
- **Handoff**: a second engineer who picks up the same issue just runs
  `/linear-link-session TEAM-NN` and sees every prior plan on the issue
  in Linear (comments + attachments).

Slash commands: `/linear-link-session`, `/linear-upload-plan`,
`/linear-session-info`, `/linear-unlink-session`.

### MANDATORY: Read full issue context before acting on any Linear issue

The issue body is NOT the full context. Comments carry decisions and
merge timelines; documents carry uploaded plans (often multi-hundred
lines); attachments carry external links / session markers. Working
from the body alone = missing state.

**Rule:** before taking any non-trivial action on a Linear issue —
commenting, transitioning state, writing a PR body that references it,
answering a question about it, creating follow-up issues off it — Claude
Code MUST run
`node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" read-issue <TEAM-NN>`
and read its output in full.

The script prints, in one pass:

1. **Header** — identifier, title, state, priority, assignee, labels,
   project, URL, created/updated timestamps.
2. **Description** — the full markdown body.
3. **Attachments** — every attached link (title, subtitle, URL).
4. **Documents** — every uploaded plan / doc attached via `issueId`
   (title + URL; add `--with-doc-bodies` to inline the markdown when
   the plan content matters for the decision at hand).
5. **Comments** — every comment in chronological order with author +
   timestamp.

**Triggers that require `read-issue` first**:

- Engineer says "work on TEAM-NN" / "pick up TEAM-NN" / "what's on TEAM-NN".
- About to run `start-task`, `update-status`, or `add-comment`.
- About to open a PR whose body references `TEAM-NN`.
- About to file a follow-up issue that descends from an existing one.
- Resuming a session via `/linear-link-session TEAM-NN` for another
  engineer's work.

**Skip only when**:

- The issue was read in the CURRENT conversation (within the last few
  turns) AND no new comments or documents have been posted since.
- The action is purely mechanical (e.g. the hook-driven
  `In Review` / `Done` transition from `linear-pr-transitions.sh` —
  that's a status update, not a content-driven action).

`--json` is available for structured parsing when Claude Code needs to
extract specific fields programmatically.

### Summary vs detail — the main agent picks the read path

`read-issue` content can reach the main agent two ways, and the main
agent chooses per situation:

- **Summary (default)** — dispatch the `linear` sub-agent
  (`agents/linear.md`). It runs `read-issue` and returns a bounded
  ≤300-line digest: description summarised to ≤300 words, older comments
  paginated, documents listed but not inlined. High-signal, context-cheap.
  Right for "what's the state of TEAM-N", quick status checks, and most
  mutations' read-before-write.
- **Detail (full fidelity)** — run
  `node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" read-issue <TEAM-N> --with-doc-bodies`
  **inline** (no sub-agent). Every byte lands verbatim in the main agent's
  context: full description, every comment, inlined document bodies. The
  sub-agent digest is lossy *by design* — when you need the real content,
  go inline. This is a sanctioned exception to "always dispatch the
  sub-agent for Linear CRUD".

**Choose detail when** any of these hold:

- You're about to write product code / a migration / a config change from
  the issue's spec or acceptance criteria.
- You're debugging from error logs, stack traces, or repro steps that live
  in the comments.
- A multi-hundred-line plan / spec document is attached and its content
  drives the decision (pass `--with-doc-bodies`).
- You're reconciling a long or contradictory comment thread.
- A prior sub-agent digest **flagged** that it compressed significant
  content (its "Outstanding items" names a truncated body / omitted
  comments / un-inlined documents).

Otherwise the summary path is enough. When unsure and the cost of missing
a detail is high, prefer detail — it's one inline command.

### MANDATORY: Plan upload on every link / create / pick

The `ExitPlanMode` hook only covers the case where the session was ALREADY
linked before the plan was approved. The late-link case (plan drafted first,
Linear issue created or picked later) is NOT covered by the hook — Claude
Code must handle it explicitly. **Rule:**

Whenever an AI-authored or AI-driven workflow attaches a session to a
Linear issue — i.e. any of the moments below — the active plan (if one
exists under `~/.claude/plans/`) MUST be uploaded to the issue in the
same turn:

1. **Creating a new issue** during the session (any verb that calls
   `createIssue`) → run `upload-plan --plan-file <latest> --issue TEAM-NN`
   directly after the create returns.
2. **Picking or linking an existing issue** via `/linear-pick-task` or
   `/linear-link-session` → pass `--upload-plan` (or run
   `upload-plan` as a follow-up step).
3. **Transitioning a session to Linear** mid-way (e.g. engineer asks
   "file a Linear issue for this"): create the issue, then upload the
   plan in the same action — do not wait for the next `ExitPlanMode`.

Dedup is automatic — `upload-plan` computes a digest and skips if
the same plan already landed on the issue. Uploading the same plan twice
is a no-op, so when in doubt, upload.

**Identifying "the active plan"**: the most recently modified file under
`~/.claude/plans/` (matches `findMostRecentPlan()` in the upload-plan
verb). If no plan exists yet, skip — do NOT fabricate one.

**Skip when**: the user explicitly says "don't upload the plan" or the
issue being created is unrelated to the current session's work (e.g.
filing a bug for a different feature).

## Labels

Five groups:

- **Type** (exactly one): `feature`, `bug`, `improvement`, `tech-debt`,
  `spike`, `docs`, `incident`, `change-request`.
- **Area** (**exactly one** — Linear enforces group exclusivity server-side):
  Set up per your team via `setup-team` in the scripts. The Linear API
  rejects two labels from the same parent group. Pick the primary Area;
  add free-form labels for the rest.
- **Source** (zero or one): `internal`, `customer-request`, `post-deploy`.
- **Authorship** (zero or one): `ai-drafted`, `ai-suggested`.
  Separate from Source so an AI-drafted post-deploy issue can carry both.
- **env** (zero or one; **required** on `Type: bug` / `Type: incident`):
  `env:prod`, `env:test`, `env:sit`, `env:uat`.

Every AI-authored issue MUST carry `ai-drafted` or `ai-suggested`.

Batch of ≥ 3 issues requires a human-gate proposal step. Single issues may
be created directly when the ask is explicit.

## PII rule — narrow

NO **full names, DOBs, government ID numbers, or gender** in Linear
titles / descriptions / comments. Claim codes / claim IDs (CLM-*, CLAIM-*)
are OK. Sanitizer regex enforces DOB + ID; name + gender stay rule-only.
The `pii-scan` library in `scripts/lib/` is the single source of truth.

## Branch naming

- With a picked issue: `{type}/${LINEAR_TEAM_KEY}-{id}-{slug}`.
- Without a picked issue: existing convention `{type}/{slug}`. Unchanged.

PR body: `Ref: ${LINEAR_TEAM_KEY}-{id}` when a Linear ref applies.
Never `Closes TEAM-{id}`.

## Issue relationships — use Linear's native links

Linear has two distinct linking mechanisms; they are NOT interchangeable.

| Mechanism | When to use | How |
|---|---|---|
| **Parent / sub-issue** (`parentId`) | Decomposing one issue into smaller pieces of the same work — "this is part of that". Single parent, hierarchical, shows in the parent's sub-issues panel. | `--parent <TEAM-N>` on `create-issue`, or `link-issues TEAM-CHILD --parent TEAM-PARENT`. |
| **Issue relation** (`createIssueRelation`) | Peer connections between separate units of work — `related`, `blocks` / `blocked-by`, `duplicate`. Many-to-many, surfaces in the sidebar + blocks views. | `--related-to` / `--blocks` / `--blocked-by` / `--duplicate-of` on `create-issue`, or `link-issues`. |

**Rule:** when you create a follow-up issue, an experiment ticket, a
spawned bug, or any issue that descends from an active one, you MUST
attach it via the appropriate native link. **Never** rely on a
`Ref: TEAM-N` string in the description as the only connection — that's
not searchable, not visible in the sidebar, and rots the moment one
side is renamed.

```bash
# Create a follow-up that's RELATED to the source
node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" create-issue \
  --project "My Project" --title "Investigate cache drop" \
  --related-to TEAM-123

# Create a sub-issue under an epic
node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" create-issue \
  --project "My Project" --title "Hook up extraction stub" \
  --parent TEAM-200

# Link two existing issues
node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" link-issues TEAM-501 --blocked-by TEAM-487
node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" link-issues TEAM-501 --related-to TEAM-487,TEAM-490 --comment

# Bulk follow-ups all linked back to a source
printf "%s\n" "router cache regression" "cold start regression" \
  | node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" propose-followups \
      --project "My Project" --source TEAM-123 --go

# File a bug discovered while working a known issue
node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" log-bug \
  --title "Cache miss on tenant switch" \
  --area platform --env prod --severity S2 \
  --description "..." --related-to TEAM-456
```

**Direction matters for `blocks`.** The flag `--blocks TEAM-X` means
"this issue blocks TEAM-X". Use `--blocked-by TEAM-X` for the inverse —
the script flips operands so you don't have to think about it.

**Reading the graph.** `read-issue <TEAM-N>` prints a "Related issues"
section listing parent, sub-issues, and every `blocks` /
`blocked-by` / `related` / `duplicate-of` peer. Treat that section as
required context: a follow-up issue "log this as a duplicate" cannot be
answered by the description alone; you need to see the existing
duplicates to avoid double-filing.

**Description text is OK as enrichment, not as the link.** It's fine
to write "Spawned from the Apr 30 deploy (see related issues)" in the
body. It's not fine to write "blocks TEAM-123" in the body without
ALSO calling `link-issues … --blocks TEAM-123`.

## Tool priority

0. **Dispatch the `linear` sub-agent** (`agents/linear.md`) — DEFAULT
   for the main agent. Use whenever you're about to run Linear CRUD as part
   of larger work. Returns a bounded digest instead of dumping raw script
   output into your context. See "Sub-agent routing" below for the exact
   skip conditions.
1. `node "${CLAUDE_PLUGIN_ROOT}/scripts/linear.mjs" <verb> [args]` — Use
   inline when (a) you ARE the `linear` sub-agent, (b) a `/linear-*` slash
   skill triggered the call, (c) a Linear hook fired, OR (d) the user
   explicitly asked for raw output.
2. Linear MCP — last resort. Flag every MCP use in the digest's
   "PII / rule flags" section.

Common read/write verbs:

- `read-issue <TEAM-NN>` — print full context (description + **related
  issues** + attachments + documents + comments). **Call this first**
  before any non-trivial action.
- `pick-task` / `start-task <TEAM-NN>` — list Todo issues, claim one.
- `create-issue` — generic issue creator, two modes:
  - **Quick-capture**: `--project "<p>" --title "<idea>" [--labels "a,b"] [--priority 3]`.
    When `--description` is omitted, inserts a placeholder body following the
    Problem / Proposal / Scope / Out of scope / Open questions template with
    `_TBD_` filler in each section — author fills later.
  - **Batch**: JSON array on stdin (`{ title, description?, labels?, priority? }`),
    plus `--go` for ≥ 3 entries.
  Auto-applies `ai-drafted` / `ai-suggested`. Rejects multi-Area-label drafts.
  Supports relationship flags:
  `--parent`, `--related-to`, `--blocks`, `--blocked-by`, `--duplicate-of`.
- `link-issues <TEAM-N> [--parent|--related-to|--blocks|--blocked-by|--duplicate-of] <TEAM-M>` —
  link two existing issues using Linear's native relations.
- `log-bug` — single bug with required env + severity labels. Supports
  the same relationship flags as `create-issue`.
- `add-comment <TEAM-NN> "<message>"` — post a comment (PII-scanned).
- `update-status <TEAM-NN> <state>` — move an issue between workflow states.
- `update-issue <TEAM-NN> [--title][--description|-][--due YYYY-MM-DD|none]
  [--priority none|urgent|high|medium|low][--assignee <email>|none][--milestone
  "<name>"|none]` — general scalar editor for an issue's own fields.
- `set-project <TEAM-NN> --project "<name|id>"` — set an issue's Project.
- `update-milestone --project "<name>" --milestone "<name>" [--target-date
  YYYY-MM-DD|none] [--name "<new>"]` — edit a ProjectMilestone.
- `link-session <TEAM-NN> [--upload-plan]` — attach current session, upload
  the active plan in one step.
- `upload-plan --plan-file <path> --issue <TEAM-NN>` — upload a specific
  plan (bypasses session link; use after creating an issue mid-session).
- `project-status`, `propose-followups`, `triage-todos`, `list-my-issues`,
  `session-info`, `unlink-session`.

### When nothing fits

If no verb covers your need, fall through to Linear MCP as a last resort,
and flag the gap in the digest's "PII / rule flags" section.

## Sub-agent routing

**Main-agent rule (MUST):** when about to run any Linear script as part of
larger work, dispatch the `linear` sub-agent (`agents/linear.md`) instead
of running the script inline. Inline execution is allowed ONLY in the
skip-cases listed below.

The sub-agent returns a bounded Markdown digest (≤300 lines, stable
section headers: `Action`, `Result`, `Issue state`, `Key content`,
`Related issues touched`, `Outstanding items`, `PII / rule flags`) so the
main agent gets high-signal Linear context without 500-2000 lines of raw
script output polluting its prompt cache for the rest of the session.

**Skip the sub-agent and run scripts directly when:**

- The user invoked a `/linear-*` slash skill (those run scripts on their
  own).
- A Linear hook fired (PR-transitions, plan-upload, session-start — all
  silent and agentless).
- The user explicitly asked for raw script output ("just run it",
  "show me the raw output", "don't summarise").
- You need **full-fidelity** issue content (the detail path) — run
  `read-issue <TEAM-N> --with-doc-bodies` inline. The sub-agent digest is
  lossy by design, so routing detail through it both risks dropping content
  and double-spends tokens (once in the sub-agent, again relaying it back).

## Personal API key

Lives at `~/.config/claude-linear/api-key`, file mode `0600`. NEVER in
`.env` (that's application/system env). NEVER in shared credential stores
(other engineers could read your key). Scripts resolve via
`process.env.LINEAR_API_KEY` then the local file.

The Linear GraphQL endpoint is `https://api.linear.app/graphql`.
Personal API keys are sent raw in the `Authorization` header (no `Bearer`
prefix), with `Content-Type: application/json`.

## Lifecycle checkpoints — what auto-fires

Linked sessions and PRs with `Ref: TEAM-N` get automated state transitions
and timeline comments at these moments. **All silent no-ops** when the
session is not Linear-linked OR the PR body has no `Ref: TEAM-N`.

| Moment | Action | Hook / script |
|---|---|---|
| `ExitPlanMode` | Upload plan as Linear comment + Document | `linear-plan-upload.sh` |
| `gh pr create` (non-draft) | Transition → In Review | `linear-pr-transitions.sh` |
| `gh pr merge` | Transition → Done | `linear-pr-transitions.sh` |
| `SessionStart` (linked, not /compact) | Post resume comment (≤1/day/engineer) | session-start hook |

### Opt-out

Three layers, finest first:

1. Per-session: `/linear-unlink-session` removes `linear.json` — all hooks
   no-op. (PR-event hooks: remove `Ref: TEAM-N` from your PR body or
   unlink the session.)
2. Per-engineer: `LINEAR_HOOKS_DISABLED=1` in shell env — all three hooks
   (PR-transitions, plan-upload, session-start) exit silently.
3. Nuclear: remove hook entries from the plugin's hooks config.

## Load this reference when

- Creating / updating any Linear issue.
- Running any `scripts/linear.mjs` verb.
- Invoking `/linear-pick-task`, `/linear-log-bug`, `/linear-status`,
  `/linear-propose-followups`, `/linear-triage-todos`.
- Writing a PR body that will reference `TEAM-<id>`.
- Starting a worktree whose name contains a Linear issue ID.

## Skip when

- Pure code reading.
- Infra-only or docs-only changes.
- Tasks that don't touch the issue tracker.
