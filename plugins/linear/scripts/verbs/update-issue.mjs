// plugins/linear/scripts/verbs/update-issue.mjs
// Update a Linear issue's scalar fields.
//
// Usage:
//   node linear.mjs update-issue <TEAM-NN|NN> [flags]
//
// --title "<t>"              Update the issue title.
// --description "<d>"|-      Update description; "-" reads from stdin.
// --due <YYYY-MM-DD|none>    Set dueDate; "none" clears.
// --priority <none|urgent|high|medium|low>
// --assignee <email|none>    Resolve email -> userId; "none" unassigns.
// --milestone "<name>|none"  Resolve milestone by name within the issue's
//                            current project; "none" clears. Requires the
//                            issue to already be in a project.
//
// PII scan applies to --title and --description only.
// Exit codes: 0 success, 1 API/not-found, 2 bad args, 3 PII rejected.

import { gql } from "../lib/client.mjs";
import { scanFields } from "../lib/pii-scan.mjs";
import { parseIssueIdentifier } from "../lib/session.mjs";

const PRIORITY_MAP = { none: 0, urgent: 1, high: 2, medium: 3, low: 4 };

const ISSUE_QUERY = `
query($id: String!) {
  issue(id: $id) {
    id
    identifier
    state { id name }
    project { id name }
  }
}
`;

const MILESTONES_QUERY = `
query($projectId: ID!, $name: String!) {
  projectMilestones(
    filter: { project: { id: { eq: $projectId } }, name: { containsIgnoreCase: $name } }
    first: 5
  ) {
    nodes { id name }
  }
}
`;

const UPDATE_MUTATION = `
mutation($id: String!, $input: IssueUpdateInput!) {
  issueUpdate(id: $id, input: $input) {
    success
    issue { id identifier }
  }
}
`;

const USERS_QUERY = `
query($email: String!) {
  users(filter: { email: { eq: $email } }, first: 2) {
    nodes { id email }
  }
}
`;

