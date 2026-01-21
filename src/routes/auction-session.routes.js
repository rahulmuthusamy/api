const express = require('express');
const router = express.Router();

const auctionSessionController = require('../controllers/auction-session.controller');

const { createAuctionSessionValidator } = require('../validations/auction-session.validator');
const validateRequest = require('../middlewares/validateRequest');

router.get('/', auctionSessionController.getAllSessions);

router.get('/:id', auctionSessionController.getSessionById);

router.post('/',
    createAuctionSessionValidator,
    validateRequest,
    auctionSessionController.createSession
);

router.put('/:id',
    createAuctionSessionValidator,
    validateRequest, auctionSessionController.updateSession);

router.delete('/:id', auctionSessionController.deleteSession);

module.exports = router;
