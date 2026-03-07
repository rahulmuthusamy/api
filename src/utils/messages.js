function buildMessages(entity, overrides = {}) {
  const base = {
    FETCH_SUCCESS: `${entity} fetched successfully`,
    NOT_FOUND: `${entity} not found`,
    CREATED: `${entity} created successfully`,
    UPDATED: `${entity} updated successfully`,
    DELETED: `${entity} deleted successfully`,
    MISSING_ID: `${entity} ID is missing`,
    EXISTING_RECORD: `${entity} already exists`
  };

  return {
    ...base,
    ...overrides
  };
}

module.exports = {
  USER: buildMessages('User'),
  TEAMS: buildMessages('Team'),
  PLAYERS: buildMessages('Player',
    { EXISTING_RECORD: 'Player already exists with this mobile number' }),
  AUCTIONSESSION: buildMessages('Auction Session'),
  MATCHES: buildMessages('Match'),

  AUTH: {
    LOGIN_SUCCESS: 'Login successful',
    LOGIN_FAILED: 'Invalid username or password',
    UNAUTHORIZED: 'Unauthorized access',
    TOKEN_EXPIRED: 'Session expired. Please login again',
    LOGOUT_SUCCESS: 'Logout successful',
  },
  VALIDATION: {
    REQUIRED_FIELDS: 'Please provide all required fields',
    INVALID_EMAIL: 'Please enter a valid email address',
  },
  COMMON: {
    INTERNAL_SERVER_ERROR: 'Something went wrong. Please try again later.',
    FORBIDDEN: 'You are not allowed to perform this action.',
    SUCCESS: 'Request processed successfully',
  },

  RATE_LIMIT: {
    TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
    TOO_MANY_LOGIN_ATTEMPTS: 'Too many login attempts. Try after 15 minutes.',
    TOO_MANY_OTP_REQUESTS: 'OTP limit reached. Try again in 30 minutes.'
  },

  SUCCESS: {
    LOGIN_SUCCESS: 'Login successful',
    OTP_SENT: 'OTP sent successfully',
  }
};
