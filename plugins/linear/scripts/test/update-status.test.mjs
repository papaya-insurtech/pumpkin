// plugins/linear/scripts/test/update-status.test.mjs
import { test, mock } from "node:test";
import assert from "node:assert/strict";

test("update-status moves issue to new state and prints old -> new", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  let mutationBody = null;
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
              identifier: "TEAM-5",
              title: "Fix login",
              state: { id: "state-todo", name: "Todo" },
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
          data: { issueUpdate: { success: true, issue: { state: { name: "In Progress" } } } },
        }),
      };
    }

    return { ok: true, json: async () => ({ data: {} }) };
  });

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/update-status.mjs?1");
  const code = await run(["TEAM-5", "In Progress"]);
  console.log = orig;

  assert.equal(code, 0);
  assert.ok(mutationBody !== null, "issueUpdate mutation should have been called");
  const combined = out.join("\n");
  assert.match(combined, /TEAM-5/);
  assert.match(combined, /Todo/);
  assert.match(combined, /->/);
});

test("update-status returns 2 with missing args", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/update-status.mjs?2");
  const code = await run(["TEAM-5"]);
  console.error = orig;

  assert.equal(code, 2);
});

test("update-status returns 1 when issue not found", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

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
    if (body.query.includes("workflowStates(")) {
      return {
        ok: true,
        json: async () => ({
          data: { workflowStates: { nodes: [{ id: "state-done", name: "Done", type: "completed" }] } },
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
  const { run } = await import("../verbs/update-status.mjs?3");
  const code = await run(["TEAM-99", "Done"]);
  console.error = orig;

  assert.equal(code, 1);
});
