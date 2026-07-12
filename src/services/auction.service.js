const {
  AuctionSession, AuctionPlayer, AuctionTeam, AuctionBid, AuctionLog,
  PlayerMaster, TeamMaster, TeamPlayer
} = require('../models');
const { Op } = require('sequelize');
const auctionStateService = require('./auction-state.service');

class AuctionService {

  /**
   * Create auction session
   */
  async createSession(sessionData) {
    const session = await AuctionSession.create({
      Name: sessionData.name,
      Year: sessionData.year,
      MaxBudget: sessionData.maxBudget,
      MaxPlayersPerTeam: sessionData.maxPlayersPerTeam,
      StartDate: sessionData.startDate,
      EndDate: sessionData.endDate,
      Notes: sessionData.notes,
      Status: 'upcoming'
    });
    return { success: true, message: 'Auction session created successfully', data: session };
  }

  /**
   * Register team for auction — seeds RemainingBudget from session MaxBudget
   */
  async registerTeam(sessionId, teamId) {
    const session = await AuctionSession.findByPk(sessionId);
    if (!session) throw new Error('Auction session not found');

    const team = await TeamMaster.findByPk(teamId);
    if (!team) throw new Error('Team not found');

    const existing = await AuctionTeam.findOne({ where: { SessionID: sessionId, TeamID: teamId } });
    if (existing) throw new Error('Team is already registered for this auction');

    const auctionTeam = await AuctionTeam.create({
      SessionID: sessionId,
      TeamID: teamId,
      Budget: session.MaxBudget,
      RemainingBudget: session.MaxBudget,
      PlayersCount: 0
    });

    return { success: true, message: 'Team registered for auction successfully', data: auctionTeam };
  }

  /**
   * Add player to auction pool
   */
  async addPlayerToPool(sessionId, playerId, basePrice) {
    const session = await AuctionSession.findByPk(sessionId);
    if (!session) throw new Error('Auction session not found');

    const player = await PlayerMaster.findByPk(playerId);
    if (!player) throw new Error('Player not found');

    const existing = await AuctionPlayer.findOne({ where: { SessionID: sessionId, PlayerID: playerId } });
    if (existing) throw new Error('Player is already in the auction pool');

    const auctionPlayer = await AuctionPlayer.create({
      SessionID: sessionId,
      PlayerID: playerId,
      BasePrice: basePrice,
      Status: 'available'
    });

    return { success: true, message: 'Player added to auction pool successfully', data: auctionPlayer };
  }

  /**
   * Start auction session
   */
  async startAuction(sessionId) {
    const session = await AuctionSession.findByPk(sessionId);
    if (!session) throw new Error('Auction session not found');
    
    if (session.Status !== 'live') {
      session.Status = 'live';
      await session.save();
    }

    // Clear in-memory state for this session to force reload
    auctionStateService.clearSessionState(sessionId);

    return { success: true, message: 'Auction started successfully', data: session };
  }

  /**
   * Complete auction session
   */
  async completeAuction(sessionId) {
    const session = await AuctionSession.findByPk(sessionId);
    if (!session) throw new Error('Auction session not found');

    session.Status = 'completed';
    await session.save();

    // Clear in-memory state for this session
    auctionStateService.clearSessionState(sessionId);

    return { success: true, message: 'Auction completed successfully', data: session };
  }

  /**
   * Pause auction session (sets status back to upcoming)
   */
  async pauseAuction(sessionId) {
    const session = await AuctionSession.findByPk(sessionId);
    if (!session) throw new Error('Auction session not found');
    if (session.Status !== 'live') throw new Error('Auction is not live');

    session.Status = 'upcoming'; // Using 'upcoming' to effectively pause it
    await session.save();

    // Clear in-memory state for this session
    auctionStateService.clearSessionState(sessionId);

    return { success: true, message: 'Auction paused successfully', data: session };
  }

