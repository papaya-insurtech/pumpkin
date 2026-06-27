// plugins/linear/scripts/test/client.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";

test("gql posts query+variables and returns data", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  const calls = [];
  global.fetch = mock.fn(async (url, init) => {
    calls.push({ url, init });
    return { ok: true, json: async () => ({ data: { viewer: { id: "u1", name: "A", email: "a@b.c" } } }) };
  });
  const { gql } = await import("../lib/client.mjs?1");
  const data = await gql("query { viewer { id } }", { x: 1 });
  assert.equal(calls[0].url, "https://api.linear.app/graphql");
  assert.equal(JSON.parse(calls[0].init.body).variables.x, 1);
  assert.equal(calls[0].init.headers.Authorization, "lin_test");
  assert.deepEqual(data.viewer, { id: "u1", name: "A", email: "a@b.c" });
});

test("gql throws readable error on GraphQL errors array", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  global.fetch = mock.fn(async () => ({ ok: true, json: async () => ({ errors: [{ message: "boom" }] }) }));
  const { gql } = await import("../lib/client.mjs?2");
  await assert.rejects(() => gql("query{}"), /boom/);
});
