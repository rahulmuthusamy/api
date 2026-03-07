const { Match, MatchSquad, TeamMaster, PlayerMaster, TeamPlayer, Innings, BallByBall, PlayerMatchStats, Tournament } = require('../models');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');

class MatchService {
    /**
     * Save match squad (11 players per team)
     */
    async saveMatchSquad(matchId, teamId, players) {
        try {
            // Validation
            if (!Array.isArray(players) || players.length < 2) {
                throw new Error('At least 2 players are required for a squad');
            }

            const captainCount = players.filter(p => p.isCaptain).length;
            const keeperCount = players.filter(p => p.isWicketKeeper).length;

            if (captainCount !== 1) {
                throw new Error('Exactly 1 captain is required');
            }

            if (keeperCount !== 1) {
                throw new Error('Exactly 1 wicket keeper is required');
            }

            // Verify all players belong to the team
            for (const player of players) {
                const teamPlayer = await TeamPlayer.findOne({
                    where: {
                        TeamID: teamId,
                        PlayerID: player.playerId,
                        Status: 'Active'
                    }
                });

                if (!teamPlayer) {
                    throw new Error(`Player ${player.playerId} does not belong to team ${teamId}`);
                }
            }

            // Delete existing squad for this team in this match
            await MatchSquad.destroy({
                where: { MatchID: matchId, TeamID: teamId }
            });

            // Insert new squad
            const squadData = players.map(p => ({
                MatchID: matchId,
                TeamID: teamId,
                PlayerID: p.playerId,
                IsPlaying: true,
                IsCaptain: p.isCaptain || false,
                IsWicketKeeper: p.isWicketKeeper || false
            }));

            const squad = await MatchSquad.bulkCreate(squadData);

            return {
                success: true,
                message: 'Squad saved successfully',
                data: squad
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get match squad for both teams
     */
    async getMatchSquad(matchId) {
        try {
            const squads = await MatchSquad.findAll({
                where: { MatchID: matchId },
                include: [
                    {
                        model: PlayerMaster,
                        attributes: ['PlayerID', 'Name', 'Role', 'PhotoURL', 'BattingStyle', 'BowlingStyle']
                    },
                    {
                        model: TeamMaster,
                        attributes: ['TeamID', 'Name', 'LogoURL']
                    }
                ]
            });

            // Group by team
            const teamASquad = squads.filter(s => s.TeamID === (squads[0]?.TeamID || null));
            const teamBSquad = squads.filter(s => s.TeamID !== (squads[0]?.TeamID || null));

            return {
                success: true,
                data: {
                    teamA: teamASquad,
                    teamB: teamBSquad
                }
            };
        } catch (error) {
            throw error;
        }
    }

    async getAllMatches(query = {}) {
        try {
            return await Match.findAll({
                include: [
                    { model: TeamMaster, as: 'TeamA', attributes: ['TeamID', 'Name', 'LogoURL'] },
                    { model: TeamMaster, as: 'TeamB', attributes: ['TeamID', 'Name', 'LogoURL'] },
                    { model: Tournament, as: 'Tournament', attributes: ['TournamentID', 'Name'] }
                ],
                order: [['MatchDate', 'DESC']]
            });
        } catch (error) {
            throw error;
        }
    }

    async getMatchById(id) {
        try {
            return await Match.findByPk(id, {
                include: [
                    { model: TeamMaster, as: 'TeamA' },
                    { model: TeamMaster, as: 'TeamB' },
                    { model: Tournament, as: 'Tournament' },
                    { model: TeamMaster, as: 'TossWinner' },
                    { model: TeamMaster, as: 'Winner' },
                    { model: PlayerMaster, as: 'PlayerOfMatch' }
                ]
            });
        } catch (error) {
            throw error;
        }
    }

    async deleteMatch(id) {
        try {
            return await Match.destroy({ where: { MatchID: id } });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Start a match (create innings)
     */
    async startMatch(matchId, tossWinnerId, tossDecision) {
        try {
            const match = await Match.findByPk(matchId);
            if (!match) {
                throw new Error('Match not found');
            }

            // Update match with toss details
            match.TossWinnerID = tossWinnerId;
            match.TossDecision = tossDecision;
            match.Status = 'Live';
            await match.save();

            // Determine batting and bowling teams for innings
            let firstBattingTeam, firstBowlingTeam;
            const wId = Number(tossWinnerId);

            if (tossDecision === 'Bat') {
                firstBattingTeam = wId;
                firstBowlingTeam = wId === match.TeamA_ID ? match.TeamB_ID : match.TeamA_ID;
            } else {
                firstBowlingTeam = wId;
                firstBattingTeam = wId === match.TeamA_ID ? match.TeamB_ID : match.TeamA_ID;
            }

            // Delete existing innings (placeholders from creation)
            await Innings.destroy({ where: { MatchID: matchId } });

            // Create innings records
            const innings1 = await Innings.create({
                MatchID: matchId,
                InningsNumber: 1,
                BattingTeamID: firstBattingTeam,
                BowlingTeamID: firstBowlingTeam,
                Status: 'InProgress'
            });

            const innings2 = await Innings.create({
                MatchID: matchId,
                InningsNumber: 2,
                BattingTeamID: firstBowlingTeam,
                BowlingTeamID: firstBattingTeam,
                Status: 'Pending'
            });

            return {
                success: true,
                message: 'Match started successfully',
                data: {
                    match,
                    innings: [innings1, innings2]
                }
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Record a ball in the match (Delegates to ScoringService)
     */
    async recordBall(ballData) {
        try {
            // Auto-calculate Over and Ball number if not provided
            if (ballData.overNumber === undefined || ballData.ballNumber === undefined) {
                const lastBall = await BallByBall.findOne({
                    where: { InningsID: ballData.inningsId },
                    order: [['BallID', 'DESC']]
                });

                if (!lastBall) {
                    ballData.overNumber = 0;
                    ballData.ballNumber = 1;
                } else {
                    // Logic to determine next ball
                    let nextOver = lastBall.OverNumber;
                    let nextBall = lastBall.BallNumber + 1;

                    const isLegal = lastBall.IsLegalDelivery;

                    // Count legal balls in current over
                    const legalBallsInOver = await BallByBall.count({
                        where: {
                            InningsID: ballData.inningsId,
                            OverNumber: lastBall.OverNumber,
                            IsLegalDelivery: true
                        }
                    });

                    // If 6 legal balls have been bowled in the current over, move to next over
                    if (legalBallsInOver >= 6 && isLegal) {
                        nextOver = lastBall.OverNumber + 1;
                        nextBall = 1;
                    }

                    ballData.overNumber = nextOver;
                    ballData.ballNumber = nextBall;
                }
            }

            // Delegate to Scoring Service
            const scoringService = require('./scoring.service');
            const result = await scoringService.recordBall(ballData);

            // Update Match Score (Denormalized)
            await this.updateMatchScore(ballData.matchId, ballData.inningsId);

            return {
                success: true,
                message: 'Ball recorded successfully',
                data: {
                    ball: result,
                    // calculate team score/wickets from result or fetched innings
                    teamScore: result.TeamScore,
                    teamWickets: result.TeamWickets
                }
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update match score after each ball
     */
    async updateMatchScore(matchId, inningsId) {
        try {
            const innings = await Innings.findByPk(inningsId);
            const lastBall = await BallByBall.findOne({
                where: { InningsID: inningsId },
                order: [['BallID', 'DESC']]
            });

            if (!lastBall) return;

            // Calculate overs
            const totalBalls = await BallByBall.count({
                where: { InningsID: inningsId, IsLegalDelivery: true }
            });
            const overs = Math.floor(totalBalls / 6) + ((totalBalls % 6) / 10);

            const updateData = {};
            if (innings.BattingTeamID === match.TeamA_ID) {
                updateData.TeamA_Runs = lastBall.TeamScore;
                updateData.TeamA_Wickets = lastBall.TeamWickets;
                updateData.TeamA_Overs = overs;
            } else {
                updateData.TeamB_Runs = lastBall.TeamScore;
                updateData.TeamB_Wickets = lastBall.TeamWickets;
                updateData.TeamB_Overs = overs;
            }

            await Match.update(updateData, { where: { MatchID: matchId } });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generate scorecard for a match
     */
    async generateScorecard(matchId) {
        try {
            const match = await Match.findByPk(matchId, {
                include: [
                    { model: TeamMaster, as: 'TeamA' },
                    { model: TeamMaster, as: 'TeamB' },
                    { model: Innings, as: 'Innings' } // Removing separate order here as Sequelize include order is complex, best to sort in JS or verify model default order
                ],
                order: [
                    [{ model: Innings, as: 'Innings' }, 'InningsNumber', 'ASC']
                ]
            });

            if (!match) {
                throw new Error('Match not found');
            }

            const scorecards = [];

            for (const innings of match.Innings) {
                // Batting scorecard
                const battingStatsQuery = await sequelize.query(`
                    SELECT 
                        p.PlayerID,
                        p.Name AS PlayerName,
                        COALESCE(SUM(b.RunsScored), 0) AS RunsScored,
                        COUNT(CASE WHEN b.IsLegalDelivery = 1 THEN 1 END) AS BallsFaced,
                        COALESCE(SUM(CASE WHEN b.BoundaryType = 'Four' THEN 1 ELSE 0 END), 0) AS Fours,
                        COALESCE(SUM(CASE WHEN b.BoundaryType = 'Six' THEN 1 ELSE 0 END), 0) AS Sixes,
                        COALESCE(ROUND((SUM(b.RunsScored) * 100.0 / NULLIF(COUNT(CASE WHEN b.IsLegalDelivery = 1 THEN 1 END), 0)), 2), 0) AS StrikeRate,
                        ps.IsOut,
                        ps.HowOut
                    FROM MatchSquads ms
                    INNER JOIN PlayerMasters p ON ms.PlayerID = p.PlayerID
                    LEFT JOIN BallByBall b ON b.InningsID = ? AND b.BatsmanID = p.PlayerID
                    LEFT JOIN PlayerMatchStats ps ON ps.MatchID = ms.MatchID AND ps.PlayerID = p.PlayerID
                    WHERE ms.MatchID = ? AND ms.TeamID = ?
                    GROUP BY p.PlayerID, p.Name, ps.IsOut, ps.HowOut
                    ORDER BY COALESCE(SUM(b.RunsScored), 0) DESC, COUNT(CASE WHEN b.IsLegalDelivery = 1 THEN 1 END) DESC
                `, {
                    replacements: [innings.InningsID, match.MatchID, innings.BattingTeamID],
                    type: QueryTypes.SELECT
                });

                const battingStats = battingStatsQuery.map(s => ({
                    ...s,
                    Name: s.PlayerName,
                    Dismissal: s.IsOut ? s.HowOut : null,
                    Player: { PlayerID: s.PlayerID, Name: s.PlayerName },
                    IsOut: !!s.IsOut,
                    HowOut: s.HowOut || 'not out'
                }));

                // Bowling scorecard
                const bowlingStatsQuery = await sequelize.query(`
                    SELECT 
                        p.PlayerID,
                        p.Name AS PlayerName,
                        FLOOR(COUNT(CASE WHEN b.IsLegalDelivery = 1 THEN 1 END) / 6) AS Overs,
                        COUNT(CASE WHEN b.IsLegalDelivery = 1 THEN 1 END) % 6 AS BallsInOver,
                        SUM(b.TotalRuns) AS RunsConceded,
                        SUM(CASE WHEN b.IsWicket = 1 AND b.WicketType IN ('Bowled', 'Caught', 'LBW', 'Stumped', 'HitWicket') THEN 1 ELSE 0 END) AS WicketsTaken,
                        ROUND(SUM(b.TotalRuns) * 6.0 / NULLIF(COUNT(CASE WHEN b.IsLegalDelivery = 1 THEN 1 END), 0), 2) AS Economy,
                        ROUND(COUNT(CASE WHEN b.IsLegalDelivery = 1 THEN 1 END) * 1.0 / NULLIF(SUM(CASE WHEN b.IsWicket = 1 AND b.WicketType IN ('Bowled', 'Caught', 'LBW', 'Stumped', 'HitWicket') THEN 1 ELSE 0 END), 0), 2) AS StrikeRate
                    FROM BallByBall b
                    INNER JOIN PlayerMasters p ON b.BowlerID = p.PlayerID
                    WHERE b.InningsID = ?
                    GROUP BY b.BowlerID, p.PlayerID, p.Name
                    ORDER BY SUM(CASE WHEN b.IsWicket = 1 THEN 1 END) DESC, SUM(b.TotalRuns) ASC
                `, {
                    replacements: [innings.InningsID],
                    type: QueryTypes.SELECT
                });

                const bowlingStats = bowlingStatsQuery.map(stat => ({
                    ...stat,
                    Name: stat.PlayerName,
                    Player: { PlayerID: stat.PlayerID, Name: stat.PlayerName },
                    OversBowled: `${stat.Overs}.${stat.BallsInOver}`
                }));

                // Extras
                const extras = await sequelize.query(`
                    SELECT 
                        SUM(CASE WHEN ExtraType = 'Wide' THEN ExtraRuns ELSE 0 END) AS Wides,
                        SUM(CASE WHEN ExtraType = 'NoBall' THEN ExtraRuns ELSE 0 END) AS NoBalls,
                        SUM(CASE WHEN ExtraType = 'Bye' THEN ExtraRuns ELSE 0 END) AS Byes,
                        SUM(CASE WHEN ExtraType = 'LegBye' THEN ExtraRuns ELSE 0 END) AS LegByes,
                        SUM(CASE WHEN ExtraType = 'Penalty' THEN ExtraRuns ELSE 0 END) AS Penalties,
                        SUM(ExtraRuns) AS TotalExtras
                    FROM BallByBall
                    WHERE InningsID = ? AND IsExtra = 1
                `, {
                    replacements: [innings.InningsID],
                    type: QueryTypes.SELECT
                });

                const extrasObj = extras[0] || {};

                // Determine Current State (Striker, Non-Striker, Bowler) based on Last Ball
                // -------------------------------------------------------------------------
                let currentStrikerID = null;
                let currentNonStrikerID = null;
                let currentBowlerID = null;

                const lastBall = await BallByBall.findOne({
                    where: { InningsID: innings.InningsID },
                    order: [['BallID', 'DESC']]
                });

                if (lastBall) {
                    // Start with the state at the END of the last ball
                    let s = lastBall.BatsmanID;
                    let ns = lastBall.BatsmanEndID;
                    let b = lastBall.BowlerID;

                    // 1. Handle Wicket
                    if (lastBall.IsWicket) {
                        const dismissed = lastBall.DismissedPlayerID;
                        if (dismissed === s) s = null; // Striker out, new batter needed
                        else if (dismissed === ns) ns = null; // Non-striker out (Run out)
                    }

                    // 2. Handle Strike Rotation (Runs)
                    // If legal delivery and odd runs (1, 3, etc) -> Swap
                    // Note: If IsWicket, we usually don't swap unless it was a Run Out on the X run attempt?
                    // Simplified: If odd runs scored by batsman, swap.
                    // If runs were even, stay.
                    // Boundary (4, 6) -> No swap.
                    if (!lastBall.IsWicket) {
                        // Standard run rotation
                        const physicalRuns = lastBall.RunsScored + (lastBall.ExtraType === 'NoBall' || lastBall.ExtraType === 'Wide' ? lastBall.ExtraRuns : 0);
                        // Actually, Wide/NoBall runs count to team but crossing depends on physical runs completed.
                        // Assuming simple: If RunsScored is odd -> swap.
                        if (lastBall.RunsScored % 2 !== 0) {
                            [s, ns] = [ns, s];
                        }
                    } else {
                        // Wicket logic with crossing is complex (e.g. crossing before catch).
                        // Standard: New batsman comes to the crease.
                        // If it crossed, the new batsman goes to non-striker?
                        // Let's assume simplest: New batsman takes the "Empty" spot.
                        // Position of the OTHER batsman depends on runs completed + odd/even?
                        // Let's Keep It Simple: Don't auto-rotate on wicket for now, let user select if needed or let new batter take the slot.
                    }

                    // 3. Handle Over Completion
                    // Check if run rotation from runs happened FIRST, then Over End happens.
                    // Over End -> Swap Ends (Striker becomes Non-Striker, NS becomes Striker)
                    // Only if the ball was legal and it was the 6th legal ball.
                    // We can check if Current Over is complete.
                    // innings.TotalBalls is the count of LEAGAL balls.
                    // If totalBalls % 6 === 0, over just finished.
                    // But wait, we just fetched the innings, has it been updated with the last ball?
                    // Yes, we updated innings in recordBall.
                    if (innings.TotalBalls > 0 && innings.TotalBalls % 6 === 0 && lastBall.IsLegalDelivery) {
                        // Over Ended
                        [s, ns] = [ns, s]; // Swap ends
                        b = null; // New bowler needed
                    }

                    currentStrikerID = s;
                    currentNonStrikerID = ns;
                    currentBowlerID = b;
                }

                let lastBowlerID = lastBall ? lastBall.BowlerID : null;

                const scoringService = require('./scoring.service');
                const fowStats = await scoringService.getFallOfWickets(innings.InningsID);

                // Get current over sequence for display
                const currentOverNumber = lastBall ? lastBall.OverNumber : 0;
                const currentOverBalls = await BallByBall.findAll({
                    where: { InningsID: innings.InningsID, OverNumber: currentOverNumber },
                    order: [['BallID', 'ASC']]
                });

                const currentOverRuns = currentOverBalls.reduce((sum, b) => sum + b.TotalRuns, 0);

                // Format over summary: "4 1 0 Wd 1 W"
                const formattedOver = currentOverBalls.map(b => {
                    if (b.IsWicket) return 'W';
                    if (b.IsExtra) {
                        const type = b.ExtraType === 'Wide' ? 'Wd' : (b.ExtraType === 'NoBall' ? 'Nb' : (b.ExtraType === 'Bye' ? 'B' : 'Lb'));
                        return b.TotalRuns > 1 ? `${type}${b.TotalRuns}` : type;
                    }
                    return b.RunsScored.toString();
                });

                scorecards.push({
                    ...innings.toJSON(), // Include TotalRuns, TotalWickets, TotalOvers, etc. from Innings model
                    inningsNumber: innings.InningsNumber,
                    battingTeam: innings.InningsNumber === 1 ? match.TeamA : match.TeamB,
                    batting: battingStats, // For LiveScoring
                    battingStats: battingStats, // For ScorecardComponent
                    bowling: bowlingStats, // For LiveScoring
                    bowlingStats: bowlingStats, // For ScorecardComponent
                    fow: fowStats,
                    extras: extrasObj, // object
                    currentStrikerID,
                    currentNonStrikerID,
                    currentBowlerID,
                    lastBowlerID,
                    recentBalls: formattedOver,
                    currentOverRuns
                });
            }

            return {
                success: true,
                data: {
                    match,
                    scorecards
                }
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Complete a match
     */
    async completeMatch(matchId, winnerId, resultNote) {
        try {
            const match = await Match.findByPk(matchId);
            if (!match) {
                throw new Error('Match not found');
            }

            match.Status = 'Completed';
            match.WinnerID = winnerId;
            match.ResultNote = resultNote;
            await match.save();

            return {
                success: true,
                message: 'Match completed successfully',
                data: match
            };
        } catch (error) {
            throw error;
        }
    }

    async createMatch(matchData) {
        try {
            const { TournamentID, TeamA_ID, TeamB_ID, MatchDate, Venue, MatchFormat, TotalOvers, VenueID } = matchData;

            // Create match record
            const match = await Match.create({
                TournamentID,
                TeamA_ID,
                TeamB_ID,
                MatchDate,
                Venue,
                MatchFormat,
                TotalOvers,
                VenueID,
                Status: 'Scheduled',
                CreatedBy: matchData.CreatedBy || 1,
                CreatedDate: new Date(),
                UpdatedDate: new Date()
            });

            // Create innings records only if both teams are selected
            let innings1 = null;
            let innings2 = null;

            if (TeamA_ID && TeamB_ID) {
                innings1 = await Innings.create({
                    MatchID: match.MatchID,
                    InningsNumber: 1,
                    BattingTeamID: TeamA_ID,
                    BowlingTeamID: TeamB_ID,
                    Status: 'Pending'
                });

                innings2 = await Innings.create({
                    MatchID: match.MatchID,
                    InningsNumber: 2,
                    BattingTeamID: TeamB_ID,
                    BowlingTeamID: TeamA_ID,
                    Status: 'Pending'
                });
            }

            return {
                success: true,
                message: 'Match created successfully',
                data: {
                    match,
                    innings1,
                    innings2
                }
            };
        } catch (error) {
            throw error;
        }
    }

    async updateMatch(matchId, matchData) {
        try {
            const match = await Match.findByPk(matchId);
            if (!match) {
                throw new Error('Match not found');
            }

            match.set(matchData);
            await match.save();

            // Create innings records if both teams are now assigned and they don't exist
            if (match.TeamA_ID && match.TeamB_ID) {
                const existingInnings = await Innings.findOne({ where: { MatchID: matchId } });
                if (!existingInnings) {
                    await Innings.create({
                        MatchID: matchId,
                        InningsNumber: 1,
                        BattingTeamID: match.TeamA_ID,
                        BowlingTeamID: match.TeamB_ID,
                        Status: 'Pending'
                    });

                    await Innings.create({
                        MatchID: matchId,
                        InningsNumber: 2,
                        BattingTeamID: match.TeamB_ID,
                        BowlingTeamID: match.TeamA_ID,
                        Status: 'Pending'
                    });
                }
            }

            return {
                success: true,
                message: 'Match updated successfully',
                data: match
            };
        } catch (error) {
            throw error;
        }
    }

    async undoLastBall(matchId) {
        try {
            const scoringService = require('./scoring.service');
            const result = await scoringService.undoLastBall(matchId);

            // Update denormalized match score
            if (result.undoneBall) {
                await this.updateMatchScore(matchId, result.undoneBall.InningsID);
            }

            return {
                success: true,
                message: 'Ball undone successfully',
                data: result
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new MatchService();