  /**
   * Validate bid (REST fallback)
   */
  async validateBid(sessionId, teamId, playerId, bidAmount) {
    const session = await AuctionSession.findByPk(sessionId);
    if (!session || session.Status !== 'live') throw new Error('Auction is not live');

    const auctionTeam = await AuctionTeam.findOne({ where: { SessionID: sessionId, TeamID: teamId } });
    if (!auctionTeam) throw new Error('Team is not registered for this auction');

    if (bidAmount > auctionTeam.RemainingBudget) {
      throw new Error(`Insufficient budget. Remaining: ₹${auctionTeam.RemainingBudget}`);
    }
    if (auctionTeam.PlayersCount >= session.MaxPlayersPerTeam) {
      throw new Error(`Maximum players limit (${session.MaxPlayersPerTeam}) reached`);
    }

    const auctionPlayer = await AuctionPlayer.findOne({ where: { SessionID: sessionId, PlayerID: playerId } });
    if (!auctionPlayer) throw new Error('Player not found in auction pool');
    if (auctionPlayer.Status === 'sold') throw new Error('Player has already been sold');
    if (bidAmount < auctionPlayer.BasePrice) throw new Error(`Bid must be at least base price: ₹${auctionPlayer.BasePrice}`);

    return { success: true, message: 'Bid is valid' };
  }

  /**
   * Sell player via REST (admin fallback — not the real-time path)
   */
  async sellPlayer(sessionId, playerId, teamId, finalBid) {
    await this.validateBid(sessionId, teamId, playerId, finalBid);

    await AuctionPlayer.update(
      { TeamID: teamId, SoldPrice: finalBid, Status: 'sold', CurrentBid: finalBid },
      { where: { SessionID: sessionId, PlayerID: playerId } }
    );

    const auctionTeam = await AuctionTeam.findOne({ where: { SessionID: sessionId, TeamID: teamId } });
    auctionTeam.RemainingBudget -= finalBid;
    auctionTeam.PlayersCount += 1;
    await auctionTeam.save();

    await TeamPlayer.create({ TeamID: teamId, PlayerID: playerId, JoinedDate: new Date(), Status: 'Active' });

    const player = await AuctionPlayer.findOne({
      where: { SessionID: sessionId, PlayerID: playerId },
      include: [{ model: PlayerMaster, attributes: ['PlayerID', 'Name', 'Role', 'PhotoURL'] }]
    });

    return { success: true, message: 'Player sold successfully', data: { player, team: auctionTeam, soldPrice: finalBid } };
  }

  /**
   * Mark player unsold via REST (admin fallback)
   */
  async markUnsold(sessionId, playerId) {
    await AuctionPlayer.update({ Status: 'unsold' }, { where: { SessionID: sessionId, PlayerID: playerId } });
    return { success: true, message: 'Player marked as unsold' };
  }

  /**
   * Re-queue all unsold/skipped players back to 'available'.
   * Also appends them to the end of the in-memory state queue.
   */
  async requeueUnsoldPlayers(sessionId) {
    const { Op } = require('sequelize');

    // Update DB: reset unsold/skipped back to available
    const [updatedCount] = await AuctionPlayer.update(
      { Status: 'available', CurrentBid: null, HighestBidTeamID: null },
      { where: { SessionID: sessionId, Status: { [Op.in]: ['unsold', 'skipped'] } } }
    );

    // Update in-memory state if loaded
    const state = auctionStateService.getSessionStateSync(sessionId);
    if (state) {
      // Reset in-memory player status and move them after the current index
      const requeued = [];
      state.players.forEach(p => {
        if (p.status === 'unsold' || p.status === 'skipped') {
          p.status = 'available';
          p.currentBid = p.basePrice;
          p.highestBidTeamId = null;
          requeued.push(p);
        }
      });

      // Move requeued players to the end of the queue (after current index)
      if (requeued.length > 0) {
        // Remove them from current positions
        const remaining = state.players.filter(p => !requeued.includes(p));
        // Append requeued players after the list
        state.players = [...remaining, ...requeued];
        // Fix current index if needed
        if (state.currentPlayerIndex >= state.players.length) {
          state.currentPlayerIndex = state.players.findIndex(p => p.status === 'available');
          if (state.currentPlayerIndex < 0) state.currentPlayerIndex = state.players.length;
        }
      }
    }

    return { success: true, message: `${updatedCount} player(s) re-queued for auction`, data: { requeuedCount: updatedCount } };
  }

