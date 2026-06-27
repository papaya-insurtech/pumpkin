// plugins/linear/scripts/verbs/propose-followups.mjs
// Draft post-deploy follow-up issues from a set of observations, but do NOT
// create them until the human confirms with --go.
//
// Usage:
//   # Pass observations via stdin (one per line)
//   printf '%s\n' "cache hit ratio dropped from 92% to 78%" \
//     "cold start regression on Lambda" \
//     | node linear.mjs propose-followups --project "My Project"
//
//   # Or create after review:
//   ... | node linear.mjs propose-followups --project "My Project" --go
//
// Options:
//   --project "<name|id>"  Linear project to file issues under (required).
//   --source <TEAM-N>      Link every follow-up back to a source issue via 'related'.
//   --area <label>         Attach an optional Area label to every follow-up.
//   --env <prod|test|sit|uat>  Post-deploy env tag (default: prod).
//   --go                   Actually create issues (default = dry-run proposal).
//
// Exit codes: 0 success, 1 API/not-found, 2 bad args, 3 PII rejected.

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

const PROJECTS_QUERY = `
query($filter: ProjectFilter, $first: Int) {
  projects(filter: $filter, first: $first) {
    nodes { id name }
  }
}
`;

function printUsage() {
  console.error(
    [
      'usage: node linear.mjs propose-followups --project "<name|id>" [--source <TEAM-N>]',
      "                                          [--area <label>] [--env <prod|test|sit|uat>] [--go]",
      "  Reads observations (one per line) from stdin.",
    ].join("\n"),
  );
}

/**
 * Core logic — testable without stdin.
 *
 * @param {string[]} observations - One observation per entry.
 * @param {{ project: string, go?: boolean, env?: string, area?: string, source?: string }} opts
 * @returns {Promise<number>} exit code
 */
export async function proposeFollowups(observations, opts) {
  const { project: projectQuery, go = false, env = "prod", area, source } = opts;

  if (!projectQuery) {
    console.error("missing --project");
    return 2;
  }

  if (observations.length === 0) {
    console.error("no observations provided (one per line)");
    return 2;
  }

  // PII scan ALL observations up front — reject the whole batch if any hit
  let anyPii = false;
  const cleanObs = [];
  for (const [idx, obs] of observations.entries()) {
    const r = scan(obs);
    if (!r.clean) {
      anyPii = true;
      console.error(`#${idx + 1} REJECTED (PII):  ${obs}`);
      for (const f of r.findings) {
        console.error(`  ${f.kind}: ${f.match}`);
      }
    } else {
      cleanObs.push(obs);
    }
  }

  if (anyPii) {
    // Reject the run entirely — do not create anything
    return 3;
  }

  // Resolve team + project
  let team;
  try {
    team = await getTeam();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  const projectData = await gql(PROJECTS_QUERY, {
    filter: { name: { containsIgnoreCase: projectQuery } },
    first: 5,
  });

  if (!projectData.projects.nodes.length) {
    console.error(`No project matching '${projectQuery}'`);
    return 1;
  }
  const project = projectData.projects.nodes[0];

  // Resolve optional source issue
  const sourceIdentifier = source ? parseIssueIdentifier(source) : undefined;
  let sourceTarget;
  if (sourceIdentifier) {
    try {
      sourceTarget = await resolveIssueByIdentifier(sourceIdentifier);
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
  }

  // Resolve label IDs: tech-debt + post-deploy + ai-suggested + env:<env> [+ area]
  const labelNames = ["tech-debt", "post-deploy", "ai-suggested", `env:${env}`];
  if (area) labelNames.push(area);
  const labelIds = [];
  for (const n of labelNames) {
    const id = await labelIdByName(n);
    if (id) labelIds.push(id);
  }

  // Build drafts
  const drafts = cleanObs.map((obs) => ({
    title: obs.slice(0, 80),
    description: `## Observation\n\n${obs}\n\n## Proposed fix\n\nTBD.\n\n## Severity\n\nTBD (S1-S4).\n`,
  }));

  // Print proposal
  console.log(`\nProposed follow-ups for project '${project.name}' (env:${env}):`);
  if (sourceTarget) {
    console.log(`  source: ${sourceTarget.identifier} ${sourceTarget.title.slice(0, 60)}`);
  }
  console.log("");
  for (const [idx, d] of drafts.entries()) {
    console.log(`  [${idx + 1}] ${d.title}`);
  }

  if (!go) {
    console.log(`\n${drafts.length} issues proposed. Re-run with --go to create.`);
    return 0;
  }

  if (observations.length >= 3) {
    console.log(`\nCreating ${drafts.length} issues (batch human-gate passed via --go)…`);
  } else {
    console.log(`\nCreating ${drafts.length} issue(s)…`);
  }

  for (const d of drafts) {
    const input = {
      teamId: team.teamId,
      projectId: project.id,
      title: d.title,
      description: d.description,
      labelIds,
    };

    let createData;
    try {
      createData = await gql(ISSUE_CREATE, { input });
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      return 1;
    }

    const created = createData.issueCreate?.issue;
    if (!created) {
      console.error(`issueCreate returned no issue for '${d.title.slice(0, 60)}'`);
      return 1;
    }

    console.log(`  + ${created.identifier}  ${d.title.slice(0, 60)}`);

    if (sourceTarget) {
      try {
        await gql(RELATION_CREATE, {
          input: { issueId: created.id, relatedIssueId: sourceTarget.id, type: "related" },
        });
        console.log(`    related to ${sourceTarget.identifier}`);
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        return 1;
      }
    }
  }

  return 0;
}

export async function run(argv) {
  let projectQuery;
  let go = false;
  let env = "prod";
  let area;
  let source;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--project") {
      projectQuery = argv[++i];
    } else if (a === "--go") {
      go = true;
    } else if (a === "--env") {
      env = argv[++i] ?? "prod";
    } else if (a === "--area") {
      area = argv[++i];
    } else if (a === "--source") {
      source = argv[++i];
    } else if (a === "--help" || a === "-h") {
      printUsage();
      return 0;
    } else {
      console.error(`unexpected argument: ${a}`);
      printUsage();
      return 2;
    }
  }

  if (!projectQuery) {
    console.error("missing --project");
    printUsage();
    return 2;
  }

  // Read observations from stdin
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  const observations = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (observations.length === 0) {
    console.error("no observations on stdin (one per line)");
    return 2;
  }

  if (observations.length >= 3 && !go) {
    console.log(`Proposing ${observations.length} follow-up issues — batch human-gate required.`);
  }

  return proposeFollowups(observations, { project: projectQuery, go, env, area, source });
}
