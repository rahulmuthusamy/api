const HTTP = require('./httpStatusCodes');
const MSG = require('./messages');

function format(res, { success, statusCode, message, data = null, meta = {} }) {
    return res.status(statusCode).json({
        success,
        statusCode,
        message,
        data,
        meta,
    });
}

function success(res, message, data = {}, statusCode = HTTP.OK, meta = {}) {
    return format(res, { success: true, statusCode, message, data, meta });
}

function error(res, {
    message = MSG.COMMON.INTERNAL_SERVER_ERROR,
    statusCode = HTTP.INTERNAL_SERVER_ERROR,
    error = null,
    meta = {}
}) {
    return format(res, {
        success: false,
        statusCode,
        message,
        data: error ? { error } : null,
        meta,
    });
}

module.exports = { success, error };
