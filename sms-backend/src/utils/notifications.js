async function notifyRoles(
  client,
  {
    roles,
    title,
    message,
    module,
    referenceId = null,
    severity = "Info",
    excludeUserId = null,
  },
) {
  if (!roles || roles.length === 0) return;
  const params = [roles, title, message, module, referenceId, severity];
  let exclusion = "";
  if (excludeUserId) {
    params.push(excludeUserId);
    exclusion = "AND id <> $7";
  }
  await client.query(
    `INSERT INTO notifications (recipient_id, title, message, module, reference_id, severity)
     SELECT id, $2, $3, $4, $5, $6 FROM users
     WHERE role = ANY($1::text[]) AND status = 'Active' ${exclusion}`,
    params,
  );
}

module.exports = { notifyRoles };
