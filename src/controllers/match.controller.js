const matchService = require('../services/match.service');
const response = require('../utils/response');
const HTTP = require('../utils/httpStatusCodes');

exports.getAllMatches = async (req, res) => {
    const matches = await matchService.getAllMatches(req.query);
    return response.success(res, 'Matches fetched successfully', { matches });
};

exports.getMatchById = async (req, res) => {
    const { id } = req.params;
    const match = await matchService.getMatchById(id);
    if (!match) {
        return response.success(res, 'Match not found', {}, HTTP.NOT_FOUND);
    }
    return response.success(res, 'Match fetched successfully', { match });
};

exports.createMatch = async (req, res) => {
    const match = await matchService.createMatch(req.body);
    return response.success(res, 'Match created successfully', { match }, HTTP.CREATED);
};

exports.updateMatch = async (req, res) => {
    const { id } = req.params;
    const match = await matchService.updateMatch(id, req.body);
    if (!match) {
        return response.success(res, 'Match not found', {}, HTTP.NOT_FOUND);
    }
    return response.success(res, 'Match updated successfully', { match });
};

exports.deleteMatch = async (req, res) => {
    const { id } = req.params;
    const deleted = await matchService.deleteMatch(id);
    if (!deleted) {
        return response.success(res, 'Match not found', {}, HTTP.NOT_FOUND);
    }
    return response.success(res, 'Match deleted successfully', { deletedCount: deleted });
};

exports.getLiveScore = async (req, res) => {
    const { id } = req.params;
    const liveScore = await matchService.getLiveScore(id);
    return response.success(res, 'Live score fetched successfully', { liveScore });
};

/**
 * Record toss
 */
exports.recordToss = async (req, res) => {
    const { id } = req.params;
    const { tossWinnerId, tossDecision } = req.body;

    const match = await matchService.recordToss(id, tossWinnerId, tossDecision);
    return response.success(res, 'Toss recorded successfully', { match });
};

/**
 * Start an innings
 */
exports.startInnings = async (req, res) => {
    const { id } = req.params;
    const { inningsNumber } = req.body;

    const innings = await matchService.startInnings(id, inningsNumber);
    return response.success(res, 'Innings started successfully', { innings });
};

/**
 * Record a ball
 */
exports.recordBall = async (req, res) => {
    const ball = await matchService.recordBall(req.body);
    return response.success(res, 'Ball recorded successfully', { ball });
};

/**
 * Undo last ball
 */
exports.undoLastBall = async (req, res) => {
    const { id } = req.params;
    const result = await matchService.undoLastBall(id);
    return response.success(res, 'Last ball undone successfully', { result });
};

/**
 * Complete an innings
 */
exports.completeInnings = async (req, res) => {
    const { inningsId } = req.body;

    const innings = await matchService.completeInnings(inningsId);
    return response.success(res, 'Innings completed successfully', { innings });
};

/**
 * Get detailed live score
 */
exports.getLiveScoreDetailed = async (req, res) => {
    const { id } = req.params;

    const scoreData = await matchService.getLiveScoreDetailed(id);
    return response.success(res, 'Live score fetched successfully', scoreData);
};

/**
 * Get match scorecard
 */
exports.getScorecard = async (req, res) => {
    const { id } = req.params;
    const scoreData = await matchService.getFullScorecard(id);
    return response.success(res, 'Scorecard fetched successfully', scoreData);
};

/**
 * Get squads for a match
 */
exports.getMatchSquads = async (req, res) => {
    const { id } = req.params;
    const squads = await matchService.getMatchSquads(id);
    return response.success(res, 'Squads fetched successfully', squads);
};

/**
 * Save match squad
 */
exports.saveMatchSquad = async (req, res) => {
    const { id } = req.params;
    const { teamId, playerIds } = req.body;
    const squad = await matchService.saveMatchSquad(id, teamId, playerIds);
    return response.success(res, 'Squad saved successfully', { squad });
};
