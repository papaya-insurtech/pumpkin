// plugins/linear/scripts/test/upload-plan.test.mjs
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { tmpdir, homedir } from "node:os";
import { _resetCachesForTesting, writeSessionLink, readSessionLink, digestOf } from "../lib/session.mjs";

function makeTempRepo() {
  const tmpRepo = mkdtempSync(join(tmpdir(), "linear-upload-plan-"));
  execFileSync("git", ["init", tmpRepo], { stdio: "ignore" });
  execFileSync("git", ["-C", tmpRepo, "config", "user.email", "test@test.com"], { stdio: "ignore" });
  execFileSync("git", ["-C", tmpRepo, "config", "user.name", "Test"], { stdio: "ignore" });
  return tmpRepo;
}

function makeFetchForUploadPlan({ documentId = "doc-uuid-001", commentId = "comment-uuid-001" } = {}) {
  const calls = { documentCreate: null, commentCreate: null };
  const fetchFn = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("documentCreate")) {
      calls.documentCreate = body;
      return {
        ok: true,
        json: async () => ({
          data: {
            documentCreate: {
              success: true,
              document: { id: documentId, url: `https://linear.app/docs/${documentId}` },
            },
          },
        }),
      };
    }
    if (body.query.includes("commentCreate")) {
      calls.commentCreate = body;
      return {
        ok: true,
        json: async () => ({
          data: {
            commentCreate: {
              success: true,
              comment: { id: commentId },
            },
          },
        }),
      };
    }
    return { ok: true, json: async () => ({ data: {} }) };
  });
  return { fetchFn, calls };
}

test("upload-plan returns 2 for bad --kind value", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/upload-plan.mjs?1");
  const code = await run(["--kind", "draft"]);
  console.error = orig;

  assert.equal(code, 2, "invalid --kind should return 2");
});

