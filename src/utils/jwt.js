const jwt = require('jsonwebtoken');
const config = require('../config/config');

exports.generateAccessToken = (payload) => {
    return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.accessTokenExpire });
};

exports.generateRefreshToken = (payload) => {
    return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.refreshTokenExpire });
};

exports.verifyAccessToken = (token) => {
    return jwt.verify(token, config.jwt.secret);
};

