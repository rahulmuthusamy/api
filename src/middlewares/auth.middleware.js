const jwt = require('../utils/jwt');
const { error } = require('../utils/response');
const HTTP = require('../utils/httpStatusCodes');
const MSG = require('../utils/messages');

module.exports = (req, res, next) => {
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiUmFodWwgTSIsImVtYWlsIjoicmFodWxAZ21haWwuY29tIiwiaWF0IjoxNzUyODQxOTQ3LCJleHAiOjE3NTI4NDI4NDd9.gmfY-sqGLNsBGiAqf1VRd3wI9wpZlYlLv7Em-Ywllcs`;
    // req.headers.authorization?.split(' ')[1] ||
    //     req.cookies?.accessToken;

    if (!token) return error(res, {
        message: MSG.AUTH.UNAUTHORIZED,
        statusCode: HTTP.UNAUTHORIZED,
        error: process.env.NODE_ENV === 'development' ? err.stack : 'Something went wrong. Please contact support.',
    });

    try {
        const decoded = jwt.verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        return error(res, {
            message: MSG.AUTH.TOKEN_EXPIRED,
            statusCode: HTTP.FORBIDDEN,
            error: process.env.NODE_ENV === 'development' ? err.stack : 'Something went wrong. Please contact support.',
        });
    }
};