test("upload-plan returns 1 when session not linked and no --issue", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const tmpRepo = makeTempRepo();
  const sessionId = "test-upload-no-link";

  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    global.fetch = mock.fn(async () => ({ ok: true, json: async () => ({ data: {} }) }));

    const tmpPlan = join(tmpdir(), "test-plan.md");
    writeFileSync(tmpPlan, "# My Plan\nDo things.");

    const errOut = [];
    const orig = console.error;
    console.error = (...a) => errOut.push(a.join(" "));

    const { run } = await import("../verbs/upload-plan.mjs?2");
    process.env.CLAUDE_SESSION_ID = sessionId;
    const code = await run(["--plan-file", tmpPlan]);
    console.error = orig;

    assert.equal(code, 1, "should exit 1 when no session link and no --issue");
  } finally {
    delete process.env.CLAUDE_SESSION_ID;
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("upload-plan creates document + comment and appends to SessionLink.plans", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const tmpRepo = makeTempRepo();
  const sessionId = "test-upload-plan-ok";

  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    // Seed a session link
    const existingLink = {
      issueId: "issue-uuid-42",
      issueIdentifier: "PAP-42",
      linkedAt: "2025-01-01T00:00:00.000Z",
      plans: [],
      prs: [],
    };
    writeSessionLink(sessionId, existingLink);

    const { fetchFn, calls } = makeFetchForUploadPlan();
    global.fetch = fetchFn;

    // Create a temp plan file
    const tmpPlan = join(tmpdir(), "test-plan-upload.md");
    writeFileSync(tmpPlan, "# Test Plan\nThis is a plan.");
    const planContent = "# Test Plan\nThis is a plan.";
    const expectedDigest = digestOf(planContent);

    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    const { run } = await import("../verbs/upload-plan.mjs?3");
    process.env.CLAUDE_SESSION_ID = sessionId;
    const code = await run(["--plan-file", tmpPlan]);
    console.log = orig;

    assert.equal(code, 0, "should exit 0 on success");

    // documentCreate was called
    assert.ok(calls.documentCreate !== null, "documentCreate mutation should have been called");
    const docVars = calls.documentCreate.variables;
    assert.equal(docVars.input.issueId, "issue-uuid-42");
    assert.ok(docVars.input.title.startsWith("[Plan]"), "doc title should start with [Plan]");
    assert.ok(docVars.input.title.includes("("), "doc title should include digest");
    assert.ok(docVars.input.content.includes("Test Plan"), "doc content should include plan content");

    // commentCreate was called
    assert.ok(calls.commentCreate !== null, "commentCreate mutation should have been called");
    const commentVars = calls.commentCreate.variables;
    assert.equal(commentVars.input.issueId, "issue-uuid-42");
    assert.ok(commentVars.input.body.includes("Claude Code plan uploaded"), "comment should mention plan upload");

    // SessionLink.plans was appended (APPEND-ONLY)
    const updatedLink = readSessionLink(sessionId);
    assert.ok(updatedLink !== null, "session link should exist");
    assert.equal(updatedLink.plans.length, 1, "plans array should have 1 entry after upload");
    const plan = updatedLink.plans[0];
    assert.equal(plan.digest, expectedDigest, "plan entry digest should match content");
    assert.equal(plan.documentId, "doc-uuid-001");
    assert.equal(plan.commentId, "comment-uuid-001");

    // Output mentions the key identifiers
    const combined = out.join("\n");
    assert.match(combined, /uploaded plan/i);
  } finally {
    delete process.env.CLAUDE_SESSION_ID;
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("upload-plan uses [Spec] prefix for --kind spec", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const tmpRepo = makeTempRepo();
  const sessionId = "test-upload-spec";

  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    writeSessionLink(sessionId, {
      issueId: "issue-uuid-50",
      issueIdentifier: "PAP-50",
      linkedAt: "2025-01-01T00:00:00.000Z",
      plans: [],
      prs: [],
    });

    const { fetchFn, calls } = makeFetchForUploadPlan({ documentId: "doc-spec-001", commentId: "cmt-spec-001" });
    global.fetch = fetchFn;

    const tmpPlan = join(tmpdir(), "test-spec.md");
    writeFileSync(tmpPlan, "# My Spec\nSpecification content.");

    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    const { run } = await import("../verbs/upload-plan.mjs?4");
    process.env.CLAUDE_SESSION_ID = sessionId;
    const code = await run(["--plan-file", tmpPlan, "--kind", "spec"]);
    console.log = orig;

    assert.equal(code, 0);
    const docVars = calls.documentCreate.variables;
    assert.ok(docVars.input.title.startsWith("[Spec]"), "title should start with [Spec] for spec kind");
  } finally {
    delete process.env.CLAUDE_SESSION_ID;
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("upload-plan is APPEND-ONLY: second upload with different digest appends, not replaces", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const tmpRepo = makeTempRepo();
  const sessionId = "test-upload-append-only";

  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    // Seed a link with one already-uploaded plan
    const existingPlan = {
      path: "/some/old-plan.md",
      uploadedAt: "2025-01-01T00:00:00.000Z",
      documentId: "doc-old-001",
      commentId: "cmt-old-001",
      digest: "aabbccdd",
      title: "Old Plan",
    };
    writeSessionLink(sessionId, {
      issueId: "issue-uuid-60",
      issueIdentifier: "PAP-60",
      linkedAt: "2025-01-01T00:00:00.000Z",
      plans: [existingPlan],
      prs: [],
    });

    const { fetchFn } = makeFetchForUploadPlan({ documentId: "doc-new-001", commentId: "cmt-new-001" });
    global.fetch = fetchFn;

    const tmpPlan = join(tmpdir(), "test-new-plan.md");
    writeFileSync(tmpPlan, "# New Plan\nDifferent content.");

    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    const { run } = await import("../verbs/upload-plan.mjs?5");
    process.env.CLAUDE_SESSION_ID = sessionId;
    const code = await run(["--plan-file", tmpPlan]);
    console.log = orig;

    assert.equal(code, 0);

    const updatedLink = readSessionLink(sessionId);
    assert.equal(updatedLink.plans.length, 2, "plans should have 2 entries (append-only)");
    assert.equal(updatedLink.plans[0].digest, "aabbccdd", "original plan should still be there");
    assert.equal(updatedLink.plans[1].documentId, "doc-new-001", "new plan appended");
  } finally {
    delete process.env.CLAUDE_SESSION_ID;
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("upload-plan skips duplicate when same digest already uploaded", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const tmpRepo = makeTempRepo();
  const sessionId = "test-upload-dedup";

  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    const planContent = "# Same Plan\nIdentical content.";
    const digest = digestOf(planContent);

    // Seed a link with the SAME digest already uploaded
    writeSessionLink(sessionId, {
      issueId: "issue-uuid-70",
      issueIdentifier: "PAP-70",
      linkedAt: "2025-01-01T00:00:00.000Z",
      plans: [{ path: "/old.md", uploadedAt: "2025-01-01T00:00:00.000Z", documentId: "doc-001", commentId: "cmt-001", digest, title: "Same Plan" }],
      prs: [],
    });

    let documentCreateCalled = false;
    global.fetch = mock.fn(async (_url, opts) => {
      const body = JSON.parse(opts.body);
      if (body.query.includes("documentCreate")) documentCreateCalled = true;
      return { ok: true, json: async () => ({ data: {} }) };
    });

    const tmpPlan = join(tmpdir(), "test-same-plan.md");
    writeFileSync(tmpPlan, planContent);

    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    const { run } = await import("../verbs/upload-plan.mjs?6");
    process.env.CLAUDE_SESSION_ID = sessionId;
    const code = await run(["--plan-file", tmpPlan]);
    console.log = orig;

    assert.equal(code, 0, "should exit 0 silently when deduplicated");
    assert.ok(!documentCreateCalled, "documentCreate should NOT be called for duplicate");

    // plans array unchanged
    const link = readSessionLink(sessionId);
    assert.equal(link.plans.length, 1, "plans array should not grow for duplicate");
  } finally {
    delete process.env.CLAUDE_SESSION_ID;
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("upload-plan document title format matches [Plan] <title> — session <sid…> (<digest>)", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const tmpRepo = makeTempRepo();
  const sessionId = "abcdef1234567890"; // known session id for title check

  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    writeSessionLink(sessionId, {
      issueId: "issue-uuid-80",
      issueIdentifier: "PAP-80",
      linkedAt: "2025-01-01T00:00:00.000Z",
      plans: [],
      prs: [],
    });

    const { fetchFn, calls } = makeFetchForUploadPlan({ documentId: "doc-title-check", commentId: "cmt-title-check" });
    global.fetch = fetchFn;

    const planContent = "# Feature Plan\nDetailed work.";
    const tmpPlan = join(tmpdir(), "test-title-plan.md");
    writeFileSync(tmpPlan, planContent);
    const expectedDigest = digestOf(planContent);

    const { run } = await import("../verbs/upload-plan.mjs?7");
    process.env.CLAUDE_SESSION_ID = sessionId;
    const code = await run(["--plan-file", tmpPlan]);

    assert.equal(code, 0);
    const title = calls.documentCreate.variables.input.title;
    // Should match: "[Plan] Feature Plan — session abcdef12… (<digest>)"
    assert.ok(title.startsWith("[Plan] Feature Plan"), `Title should start with '[Plan] Feature Plan', got: ${title}`);
    assert.ok(title.includes("abcdef12"), "Title should include first 8 chars of session id");
    assert.ok(title.includes(`(${expectedDigest})`), `Title should include digest (${expectedDigest}), got: ${title}`);
  } finally {
    delete process.env.CLAUDE_SESSION_ID;
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});
