const { Innings, BallByBall, Match, PlayerMatchStats, TeamMaster, PlayerMaster } = require('../models');

/**
 * Calculate batting strike rate
 */
exports.calculateStrikeRate = (runs, balls) => {
    if (!balls || balls === 0) return 0;
    return Number(((runs / balls) * 100).toFixed(2));
};

/**
 * Calculate bowling economy rate
 */
exports.calculateEconomy = (runs, overs) => {
    if (!overs || overs === 0) return 0;
    return Number((runs / overs).toFixed(2));
};

/**
 * Calculate Net Run Rate
 * NRR = (Total Runs Scored / Total Overs Faced) - (Total Runs Conceded / Total Overs Bowled)
 */
exports.calculateNetRunRate = (runsScored, oversFaced, runsConceded, oversBowled) => {
    if (!oversFaced || !oversBowled || oversFaced === 0 || oversBowled === 0) return 0;
    const runRate = runsScored / oversFaced;
    const concededRate = runsConceded / oversBowled;
    return Number((runRate - concededRate).toFixed(3));
};

/**
 * Convert overs (e.g., 19.4) to total balls
 */
exports.oversToBalls = (overs) => {
    const completeOvers = Math.floor(overs);
    const balls = Math.round((overs - completeOvers) * 10);
    return (completeOvers * 6) + balls;
};

/**
 * Convert balls to overs (e.g., 118 balls = 19.4 overs)
 */
exports.ballsToOvers = (balls) => {
    const overs = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return parseFloat(`${overs}.${remainingBalls}`);
};

/**
 * Record a ball in the match
 */
exports.recordBall = async (ballData) => {
    let {
        inningsId,
        matchId,
        overNumber,
        ballNumber,
        batsmanId,
        batsmanEndId,
        bowlerId,
        runsScored = 0,
        isWicket = false,
        wicketType = null,
        dismissedPlayerId = null,
        fielderId = null,
        isExtra = false,
        extraType = null,
        extraRuns = 0,
        commentary = ''
    } = ballData;

    // Force strict number types to avoid string concatenation
    runsScored = Number(runsScored);
    extraRuns = Number(extraRuns);
    matchId = Number(matchId);
    inningsId = Number(inningsId);
    batsmanId = Number(batsmanId);
    bowlerId = Number(bowlerId);

    console.log(`🏏 ScoringService: Recording ball [${overNumber}.${ballNumber}] Runs: ${runsScored} Extra: ${extraRuns}`);

    // Get current innings state
    const innings = await Innings.findByPk(inningsId);
    if (!innings) throw new Error('Innings not found');

    // Calculate total runs for this ball
    const totalRuns = runsScored + extraRuns;

    // Determine if it's a legal delivery
    const isLegalDelivery = !isExtra || (extraType !== 'Wide' && extraType !== 'NoBall');

    // Determine boundary type
    let isBoundary = false;
    let boundaryType = null;
    if (runsScored === 4) {
        isBoundary = true;
        boundaryType = 'Four';
    } else if (runsScored === 6) {
        isBoundary = true;
        boundaryType = 'Six';
    }

    // Update team score
    const newTeamScore = innings.TotalRuns + totalRuns;
    const newTeamWickets = innings.TotalWickets + (isWicket ? 1 : 0);

    // Create ball record
    const ball = await BallByBall.create({
        InningsID: inningsId,
        MatchID: matchId,
        OverNumber: overNumber,
        BallNumber: ballNumber,
        BatsmanID: batsmanId,
        BatsmanEndID: batsmanEndId,
        BowlerID: bowlerId,
        RunsScored: runsScored,
        IsWicket: isWicket,
        WicketType: wicketType,
        DismissedPlayerID: dismissedPlayerId,
        FielderID: fielderId,
        IsExtra: isExtra,
        ExtraType: extraType,
        ExtraRuns: extraRuns,
        TotalRuns: totalRuns,
        IsBoundary: isBoundary,
        BoundaryType: boundaryType,
        IsLegalDelivery: isLegalDelivery,
        Commentary: commentary,
        TeamScore: newTeamScore,
        TeamWickets: newTeamWickets
    });

    // Update innings totals
    const updateData = {
        TotalRuns: newTeamScore,
        TotalWickets: newTeamWickets
    };

    // Auto-complete innings if all out (10 wickets)
    if (newTeamWickets >= 10) {
        updateData.IsCompleted = true;
        updateData.IsAllOut = true;
    }

    if (isLegalDelivery) {
        updateData.TotalBalls = innings.TotalBalls + 1;
        updateData.TotalOvers = exports.ballsToOvers(innings.TotalBalls + 1);
    }

    if (isExtra) {
        updateData.Extras = innings.Extras + extraRuns;
        if (extraType === 'Wide') updateData.Wides = innings.Wides + extraRuns;
        if (extraType === 'NoBall') updateData.NoBalls = innings.NoBalls + extraRuns;
        if (extraType === 'Bye') updateData.Byes = innings.Byes + extraRuns;
        if (extraType === 'LegBye') updateData.LegByes = innings.LegByes + extraRuns;
    }

    // Calculate run rate
    if (updateData.TotalOvers > 0) {
        updateData.RunRate = Number((newTeamScore / updateData.TotalOvers).toFixed(2));
    }

    // Calculate required run rate for 2nd innings
    if (innings.InningsNumber === 2 && innings.TargetScore) {
        const match = await Match.findByPk(matchId);
        const remainingRuns = innings.TargetScore - newTeamScore;
        const remainingOvers = match.OversPerSide - updateData.TotalOvers;
        if (remainingOvers > 0) {
            updateData.RequiredRunRate = Number((remainingRuns / remainingOvers).toFixed(2));
        }
    }

    await innings.update(updateData);

    await updatePlayerStats(matchId, batsmanId, bowlerId, { ...ballData, isLegalDelivery }, innings.BattingTeamID, innings.BowlingTeamID);

    return ball;
};

