// plugins/linear/scripts/test/pr-ref.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractRef } from "../lib/pr-ref.mjs";

test("extractRef finds team-agnostic ref", () => {
  assert.equal(extractRef("body\n\nRef: ENG-12\n"), "ENG-12");
  assert.equal(extractRef("Ref:   pap-7"), "PAP-7");
  assert.equal(extractRef("no ref here"), null);
});
