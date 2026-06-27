// plugins/linear/scripts/test/pii-scan.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { scan } from "../lib/pii-scan.mjs";

test("rejects a DOB", () => {
  const r = scan("patient born 1990-05-12 filed a claim");
  assert.equal(r.clean, false);
  assert.equal(r.findings[0].kind, "dob");
  assert.match(r.redacted, /\[dob:REDACTED\]/);
});

test("clean text passes", () => {
  assert.equal(scan("cache regression on the claims page").clean, true);
});

// AWS allowlist via LINEAR_PII_AWS_ALLOWLIST
const FAKE_AWS_ID = "100000000001";

test("12-digit number is flagged when LINEAR_PII_AWS_ALLOWLIST is not set", () => {
  const prev = process.env.LINEAR_PII_AWS_ALLOWLIST;
  try {
    delete process.env.LINEAR_PII_AWS_ALLOWLIST;
    const r = scan(`arn:aws:iam::${FAKE_AWS_ID}:root`);
    assert.equal(r.clean, false, "should flag 12-digit number without allowlist");
    assert.ok(
      r.findings.some((f) => f.match === FAKE_AWS_ID),
      `expected ${FAKE_AWS_ID} in findings`,
    );
  } finally {
    if (prev === undefined) {
      delete process.env.LINEAR_PII_AWS_ALLOWLIST;
    } else {
      process.env.LINEAR_PII_AWS_ALLOWLIST = prev;
    }
  }
});

test("12-digit number is NOT flagged when it is in LINEAR_PII_AWS_ALLOWLIST", () => {
  const prev = process.env.LINEAR_PII_AWS_ALLOWLIST;
  try {
    process.env.LINEAR_PII_AWS_ALLOWLIST = FAKE_AWS_ID;
    const r = scan(`arn:aws:iam::${FAKE_AWS_ID}:root`);
    assert.equal(r.clean, true, "should not flag allowlisted AWS account ID");
  } finally {
    if (prev === undefined) {
      delete process.env.LINEAR_PII_AWS_ALLOWLIST;
    } else {
      process.env.LINEAR_PII_AWS_ALLOWLIST = prev;
    }
  }
});
