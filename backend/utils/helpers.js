class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
// Pick only whitelisted keys from an object (prevents mass-assignment)
const pick = (obj, keys) =>
  keys.reduce((acc, k) => (obj[k] !== undefined ? { ...acc, [k]: obj[k] } : acc), {});

module.exports = { ApiError, asyncHandler, pick };
