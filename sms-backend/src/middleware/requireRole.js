// Middleware factory enforcing that req.user.role is one of `allowedRoles`.
// Every workflow-transition route in this API is guarded by this, at the
// server, not just hidden in the UI (Build Prompt directive 3).
function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Role '${req.user.role}' is not permitted to perform this action.`,
        allowedRoles,
      });
    }
    next();
  };
}

module.exports = requireRole;
