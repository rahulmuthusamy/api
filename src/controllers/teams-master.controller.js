const teamsService = require('../services/teams-master.service');
const response = require('../utils/response');
const { TEAMS } = require('../utils/messages');
const HTTP = require('../utils/httpStatusCodes');

exports.getAllTeams = async (req, res) => {
    const teams = await teamsService.getAllTeams();

    if (!teams.length) {
        return response.success(res, TEAMS.NOT_FOUND, { teams }, HTTP.NOT_FOUND);
    }

    return response.success(res, TEAMS.FETCH_SUCCESS, { teams });
};

exports.getTeamById = async (req, res) => {
    const { id } = req.params;

    const teams = await teamsService.getTeamsById(id);

    if (!teams) {
        return response.success(res, TEAMS.NOT_FOUND, {}, HTTP.NOT_FOUND);
    }

    return response.success(res, TEAMS.FETCH_SUCCESS, { teams });
};

exports.createTeam = async (req, res) => {
    const teams = await teamsService.createTeams(req.body);

    return response.success(res, TEAMS.CREATED, { teams }, HTTP.CREATED);
};

exports.updateTeam = async (req, res) => {
    const { id } = req.params;

    const updated = await teamsService.updateTeams(id, req.body);

    if (!updated) {
        return response.success(res, TEAMS.NOT_FOUND, {}, HTTP.NOT_FOUND);
    }

    return response.success(res, TEAMS.UPDATED, { teams: updated });
};

exports.deleteTeam = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return response.error(res, { message: TEAMS.MISSINGID })
    }
    const deleted = await teamsService.deleteTeamsByID(id);

    if (!deleted) {
        return response.success(res, TEAMS.NOT_FOUND, {}, HTTP.NOT_FOUND);
    }

    return response.success(res, TEAMS.DELETED, { deletedCount: deleted });
};