export async function run(argv) {
  if (argv[0] === "--help" || argv[0] === "-h") {
    console.log(
      "usage: node linear.mjs update-issue <TEAM-NN|NN> [--title <t>] [--description <d>|-] [--due <YYYY-MM-DD|none>] [--priority <none|urgent|high|medium|low>] [--assignee <email|none>] [--milestone <name|none>]",
    );
    return 0;
  }

  // Parse argv
  let idArg = "";
  let title;
  let descriptionRaw;
  let descriptionFromStdin = false;
  let dueRaw;
  let priorityRaw;
  let assigneeRaw;
  let milestoneRaw;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--title") {
      title = argv[++i] ?? "";
    } else if (a === "--description") {
      const val = argv[++i];
      if (val === "-") {
        descriptionFromStdin = true;
      } else {
        descriptionRaw = val ?? "";
      }
    } else if (a === "--due") {
      dueRaw = argv[++i] ?? "";
    } else if (a === "--priority") {
      priorityRaw = argv[++i] ?? "";
    } else if (a === "--assignee") {
      assigneeRaw = argv[++i] ?? "";
    } else if (a === "--milestone") {
      milestoneRaw = argv[++i] ?? "";
    } else if (!a.startsWith("--") && !idArg) {
      idArg = a;
    }
  }

  if (!idArg) {
    console.error(
      "usage: node linear.mjs update-issue <TEAM-NN|NN> [--title <t>] [--description <d>|-] [--due <YYYY-MM-DD|none>] [--priority <none|urgent|high|medium|low>] [--assignee <email|none>] [--milestone <name|none>]",
    );
    return 2;
  }

  const hasUpdate =
    title !== undefined ||
    descriptionRaw !== undefined ||
    descriptionFromStdin ||
    dueRaw !== undefined ||
    priorityRaw !== undefined ||
    assigneeRaw !== undefined ||
    milestoneRaw !== undefined;

  if (!hasUpdate) {
    console.error(
      "At least one of --title, --description, --due, --priority, --assignee, or --milestone must be provided.",
    );
    return 2;
  }

  // Validate --due eagerly
  let dueDate;
  if (dueRaw !== undefined) {
    if (dueRaw.toLowerCase() === "none") {
      dueDate = null;
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dueRaw)) {
      console.error(`--due requires YYYY-MM-DD format or "none" (got: ${dueRaw})`);
      return 2;
    } else {
      dueDate = dueRaw;
    }
  }

  // Validate --priority eagerly
  let priorityInt;
  if (priorityRaw !== undefined) {
    const lower = priorityRaw.toLowerCase();
    if (!(lower in PRIORITY_MAP)) {
      console.error(
        `--priority must be one of: none, urgent, high, medium, low (got: ${priorityRaw})`,
      );
      return 2;
    }
    priorityInt = PRIORITY_MAP[lower];
  }

  // Read description from stdin if requested
  let description = descriptionRaw;
  if (descriptionFromStdin) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    description = Buffer.concat(chunks).toString("utf8").trim();
    if (!description) {
      console.error("empty description from stdin");
      return 2;
    }
  }

  // PII scan on title + description BEFORE any mutation
  const fieldsToScan = {};
  if (title !== undefined) fieldsToScan.title = title;
  if (description !== undefined) fieldsToScan.description = description;

  if (Object.keys(fieldsToScan).length > 0) {
    const piiResult = scanFields(fieldsToScan);
    if (piiResult !== null) {
      console.error("PII detected — issue NOT updated:");
      for (const [field, res] of Object.entries(piiResult)) {
        if (!res.clean) {
          for (const f of res.findings) {
            console.error(`  ${field}: ${f.kind} @ ${f.index}: ${res.redacted}`);
          }
        }
      }
      return 3;
    }
  }

  // Resolve issue identifier
  let identifier;
  try {
    identifier = parseIssueIdentifier(idArg);
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

  // Resolve assignee
  let assigneeId;
  if (assigneeRaw !== undefined) {
    if (assigneeRaw.toLowerCase() === "none") {
      assigneeId = null;
    } else {
      let userData;
      try {
        userData = await gql(USERS_QUERY, { email: assigneeRaw });
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        return 1;
      }
      const users = userData.users?.nodes ?? [];
      if (users.length === 0) {
        console.error(`--assignee: no user found with email '${assigneeRaw}'`);
        return 1;
      }
      if (users.length > 1) {
        console.error(`--assignee: ambiguous — multiple users found with email '${assigneeRaw}'`);
        return 1;
      }
      assigneeId = users[0].id;
    }
  }

  // Resolve milestone
  let projectMilestoneId;
  if (milestoneRaw !== undefined) {
    if (milestoneRaw.toLowerCase() === "none") {
      projectMilestoneId = null;
    } else {
      // Issue must have a project
      if (!issue.project) {
        console.error(
          `--milestone: issue has no project — assign the issue to a project before setting a milestone`,
        );
        return 1;
      }
      const projectId = issue.project.id;
      const projectName = issue.project.name;
      let msData;
      try {
        msData = await gql(MILESTONES_QUERY, { projectId, name: milestoneRaw });
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        return 1;
      }
      const candidates = msData.projectMilestones?.nodes ?? [];
      if (candidates.length === 0) {
        console.error(
          `--milestone: no milestone matching '${milestoneRaw}' in project '${projectName}'`,
        );
        return 1;
      }
      if (candidates.length === 1) {
        projectMilestoneId = candidates[0].id;
      } else {
        // Multiple: try exact match first
        const exact = candidates.find(
          (m) => m.name.toLowerCase() === milestoneRaw.toLowerCase(),
        );
        if (exact) {
          projectMilestoneId = exact.id;
        } else {
          console.error(
            `--milestone: ambiguous — multiple milestones match '${milestoneRaw}' in project '${projectName}':\n` +
              candidates.map((m) => `  - ${m.name}`).join("\n"),
          );
          return 1;
        }
      }
    }
  }

  // Build update payload
  const input = {};
  const updatedFields = [];

  if (title !== undefined) { input.title = title; updatedFields.push("title"); }
  if (description !== undefined) { input.description = description; updatedFields.push("description"); }
  if (dueDate !== undefined) { input.dueDate = dueDate; updatedFields.push("dueDate"); }
  if (priorityInt !== undefined) { input.priority = priorityInt; updatedFields.push("priority"); }
  if (assigneeId !== undefined) { input.assigneeId = assigneeId; updatedFields.push("assignee"); }
  if (projectMilestoneId !== undefined) { input.projectMilestoneId = projectMilestoneId; updatedFields.push("milestone"); }

  try {
    await gql(UPDATE_MUTATION, { id: issue.id, input });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  console.log(`${issue.identifier}: updated (${updatedFields.join(", ")})`);
  return 0;
}
