const auctionService = require('../services/auction.service');
const response = require('../utils/response');
const HTTP = require('../utils/httpStatusCodes');

/**
 * Create auction session
 */
exports.createSession = async (req, res) => {
  try {
    const result = await auctionService.createSession(req.body);
    return response.success(res, result.message, result.data, HTTP.CREATED);
  } catch (error) {
    return response.error(res, { message: error.message }, HTTP.BAD_REQUEST);
  }
};

/**
 * Register team for auction
 */
exports.registerTeam = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { teamId } = req.body;

    const result = await auctionService.registerTeam(sessionId, teamId);
    return response.success(res, result.message, result.data, HTTP.CREATED);
  } catch (error) {
    return response.error(res, { message: error.message }, HTTP.BAD_REQUEST);
  }
};

/**
 * Add player to auction pool
 */
exports.addPlayerToPool = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { playerId, basePrice } = req.body;

    const result = await auctionService.addPlayerToPool(sessionId, playerId, basePrice);
    return response.success(res, result.message, result.data, HTTP.CREATED);
  } catch (error) {
    return response.error(res, { message: error.message }, HTTP.BAD_REQUEST);
  }
};

/**
 * Start auction
 */
exports.startAuction = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await auctionService.startAuction(sessionId);
    return response.success(res, result.message, result.data);
  } catch (error) {
    return response.error(res, { message: error.message }, HTTP.BAD_REQUEST);
  }
};

/**
 * Validate bid
 */
exports.validateBid = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { teamId, playerId, bidAmount } = req.body;

    const result = await auctionService.validateBid(sessionId, teamId, playerId, bidAmount);
    return response.success(res, result.message, {});
  } catch (error) {
    return response.error(res, { message: error.message }, HTTP.BAD_REQUEST);
  }
};

/**
 * Sell player to team
 */
exports.sellPlayer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { playerId, teamId, finalBid } = req.body;

    const result = await auctionService.sellPlayer(sessionId, playerId, teamId, finalBid);
    return response.success(res, result.message, result.data);
  } catch (error) {
    return response.error(res, { message: error.message }, HTTP.BAD_REQUEST);
  }
};

/**
 * Mark player as unsold
 */
exports.markUnsold = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { playerId } = req.body;

    const result = await auctionService.markUnsold(sessionId, playerId);
    return response.success(res, result.message, {});
  } catch (error) {
    return response.error(res, { message: error.message }, HTTP.BAD_REQUEST);
  }
};

/**
 * Complete auction
 */
exports.completeAuction = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await auctionService.completeAuction(sessionId);
    return response.success(res, result.message, result.data);
  } catch (error) {
    return response.error(res, { message: error.message }, HTTP.BAD_REQUEST);
  }
};

/**
 * Get auction results
 */
exports.getAuctionResults = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await auctionService.getAuctionResults(sessionId);
    return response.success(res, 'Auction results fetched successfully', result.data);
  } catch (error) {
    return response.error(res, { message: error.message }, HTTP.BAD_REQUEST);
  }
};

/**
 * Get team's auction dashboard
 */
exports.getTeamDashboard = async (req, res) => {
  try {
    const { sessionId, teamId } = req.params;

    const result = await auctionService.getTeamDashboard(sessionId, teamId);
    return response.success(res, 'Team dashboard fetched successfully', result.data);
  } catch (error) {
    return response.error(res, { message: error.message }, HTTP.BAD_REQUEST);
  }
};
