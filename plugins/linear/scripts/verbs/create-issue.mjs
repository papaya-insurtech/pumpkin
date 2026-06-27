// plugins/linear/scripts/verbs/create-issue.mjs
// Create one or many Linear issues.
//
// Two input modes:
//   Quick-capture: single issue via flags.
//     node linear.mjs create-issue --title "<t>" [--state <s>] [--labels <l1,l2>] [--priority <0-4>] [--description "<d>"]
//
//   Batch: JSON array on stdin.
//     cat issues.json | node linear.mjs create-issue --state Backlog --go
//
//   JSON shape: { title, description?, labels?, priority? }
//
// Relationship flags (apply to ALL issues):
//   --parent <TEAM-N>
//   --related-to <TEAM-N,...>
//   --blocks <TEAM-N,...>
//   --blocked-by <TEAM-N,...>
//   --duplicate-of <TEAM-N>
//
// Human-gate: batches of >=3 require --go.
// Exit codes: 0 success, 1 API/not-found, 2 bad args, 3 PII rejected.

import { gql, getTeam, resolveStateId, getLabels, labelIdByName, resolveIssueByIdentifier } from "../lib/client.mjs";
import { scanFields } from "../lib/pii-scan.mjs";
import { parseIssueIdentifier } from "../lib/session.mjs";

const CREATE_MUTATION = `
mutation($input: IssueCreateInput!) {
  issueCreate(input: $input) {
    success
    issue { id identifier url }
  }
}
`;

const RELATION_MUTATION = `
mutation($input: IssueRelationCreateInput!) {
  issueRelationCreate(input: $input) {
    success
    issueRelation { id }
  }
}
`;

function placeholderDescription(title) {
  return [
    `> _Draft placeholder — author fills in each section later._`,
    ``,
    `**Idea:** ${title}`,
    ``,
    `## Problem`,
    ``,
    `_TBD — describe the problem this issue addresses._`,
    ``,
    `## Proposal`,
    ``,
    `_TBD — sketch the approach._`,
    ``,
    `## Scope`,
    ``,
    `- _TBD_`,
    ``,
    `## Out of scope`,
    ``,
    `- _TBD_`,
    ``,
    `## Open questions`,
    ``,
    `- _TBD_`,
    ``,
  ].join("\n");
}

function parseList(csv) {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => parseIssueIdentifier(s));
}

