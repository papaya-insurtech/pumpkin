// plugins/linear/scripts/test/start-task.test.mjs
import { test, mock } from "node:test";
import assert from "node:assert/strict";

test("start-task assigns issue to viewer and moves to In Progress", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  let mutationBody = null;
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

    if (body.query.includes("workflowStates(")) {
      return {
        ok: true,
        json: async () => ({
          data: {
            workflowStates: {
              nodes: [
                { id: "state-todo", name: "Todo", type: "unstarted" },
                { id: "state-wip", name: "In Progress", type: "started" },
                { id: "state-done", name: "Done", type: "completed" },
              ],
            },
          },
        }),
      };
    }

    if (body.query.includes("issue(")) {
      return {
        ok: true,
        json: async () => ({
          data: {
            issue: {
              id: "issue-uuid-1",
              identifier: "TEAM-10",
              title: "Implement auth module",
              priority: 2,
              state: { id: "state-todo", name: "Todo" },
              assignee: null,
              description: "Must support OAuth2 and API keys.",
            },
          },
        }),
      };
    }

    if (body.query.includes("issueUpdate(")) {
      mutationBody = body;
      return {
        ok: true,
        json: async () => ({
          data: { issueUpdate: { success: true, issue: { id: "issue-uuid-1", identifier: "TEAM-10", state: { name: "In Progress" } } } },
        }),
      };
    }

    return { ok: true, json: async () => ({ data: {} }) };
  });

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/start-task.mjs?1");
  const code = await run(["TEAM-10"]);
  console.log = orig;

  assert.equal(code, 0);
  assert.ok(mutationBody !== null, "issueUpdate mutation should have been called");
  // mutation variables must include the In Progress state id
  const vars = JSON.stringify(mutationBody.variables);
  assert.ok(vars.includes("state-wip"), "issueUpdate must set stateId to the In Progress state");

  const combined = out.join("\n");
  assert.match(combined, /TEAM-10/);
  assert.match(combined, /In Progress/);
});

test("start-task returns 2 with no args", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/start-task.mjs?2");
  const code = await run([]);
  console.error = orig;

  assert.equal(code, 2);
});

test("start-task returns 1 when issue not found", async () => {
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
    if (body.query.includes("issue(")) {
      return {
        ok: true,
        json: async () => ({ data: { issue: null } }),
      };
    }
    return { ok: true, json: async () => ({ data: {} }) };
  });

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/start-task.mjs?3");
  const code = await run(["TEAM-99"]);
  console.error = orig;

  assert.equal(code, 1);
});
