module.exports = {
  LOGIN: {
    windowMs: 15 * 60 * 1000, 
    max: 5,
    messageKey: 'TOO_MANY_LOGIN_ATTEMPTS'
  },
  OTP: {
    windowMs: 30 * 60 * 1000,
    max: 3,
    messageKey: 'TOO_MANY_OTP_REQUESTS'
  },
  DEFAULT: {
    windowMs: 5 * 60 * 1000,
    max: 50,
    messageKey: 'TOO_MANY_REQUESTS'
  }
};
