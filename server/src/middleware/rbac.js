const ApiError = require('../utils/ApiError');

// Usage: router.get('/x', authenticate, authorize('admin', 'doctor'), handler)
module.exports = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(new ApiError(403, 'You do not have permission to do this'));