/**
 * Undo last ball for a match
 */
exports.undoLastBall = async (matchId) => {
    // 1. Get the very last ball across all innings for this match
    const lastBall = await BallByBall.findOne({
        where: { MatchID: matchId },
        order: [['BallID', 'DESC']]
    });

    if (!lastBall) throw new Error('No balls found to undo');

    const inningsId = lastBall.InningsID;
    const innings = await Innings.findByPk(inningsId);
    if (!innings) throw new Error('Innings for this ball not found');

    // 2. Revert Innings Stats
    const totalRunsToSubtract = lastBall.TotalRuns;
    const wicketToSubtract = lastBall.IsWicket ? 1 : 0;
    const extraRunsToSubtract = lastBall.ExtraRuns;
    const isLegal = lastBall.IsLegalDelivery;

    const updateData = {
        TotalRuns: Math.max(0, innings.TotalRuns - totalRunsToSubtract),
        TotalWickets: Math.max(0, innings.TotalWickets - wicketToSubtract),
        Extras: Math.max(0, innings.Extras - extraRunsToSubtract)
    };

    if (isLegal) {
        updateData.TotalBalls = Math.max(0, innings.TotalBalls - 1);
        updateData.TotalOvers = exports.ballsToOvers(updateData.TotalBalls);
    }

    if (lastBall.IsExtra) {
        if (lastBall.ExtraType === 'Wide') updateData.Wides = Math.max(0, innings.Wides - extraRunsToSubtract);
        if (lastBall.ExtraType === 'NoBall') updateData.NoBalls = Math.max(0, innings.NoBalls - extraRunsToSubtract);
        if (lastBall.ExtraType === 'Bye') updateData.Byes = Math.max(0, innings.Byes - extraRunsToSubtract);
        if (lastBall.ExtraType === 'LegBye') updateData.LegByes = Math.max(0, innings.LegByes - extraRunsToSubtract);
    }

    // Recalculate RR
    if (updateData.TotalOvers > 0) {
        updateData.RunRate = Number((updateData.TotalRuns / updateData.TotalOvers).toFixed(2));
    } else {
        updateData.RunRate = 0;
    }

    // 3. Revert Player Stats
    // Batsman
    const batsmanStats = await PlayerMatchStats.findOne({
        where: { MatchID: matchId, PlayerID: lastBall.BatsmanID }
    });

    if (batsmanStats) {
        const bUpdate = {
            RunsScored: Math.max(0, batsmanStats.RunsScored - lastBall.RunsScored),
            BallsFaced: Math.max(0, batsmanStats.BallsFaced - (isLegal ? 1 : 0))
        };
        if (lastBall.BoundaryType === 'Four') bUpdate.Fours = Math.max(0, batsmanStats.Fours - 1);
        if (lastBall.BoundaryType === 'Six') bUpdate.Sixes = Math.max(0, batsmanStats.Sixes - 1);

        if (bUpdate.BallsFaced > 0) {
            bUpdate.StrikeRate = exports.calculateStrikeRate(bUpdate.RunsScored, bUpdate.BallsFaced);
        } else {
            bUpdate.StrikeRate = 0;
        }

        // If this ball was the batsman's dismissal, revert IsOut
        if (lastBall.IsWicket && lastBall.DismissedPlayerID === lastBall.BatsmanID) {
            bUpdate.IsOut = false;
            bUpdate.HowOut = null;
        }

        await batsmanStats.update(bUpdate);
    }

    // If dismissed player was NOT the primary batsman of the ball (e.g. Run Out at non-striker end)
    if (lastBall.IsWicket && lastBall.DismissedPlayerID && lastBall.DismissedPlayerID !== lastBall.BatsmanID) {
        const dismissedStats = await PlayerMatchStats.findOne({
            where: { MatchID: matchId, PlayerID: lastBall.DismissedPlayerID }
        });
        if (dismissedStats) {
            await dismissedStats.update({ IsOut: false, HowOut: null });
        }
    }

    // Bowler
    const bowlerStats = await PlayerMatchStats.findOne({
        where: { MatchID: matchId, PlayerID: lastBall.BowlerID }
    });

    if (bowlerStats) {
        const runsToSubtractFromBowler = lastBall.RunsScored + (lastBall.IsExtra && lastBall.ExtraType !== 'Bye' && lastBall.ExtraType !== 'LegBye' ? lastBall.ExtraRuns : 0);
        const wUpdate = {
            RunsConceded: Math.max(0, bowlerStats.RunsConceded - runsToSubtractFromBowler),
            BallsBowled: Math.max(0, bowlerStats.BallsBowled - (isLegal ? 1 : 0)),
            WicketsTaken: Math.max(0, bowlerStats.WicketsTaken - (lastBall.IsWicket && ['Bowled', 'Caught', 'LBW', 'Stumped', 'HitWicket'].includes(lastBall.WicketType) ? 1 : 0))
        };

        if (lastBall.IsExtra) {
            if (lastBall.ExtraType === 'Wide') wUpdate.Wides = Math.max(0, bowlerStats.Wides - 1);
            if (lastBall.ExtraType === 'NoBall') wUpdate.NoBalls = Math.max(0, bowlerStats.NoBalls - 1);
        }

        wUpdate.OversBowled = exports.ballsToOvers(wUpdate.BallsBowled);
        if (wUpdate.OversBowled > 0) {
            wUpdate.Economy = exports.calculateEconomy(wUpdate.RunsConceded, wUpdate.OversBowled);
        } else {
            wUpdate.Economy = 0;
        }

        await bowlerStats.update(wUpdate);
    }

    // 4. Revert Fielder Stats
    if (lastBall.IsWicket && lastBall.FielderID) {
        const fielderStats = await PlayerMatchStats.findOne({
            where: { MatchID: matchId, PlayerID: lastBall.FielderID }
        });
        if (fielderStats) {
            if (lastBall.WicketType === 'Caught') await fielderStats.decrement('Catches');
            if (lastBall.WicketType === 'Stumped') await fielderStats.decrement('Stumpings');
            if (lastBall.WicketType === 'RunOut') await fielderStats.decrement('RunOuts');
        }
    }

    // 5. Update Innings and Delete Ball
    await innings.update(updateData);
    await lastBall.destroy();

    return { success: true, undoneBall: lastBall };
}

