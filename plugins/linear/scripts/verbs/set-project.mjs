// plugins/linear/scripts/verbs/set-project.mjs
// Move a Linear issue into a project.
//
// Usage:
//   node linear.mjs set-project <TEAM-NN|NN> --project "<name-or-id>"
//
// Exit codes: 0 success, 1 API/not-found, 2 bad args.

import { gql } from "../lib/client.mjs";
import { parseIssueIdentifier } from "../lib/session.mjs";

const PROJECTS_QUERY = `
query($filter: ProjectFilter!) {
  projects(filter: $filter, first: 5) {
    nodes {
      id
      name
    }
  }
}
`;

const ISSUE_QUERY = `
query($id: String!) {
  issue(id: $id) {
    id
    identifier
    title
    url
  }
}
`;

const UPDATE_ISSUE_MUTATION = `
mutation($id: String!, $projectId: String!) {
  issueUpdate(id: $id, input: { projectId: $projectId }) {
    success
  }
}
`;

export async function run(argv) {
  let idArg = "";
  let projectQuery = null;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--project") {
      projectQuery = argv[++i] ?? "";
    } else if (a === "--help" || a === "-h") {
      console.log('usage: node linear.mjs set-project <TEAM-NN|NN> --project "<name-or-id>"');
      return 0;
    } else if (!a.startsWith("--") && !idArg) {
      idArg = a;
    } else {
      console.error(`unexpected argument: ${a}`);
      return 2;
    }
  }

  if (!idArg) {
    console.error('usage: node linear.mjs set-project <TEAM-NN|NN> --project "<name-or-id>"');
    return 2;
  }

  if (!projectQuery) {
    console.error("--project <name-or-id> is required");
    console.error('usage: node linear.mjs set-project <TEAM-NN|NN> --project "<name-or-id>"');
    return 2;
  }

  let identifier;
  try {
    identifier = parseIssueIdentifier(idArg);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  // Resolve project — name match first, then raw UUID fallback
  let projectId;
  let projectName;

  const isUuid = /^[0-9a-f-]{36}$/i.test(projectQuery);
  const filter = isUuid
    ? { id: { eq: projectQuery } }
    : { name: { containsIgnoreCase: projectQuery } };

  let projectsData;
  try {
    projectsData = await gql(PROJECTS_QUERY, { filter });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  const matches = projectsData.projects.nodes;

  if (matches.length === 0) {
    console.error(`No project matching '${projectQuery}'`);
    return 1;
  } else if (matches.length === 1) {
    projectId = matches[0].id;
    projectName = matches[0].name;
  } else {
    // Multiple matches — look for exact match first
    const exact = matches.find((p) => p.name.toLowerCase() === projectQuery.toLowerCase());
    if (exact) {
      projectId = exact.id;
      projectName = exact.name;
    } else {
      console.error(
        `Ambiguous project '${projectQuery}'. Matches:\n` +
          matches.map((p) => `  - ${p.name}`).join("\n"),
      );
      return 1;
    }
  }

  // Resolve the issue
  let issueData;
  try {
    issueData = await gql(ISSUE_QUERY, { id: identifier });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  const issue = issueData.issue;
  if (!issue) {
    console.error(`${identifier} not found`);
    return 1;
  }

  try {
    await gql(UPDATE_ISSUE_MUTATION, { id: issue.id, projectId });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  console.log(`${issue.identifier} -> project "${projectName}" (${projectId})`);
  if (issue.url) console.log(`  ${issue.url}`);

  return 0;
}
