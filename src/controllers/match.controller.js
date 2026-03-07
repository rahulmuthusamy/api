const matchService = require('../services/match.service');
const response = require('../utils/response');
const HTTP = require('../utils/httpStatusCodes');
const ApiError = require('../utils/ApiError');
const MSG = require('../utils/messages');
const asyncHandler = require('../utils/asyncHandler');

exports.getAllMatches = asyncHandler(async (req, res) => {
    const matches = await matchService.getAllMatches(req.query);
    return response.success(res, MSG.MATCHES.FETCH_SUCCESS, { matches });
});

exports.getMatchById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const match = await matchService.getMatchById(id);
    if (!match) {
        throw new ApiError(HTTP.NOT_FOUND, MSG.MATCHES.NOT_FOUND);
    }
    return response.success(res, MSG.MATCHES.FETCH_SUCCESS, { match });
});

exports.createMatch = asyncHandler(async (req, res) => {
    const match = await matchService.createMatch(req.body);
    return response.success(res, MSG.MATCHES.CREATED, { match }, HTTP.CREATED);
});

exports.updateMatch = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const match = await matchService.updateMatch(id, req.body);
    if (!match) {
        throw new ApiError(HTTP.NOT_FOUND, MSG.MATCHES.NOT_FOUND);
    }
    return response.success(res, MSG.MATCHES.UPDATED, { match });
});

exports.deleteMatch = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await matchService.deleteMatch(id);
    if (!deleted) {
        throw new ApiError(HTTP.NOT_FOUND, MSG.MATCHES.NOT_FOUND);
    }
    return response.success(res, MSG.MATCHES.DELETED, { deletedCount: deleted });
});

exports.getLiveScore = async (req, res) => {
    const { id } = req.params;
    const liveScore = await matchService.getLiveScore(id);
    return response.success(res, 'Live score fetched successfully', { liveScore });
};

/**
 * Record toss
 */
exports.recordToss = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { tossWinnerId, tossDecision } = req.body;

    const match = await matchService.recordToss(id, tossWinnerId, tossDecision);
    return response.success(res, 'Toss recorded successfully', { match });
});

/**
 * Start an innings
 */
exports.startInnings = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { inningsNumber } = req.body;

    const innings = await matchService.startInnings(id, inningsNumber);
    return response.success(res, 'Innings started successfully', { innings });
});

/**
 * Record a ball
 */
exports.recordBall = asyncHandler(async (req, res) => {
    const ball = await matchService.recordBall(req.body);
    return response.success(res, 'Ball recorded successfully', { ball });
});

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
 * Save match squad (NEW - Using comprehensive service)
 */
exports.saveMatchSquad = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { teamId, players } = req.body;

    const result = await matchService.saveMatchSquad(id, teamId, players);
    return response.success(res, result.message, result.data, HTTP.CREATED);
});

/**
 * Get match squad (NEW)
 */
exports.getMatchSquad = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await matchService.getMatchSquad(id);
    return response.success(res, 'Squad fetched successfully', result.data);
});

/**
 * Start match (NEW)
 */
exports.startMatch = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { tossWinnerId, tossDecision } = req.body;

    const result = await matchService.startMatch(id, tossWinnerId, tossDecision);
    return response.success(res, result.message, result.data);
});

/**
 * Record ball (NEW - Comprehensive)
 */
exports.recordBallNew = asyncHandler(async (req, res) => {
    const result = await matchService.recordBall(req.body);
    return response.success(res, result.message, result.data);
});

/**
 * Generate scorecard (NEW)
 */
exports.generateScorecard = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await matchService.generateScorecard(id);
    return response.success(res, 'Scorecard generated successfully', result.data);
});

/**
 * Complete match (NEW)
 */
exports.completeMatchNew = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { winnerId, resultNote } = req.body;

    const result = await matchService.completeMatch(id, winnerId, resultNote);

    // Update tournament standings if applicable
    if (result.data.TournamentID) {
        const tournamentService = require('../services/tournament.service');
        await tournamentService.updateStandings(id);
    }

    return response.success(res, result.message, result.data);
});

