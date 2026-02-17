const { PlayerMatchStats, TournamentStandings, Match, PlayerMaster, TeamMaster, Tournament } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../models').sequelize;

/**
 * Get top run scorers in a tournament
 */
exports.getTopScorers = async (tournamentId, limit = 10) => {
    const matches = await Match.findAll({
        where: { TournamentID: tournamentId },
        attributes: ['MatchID']
    });

    const matchIds = matches.map(m => m.MatchID);

    const topScorers = await PlayerMatchStats.findAll({
        where: { MatchID: matchIds },
        include: [
            { model: PlayerMaster, as: 'Player' },
            { model: TeamMaster, as: 'Team' }
        ],
        attributes: [
            'PlayerID',
            [sequelize.fn('SUM', sequelize.col('RunsScored')), 'totalRuns'],
            [sequelize.fn('SUM', sequelize.col('BallsFaced')), 'totalBalls'],
            [sequelize.fn('SUM', sequelize.col('Fours')), 'totalFours'],
            [sequelize.fn('SUM', sequelize.col('Sixes')), 'totalSixes'],
            [sequelize.fn('COUNT', sequelize.col('MatchID')), 'matchesPlayed'],
            [sequelize.fn('COUNT', sequelize.literal('CASE WHEN IsOut = 1 THEN 1 END')), 'timesOut']
        ],
        group: ['PlayerID', 'Player.PlayerID', 'Team.TeamID'],
        order: [[sequelize.fn('SUM', sequelize.col('RunsScored')), 'DESC']],
        limit: limit,
        raw: false
    });

    return topScorers.map(stat => {
        const totalRuns = parseInt(stat.dataValues.totalRuns) || 0;
        const totalBalls = parseInt(stat.dataValues.totalBalls) || 0;
        const timesOut = parseInt(stat.dataValues.timesOut) || 0;
        const matchesPlayed = parseInt(stat.dataValues.matchesPlayed) || 0;

        return {
            player: stat.Player,
            team: stat.Team,
            runs: totalRuns,
            balls: totalBalls,
            fours: parseInt(stat.dataValues.totalFours) || 0,
            sixes: parseInt(stat.dataValues.totalSixes) || 0,
            matches: matchesPlayed,
            average: timesOut > 0 ? (totalRuns / timesOut).toFixed(2) : totalRuns,
            strikeRate: totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(2) : 0
        };
    });
};

/**
 * Get top wicket takers in a tournament
 */
exports.getTopWicketTakers = async (tournamentId, limit = 10) => {
    const matches = await Match.findAll({
        where: { TournamentID: tournamentId },
        attributes: ['MatchID']
    });

    const matchIds = matches.map(m => m.MatchID);

    const topBowlers = await PlayerMatchStats.findAll({
        where: { MatchID: matchIds },
        include: [
            { model: PlayerMaster, as: 'Player' },
            { model: TeamMaster, as: 'Team' }
        ],
        attributes: [
            'PlayerID',
            [sequelize.fn('SUM', sequelize.col('WicketsTaken')), 'totalWickets'],
            [sequelize.fn('SUM', sequelize.col('RunsConceded')), 'totalRuns'],
            [sequelize.fn('SUM', sequelize.col('BallsBowled')), 'totalBalls'],
            [sequelize.fn('SUM', sequelize.col('Maidens')), 'totalMaidens'],
            [sequelize.fn('COUNT', sequelize.col('MatchID')), 'matchesPlayed']
        ],
        group: ['PlayerID', 'Player.PlayerID', 'Team.TeamID'],
        having: sequelize.where(sequelize.fn('SUM', sequelize.col('WicketsTaken')), '>', 0),
        order: [[sequelize.fn('SUM', sequelize.col('WicketsTaken')), 'DESC']],
        limit: limit,
        raw: false
    });

    return topBowlers.map(stat => {
        const totalWickets = parseInt(stat.dataValues.totalWickets) || 0;
        const totalRuns = parseInt(stat.dataValues.totalRuns) || 0;
        const totalBalls = parseInt(stat.dataValues.totalBalls) || 0;
        const totalOvers = Math.floor(totalBalls / 6) + (totalBalls % 6) / 10;

        return {
            player: stat.Player,
            team: stat.Team,
            wickets: totalWickets,
            runs: totalRuns,
            overs: totalOvers.toFixed(1),
            maidens: parseInt(stat.dataValues.totalMaidens) || 0,
            matches: parseInt(stat.dataValues.matchesPlayed) || 0,
            average: totalWickets > 0 ? (totalRuns / totalWickets).toFixed(2) : 0,
            economy: totalOvers > 0 ? (totalRuns / totalOvers).toFixed(2) : 0
        };
    });
};

/**
 * Get best batting averages (minimum innings requirement)
 */
