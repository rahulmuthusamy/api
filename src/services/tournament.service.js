const BaseService = require('./base.service');
const { Tournament, TournamentTeam, TournamentStandings, Match, TeamMaster, AuctionSession, MatchSquad, PlayerMatchStats, BallByBall, Innings } = require('../models');
const { Op } = require('sequelize');

class TournamentService extends BaseService {
    constructor() {
        super(Tournament);
    }

    async getAllTournaments() {
        return this.getAll({
            order: [['CreatedAt', 'DESC']]
        });
    }

    async getTournamentById(id) {
        return this.getById(id, {
            include: [{
                model: TeamMaster,
                as: 'Teams',
                through: { attributes: [] }
            }]
        });
    }

    async createTournament(data) {
        const transaction = await this.model.sequelize.transaction();
        try {
            // Create the tournament
            const tournament = await this.model.create(data, { transaction });

            // Handle Teams if provided
            if (data.teams && Array.isArray(data.teams) && data.teams.length > 0) {
                for (const teamId of data.teams) {
                    // Register Team
                    await TournamentTeam.create({
                        TournamentID: tournament.TournamentID,
                        TeamID: teamId
                    }, { transaction });

                    // Initialize Standings
                    await TournamentStandings.create({
                        TournamentID: tournament.TournamentID,
                        TeamID: teamId,
                        Points: 0,
                        Played: 0,
                        Won: 0,
                        Lost: 0,
                        Tied: 0,
                        NR: 0,
                        NRR: 0
                    }, { transaction });
                }

                // Update Count
                tournament.CurrentTeamsCount = data.teams.length;
                await tournament.save({ transaction });
            }

            await transaction.commit();
            return tournament;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async updateTournament(id, data) {
        const transaction = await this.model.sequelize.transaction();
        try {
            const tournament = await this.model.findByPk(id, { transaction });
            if (!tournament) throw new Error('Tournament not found');

            await tournament.update(data, { transaction });

            // Sync Teams if provided
            if (data.teams && Array.isArray(data.teams)) {
                // Get existing teams
                const currentAssociations = await TournamentTeam.findAll({
                    where: { TournamentID: id },
                    transaction
                });
                const currentTeamIds = currentAssociations.map(a => a.TeamID);
                const newTeamIds = data.teams.map(Number); // Ensure numbers

                // Determine diff
                const toAdd = newTeamIds.filter(tid => !currentTeamIds.includes(tid));
                const toRemove = currentTeamIds.filter(tid => !newTeamIds.includes(tid));

                // Add New Teams
                for (const tid of toAdd) {
                    await TournamentTeam.create({
                        TournamentID: id,
                        TeamID: tid
                    }, { transaction });

                    // Add Standings if missing
                    const existingStanding = await TournamentStandings.findOne({
                        where: { TournamentID: id, TeamID: tid },
                        transaction
                    });

                    if (!existingStanding) {
                        await TournamentStandings.create({
                            TournamentID: id,
                            TeamID: tid,
                            Points: 0, Played: 0, Won: 0, Lost: 0, Tied: 0, NR: 0, NRR: 0
                        }, { transaction });
                    }
                }

                // Remove Deselected Teams
                if (toRemove.length > 0) {
                    await TournamentTeam.destroy({
                        where: {
                            TournamentID: id,
                            TeamID: { [Op.in]: toRemove }
                        },
                        transaction
                    });

                    await TournamentStandings.destroy({
                        where: {
                            TournamentID: id,
                            TeamID: { [Op.in]: toRemove }
                        },
                        transaction
                    });
                }

                // Update Count
                const count = await TournamentTeam.count({ where: { TournamentID: id }, transaction });
                tournament.CurrentTeamsCount = count;
                await tournament.save({ transaction });
            }

            await transaction.commit();
            return this.getTournamentById(id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async deleteTournament(id) {
        const transaction = await this.model.sequelize.transaction();
        try {
            // Find dependent matches
            const matches = await Match.findAll({ where: { TournamentID: id }, transaction, attributes: ['MatchID'] });
            const matchIds = matches.map(m => m.MatchID);

            // Deep clean match dependencies if any exist
            if (matchIds.length > 0) {
                if (typeof MatchSquad !== 'undefined') await MatchSquad.destroy({ where: { MatchID: { [Op.in]: matchIds } }, transaction });
                if (typeof PlayerMatchStats !== 'undefined') await PlayerMatchStats.destroy({ where: { MatchID: { [Op.in]: matchIds } }, transaction });
                if (typeof BallByBall !== 'undefined') await BallByBall.destroy({ where: { MatchID: { [Op.in]: matchIds } }, transaction });
                if (typeof Innings !== 'undefined') await Innings.destroy({ where: { MatchID: { [Op.in]: matchIds } }, transaction });
            }

            // Clean direct dependencies
            if (typeof TournamentTeam !== 'undefined') await TournamentTeam.destroy({ where: { TournamentID: id }, transaction });
            if (typeof TournamentStandings !== 'undefined') await TournamentStandings.destroy({ where: { TournamentID: id }, transaction });
            if (typeof AuctionSession !== 'undefined') await AuctionSession.destroy({ where: { TournamentID: id }, transaction });
            
            // Wipe matches
            await Match.destroy({ where: { TournamentID: id }, transaction });

            // Finally, delete the tournament
            const deletedCount = await Tournament.destroy({ where: { TournamentID: id }, transaction });
            await transaction.commit();
            return deletedCount;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async withdrawTeam(tournamentId, teamId) {
        const transaction = await this.model.sequelize.transaction();
        try {
            await TournamentTeam.destroy({
                where: { TournamentID: tournamentId, TeamID: teamId },
                transaction
            });

            await TournamentStandings.destroy({
                where: { TournamentID: tournamentId, TeamID: teamId },
                transaction
            });

            const tournament = await this.model.findByPk(tournamentId, { transaction });
            if (tournament) {
                tournament.CurrentTeamsCount = Math.max(0, tournament.CurrentTeamsCount - 1);
                await tournament.save({ transaction });
            }

            await transaction.commit();
            return tournament;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Register a team for a tournament (Single Team)
     */
    async registerTeam(tournamentId, teamId) {
        try {
            const tournament = await Tournament.findByPk(tournamentId);
            if (!tournament) throw new Error('Tournament not found');

            // Logic checks
            if (!tournament.IsRegistrationOpen) throw new Error('Registration is closed for this tournament');
            if (tournament.CurrentTeamsCount >= tournament.MaxTeams) throw new Error('Maximum teams limit reached');

            // Validations
            const team = await TeamMaster.findByPk(teamId);
            if (!team) throw new Error('Team not found');

            const existing = await TournamentTeam.findOne({
                where: { TournamentID: tournamentId, TeamID: teamId }
            });
            if (existing) throw new Error('Team is already registered for this tournament');

            // Create Association
            await TournamentTeam.create({ TournamentID: tournamentId, TeamID: teamId });

            // Create Standings
            await TournamentStandings.create({
                TournamentID: tournamentId,
                TeamID: teamId,
                Points: 0, Played: 0, Won: 0, Lost: 0, Tied: 0, NR: 0, NRR: 0.00
            });

            // Update Counts
            tournament.CurrentTeamsCount += 1;
            await tournament.save();

            return { success: true, message: 'Team registered successfully for tournament' };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get tournament standings
     */
    async getStandings(tournamentId) {
        try {
            const standings = await TournamentStandings.findAll({
                where: { TournamentID: tournamentId },
                include: [{
                    model: TeamMaster,
                    attributes: ['TeamID', 'Name', 'LogoURL']
                }],
                order: [
                    ['Points', 'DESC'],
                    ['NRR', 'DESC'],
                    ['Won', 'DESC']
                ]
            });
            return { success: true, data: standings };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update tournament standings after match completion
     */
    async updateStandings(matchId) {
        try {
            const match = await Match.findByPk(matchId, {
                include: [{ model: Tournament, as: 'Tournament' }]
            });

            if (!match || !match.TournamentID || match.Status !== 'Completed') {
                return;
            }

            const tournament = match.Tournament;

            // Update for both teams
            for (const teamId of [match.TeamA_ID, match.TeamB_ID]) {
                let standing = await TournamentStandings.findOne({
                    where: { TournamentID: match.TournamentID, TeamID: teamId }
                });

                if (!standing) {
                    standing = await TournamentStandings.create({
                        TournamentID: match.TournamentID,
                        TeamID: teamId,
                        Points: 0, Played: 0, Won: 0, Lost: 0, Tied: 0, NR: 0, NRR: 0.00
                    });
                }

                standing.Played += 1;

                // Update result
                if (match.WinnerID === teamId) {
                    standing.Won += 1;
                    standing.Points += tournament.PointsForWin;
                } else if (match.WinnerID === null) {
                    standing.Tied += 1;
                    standing.Points += tournament.PointsForTie;
                } else {
                    standing.Lost += 1;
                }

                // Calculate NRR (simplified for this team in this match)
                let runsScored, oversFaced, runsConceded, oversBowled;
                if (teamId === match.TeamA_ID) {
                    runsScored = match.TeamA_Runs || 0;
                    oversFaced = match.TeamA_Overs || 0.1;
                    runsConceded = match.TeamB_Runs || 0;
                    oversBowled = match.TeamB_Overs || 0.1;
                } else {
                    runsScored = match.TeamB_Runs || 0;
                    oversFaced = match.TeamB_Overs || 0.1;
                    runsConceded = match.TeamA_Runs || 0;
                    oversBowled = match.TeamA_Overs || 0.1;
                }

                // Match NRR
                const matchNRR = (runsScored / oversFaced) - (runsConceded / oversBowled);

                // Cumulative NRR Average
                const totalMatches = standing.Played;
                const currentTotalNRR = standing.NRR * (totalMatches - 1);
                standing.NRR = (currentTotalNRR + matchNRR) / totalMatches;

                await standing.save();
            }

            return { success: true, message: 'Standings updated successfully' };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get registered teams for a tournament
     */
    async getRegisteredTeams(tournamentId) {
        try {
            const tournament = await Tournament.findByPk(tournamentId, {
                include: [{
                    model: TeamMaster,
                    as: 'Teams',
                    through: { attributes: [] }
                }]
            });

            if (!tournament) throw new Error('Tournament not found');

            return {
                success: true,
                data: {
                    tournamentId: tournament.TournamentID,
                    tournamentName: tournament.Name,
                    teams: tournament.Teams || [],
                    teamCount: tournament.Teams ? tournament.Teams.length : 0,
                    maxTeams: tournament.MaxTeams
                }
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get tournament matches/fixtures
     */
    async getTournamentMatches(tournamentId) {
        try {
            const matches = await Match.findAll({
                where: { TournamentID: tournamentId },
                include: [
                    { model: TeamMaster, as: 'TeamA', attributes: ['TeamID', 'Name', 'LogoURL'] },
                    { model: TeamMaster, as: 'TeamB', attributes: ['TeamID', 'Name', 'LogoURL'] }
                ],
                order: [['MatchDate', 'ASC'], ['MatchNumber', 'ASC']]
            });
            return { success: true, data: matches };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generate fixtures for a tournament (basic round-robin)
     */
    async generateFixtures(tournamentId) {
        try {
            const tournament = await Tournament.findByPk(tournamentId, {
                include: [{
                    model: TeamMaster,
                    as: 'Teams',
                    through: { attributes: [] }
                }]
            });

            if (!tournament) throw new Error('Tournament not found');

            const teams = tournament.Teams;
            if (!teams || teams.length < 2) throw new Error('At least 2 teams are required to generate fixtures');

            const matches = [];
            let matchNumber = 1;

            if (tournament.Type === 'League') {
                for (let i = 0; i < teams.length; i++) {
                    for (let j = i + 1; j < teams.length; j++) {
                        matches.push({
                            TournamentID: tournamentId,
                            MatchNumber: matchNumber++,
                            TeamA_ID: teams[i].TeamID,
                            TeamB_ID: teams[j].TeamID,
                            MatchType: 'League',
                            MatchFormat: tournament.MatchFormat,
                            OversPerSide: tournament.OversPerMatch,
                            BallsPerOver: tournament.BallsPerOver,
                            PowerplayOvers: tournament.PowerplayOvers,
                            Status: 'Scheduled'
                        });
                    }
                }
            } else if (tournament.Type === 'Knockout') {
                for (let i = 0; i < teams.length; i += 2) {
                    if (i + 1 < teams.length) {
                        matches.push({
                            TournamentID: tournamentId,
                            MatchNumber: matchNumber++,
                            TeamA_ID: teams[i].TeamID,
                            TeamB_ID: teams[i + 1].TeamID,
                            MatchType: 'Round16',
                            MatchFormat: tournament.MatchFormat,
                            OversPerSide: tournament.OversPerMatch,
                            Status: 'Scheduled'
                        });
                    }
                }
            }

            await Match.bulkCreate(matches);

            return {
                success: true,
                message: `${matches.length} fixtures generated successfully`,
                data: matches
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new TournamentService();
