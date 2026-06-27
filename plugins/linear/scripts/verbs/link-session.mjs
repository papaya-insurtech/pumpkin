// plugins/linear/scripts/verbs/link-session.mjs
// Attach the current Claude Code session to a Linear issue.
//
// Usage:
//   node linear.mjs link-session <TEAM-NN | URL> [--upload-plan] [--session <id>] [--force]
//
// Creates <git-common-dir>/.claude-linear/<session-id>/linear.json and registers
// a marker attachment on the Linear issue so the session shows up in the issue's
// attachment list. Anchoring on git's common dir means the link survives worktree
// teardown and is visible from any worktree of the same repo.
//
// Safe to re-run. If a different issue is already linked, fails unless --force is passed.

import { gql, resolveIssueByIdentifier } from "../lib/client.mjs";
import {
  getCurrentSessionId,
  linkFile,
  parseIssueIdentifier,
  readSessionLink,
  writeSessionLink,
} from "../lib/session.mjs";

const ATTACHMENT_CREATE = `
mutation($input: AttachmentCreateInput!) {
  attachmentCreate(input: $input) {
    success
    attachment { id }
  }
}
`;

function printUsage() {
  console.error(
    [
      "usage: node linear.mjs link-session <TEAM-NN | URL> [--upload-plan] [--session <id>] [--force]",
      "",
      "  <TEAM-NN | URL>   Linear issue identifier or full URL",
      "  --upload-plan     hint: upload-plan is a separate verb (use: node linear.mjs upload-plan)",
      "  --session <id>    override session id (default: current Claude Code session)",
      "  --force           replace an existing link to a different issue without prompting",
    ].join("\n"),
  );
}

export async function run(argv) {
  let issueArg = "";
  let sessionId;
  let uploadPlan = false;
  let force = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--session") {
      sessionId = argv[++i];
    } else if (a === "--upload-plan") {
      uploadPlan = true;
    } else if (a === "--force" || a === "-f") {
      force = true;
    } else if (a === "--help" || a === "-h") {
      printUsage();
      return 0;
    } else if (!issueArg) {
      issueArg = a;
    } else {
      console.error(`unexpected argument: ${a}`);
      printUsage();
      return 2;
    }
  }

  if (!issueArg) {
    printUsage();
    return 2;
  }

  let identifier;
  try {
    identifier = parseIssueIdentifier(issueArg);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  let issue;
  try {
    issue = await resolveIssueByIdentifier(identifier);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  let sid;
  try {
    sid = sessionId ?? getCurrentSessionId();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  const existing = readSessionLink(sid);
  if (existing && existing.issueId !== issue.id) {
    if (!force) {
      console.error(
        [
          `Session ${sid} is already linked to ${existing.issueIdentifier}.`,
          `Re-run with --force to replace with ${identifier}.`,
          "Or pass --session <other-id> to link a different session.",
        ].join("\n"),
      );
      return 1;
    }
    console.log(`replacing link ${existing.issueIdentifier} -> ${identifier} for session ${sid}`);
  }

  // Reuse existing link if same issue, otherwise create fresh
  const link =
    existing && existing.issueId === issue.id
      ? existing
      : {
          issueId: issue.id,
          issueIdentifier: identifier,
          linkedAt: new Date().toISOString(),
          plans: [],
          prs: [],
        };

  // Create a marker attachment on the Linear side so the session is visible
  // in the issue's attachment list. Uses a claudecode:// URL as a sentinel —
  // not clickable, but unique and grouped by Linear's URL-dedupe logic.
  if (!link.sessionAttachmentId) {
    try {
      const attachmentUrl = `claudecode://session/${sid}`;
      const data = await gql(ATTACHMENT_CREATE, {
        input: {
          issueId: issue.id,
          title: `Claude Code session ${sid.slice(0, 8)}…`,
          subtitle: "Linked via node linear.mjs link-session",
          url: attachmentUrl,
        },
      });
      const attachment = data?.attachmentCreate?.attachment;
      if (attachment?.id) link.sessionAttachmentId = attachment.id;
    } catch (err) {
      // Non-fatal: attachment creation failure is logged but doesn't block the link
      console.error(
        `[linear] warning: could not create attachment: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  writeSessionLink(sid, link);

  console.log(`linked session ${sid} -> ${identifier} (${issue.title})`);
  console.log(`  mapping: ${linkFile(sid)}`);

  if (uploadPlan) {
    // TODO(B6b): --upload-plan wiring is implemented in the upload-plan verb.
    // Use: node linear.mjs upload-plan [--session <id>]
    console.log("  --upload-plan: use `node linear.mjs upload-plan` to upload a plan separately");
  }

  return 0;
}
