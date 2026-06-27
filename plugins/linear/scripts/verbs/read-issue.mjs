// plugins/linear/scripts/verbs/read-issue.mjs
// Read a Linear issue and print its full context.
//
// Usage:
//   node linear.mjs read-issue <ENG-NN|NN|URL> [--json] [--with-doc-bodies]

import { gql } from "../lib/client.mjs";
import { parseIssueIdentifier } from "../lib/session.mjs";

// Query without documents (no @include directive issue on older APIs)
const ISSUE_QUERY_NO_DOCS = `
query($id: String!) {
  issue(id: $id) {
    identifier
    title
    url
    state { name }
    priority
    assignee { name email }
    labels(first: 50) { nodes { name } }
    project { name }
    createdAt
    updatedAt
    description
    parent { identifier title url state { name } }
    children(first: 50) { nodes { identifier title url state { name } } }
    relations(first: 50) { nodes { type relatedIssue { identifier title url state { name } } } }
    inverseRelations(first: 50) { nodes { type issue { identifier title url state { name } } } }
    attachments(first: 50) { nodes { id title subtitle url createdAt } }
    comments(first: 100) { nodes { id body createdAt user { name email } } }
  }
}
`;

const ISSUE_QUERY_WITH_DOCS = `
query($id: String!) {
  issue(id: $id) {
    identifier
    title
    url
    state { name }
    priority
    assignee { name email }
    labels(first: 50) { nodes { name } }
    project { name }
    createdAt
    updatedAt
    description
    parent { identifier title url state { name } }
    children(first: 50) { nodes { identifier title url state { name } } }
    relations(first: 50) { nodes { type relatedIssue { identifier title url state { name } } } }
    inverseRelations(first: 50) { nodes { type issue { identifier title url state { name } } } }
    attachments(first: 50) { nodes { id title subtitle url createdAt } }
    comments(first: 100) { nodes { id body createdAt user { name email } } }
    documents(first: 50) { nodes { id title url createdAt content } }
  }
}
`;

const PRIORITY_LABELS = { 0: "No priority", 1: "Urgent", 2: "High", 3: "Medium", 4: "Low" };

function fmt(issue) {
  const state = issue.state?.name ?? "?";
  return `${issue.identifier} [${state}]  ${(issue.title ?? "").slice(0, 80)}`;
}

