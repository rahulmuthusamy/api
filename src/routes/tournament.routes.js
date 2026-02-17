const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournament.controller');

const { uploadTournament } = require('../middlewares/upload.middleware.js');

const tournamentUploadFields = uploadTournament.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
]);

router.get('/', tournamentController.getAllTournaments);
router.get('/:id', tournamentController.getTournamentById);
router.post('/', tournamentUploadFields, tournamentController.createTournament);
router.put('/:id', tournamentUploadFields, tournamentController.updateTournament);
router.delete('/:id', tournamentController.deleteTournament);

// Tournament management
router.post('/:id/enroll', tournamentController.enrollTeam);
router.delete('/:id/teams/:teamId', tournamentController.withdrawTeam);
router.post('/:id/fixtures/generate', tournamentController.generateFixtures);
router.patch('/:id/registration/close', tournamentController.closeRegistration);

// Tournament data
router.get('/:id/standings', tournamentController.getStandings);
router.get('/:id/stats', tournamentController.getTournamentStats);
router.get('/:tournamentId/points-table', tournamentController.getPointsTable);

module.exports = router;

