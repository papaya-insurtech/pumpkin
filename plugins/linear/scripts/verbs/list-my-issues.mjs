// plugins/linear/scripts/verbs/list-my-issues.mjs
// Print the caller's open Linear issues, grouped by state.
//
// Usage:
//   node linear.mjs list-my-issues [--state <name>] [--limit <n=50>]

import { gql, getTeam, viewer } from "../lib/client.mjs";

const ISSUES_QUERY = `
query($filter: IssueFilter!, $first: Int!) {
  issues(filter: $filter, first: $first) {
    nodes {
      identifier
      title
      priority
      state { name }
    }
  }
}
`;

export async function run(argv) {
  let stateFilter = null;
  let limit = 50;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--state") {
      stateFilter = argv[++i];
      if (!stateFilter) {
        console.error("--state requires a value");
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
      console.log("usage: node linear.mjs list-my-issues [--state <name>] [--limit <n=50>]");
      return 0;
    } else {
      console.error(`unexpected argument: ${a}`);
      return 2;
    }
  }

  let me;
  try {
    me = await viewer();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
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
    assignee: { id: { eq: me.id } },
    state: stateFilter
      ? { name: { eq: stateFilter } }
      : { type: { nin: ["completed", "canceled"] } },
  };

  let data;
  try {
    data = await gql(ISSUES_QUERY, { filter, first: limit });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  const nodes = data.issues.nodes;

  if (nodes.length === 0) {
    console.log(`No open issues assigned to ${me.email}.`);
    return 0;
  }

  // Group by state
  const byState = new Map();
  for (const issue of nodes) {
    const k = issue.state?.name ?? "?";
    const arr = byState.get(k) ?? [];
    arr.push(issue);
    byState.set(k, arr);
  }

  for (const [state, issues] of byState) {
    console.log(`\n[${state}] (${issues.length})`);
    for (const issue of issues) {
      const prio = issue.priority ? `P${issue.priority}` : "--";
      console.log(`  ${issue.identifier}  ${prio}  ${issue.title}`);
    }
  }

  return 0;
}
