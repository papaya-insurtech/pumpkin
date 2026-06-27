// plugins/linear/scripts/verbs/project-status.mjs
// Print a project's status: WIP per workflow state and milestone progress.
//
// Usage:
//   node linear.mjs project-status "<name-or-id>"

import { gql } from "../lib/client.mjs";

const PROJECTS_QUERY = `
query($filter: ProjectFilter!, $first: Int!) {
  projects(filter: $filter, first: $first) {
    nodes {
      id
      name
      state
      startDate
      targetDate
      url
      lead { name }
    }
  }
}
`;

const ISSUES_QUERY = `
query($projectId: ID!, $first: Int!) {
  issues(filter: { project: { id: { eq: $projectId } } }, first: $first) {
    nodes {
      identifier
      title
      state { name type }
      projectMilestone { name }
    }
  }
}
`;

export async function run(argv) {
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    if (argv.length === 0) {
      console.error('usage: node linear.mjs project-status "<name-or-id>"');
      return 2;
    }
    console.log('usage: node linear.mjs project-status "<name-or-id>"');
    return 0;
  }

  const query = argv[0];

  const isId = /^[0-9a-f-]{36}$/i.test(query);
  const filter = isId
    ? { id: { eq: query } }
    : { name: { containsIgnoreCase: query } };

  let projectsData;
  try {
    projectsData = await gql(PROJECTS_QUERY, { filter, first: 5 });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  const projects = projectsData.projects.nodes;

  if (projects.length === 0) {
    console.error(`No project matching '${query}'`);
    return 1;
  }

  if (projects.length > 1) {
    console.log(`Multiple matches — pick one:`);
    for (const p of projects) console.log(`  ${p.id}  ${p.name}`);
    return 1;
  }

  const project = projects[0];
  console.log(`Project: ${project.name}`);
  console.log(`State:   ${project.state}`);
  console.log(`Dates:   ${project.startDate ?? "?"} -> ${project.targetDate ?? "?"}`);
  if (project.lead) console.log(`Lead:    ${project.lead.name}`);
  console.log(`URL:     ${project.url}`);
  console.log(`Native Project Update: open ${project.url} and check the Updates tab first.`);

  // Fetch issues for WIP breakdown
  let issuesData;
  try {
    issuesData = await gql(ISSUES_QUERY, { projectId: project.id, first: 250 });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  const issues = issuesData.issues.nodes;

  const byState = new Map();
  const byMilestone = new Map();

  for (const issue of issues) {
    const stateName = issue.state?.name ?? "?";
    byState.set(stateName, (byState.get(stateName) ?? 0) + 1);

    const msName = issue.projectMilestone?.name ?? "<no milestone>";
    const slot = byMilestone.get(msName) ?? { total: 0, done: 0 };
    slot.total++;
    if (issue.state?.type === "completed") slot.done++;
    byMilestone.set(msName, slot);
  }

  console.log(`\nWIP by state (${issues.length} total issues):`);
  for (const [state, n] of [...byState.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${state}`);
  }

  console.log(`\nProgress by milestone:`);
  for (const [name, slot] of byMilestone) {
    const pct = slot.total === 0 ? 0 : Math.round((slot.done / slot.total) * 100);
    console.log(`  ${String(slot.done).padStart(3)}/${String(slot.total).padEnd(3)}  ${pct}%  ${name}`);
  }

  return 0;
}
