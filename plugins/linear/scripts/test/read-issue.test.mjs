// plugins/linear/scripts/test/read-issue.test.mjs
import { test, mock } from "node:test";
import assert from "node:assert/strict";

test("read-issue --json prints issue fields", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";
  global.fetch = mock.fn(async () => ({
    ok: true,
    json: async () => ({ data: { issue: {
      identifier: "PAP-42", title: "Fix cache", url: "https://linear.app/x/issue/PAP-42",
      state: { name: "In Progress" }, priority: 2, assignee: { name: "A", email: "a@b.c" },
      labels: { nodes: [{ name: "bug" }] }, project: { name: "Blue" },
      createdAt: "2026-01-01", updatedAt: "2026-01-02", description: "desc",
      parent: null, children: { nodes: [] }, relations: { nodes: [] }, inverseRelations: { nodes: [] },
      attachments: { nodes: [] }, comments: { nodes: [] },
    } } }),
  }));
  const out = [];
  const orig = console.log; console.log = (...a) => out.push(a.join(" "));
  const { run } = await import("../verbs/read-issue.mjs?1");
  const code = await run(["PAP-42", "--json"]);
  console.log = orig;
  assert.equal(code, 0);
  const obj = JSON.parse(out.join("\n"));
  assert.equal(obj.identifier, "PAP-42");
  assert.equal(obj.state, "In Progress");
});
