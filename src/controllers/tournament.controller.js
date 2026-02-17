const tournamentService = require('../services/tournament.service');
const response = require('../utils/response');
const HTTP = require('../utils/httpStatusCodes');

exports.getAllTournaments = async (req, res) => {
    const tournaments = await tournamentService.getAllTournaments();
    return response.success(res, 'Tournaments fetched successfully', { tournaments });
};

exports.getTournamentById = async (req, res) => {
    const { id } = req.params;
    const tournament = await tournamentService.getTournamentById(id);
    if (!tournament) {
        return response.success(res, 'Tournament not found', {}, HTTP.NOT_FOUND);
    }
    return response.success(res, 'Tournament fetched successfully', { tournament });
};

exports.createTournament = async (req, res) => {
    const payload = { ...req.body };

    if (req.files) {
        if (req.files.logo) payload.LogoURL = `/uploads/tournaments/${req.files.logo[0].filename}`;
        if (req.files.banner) payload.BannerURL = `/uploads/tournaments/${req.files.banner[0].filename}`;
    }

    // Parse teams if it's a JSON string (coming from FormData)
    if (payload.teams && typeof payload.teams === 'string') {
        try {
            payload.teams = JSON.parse(payload.teams);
        } catch (e) {
            console.error('Failed to parse teams JSON:', e);
            payload.teams = [];
        }
    }

    const tournament = await tournamentService.createTournament(payload);
    return response.success(res, 'Tournament created successfully', { tournament }, HTTP.CREATED);
};

exports.updateTournament = async (req, res) => {
    const { id } = req.params;
    const payload = { ...req.body };

    if (req.files) {
        if (req.files.logo) payload.LogoURL = `/uploads/tournaments/${req.files.logo[0].filename}`;
        if (req.files.banner) payload.BannerURL = `/uploads/tournaments/${req.files.banner[0].filename}`;
    }

    // Parse teams if it's a JSON string
    if (payload.teams && typeof payload.teams === 'string') {
        try {
            payload.teams = JSON.parse(payload.teams);
        } catch (e) {
            console.error('Failed to parse teams JSON:', e);
            payload.teams = [];
        }
    }

    const tournament = await tournamentService.updateTournament(id, payload);
    if (!tournament) {
        return response.success(res, 'Tournament not found', {}, HTTP.NOT_FOUND);
    }
    return response.success(res, 'Tournament updated successfully', { tournament });
};

exports.deleteTournament = async (req, res) => {
    const { id } = req.params;
    const deleted = await tournamentService.deleteTournament(id);
    if (!deleted) {
        return response.success(res, 'Tournament not found', {}, HTTP.NOT_FOUND);
    }
    return response.success(res, 'Tournament deleted successfully', { deletedCount: deleted });
};

exports.getPointsTable = async (req, res) => {
    const { tournamentId } = req.params;
    const pointsTable = await tournamentService.getPointsTable(tournamentId);
    return response.success(res, 'Points table fetched successfully', { pointsTable });
};

/**
 * Enroll a team in a tournament
 */
exports.enrollTeam = async (req, res) => {
    const { id } = req.params;
    const { teamId } = req.body;

    const tournament = await tournamentService.enrollTeam(id, teamId);
    return response.success(res, 'Team enrolled successfully', { tournament });
};

/**
 * Withdraw a team from a tournament
 */
exports.withdrawTeam = async (req, res) => {
    const { id, teamId } = req.params;

    const tournament = await tournamentService.withdrawTeam(id, teamId);
    return response.success(res, 'Team withdrawn successfully', { tournament });
};

/**
 * Generate fixtures for a tournament
 */
exports.generateFixtures = async (req, res) => {
    const { id } = req.params;

    const fixtures = await tournamentService.generateFixtures(id);
    return response.success(res, 'Fixtures generated successfully', { fixtures, count: fixtures.length });
};

/**
 * Get tournament standings
 */
exports.getStandings = async (req, res) => {
    const { id } = req.params;

    const standings = await tournamentService.calculateStandings(id);
    return response.success(res, 'Standings fetched successfully', { standings });
};

/**
 * Get tournament statistics
 */
exports.getTournamentStats = async (req, res) => {
    const { id } = req.params;

    const stats = await tournamentService.getTournamentStats(id);
    return response.success(res, 'Statistics fetched successfully', stats);
};

/**
 * Close tournament registration
 */
exports.closeRegistration = async (req, res) => {
    const { id } = req.params;

    const tournament = await tournamentService.closeRegistration(id);
    return response.success(res, 'Registration closed successfully', { tournament });
};

