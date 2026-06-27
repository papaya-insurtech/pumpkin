// plugins/linear/scripts/test/session.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { parseIssueIdentifier, digestOf, listLinkedSessions, _resetCachesForTesting } from "../lib/session.mjs";

test("parseIssueIdentifier normalizes forms", () => {
  process.env.LINEAR_TEAM_KEY = "PAP";
  assert.equal(parseIssueIdentifier("PAP-42"), "PAP-42");
  assert.equal(parseIssueIdentifier("pap-42"), "PAP-42");
  assert.equal(parseIssueIdentifier("42"), "PAP-42");
  assert.equal(parseIssueIdentifier("https://linear.app/acme/issue/PAP-42/foo"), "PAP-42");
});

test("digestOf is stable FNV-1a hex", () => {
  assert.equal(digestOf("hello"), digestOf("hello"));
  assert.match(digestOf("hello"), /^[0-9a-f]{8}$/);
});

test("listLinkedSessions finds legacy sessions when .claude-linear is absent", () => {
  // Create a throwaway git repo in temp dir
  const tmpRepo = mkdtempSync(join(tmpdir(), "linear-test-"));
  try {
    execFileSync("git", ["init", tmpRepo], { stdio: "ignore" });
    execFileSync("git", ["-C", tmpRepo, "config", "user.email", "test@test.com"], { stdio: "ignore" });
    execFileSync("git", ["-C", tmpRepo, "config", "user.name", "Test"], { stdio: "ignore" });

    const sid = "test-session-abc123";
    const sessDir = join(tmpRepo, ".claude", "sessions", sid);
    mkdirSync(sessDir, { recursive: true });

    const link = {
      issueId: "issue-uuid-1",
      issueIdentifier: "PAP-1",
      linkedAt: "2024-01-01T00:00:00.000Z",
      plans: [],
      prs: [],
    };
    writeFileSync(join(sessDir, "linear.json"), JSON.stringify(link, null, 2) + "\n", "utf8");

    // Reset caches so the lib resolves paths relative to our temp repo
    _resetCachesForTesting();
    const savedCwd = process.cwd();
    process.chdir(tmpRepo);
    try {
      const results = listLinkedSessions();
      assert.equal(results.length, 1, "should find exactly one legacy session");
      assert.equal(results[0].sessionId, sid);
      assert.equal(results[0].link.issueIdentifier, "PAP-1");
    } finally {
      process.chdir(savedCwd);
      _resetCachesForTesting();
    }
  } finally {
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});
