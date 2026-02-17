const { Match, TeamMaster, Tournament } = require('../models');
const BaseService = require('./base.service');

const service = new BaseService(Match);

exports.getAllMatches = async (params = {}) => {
    return await service.getAll({
        where: params,
        include: [
            { model: TeamMaster, as: 'TeamA' },
            { model: TeamMaster, as: 'TeamB' },
            { model: Tournament, as: 'Tournament' }
        ],
        order: [['MatchDate', 'ASC']]
    });
};

exports.getMatchById = async (id) => {
    return await service.getById(id, {
        include: [
            { model: TeamMaster, as: 'TeamA' },
            { model: TeamMaster, as: 'TeamB' },
            { model: TeamMaster, as: 'Winner' },
            { model: Tournament, as: 'Tournament' }
        ]
    });
};

exports.createMatch = async (data) => {
    return await service.create(data);
};

exports.updateMatch = async (id, data) => {
    return await service.update(id, data);
};

exports.deleteMatch = async (id) => {
    return await service.delete(id);
};

exports.getLiveScore = async (matchId) => {
    // This would fetch from a Scorecard table or real-time state
    // For now, return basic match info
    return await this.getMatchById(matchId);
};

/**
 * Record toss for a match
 */
exports.recordToss = async (matchId, tossWinnerId, tossDecision) => {
    const match = await Match.findByPk(matchId);
    if (!match) throw new Error('Match not found');

    await match.update({
        TossWinnerID: tossWinnerId,
        TossDecision: tossDecision
    });

    return match;
};

/**
 * Start an innings
 */
exports.startInnings = async (matchId, inningsNumber) => {
    const { Innings } = require('../models');
    const match = await Match.findByPk(matchId);
    if (!match) throw new Error('Match not found');

    // Determine batting and bowling teams
    let battingTeamId, bowlingTeamId;

    if (inningsNumber === 1) {
        // First innings: toss winner's decision
        if (match.TossDecision === 'Bat') {
            battingTeamId = match.TossWinnerID === match.TeamA_ID ? match.TeamA_ID : match.TeamB_ID;
            bowlingTeamId = battingTeamId === match.TeamA_ID ? match.TeamB_ID : match.TeamA_ID;
        } else {
            bowlingTeamId = match.TossWinnerID === match.TeamA_ID ? match.TeamA_ID : match.TeamB_ID;
            battingTeamId = bowlingTeamId === match.TeamA_ID ? match.TeamB_ID : match.TeamA_ID;
        }
    } else {
        // Second innings: swap teams
        const firstInnings = await Innings.findOne({
            where: { MatchID: matchId, InningsNumber: 1 }
        });
        battingTeamId = firstInnings.BowlingTeamID;
        bowlingTeamId = firstInnings.BattingTeamID;
    }

    // Create innings record
    const innings = await Innings.create({
        MatchID: matchId,
        InningsNumber: inningsNumber,
        BattingTeamID: battingTeamId,
        BowlingTeamID: bowlingTeamId,
        TargetScore: inningsNumber === 2 ? (await getFirstInningsTotal(matchId)) + 1 : null
    });

    // Update match status
    await match.update({
        Status: 'Live',
        CurrentInnings: inningsNumber
    });

    return innings;
};

/**
 * Get first innings total
 */
async function getFirstInningsTotal(matchId) {
    const { Innings } = require('../models');
    const firstInnings = await Innings.findOne({
        where: { MatchID: matchId, InningsNumber: 1 }
    });
    return firstInnings ? firstInnings.TotalRuns : 0;
}

/**
 * Record a ball
 */
exports.recordBall = async (ballData) => {
    const scoringService = require('./scoring.service');
    return await scoringService.recordBall(ballData);
};

/**
 * Undo last ball
 * @param {number} matchId
 */
exports.undoLastBall = async (matchId) => {
    const scoringService = require('./scoring.service');
    return await scoringService.undoLastBall(matchId);
};

/**
 * Complete an innings
 */
exports.completeInnings = async (inningsId) => {
    const { Innings } = require('../models');
    const innings = await Innings.findByPk(inningsId);
    if (!innings) throw new Error('Innings not found');

    await innings.update({ IsCompleted: true });

    // Check if match is complete
    if (innings.InningsNumber === 2) {
        await this.calculateResult(innings.MatchID);
    }

    return innings;
};

/**
 * Calculate match result
 */
