const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teams-master.controller');

const { uploadTeamLogo } = require('../middlewares/upload.middleware.js');

// Get all teams
router.get('/', teamController.getAllTeams);

// Team-Player Management Routes (Static paths first)
router.get('/players/available', teamController.getAvailablePlayers);

// Get a single team by id
router.get('/:id', teamController.getTeamById);

// Create a new team
router.post('/', uploadTeamLogo.single('image'), teamController.createTeam);

// Update a team
router.put('/:id', uploadTeamLogo.single('image'), teamController.updateTeam);

// Delete a team
router.delete('/:id', teamController.deleteTeam);

// Team-Player Management Routes
router.post('/:teamId/players', teamController.addPlayerToTeam);
router.get('/:teamId/players', teamController.getTeamPlayers);
router.delete('/:teamId/players/:playerId', teamController.removePlayerFromTeam);

module.exports = router;
