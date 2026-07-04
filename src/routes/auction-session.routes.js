const express = require('express');
const router = express.Router();

const auctionSessionController = require('../controllers/auction-session.controller');

const { createAuctionSessionValidator } = require('../validations/auction-session.validator');
const validateRequest = require('../middlewares/validateRequest');

const { uploadSessionQR } = require('../middlewares/upload.middleware');

router.get('/', auctionSessionController.getAllSessions);

router.get('/upcoming', auctionSessionController.getUpcomingSessions);

router.get('/:id', auctionSessionController.getSessionById);

router.post('/',
    uploadSessionQR.single('upiScanner'),
    createAuctionSessionValidator,
    validateRequest,
    auctionSessionController.createSession
);

router.put('/:id',
    uploadSessionQR.single('upiScanner'),
    createAuctionSessionValidator,
    validateRequest, 
    auctionSessionController.updateSession
);

router.delete('/:id', auctionSessionController.deleteSession);

module.exports = router;