exports.calculateResult = async (matchId) => {
    const { Innings } = require('../models');
    const match = await Match.findByPk(matchId);
    if (!match) throw new Error('Match not found');

    const innings = await Innings.findAll({
        where: { MatchID: matchId },
        order: [['InningsNumber', 'ASC']]
    });

    if (innings.length < 2) {
        throw new Error('Both innings must be completed');
    }

    const firstInnings = innings[0];
    const secondInnings = innings[1];

    let winnerId = null;
    let resultNote = '';

    if (secondInnings.TotalRuns > firstInnings.TotalRuns) {
        winnerId = secondInnings.BattingTeamID;
        const wicketsRemaining = 10 - secondInnings.TotalWickets;
        resultNote = `Won by ${wicketsRemaining} wickets`;
    } else if (firstInnings.TotalRuns > secondInnings.TotalRuns) {
        winnerId = firstInnings.BattingTeamID;
        const runsMargin = firstInnings.TotalRuns - secondInnings.TotalRuns;
        resultNote = `Won by ${runsMargin} runs`;
    } else {
        resultNote = 'Match Tied';
    }

    // Update match
    await match.update({
        Status: 'Completed',
        WinnerID: winnerId,
        ResultNote: resultNote,
        TeamA_Runs: firstInnings.BattingTeamID === match.TeamA_ID ? firstInnings.TotalRuns : secondInnings.TotalRuns,
        TeamA_Wickets: firstInnings.BattingTeamID === match.TeamA_ID ? firstInnings.TotalWickets : secondInnings.TotalWickets,
        TeamA_Overs: firstInnings.BattingTeamID === match.TeamA_ID ? firstInnings.TotalOvers : secondInnings.TotalOvers,
        TeamB_Runs: firstInnings.BattingTeamID === match.TeamB_ID ? firstInnings.TotalRuns : secondInnings.TotalRuns,
        TeamB_Wickets: firstInnings.BattingTeamID === match.TeamB_ID ? firstInnings.TotalWickets : secondInnings.TotalWickets,
        TeamB_Overs: firstInnings.BattingTeamID === match.TeamB_ID ? firstInnings.TotalOvers : secondInnings.TotalOvers
    });

    // Update tournament standings if this is a tournament match
    if (match.TournamentID) {
        const tournamentService = require('./tournament.service');
        await tournamentService.calculateStandings(match.TournamentID);
    }

    return match;
};

/**
 * Get live score with detailed information
 */
exports.getLiveScoreDetailed = async (matchId) => {
    const { Innings, BallByBall } = require('../models');

    const match = await this.getMatchById(matchId);
    if (!match) throw new Error('Match not found');

    const innings = await Innings.findAll({
        where: { MatchID: matchId },
        order: [['InningsNumber', 'ASC']]
    });

    const currentInnings = innings.find(i => !i.IsCompleted);

    let recentBalls = [];
    if (currentInnings) {
        recentBalls = await BallByBall.findAll({
            where: { InningsID: currentInnings.InningsID },
            order: [['BallID', 'DESC']],
            limit: 6
        });
    }

    let fow = [];
    if (currentInnings) {
        const scoringService = require('./scoring.service');
        fow = await scoringService.getFallOfWickets(currentInnings.InningsID);
    }

    return {
        match,
        innings,
        currentInnings,
        recentBalls: recentBalls.reverse(),
        fow
    };
};

/**
 * Get squads for a match
 * @param {number} matchId
 */
