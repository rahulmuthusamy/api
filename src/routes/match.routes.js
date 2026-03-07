const express = require('express');
const router = express.Router();
const matchController = require('../controllers/match.controller');

router.get('/', matchController.getAllMatches);
router.get('/:id', matchController.getMatchById);
router.post('/', matchController.createMatch);
router.put('/:id', matchController.updateMatch);
router.delete('/:id', matchController.deleteMatch);

// Match scoring
router.post('/:id/toss', matchController.recordToss);
router.post('/:id/innings', matchController.startInnings);
router.post('/ball', matchController.recordBall);
router.post('/:id/undo-ball', matchController.undoLastBall);
router.post('/innings/complete', matchController.completeInnings);

// Match data
router.get('/:id/live-score', matchController.getLiveScore);
router.get('/:id/live-score-detailed', matchController.getLiveScoreDetailed);
router.get('/:id/scorecard', matchController.getScorecard);
router.get('/:id/squads', matchController.getMatchSquads);
router.post('/:id/squads', matchController.saveMatchSquad);

// NEW Comprehensive Match Management Routes
router.get('/:id/squad', matchController.getMatchSquad);
router.post('/:id/squad', matchController.saveMatchSquad);
router.post('/:id/start', matchController.startMatch);
router.post('/:id/ball-new', matchController.recordBallNew);
router.get('/:id/scorecard-full', matchController.generateScorecard);
router.post('/:id/complete', matchController.completeMatchNew);

module.exports = router;

