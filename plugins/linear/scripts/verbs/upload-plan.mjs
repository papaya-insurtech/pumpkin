// plugins/linear/scripts/verbs/upload-plan.mjs
// Upload a Claude Code plan to the linked Linear issue.
//
// Usage:
//   node linear.mjs upload-plan [--plan-file <path>] [--plan-stdin]
//                               [--session <id>] [--issue <TEAM-NN>]
//                               [--kind spec|plan]
//
//   --plan-file <path>  Explicit plan markdown file (absolute or relative).
//   --plan-stdin        Read plan content from stdin (used by hooks).
//   --session <id>      Override session id. Defaults to current session.
//   --issue <TEAM-NN>   Upload to a specific issue regardless of session link.
//                       Does NOT record the plan in the session mapping.
//   --kind spec|plan    Prefix the document title with [Spec] or [Plan].
//                       Defaults to 'plan'.
//
// Plans are uploaded as:
//   - A Linear Document attached to the issue (via issueId) holding the full
//     plan markdown. Linear renders documents as first-class UI.
//   - A Linear comment on the issue noting the upload (visible in activity).
//
// Multiple uploads append more documents/comments — existing plans are NEVER
// deleted. Deduplication: if the same digest is already recorded for this
// session+issue, the upload is skipped (avoids spamming on repeated hook fire).

import { readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { gql, resolveIssueByIdentifier } from "../lib/client.mjs";
import {
  digestOf,
  getCurrentSessionId,
  parseIssueIdentifier,
  readSessionLink,
  writeSessionLink,
} from "../lib/session.mjs";

const DOCUMENT_CREATE = `
mutation($input: DocumentCreateInput!) {
  documentCreate(input: $input) {
    success
    document { id url }
  }
}
`;

const COMMENT_CREATE = `
mutation($input: CommentCreateInput!) {
  commentCreate(input: $input) {
    success
    comment { id }
  }
}
`;

function printUsage() {
  console.error(
    [
      "usage: node linear.mjs upload-plan [--plan-file <path>] [--plan-stdin]",
      "                                    [--session <id>] [--issue <TEAM-NN>]",
      "                                    [--kind spec|plan]",
    ].join("\n"),
  );
}

/** Find the most-recently-modified plan file under ~/.claude/plans/. */
export function findMostRecentPlan() {
  const dir = join(homedir(), ".claude", "plans");
  try {
    const entries = readdirSync(dir)
      .filter((n) => n.endsWith(".md"))
      .map((n) => {
        const p = join(dir, n);
        return { path: p, mtime: statSync(p).mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);
    return entries[0]?.path ?? null;
  } catch {
    return null;
  }
}

/** Extract a short title from the first H1 or first non-empty line. */
function extractTitle(content) {
  const h1 = content.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim().slice(0, 80);
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (t) return t.slice(0, 80);
  }
  return undefined;
}

/** Build the document title in the canonical format. */
export function planDocumentTitle(sessionId, digest, planTitle, kind = "plan") {
  const fallback = kind === "spec" ? "Spec" : "Plan";
  const base = planTitle?.replace(/^#\s*/, "").trim() || fallback;
  const prefix = kind === "spec" ? "[Spec]" : "[Plan]";
  return `${prefix} ${base} — session ${sessionId.slice(0, 8)}… (${digest})`;
}

/** Short note comment body posted on the issue after the document is created. */
function formatNoteComment(opts) {
  const { sessionId, digest, planPath, documentTitle, documentUrl } = opts;
  const linkedTitle = documentUrl
    ? `[${documentTitle}](${documentUrl})`
    : `**${documentTitle}**`;
  return [
    `🤖 Claude Code plan uploaded: ${linkedTitle}`,
    `session \`${sessionId}\` · digest \`${digest}\` · source \`${planPath}\` · ${new Date().toISOString()}`,
  ].join("\n\n");
}

/**
 * Core upload logic. Returns { documentId, commentId } on success, null on skip.
 * Exported for tests.
 */
export async function uploadPlanToIssue(opts) {
  const { sessionId, kind = "plan" } = opts;

  // Resolve target issue: override > session link > bail
  let issueId;
  let issueIdentifier;
  let link = null;

  if (opts.issueOverride) {
    const identifier = parseIssueIdentifier(opts.issueOverride);
    const issue = await resolveIssueByIdentifier(identifier);
    issueId = issue.id;
    issueIdentifier = issue.identifier;
  } else {
    link = readSessionLink(sessionId);
    if (!link) {
      console.error(
        `session ${sessionId} has no linked Linear issue — cannot upload plan.`,
      );
      console.error(
        "  (run `node linear.mjs link-session <TEAM-NN>` first if you want plan sync.)",
      );
      // Return a sentinel that indicates "no link" (should cause exit 1)
      return { skipped: "no-link" };
    }
    issueId = link.issueId;
    issueIdentifier = link.issueIdentifier;
  }

  // Resolve plan content + path
  let planPath = opts.planPath ?? "(stdin)";
  let planContent = opts.planContent;
  if (!planContent) {
    if (!opts.planPath) {
      const recent = findMostRecentPlan();
      if (!recent) {
        console.error("no plan content provided and no files under ~/.claude/plans/");
        return { skipped: "no-plan" };
      }
      planPath = recent;
    }
    planContent = readFileSync(planPath, "utf8");
  }

  const digest = digestOf(planContent);

  // Deduplicate: skip if same digest already uploaded for this session+issue
  if (link && link.plans.some((p) => p.digest === digest)) {
    console.log(
      `plan digest ${digest} already uploaded for session ${sessionId} — skipping.`,
    );
    return { skipped: "dedup" };
  }

  const planTitle = extractTitle(planContent);
  const docTitle = planDocumentTitle(sessionId, digest, planTitle, kind);

  // 1. Create the Linear Document with full plan markdown
  const docData = await gql(DOCUMENT_CREATE, {
    input: { issueId, title: docTitle, content: planContent },
  });
  const document = docData.documentCreate?.document;
  if (!document) throw new Error("Linear returned no document after documentCreate");
  const documentUrl = document.url;

  // 2. Post a short note comment so the activity log records the upload
  const commentData = await gql(COMMENT_CREATE, {
    input: {
      issueId,
      body: formatNoteComment({
        sessionId,
        digest,
        planPath,
        documentTitle: docTitle,
        documentUrl,
      }),
    },
  });
  const comment = commentData.commentCreate?.comment;
  if (!comment) throw new Error("Linear returned no comment after commentCreate");

  // Persist to session link (APPEND-ONLY — never delete)
  if (link) {
    const entry = {
      path: planPath,
      uploadedAt: new Date().toISOString(),
      documentId: document.id,
      documentUrl,
      commentId: comment.id,
      digest,
      title: planTitle,
    };
    link.plans.push(entry);
    writeSessionLink(sessionId, link);
  }

  console.log(
    `uploaded plan ${digest} -> ${issueIdentifier} (doc ${document.id.slice(0, 8)}… note ${comment.id.slice(0, 8)}…)`,
  );
  return { documentId: document.id, commentId: comment.id };
}

export async function run(argv) {
  let planFile;
  let planStdin = false;
  let sessionId;
  let issueOverride;
  let kind = "plan";

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--plan-file") {
      planFile = argv[++i];
    } else if (a === "--plan-stdin") {
      planStdin = true;
    } else if (a === "--session") {
      sessionId = argv[++i];
    } else if (a === "--issue") {
      issueOverride = argv[++i];
    } else if (a === "--kind") {
      const v = argv[++i];
      if (v !== "spec" && v !== "plan") {
        console.error(`--kind must be 'spec' or 'plan' (got ${v ?? "<missing>"})`);
        printUsage();
        return 2;
      }
      kind = v;
    } else if (a === "--help" || a === "-h") {
      printUsage();
      return 0;
    } else {
      console.error(`unexpected argument: ${a}`);
      printUsage();
      return 2;
    }
  }

  let resolvedSessionId;
  try {
    resolvedSessionId = sessionId ?? (issueOverride ? "__override__" : getCurrentSessionId());
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  let planContent;
  let planPath = planFile;

  if (planStdin) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    planContent = Buffer.concat(chunks).toString("utf8");
    if (!planContent.trim()) {
      console.error("--plan-stdin: no content on stdin");
      return 1;
    }
  } else if (!planPath) {
    planPath = findMostRecentPlan() ?? undefined;
    if (!planPath) {
      console.error("no --plan-file given and no files under ~/.claude/plans/");
      return 1;
    }
  }

  let result;
  try {
    result = await uploadPlanToIssue({
      sessionId: resolvedSessionId,
      planPath,
      planContent,
      issueOverride,
      kind,
    });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  // Handle skip sentinels
  if (result && result.skipped) {
    if (result.skipped === "no-link" || result.skipped === "no-plan") {
      return 1;
    }
    // "dedup" — already uploaded, silently succeed
    return 0;
  }

  return 0;
}
