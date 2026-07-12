const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_456';
const ACCESS_TOKEN_EXPIRE = process.env.JWT_ACCESS_EXPIRE || '1h';
const REFRESH_TOKEN_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

exports.generateAccessToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRE });
};

exports.generateRefreshToken = (payload) => {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRE });
};

exports.verifyAccessToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

exports.verifyRefreshToken = (token) => {
    return jwt.verify(token, JWT_REFRESH_SECRET);
};
