const response = require('../utils/response');
const MSG = require('../utils/messages');
const HTTP = require('../utils/httpStatusCodes');
const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  logger.error(err.message || 'Unhandled error occurred', { 
    stack: err.stack,
    requestId: req.requestId,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id || 'Anonymous',
  });

  return response.error(res, {
    message: err.message || MSG.COMMON.INTERNAL_SERVER_ERROR,
    statusCode: err.statusCode || HTTP.INTERNAL_SERVER_ERROR,
    error: process.env.NODE_ENV === 'development' ? err.stack : 'Something went wrong. Please contact support.',
  });
};
