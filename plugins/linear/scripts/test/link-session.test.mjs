// plugins/linear/scripts/test/link-session.test.mjs
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { _resetCachesForTesting } from "../lib/session.mjs";

// Each test uses a unique query-string suffix on the import to avoid module
// cache collisions, since Node caches ESM modules by specifier.

function makeTempRepo() {
  const tmpRepo = mkdtempSync(join(tmpdir(), "linear-link-session-"));
  execFileSync("git", ["init", tmpRepo], { stdio: "ignore" });
  execFileSync("git", ["-C", tmpRepo, "config", "user.email", "test@test.com"], { stdio: "ignore" });
  execFileSync("git", ["-C", tmpRepo, "config", "user.name", "Test"], { stdio: "ignore" });
  return tmpRepo;
}

test("link-session returns 2 with no args", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/link-session.mjs?1");
  const code = await run([]);
  console.error = orig;

  assert.equal(code, 2);
});

test("link-session returns 2 for unexpected arg", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/link-session.mjs?2");
  const code = await run(["PAP-1", "PAP-2"]);
  console.error = orig;

  assert.equal(code, 2);
});

test("link-session writes SessionLink to disk and creates attachment", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const tmpRepo = makeTempRepo();
  const sessionId = "test-session-link-abc";

  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  let attachmentMutationBody = null;

  try {
    global.fetch = mock.fn(async (_url, opts) => {
      const body = JSON.parse(opts.body);

      // issue resolution query
      if (body.query.includes("issue(")) {
        return {
          ok: true,
          json: async () => ({
            data: {
              issue: {
                id: "issue-uuid-99",
                identifier: "PAP-99",
                title: "Test issue title",
              },
            },
          }),
        };
      }

      // attachmentCreate mutation
      if (body.query.includes("attachmentCreate")) {
        attachmentMutationBody = body;
        return {
          ok: true,
          json: async () => ({
            data: {
              attachmentCreate: {
                success: true,
                attachment: { id: "attach-id-001" },
              },
            },
          }),
        };
      }

      return { ok: true, json: async () => ({ data: {} }) };
    });

    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    const { run } = await import(`../verbs/link-session.mjs?3`);
    process.env.CLAUDE_SESSION_ID = sessionId;
    const code = await run(["PAP-99"]);
    console.log = orig;

    assert.equal(code, 0, "exit code should be 0");

    // Verify attachment mutation was called
    assert.ok(attachmentMutationBody !== null, "attachmentCreate mutation should have been called");
    const mutVars = attachmentMutationBody.variables;
    assert.equal(mutVars.input.issueId, "issue-uuid-99");
    assert.ok(mutVars.input.title.includes(sessionId.slice(0, 8)));
    assert.ok(mutVars.input.url.includes(sessionId));

    // Verify link file written on disk
    const { linkFile } = await import("../lib/session.mjs");
    const lf = linkFile(sessionId);
    const saved = JSON.parse(readFileSync(lf, "utf8"));
    assert.equal(saved.issueId, "issue-uuid-99");
    assert.equal(saved.issueIdentifier, "PAP-99");
    assert.equal(saved.sessionAttachmentId, "attach-id-001");
    assert.ok(Array.isArray(saved.plans));
    assert.ok(Array.isArray(saved.prs));

    // Verify printed output
    const combined = out.join("\n");
    assert.match(combined, /linked session/);
    assert.match(combined, /PAP-99/);
    assert.match(combined, /Test issue title/);
  } finally {
    delete process.env.CLAUDE_SESSION_ID;
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("link-session fails with exit 1 when issue not found", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const tmpRepo = makeTempRepo();
  const sessionId = "test-session-notfound";

  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    global.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        data: { issue: null },
      }),
    }));

    const errOut = [];
    const orig = console.error;
    console.error = (...a) => errOut.push(a.join(" "));

    const { run } = await import(`../verbs/link-session.mjs?4`);
    process.env.CLAUDE_SESSION_ID = sessionId;
    const code = await run(["PAP-99"]);
    console.error = orig;

    assert.equal(code, 1);
  } finally {
    delete process.env.CLAUDE_SESSION_ID;
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("link-session --force replaces existing link for different issue", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const tmpRepo = makeTempRepo();
  const sessionId = "test-session-force-replace";

  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    // Pre-seed an existing link for a DIFFERENT issue
    const { writeSessionLink, linkFile } = await import("../lib/session.mjs");
    const existingLink = {
      issueId: "issue-old-111",
      issueIdentifier: "PAP-11",
      linkedAt: "2024-01-01T00:00:00.000Z",
      plans: [],
      prs: [],
    };
    writeSessionLink(sessionId, existingLink);

    global.fetch = mock.fn(async (_url, opts) => {
      const body = JSON.parse(opts.body);
      if (body.query.includes("issue(")) {
        return {
          ok: true,
          json: async () => ({
            data: { issue: { id: "issue-new-222", identifier: "PAP-22", title: "New issue" } },
          }),
        };
      }
      if (body.query.includes("attachmentCreate")) {
        return {
          ok: true,
          json: async () => ({
            data: { attachmentCreate: { success: true, attachment: { id: "attach-force-001" } } },
          }),
        };
      }
      return { ok: true, json: async () => ({ data: {} }) };
    });

    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    const { run } = await import(`../verbs/link-session.mjs?5`);
    process.env.CLAUDE_SESSION_ID = sessionId;
    const code = await run(["PAP-22", "--force"]);
    console.log = orig;

    assert.equal(code, 0);

    const lf = linkFile(sessionId);
    const saved = JSON.parse(readFileSync(lf, "utf8"));
    assert.equal(saved.issueId, "issue-new-222");
    assert.equal(saved.issueIdentifier, "PAP-22");
  } finally {
    delete process.env.CLAUDE_SESSION_ID;
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("link-session fails without --force when already linked to different issue", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const tmpRepo = makeTempRepo();
  const sessionId = "test-session-no-force";

  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    // Pre-seed an existing link for a DIFFERENT issue
    const { writeSessionLink } = await import("../lib/session.mjs");
    const existingLink = {
      issueId: "issue-old-333",
      issueIdentifier: "PAP-33",
      linkedAt: "2024-01-01T00:00:00.000Z",
      plans: [],
      prs: [],
    };
    writeSessionLink(sessionId, existingLink);

    global.fetch = mock.fn(async (_url, opts) => {
      const body = JSON.parse(opts.body);
      if (body.query.includes("issue(")) {
        return {
          ok: true,
          json: async () => ({
            data: { issue: { id: "issue-diff-444", identifier: "PAP-44", title: "Different issue" } },
          }),
        };
      }
      return { ok: true, json: async () => ({ data: {} }) };
    });

    const errOut = [];
    const orig = console.error;
    console.error = (...a) => errOut.push(a.join(" "));

    const { run } = await import(`../verbs/link-session.mjs?6`);
    process.env.CLAUDE_SESSION_ID = sessionId;
    const code = await run(["PAP-44"]);
    console.error = orig;

    // Should fail because already linked to a different issue and no --force
    assert.equal(code, 1);
    assert.ok(errOut.some((l) => l.includes("--force")), "error should mention --force");
  } finally {
    delete process.env.CLAUDE_SESSION_ID;
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("link-session is idempotent when same issue already linked", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const tmpRepo = makeTempRepo();
  const sessionId = "test-session-idempotent";

  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    // Pre-seed an existing link for the SAME issue
    const { writeSessionLink, linkFile } = await import("../lib/session.mjs");
    const existingLink = {
      issueId: "issue-same-555",
      issueIdentifier: "PAP-55",
      linkedAt: "2024-01-01T00:00:00.000Z",
      sessionAttachmentId: "attach-already-exists",
      plans: [],
      prs: [],
    };
    writeSessionLink(sessionId, existingLink);

    let attachmentCallCount = 0;
    global.fetch = mock.fn(async (_url, opts) => {
      const body = JSON.parse(opts.body);
      if (body.query.includes("issue(")) {
        return {
          ok: true,
          json: async () => ({
            data: { issue: { id: "issue-same-555", identifier: "PAP-55", title: "Same issue" } },
          }),
        };
      }
      if (body.query.includes("attachmentCreate")) {
        attachmentCallCount++;
        return {
          ok: true,
          json: async () => ({
            data: { attachmentCreate: { success: true, attachment: { id: "new-attach" } } },
          }),
        };
      }
      return { ok: true, json: async () => ({ data: {} }) };
    });

    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    const { run } = await import(`../verbs/link-session.mjs?7`);
    process.env.CLAUDE_SESSION_ID = sessionId;
    const code = await run(["PAP-55"]);
    console.log = orig;

    assert.equal(code, 0);
    // Attachment should NOT be created again since sessionAttachmentId already exists
    assert.equal(attachmentCallCount, 0, "should not re-create attachment if already exists");
  } finally {
    delete process.env.CLAUDE_SESSION_ID;
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});
