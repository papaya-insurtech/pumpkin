// plugins/linear/scripts/verbs/update-status.mjs
// Move a Linear issue to a target workflow state.
//
// Usage:
//   node linear.mjs update-status <TEAM-NN|NN> <state>
//
// State aliases: ready=todo, in-progress, in-review, done, blocked, backlog, canceled, duplicate.
// Exit codes: 0 success, 1 API/not-found, 2 bad args.

import { gql, resolveStateId } from "../lib/client.mjs";
import { parseIssueIdentifier } from "../lib/session.mjs";

const ISSUE_QUERY = `
query($id: String!) {
  issue(id: $id) {
    id
    identifier
    state { id name }
  }
}
`;

const UPDATE_ISSUE_MUTATION = `
mutation($id: String!, $stateId: String!) {
  issueUpdate(id: $id, input: { stateId: $stateId }) {
    success
    issue {
      identifier
      state { name }
    }
  }
}
`;

export async function run(argv) {
  if (argv[0] === "--help" || argv[0] === "-h") {
    console.log("usage: node linear.mjs update-status <TEAM-NN|NN> <state>");
    return 0;
  }

  const [idArg, stateArg] = argv;
  if (!idArg || !stateArg) {
    console.error("usage: node linear.mjs update-status <TEAM-NN|NN> <state>");
    return 2;
  }

  let identifier;
  try {
    identifier = parseIssueIdentifier(idArg);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  let stateId;
  try {
    stateId = await resolveStateId(stateArg);
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
    console.error(`Issue ${identifier} not found`);
    return 1;
  }

  const currentStateName = issue.state?.name ?? "?";
  if (issue.state?.id === stateId) {
    console.log(`${issue.identifier} already in ${currentStateName}`);
    return 0;
  }

  try {
    await gql(UPDATE_ISSUE_MUTATION, { id: issue.id, stateId });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  console.log(`${issue.identifier}: ${currentStateName} -> ${stateArg}`);
  return 0;
}
