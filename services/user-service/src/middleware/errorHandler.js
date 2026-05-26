module.exports = function errorHandler(err, req, res, _next) {
  console.error('[user-service] Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
  });
};
