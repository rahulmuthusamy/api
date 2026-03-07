const { AuctionSession, AuctionPlayer, AuctionTeam, PlayerMaster, TeamMaster, TeamPlayer } = require('../models');
const { Op } = require('sequelize');

class AuctionService {
  /**
   * Create auction session
   */
  async createSession(sessionData) {
    try {
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

      return {
        success: true,
        message: 'Auction session created successfully',
        data: session
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Register team for auction
   */
  async registerTeam(sessionId, teamId) {
    try {
      const session = await AuctionSession.findByPk(sessionId);
      if (!session) {
        throw new Error('Auction session not found');
      }

      const team = await TeamMaster.findByPk(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Check if already registered
      const existing = await AuctionTeam.findOne({
        where: { SessionID: sessionId, TeamID: teamId }
      });

      if (existing) {
        throw new Error('Team is already registered for this auction');
      }

      // Register team
      const auctionTeam = await AuctionTeam.create({
        SessionID: sessionId,
        TeamID: teamId,
        RemainingBudget: session.MaxBudget,
        PlayersCount: 0
      });

      return {
        success: true,
        message: 'Team registered for auction successfully',
        data: auctionTeam
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add player to auction pool
   */
  async addPlayerToPool(sessionId, playerId, basePrice) {
    try {
      const session = await AuctionSession.findByPk(sessionId);
      if (!session) {
        throw new Error('Auction session not found');
      }

      const player = await PlayerMaster.findByPk(playerId);
      if (!player) {
        throw new Error('Player not found');
      }

      // Check if already in pool
      const existing = await AuctionPlayer.findOne({
        where: { SessionID: sessionId, PlayerID: playerId }
      });

      if (existing) {
        throw new Error('Player is already in the auction pool');
      }

      // Add to pool
      const auctionPlayer = await AuctionPlayer.create({
        SessionID: sessionId,
        PlayerID: playerId,
        BasePrice: basePrice,
        Status: 'unsold'
      });

      return {
        success: true,
        message: 'Player added to auction pool successfully',
        data: auctionPlayer
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Start auction
   */
  async startAuction(sessionId) {
    try {
      const session = await AuctionSession.findByPk(sessionId);
      if (!session) {
        throw new Error('Auction session not found');
      }

      if (session.Status === 'live') {
        throw new Error('Auction is already live');
      }

      session.Status = 'live';
      await session.save();

      return {
        success: true,
        message: 'Auction started successfully',
        data: session
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate bid
   */
  async validateBid(sessionId, teamId, playerId, bidAmount) {
    try {
      // Check session is live
      const session = await AuctionSession.findByPk(sessionId);
      if (!session || session.Status !== 'live') {
        throw new Error('Auction is not live');
      }

      // Check team is registered
      const auctionTeam = await AuctionTeam.findOne({
        where: { SessionID: sessionId, TeamID: teamId }
      });

      if (!auctionTeam) {
        throw new Error('Team is not registered for this auction');
      }

      // Check budget
      if (bidAmount > auctionTeam.RemainingBudget) {
        throw new Error(`Insufficient budget. Remaining: ${auctionTeam.RemainingBudget}`);
      }

      // Check player limit
      if (auctionTeam.PlayersCount >= session.MaxPlayersPerTeam) {
        throw new Error(`Maximum players limit (${session.MaxPlayersPerTeam}) reached`);
      }

      // Check player exists and is unsold
      const auctionPlayer = await AuctionPlayer.findOne({
        where: { SessionID: sessionId, PlayerID: playerId }
      });

      if (!auctionPlayer) {
        throw new Error('Player not found in auction pool');
      }

      if (auctionPlayer.Status === 'sold') {
        throw new Error('Player has already been sold');
      }

      // Check bid is at least base price
      if (bidAmount < auctionPlayer.BasePrice) {
        throw new Error(`Bid must be at least base price: ${auctionPlayer.BasePrice}`);
      }

      return {
        success: true,
        message: 'Bid is valid'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sell player to team
   */
  async sellPlayer(sessionId, playerId, teamId, finalBid) {
    try {
      // Validate one more time
      await this.validateBid(sessionId, teamId, playerId, finalBid);

      // Update AuctionPlayer
      await AuctionPlayer.update(
        {
          TeamID: teamId,
          SoldPrice: finalBid,
          Status: 'sold'
        },
        {
          where: { SessionID: sessionId, PlayerID: playerId }
        }
      );

      // Update AuctionTeam
      const auctionTeam = await AuctionTeam.findOne({
        where: { SessionID: sessionId, TeamID: teamId }
      });

      auctionTeam.RemainingBudget -= finalBid;
      auctionTeam.PlayersCount += 1;
      await auctionTeam.save();

      // IMPORTANT: Add to TeamPlayers table
      await TeamPlayer.create({
        TeamID: teamId,
        PlayerID: playerId,
        JoinedDate: new Date(),
        Status: 'Active'
      });

      // Get updated data
      const player = await AuctionPlayer.findOne({
        where: { SessionID: sessionId, PlayerID: playerId },
        include: [{ model: PlayerMaster, attributes: ['PlayerID', 'Name', 'Role', 'PhotoURL'] }]
      });

      return {
        success: true,
        message: 'Player sold successfully',
        data: {
          player,
          team: auctionTeam,
          soldPrice: finalBid
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark player as unsold
   */
  async markUnsold(sessionId, playerId) {
    try {
      await AuctionPlayer.update(
        { Status: 'unsold' },
        { where: { SessionID: sessionId, PlayerID: playerId } }
      );

      return {
        success: true,
        message: 'Player marked as unsold'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Complete auction
   */
  async completeAuction(sessionId) {
    try {
      const session = await AuctionSession.findByPk(sessionId);
      if (!session) {
        throw new Error('Auction session not found');
      }

      session.Status = 'completed';
      await session.save();

      return {
        success: true,
        message: 'Auction completed successfully',
        data: session
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get auction results
   */
  async getAuctionResults(sessionId) {
    try {
      const session = await AuctionSession.findByPk(sessionId);
      if (!session) {
        throw new Error('Auction session not found');
      }

      // Get all teams with their budgets and player counts
      const teams = await AuctionTeam.findAll({
        where: { SessionID: sessionId },
        include: [{ model: TeamMaster, attributes: ['TeamID', 'Name', 'LogoURL'] }]
      });

      // Get sold players
      const soldPlayers = await AuctionPlayer.findAll({
        where: { SessionID: sessionId, Status: 'sold' },
        include: [
          { model: PlayerMaster, attributes: ['PlayerID', 'Name', 'Role', 'PhotoURL'] },
          { model: TeamMaster, attributes: ['TeamID', 'Name', 'LogoURL'] }
        ]
      });

      // Get unsold players
      const unsoldPlayers = await AuctionPlayer.findAll({
        where: { SessionID: sessionId, Status: 'unsold' },
        include: [{ model: PlayerMaster, attributes: ['PlayerID', 'Name', 'Role', 'PhotoURL'] }]
      });

      return {
        success: true,
        data: {
          session,
          teams: teams.map(t => ({
            teamId: t.TeamID,
            teamName: t.TeamMaster?.Name,
            teamLogo: t.TeamMaster?.LogoURL,
            playersCount: t.PlayersCount,
            spentAmount: session.MaxBudget - t.RemainingBudget,
            remainingBudget: t.RemainingBudget
          })),
          soldPlayers: soldPlayers.map(p => ({
            playerId: p.PlayerID,
            playerName: p.PlayerMaster?.Name,
            playerRole: p.PlayerMaster?.Role,
            playerPhoto: p.PlayerMaster?.PhotoURL,
            teamId: p.TeamID,
            teamName: p.TeamMaster?.Name,
            soldPrice: p.SoldPrice,
            basePrice: p.BasePrice
          })),
          unsoldPlayers: unsoldPlayers.map(p => ({
            playerId: p.PlayerID,
            playerName: p.PlayerMaster?.Name,
            playerRole: p.PlayerMaster?.Role,
            basePrice: p.BasePrice
          })),
          summary: {
            totalPlayers: soldPlayers.length + unsoldPlayers.length,
            soldCount: soldPlayers.length,
            unsoldCount: unsoldPlayers.length,
            totalTeams: teams.length
          }
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get team's auction dashboard
   */
  async getTeamDashboard(sessionId, teamId) {
    try {
      const auctionTeam = await AuctionTeam.findOne({
        where: { SessionID: sessionId, TeamID: teamId },
        include: [{ model: TeamMaster, attributes: ['TeamID', 'Name', 'LogoURL'] }]
      });

      if (!auctionTeam) {
        throw new Error('Team not registered for this auction');
      }

      // Get team's bought players
      const boughtPlayers = await AuctionPlayer.findAll({
        where: { SessionID: sessionId, TeamID: teamId, Status: 'sold' },
        include: [{ model: PlayerMaster, attributes: ['PlayerID', 'Name', 'Role', 'PhotoURL'] }]
      });

      const session = await AuctionSession.findByPk(sessionId);

      return {
        success: true,
        data: {
          team: auctionTeam.TeamMaster,
          remainingBudget: auctionTeam.RemainingBudget,
          playersCount: auctionTeam.PlayersCount,
          maxPlayers: session.MaxPlayersPerTeam,
          spentAmount: session.MaxBudget - auctionTeam.RemainingBudget,
          boughtPlayers: boughtPlayers.map(p => ({
            playerId: p.PlayerID,
            playerName: p.PlayerMaster?.Name,
            playerRole: p.PlayerMaster?.Role,
            playerPhoto: p.PlayerMaster?.PhotoURL,
            soldPrice: p.SoldPrice,
            basePrice: p.BasePrice
          }))
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuctionService();
