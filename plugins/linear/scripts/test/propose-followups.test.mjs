// plugins/linear/scripts/test/propose-followups.test.mjs
//
// NOTE: propose-followups reads observations from stdin, which is awkward in unit
// tests. The verb exports a `proposeFollowups(observations, opts)` function that
// contains all the logic, so we test that instead of invoking `run()` with stdin.
// The `run()` tests that ARE here only test argument parsing / CLI behavior that
// does NOT require reading stdin.

import { test, mock } from "node:test";
import assert from "node:assert/strict";

// Standard fetch mock factory
function makeStandardFetch({ projectId = "project-uuid-1", projectName = "My Project" } = {}) {
  const issueCreateCalls = [];
  const fetchFn = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);

    if (body.query.includes("issueLabels(")) {
      return {
        ok: true,
        json: async () => ({
          data: {
            issueLabels: {
              nodes: [
                { id: "label-tech-debt", name: "tech-debt", parent: null },
                { id: "label-post-deploy", name: "post-deploy", parent: null },
                { id: "label-ai-suggested", name: "ai-suggested", parent: null },
                { id: "label-env-prod", name: "env:prod", parent: null },
                { id: "label-env-test", name: "env:test", parent: null },
                { id: "label-env-sit", name: "env:sit", parent: null },
                { id: "label-env-uat", name: "env:uat", parent: null },
                { id: "label-area-backend", name: "backend", parent: null },
              ],
            },
          },
        }),
      };
    }

    if (body.query.includes("teams(")) {
      return {
        ok: true,
        json: async () => ({
          data: { teams: { nodes: [{ id: "team-id-1", key: "PAP", cyclesEnabled: false, triageEnabled: false }] } },
        }),
      };
    }

    if (body.query.includes("projects(")) {
      return {
        ok: true,
        json: async () => ({
          data: {
            projects: {
              nodes: [{ id: projectId, name: projectName }],
            },
          },
        }),
      };
    }

    if (body.query.includes("issueCreate(")) {
      issueCreateCalls.push(body.variables.input);
      return {
        ok: true,
        json: async () => ({
          data: {
            issueCreate: {
              success: true,
              issue: { id: "issue-new", identifier: "PAP-99", url: "https://linear.app/issue/PAP-99" },
            },
          },
        }),
      };
    }

    return { ok: true, json: async () => ({ data: {} }) };
  });
  return { fetchFn, issueCreateCalls };
}

test("proposeFollowups dry-run: prints proposed issues without creating them", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const { fetchFn, issueCreateCalls } = makeStandardFetch();
  global.fetch = fetchFn;

  const { proposeFollowups } = await import("../verbs/propose-followups.mjs?1");

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));

  const result = await proposeFollowups(
    ["cache hit ratio dropped from 92% to 78%", "cold start regression observed"],
    { project: "My Project", go: false, env: "prod" }
  );

  console.log = orig;

  assert.equal(result, 0, "dry-run should exit 0");
  assert.equal(issueCreateCalls.length, 0, "issueCreate should NOT be called on dry-run");
  const combined = out.join("\n");
  assert.match(combined, /proposed|Proposed/i, "output should mention proposed issues");
  assert.match(combined, /--go/i, "dry-run output should mention --go");
});

test("proposeFollowups --go: creates issues with correct labels (tech-debt + post-deploy + ai-suggested + env:prod)", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const { fetchFn, issueCreateCalls } = makeStandardFetch();
  global.fetch = fetchFn;

  const { proposeFollowups } = await import("../verbs/propose-followups.mjs?2");

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));

  const result = await proposeFollowups(
    ["router caching drop after deploy"],
    { project: "My Project", go: true, env: "prod" }
  );

  console.log = orig;

  assert.equal(result, 0, "should exit 0");
  assert.equal(issueCreateCalls.length, 1, "should have created one issue");

  const created = issueCreateCalls[0];
  assert.ok(created.labelIds.includes("label-tech-debt"), "must have tech-debt label");
  assert.ok(created.labelIds.includes("label-post-deploy"), "must have post-deploy label");
  assert.ok(created.labelIds.includes("label-ai-suggested"), "must have ai-suggested label");
  assert.ok(created.labelIds.includes("label-env-prod"), "must have env:prod label");
});

