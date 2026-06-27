// plugins/linear/scripts/verbs/link-issues.mjs
// Link two existing Linear issues using native relations.
//
// Usage:
//   node linear.mjs link-issues <TEAM-N> [--parent <TEAM-M>]
//     [--related-to <TEAM-M,...>] [--blocks <TEAM-M,...>]
//     [--blocked-by <TEAM-M,...>] [--duplicate-of <TEAM-M>]
//     [--comment]
//
// Resolves all identifiers up-front (fail fast).
// For --parent: calls issueUpdate(parentId).
// For relations: calls issueRelationCreate. Direction matters for blocks:
//   --blocked-by flips operands.
// With --comment: posts a short comment on each side recording the link.
//
// Exit codes: 0 success, 1 API/not-found, 2 bad args.

import { gql, resolveIssueByIdentifier } from "../lib/client.mjs";
import { parseIssueIdentifier } from "../lib/session.mjs";

const UPDATE_MUTATION = `
mutation($id: String!, $input: IssueUpdateInput!) {
  issueUpdate(id: $id, input: $input) {
    success
    issue { id identifier }
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

const COMMENT_MUTATION = `
mutation($issueId: String!, $body: String!) {
  commentCreate(input: { issueId: $issueId, body: $body }) {
    success
    comment { id }
  }
}
`;

function parseList(csv) {
  if (!csv) return [];
  return csv.split(",").map((s) => s.trim()).filter(Boolean).map((s) => parseIssueIdentifier(s));
}

export async function run(argv) {
  if (argv[0] === "--help" || argv[0] === "-h") {
    console.log(
      "usage: node linear.mjs link-issues <TEAM-N> [--parent <TEAM-M>] [--related-to <TEAM-M,...>] [--blocks <TEAM-M,...>] [--blocked-by <TEAM-M,...>] [--duplicate-of <TEAM-M>] [--comment]",
    );
    return 0;
  }

  // Extract positionals (non-flag args)
  const positionals = argv.filter((a) => !a.startsWith("--"));
  const sourceArg = positionals[0];

  if (!sourceArg) {
    console.error(
      "usage: node linear.mjs link-issues <TEAM-N> [--parent <TEAM-M>] [--related-to <TEAM-M,...>] [--blocks <TEAM-M,...>] [--blocked-by <TEAM-M,...>] [--duplicate-of <TEAM-M>] [--comment]",
    );
    return 2;
  }

  // Parse flags
  function flagVal(flag) {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  }

  const parentArg = flagVal("--parent");
  const relatedToCsv = flagVal("--related-to");
  const blocksCsv = flagVal("--blocks");
  const blockedByCsv = flagVal("--blocked-by");
  const duplicateOfArg = flagVal("--duplicate-of");
  const writeComment = argv.includes("--comment");

  const relatedTo = parseList(relatedToCsv);
  const blocks = parseList(blocksCsv);
  const blockedBy = parseList(blockedByCsv);
  const parent = parentArg ? parseIssueIdentifier(parentArg) : undefined;
  const duplicateOf = duplicateOfArg ? parseIssueIdentifier(duplicateOfArg) : undefined;

  if (
    !parent &&
    relatedTo.length === 0 &&
    blocks.length === 0 &&
    blockedBy.length === 0 &&
    !duplicateOf
  ) {
    console.error(
      "nothing to link — pass at least one of --parent / --related-to / --blocks / --blocked-by / --duplicate-of",
    );
    return 2;
  }

  // Resolve source issue
  let sourceIdentifier;
  try {
    sourceIdentifier = parseIssueIdentifier(sourceArg);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  let source;
  try {
    source = await resolveIssueByIdentifier(sourceIdentifier);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }
  console.log(`Resolving ${source.identifier}…`);
  console.log(`  ${source.identifier}  ${(source.title ?? "").slice(0, 80)}`);

  // Helper: create a relation
  async function linkRelation(fromId, fromIdent, toId, toIdent, type, label) {
    try {
      await gql(RELATION_MUTATION, {
        input: { issueId: fromId, relatedIssueId: toId, type },
      });
      console.log(`  + ${fromIdent} ${label} ${toIdent}`);
      if (writeComment) {
        await gql(COMMENT_MUTATION, {
          issueId: fromId,
          body: `Linked: ${label} ${toIdent} (via link-issues).`,
        });
      }
    } catch (err) {
      throw err;
    }
  }

  // --parent
  if (parent) {
    let target;
    try {
      target = await resolveIssueByIdentifier(parent);
      await gql(UPDATE_MUTATION, {
        id: source.id,
        input: { parentId: target.id },
      });
      console.log(`  + ${source.identifier} parent -> ${target.identifier}`);
      if (writeComment) {
        await gql(COMMENT_MUTATION, {
          issueId: source.id,
          body: `Linked: parent -> ${target.identifier} (via link-issues).`,
        });
      }
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
  }

  // --related-to
  for (const ident of relatedTo) {
    let target;
    try {
      target = await resolveIssueByIdentifier(ident);
      await linkRelation(source.id, source.identifier, target.id, target.identifier, "related", "related to");
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
  }

  // --blocks
  for (const ident of blocks) {
    let target;
    try {
      target = await resolveIssueByIdentifier(ident);
      await linkRelation(source.id, source.identifier, target.id, target.identifier, "blocks", "blocks");
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
  }

  // --blocked-by (direction flip: target blocks source)
  for (const ident of blockedBy) {
    let target;
    try {
      target = await resolveIssueByIdentifier(ident);
      await linkRelation(target.id, target.identifier, source.id, source.identifier, "blocks", "blocks");
      console.log(`    (i.e. ${source.identifier} blocked by ${target.identifier})`);
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
  }

  // --duplicate-of
  if (duplicateOf) {
    let target;
    try {
      target = await resolveIssueByIdentifier(duplicateOf);
      await linkRelation(source.id, source.identifier, target.id, target.identifier, "duplicate", "duplicate of");
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
  }

  console.log("Done.");
  return 0;
}