export async function run(argv) {
  if (argv[0] === "--help" || argv[0] === "-h") {
    console.log(
      "usage: node linear.mjs create-issue --title <t> [--state <s>] [--labels <l1,l2>] [--priority <0-4>] [--description <d>] [--go]",
    );
    return 0;
  }

  // Parse flags
  let quickTitle;
  let quickDescription;
  let quickLabelsCsv;
  let quickPriorityRaw;
  let stateName = "Backlog";
  let go = false;
  let parentArg;
  let relatedToCsv;
  let blocksCsv;
  let blockedByCsv;
  let duplicateOfArg;
  let authorship = "drafted";

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--title") { quickTitle = argv[++i]; }
    else if (a === "--description") { quickDescription = argv[++i]; }
    else if (a === "--labels") { quickLabelsCsv = argv[++i]; }
    else if (a === "--priority") { quickPriorityRaw = argv[++i]; }
    else if (a === "--state") { stateName = argv[++i] ?? "Backlog"; }
    else if (a === "--go") { go = true; }
    else if (a === "--parent") { parentArg = argv[++i]; }
    else if (a === "--related-to") { relatedToCsv = argv[++i]; }
    else if (a === "--blocks") { blocksCsv = argv[++i]; }
    else if (a === "--blocked-by") { blockedByCsv = argv[++i]; }
    else if (a === "--duplicate-of") { duplicateOfArg = argv[++i]; }
    else if (a === "--authorship") { authorship = argv[++i] ?? "drafted"; }
  }

  let drafts;

  if (quickTitle) {
    // Quick-capture mode
    const labels = quickLabelsCsv
      ? quickLabelsCsv.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    const priority = quickPriorityRaw !== undefined ? Number(quickPriorityRaw) : undefined;
    if (priority !== undefined && (!Number.isFinite(priority) || priority < 0 || priority > 4)) {
      console.error(`--priority must be 0..4 (got ${quickPriorityRaw})`);
      return 2;
    }
    drafts = [
      {
        title: quickTitle,
        description: quickDescription ?? placeholderDescription(quickTitle),
        labels,
        priority,
      },
    ];
  } else {
    // Batch mode: JSON array on stdin
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8").trim();
    if (!raw) {
      console.error("no input — pass --title for quick capture, or JSON array on stdin for batch");
      return 2;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error(`invalid JSON on stdin: ${err instanceof Error ? err.message : String(err)}`);
      return 2;
    }
    drafts = Array.isArray(parsed) ? parsed : [parsed];
  }

  // Validate drafts
  for (const [idx, d] of drafts.entries()) {
    if (!d.title || typeof d.title !== "string") {
      console.error(`entry #${idx + 1}: missing or non-string 'title'`);
      return 2;
    }
    if (d.labels && !Array.isArray(d.labels)) {
      console.error(`entry #${idx + 1}: 'labels' must be an array of strings`);
      return 2;
    }
  }

  // PII scan BEFORE any network calls
  for (const [idx, d] of drafts.entries()) {
    const piiResult = scanFields({
      title: d.title,
      description: d.description ?? "",
    });
    if (piiResult !== null) {
      console.error(`entry #${idx + 1}: PII detected. Rejecting:`);
      for (const [field, res] of Object.entries(piiResult)) {
        if (!res.clean) {
          for (const f of res.findings) {
            console.error(`  ${field}: ${f.kind}: ${res.redacted}`);
          }
        }
      }
      return 3;
    }
  }

  // Resolve team and state
  let team, stateId;
  try {
    team = await getTeam();
    stateId = await resolveStateId(stateName);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  // Resolve ai-label
  let autoLabelId = null;
  try {
    const labelName = authorship === "suggested" ? "ai-suggested" : "ai-drafted";
    autoLabelId = await labelIdByName(labelName);
  } catch {
    // label not mandatory — ignore
  }

  // Resolve relationship targets
  const relatedToIdentifiers = parseList(relatedToCsv);
  const blocksIdentifiers = parseList(blocksCsv);
  const blockedByIdentifiers = parseList(blockedByCsv);
  const parentIdentifier = parentArg ? parseIssueIdentifier(parentArg) : undefined;
  const duplicateOfIdentifier = duplicateOfArg ? parseIssueIdentifier(duplicateOfArg) : undefined;

  let parentTarget, duplicateOfTarget, relatedToTargets, blocksTargets, blockedByTargets;
  try {
    parentTarget = parentIdentifier ? await resolveIssueByIdentifier(parentIdentifier) : undefined;
    duplicateOfTarget = duplicateOfIdentifier ? await resolveIssueByIdentifier(duplicateOfIdentifier) : undefined;
    relatedToTargets = await Promise.all(relatedToIdentifiers.map(resolveIssueByIdentifier));
    blocksTargets = await Promise.all(blocksIdentifiers.map(resolveIssueByIdentifier));
    blockedByTargets = await Promise.all(blockedByIdentifiers.map(resolveIssueByIdentifier));
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  // Preload labels
  let labelsMap;
  try {
    labelsMap = await getLabels();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  // Prepare each draft (resolve label ids, enforce single Area label)
  const labelsById = new Map([...labelsMap.values()].map((l) => [l.id, l]));
  const AREA_LABELS = new Set(
    [...labelsMap.values()]
      .filter((l) => {
        if (!l.parentId) return false;
        const parent = labelsById.get(l.parentId);
        return parent?.name.toLowerCase() === "area";
      })
      .map((l) => l.name.toLowerCase()),
  );

  const prepared = [];
  for (const [idx, d] of drafts.entries()) {
    const want = d.labels ?? [];
    const areas = want.filter((n) => AREA_LABELS.has(n.toLowerCase()));
    if (areas.length > 1) {
      console.error(
        `entry #${idx + 1}: multiple Area labels (${areas.join(", ")}). Only one Area label per issue.`,
      );
      return 2;
    }

    const ids = [];
    for (const n of want) {
      const id = await labelIdByName(n);
      if (!id) {
        console.error(`entry #${idx + 1}: label '${n}' not found`);
        return 1;
      }
      ids.push(id);
    }
    if (autoLabelId && !ids.includes(autoLabelId)) ids.push(autoLabelId);

    prepared.push({
      title: d.title,
      description: d.description ?? placeholderDescription(d.title),
      labelIds: ids,
      priority: d.priority,
    });
  }

  // Batch human-gate: >=3 issues require --go
  if (prepared.length >= 3 && !go) {
    console.log(`\n${prepared.length} issues drafted (batch human-gate). Re-run with --go to create.`);
    return 0;
  }

  // Create issues
  for (const p of prepared) {
    const input = {
      teamId: team.teamId,
      stateId,
      title: p.title,
      description: p.description,
      labelIds: p.labelIds,
    };
    if (p.priority !== undefined) input.priority = p.priority;
    if (parentTarget) input.parentId = parentTarget.id;

    let createData;
    try {
      createData = await gql(CREATE_MUTATION, { input });
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      return 1;
    }

    const created = createData.issueCreate?.issue;
    if (!created) {
      console.error(`issueCreate returned no issue for '${p.title.slice(0, 60)}'`);
      return 1;
    }

    console.log(`  + ${created.identifier}  ${p.title.slice(0, 70)}`);
    if (created.url) console.log(`    ${created.url}`);
    if (parentTarget) console.log(`    parent: ${parentTarget.identifier}`);

    // Peer relations
    for (const t of relatedToTargets) {
      try {
        await gql(RELATION_MUTATION, {
          input: { issueId: created.id, relatedIssueId: t.id, type: "related" },
        });
        console.log(`    related to ${t.identifier}`);
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        return 1;
      }
    }
    for (const t of blocksTargets) {
      try {
        await gql(RELATION_MUTATION, {
          input: { issueId: created.id, relatedIssueId: t.id, type: "blocks" },
        });
        console.log(`    blocks ${t.identifier}`);
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        return 1;
      }
    }
    for (const t of blockedByTargets) {
      try {
        // Direction flip: target blocks source
        await gql(RELATION_MUTATION, {
          input: { issueId: t.id, relatedIssueId: created.id, type: "blocks" },
        });
        console.log(`    blocked by ${t.identifier}`);
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        return 1;
      }
    }
    if (duplicateOfTarget) {
      try {
        await gql(RELATION_MUTATION, {
          input: { issueId: created.id, relatedIssueId: duplicateOfTarget.id, type: "duplicate" },
        });
        console.log(`    duplicate of ${duplicateOfTarget.identifier}`);
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        return 1;
      }
    }
  }

  return 0;
}
