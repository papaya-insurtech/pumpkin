// plugins/linear/scripts/test/list-my-issues.test.mjs
import { test, mock } from "node:test";
import assert from "node:assert/strict";

test("list-my-issues groups issues by state and prints them", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);

    if (body.query.includes("viewer{")) {
      return {
        ok: true,
        json: async () => ({
          data: { viewer: { id: "user-1", name: "Alice", email: "alice@example.com" } },
        }),
      };
    }

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
                identifier: "TEAM-1",
                title: "Auth refactor",
                priority: 2,
                state: { name: "In Progress" },
              },
              {
                identifier: "TEAM-3",
                title: "Fix null pointer",
                priority: 1,
                state: { name: "In Progress" },
              },
              {
                identifier: "TEAM-5",
                title: "Write docs",
                priority: 0,
                state: { name: "Todo" },
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
  const { run } = await import("../verbs/list-my-issues.mjs?1");
  const code = await run([]);
  console.log = orig;

  assert.equal(code, 0);
  const combined = out.join("\n");
  assert.match(combined, /In Progress/);
  assert.match(combined, /TEAM-1/);
  assert.match(combined, /TEAM-3/);
  assert.match(combined, /Todo/);
  assert.match(combined, /TEAM-5/);
});

test("list-my-issues with --state filter passes name filter in query", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  let issueQueryBody = null;
  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("viewer{")) {
      return {
        ok: true,
        json: async () => ({ data: { viewer: { id: "user-1", name: "Alice", email: "alice@example.com" } } }),
      };
    }
    if (body.query.includes("teams(")) {
      return {
        ok: true,
        json: async () => ({
          data: { teams: { nodes: [{ id: "team-id-1", key: "TEAM", cyclesEnabled: false, triageEnabled: false }] } },
        }),
      };
    }
    issueQueryBody = body;
    return { ok: true, json: async () => ({ data: { issues: { nodes: [] } } }) };
  });

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/list-my-issues.mjs?2");
  const code = await run(["--state", "Todo"]);
  console.log = orig;

  assert.equal(code, 0);
  assert.ok(issueQueryBody !== null, "issues query should have been called");
  assert.ok(
    JSON.stringify(issueQueryBody.variables).includes("Todo"),
    "state filter should be passed in query"
  );
});

test("list-my-issues prints message when no issues", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("viewer{")) {
      return {
        ok: true,
        json: async () => ({ data: { viewer: { id: "user-1", name: "Alice", email: "alice@example.com" } } }),
      };
    }
    if (body.query.includes("teams(")) {
      return {
        ok: true,
        json: async () => ({
          data: { teams: { nodes: [{ id: "team-id-1", key: "TEAM", cyclesEnabled: false, triageEnabled: false }] } },
        }),
      };
    }
    return { ok: true, json: async () => ({ data: { issues: { nodes: [] } } }) };
  });

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/list-my-issues.mjs?3");
  const code = await run([]);
  console.log = orig;

  assert.equal(code, 0);
  const combined = out.join("\n");
  assert.match(combined, /No open issues/);
});
