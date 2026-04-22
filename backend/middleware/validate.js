const { validationResult } = require('express-validator');

/**
 * Runs after a chain of express-validator checks. If any of them fail,
 * responds with 422 and the full list so the client can show inline errors.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(422).json({
    message: 'Validation failed',
    errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
  });
};

module.exports = validate;
