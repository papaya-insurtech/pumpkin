// plugins/linear/scripts/lib/client.mjs
import { readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const ENDPOINT = "https://api.linear.app/graphql";
export const TEAM_KEY = (process.env.LINEAR_TEAM_KEY || "").trim();
export const KEY_FILE = join(homedir(), ".config", "claude-linear", "api-key");

export function getApiKey() {
  const fromEnv = process.env.LINEAR_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  try {
    const mode = statSync(KEY_FILE).mode & 0o777;
    if (mode !== 0o600) {
      console.warn(`[linear] WARN: ${KEY_FILE} mode is ${mode.toString(8)}, expected 600. Fix: chmod 600 ${KEY_FILE}`);
    }
    const contents = readFileSync(KEY_FILE, "utf8").trim();
    if (!contents) throw new Error(`${KEY_FILE} is empty`);
    return contents;
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Linear API key not found.\n  Tried:\n    1. $LINEAR_API_KEY (not set)\n    2. ${KEY_FILE} (${cause})\n` +
      `  Fix:\n    1. Generate a personal key at https://linear.app/settings/api\n` +
      `    2. mkdir -p ~/.config/claude-linear\n    3. printf '%s' '<your key>' > ${KEY_FILE}\n    4. chmod 600 ${KEY_FILE}`
    );
  }
}

export async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: getApiKey() },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Linear HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  return json.data;
}

function requireTeamKey() {
  if (!TEAM_KEY) throw new Error("LINEAR_TEAM_KEY is not set. Set it to your team key (e.g. ENG). See plugin README.");
  return TEAM_KEY;
}

let _team, _states, _labels;
export async function getTeam() {
  if (_team) return _team;
  const key = requireTeamKey();
  const d = await gql(
    `query($key:String!){ teams(filter:{key:{eq:$key}}){ nodes{ id key cyclesEnabled triageEnabled } } }`,
    { key }
  );
  const t = d.teams.nodes[0];
  if (!t) throw new Error(`Team ${key} not found`);
  _team = { teamId: t.id, teamKey: t.key, cyclesEnabled: t.cyclesEnabled, triageEnabled: t.triageEnabled };
  return _team;
}

export async function getStates() {
  if (_states) return _states;
  const { teamId } = await getTeam();
  const d = await gql(
    `query($t:ID!){ workflowStates(filter:{team:{id:{eq:$t}}}){ nodes{ id name type } } }`,
    { t: teamId }
  );
  _states = new Map(d.workflowStates.nodes.map((s) => [s.name.toLowerCase(), s]));
  return _states;
}

const STATE_ALIASES = { ready: "todo", "in-progress": "in progress", "in-review": "in review", cancelled: "canceled" };
export async function resolveStateId(name) {
  const states = await getStates();
  const norm = (STATE_ALIASES[name.toLowerCase()] || name).toLowerCase();
  const s = states.get(norm);
  if (!s) throw new Error(`Unknown state '${name}'. Known: ${[...states.keys()].join(", ")}`);
  return s.id;
}

export async function getLabels() {
  if (_labels) return _labels;
  const d = await gql(`query{ issueLabels(first:250){ nodes{ id name parent{ id } } } }`);
  _labels = new Map(d.issueLabels.nodes.map((l) => [l.name.toLowerCase(), { id: l.id, name: l.name, parentId: l.parent?.id ?? null }]));
  return _labels;
}

export async function labelIdByName(name) {
  return (await getLabels()).get(name.toLowerCase())?.id ?? null;
}

export async function viewer() {
  const d = await gql(`query{ viewer{ id name email } }`);
  return d.viewer;
}

export async function resolveIssueByIdentifier(identifier) {
  const d = await gql(
    `query($id:String!){ issue(id:$id){ id identifier title } }`,
    { id: identifier }
  );
  if (!d.issue) throw new Error(`Issue ${identifier} not found`);
  return d.issue;
}
