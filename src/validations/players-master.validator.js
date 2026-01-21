const { body } = require('express-validator');

exports.createPlayerValidator = [
    body('Name')
        .notEmpty().withMessage('Player name is required')
        .isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),

    body('Mobile')
        .notEmpty().withMessage('Mobile number is required')
        .isMobilePhone().withMessage('Invalid mobile number'),

    // body('Email')
    //     .optional()
    //     .isEmail().withMessage('Invalid email format'),

    body('Role')
        .notEmpty().withMessage('Role is required')
        .isLength({ min: 2 }).withMessage('Role must be at least 2 characters'),

    // body('PhotoURL')
    //     .optional()
    //     .isURL().withMessage('Photo must be a valid URL'),

    body('Status')
        .optional()
        .isIn(['Active', 'inactive']).withMessage('Status must be active or inactive'),
];
