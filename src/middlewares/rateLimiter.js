const rateLimit = require('express-rate-limit');
const MSG = require('../utils/messages');
const HTTP = require('../utils/httpStatusCodes');
const response = require('../utils/response');
const rateLimitConfig = require('../config/rateLimitConfig');

const createRateLimiter = ({ windowMs, max, messageKey }) => {
    return rateLimit({
        windowMs,
        max,
        handler: (req, res) => {
            const retryAfter = Math.ceil((req.rateLimit.resetTime - new Date()) / 1000);

            response.error(res, {
                message: MSG.RATE_LIMIT[messageKey] || MSG.RATE_LIMIT.TOO_MANY_REQUESTS,
                statusCode: HTTP.TOO_MANY_REQUESTS,
                meta: {
                    retryAfter: formatRetryAfter(retryAfter),
                    ip: req.ip,
                    path: req.originalUrl,
                    timestamp: new Date().toISOString(),
                },
            })
        },
        standardHeaders: true,
        legacyHeaders: false,

    });
}

function formatRetryAfter(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} minute(s) and ${secs} second(s)`;
}

module.exports = {
    defaultLimiter: createRateLimiter(rateLimitConfig.DEFAULT),
    loginLimiter: createRateLimiter(rateLimitConfig.LOGIN),
    otpLimiter: createRateLimiter(rateLimitConfig.OTP),
};