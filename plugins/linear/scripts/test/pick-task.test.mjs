// plugins/linear/scripts/test/pick-task.test.mjs
import { test, mock } from "node:test";
import assert from "node:assert/strict";

test("pick-task lists Todo issues for team", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  let calls = 0;
  global.fetch = mock.fn(async (_url, opts) => {
    calls++;
    const body = JSON.parse(opts.body);

    if (body.query.includes("teams(")) {
      return {
        ok: true,
        json: async () => ({
          data: { teams: { nodes: [{ id: "team-id-1", key: "TEAM", cyclesEnabled: false, triageEnabled: false }] } },
        }),
      };
    }

    // issues query
    return {
      ok: true,
      json: async () => ({
        data: {
          issues: {
            nodes: [
              {
                identifier: "TEAM-5",
                title: "Build login page",
                priority: 2,
                project: { name: "Alpha" },
                labels: { nodes: [{ name: "frontend" }] },
              },
              {
                identifier: "TEAM-7",
                title: "Fix database bug",
                priority: 0,
                project: null,
                labels: { nodes: [] },
              },
            ],
          },
        },
      }),
    };
  });

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/pick-task.mjs?1");
  const code = await run([]);
  console.log = orig;

  assert.equal(code, 0);
  const combined = out.join("\n");
  assert.match(combined, /TEAM-5/);
  assert.match(combined, /Build login page/);
  assert.match(combined, /TEAM-7/);
  assert.match(combined, /Fix database bug/);
});

test("pick-task with --area filter passes label filter to query", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  let issueQueryBody = null;
  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("teams(")) {
      return {
        ok: true,
        json: async () => ({
          data: { teams: { nodes: [{ id: "team-id-1", key: "TEAM", cyclesEnabled: false, triageEnabled: false }] } },
        }),
      };
    }
    issueQueryBody = body;
    return {
      ok: true,
      json: async () => ({ data: { issues: { nodes: [] } } }),
    };
  });

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/pick-task.mjs?2");
  const code = await run(["--area", "backend"]);
  console.log = orig;

  assert.equal(code, 0);
  assert.ok(issueQueryBody !== null, "issues query should have been called");
  // The filter should include labels
  assert.ok(
    JSON.stringify(issueQueryBody.variables).includes("backend"),
    "area filter should be passed as label filter"
  );
});

test("pick-task returns 2 on bad args", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/pick-task.mjs?3");
  const code = await run(["--unknown-flag"]);
  console.error = orig;

  assert.equal(code, 2);
});
