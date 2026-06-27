// plugins/linear/scripts/test/triage-todos.test.mjs
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { _resetCachesForTesting } from "../lib/session.mjs";

function makeTempRepo() {
  const tmpRepo = mkdtempSync(join(tmpdir(), "linear-triage-todos-"));
  execFileSync("git", ["init", tmpRepo], { stdio: "ignore" });
  execFileSync("git", ["-C", tmpRepo, "config", "user.email", "test@test.com"], { stdio: "ignore" });
  execFileSync("git", ["-C", tmpRepo, "config", "user.name", "Test"], { stdio: "ignore" });
  return tmpRepo;
}

// Build a mock fetch that returns no area labels by default
function makeFetchNoLabels() {
  return mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("issueLabels(")) {
      return {
        ok: true,
        json: async () => ({
          data: { issueLabels: { nodes: [] } },
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
    if (body.query.includes("issueCreate(")) {
      return {
        ok: true,
        json: async () => ({
          data: { issueCreate: { success: true, issue: { id: "issue-new", identifier: "PAP-99", url: "https://linear.app/issue/PAP-99" } } },
        }),
      };
    }
    return { ok: true, json: async () => ({ data: {} }) };
  });
}

// Build a mock fetch that returns a label named exactly like the dir
function makeFetchWithDirLabel(dirName) {
  return mock.fn(async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.query.includes("issueLabels(")) {
      const labels = [
        { id: "label-tech-debt", name: "tech-debt", parent: null },
        { id: "label-ai-suggested", name: "ai-suggested", parent: null },
        { id: "label-internal", name: "internal", parent: null },
        { id: `label-area-${dirName}`, name: dirName, parent: null },
      ];
      return {
        ok: true,
        json: async () => ({
          data: { issueLabels: { nodes: labels } },
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
    if (body.query.includes("issueCreate(")) {
      return {
        ok: true,
        json: async () => ({
          data: { issueCreate: { success: true, issue: { id: "issue-new", identifier: "PAP-99", url: "https://linear.app/issue/PAP-99" } } },
        }),
      };
    }
    return { ok: true, json: async () => ({ data: {} }) };
  });
}

test("triage-todos dry-run: groups by directory and lists the marker without creating issues", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const tmpRepo = makeTempRepo();
  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    // Create a TypeScript file with a TODO in a subdirectory
    mkdirSync(join(tmpRepo, "src"), { recursive: true });
    writeFileSync(
      join(tmpRepo, "src", "utils.ts"),
      `export function helper() {\n  // TODO: refactor this\n  return 1;\n}\n`
    );

    let issueCreateCalled = false;
    global.fetch = mock.fn(async (_url, opts) => {
      const body = JSON.parse(opts.body);
      if (body.query.includes("issueCreate(")) issueCreateCalled = true;
      if (body.query.includes("issueLabels(")) {
        return { ok: true, json: async () => ({ data: { issueLabels: { nodes: [] } } }) };
      }
      return { ok: true, json: async () => ({ data: {} }) };
    });

    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    const { run } = await import("../verbs/triage-todos.mjs?1");
    const code = await run([]);
    console.log = orig;

    // Should be 0 (dry-run success)
    assert.equal(code, 0, "dry-run should exit 0");

    // No issueCreate should have been called
    assert.ok(!issueCreateCalled, "issueCreate must NOT be called without --go");

    // Output should list the dir group
    const combined = out.join("\n");
    assert.match(combined, /src/, "output should mention 'src' directory group");
    assert.match(combined, /TODO|FIXME|triage|Triage/i, "output should mention the todo markers");
  } finally {
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("triage-todos dry-run: handles FIXME and HACK markers", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const tmpRepo = makeTempRepo();
  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    mkdirSync(join(tmpRepo, "api"), { recursive: true });
    writeFileSync(
      join(tmpRepo, "api", "router.ts"),
      `// FIXME: this is broken\n// HACK: workaround for issue\nexport {};\n`
    );

    global.fetch = mock.fn(async () => ({ ok: true, json: async () => ({ data: { issueLabels: { nodes: [] } } }) }));

    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    const { run } = await import("../verbs/triage-todos.mjs?2");
    const code = await run([]);
    console.log = orig;

    assert.equal(code, 0);
    const combined = out.join("\n");
    assert.match(combined, /api/i, "output should list api dir");
  } finally {
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("triage-todos area label ONLY attached when dir-named label exists in workspace", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const tmpRepo = makeTempRepo();
  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    // Create a dir named "mymodule" — this label WILL exist in the workspace
    mkdirSync(join(tmpRepo, "mymodule"), { recursive: true });
    writeFileSync(
      join(tmpRepo, "mymodule", "index.ts"),
      `// TODO: fix me\nexport {};\n`
    );

    // Also create a dir named "orphandir" — NO label with that name exists
    mkdirSync(join(tmpRepo, "orphandir"), { recursive: true });
    writeFileSync(
      join(tmpRepo, "orphandir", "index.ts"),
      `// FIXME: broken\nexport {};\n`
    );

    // Fetch that returns a label named "mymodule" but NOT "orphandir"
    const labelCalls = [];
    global.fetch = mock.fn(async (_url, opts) => {
      const body = JSON.parse(opts.body);
      if (body.query.includes("issueLabels(")) {
        return {
          ok: true,
          json: async () => ({
            data: {
              issueLabels: {
                nodes: [
                  { id: "label-mymodule", name: "mymodule", parent: null },
                  { id: "label-tech-debt", name: "tech-debt", parent: null },
                  { id: "label-ai-suggested", name: "ai-suggested", parent: null },
                  { id: "label-internal", name: "internal", parent: null },
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
      if (body.query.includes("issueCreate(")) {
        labelCalls.push(body.variables.input.labelIds ?? []);
        return {
          ok: true,
          json: async () => ({
            data: { issueCreate: { success: true, issue: { id: "issue-new", identifier: "PAP-99", url: "https://linear.app/issue/PAP-99" } } },
          }),
        };
      }
      return { ok: true, json: async () => ({ data: {} }) };
    });

    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    const { run } = await import("../verbs/triage-todos.mjs?3");
    // With --go to actually create issues and inspect label usage
    const code = await run(["--go"]);
    console.log = orig;

    assert.equal(code, 0, "should exit 0");

    // mymodule issue should have the "mymodule" area label
    // orphandir issue should NOT have any area label (no matching label in workspace)
    assert.ok(labelCalls.length >= 1, "at least one issueCreate should have been called");

    // Find the mymodule issue call (any call that includes "label-mymodule")
    const mymoduleCall = labelCalls.find((ids) => ids.includes("label-mymodule"));
    assert.ok(mymoduleCall !== undefined, "mymodule issue should have the mymodule area label");

    // For orphandir: none of the calls should have a label that doesn't exist in workspace
    // (The only valid label ids are label-mymodule, label-tech-debt, label-ai-suggested, label-internal)
    const validLabelIds = new Set(["label-mymodule", "label-tech-debt", "label-ai-suggested", "label-internal"]);
    for (const ids of labelCalls) {
      for (const id of ids) {
        assert.ok(validLabelIds.has(id), `unexpected label id ${id} — should only use workspace labels`);
      }
    }
  } finally {
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("triage-todos returns 0 with no TODO markers found", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const tmpRepo = makeTempRepo();
  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    // Create a TypeScript file with NO TODO markers
    mkdirSync(join(tmpRepo, "src"), { recursive: true });
    writeFileSync(
      join(tmpRepo, "src", "clean.ts"),
      `export function clean() { return 1; }\n`
    );

    global.fetch = mock.fn(async () => ({ ok: true, json: async () => ({ data: {} }) }));

    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    const { run } = await import("../verbs/triage-todos.mjs?4");
    const code = await run([]);
    console.log = orig;

    assert.equal(code, 0, "should exit 0 when no markers found");
    const combined = out.join("\n");
    assert.match(combined, /0/, "output should mention 0 matches");
  } finally {
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test("triage-todos --go creates issues with tech-debt + ai-suggested + internal labels", async () => {
  process.env.LINEAR_API_KEY = "lin_test";
  process.env.LINEAR_TEAM_KEY = "PAP";

  const tmpRepo = makeTempRepo();
  _resetCachesForTesting();
  const savedCwd = process.cwd();
  process.chdir(tmpRepo);

  try {
    mkdirSync(join(tmpRepo, "backend"), { recursive: true });
    writeFileSync(
      join(tmpRepo, "backend", "service.ts"),
      `// TODO: add logging\nexport {};\n`
    );

    const issueCreateCalls = [];
    global.fetch = mock.fn(async (_url, opts) => {
      const body = JSON.parse(opts.body);
      if (body.query.includes("issueLabels(")) {
        return {
          ok: true,
          json: async () => ({
            data: {
              issueLabels: {
                nodes: [
                  { id: "label-tech-debt", name: "tech-debt", parent: null },
                  { id: "label-ai-suggested", name: "ai-suggested", parent: null },
                  { id: "label-internal", name: "internal", parent: null },
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
      if (body.query.includes("issueCreate(")) {
        issueCreateCalls.push(body.variables.input);
        return {
          ok: true,
          json: async () => ({
            data: { issueCreate: { success: true, issue: { id: "issue-new", identifier: "PAP-99", url: "https://linear.app/issue/PAP-99" } } },
          }),
        };
      }
      return { ok: true, json: async () => ({ data: {} }) };
    });

    const out = [];
    const orig = console.log;
    console.log = (...a) => out.push(a.join(" "));

    const { run } = await import("../verbs/triage-todos.mjs?5");
    const code = await run(["--go"]);
    console.log = orig;

    assert.equal(code, 0, "should exit 0");
    assert.ok(issueCreateCalls.length >= 1, "should have created at least one issue");

    // Verify the issue has all three required base labels
    const created = issueCreateCalls[0];
    assert.ok(created.labelIds.includes("label-tech-debt"), "should have tech-debt label");
    assert.ok(created.labelIds.includes("label-ai-suggested"), "should have ai-suggested label");
    assert.ok(created.labelIds.includes("label-internal"), "should have internal label");
    assert.ok(created.title.includes("backend"), "title should include the dir name");
  } finally {
    process.chdir(savedCwd);
    _resetCachesForTesting();
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});
