// plugins/linear/scripts/verbs/pick-task.mjs
// List Todo (Ready) issues and optionally filter by area label.
//
// Usage:
//   node linear.mjs pick-task [--area <label>] [--limit <n=25>]

import { gql, getTeam } from "../lib/client.mjs";

const ISSUES_QUERY = `
query($filter: IssueFilter!, $first: Int!) {
  issues(filter: $filter, first: $first) {
    nodes {
      identifier
      title
      priority
      project { name }
      labels(first: 20) { nodes { name } }
    }
  }
}
`;

export async function run(argv) {
  let areaFilter = null;
  let limit = 25;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--area") {
      areaFilter = argv[++i];
      if (!areaFilter) {
        console.error("--area requires a value");
        return 2;
      }
    } else if (a === "--limit") {
      const v = argv[++i];
      limit = Number(v);
      if (!Number.isFinite(limit) || limit < 1) {
        console.error(`--limit must be a positive integer, got: ${v}`);
        return 2;
      }
    } else if (a === "--help" || a === "-h") {
      console.log("usage: node linear.mjs pick-task [--area <label>] [--limit <n=25>]");
      return 0;
    } else {
      console.error(`unexpected argument: ${a}`);
      return 2;
    }
  }

  let team;
  try {
    team = await getTeam();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  const filter = {
    team: { id: { eq: team.teamId } },
    state: { name: { eq: "Todo" } },
  };
  if (areaFilter) {
    filter.labels = { some: { name: { eq: areaFilter } } };
  }

  let data;
  try {
    data = await gql(ISSUES_QUERY, { filter, first: limit });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  const nodes = data.issues.nodes;

  if (nodes.length === 0) {
    console.log(`No Todo issues in ${team.teamKey}${areaFilter ? ` for area ${areaFilter}` : ""}.`);
    return 0;
  }

  console.log(`Todo (${nodes.length}):`);
  for (const issue of nodes) {
    const prio = issue.priority ? `P${issue.priority}` : "--";
    const project = issue.project?.name ?? "-";
    const labels = (issue.labels?.nodes ?? []).map((l) => l.name).join(",");
    console.log(
      `  ${issue.identifier}  ${prio}  [${project}]  ${issue.title}${labels ? `  {${labels}}` : ""}`,
    );
  }

  console.log(`\nPick one and run:  node linear.mjs start-task <id>`);
  console.log(`                   # then create a worktree, e.g. EnterWorktree feat-<id>-<slug>`);
  return 0;
}