/**
 * Update player statistics after a ball
 */
async function updatePlayerStats(matchId, batsmanId, bowlerId, ballData, battingTeamId, bowlingTeamId) {
    const { runsScored, isWicket, isExtra, extraType, boundaryType, wicketType, dismissedPlayerId, fielderId } = ballData;

    // 1. Update/Create Batsman Stats
    let batsmanStats = await PlayerMatchStats.findOne({ where: { MatchID: matchId, PlayerID: batsmanId } });
    if (!batsmanStats) {
        batsmanStats = await PlayerMatchStats.create({
            MatchID: matchId,
            PlayerID: batsmanId,
            TeamID: battingTeamId,
            RunsScored: 0,
            BallsFaced: 0,
            Fours: 0,
            Sixes: 0,
            StrikeRate: 0,
            IsOut: false
        });
    }

    if (batsmanStats) {
        const bUpdate = {
            RunsScored: batsmanStats.RunsScored + runsScored,
            BallsFaced: batsmanStats.BallsFaced + (ballData.isLegalDelivery ? 1 : 0)
        };
        if (boundaryType === 'Four') bUpdate.Fours = batsmanStats.Fours + 1;
        if (boundaryType === 'Six') bUpdate.Sixes = batsmanStats.Sixes + 1;
        if (bUpdate.BallsFaced > 0) bUpdate.StrikeRate = exports.calculateStrikeRate(bUpdate.RunsScored, bUpdate.BallsFaced);
        await batsmanStats.update(bUpdate);
    }

    // 2. Handle Wicket (Dismissed Player & Fielder)
    if (isWicket && dismissedPlayerId) {
        let dismissedStats = await PlayerMatchStats.findOne({ where: { MatchID: matchId, PlayerID: dismissedPlayerId } });
        // NOTE: If dismissed player has no stats yet (e.g. Diamond Duck), we must create them.
        // Assuming dismissed player is from Batting Team.
        if (!dismissedStats) {
            dismissedStats = await PlayerMatchStats.create({
                MatchID: matchId,
                PlayerID: dismissedPlayerId,
                TeamID: battingTeamId,
                RunsScored: 0,
                BallsFaced: 0,
                IsOut: false
            });
        }

        if (dismissedStats) {
            let howOutStr = 'out';
            const bowler = await PlayerMaster.findByPk(bowlerId);
            const fielder = fielderId ? await PlayerMaster.findByPk(fielderId) : null;
            const bowlerName = bowler ? bowler.Name : 'Bowler';
            const fielderName = fielder ? fielder.Name : 'Fielder';

            switch (wicketType) {
                case 'Bowled': howOutStr = `b ${bowlerName}`; break;
                case 'Caught': howOutStr = `c ${fielderName} b ${bowlerName}`; break;
                case 'LBW': howOutStr = `lbw b ${bowlerName}`; break;
                case 'Stumped': howOutStr = `st ${fielderName} b ${bowlerName}`; break;
                case 'RunOut': howOutStr = `run out (${fielderName})`; break;
                case 'HitWicket': howOutStr = `hit wicket b ${bowlerName}`; break;
                default: howOutStr = 'out';
            }
            await dismissedStats.update({ IsOut: true, HowOut: howOutStr });
        }

        // Credit Fielder (TeamID is Bowling Team)
        if (fielderId) {
            let fielderStats = await PlayerMatchStats.findOne({ where: { MatchID: matchId, PlayerID: fielderId } });
            if (!fielderStats) {
                fielderStats = await PlayerMatchStats.create({
                    MatchID: matchId,
                    PlayerID: fielderId,
                    TeamID: bowlingTeamId,
                    RunsScored: 0,
                    BallsFaced: 0
                });
            }

            if (fielderStats) {
                if (wicketType === 'Caught') await fielderStats.increment('Catches');
                if (wicketType === 'Stumped') await fielderStats.increment('Stumpings');
                if (wicketType === 'RunOut') await fielderStats.increment('RunOuts');
            }
        }
    }

    // 3. Update Bowler Stats
    let bowlerStats = await PlayerMatchStats.findOne({ where: { MatchID: matchId, PlayerID: bowlerId } });
    if (!bowlerStats) {
        bowlerStats = await PlayerMatchStats.create({
            MatchID: matchId,
            PlayerID: bowlerId,
            TeamID: bowlingTeamId,
            RunsConceded: 0,
            BallsBowled: 0,
            WicketsTaken: 0,
            OversBowled: 0,
            Economy: 0
        });
    }

    if (bowlerStats) {
        const runsToSubtractFromBowler = runsScored + (isExtra && extraType !== 'Bye' && extraType !== 'LegBye' ? ballData.extraRuns : 0);
        const wUpdate = {
            RunsConceded: bowlerStats.RunsConceded + runsToSubtractFromBowler,
            BallsBowled: bowlerStats.BallsBowled + (ballData.isLegalDelivery ? 1 : 0)
        };
        if (isWicket && ['Bowled', 'Caught', 'LBW', 'Stumped', 'HitWicket'].includes(wicketType)) {
            wUpdate.WicketsTaken = bowlerStats.WicketsTaken + 1;
        }
        if (isExtra) {
            if (extraType === 'Wide') wUpdate.Wides = (bowlerStats.Wides || 0) + 1;
            if (extraType === 'NoBall') wUpdate.NoBalls = (bowlerStats.NoBalls || 0) + 1;
        }
        wUpdate.OversBowled = exports.ballsToOvers(wUpdate.BallsBowled);
        if (wUpdate.OversBowled > 0) wUpdate.Economy = exports.calculateEconomy(wUpdate.RunsConceded, wUpdate.OversBowled);
        await bowlerStats.update(wUpdate);
    }
}

