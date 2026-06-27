// plugins/linear/scripts/test/log-bug.test.mjs
import { test, mock } from "node:test";
import assert from "node:assert/strict";

function makeStandardFetch({ createdId = "TEAM-30" } = {}) {
  return mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);

    if (body.query.includes("teams(")) {
      return {
        ok: true,
        json: async () => ({
          data: { teams: { nodes: [{ id: "team-id-1", key: "TEAM", cyclesEnabled: false, triageEnabled: false }] } },
        }),
      };
    }

    if (body.query.includes("viewer{")) {
      return {
        ok: true,
        json: async () => ({
          data: { viewer: { id: "user-1", name: "Alice", email: "alice@example.com" } },
        }),
      };
    }

    if (body.query.includes("issueLabels(")) {
      return {
        ok: true,
        json: async () => ({
          data: {
            issueLabels: {
              nodes: [
                { id: "label-bug", name: "bug", parent: null },
                { id: "label-backend", name: "backend", parent: { id: "parent-area" } },
                { id: "label-area", name: "Area", parent: null },
                { id: "label-env-prod", name: "env:prod", parent: null },
                { id: "label-ai-drafted", name: "ai-drafted", parent: null },
              ],
            },
          },
        }),
      };
    }

    if (body.query.includes("issueCreate(")) {
      return {
        ok: true,
        json: async () => ({
          data: {
            issueCreate: {
              success: true,
              issue: { id: "issue-uuid-30", identifier: createdId, url: `https://linear.app/issue/${createdId}` },
            },
          },
        }),
      };
    }

    return { ok: true, json: async () => ({ data: {} }) };
  });
}

test("log-bug creates a bug issue with correct labels and priority", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";
  delete process.env.CLAUDE_CODE;

  let mutationBody = null;
  const baseFetch = makeStandardFetch();
  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("issueCreate(")) {
      mutationBody = body;
    }
    return baseFetch(_url, opts);
  });

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/log-bug.mjs?1");
  const code = await run([
    "--title", "Login fails on mobile",
    "--area", "backend",
    "--env", "prod",
    "--severity", "S2",
    "--description", "Steps: open app, tap login. Expected: logged in. Actual: error 500.",
  ]);
  console.log = orig;

  assert.equal(code, 0);
  assert.ok(mutationBody !== null, "issueCreate mutation should have been called");
  const vars = JSON.stringify(mutationBody.variables);
  assert.ok(vars.includes("Login fails on mobile"), "mutation should include title");
  // S2 => priority 2
  assert.ok(vars.includes('"priority":2') || vars.includes("\"priority\":2"), "S2 severity should map to priority 2");
  const combined = out.join("\n");
  assert.match(combined, /TEAM-30/);
  assert.match(combined, /Created/i);
});

test("log-bug returns 2 with missing required flags", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/log-bug.mjs?2");
  const code = await run(["--title", "Bug without env"]);
  console.error = orig;

  assert.equal(code, 2);
});

test("log-bug returns 3 and does NOT create when title contains PII", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  let mutationCalled = false;
  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("issueCreate(")) {
      mutationCalled = true;
    }
    return { ok: true, json: async () => ({ data: {} }) };
  });

  const errOut = [];
  const origErr = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/log-bug.mjs?3");
  const code = await run([
    "--title", "Bug for user DOB 1985-06-15",
    "--area", "backend",
    "--env", "prod",
    "--severity", "S3",
    "--description", "Clean description",
  ]);
  console.error = origErr;

  assert.equal(code, 3, "should exit 3 on PII in title");
  assert.ok(!mutationCalled, "issueCreate must NOT be called when PII detected");
  const combined = errOut.join("\n");
  assert.match(combined, /PII/i);
});

test("log-bug returns 2 with invalid env value", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/log-bug.mjs?4");
  const code = await run([
    "--title", "Bug",
    "--area", "backend",
    "--env", "staging",
    "--severity", "S1",
    "--description", "desc",
  ]);
  console.error = orig;

  assert.equal(code, 2, "invalid env should return 2");
});

test("log-bug severity S1 maps to priority 1 (Urgent)", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";
  delete process.env.CLAUDE_CODE;

  let mutationBody = null;
  const baseFetch = makeStandardFetch();
  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("issueCreate(")) {
      mutationBody = body;
    }
    return baseFetch(_url, opts);
  });

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/log-bug.mjs?5");
  const code = await run([
    "--title", "Critical production outage",
    "--area", "backend",
    "--env", "prod",
    "--severity", "S1",
    "--description", "Everything is down",
  ]);
  console.log = orig;

  assert.equal(code, 0);
  assert.ok(mutationBody !== null);
  const vars = JSON.stringify(mutationBody.variables);
  assert.ok(vars.includes('"priority":1') || vars.includes("\"priority\":1"), "S1 severity should map to priority 1");
});
