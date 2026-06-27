// plugins/linear/scripts/verbs/triage-todos.mjs
// Scan the repo for TODO/FIXME/HACK comments, group by module, and propose
// Linear tech-debt issues.
//
// Usage:
//   node linear.mjs triage-todos                     # dry-run: propose only
//   node linear.mjs triage-todos --go                # create after review
//   node linear.mjs triage-todos --epic <TEAM-N>     # file as sub-issues of epic
//   node linear.mjs triage-todos --related-to <ids>  # link to related issues
//
// Area label sanitization:
//   Uses the grouping directory's own name as a best-effort area label ONLY
//   if a label with that exact name already exists in the workspace.
//   NO hardcoded dir→label mapping — keeps this tool generic for any repo.

import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gql, getTeam, labelIdByName, resolveIssueByIdentifier } from "../lib/client.mjs";
import { scan } from "../lib/pii-scan.mjs";
import { parseIssueIdentifier } from "../lib/session.mjs";

const ISSUE_CREATE = `
mutation($input: IssueCreateInput!) {
  issueCreate(input: $input) {
    success
    issue { id identifier url }
  }
}
`;

const RELATION_CREATE = `
mutation($input: IssueRelationCreateInput!) {
  issueRelationCreate(input: $input) {
    success
    issueRelation { id }
  }
}
`;

function printUsage() {
  console.error(
    [
      "usage: node linear.mjs triage-todos [--epic <TEAM-N>] [--related-to <ids>] [--go]",
    ].join("\n"),
  );
}

/**
 * Walk directory tree collecting files matching extensions (.ts, .tsx),
 * excluding the given directories.
 */
