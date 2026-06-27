// plugins/linear/scripts/verbs/start-task.mjs
// Claim a Linear issue: move to In Progress and assign to viewer.
//
// Usage:
//   node linear.mjs start-task <TEAM-NN|NN>

import { gql, resolveStateId, viewer } from "../lib/client.mjs";
import { parseIssueIdentifier } from "../lib/session.mjs";

const ISSUE_QUERY = `
query($id: String!) {
  issue(id: $id) {
    id
    identifier
    title
    priority
    state { id name }
    assignee { id }
    description
  }
}
`;

const UPDATE_ISSUE_MUTATION = `
mutation($id: String!, $stateId: String, $assigneeId: String) {
  issueUpdate(id: $id, input: { stateId: $stateId, assigneeId: $assigneeId }) {
    success
    issue {
      identifier
      state { name }
    }
  }
}
`;

export async function run(argv) {
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    if (argv.length === 0) {
      console.error("usage: node linear.mjs start-task <TEAM-NN|NN>");
      return 2;
    }
    console.log("usage: node linear.mjs start-task <TEAM-NN|NN>");
    return 0;
  }

  const idArg = argv[0];

  let identifier;
  try {
    identifier = parseIssueIdentifier(idArg);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  let me;
  try {
    me = await viewer();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  let inProgressId;
  try {
    inProgressId = await resolveStateId("In Progress");
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  let data;
  try {
    data = await gql(ISSUE_QUERY, { id: identifier });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  const issue = data.issue;
  if (!issue) {
    console.error(`${identifier} not found`);
    return 1;
  }

  const currentStateName = issue.state?.name ?? "?";
  const updates = {};
  if (issue.state?.id !== inProgressId) updates.stateId = inProgressId;
  if (issue.assignee?.id !== me.id) updates.assigneeId = me.id;

  if (Object.keys(updates).length === 0) {
    console.log(`${issue.identifier} already In Progress and assigned to you. Nothing to do.`);
  } else {
    try {
      await gql(UPDATE_ISSUE_MUTATION, { id: issue.id, ...updates });
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
    console.log(`${issue.identifier}: ${currentStateName} -> In Progress, assigned to ${me.email}`);
  }

  // Branch / worktree hint
  const issueNumber = Number(identifier.split("-")[1]);
  const slug = issue.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  const type = issue.priority === 1 ? "fix" : "feat";
  console.log(`\nBranch:    ${type}/${identifier.split("-")[0]}-${issueNumber}-${slug}`);
  console.log(`Worktree:  EnterWorktree name=${type}-${identifier.split("-")[0]}-${issueNumber}-${slug}`);

  if (issue.description) {
    console.log(`\n--- Acceptance criteria (from issue body) ---`);
    console.log(issue.description);
  }

  return 0;
}
