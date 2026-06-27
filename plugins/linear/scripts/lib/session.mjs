/**
 * session.mjs — Claude Code session <-> Linear issue mapping.
 *
 * Each Claude Code session can optionally be linked to one Linear issue.
 * The mapping is persisted at:
 *
 *   <git-common-dir>/.claude-linear/<session-id>/linear.json
 *
 * `git rev-parse --path-format=absolute --git-common-dir` returns the SAME
 * absolute path from the primary checkout AND every linked worktree of the
 * same repo. Anchoring there means session state survives worktree teardown
 * and is consistent across worktrees.
 *
 * Backward compatibility: prior versions stored links under
 *   <worktree>/.claude/sessions/<session-id>/linear.json
 * `readSessionLink` still falls back to that location (read-only).
 *
 * Session ID resolution order:
 *   1. $CLAUDE_SESSION_ID
 *   2. <worktree-top-level>/.claude/.current-session-id
 *   3. throw
 */

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

let cachedGitCommonDir;
let cachedRepoTopLevel;

function runGit(args, cwd) {
  return execFileSync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

/**
 * Absolute path to `.git/` for the repo containing `cwd`. Shared across all
 * worktrees of the same repo. Anchor for link storage.
 */
export function getGitCommonDir(cwd = process.cwd()) {
  if (cachedGitCommonDir) return cachedGitCommonDir;
  try {
    cachedGitCommonDir = runGit(
      ["rev-parse", "--path-format=absolute", "--git-common-dir"],
      cwd,
    );
    return cachedGitCommonDir;
  } catch (err) {
    throw new Error(
      `Cannot resolve git common dir from ${cwd}. Are you inside a git repo? (${err instanceof Error ? err.message : err})`,
    );
  }
}

/**
 * Top-level of the worktree containing `cwd`. Used for `.current-session-id`,
 * which IS intentionally per-worktree.
 */
export function getWorktreeTopLevel(cwd = process.cwd()) {
  if (cachedRepoTopLevel) return cachedRepoTopLevel;
  cachedRepoTopLevel = runGit(["rev-parse", "--show-toplevel"], cwd);
  return cachedRepoTopLevel;
}

/**
 * Resolves the current Claude Code session ID.
 *
 * 1. $CLAUDE_SESSION_ID
 * 2. <worktree-top-level>/.claude/.current-session-id
 * 3. throw
 */
export function getCurrentSessionId() {
  const fromEnv = process.env.CLAUDE_SESSION_ID?.trim();
  if (fromEnv) return fromEnv;
  const root = getWorktreeTopLevel();
  const file = join(root, ".claude", ".current-session-id");
  if (existsSync(file)) {
    const id = readFileSync(file, "utf8").trim();
    if (id) return id;
  }
  throw new Error(
    [
      "Cannot determine current Claude Code session ID.",
      "Tried:",
      "  1. $CLAUDE_SESSION_ID (not set)",
      `  2. ${file} (missing or empty)`,
      "",
      "The SessionStart hook .claude/hooks/claude-session-start.sh should have",
      "written this file. If you are running a script outside of a Claude Code",
      "session, pass --session <id> or export CLAUDE_SESSION_ID=<id>.",
    ].join("\n"),
  );
}

/** New-style absolute directory for a session's link state (shared across worktrees). */
export function sessionDir(sessionId) {
  return join(getGitCommonDir(), ".claude-linear", sessionId);
}

/** New-style absolute path to a session's linear.json. */
export function linkFile(sessionId) {
  return join(sessionDir(sessionId), "linear.json");
}

/** Legacy absolute path — worktree-anchored. Read-only fallback during migration. */
export function legacyLinkFile(sessionId) {
  const fromEnv = process.env.CLAUDE_PROJECT_DIR;
  let root;
  if (fromEnv && existsSync(join(fromEnv, ".git"))) {
    root = fromEnv;
  } else {
    root = getWorktreeTopLevel();
  }
  return join(root, ".claude", "sessions", sessionId, "linear.json");
}

function normalisePrEntry(raw) {
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw <= 0) {
      throw new Error(`Invalid PR number in legacy link file: ${raw}`);
    }
    return { prNumber: raw, isDraft: false, lastKnownState: null, deployVerifySpawned: false };
  }
  const n = Number(raw.prNumber);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid PR number in link file: ${JSON.stringify(raw.prNumber)}`);
  }
  return {
    prNumber: n,
    prUrl: raw.prUrl,
    prRef: raw.prRef,
    isDraft: raw.isDraft ?? false,
    lastKnownState: raw.lastKnownState ?? null,
    deployVerifySpawned: raw.deployVerifySpawned ?? false,
    attachmentId: raw.attachmentId,
  };
}

function parseLinkFile(file) {
  const raw = readFileSync(file, "utf8");
  const parsed = JSON.parse(raw);
  parsed.plans = parsed.plans ?? [];
  parsed.prs = (parsed.prs ?? []).map(normalisePrEntry);
  return parsed;
}

/**
 * Read the SessionLink for a given session, or null if none exists.
 *
 * Resolves the new-style path first; falls back to legacy only when the
 * new-style path can't be resolved. Parse errors PROPAGATE.
 */
export function readSessionLink(sessionId) {
  let newFile = null;
  try {
    newFile = linkFile(sessionId);
  } catch {
    newFile = null;
  }
  if (newFile && existsSync(newFile)) return parseLinkFile(newFile);

  let legacy = null;
  try {
    legacy = legacyLinkFile(sessionId);
  } catch {
    legacy = null;
  }
  if (legacy && existsSync(legacy)) return parseLinkFile(legacy);
  return null;
}

/** Upsert a PrLink into the session: append if new, merge if already present (by prNumber). */
export function upsertPrLink(link, pr) {
  const idx = link.prs.findIndex((p) => p.prNumber === pr.prNumber);
  if (idx === -1) {
    return { ...link, prs: [...link.prs, pr] };
  }
  const merged = { ...link.prs[idx], ...pr };
  const next = [...link.prs];
  next[idx] = merged;
  return { ...link, prs: next };
}

/** Update the lastKnownState for a specific PR number. Returns link unchanged if PR not found. */
export function markPrLinkState(link, prNumber, state) {
  const idx = link.prs.findIndex((p) => p.prNumber === prNumber);
  if (idx === -1) return link;
  const next = [...link.prs];
  next[idx] = { ...next[idx], lastKnownState: state };
  return { ...link, prs: next };
}

/**
 * Returns true if a SessionStart resume comment should be posted for this session.
 * Rate-limits to once per (engineer, calendar day) pair.
 */
export function shouldPostSessionStart(link, today, engineerEmail) {
  if (!link.lastSessionStartCommentDate || !link.lastSessionStartEngineerEmail) return true;
  if (link.lastSessionStartCommentDate !== today) return true;
  if (link.lastSessionStartEngineerEmail !== engineerEmail) return true;
  return false;
}

/** Write / overwrite the SessionLink for a given session. Always writes to the new shared-state path. */
export function writeSessionLink(sessionId, link) {
  const dir = sessionDir(sessionId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(linkFile(sessionId), JSON.stringify(link, null, 2) + "\n", "utf8");
}

/** Delete the SessionLink file (both new and legacy locations if present). Returns true if any was removed. */
export function deleteSessionLink(sessionId) {
  let removed = false;
  let candidates = [];
  try { candidates.push(linkFile(sessionId)); } catch { /* no git dir */ }
  try { candidates.push(legacyLinkFile(sessionId)); } catch { /* no git dir */ }
  for (const file of candidates) {
    if (existsSync(file)) {
      unlinkSync(file);
      removed = true;
    }
  }
  return removed;
}

/**
 * Enumerate all sessions that have a linear.json. Walks the new shared-state
 * location AND every worktree's legacy `.claude/sessions/`. De-duplicates by
 * session id (new-style wins).
 */
export function listLinkedSessions() {
  const seen = new Map();

  let newRoot = "";
  try {
    newRoot = join(getGitCommonDir(), ".claude-linear");
  } catch {
    // No git common dir resolvable — skip new-style enumeration.
  }
  if (newRoot && existsSync(newRoot)) {
    for (const entry of readdirSync(newRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const file = join(newRoot, entry.name, "linear.json");
      if (!existsSync(file)) continue;
      try {
        seen.set(entry.name, parseLinkFile(file));
      } catch (err) {
        console.error(
          `[linear] failed to parse ${file}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  try {
    // When getGitCommonDir() succeeded (newRoot is set), anchor on the common
    // dir itself — the directory always exists even if .claude-linear/ does
    // not yet. Falling back to process.cwd() only when not in a git repo.
    const anchor = newRoot ? getGitCommonDir() : process.cwd();
    const worktreesRaw = runGit(["worktree", "list", "--porcelain"], anchor);
    const worktreePaths = worktreesRaw
      .split("\n")
      .filter((l) => l.startsWith("worktree "))
      .map((l) => l.replace(/^worktree /, "").trim());
    for (const wt of worktreePaths) {
      const sessionsDir = join(wt, ".claude", "sessions");
      if (!existsSync(sessionsDir)) continue;
      for (const entry of readdirSync(sessionsDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        if (seen.has(entry.name)) continue;
        const file = join(sessionsDir, entry.name, "linear.json");
        if (!existsSync(file)) continue;
        try {
          seen.set(entry.name, parseLinkFile(file));
        } catch {
          // skip unparseable
        }
      }
    }
  } catch {
    // No worktree info available — already returned new-style results.
  }

  return Array.from(seen, ([sessionId, link]) => ({ sessionId, link }));
}