/**
 * Complete an over
 */
exports.completeOver = async (inningsId, overNumber) => {
    const balls = await BallByBall.findAll({
        where: { InningsID: inningsId, OverNumber: overNumber },
        order: [['BallNumber', 'ASC']]
    });

    const legalBalls = balls.filter(b => b.IsLegalDelivery);
    const totalRuns = balls.reduce((sum, b) => sum + b.TotalRuns, 0);
    const wickets = balls.filter(b => b.IsWicket).length;

    // Check if it's a maiden over (no runs and legal deliveries = 6)
    const isMaiden = totalRuns === 0 && legalBalls.length === 6;

    return {
        overNumber,
        balls: balls.length,
        legalBalls: legalBalls.length,
        runs: totalRuns,
        wickets,
        isMaiden
    };
};

/**
 * Calculate partnership between two batsmen
 */
exports.calculatePartnership = async (inningsId, batsman1Id, batsman2Id) => {
    const balls = await BallByBall.findAll({
        where: {
            InningsID: inningsId,
            BatsmanID: [batsman1Id, batsman2Id]
        },
        order: [['BallID', 'ASC']]
    });

    let runs = 0;
    let ballsFaced = 0;

    for (const ball of balls) {
        runs += ball.RunsScored;
        if (ball.IsLegalDelivery) ballsFaced++;

        // Stop if either batsman got out
        if (ball.IsWicket && (ball.DismissedPlayerID === batsman1Id || ball.DismissedPlayerID === batsman2Id)) {
            break;
        }
    }

    return { runs, balls: ballsFaced };
};

/**
 * Get fall of wickets for an innings
 */
exports.getFallOfWickets = async (inningsId) => {
    const wickets = await BallByBall.findAll({
        where: { InningsID: inningsId, IsWicket: true },
        include: [
            { model: PlayerMaster, as: 'DismissedPlayer' },
            { model: PlayerMaster, as: 'Bowler' }
        ],
        order: [['BallID', 'ASC']]
    });

    return wickets.map((w, index) => ({
        wicketNumber: index + 1,
        player: w.DismissedPlayer,
        score: w.TeamScore,
        overs: w.OverNumber + (w.BallNumber / 10),
        bowler: w.Bowler
    }));
};
