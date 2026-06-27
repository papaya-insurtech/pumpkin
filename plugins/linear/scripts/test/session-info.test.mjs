// plugins/linear/scripts/test/session-info.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { _resetCachesForTesting, writeSessionLink } from "../lib/session.mjs";

function makeTempRepo() {
  const tmpRepo = mkdtempSync(join(tmpdir(), "linear-session-info-"));
  execFileSync("git", ["init", tmpRepo], { stdio: "ignore" });
  execFileSync("git", ["-C", tmpRepo, "config", "user.email", "test@test.com"], { stdio: "ignore" });
  execFileSync("git", ["-C", tmpRepo, "config", "user.name", "Test"], { stdio: "ignore" });
  return tmpRepo;
}

test("session-info prints 'no Linear link' when nothing linked", async () => {
  const tmpRepo = makeTempRepo();
  const sessionId = "test-info-no-link";

  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    const { run } = await import("../verbs/session-info.mjs?1");
    process.env.CLAUDE_SESSION_ID = sessionId;
    const code = await run([]);
    console.log = orig;

    assert.equal(code, 0);
    const combined = out.join("\n");
    assert.match(combined, /no Linear link/);
  } finally {
    delete process.env.CLAUDE_SESSION_ID;
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("session-info prints linked issue details when linked", async () => {
  const tmpRepo = makeTempRepo();
  const sessionId = "test-info-linked";

  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    const link = {
      issueId: "issue-uuid-77",
      issueIdentifier: "PAP-77",
      linkedAt: "2025-06-01T12:00:00.000Z",
      sessionAttachmentId: "attach-77",
      plans: [],
      prs: [],
    };
    writeSessionLink(sessionId, link);

    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    const { run } = await import("../verbs/session-info.mjs?2");
    process.env.CLAUDE_SESSION_ID = sessionId;
    const code = await run([]);
    console.log = orig;

    assert.equal(code, 0);
    const combined = out.join("\n");
    assert.match(combined, /PAP-77/);
    assert.match(combined, /issue-uuid-77/);
  } finally {
    delete process.env.CLAUDE_SESSION_ID;
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("session-info --json prints machine-readable JSON", async () => {
  const tmpRepo = makeTempRepo();
  const sessionId = "test-info-json";

  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    const link = {
      issueId: "issue-uuid-88",
      issueIdentifier: "PAP-88",
      linkedAt: "2025-06-02T00:00:00.000Z",
      plans: [{ digest: "abc12345", uploadedAt: "2025-06-02", title: "Plan A", path: "/tmp/plan.md" }],
      prs: [],
    };
    writeSessionLink(sessionId, link);

    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    const { run } = await import("../verbs/session-info.mjs?3");
    process.env.CLAUDE_SESSION_ID = sessionId;
    const code = await run(["--json"]);
    console.log = orig;

    assert.equal(code, 0);
    const obj = JSON.parse(out.join("\n"));
    assert.equal(obj.sessionId, sessionId);
    assert.equal(obj.link.issueIdentifier, "PAP-88");
    assert.equal(obj.link.plans.length, 1);
  } finally {
    delete process.env.CLAUDE_SESSION_ID;
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("session-info --all shows all linked sessions", async () => {
  const tmpRepo = makeTempRepo();
  const sid1 = "test-all-session-1";
  const sid2 = "test-all-session-2";

  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    writeSessionLink(sid1, {
      issueId: "issue-aaa",
      issueIdentifier: "PAP-100",
      linkedAt: "2025-01-01T00:00:00.000Z",
      plans: [],
      prs: [],
    });
    writeSessionLink(sid2, {
      issueId: "issue-bbb",
      issueIdentifier: "PAP-200",
      linkedAt: "2025-01-02T00:00:00.000Z",
      plans: [{ digest: "d1", uploadedAt: "2025-01-02", title: "P", path: "/tmp/p.md" }],
      prs: [{ prNumber: 42, isDraft: false, lastKnownState: null, deployVerifySpawned: false }],
    });

    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    const { run } = await import("../verbs/session-info.mjs?4");
    // No CLAUDE_SESSION_ID needed; using --all
    delete process.env.CLAUDE_SESSION_ID;
    const code = await run(["--all"]);
    console.log = orig;

    assert.equal(code, 0);
    const combined = out.join("\n");
    assert.match(combined, /PAP-100/);
    assert.match(combined, /PAP-200/);
  } finally {
    delete process.env.CLAUDE_SESSION_ID;
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("session-info --all --json returns JSON array", async () => {
  const tmpRepo = makeTempRepo();
  const sid = "test-all-json-session";

  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    writeSessionLink(sid, {
      issueId: "issue-ccc",
      issueIdentifier: "PAP-300",
      linkedAt: "2025-01-03T00:00:00.000Z",
      plans: [],
      prs: [],
    });

    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    const { run } = await import("../verbs/session-info.mjs?5");
    delete process.env.CLAUDE_SESSION_ID;
    const code = await run(["--all", "--json"]);
    console.log = orig;

    assert.equal(code, 0);
    const arr = JSON.parse(out.join("\n"));
    assert.ok(Array.isArray(arr));
    assert.ok(arr.some((r) => r.link.issueIdentifier === "PAP-300"));
  } finally {
    delete process.env.CLAUDE_SESSION_ID;
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("session-info returns 2 for unexpected arg", async () => {
  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));

  const { run } = await import("../verbs/session-info.mjs?6");
  const code = await run(["--bogus-flag"]);
  console.error = orig;

  assert.equal(code, 2);
});