exports.getMatchSquads = async (matchId) => {
    const { PlayerMaster, AuctionPlayer, TeamMaster, MatchSquad, TeamPlayer } = require('../models');

    const match = await Match.findByPk(matchId, {
        include: [
            { model: TeamMaster, as: 'TeamA' },
            { model: TeamMaster, as: 'TeamB' }
        ]
    });

    if (!match) throw new Error('Match not found');

    // 1. Check if Playing XI (MatchSquad) is already defined
    const matchSquads = await MatchSquad.findAll({
        where: { MatchID: matchId },
        include: [{ model: PlayerMaster }]
    });

    // 2. Fetch the full pool of players (from Auction AND TeamPlayer mapping)
    const teamAPoolFromAuction = await PlayerMaster.findAll({
        include: [{
            model: AuctionPlayer,
            as: 'AuctionEntries',
            where: { HighestBidTeamID: match.TeamA_ID },
            required: true
        }]
    });

    const teamAPoolFromMapping = await PlayerMaster.findAll({
        include: [{
            model: TeamPlayer,
            where: { TeamID: match.TeamA_ID },
            required: true
        }]
    });

    const teamBPoolFromAuction = await PlayerMaster.findAll({
        include: [{
            model: AuctionPlayer,
            as: 'AuctionEntries',
            where: { HighestBidTeamID: match.TeamB_ID },
            required: true
        }]
    });

    const teamBPoolFromMapping = await PlayerMaster.findAll({
        include: [{
            model: TeamPlayer,
            where: { TeamID: match.TeamB_ID },
            required: true
        }]
    });

    // Merge and remove duplicates
    const mergePools = (p1, p2) => {
        const map = new Map();
        [...p1, ...p2].forEach(p => map.set(p.PlayerID, p));
        return Array.from(map.values());
    };

    const teamAPool = mergePools(teamAPoolFromAuction, teamAPoolFromMapping);
    const teamBPool = mergePools(teamBPoolFromAuction, teamBPoolFromMapping);

    const allPlayersPool = await PlayerMaster.findAll({ limit: 200 });

    // Separate squads from pool
    const squadA = matchSquads.filter(s => s.TeamID === match.TeamA_ID).map(s => s.PlayerMaster);
    const squadB = matchSquads.filter(s => s.TeamID === match.TeamB_ID).map(s => s.PlayerMaster);

    return {
        teamA: {
            id: match.TeamA_ID,
            name: match.TeamA?.Name,
            squad: squadA, // These 11 picked players
            pool: teamAPool.length > 0 ? teamAPool : allPlayersPool, // From which 11 are picked
            isSquadDefined: squadA.length > 0
        },
        teamB: {
            id: match.TeamB_ID,
            name: match.TeamB?.Name,
            squad: squadB,
            pool: teamBPool.length > 0 ? teamBPool : allPlayersPool,
            isSquadDefined: squadB.length > 0
        },
        allPlayers: allPlayersPool
    };
};

/**
 * Save match squad (Playing XI)
 */
exports.saveMatchSquad = async (matchId, teamId, playerIds) => {
    const { MatchSquad } = require('../models');

    // Validate
    if (!playerIds || !Array.isArray(playerIds)) throw new Error('Invalid player list');

    // Clear existing squad for this team in this match
    await MatchSquad.destroy({ where: { MatchID: matchId, TeamID: teamId } });

    // Create new entries
    const entries = playerIds.map(pid => ({
        MatchID: matchId,
        TeamID: teamId,
        PlayerID: pid,
        IsPlaying: true
    }));

    return await MatchSquad.bulkCreate(entries);
};

/**
 * Get full detailed scorecard for a match
 */
exports.getFullScorecard = async (matchId) => {
    const { Innings, PlayerMatchStats, PlayerMaster, TeamMaster } = require('../models');
    const scoringService = require('./scoring.service');
    const { Op } = require('sequelize');

    const match = await Match.findByPk(matchId, {
        include: [
            { model: TeamMaster, as: 'TeamA' },
            { model: TeamMaster, as: 'TeamB' }
        ]
    });

    if (!match) throw new Error('Match not found');

    const innings = await Innings.findAll({
        where: { MatchID: matchId },
        include: [
            { model: TeamMaster, as: 'BattingTeam' },
            { model: TeamMaster, as: 'BowlingTeam' }
        ],
        order: [['InningsNumber', 'ASC']]
    });

    const fullInnings = await Promise.all(innings.map(async (inn) => {
        const battingStats = await PlayerMatchStats.findAll({
            where: { MatchID: matchId, TeamID: inn.BattingTeamID, BallsFaced: { [Op.gt]: 0 } },
            include: [{ model: PlayerMaster, as: 'Player' }],
            order: [['RunsScored', 'DESC']]
        });

        const bowlingStats = await PlayerMatchStats.findAll({
            where: { MatchID: matchId, TeamID: inn.BowlingTeamID, BallsBowled: { [Op.gt]: 0 } },
            include: [{ model: PlayerMaster, as: 'Player' }],
            order: [['WicketsTaken', 'DESC'], ['RunsConceded', 'ASC']]
        });

        const fow = await scoringService.getFallOfWickets(inn.InningsID);

        return {
            ...inn.toJSON(),
            battingStats,
            bowlingStats,
            fow
        };
    }));

    return {
        match,
        innings: fullInnings
    };
};

