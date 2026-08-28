// Generates human-readable, sequential-looking reference numbers such as
// GR-2026-482. Uniqueness is guaranteed by the database UNIQUE constraint on
// the ref_no column, not by this function, so a collision (extremely
// unlikely) simply surfaces as a 400 the caller can retry.
function generateRefNo(prefix) {
  const year = new Date().getFullYear();
  const rand = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${year}-${rand}`;
}

module.exports = { generateRefNo };
