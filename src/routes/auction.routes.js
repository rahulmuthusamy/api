const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auction.controller');

// Auction Session Management
router.post('/sessions', auctionController.createSession);
router.post('/sessions/:sessionId/start', auctionController.startAuction);
router.post('/sessions/:sessionId/complete', auctionController.completeAuction);

// Team Management
router.post('/sessions/:sessionId/teams', auctionController.registerTeam);
router.get('/sessions/:sessionId/teams/:teamId/dashboard', auctionController.getTeamDashboard);

// Player Pool Management
router.post('/sessions/:sessionId/players', auctionController.addPlayerToPool);

// Bidding
router.post('/sessions/:sessionId/validate-bid', auctionController.validateBid);
router.post('/sessions/:sessionId/sell', auctionController.sellPlayer);
router.post('/sessions/:sessionId/unsold', auctionController.markUnsold);

// Results
router.get('/sessions/:sessionId/results', auctionController.getAuctionResults);

module.exports = router;
