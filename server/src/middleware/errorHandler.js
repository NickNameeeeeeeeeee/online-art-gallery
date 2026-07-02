export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  const status = error.status || (error.name === "ValidationError" ? 400 : 500);
  const payload = {
    message: status === 500 ? "An unexpected server error occurred." : error.message,
  };

  if (error.details) payload.details = error.details;
  if (process.env.NODE_ENV !== "production" && status === 500) {
    payload.debug = error.message;
  }

  if (status >= 500) console.error(error);
  res.status(status).json(payload);
};