  /**
   * Get full auction results — sold players, team standings, budget usage
   */
  async getAuctionResults(sessionId) {
    const session = await AuctionSession.findByPk(sessionId);
    if (!session) throw new Error('Auction session not found');

    const rawTeams = await AuctionTeam.findAll({
      where: { SessionID: sessionId },
      include: [{ model: TeamMaster, attributes: ['Name', 'LogoURL'] }]
    });

    const { Owner } = require('../models');
    const approvedOwners = await Owner.findAll({
        where: { VerificationStatus: 'approved', FeePaymentStatus: 'paid' },
        attributes: ['TeamID']
    });
    const approvedTeamIds = new Set(approvedOwners.map(o => o.TeamID).filter(id => id !== null));
    const teams = rawTeams.filter(t => approvedTeamIds.has(t.TeamID));

    const soldPlayers = await AuctionPlayer.findAll({
      where: { SessionID: sessionId, Status: 'sold' },
      include: [
        { model: PlayerMaster, attributes: ['PlayerID', 'Name', 'Role', 'PhotoURL'] },
        { model: TeamMaster, attributes: ['TeamID', 'Name', 'LogoURL'] }
      ]
    });

    const unsoldPlayers = await AuctionPlayer.findAll({
      where: { SessionID: sessionId, Status: { [Op.in]: ['unsold', 'skipped'] } },
      include: [{ model: PlayerMaster, attributes: ['PlayerID', 'Name', 'Role', 'PhotoURL'] }]
    });

    const bidHistory = await AuctionBid.findAll({
      where: { SessionID: sessionId },
      include: [
        { model: PlayerMaster, attributes: ['Name'] },
        { model: TeamMaster, attributes: ['Name', 'LogoURL'] }
      ],
      order: [['CreatedAt', 'DESC']],
      limit: 100
    });

    return {
      success: true,
      data: {
        session,
        summary: {
          totalPlayers: soldPlayers.length + unsoldPlayers.length,
          soldCount: soldPlayers.length,
          unsoldCount: unsoldPlayers.length,
          totalTeams: teams.length,
          totalMoneySpent: soldPlayers.reduce((sum, p) => sum + parseFloat(p.SoldPrice || 0), 0)
        },
        teams: teams.map(t => ({
          teamId: t.TeamID,
          teamName: t.TeamMaster?.Name,
          teamLogo: t.TeamMaster?.LogoURL,
          playersCount: t.PlayersCount,
          remainingBudget: parseFloat(t.RemainingBudget || 0),
          spentAmount: parseFloat(session.MaxBudget) - parseFloat(t.RemainingBudget || 0),
        })),
        soldPlayers: soldPlayers.map(p => ({
          playerId: p.PlayerID,
          playerName: p.PlayerMaster?.Name,
          playerRole: p.PlayerMaster?.Role,
          playerPhoto: p.PlayerMaster?.PhotoURL,
          battingStyle: p.PlayerMaster?.BattingStyle,
          teamId: p.TeamID,
          teamName: p.WinningTeam?.Name,
          soldPrice: parseFloat(p.SoldPrice || 0),
          basePrice: p.BasePrice,
        })),
        unsoldPlayers: unsoldPlayers.map(p => ({
          playerId: p.PlayerID,
          playerName: p.PlayerMaster?.Name,
          playerRole: p.PlayerMaster?.Role,
          basePrice: p.BasePrice,
          status: p.Status,
        })),
        recentBids: bidHistory.map(b => ({
          playerName: b.PlayerMaster?.Name,
          teamName: b.TeamMaster?.Name,
          teamLogo: b.TeamMaster?.LogoURL,
          bidAmount: b.BidAmount,
          time: b.CreatedAt,
        }))
      }
    };
  }

  /**
   * Get team's auction dashboard
   */
  async getTeamDashboard(sessionId, teamId) {
    const auctionTeam = await AuctionTeam.findOne({
      where: { SessionID: sessionId, TeamID: teamId },
      include: [{ model: TeamMaster, attributes: ['TeamID', 'Name', 'LogoURL'] }]
    });

    if (!auctionTeam) throw new Error('Team not registered for this auction');

    const boughtPlayers = await AuctionPlayer.findAll({
      where: { SessionID: sessionId, TeamID: teamId, Status: 'sold' },
      include: [{ model: PlayerMaster, attributes: ['PlayerID', 'Name', 'Role', 'PhotoURL', 'BattingStyle', 'BowlingStyle'] }]
    });

    const session = await AuctionSession.findByPk(sessionId);

    return {
      success: true,
      data: {
        team: { ...auctionTeam.TeamMaster?.dataValues, teamId: auctionTeam.TeamID },
        remainingBudget: parseFloat(auctionTeam.RemainingBudget || 0),
        playersCount: auctionTeam.PlayersCount,
        maxPlayers: session?.MaxPlayersPerTeam,
        spentAmount: parseFloat(session?.MaxBudget || 0) - parseFloat(auctionTeam.RemainingBudget || 0),
        boughtPlayers: boughtPlayers.map(p => ({
          playerId: p.PlayerID,
          playerName: p.PlayerMaster?.Name,
          playerRole: p.PlayerMaster?.Role,
          playerPhoto: p.PlayerMaster?.PhotoURL,
          battingStyle: p.PlayerMaster?.BattingStyle,
          bowlingStyle: p.PlayerMaster?.BowlingStyle,
          soldPrice: parseFloat(p.SoldPrice || 0),
          basePrice: p.BasePrice,
        }))
      }
    };
  }

