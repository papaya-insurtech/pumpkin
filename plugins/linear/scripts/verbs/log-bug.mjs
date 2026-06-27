// plugins/linear/scripts/verbs/log-bug.mjs
// File a bug issue with required labels + PII scan.
//
// Usage:
//   node linear.mjs log-bug \
//     --title "<short title>" \
//     --area <area-label> \
//     --env <prod|test|sit|uat> \
//     --severity <S1|S2|S3|S4> \
//     --description "<steps + expected + actual>"
//
// Every bug gets labels: bug + <area> + env:<env>.
// If CLAUDE_CODE=1, also applies `ai-drafted`.
//
// Issue relationships (optional):
//   --parent <TEAM-N>
//   --related-to <TEAM-N,...>
//   --blocks <TEAM-N,...>
//   --blocked-by <TEAM-N,...>
//   --duplicate-of <TEAM-N>
//
// Exit codes: 0 success, 1 API/not-found, 2 bad args, 3 PII rejected.

import { gql, getTeam, labelIdByName, resolveIssueByIdentifier, viewer } from "../lib/client.mjs";
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

const SEVERITY_TO_PRIORITY = { S1: 1, S2: 2, S3: 3, S4: 4 };
const VALID_ENVS = new Set(["prod", "test", "sit", "uat"]);
const VALID_SEVERITIES = new Set(["S1", "S2", "S3", "S4"]);

function argVal(argv, flag, required = true) {
  const i = argv.indexOf(flag);
  if (i < 0) {
    if (required) return undefined; // signals missing
    return undefined;
  }
  return argv[i + 1];
}

function hasFlag(argv, flag) {
  return argv.indexOf(flag) >= 0;
}

function parseList(csv) {
  if (!csv) return [];
  return csv.split(",").map((s) => s.trim()).filter(Boolean).map((s) => parseIssueIdentifier(s));
}

export async function run(argv) {
  if (argv[0] === "--help" || argv[0] === "-h") {
    console.log(
      "usage: node linear.mjs log-bug --title <t> --area <a> --env <prod|test|sit|uat> --severity <S1..S4> --description <d>",
    );
    return 0;
  }

  const title = argVal(argv, "--title");
  const area = argVal(argv, "--area");
  const env = argVal(argv, "--env");
  const severity = argVal(argv, "--severity");
  const description = argVal(argv, "--description");

  // Check required flags
  if (!hasFlag(argv, "--title") || !title) {
    console.error("missing --title");
    return 2;
  }
  if (!hasFlag(argv, "--area") || !area) {
    console.error("missing --area");
    return 2;
  }
  if (!hasFlag(argv, "--env") || !env) {
    console.error("missing --env");
    return 2;
  }
  if (!hasFlag(argv, "--severity") || !severity) {
    console.error("missing --severity");
    return 2;
  }
  if (!hasFlag(argv, "--description") || !description) {
    console.error("missing --description");
    return 2;
  }

  // Validate env and severity
  if (!VALID_ENVS.has(env)) {
    console.error(`--env must be one of prod|test|sit|uat (got ${env})`);
    return 2;
  }
  if (!VALID_SEVERITIES.has(severity)) {
    console.error(`--severity must be S1|S2|S3|S4 (got ${severity})`);
    return 2;
  }

  // PII scan on title + description BEFORE any mutation
  const piiResult = scanFields({ title, description });
  if (piiResult !== null) {
    for (const [field, res] of Object.entries(piiResult)) {
      if (!res.clean) {
        console.error(`PII detected in ${field}. Rejecting:`);
        for (const f of res.findings) {
          console.error(`  ${f.kind}: ${res.redacted}`);
        }
      }
    }
    return 3;
  }

  // Relationship flags
  const parentArg = argv.indexOf("--parent") >= 0 ? argv[argv.indexOf("--parent") + 1] : undefined;
  const relatedToCsv = argv.indexOf("--related-to") >= 0 ? argv[argv.indexOf("--related-to") + 1] : undefined;
  const blocksCsv = argv.indexOf("--blocks") >= 0 ? argv[argv.indexOf("--blocks") + 1] : undefined;
  const blockedByCsv = argv.indexOf("--blocked-by") >= 0 ? argv[argv.indexOf("--blocked-by") + 1] : undefined;
  const duplicateOfArg = argv.indexOf("--duplicate-of") >= 0 ? argv[argv.indexOf("--duplicate-of") + 1] : undefined;

  // Resolve label IDs
  const labelNames = ["bug", area, `env:${env}`];
  const labelIds = [];
  for (const n of labelNames) {
    let id;
    try {
      id = await labelIdByName(n);
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
    if (!id) {
      console.error(`Label '${n}' not found`);
      return 1;
    }
    labelIds.push(id);
  }

  // ai-drafted label when running under Claude Code
  if (process.env.CLAUDE_CODE === "1") {
    try {
      const aid = await labelIdByName("ai-drafted");
      if (aid) labelIds.push(aid);
    } catch {
      // ignore — label may not exist
    }
  }

  // Resolve relationship targets
  let parentTarget, duplicateOfTarget, relatedToTargets, blocksTargets, blockedByTargets;
  try {
    parentTarget = parentArg ? await resolveIssueByIdentifier(parseIssueIdentifier(parentArg)) : undefined;
    duplicateOfTarget = duplicateOfArg ? await resolveIssueByIdentifier(parseIssueIdentifier(duplicateOfArg)) : undefined;
    relatedToTargets = await Promise.all(parseList(relatedToCsv).map(resolveIssueByIdentifier));
    blocksTargets = await Promise.all(parseList(blocksCsv).map(resolveIssueByIdentifier));
    blockedByTargets = await Promise.all(parseList(blockedByCsv).map(resolveIssueByIdentifier));
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  let team, me;
  try {
    team = await getTeam();
    me = await viewer();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  const body = `**Severity:** ${severity}\n**Environment:** env:${env}\n\n${description}`;
  const priority = SEVERITY_TO_PRIORITY[severity];

  const input = {
    teamId: team.teamId,
    title,
    description: body,
    labelIds,
    priority,
  };
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
    console.error(`issueCreate returned no issue for '${title.slice(0, 60)}'`);
    return 1;
  }

  console.log(`Created ${created.identifier} by ${me.email}: ${title}`);
  if (created.url) console.log(created.url);
  if (parentTarget) console.log(`  parent: ${parentTarget.identifier}`);

  // Peer relations
  for (const t of relatedToTargets) {
    try {
      await gql(RELATION_MUTATION, {
        input: { issueId: created.id, relatedIssueId: t.id, type: "related" },
      });
      console.log(`  related to ${t.identifier}`);
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
      console.log(`  blocks ${t.identifier}`);
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
      console.log(`  blocked by ${t.identifier}`);
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
      console.log(`  duplicate of ${duplicateOfTarget.identifier}`);
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
  }

  return 0;
}
