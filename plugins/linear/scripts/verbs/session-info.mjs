// plugins/linear/scripts/verbs/session-info.mjs
// Show the Linear link for the current (or specified) Claude Code session.
//
// Usage:
//   node linear.mjs session-info              # current session
//   node linear.mjs session-info --all        # every session in repo
//   node linear.mjs session-info --session X  # explicit session id
//   node linear.mjs session-info --json       # machine-readable output

import {
  getCurrentSessionId,
  listLinkedSessions,
  readSessionLink,
} from "../lib/session.mjs";

export async function run(argv) {
  let sessionId;
  let all = false;
  let json = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all") {
      all = true;
    } else if (a === "--json") {
      json = true;
    } else if (a === "--session") {
      sessionId = argv[++i];
    } else if (a === "--help" || a === "-h") {
      console.log(
        "usage: node linear.mjs session-info [--all] [--session <id>] [--json]",
      );
      return 0;
    } else {
      console.error(`unexpected argument: ${a}`);
      console.error(
        "usage: node linear.mjs session-info [--all] [--session <id>] [--json]",
      );
      return 2;
    }
  }

  if (all) {
    const rows = listLinkedSessions();
    if (json) {
      console.log(JSON.stringify(rows, null, 2));
      return 0;
    }
    if (!rows.length) {
      console.log("no linked sessions in this repo");
      return 0;
    }
    for (const { sessionId: sid, link } of rows) {
      console.log(
        `${sid}  ->  ${link.issueIdentifier}  (plans: ${link.plans.length}, PRs: ${link.prs.length})`,
      );
    }
    return 0;
  }

  let sid;
  try {
    sid = sessionId ?? getCurrentSessionId();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  const link = readSessionLink(sid);

  if (json) {
    console.log(JSON.stringify({ sessionId: sid, link }, null, 2));
    return 0;
  }

  if (!link) {
    console.log(`session ${sid}: no Linear link`);
    console.log("  link it with: node linear.mjs link-session <TEAM-NN>");
    return 0;
  }

  console.log(`session ${sid}`);
  console.log(`  issue:     ${link.issueIdentifier}  (${link.issueId})`);
  console.log(`  linked:    ${link.linkedAt}`);
  console.log(`  plans:     ${link.plans.length}`);
  for (const plan of link.plans) {
    console.log(`    - ${plan.digest}  ${plan.uploadedAt}  ${plan.title ?? "(untitled)"}`);
    console.log(`      source: ${plan.path}`);
    if (plan.documentUrl) console.log(`      doc:    ${plan.documentUrl}`);
  }
  console.log(
    `  PRs:       ${link.prs.length ? link.prs.map((p) => p.prNumber).join(", ") : "(none)"}`,
  );
  if (link.sessionAttachmentId) {
    console.log(`  attachment: ${link.sessionAttachmentId}`);
  }

  return 0;
}
