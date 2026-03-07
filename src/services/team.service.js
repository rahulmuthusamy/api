const { TeamMaster, PlayerMaster, TeamPlayer } = require('../models');
const { Op } = require('sequelize');

class TeamService {
    /**
     * Add a player to a team
     */
    async addPlayerToTeam(teamId, playerId) {
        try {
            // Validate team exists
            const team = await TeamMaster.findByPk(teamId);
            if (!team) {
                throw new Error('Team not found');
            }

            // Validate player exists
            const player = await PlayerMaster.findByPk(playerId);
            if (!player) {
                throw new Error('Player not found');
            }

            // Check if player is already in the team
            const existing = await TeamPlayer.findOne({
                where: {
                    TeamID: teamId,
                    PlayerID: playerId,
                    Status: 'Active'
                }
            });

            if (existing) {
                throw new Error('Player is already in this team');
            }

            // Add player to team
            const teamPlayer = await TeamPlayer.create({
                TeamID: teamId,
                PlayerID: playerId,
                JoinedDate: new Date(),
                Status: 'Active'
            });

            return {
                success: true,
                message: 'Player added to team successfully',
                data: teamPlayer
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Remove a player from a team (soft delete)
     */
    async removePlayerFromTeam(teamId, playerId) {
        try {
            const teamPlayer = await TeamPlayer.findOne({
                where: {
                    TeamID: teamId,
                    PlayerID: playerId,
                    Status: 'Active'
                }
            });

            if (!teamPlayer) {
                throw new Error('Player not found in this team');
            }

            // Soft delete - set status to Inactive
            teamPlayer.Status = 'Inactive';
            await teamPlayer.save();

            return {
                success: true,
                message: 'Player removed from team successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all players in a team
     */
    async getTeamPlayers(teamId) {
        try {
            const team = await TeamMaster.findByPk(teamId, {
                include: [{
                    model: PlayerMaster,
                    as: 'Players',
                    through: {
                        where: { Status: 'Active' },
                        attributes: ['JoinedDate', 'Status']
                    },
                    attributes: [
                        'PlayerID', 'Name', 'Role', 'BattingStyle',
                        'BowlingStyle', 'PhotoURL', 'CanKeep', 'CanCaptain'
                    ]
                }]
            });

            if (!team) {
                throw new Error('Team not found');
            }

            return {
                success: true,
                data: {
                    teamId: team.TeamID,
                    teamName: team.Name,
                    teamLogo: team.LogoURL,
                    players: team.Players || [],
                    playerCount: team.Players ? team.Players.length : 0
                }
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get team details with all relationships
     */
    async getTeamDetails(teamId) {
        try {
            const team = await TeamMaster.findByPk(teamId, {
                include: [
                    {
                        model: PlayerMaster,
                        as: 'Players',
                        through: {
                            where: { Status: 'Active' },
                            attributes: ['JoinedDate']
                        }
                    }
                ]
            });

            if (!team) {
                throw new Error('Team not found');
            }

            return {
                success: true,
                data: team
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get available players (not in any team or inactive in all teams)
     */
    async getAvailablePlayers() {
        try {
            const players = await PlayerMaster.findAll({
                // where: { Status: 'Active' }
            });

            return {
                success: true,
                data: players
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new TeamService();