  /**
   * Get all teams registered for a session
   */
  async getSessionTeams(sessionId) {
    const rawTeams = await AuctionTeam.findAll({
      where: { SessionID: sessionId },
      include: [{ model: TeamMaster, attributes: ['TeamID', 'Name', 'LogoURL'] }]
    });

    const { Owner } = require('../models');
    const approvedOwners = await Owner.findAll({
        where: { VerificationStatus: 'approved', FeePaymentStatus: 'paid' },
        attributes: ['TeamID']
    });
    const approvedTeamIds = new Set(approvedOwners.map(o => o.TeamID).filter(id => id !== null));
    const teams = rawTeams.filter(t => approvedTeamIds.has(t.TeamID));

    return {
      success: true, data: {
        teams: teams.map(t => ({
          auctionTeamId: t.AuctionTeamID,
          teamId: t.TeamID,
          name: t.TeamMaster?.Name,
          logoUrl: t.TeamMaster?.LogoURL,
          budget: t.Budget,
          remainingBudget: parseFloat(t.RemainingBudget || 0),
          playersCount: t.PlayersCount
        }))
      }
    };
  }

  /**
   * Get all players in the auction pool for a session
   */
  async getSessionPlayers(sessionId) {
    const players = await AuctionPlayer.findAll({
      where: { 
        SessionID: sessionId,
        ApprovalStatus: 'approved',
        PaymentStatus: 'paid'
      },
      include: [{ model: PlayerMaster, attributes: ['PlayerID', 'Name', 'Role', 'PhotoURL', 'BattingStyle', 'BowlingStyle'] }],
      order: [['Status', 'ASC'], ['BasePrice', 'DESC']]
    });
    return { success: true, data: { players } };
  }

  /**
   * Get live/upcoming sessions for owner entry
   */
  async getLiveSessions() {
    const { Op } = require('sequelize');
    const sessions = await AuctionSession.findAll({
      where: { Status: { [Op.in]: ['upcoming', 'live'] } },
      order: [['CreatedAt', 'DESC']]
    });
    return { success: true, data: { sessions } };
  }

  /**
   * Remove a team from a session (only if session is not live)
   */
  async removeTeam(sessionId, teamId) {
    const session = await AuctionSession.findByPk(sessionId);
    if (session && session.Status === 'live') throw new Error('Cannot remove team during live auction');
    const deleted = await AuctionTeam.destroy({ where: { SessionID: sessionId, TeamID: teamId } });
    if (!deleted) throw new Error('Team not found in this session');
    return { success: true, message: 'Team removed from session' };
  }

  /**
   * Remove a player from the auction pool (only if not yet sold)
   */
  async removePlayerFromPool(sessionId, playerId) {
    const player = await AuctionPlayer.findOne({ where: { SessionID: sessionId, PlayerID: playerId } });
    if (!player) throw new Error('Player not in auction pool');
    if (player.Status === 'sold') throw new Error('Cannot remove a sold player');
    await player.destroy();
    return { success: true, message: 'Player removed from auction pool' };
  }

  /**
   * Get registered teams for a session — PUBLIC endpoint (for website display)
   */
  async getSessionRegisteredTeams(sessionId) {
    const teams = await AuctionTeam.findAll({
      where: { SessionID: sessionId },
      include: [{ model: TeamMaster, attributes: ['TeamID', 'Name', 'LogoURL', 'Location'] }]
    });
    return {
      success: true,
      data: {
        teams: teams.map(t => ({
          teamId: t.TeamID,
          name: t.TeamMaster?.Name,
          logoUrl: t.TeamMaster?.LogoURL,
          location: t.TeamMaster?.Location,
          remainingBudget: parseFloat(t.RemainingBudget || 0),
          playersCount: t.PlayersCount
        }))
      }
    };
  }
}

module.exports = new AuctionService();
