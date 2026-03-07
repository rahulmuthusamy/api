const userService = require('../services/user.service');
const response = require('../utils/response');
const MSG = require('../utils/messages');
const HTTP = require('../utils/httpStatusCodes');
const asyncHandler = require('../utils/asyncHandler');

const handleLogin = asyncHandler(async (req, res) => {

  const { payload, accessToken, refreshToken } = await userService.handleLogin(req.body);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })

  response.success(res, MSG.AUTH.LOGIN_SUCCESS, { payload, accessToken });
});

const handleLogout = asyncHandler(async (req, res) => {
  return res.json({ message: MSG.AUTH.LOGOUT_SUCCESS });
});
const handleRefreshToken = async (req, res) => {

}

module.exports = { handleLogin, handleLogout, handleRefreshToken }