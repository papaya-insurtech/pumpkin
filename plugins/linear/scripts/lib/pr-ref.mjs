// plugins/linear/scripts/lib/pr-ref.mjs
// Extracts a team-agnostic Linear issue reference from a PR body.

/**
 * Extract the first `Ref: TEAM-123` from prBody and return it uppercased,
 * or null if none is found.
 * @param {string} prBody
 * @returns {string|null}
 */
export function extractRef(prBody) {
  const match = /Ref:\s*([A-Za-z]+-\d+)/i.exec(prBody);
  if (!match) return null;
  return match[1].toUpperCase();
}
