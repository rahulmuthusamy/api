const { Tournament, TeamMaster, Match } = require('../models');
const BaseService = require('./base.service');

const service = new BaseService(Tournament);

exports.getAllTournaments = async () => {
    return await service.getAll({
        include: [
            { model: TeamMaster, as: 'Teams' }
        ]
    });
};

exports.getTournamentById = async (id) => {
    return await service.getById(id, {
        include: [
            { model: TeamMaster, as: 'Teams' },
            {
                model: Match,
                as: 'Matches',
                include: [
                    { model: TeamMaster, as: 'TeamA' },
                    { model: TeamMaster, as: 'TeamB' }
                ]
            }
        ]
    });
};

exports.createTournament = async (data) => {
    const { teams, ...tournamentData } = data;
    const tournament = await service.create(tournamentData);
    if (teams && teams.length > 0) {
        await tournament.addTeams(teams);
    }
    return tournament;
};

exports.updateTournament = async (id, data) => {
    const { teams, ...tournamentData } = data;

    // We can use service.update(id, tournamentData) but it returns the record.
    // However, the original code looked up the record first to check existence.
    // BaseService.update also does findByPk.

    const tournament = await service.update(id, tournamentData);
    if (!tournament) return null;

    if (teams) {
        await tournament.setTeams(teams);
    }
    return tournament;
};

exports.deleteTournament = async (id) => {
    return await service.delete(id);
};

exports.getPointsTable = async (tournamentId) => {
    // Basic implementation - in a real app, this would calculate stats from completed matches
    // For now, return the teams and we'll handle the logic if needed or return empty stats
    const tournament = await Tournament.findByPk(tournamentId, {
        include: [{ model: TeamMaster, as: 'Teams' }]
    });

    if (!tournament) return [];

    // Placeholder logic for points table
    return tournament.Teams.map(team => ({
        teamId: team.TeamID,
        teamName: team.Name,
        matchesPlayed: 0,
        won: 0,
        lost: 0,
        draw: 0,
        noResult: 0,
        points: 0,
        netRunRate: 0.00
    }));
};

/**
 * Enroll a team in a tournament
 */
exports.enrollTeam = async (tournamentId, teamId) => {
    const tournament = await Tournament.findByPk(tournamentId, {
        include: [{ model: TeamMaster, as: 'Teams' }]
    });

    if (!tournament) {
        throw new Error('Tournament not found');
    }

    if (!tournament.IsRegistrationOpen) {
        throw new Error('Registration is closed for this tournament');
    }

    if (tournament.CurrentTeamsCount >= tournament.MaxTeams) {
        throw new Error('Tournament has reached maximum team capacity');
    }

    // Check if team is already enrolled
    const isEnrolled = tournament.Teams.some(t => t.TeamID === teamId);
    if (isEnrolled) {
        throw new Error('Team is already enrolled in this tournament');
    }

    await tournament.addTeam(teamId);
    await tournament.update({ CurrentTeamsCount: tournament.CurrentTeamsCount + 1 });

    return tournament;
};

/**
 * Withdraw a team from a tournament
 */
exports.withdrawTeam = async (tournamentId, teamId) => {
    const tournament = await Tournament.findByPk(tournamentId);
    if (!tournament) {
        throw new Error('Tournament not found');
    }

    await tournament.removeTeam(teamId);
    await tournament.update({ CurrentTeamsCount: Math.max(0, tournament.CurrentTeamsCount - 1) });

    return tournament;
};

/**
 * Generate fixtures for a tournament
 */
exports.generateFixtures = async (tournamentId) => {
    const fixtureService = require('./fixture.service');
    return await fixtureService.generateFixtures(tournamentId);
};

/**
 * Calculate and update tournament standings
 */
exports.calculateStandings = async (tournamentId) => {
    const { TournamentStandings } = require('../models');
    const scoringService = require('./scoring.service');

    const tournament = await Tournament.findByPk(tournamentId, {
        include: [{ model: TeamMaster, as: 'Teams' }]
    });

    if (!tournament) {
        throw new Error('Tournament not found');
    }

    // Get all completed matches
    const matches = await Match.findAll({
        where: {
            TournamentID: tournamentId,
            Status: 'Completed'
        }
    });

    // Initialize or update standings for each team
    for (const team of tournament.Teams) {
        let standing = await TournamentStandings.findOne({
            where: { TournamentID: tournamentId, TeamID: team.TeamID }
        });

        if (!standing) {
            standing = await TournamentStandings.create({
                TournamentID: tournamentId,
                TeamID: team.TeamID
            });
        }

        // Calculate stats from matches
        const teamMatches = matches.filter(m =>
            m.TeamA_ID === team.TeamID || m.TeamB_ID === team.TeamID
        );

        let won = 0, lost = 0, tied = 0, noResult = 0;
        let runsScored = 0, runsConceded = 0;
        let oversPlayed = 0, oversBowled = 0;
        const formArray = [];

        for (const match of teamMatches) {
            const isTeamA = match.TeamA_ID === team.TeamID;
            const teamRuns = isTeamA ? match.TeamA_Runs : match.TeamB_Runs;
            const teamOvers = isTeamA ? match.TeamA_Overs : match.TeamB_Overs;
            const oppRuns = isTeamA ? match.TeamB_Runs : match.TeamA_Runs;
            const oppOvers = isTeamA ? match.TeamB_Overs : match.TeamA_Overs;

            runsScored += teamRuns;
            runsConceded += oppRuns;
            oversPlayed += teamOvers;
            oversBowled += oppOvers;

            if (match.WinnerID === team.TeamID) {
                won++;
                formArray.push('W');
            } else if (match.WinnerID === null) {
                tied++;
                formArray.push('T');
            } else {
                lost++;
                formArray.push('L');
            }
        }

        // Calculate points
        const points = (won * tournament.PointsForWin) +
            (tied * tournament.PointsForTie) +
            (noResult * tournament.PointsForNoResult);

        // Calculate NRR
        const nrr = scoringService.calculateNetRunRate(
            runsScored,
            oversPlayed || 1,
            runsConceded,
            oversBowled || 1
        );

        // Update standing
        await standing.update({
            MatchesPlayed: teamMatches.length,
            Won: won,
            Lost: lost,
            Tied: tied,
            NoResult: noResult,
            Points: points,
            RunsScored: runsScored,
            RunsConceded: runsConceded,
            OversPlayed: oversPlayed,
            OversBowled: oversBowled,
            NetRunRate: parseFloat(nrr),
            Form: formArray.slice(-5).join('') // Last 5 matches
        });
    }

    // Update positions based on points and NRR
    const standings = await TournamentStandings.findAll({
        where: { TournamentID: tournamentId },
        order: [
            ['Points', 'DESC'],
            ['NetRunRate', 'DESC']
        ]
    });

    for (let i = 0; i < standings.length; i++) {
        await standings[i].update({ Position: i + 1 });
    }

    return standings;
};

/**
 * Get tournament statistics
 */
exports.getTournamentStats = async (tournamentId) => {
    const statisticsService = require('./statistics.service');
    return await statisticsService.getTournamentLeaderboard(tournamentId);
};

/**
 * Close registration for a tournament
 */
exports.closeRegistration = async (tournamentId) => {
    const tournament = await Tournament.findByPk(tournamentId);
    if (!tournament) {
        throw new Error('Tournament not found');
    }

    await tournament.update({ IsRegistrationOpen: false });
    return tournament;
};

