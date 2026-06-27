// plugins/linear/scripts/verbs/add-comment.mjs
// Add a comment to a Linear issue.
//
// Usage:
//   node linear.mjs add-comment <TEAM-NN|NN> "<message>" [--dedupe-marker <m>]
//   echo "<msg>" | node linear.mjs add-comment <TEAM-NN|NN> - [--dedupe-marker <m>]
//
// --dedupe-marker <m>  Skip if any existing comment contains <m>.
//
// Exit codes: 0 success (or skipped), 1 API/not-found, 2 bad args, 3 PII rejected.

import { gql } from "../lib/client.mjs";
import { scan } from "../lib/pii-scan.mjs";
import { parseIssueIdentifier } from "../lib/session.mjs";

const ISSUE_QUERY = `
query($id: String!) {
  issue(id: $id) {
    id
    identifier
  }
}
`;

const COMMENTS_QUERY = `
query($id: String!) {
  issue(id: $id) {
    comments(first: 250) {
      nodes { body }
    }
  }
}
`;

const COMMENT_MUTATION = `
mutation($issueId: String!, $body: String!) {
  commentCreate(input: { issueId: $issueId, body: $body }) {
    success
    comment { id }
  }
}
`;

export async function run(argv) {
  if (argv[0] === "--help" || argv[0] === "-h") {
    console.log(
      'usage: node linear.mjs add-comment <TEAM-NN|NN> "<message>" [--dedupe-marker <m>]  (or "-" for stdin)',
    );
    return 0;
  }

  let idArg = "";
  let messageArg = "";
  let marker = "";
  const positionals = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dedupe-marker") {
      const val = argv[++i];
      if (!val) {
        console.error("--dedupe-marker requires a non-empty value");
        return 2;
      }
      marker = val;
    } else {
      positionals.push(a);
    }
  }

  idArg = positionals[0] ?? "";
  messageArg = positionals[1] ?? "";

  if (!idArg || !messageArg) {
    console.error(
      'usage: node linear.mjs add-comment <TEAM-NN|NN> "<message>" [--dedupe-marker <m>]  (or "-" for stdin)',
    );
    return 2;
  }

  // Read body from stdin if "-"
  let body;
  if (messageArg === "-") {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    body = Buffer.concat(chunks).toString("utf8").trim();
    if (!body) {
      console.error("empty message from stdin");
      return 2;
    }
  } else {
    body = messageArg;
  }

  // PII scan BEFORE any API calls
  const scanResult = scan(body);
  if (!scanResult.clean) {
    console.error("PII detected — comment NOT posted:");
    for (const f of scanResult.findings) {
      console.error(`  ${f.kind} @ ${f.index}: ${scanResult.redacted}`);
    }
    return 3;
  }

  // Resolve identifier
  let identifier;
  try {
    identifier = parseIssueIdentifier(idArg);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  // Fetch the issue
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

  // Dedupe check
  if (marker) {
    let commentsData;
    try {
      commentsData = await gql(COMMENTS_QUERY, { id: issue.id });
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
    const existingComments = commentsData.issue?.comments?.nodes ?? [];
    const alreadyPresent = existingComments.some((c) => (c.body ?? "").includes(marker));
    if (alreadyPresent) {
      console.log(`${issue.identifier}: comment skipped (dedupe marker '${marker}' already present)`);
      return 0;
    }
  }

  // Post the comment
  try {
    await gql(COMMENT_MUTATION, { issueId: issue.id, body });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  console.log(`${issue.identifier}: comment added (${body.length} chars)`);
  return 0;
}
