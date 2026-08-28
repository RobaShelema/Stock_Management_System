// Centralized error handler. Business-rule violations should be thrown as
// `new ApiError(400, "message")` from controllers; anything else is logged
// and returned as a generic 500 to avoid leaking internals.
class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  // Postgres CHECK/FK constraint violations surface as a helpful 400 instead
  // of a raw 500, e.g. attempting to update an append-only ledger table.
  if (err.code === "23514" || err.code === "23503" || err.code === "23505") {
    return res.status(400).json({ error: err.message });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "Internal server error." });
}

module.exports = { errorHandler, ApiError };