/**
 * Parse an issue identifier or URL into the canonical `<TEAM_KEY>-<n>` form.
 *
 * Accepts:
 *   - `ENG-42`
 *   - `eng-42`
 *   - `42`
 *   - `https://linear.app/org/issue/ENG-42/...`
 *
 * TEAM_KEY is read from process.env.LINEAR_TEAM_KEY at call time (not frozen
 * at module load) so tests that set the env variable before calling this
 * function see the correct value.
 */
export function parseIssueIdentifier(input) {
  const teamKey = (process.env.LINEAR_TEAM_KEY || "").trim();
  const trimmed = input.trim();

  // URL: extract any TEAM-NUMBER from /issue/ path segment
  const urlMatch = trimmed.match(/\/issue\/([A-Za-z]+-\d+)/i);
  if (urlMatch) return urlMatch[1].toUpperCase();

  // Explicit identifier like ENG-42 or eng-42
  const codeMatch = trimmed.match(/^([A-Za-z]+)-(\d+)$/);
  if (codeMatch) return codeMatch[0].toUpperCase();

  // Bare digit(s) — use team key from env
  if (/^\d+$/.test(trimmed)) {
    if (!teamKey) {
      throw new Error(
        `Cannot parse bare issue number '${input}': LINEAR_TEAM_KEY is not set.`,
      );
    }
    return `${teamKey}-${trimmed}`;
  }

  throw new Error(
    `Cannot parse issue identifier: '${input}'. Expected <TEAM>-<n>, <n>, or a Linear issue URL.`,
  );
}

/** Short stable digest of a string (non-cryptographic, FNV-1a 32-bit). */
export function digestOf(content) {
  let h = 0x811c9dc5;
  for (let i = 0; i < content.length; i++) {
    h ^= content.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Test-only: reset memoised paths between cases. */
export function _resetCachesForTesting() {
  cachedGitCommonDir = undefined;
  cachedRepoTopLevel = undefined;
}
