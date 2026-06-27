// plugins/linear/scripts/test/link-issues.test.mjs
import { test, mock } from "node:test";
import assert from "node:assert/strict";

function makeIssueFetch(issues) {
  return mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);

    if (body.query.includes("issue(")) {
      const id = body.variables?.id ?? "";
      const found = issues.find((i) => i.identifier === id || i.id === id);
      return {
        ok: true,
        json: async () => ({
          data: { issue: found ?? null },
        }),
      };
    }

    if (body.query.includes("issueRelationCreate(")) {
      return {
        ok: true,
        json: async () => ({
          data: { issueRelationCreate: { success: true, issueRelation: { id: "rel-1" } } },
        }),
      };
    }

    if (body.query.includes("issueUpdate(")) {
      return {
        ok: true,
        json: async () => ({
          data: { issueUpdate: { success: true, issue: { id: issues[0]?.id } } },
        }),
      };
    }

    return { ok: true, json: async () => ({ data: {} }) };
  });
}

test("link-issues creates a 'related' relation between two issues", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  const issues = [
    { id: "uuid-A", identifier: "TEAM-1", title: "Issue A" },
    { id: "uuid-B", identifier: "TEAM-2", title: "Issue B" },
  ];

  let relationBody = null;
  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("issueRelationCreate(")) {
      relationBody = body;
    }
    return makeIssueFetch(issues)(_url, opts);
  });

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/link-issues.mjs?1");
  const code = await run(["TEAM-1", "--related-to", "TEAM-2"]);
  console.log = orig;

  assert.equal(code, 0);
  assert.ok(relationBody !== null, "issueRelationCreate should have been called");
  const vars = JSON.stringify(relationBody.variables);
  assert.ok(vars.includes("related"), "relation type should be 'related'");
  const combined = out.join("\n");
  assert.match(combined, /TEAM-1/);
  assert.match(combined, /related/);
});

test("link-issues --blocks creates correct direction", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  const issues = [
    { id: "uuid-A", identifier: "TEAM-3", title: "Issue A" },
    { id: "uuid-B", identifier: "TEAM-4", title: "Issue B" },
  ];

  let relationBody = null;
  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("issueRelationCreate(")) {
      relationBody = body;
    }
    return makeIssueFetch(issues)(_url, opts);
  });

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/link-issues.mjs?2");
  const code = await run(["TEAM-3", "--blocks", "TEAM-4"]);
  console.log = orig;

  assert.equal(code, 0);
  assert.ok(relationBody !== null, "issueRelationCreate should have been called");
  const vars = JSON.stringify(relationBody.variables);
  assert.ok(vars.includes("blocks"), "relation type should be 'blocks'");
  // issueId should be source (uuid-A), relatedIssueId should be target (uuid-B)
  assert.ok(vars.includes("uuid-A"), "source issue should be issueId");
  assert.ok(vars.includes("uuid-B"), "target issue should be relatedIssueId");
});

test("link-issues --blocked-by flips direction", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  const issues = [
    { id: "uuid-A", identifier: "TEAM-5", title: "Issue A" },
    { id: "uuid-B", identifier: "TEAM-6", title: "Issue B" },
  ];

  let relationBody = null;
  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("issueRelationCreate(")) {
      relationBody = body;
    }
    return makeIssueFetch(issues)(_url, opts);
  });

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/link-issues.mjs?3");
  // TEAM-5 is blocked by TEAM-6 => TEAM-6 blocks TEAM-5 => issueId=uuid-B, relatedIssueId=uuid-A
  const code = await run(["TEAM-5", "--blocked-by", "TEAM-6"]);
  console.log = orig;

  assert.equal(code, 0);
  assert.ok(relationBody !== null, "issueRelationCreate should have been called");
  const vars = JSON.stringify(relationBody.variables);
  assert.ok(vars.includes("blocks"), "relation type should be 'blocks' (flipped)");
  // For --blocked-by: issueId = target (TEAM-6 = uuid-B), relatedIssueId = source (TEAM-5 = uuid-A)
  assert.ok(vars.includes("uuid-B"), "target (blocker) should be issueId");
  assert.ok(vars.includes("uuid-A"), "source (blocked) should be relatedIssueId");
});

test("link-issues --parent calls issueUpdate with parentId", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  const issues = [
    { id: "uuid-A", identifier: "TEAM-7", title: "Child issue" },
    { id: "uuid-B", identifier: "TEAM-8", title: "Parent issue" },
  ];

  let updateBody = null;
  global.fetch = mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("issueUpdate(")) {
      updateBody = body;
    }
    return makeIssueFetch(issues)(_url, opts);
  });

  const out = [];
  const orig = console.log;
  console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/link-issues.mjs?4");
  const code = await run(["TEAM-7", "--parent", "TEAM-8"]);
  console.log = orig;

  assert.equal(code, 0);
  assert.ok(updateBody !== null, "issueUpdate should have been called for parent");
  const vars = JSON.stringify(updateBody.variables);
  assert.ok(vars.includes("uuid-B"), "parentId should be the parent issue uuid");
  const combined = out.join("\n");
  assert.match(combined, /parent/i);
});

test("link-issues returns 2 with no link flags", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/link-issues.mjs?5");
  const code = await run(["TEAM-1"]);
  console.error = orig;

  assert.equal(code, 2);
});

test("link-issues returns 2 with no args", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "TEAM";

  const errOut = [];
  const orig = console.error;
  console.error = (...a) => errOut.push(a.join(" "));
  const { run } = await import("../verbs/link-issues.mjs?6");
  const code = await run([]);
  console.error = orig;

  assert.equal(code, 2);
});
