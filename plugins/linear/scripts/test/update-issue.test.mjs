// plugins/linear/scripts/test/update-issue.test.mjs
import { test, mock } from "node:test";
import assert from "node:assert/strict";

function makeFetch({ issueId = "issue-uuid-1", identifier = "TEAM-7", currentState = "Todo" } = {}) {
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

    if (body.query.includes("issue(")) {
      return {
        ok: true,
        json: async () => ({
          data: {
            issue: {
              id: issueId,
              identifier,
              title: "Old title",
              state: { id: "state-todo", name: currentState },
            },
          },
        }),
      };
    }

    if (body.query.includes("issueUpdate(")) {
      return {
        ok: true,
        json: async () => ({
          data: { issueUpdate: { success: true, issue: { id: issueId, identifier } } },
        }),
      };
    }

    return { ok: true, json: async () => ({ data: {} }) };
  });
}

test("update-issue updates title and prints confirmation", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  let mutationBody = null;
  const baseFetch = makeFetch();
  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("issueUpdate(")) {
      mutationBody = body;
    }
    return baseFetch(_url, opts);
  });

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/update-issue.mjs?1");
  const code = await run(["TEAM-7", "--title", "New title"]);
  console.log = orig;

  assert.equal(code, 0);
  assert.ok(mutationBody !== null, "issueUpdate mutation should have been called");
  const vars = JSON.stringify(mutationBody.variables);
  assert.ok(vars.includes("New title"), "mutation should include new title");
  const combined = out.join("\n");
  assert.match(combined, /TEAM-7/);
  assert.match(combined, /updated/);
});

test("update-issue returns 2 with no args", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/update-issue.mjs?2");
  const code = await run([]);
  console.error = orig;

  assert.equal(code, 2);
});

test("update-issue returns 2 with no update flags", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/update-issue.mjs?3");
  const code = await run(["TEAM-7"]);
  console.error = orig;

  assert.equal(code, 2);
});

test("update-issue returns 3 and does NOT mutate when title contains PII (DOB)", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  let mutationCalled = false;
  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("issueUpdate(")) {
      mutationCalled = true;
    }
    return { ok: true, json: async () => ({ data: {} }) };
  });

  const errOut = [];
  const origErr = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/update-issue.mjs?4");
  // DOB in the title — should trigger PII rejection
  const code = await run(["TEAM-7", "--title", "Issue for DOB 1990-05-12 person"]);
  console.error = origErr;

  assert.equal(code, 3, "should exit 3 on PII");
  assert.ok(!mutationCalled, "issueUpdate must NOT be called when PII detected");
  const combined = errOut.join("\n");
  assert.match(combined, /PII/i);
});

test("update-issue returns 1 when issue not found", async () => {
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
  const { run } = await import("../verbs/update-issue.mjs?5");
  const code = await run(["TEAM-99", "--title", "x"]);
  console.error = orig;

  assert.equal(code, 1);
});

test("update-issue accepts --priority flag", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  let mutationBody = null;
  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("issueUpdate(")) {
      mutationBody = body;
      return { ok: true, json: async () => ({ data: { issueUpdate: { success: true, issue: { id: "i1", identifier: "TEAM-7" } } } }) };
    }
    if (body.query.includes("issue(")) {
      return { ok: true, json: async () => ({ data: { issue: { id: "i1", identifier: "TEAM-7", title: "T", state: { id: "s1", name: "Todo" }, project: null } } }) };
    }
    return { ok: true, json: async () => ({ data: {} }) };
  });

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/update-issue.mjs?6");
  const code = await run(["TEAM-7", "--priority", "high"]);
  console.log = orig;

  assert.equal(code, 0);
  assert.ok(mutationBody !== null);
  const vars = JSON.stringify(mutationBody.variables);
  assert.ok(vars.includes("2"), "priority high should be integer 2");
});

test("update-issue --milestone resolves milestone by name and sends projectMilestoneId", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  let mutationBody = null;
  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);

    if (body.query.includes("issue(")) {
      return {
        ok: true,
        json: async () => ({
          data: {
            issue: {
              id: "issue-uuid-7",
              identifier: "TEAM-7",
              title: "T",
              state: { id: "s1", name: "Todo" },
              project: { id: "proj-uuid-1", name: "Oasis" },
            },
          },
        }),
      };
    }

    if (body.query.includes("projectMilestones(")) {
      return {
        ok: true,
        json: async () => ({
          data: {
            projectMilestones: {
              nodes: [{ id: "ms-uuid-1", name: "Q1 Launch" }],
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
          data: { issueUpdate: { success: true, issue: { id: "issue-uuid-7", identifier: "TEAM-7" } } },
        }),
      };
    }

    return { ok: true, json: async () => ({ data: {} }) };
  });

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/update-issue.mjs?7");
  const code = await run(["TEAM-7", "--milestone", "Q1 Launch"]);
  console.log = orig;

  assert.equal(code, 0);
  assert.ok(mutationBody !== null, "issueUpdate mutation should have been called");
  const vars = JSON.stringify(mutationBody.variables);
  assert.ok(vars.includes("ms-uuid-1"), "mutation should include resolved projectMilestoneId");
  assert.ok(vars.includes("milestone") || out.join("\n").includes("milestone"), "milestone should appear in updated fields");
  const combined = out.join("\n");
  assert.match(combined, /TEAM-7/);
  assert.match(combined, /updated/);
});

test("update-issue --milestone none sends projectMilestoneId: null", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  let mutationBody = null;
  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);

    if (body.query.includes("issue(")) {
      return {
        ok: true,
        json: async () => ({
          data: {
            issue: {
              id: "issue-uuid-8",
              identifier: "TEAM-8",
              title: "T",
              state: { id: "s1", name: "Todo" },
              project: { id: "proj-uuid-1", name: "Oasis" },
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
          data: { issueUpdate: { success: true, issue: { id: "issue-uuid-8", identifier: "TEAM-8" } } },
        }),
      };
    }

    return { ok: true, json: async () => ({ data: {} }) };
  });

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/update-issue.mjs?8");
  const code = await run(["TEAM-8", "--milestone", "none"]);
  console.log = orig;

  assert.equal(code, 0);
  assert.ok(mutationBody !== null, "issueUpdate mutation should have been called");
  const vars = mutationBody.variables;
  // projectMilestoneId must be explicitly null (not undefined)
  assert.ok(
    Object.prototype.hasOwnProperty.call(vars.input, "projectMilestoneId"),
    "input should have projectMilestoneId key",
  );
  assert.equal(vars.input.projectMilestoneId, null, "projectMilestoneId should be null for 'none'");
  const combined = out.join("\n");
  assert.match(combined, /TEAM-8/);
  assert.match(combined, /milestone/);
});

test("update-issue --milestone returns 1 when issue has no project", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("issue(")) {
      return {
        ok: true,
        json: async () => ({
          data: {
            issue: {
              id: "issue-uuid-9",
              identifier: "TEAM-9",
              title: "T",
              state: { id: "s1", name: "Todo" },
              project: null,
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
  const { run } = await import("../verbs/update-issue.mjs?9");
  const code = await run(["TEAM-9", "--milestone", "Q1 Launch"]);
  console.error = orig;

  assert.equal(code, 1);
  const combined = errOut.join("\n");
  assert.match(combined, /no project/i);
});
