// plugins/linear/scripts/verbs/unlink-session.mjs
// Remove the local session -> Linear mapping.
//
// Usage:
//   node linear.mjs unlink-session               # current session
//   node linear.mjs unlink-session --session X   # explicit session
//
// Plans and attachments already uploaded to the Linear issue are NOT deleted —
// history stays in Linear. The local mapping file just goes away, so the current
// session is treated as "not linked" again.

import {
  deleteSessionLink,
  getCurrentSessionId,
  readSessionLink,
} from "../lib/session.mjs";

export async function run(argv) {
  let sessionId;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--session") {
      sessionId = argv[++i];
    } else if (a === "--help" || a === "-h") {
      console.log(
        "usage: node linear.mjs unlink-session [--session <id>]",
      );
      return 0;
    } else {
      console.error(`unexpected argument: ${a}`);
      console.error("usage: node linear.mjs unlink-session [--session <id>]");
      return 2;
    }
  }

  let sid;
  try {
    sid = sessionId ?? getCurrentSessionId();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  const link = readSessionLink(sid);
  if (!link) {
    console.log(`session ${sid}: no Linear link — nothing to do`);
    return 0;
  }

  deleteSessionLink(sid);
  console.log(
    `unlinked session ${sid} from ${link.issueIdentifier} — Linear-side history preserved.`,
  );

  return 0;
}