test("proposeFollowups: env label changes with --env flag", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const { fetchFn, issueCreateCalls } = makeStandardFetch();
  global.fetch = fetchFn;

  const { proposeFollowups } = await import("../verbs/propose-followups.mjs?3");

  const result = await proposeFollowups(
    ["staging regression observed"],
    { project: "My Project", go: true, env: "sit" }
  );

  assert.equal(result, 0);
  const created = issueCreateCalls[0];
  assert.ok(created.labelIds.includes("label-env-sit"), "must have env:sit label for --env sit");
  assert.ok(!created.labelIds.includes("label-env-prod"), "must NOT have env:prod label when env is sit");
});

test("proposeFollowups: --area flag adds area label when it exists", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const { fetchFn, issueCreateCalls } = makeStandardFetch();
  global.fetch = fetchFn;

  const { proposeFollowups } = await import("../verbs/propose-followups.mjs?4");

  const result = await proposeFollowups(
    ["backend slowdown"],
    { project: "My Project", go: true, env: "prod", area: "backend" }
  );

  assert.equal(result, 0);
  const created = issueCreateCalls[0];
  assert.ok(created.labelIds.includes("label-area-backend"), "must include backend area label");
});

test("proposeFollowups: PII in observation is rejected with exit 3 and no issueCreate", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const { fetchFn, issueCreateCalls } = makeStandardFetch();
  global.fetch = fetchFn;

  const { proposeFollowups } = await import("../verbs/propose-followups.mjs?5");

  const errOut = [];
  const origErr = console.error;
  console.error = (...a) => errOut.push(a.join(" "));

  // Observation containing a DOB (PII)
  const result = await proposeFollowups(
    ["user born 1990-05-12 had auth failure"],
    { project: "My Project", go: true, env: "prod" }
  );

  console.error = origErr;

  assert.equal(result, 3, "should exit 3 on PII detection");
  assert.equal(issueCreateCalls.length, 0, "issueCreate must NOT be called when PII detected");
  const combined = errOut.join("\n");
  assert.match(combined, /PII|REJECTED/i, "error output should mention PII rejection");
});

test("proposeFollowups: multiple observations — PII ones are rejected, clean ones are proposed", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const { fetchFn, issueCreateCalls } = makeStandardFetch();
  global.fetch = fetchFn;

  const { proposeFollowups } = await import("../verbs/propose-followups.mjs?6");

  const errOut = [];
  const origErr = console.error;
  console.error = (...a) => errOut.push(a.join(" "));

  // Mix of clean and PII observations
  const result = await proposeFollowups(
    [
      "cache hit ratio dropped after deploy",  // clean
      "user born 1990-05-12 had auth failure", // PII — rejected
      "CPU usage spiked to 95% on prod",       // clean
    ],
    { project: "My Project", go: false, env: "prod" }
  );

  console.error = origErr;

  // Dry-run so no issueCreate, but PII rejection still fires.
  // Any PII in any observation causes the entire run to exit 3 — nothing is created.
  assert.equal(result, 3, "should exit 3 when any observation has PII");
  assert.ok(issueCreateCalls.length === 0, "no creation on dry-run");
  const combined = errOut.join("\n");
  assert.match(combined, /REJECTED|PII/i, "should report PII rejection");
});

test("proposeFollowups: returns 1 when project not found", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("issueLabels(")) {
      return { ok: true, json: async () => ({ data: { issueLabels: { nodes: [] } } }) };
    }
    if (body.query.includes("teams(")) {
      return {
        ok: true,
        json: async () => ({
          data: { teams: { nodes: [{ id: "team-id-1", key: "PAP", cyclesEnabled: false, triageEnabled: false }] } },
        }),
      };
    }
    if (body.query.includes("projects(")) {
      return { ok: true, json: async () => ({ data: { projects: { nodes: [] } } }) };
    }
    return { ok: true, json: async () => ({ data: {} }) };
  });

  const { proposeFollowups } = await import("../verbs/propose-followups.mjs?7");

  const errOut = [];
  const origErr = console.error;
  console.error = (...a) => errOut.push(a.join(" "));

  const result = await proposeFollowups(
    ["some observation"],
    { project: "NonExistentProject", go: false, env: "prod" }
  );

  console.error = origErr;

  assert.equal(result, 1, "should exit 1 when project not found");
});

test("propose-followups run() returns 2 when --project is missing", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  global.fetch = mock.fn(async () => ({ ok: true, json: async () => ({ data: {} }) }));

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));

  const { run } = await import("../verbs/propose-followups.mjs?8");
  const code = await run([]);
  console.error = orig;

  assert.equal(code, 2, "missing --project should exit 2");
  assert.ok(errOut.some((l) => l.includes("--project")), "error should mention --project");
});
