function errorHandler(err, req, res, next) {
  res.status(err.status || 500);
  res.send({ error: true, message: Error.message || "Internal Server Error" });
}

module.exports = errorHandler;
