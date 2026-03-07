const teamsService = require('../services/teams-master.service');
const response = require('../utils/response');
const { TEAMS } = require('../utils/messages');
const HTTP = require('../utils/httpStatusCodes');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const teamService = require('../services/team.service');

exports.getAllTeams = asyncHandler(async (req, res) => {
    const teams = await teamsService.getAllTeams();

    if (!teams.length) {
        throw new ApiError(HTTP.NOT_FOUND, TEAMS.NOT_FOUND);
    }

    return response.success(res, TEAMS.FETCH_SUCCESS, { teams });
});

exports.getTeamById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const teams = await teamsService.getTeamsById(id);

    if (!teams) {
        throw new ApiError(HTTP.NOT_FOUND, TEAMS.NOT_FOUND);
    }

    return response.success(res, TEAMS.FETCH_SUCCESS, { teams });
});

exports.createTeam = asyncHandler(async (req, res) => {
    const payload = req.body;
    const imagePath = req.file
        ? `/uploads/teams/${req.file.filename}`
        : null;

    if (imagePath) {
        payload.LogoURL = imagePath;
    }

    const teams = await teamsService.createTeams(payload);

    return response.success(res, TEAMS.CREATED, { teams }, HTTP.CREATED);
});

exports.updateTeam = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    const imagePath = req.file
        ? `/uploads/teams/${req.file.filename}`
        : null;

    if (imagePath) {
        payload.LogoURL = imagePath;
    }

    const updated = await teamsService.updateTeams(id, payload);

    if (!updated) {
        throw new ApiError(HTTP.NOT_FOUND, TEAMS.NOT_FOUND);
    }

    return response.success(res, TEAMS.UPDATED, { teams: updated });
});

exports.deleteTeam = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(HTTP.BAD_REQUEST, TEAMS.MISSINGID);
    }
    const deleted = await teamsService.deleteTeamsByID(id);

    if (!deleted) {
        throw new ApiError(HTTP.NOT_FOUND, TEAMS.NOT_FOUND);
    }

    return response.success(res, TEAMS.DELETED, { deletedCount: deleted });
});

// Team-Player Management

exports.addPlayerToTeam = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { playerId } = req.body;

    if (!playerId) {
        throw new ApiError(HTTP.BAD_REQUEST, 'Player ID is required');
    }

    const result = await teamService.addPlayerToTeam(teamId, playerId);
    return response.success(res, result.message, result.data, HTTP.CREATED);
});

exports.removePlayerFromTeam = asyncHandler(async (req, res) => {
    const { teamId, playerId } = req.params;

    const result = await teamService.removePlayerFromTeam(teamId, playerId);
    return response.success(res, result.message, {});
});

exports.getTeamPlayers = asyncHandler(async (req, res) => {
    const { teamId } = req.params;

    const result = await teamService.getTeamPlayers(teamId);
    return response.success(res, 'Team players fetched successfully', result.data);
});

exports.getAvailablePlayers = asyncHandler(async (req, res) => {
    const result = await teamService.getAvailablePlayers();
    return response.success(res, 'Available players fetched successfully', result.data);
});

