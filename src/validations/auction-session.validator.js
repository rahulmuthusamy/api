const { body } = require('express-validator');

exports.createAuctionSessionValidator = [
  body('Name')
    .notEmpty().withMessage('Session name is required')
    .isLength({ min: 3 }).withMessage('Session name must be at least 3 characters'),

  body('StartDate')
    .notEmpty().withMessage('Start date is required')
    .custom((value) => {
      if (isNaN(Date.parse(value))) throw new Error('Start date must be a valid date');
      return true;
    }),

  body('EndDate')
    .notEmpty().withMessage('End date is required')
    .custom((value, { req }) => {
      if (isNaN(Date.parse(value))) throw new Error('End date must be a valid date');
      // Compare against StartDate (PascalCase as sent from Angular FormData)
      const start = req.body.StartDate;
      if (start && new Date(value) <= new Date(start)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
];

