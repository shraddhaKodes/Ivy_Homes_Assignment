export function errorMiddleware(err, req, res, next) {
  console.error('Backend error:', err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
}