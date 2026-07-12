const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auction.controller');

// Auction Session Management
router.post('/sessions', auctionController.createSession);
router.get('/sessions/live', auctionController.getLiveSessions);
router.post('/sessions/:sessionId/start', auctionController.startAuction);
router.post('/sessions/:sessionId/pause', auctionController.pauseAuction);
router.post('/sessions/:sessionId/complete', auctionController.completeAuction);

// Team Management
router.get('/sessions/:sessionId/teams', auctionController.getSessionTeams);
router.post('/sessions/:sessionId/teams', auctionController.registerTeam);
router.delete('/sessions/:sessionId/teams/:teamId', auctionController.removeTeam);
router.get('/sessions/:sessionId/teams/:teamId/dashboard', auctionController.getTeamDashboard);

// Player Pool Management
router.get('/sessions/:sessionId/players', auctionController.getSessionPlayers);
router.post('/sessions/:sessionId/players', auctionController.addPlayerToPool);
router.delete('/sessions/:sessionId/players/:playerId', auctionController.removePlayerFromPool);

// Bidding
router.post('/sessions/:sessionId/validate-bid', auctionController.validateBid);
router.post('/sessions/:sessionId/sell', auctionController.sellPlayer);
router.post('/sessions/:sessionId/unsold', auctionController.markUnsold);
router.post('/sessions/:sessionId/requeue-unsold', auctionController.requeueUnsoldPlayers);

// Results
router.get('/sessions/:sessionId/results', auctionController.getAuctionResults);

// Public: registered teams for a session (used by website — no auth needed)
router.get('/sessions/:sessionId/registered-teams', auctionController.getSessionRegisteredTeams);

module.exports = router;