export async function run(argv) {
  let id = "";
  let json = false;
  let withDocBodies = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") {
      json = true;
    } else if (a === "--with-doc-bodies") {
      withDocBodies = true;
    } else if (a === "--help" || a === "-h") {
      console.log(
        "usage: node linear.mjs read-issue <ENG-NN|NN|URL> [--json] [--with-doc-bodies]",
      );
      return 0;
    } else if (!id) {
      id = a;
    } else {
      console.error(`unexpected argument: ${a}`);
      return 2;
    }
  }

  if (!id) {
    console.error(
      "usage: node linear.mjs read-issue <ENG-NN|NN|URL> [--json] [--with-doc-bodies]",
    );
    return 2;
  }

  let identifier;
  try {
    identifier = parseIssueIdentifier(id);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  let data;
  try {
    const query = withDocBodies ? ISSUE_QUERY_WITH_DOCS : ISSUE_QUERY_NO_DOCS;
    data = await gql(query, { id: identifier });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  const issue = data.issue;
  if (!issue) {
    console.error(`${identifier} not found`);
    return 1;
  }

  // Normalize fields
  const labels = (issue.labels?.nodes ?? []).map((l) => l.name);
  const comments = (issue.comments?.nodes ?? [])
    .map((c) => ({
      id: c.id,
      createdAt: c.createdAt,
      author: c.user ? `${c.user.name} <${c.user.email}>` : "(unknown)",
      body: c.body,
    }))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const attachments = (issue.attachments?.nodes ?? [])
    .map((a) => ({ id: a.id, title: a.title, subtitle: a.subtitle, url: a.url, createdAt: a.createdAt }))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const docInfos = (issue.documents?.nodes ?? [])
    .map((d) => {
      const base = { id: d.id, title: d.title, url: d.url, createdAt: d.createdAt };
      if (withDocBodies) base.content = d.content;
      return base;
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Parent
  const parentSummary = issue.parent
    ? { identifier: issue.parent.identifier, title: issue.parent.title, state: issue.parent.state?.name, url: issue.parent.url }
    : null;

  // Children
  const children = (issue.children?.nodes ?? [])
    .map((c) => ({ identifier: c.identifier, title: c.title, state: c.state?.name, url: c.url }))
    .sort((a, b) => a.identifier.localeCompare(b.identifier));

  // Relations: outgoing (source side) and incoming (target side)
  const peersByType = new Map();
  for (const r of issue.relations?.nodes ?? []) {
    const other = r.relatedIssue;
    if (!other) continue;
    let label = r.type;
    if (r.type === "duplicate") label = "duplicate-of";
    const list = peersByType.get(label) ?? [];
    list.push({ identifier: other.identifier, title: other.title, state: other.state?.name, url: other.url });
    peersByType.set(label, list);
  }
  for (const r of issue.inverseRelations?.nodes ?? []) {
    const other = r.issue;
    if (!other) continue;
    let label = r.type;
    if (r.type === "blocks") label = "blocked-by";
    else if (r.type === "duplicate") label = "duplicated-by";
    const list = peersByType.get(label) ?? [];
    list.push({ identifier: other.identifier, title: other.title, state: other.state?.name, url: other.url });
    peersByType.set(label, list);
  }
  for (const list of peersByType.values()) {
    list.sort((a, b) => a.identifier.localeCompare(b.identifier));
  }

  if (json) {
    console.log(
      JSON.stringify(
        {
          identifier: issue.identifier,
          title: issue.title,
          url: issue.url,
          state: issue.state?.name ?? null,
          priority: PRIORITY_LABELS[issue.priority] ?? issue.priority,
          assignee: issue.assignee
            ? { name: issue.assignee.name, email: issue.assignee.email }
            : null,
          labels,
          project: issue.project?.name ?? null,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
          description: issue.description ?? "",
          related: {
            parent: parentSummary,
            children,
            relations: Object.fromEntries(peersByType),
          },
          attachments,
          documents: docInfos,
          comments,
        },
        null,
        2,
      ),
    );
    return 0;
  }

  // --- Text output ---
  const priorityLabel = PRIORITY_LABELS[issue.priority] ?? String(issue.priority ?? "?");
  const assigneeStr = issue.assignee
    ? `${issue.assignee.name} <${issue.assignee.email}>`
    : "(unassigned)";

  console.log(`${issue.identifier}  ${issue.title}`);
  console.log(`URL:       ${issue.url}`);
  console.log(`State:     ${issue.state?.name ?? "?"}`);
  console.log(`Priority:  ${priorityLabel}`);
  console.log(`Assignee:  ${assigneeStr}`);
  console.log(`Project:   ${issue.project?.name ?? "(none)"}`);
  console.log(`Labels:    ${labels.length ? labels.join(", ") : "(none)"}`);
  console.log(`Created:   ${issue.createdAt}`);
  console.log(`Updated:   ${issue.updatedAt}`);

  console.log(`\n--- Description ---`);
  console.log(issue.description ?? "(empty)");

  const totalRelated = (parentSummary ? 1 : 0) + children.length + [...peersByType.values()].reduce((s, l) => s + l.length, 0);
  console.log(`\n--- Related issues (${totalRelated}) ---`);
  if (totalRelated === 0) {
    console.log("(none)");
  } else {
    if (parentSummary) {
      console.log(`  parent:`);
      console.log(`    ${fmt(parentSummary)}`);
      if (parentSummary.url) console.log(`    ${parentSummary.url}`);
    }
    if (children.length) {
      console.log(`  sub-issues (${children.length}):`);
      for (const c of children) console.log(`    ${fmt(c)}`);
    }
    const order = ["blocks", "blocked-by", "duplicate-of", "duplicated-by", "related"];
    const seen = new Set();
    for (const type of order) {
      const list = peersByType.get(type);
      if (!list || !list.length) continue;
      seen.add(type);
      console.log(`  ${type} (${list.length}):`);
      for (const p of list) console.log(`    ${fmt(p)}`);
    }
    for (const [type, list] of [...peersByType.entries()].sort()) {
      if (seen.has(type)) continue;
      console.log(`  ${type} (${list.length}):`);
      for (const p of list) console.log(`    ${fmt(p)}`);
    }
  }

  console.log(`\n--- Attachments (${attachments.length}) ---`);
  if (!attachments.length) {
    console.log("(none)");
  } else {
    for (const a of attachments) {
      console.log(`  • ${a.title}${a.subtitle ? `  — ${a.subtitle}` : ""}`);
      console.log(`    ${a.url}`);
      console.log(`    (${a.createdAt})`);
    }
  }

  console.log(`\n--- Documents (${docInfos.length}) ---`);
  if (!docInfos.length) {
    console.log("(none)");
  } else {
    for (const d of docInfos) {
      console.log(`  • ${d.title}`);
      if (d.url) console.log(`    ${d.url}`);
      console.log(`    (${d.createdAt})`);
      if (withDocBodies && d.content) {
        console.log(`    ---`);
        for (const line of d.content.split("\n")) {
          console.log(`    ${line}`);
        }
        console.log(`    ---`);
      }
    }
    if (!withDocBodies) {
      console.log(`  (re-run with --with-doc-bodies to inline document content)`);
    }
  }

  console.log(`\n--- Comments (${comments.length}) ---`);
  if (!comments.length) {
    console.log("(none)");
  } else {
    for (const c of comments) {
      console.log(`\n[${c.createdAt}]  ${c.author}`);
      for (const line of c.body.split("\n")) {
        console.log(`  ${line}`);
      }
    }
  }

  return 0;
}
