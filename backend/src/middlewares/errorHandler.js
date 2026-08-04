const errorHandler = (err, req, res, next) => {
  // Handle multer file size limit errors
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File is too large. Maximum size allowed is 5MB.',
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Log the error to the server console (vital for Vercel/production debugging)
  console.error(`💥 [Error Handler] [${req.method}] ${req.originalUrl}:`, err);

  res.status(statusCode);
  res.json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