exports.getBestBattingAverage = async (tournamentId, minInnings = 3, limit = 10) => {
    const matches = await Match.findAll({
        where: { TournamentID: tournamentId },
        attributes: ['MatchID']
    });

    const matchIds = matches.map(m => m.MatchID);

    const batsmen = await PlayerMatchStats.findAll({
        where: { MatchID: matchIds },
        include: [
            { model: PlayerMaster, as: 'Player' },
            { model: TeamMaster, as: 'Team' }
        ],
        attributes: [
            'PlayerID',
            [sequelize.fn('SUM', sequelize.col('RunsScored')), 'totalRuns'],
            [sequelize.fn('COUNT', sequelize.literal('CASE WHEN IsOut = 1 THEN 1 END')), 'timesOut'],
            [sequelize.fn('COUNT', sequelize.col('MatchID')), 'innings']
        ],
        group: ['PlayerID', 'Player.PlayerID', 'Team.TeamID'],
        having: sequelize.where(sequelize.fn('COUNT', sequelize.col('MatchID')), '>=', minInnings),
        raw: false
    });

    const withAverages = batsmen.map(stat => {
        const totalRuns = parseInt(stat.dataValues.totalRuns) || 0;
        const timesOut = parseInt(stat.dataValues.timesOut) || 0;
        const innings = parseInt(stat.dataValues.innings) || 0;

        return {
            player: stat.Player,
            team: stat.Team,
            runs: totalRuns,
            innings: innings,
            notOuts: innings - timesOut,
            average: timesOut > 0 ? totalRuns / timesOut : totalRuns
        };
    });

    return withAverages
        .sort((a, b) => b.average - a.average)
        .slice(0, limit)
        .map(stat => ({
            ...stat,
            average: stat.average.toFixed(2)
        }));
};

/**
 * Get most sixes in a tournament
 */
exports.getMostSixes = async (tournamentId, limit = 10) => {
    const matches = await Match.findAll({
        where: { TournamentID: tournamentId },
        attributes: ['MatchID']
    });

    const matchIds = matches.map(m => m.MatchID);

    const players = await PlayerMatchStats.findAll({
        where: { MatchID: matchIds },
        include: [
            { model: PlayerMaster, as: 'Player' },
            { model: TeamMaster, as: 'Team' }
        ],
        attributes: [
            'PlayerID',
            [sequelize.fn('SUM', sequelize.col('Sixes')), 'totalSixes'],
            [sequelize.fn('SUM', sequelize.col('RunsScored')), 'totalRuns']
        ],
        group: ['PlayerID', 'Player.PlayerID', 'Team.TeamID'],
        having: sequelize.where(sequelize.fn('SUM', sequelize.col('Sixes')), '>', 0),
        order: [[sequelize.fn('SUM', sequelize.col('Sixes')), 'DESC']],
        limit: limit,
        raw: false
    });

    return players.map(stat => ({
        player: stat.Player,
        team: stat.Team,
        sixes: parseInt(stat.dataValues.totalSixes) || 0,
        runs: parseInt(stat.dataValues.totalRuns) || 0
    }));
};

/**
 * Get team statistics for a tournament
 */
exports.getTeamStats = async (teamId, tournamentId) => {
    const matches = await Match.findAll({
        where: {
            TournamentID: tournamentId,
            [Op.or]: [
                { TeamA_ID: teamId },
                { TeamB_ID: teamId }
            ],
            Status: 'Completed'
        },
        include: [
            { model: TeamMaster, as: 'TeamA' },
            { model: TeamMaster, as: 'TeamB' },
            { model: TeamMaster, as: 'Winner' }
        ]
    });

    const stats = {
        played: matches.length,
        won: 0,
        lost: 0,
        tied: 0,
        noResult: 0,
        totalRuns: 0,
        totalWickets: 0,
        highestScore: 0,
        lowestScore: Infinity
    };

    for (const match of matches) {
        if (match.WinnerID === teamId) {
            stats.won++;
        } else if (match.WinnerID === null) {
            if (match.Status === 'Completed') {
                stats.tied++;
            } else {
                stats.noResult++;
            }
        } else {
            stats.lost++;
        }

        // Get team's score
        const isTeamA = match.TeamA_ID === teamId;
        const teamRuns = isTeamA ? match.TeamA_Runs : match.TeamB_Runs;
        const teamWickets = isTeamA ? match.TeamA_Wickets : match.TeamB_Wickets;

        stats.totalRuns += teamRuns;
        stats.totalWickets += teamWickets;

        if (teamRuns > stats.highestScore) stats.highestScore = teamRuns;
        if (teamRuns < stats.lowestScore) stats.lowestScore = teamRuns;
    }

    if (stats.lowestScore === Infinity) stats.lowestScore = 0;

    return stats;
};

/**
 * Get tournament leaderboard (combined batting + bowling)
 */
exports.getTournamentLeaderboard = async (tournamentId) => {
    const [topScorers, topWicketTakers] = await Promise.all([
        exports.getTopScorers(tournamentId, 5),
        exports.getTopWicketTakers(tournamentId, 5)
    ]);

    return {
        topScorers,
        topWicketTakers
    };
};
