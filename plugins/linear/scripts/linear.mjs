#!/usr/bin/env node
// plugins/linear/scripts/linear.mjs
const VERBS = {
  "read-issue": () => import("./verbs/read-issue.mjs"),
  "pick-task": () => import("./verbs/pick-task.mjs"),
  "start-task": () => import("./verbs/start-task.mjs"),
  "update-status": () => import("./verbs/update-status.mjs"),
  "update-issue": () => import("./verbs/update-issue.mjs"),
  "add-comment": () => import("./verbs/add-comment.mjs"),
  "create-issue": () => import("./verbs/create-issue.mjs"),
  "log-bug": () => import("./verbs/log-bug.mjs"),
  "link-issues": () => import("./verbs/link-issues.mjs"),
  "list-my-issues": () => import("./verbs/list-my-issues.mjs"),
  "project-status": () => import("./verbs/project-status.mjs"),
  "set-project": () => import("./verbs/set-project.mjs"),
  "link-session": () => import("./verbs/link-session.mjs"),
  "session-info": () => import("./verbs/session-info.mjs"),
  "unlink-session": () => import("./verbs/unlink-session.mjs"),
  "upload-plan": () => import("./verbs/upload-plan.mjs"),
  "triage-todos": () => import("./verbs/triage-todos.mjs"),
  "propose-followups": () => import("./verbs/propose-followups.mjs"),
};

async function main() {
  const [verb, ...rest] = process.argv.slice(2);
  if (!verb || verb === "--help" || verb === "-h") {
    console.log("usage: node linear.mjs <verb> [args]\nVerbs:\n  " + Object.keys(VERBS).join("\n  "));
    return 0;
  }
  const loader = VERBS[verb];
  if (!loader) { console.error(`unknown verb: ${verb}`); return 2; }
  const mod = await loader();
  return await mod.run(rest);
}
main().then((c) => process.exit(c ?? 0)).catch((e) => { console.error(e.message); process.exit(1); });
