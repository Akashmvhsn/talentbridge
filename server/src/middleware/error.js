const httpError = require('../utils/httpError');

exports.notFound = (req, res, next) => next(httpError(404, `Route not found: ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message;

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    message = 'File is too large (max 5 MB)';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Already exists';
  }

  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Something went wrong on our side' : message });
};