function walkFiles(dir, extensions, excludeDirs = new Set(), results = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!excludeDirs.has(entry.name)) {
        walkFiles(fullPath, extensions, excludeDirs, results);
      }
    } else if (entry.isFile()) {
      if (extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const TODO_PATTERN = /(TODO|FIXME|HACK)[:( ]/;

/**
 * Scan files for TODO/FIXME/HACK markers. Returns array of { path, line, text }.
 * Uses ripgrep if available, falls back to Node-based walk.
 */
function findTodoHits(cwd = process.cwd()) {
  // Try ripgrep first
  const rgResult = spawnSync(
    "rg",
    [
      "-n",
      "--no-heading",
      "--glob=!node_modules",
      "--glob=!.claude",
      "--glob=!worktrees",
      "-t", "ts",
      "-t", "tsx",
      "-e", "(TODO|FIXME|HACK)[:( ]",
    ],
    { encoding: "utf8", cwd },
  );

  // rg status 0 = matches found, 1 = no matches, anything else (or null = not found) = error
  if (rgResult.status === null || rgResult.status > 1 || rgResult.error) {
    // rg not found or failed — fall back to Node walk
    return nodeFallbackWalk(cwd);
  }

  const hits = [];
  for (const rawLine of (rgResult.stdout || "").split("\n")) {
    if (!rawLine) continue;
    const m = rawLine.match(/^([^:]+):(\d+):(.*)$/);
    if (!m) continue;
    const [, filePath, lineNumStr, text] = m;
    hits.push({ path: filePath, line: Number(lineNumStr), text: text.trim() });
  }
  return hits;
}

function nodeFallbackWalk(cwd) {
  const excludeDirs = new Set(["node_modules", ".claude", "worktrees"]);
  const files = walkFiles(cwd, [".ts", ".tsx"], excludeDirs);
  const hits = [];
  for (const filePath of files) {
    let content;
    try {
      content = readFileSync(filePath, "utf8");
    } catch {
      continue;
    }
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (TODO_PATTERN.test(lines[i])) {
        // Make path relative to cwd for consistency with rg output
        const relPath = filePath.startsWith(cwd + "/")
          ? filePath.slice(cwd.length + 1)
          : filePath;
        hits.push({ path: relPath, line: i + 1, text: lines[i].trim() });
      }
    }
  }
  return hits;
}

export async function run(argv) {
  let go = false;
  let epicArg;
  let relatedToCsv;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--go") {
      go = true;
    } else if (a === "--epic") {
      epicArg = argv[++i];
    } else if (a === "--related-to") {
      relatedToCsv = argv[++i];
    } else if (a === "--help" || a === "-h") {
      printUsage();
      return 0;
    } else {
      console.error(`unexpected argument: ${a}`);
      printUsage();
      return 2;
    }
  }

  const epicIdentifier = epicArg ? parseIssueIdentifier(epicArg) : undefined;
  const relatedToIdentifiers = relatedToCsv
    ? relatedToCsv.split(",").map((s) => s.trim()).filter(Boolean).map((s) => parseIssueIdentifier(s))
    : [];

  // Scan for markers
  const hits = findTodoHits(process.cwd());
  console.log(`Found ${hits.length} TODO/FIXME/HACK in the repo.`);
  if (hits.length === 0) return 0;

  // Group by top-level directory
  const byArea = new Map();
  for (const h of hits) {
    const top = h.path.split("/")[0] ?? "other";
    if (!byArea.has(top)) byArea.set(top, []);
    byArea.get(top).push(h);
  }

  // Build drafts — area label is the dir name ONLY if that label exists in workspace
  // (checked lazily after labels are loaded, when --go is used or during dry-run proposal)
  const drafts = [];
  for (const [top, arr] of byArea) {
    const title = `Triage ${arr.length} TODO/FIXME in ${top}/`;
    const body =
      `## Problem\n\nAccumulated TODO/FIXME comments in \`${top}/\`.\n\n` +
      `## Evidence\n\n` +
      arr.slice(0, 40).map((h) => `- \`${h.path}:${h.line}\` — ${h.text.slice(0, 120)}`).join("\n") +
      `\n\n## Proposed approach\n\nReview each marker; either fix or convert to a focused tech-debt issue. Delete the marker once addressed.\n` +
      `\n## Risk if deferred\n\nComments keep compounding; future authors can't tell which are still relevant.\n`;

    // PII scan the body
    const piiResult = scan(body);
    if (!piiResult.clean) {
      console.error(`Skipping ${top}: PII in comment text (${piiResult.findings.length} finding(s))`);
      continue;
    }

    drafts.push({ dirName: top, title, description: body });
  }

  // Print proposals
  console.log(`\nProposed tech-debt issues (${drafts.length}):`);
  for (const d of drafts) {
    console.log(`  [${d.dirName}] ${d.title}`);
  }

  // Print link summary
  const linkSummary = [];
  if (epicIdentifier) linkSummary.push(`epic (parent): ${epicIdentifier}`);
  if (relatedToIdentifiers.length) linkSummary.push(`related-to: ${relatedToIdentifiers.join(", ")}`);
  if (linkSummary.length) console.log(`\nLinks for every ticket: ${linkSummary.join("  |  ")}`);

  if (!go) {
    console.log(`\nRe-run with --go to create these issues.`);
    return 0;
  }

  console.log(`\nCreating…`);

  let team;
  try {
    team = await getTeam();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  // Resolve relationship targets once
  let epicTarget;
  let relatedToTargets = [];
  try {
    epicTarget = epicIdentifier ? await resolveIssueByIdentifier(epicIdentifier) : undefined;
    relatedToTargets = await Promise.all(relatedToIdentifiers.map(resolveIssueByIdentifier));
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  // Resolve base label IDs (tech-debt, ai-suggested, internal)
  const baseLabels = [];
  for (const n of ["tech-debt", "ai-suggested", "internal"]) {
    const id = await labelIdByName(n);
    if (id) baseLabels.push(id);
  }

  for (const d of drafts) {
    // Area label: dir's own name ONLY if that exact label exists in workspace
    const areaId = await labelIdByName(d.dirName);
    const labelIds = [...baseLabels, ...(areaId ? [areaId] : [])];

    const input = {
      teamId: team.teamId,
      title: d.title,
      description: d.description,
      labelIds,
    };
    if (epicTarget) input.parentId = epicTarget.id;

    let createData;
    try {
      createData = await gql(ISSUE_CREATE, { input });
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      return 1;
    }

    const created = createData.issueCreate?.issue;
    if (!created) {
      console.error(`issueCreate returned no issue for '${d.title}'`);
      return 1;
    }

    console.log(`  + ${created.identifier}  ${d.title}`);
    if (epicTarget) console.log(`    parent: ${epicTarget.identifier}`);

    for (const t of relatedToTargets) {
      try {
        await gql(RELATION_CREATE, {
          input: { issueId: created.id, relatedIssueId: t.id, type: "related" },
        });
        console.log(`    related to ${t.identifier}`);
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        return 1;
      }
    }
  }

  return 0;
}
