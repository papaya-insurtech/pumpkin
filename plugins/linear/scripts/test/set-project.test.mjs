// plugins/linear/scripts/test/set-project.test.mjs
import { test, mock } from "node:test";
import assert from "node:assert/strict";

test("set-project resolves project by name and updates issue", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  let mutationBody = null;
  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);

    if (body.query.includes("projects(")) {
      return {
        ok: true,
        json: async () => ({
          data: {
            projects: {
              nodes: [{ id: "proj-uuid-1", name: "Alpha Project" }],
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
              title: "Build feature X",
              url: "https://linear.app/team/issue/TEAM-5",
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
          data: { issueUpdate: { success: true } },
        }),
      };
    }

    return { ok: true, json: async () => ({ data: {} }) };
  });

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/set-project.mjs?1");
  const code = await run(["TEAM-5", "--project", "Alpha Project"]);
  console.log = orig;

  assert.equal(code, 0);
  assert.ok(mutationBody !== null, "issueUpdate mutation should have been called");
  const vars = mutationBody.variables;
  assert.equal(vars.projectId, "proj-uuid-1");
  const combined = out.join("\n");
  assert.match(combined, /TEAM-5/);
  assert.match(combined, /Alpha Project/);
});

test("set-project returns 2 when id is missing", async () => {
  process.env.LINEAR_API_KEY = "lin_test";

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/set-project.mjs?2");
  const code = await run(["--project", "Alpha"]);
  console.error = orig;

  assert.equal(code, 2);
});

test("set-project returns 2 when --project is missing", async () => {
  process.env.LINEAR_API_KEY = "lin_test";

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/set-project.mjs?3");
  const code = await run(["TEAM-5"]);
  console.error = orig;

  assert.equal(code, 2);
});

test("set-project returns 1 when project not found", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("projects(")) {
      return {
        ok: true,
        json: async () => ({ data: { projects: { nodes: [] } } }),
      };
    }
    return { ok: true, json: async () => ({ data: {} }) };
  });

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/set-project.mjs?4");
  const code = await run(["TEAM-5", "--project", "Nonexistent"]);
  console.error = orig;

  assert.equal(code, 1);
});

test("set-project handles ambiguous project names", async () => {
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
                { id: "p1", name: "Alpha One" },
                { id: "p2", name: "Alpha Two" },
              ],
            },
          },
        }),
      };
    }
    return { ok: true, json: async () => ({ data: {} }) };
  });

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/set-project.mjs?5");
  const code = await run(["TEAM-5", "--project", "Alpha"]);
  console.error = orig;

  assert.equal(code, 1);
  const combined = errOut.join("\n");
  assert.match(combined, /[Aa]mbiguous/);
});
