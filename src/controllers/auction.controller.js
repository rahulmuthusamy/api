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

    // Emit socket event to all clients in the session room
    const io = req.app.locals.io;
    if (io) {
      const auctionNamespace = io.of('/auction');
      auctionNamespace.to(`session-${sessionId}`).emit('auction-started', {
        sessionId: +sessionId,
        message: 'Auction has started! Get ready to bid.',
        session: result.data
      });
    }

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
 * Re-queue all unsold/skipped players back to available
 */
exports.requeueUnsoldPlayers = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await auctionService.requeueUnsoldPlayers(sessionId);

    // Broadcast updated state to all socket clients so their player list refreshes
    const io = req.app.locals.io;
    if (io) {
      const auctionStateService = require('../services/auction-state.service');
      const auctionNamespace = io.of('/auction');
      try {
        const state = await auctionStateService.getSessionState(sessionId);
        auctionNamespace.to(`session-${sessionId}`).emit('session-state', {
          session: {
            sessionId: state.sessionId,
            name: state.session.Name,
            maxBudget: state.session.MaxBudget,
            maxPlayersPerTeam: state.session.MaxPlayersPerTeam,
            status: state.session.Status,
          },
          players: state.players,
          teams: state.teams,
          currentPlayer: state.players[state.currentPlayerIndex] || null,
          currentPlayerIndex: state.currentPlayerIndex,
          secondsLeft: state.secondsLeft,
        });
      } catch (e) {
        console.error('Could not broadcast after requeue:', e.message);
      }
    }

    return response.success(res, result.message, result.data);
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

    // Emit socket event to all clients in the session room
    const io = req.app.locals.io;
    if (io) {
      const auctionNamespace = io.of('/auction');
      auctionNamespace.to(`session-${sessionId}`).emit('auction-ended', {
        sessionId: +sessionId,
        message: 'Auction has ended!',
        session: result.data
      });
    }

    return response.success(res, result.message, result.data);
  } catch (error) {
    return response.error(res, { message: error.message }, HTTP.BAD_REQUEST);
  }
};

/**
 * Pause auction
 */
exports.pauseAuction = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await auctionService.pauseAuction(sessionId);

    // Emit socket event to all clients in the session room
    const io = req.app.locals.io;
    if (io) {
      const auctionNamespace = io.of('/auction');
      // For a paused session, we emit a session state update so clients see it as 'upcoming'/paused
      auctionNamespace.to(`session-${sessionId}`).emit('auction-paused', {
        sessionId: +sessionId,
        message: 'Auction has been paused.',
        session: result.data
      });
      // Broadcast a minimal session-state so clients update status in real-time
      auctionNamespace.to(`session-${sessionId}`).emit('session-state', {
        session: {
          sessionId: +sessionId,
          name: result.data?.Name,
          status: 'upcoming',
          maxBudget: result.data?.MaxBudget,
          maxPlayersPerTeam: result.data?.MaxPlayersPerTeam
        }
      });
    }

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

/**
 * Get all teams registered for a session
 */
exports.getSessionTeams = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await auctionService.getSessionTeams(sessionId);
    return response.success(res, 'Session teams fetched successfully', result.data);
  } catch (error) {
    return response.error(res, { message: error.message }, HTTP.BAD_REQUEST);
  }
};

/**
 * Get all players in the auction pool for a session
 */
exports.getSessionPlayers = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await auctionService.getSessionPlayers(sessionId);
    return response.success(res, 'Session players fetched successfully', result.data);
  } catch (error) {
    return response.error(res, { message: error.message }, HTTP.BAD_REQUEST);
  }
};

/**
 * Get all live/upcoming sessions (for owner entry screen)
 */
exports.getLiveSessions = async (req, res) => {
  try {
    const result = await auctionService.getLiveSessions();
    return response.success(res, 'Live sessions fetched successfully', result.data);
  } catch (error) {
    return response.error(res, { message: error.message }, HTTP.BAD_REQUEST);
  }
};

/**
 * Remove a team from a session
 */
exports.removeTeam = async (req, res) => {
  try {
    const { sessionId, teamId } = req.params;
    const result = await auctionService.removeTeam(sessionId, teamId);
    return response.success(res, result.message, {});
  } catch (error) {
    return response.error(res, { message: error.message }, HTTP.BAD_REQUEST);
  }
};

/**
 * Remove a player from the auction pool
 */
exports.removePlayerFromPool = async (req, res) => {
  try {
    const { sessionId, playerId } = req.params;
    const result = await auctionService.removePlayerFromPool(sessionId, playerId);
    return response.success(res, result.message, {});
  } catch (error) {
    return response.error(res, { message: error.message }, HTTP.BAD_REQUEST);
  }
};

/**
 * Get registered teams for a session — PUBLIC (for website display)
 */
exports.getSessionRegisteredTeams = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await auctionService.getSessionRegisteredTeams(sessionId);
    return response.success(res, 'Registered teams fetched successfully', result.data);
  } catch (error) {
    return response.error(res, { message: error.message }, HTTP.BAD_REQUEST);
  }
};
