// plugins/linear/scripts/test/project-status.test.mjs
import { test, mock } from "node:test";
import assert from "node:assert/strict";

test("project-status prints project info and WIP by state and milestone progress", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);

    if (body.query.includes("projects(")) {
      return {
        ok: true,
        json: async () => ({
          data: {
            projects: {
              nodes: [
                {
                  id: "proj-uuid-1",
                  name: "Alpha Project",
                  state: "started",
                  startDate: "2026-01-01",
                  targetDate: "2026-06-30",
                  url: "https://linear.app/team/project/alpha-project-abc123",
                  lead: { name: "Bob" },
                },
              ],
            },
          },
        }),
      };
    }

    if (body.query.includes("issues(")) {
      return {
        ok: true,
        json: async () => ({
          data: {
            issues: {
              nodes: [
                {
                  identifier: "TEAM-1",
                  title: "Feature A",
                  state: { name: "In Progress", type: "started" },
                  projectMilestone: { name: "M1" },
                },
                {
                  identifier: "TEAM-2",
                  title: "Feature B",
                  state: { name: "Done", type: "completed" },
                  projectMilestone: { name: "M1" },
                },
                {
                  identifier: "TEAM-3",
                  title: "Feature C",
                  state: { name: "Todo", type: "unstarted" },
                  projectMilestone: null,
                },
              ],
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
  const { run } = await import("../verbs/project-status.mjs?1");
  const code = await run(["Alpha"]);
  console.log = orig;

  assert.equal(code, 0);
  const combined = out.join("\n");
  assert.match(combined, /Alpha Project/);
  assert.match(combined, /started/);
  assert.match(combined, /WIP by state/);
  assert.match(combined, /In Progress|Done|Todo/);
  assert.match(combined, /milestone/i);
  assert.match(combined, /M1/);
});

test("project-status returns 2 when no query given", async () => {
  process.env.LINEAR_API_KEY = "lin_test";

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/project-status.mjs?2");
  const code = await run([]);
  console.error = orig;

  assert.equal(code, 2);
});

test("project-status returns 1 when project not found", async () => {
  process.env.LINEAR_API_KEY = "lin_test";

  global.fetch = mock.fn(async () => ({
    ok: true,
    json: async () => ({ data: { projects: { nodes: [] } } }),
  }));

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/project-status.mjs?3");
  const code = await run(["nonexistent project xyz"]);
  console.error = orig;

  assert.equal(code, 1);
});

test("project-status lists multiple matches and returns 1", async () => {
  process.env.LINEAR_API_KEY = "lin_test";

  global.fetch = mock.fn(async () => ({
    ok: true,
    json: async () => ({
      data: {
        projects: {
          nodes: [
            { id: "p1", name: "Alpha One", state: "started", startDate: null, targetDate: null, url: "u1", lead: null },
            { id: "p2", name: "Alpha Two", state: "started", startDate: null, targetDate: null, url: "u2", lead: null },
          ],
        },
      },
    }),
  }));

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/project-status.mjs?4");
  const code = await run(["Alpha"]);
  console.log = orig;

  assert.equal(code, 1);
  const combined = out.join("\n");
  assert.match(combined, /Multiple matches/);
});
