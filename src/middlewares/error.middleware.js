const response = require('../utils/response');
const MSG = require('../utils/messages');
const HTTP = require('../utils/httpStatusCodes');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

module.exports = (err, req, res, next) => {
  let error = err;

  // Categorize errors if they are not already ApiError
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError')
        ? HTTP.BAD_REQUEST
        : HTTP.INTERNAL_SERVER_ERROR;

    const message = error.message || MSG.COMMON.INTERNAL_SERVER_ERROR;
    error = new ApiError(statusCode, message, false, err.stack);
  }

  const { statusCode, message } = error;

  // Log the error
  logger.error(message, {
    statusCode,
    stack: error.stack,
    requestId: req.requestId,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id || 'Anonymous',
  });

  // Prepare response
  const options = {
    message,
    statusCode,
  };

  if (process.env.NODE_ENV === 'development') {
    options.error = error.stack;
  }

  // Clean up message for production if not operational
  if (process.env.NODE_ENV === 'production' && !error.isOperational) {
    options.message = 'Something went wrong. Please contact support.';
  }

  return response.error(res, options);
};
