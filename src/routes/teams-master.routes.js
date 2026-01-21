const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teams-master.controller');

// Get all teams
router.get('/', teamController.getAllTeams);

// Get a single team by id
router.get('/:id', teamController.getTeamById);

// Create a new team
router.post('/', teamController.createTeam);

// Update a team
router.put('/:id', teamController.updateTeam);

// Delete a team
router.delete('/:id', teamController.deleteTeam);

module.exports = router;
