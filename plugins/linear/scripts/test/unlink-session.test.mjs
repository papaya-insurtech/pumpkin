// plugins/linear/scripts/test/unlink-session.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { _resetCachesForTesting, writeSessionLink, linkFile } from "../lib/session.mjs";

function makeTempRepo() {
  const tmpRepo = mkdtempSync(join(tmpdir(), "linear-unlink-session-"));
  execFileSync("git", ["init", tmpRepo], { stdio: "ignore" });
  execFileSync("git", ["-C", tmpRepo, "config", "user.email", "test@test.com"], { stdio: "ignore" });
  execFileSync("git", ["-C", tmpRepo, "config", "user.name", "Test"], { stdio: "ignore" });
  return tmpRepo;
}

test("unlink-session reports nothing to do when not linked", async () => {
  const tmpRepo = makeTempRepo();
  const sessionId = "test-unlink-noop";

  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    const { run } = await import("../verbs/unlink-session.mjs?1");
    process.env.CLAUDE_SESSION_ID = sessionId;
    const code = await run([]);
    console.log = orig;

    assert.equal(code, 0);
    const combined = out.join("\n");
    assert.match(combined, /nothing to do/);
  } finally {
    delete process.env.CLAUDE_SESSION_ID;
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("unlink-session deletes link file and prints confirmation", async () => {
  const tmpRepo = makeTempRepo();
  const sessionId = "test-unlink-delete";

  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    // Seed a link file
    const link = {
      issueId: "issue-uuid-del",
      issueIdentifier: "PAP-66",
      linkedAt: "2025-03-01T00:00:00.000Z",
      plans: [],
      prs: [],
    };
    writeSessionLink(sessionId, link);

    // Verify it exists before unlinking
    const lf = linkFile(sessionId);
    assert.ok(existsSync(lf), "link file should exist before unlink");

    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    const { run } = await import("../verbs/unlink-session.mjs?2");
    process.env.CLAUDE_SESSION_ID = sessionId;
    const code = await run([]);
    console.log = orig;

    assert.equal(code, 0);
    assert.ok(!existsSync(lf), "link file should be deleted after unlink");

    const combined = out.join("\n");
    assert.match(combined, /unlinked session/);
    assert.match(combined, /PAP-66/);
    assert.match(combined, /Linear-side history preserved/);
  } finally {
    delete process.env.CLAUDE_SESSION_ID;
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("unlink-session with --session uses explicit session id", async () => {
  const tmpRepo = makeTempRepo();
  const explicitSid = "test-unlink-explicit";

  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    const link = {
      issueId: "issue-uuid-expl",
      issueIdentifier: "PAP-123",
      linkedAt: "2025-04-01T00:00:00.000Z",
      plans: [],
      prs: [],
    };
    writeSessionLink(explicitSid, link);

    const lf = linkFile(explicitSid);
    assert.ok(existsSync(lf), "link file should exist");

    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    // No CLAUDE_SESSION_ID; use --session
    delete process.env.CLAUDE_SESSION_ID;
    const { run } = await import("../verbs/unlink-session.mjs?3");
    const code = await run(["--session", explicitSid]);
    console.log = orig;

    assert.equal(code, 0);
    assert.ok(!existsSync(lf), "link file should be deleted");

    const combined = out.join("\n");
    assert.match(combined, /PAP-123/);
  } finally {
    delete process.env.CLAUDE_SESSION_ID;
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("unlink-session returns 2 for unexpected arg", async () => {
  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));

  const { run } = await import("../verbs/unlink-session.mjs?4");
  const code = await run(["--bogus"]);
  console.error = orig;

  assert.equal(code, 2);
});
