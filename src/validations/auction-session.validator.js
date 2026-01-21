const { body } = require('express-validator');

exports.createAuctionSessionValidator = [
  body('Name')
    .notEmpty().withMessage('Session name is required')
    .isLength({ min: 3 }).withMessage('Session name must be at least 3 characters'),

  body('StartDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Start date must be a valid ISO8601 date'),

  body('EndDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('End date must be a valid ISO8601 date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  // body('Status')
  //   .optional()
  //   .isIn(['upcoming', 'ongoing', 'completed']).withMessage('Invalid session status')
];
