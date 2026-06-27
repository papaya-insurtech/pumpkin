/**
 * PII scanner — narrow scope.
 *
 * In scope (regex-enforced):
 *   - Date of birth (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY)
 *     where the year is 1920..currentYear-1
 *   - Government ID numbers:
 *       VN  — 9 or 12 digits, isolated
 *       TH  — 13 digits, isolated
 *       HK  — letter + 6 digits + optional check digit in parens
 *
 * Out of scope (rule-only, not scanned):
 *   - Full names, gender
 *   - Claim codes / claim IDs (allowed per plan)
 *   - Policy numbers, emails, phone numbers
 *
 * Returns `{ clean, findings, redacted }` for every input string.
 * `scanFields(fields)` returns null if all fields are clean.
 */

const CURRENT_YEAR = new Date().getUTCFullYear();
const MIN_DOB_YEAR = 1920;
const MAX_DOB_YEAR = CURRENT_YEAR - 1; // must be in the past

// Year-first: YYYY-MM-DD or YYYY/MM/DD
const DOB_YEAR_FIRST =
  /\b(19[2-9]\d|20[0-1]\d|20[2-9]\d)[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/g;

// Day-first: DD-MM-YYYY or DD/MM/YYYY (also matches MM-DD-YYYY — we don't disambiguate)
const DOB_DAY_FIRST =
  /\b(0[1-9]|[12]\d|3[01])[-/](0[1-9]|1[0-2])[-/](19[2-9]\d|20[0-2]\d)\b/g;

// VN id: 9 or 12 digits, isolated by non-digit boundaries.
// Skip when preceded by hyphen (reduces collision with claim codes).
const ID_VN = /(?<![\w-])\d{9}(?!\d)|(?<![\w-])\d{12}(?!\d)/g;

// AWS account IDs are 12 digits but are NOT PII — they appear in ARNs, ECR
// registry URLs, and bucket policies. Set LINEAR_PII_AWS_ALLOWLIST to a
// comma-separated list of 12-digit IDs to skip them (e.g.
// "123456789012,098765432109"). Default is empty (all 12-digit numbers are
// flagged as potential VN IDs unless explicitly allowlisted).
function getAwsAllowlist() {
  const raw = process.env.LINEAR_PII_AWS_ALLOWLIST ?? "";
  if (!raw.trim()) return new Set();
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
}

// TH id: 13 digits isolated
const ID_TH = /(?<![\w-])\d{13}(?!\d)/g;

// HK id: letter + 6 digits + optional (X) check digit
const ID_HK = /\b[A-Z]\d{6}\(?[A0-9]\)?\b/g;

/**
 * @param {string} match
 * @returns {boolean}
 */
function isPlausibleDob(match) {
  const yearMatch = match.match(/19[2-9]\d|20[0-2]\d/);
  if (!yearMatch) return false;
  const year = Number(yearMatch[0]);
  return year >= MIN_DOB_YEAR && year <= MAX_DOB_YEAR;
}

/**
 * Scan a single string for PII.
 *
 * @param {string} input
 * @returns {{ clean: boolean, findings: Array<{kind: string, match: string, index: number}>, redacted: string }}
 */
export function scan(input) {
  /** @type {Array<{kind: string, match: string, index: number}>} */
  const findings = [];

  for (const re of [DOB_YEAR_FIRST, DOB_DAY_FIRST]) {
    re.lastIndex = 0;
    for (const m of input.matchAll(re)) {
      if (!isPlausibleDob(m[0])) continue;
      findings.push({ kind: "dob", match: m[0], index: m.index ?? 0 });
    }
  }

  const awsAllowlist = getAwsAllowlist();
  for (const m of input.matchAll(ID_VN)) {
    if (awsAllowlist.has(m[0])) continue; // allowlisted AWS account id
    findings.push({ kind: "id-vn", match: m[0], index: m.index ?? 0 });
  }

  for (const m of input.matchAll(ID_TH)) {
    // TH 13-digit already caught by vn-12 sometimes — dedupe by exact-index
    if (findings.some((f) => f.index === m.index && f.match === m[0])) continue;
    findings.push({ kind: "id-th", match: m[0], index: m.index ?? 0 });
  }

  for (const m of input.matchAll(ID_HK)) {
    findings.push({ kind: "id-hk", match: m[0], index: m.index ?? 0 });
  }

  // Sort findings by index, then MERGE overlapping/adjacent spans into single
  // redaction ranges before rebuilding. Without the merge, two overlapping
  // findings would silently drop characters between them — under-redacting and
  // corrupting output.
  findings.sort((a, b) => a.index - b.index);
  const spans = [];
  for (const f of findings) {
    const start = f.index;
    const end = f.index + f.match.length;
    const last = spans[spans.length - 1];
    if (last && start <= last.end) {
      last.end = Math.max(last.end, end); // overlap/adjacent → extend
    } else {
      spans.push({ start, end, kind: f.kind });
    }
  }

  let redacted = "";
  let cursor = 0;
  for (const s of spans) {
    redacted += input.slice(cursor, s.start) + `[${s.kind}:REDACTED]`;
    cursor = s.end;
  }
  redacted += input.slice(cursor);

  return { clean: findings.length === 0, findings, redacted };
}

/**
 * Scan many string fields at once. Returns the combined result map or null if
 * all inputs are clean.
 *
 * @param {Record<string, string | undefined | null>} fields
 * @returns {Record<string, ReturnType<typeof scan>> | null}
 */
export function scanFields(fields) {
  const result = {};
  let anyDirty = false;
  for (const [name, value] of Object.entries(fields)) {
    if (!value) continue;
    const r = scan(value);
    result[name] = r;
    if (!r.clean) anyDirty = true;
  }
  return anyDirty ? result : null;
}
