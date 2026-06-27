// plugins/linear/scripts/test/add-comment.test.mjs
import { test, mock } from "node:test";
import assert from "node:assert/strict";

test("add-comment posts a comment and prints confirmation", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  let mutationBody = null;
  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);

    if (body.query.includes("issue(")) {
      return {
        ok: true,
        json: async () => ({
          data: { issue: { id: "issue-uuid-1", identifier: "TEAM-5" } },
        }),
      };
    }

    if (body.query.includes("commentCreate(")) {
      mutationBody = body;
      return {
        ok: true,
        json: async () => ({
          data: { commentCreate: { success: true, comment: { id: "comment-1" } } },
        }),
      };
    }

    return { ok: true, json: async () => ({ data: {} }) };
  });

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/add-comment.mjs?1");
  const code = await run(["TEAM-5", "Great work on this feature!"]);
  console.log = orig;

  assert.equal(code, 0);
  assert.ok(mutationBody !== null, "commentCreate mutation should have been called");
  const vars = JSON.stringify(mutationBody.variables);
  assert.ok(vars.includes("Great work"), "mutation should include comment body");
  const combined = out.join("\n");
  assert.match(combined, /TEAM-5/);
  assert.match(combined, /comment added/);
});

test("add-comment returns 2 with missing args", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/add-comment.mjs?2");
  const code = await run(["TEAM-5"]);
  console.error = orig;

  assert.equal(code, 2);
});

test("add-comment returns 3 and does NOT post when body contains PII (DOB)", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  // PII scan runs BEFORE any fetch — assert zero fetch calls
  let fetchCallCount = 0;
  global.fetch = mock.fn(async () => {
    fetchCallCount++;
    return { ok: true, json: async () => ({ data: { issue: { id: "i1", identifier: "TEAM-5" } } }) };
  });

  const errOut = [];
  const origErr = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/add-comment.mjs?3");
  // DOB in comment body
  const code = await run(["TEAM-5", "Please check user born on 1985-03-22"]);
  console.error = origErr;

  assert.equal(code, 3, "should exit 3 on PII");
  assert.equal(fetchCallCount, 0, "NO fetch must be made when PII is detected (scan runs first)");
  const combined = errOut.join("\n");
  assert.match(combined, /PII/i);
});

test("add-comment returns 1 when issue not found", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("issue(")) {
      return { ok: true, json: async () => ({ data: { issue: null } }) };
    }
    return { ok: true, json: async () => ({ data: {} }) };
  });

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/add-comment.mjs?4");
  const code = await run(["TEAM-99", "Hello"]);
  console.error = orig;

  assert.equal(code, 1);
});

test("add-comment skips post when dedupe marker already present", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  let mutationCalled = false;
  let callCount = 0;
  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);

    if (body.query.includes("commentCreate(")) {
      mutationCalled = true;
      return { ok: true, json: async () => ({ data: { commentCreate: { success: true, comment: { id: "c1" } } } }) };
    }

    // First issue query: fetch issue by identifier
    // Second: fetch comments (also queries issue by id with comments nested)
    callCount++;
    if (callCount === 1) {
      // First call: resolve issue by identifier
      return {
        ok: true,
        json: async () => ({
          data: { issue: { id: "issue-uuid-1", identifier: "TEAM-5" } },
        }),
      };
    }
    // Second call: fetch existing comments for dedupe check
    return {
      ok: true,
      json: async () => ({
        data: {
          issue: {
            comments: {
              nodes: [{ body: "Previous comment <!-- marker-abc -->" }],
            },
          },
        },
      }),
    };
  });

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/add-comment.mjs?5");
  const code = await run(["TEAM-5", "New comment <!-- marker-abc -->", "--dedupe-marker", "marker-abc"]);
  console.log = orig;

  assert.equal(code, 0);
  assert.ok(!mutationCalled, "should NOT create comment when dedupe marker is present");
  const combined = out.join("\n");
  assert.match(combined, /skipped/);
});
