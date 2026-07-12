const { AuctionSession, AuctionPlayer, AuctionTeam, AuctionBid, AuctionLog, PlayerMaster, TeamMaster } = require('../models');

const DEFAULT_BID_DURATION_SECONDS = 30;

/**
 * Central in-memory auction state manager.
 * Each active session has its own state object stored here.
 * Bids are written to DB on every placement (not just on sell).
 */
const sessionStates = {};

/**
 * Simple Mulberry32 seeded PRNG
 */
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

/**
 * Shuffle array using seeded randomizer
 */
function shuffleWithSeed(array, seed) {
    const random = mulberry32(seed);
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Load a session's full state from the database.
 * Returns the state object for the session.
 */
async function loadSessionState(sessionId) {
    const session = await AuctionSession.findByPk(sessionId);
    if (!session) throw new Error(`Auction session ${sessionId} not found`);

    let players = await AuctionPlayer.findAll({
        where: {
            SessionID: sessionId,
            ApprovalStatus: 'approved',
            PaymentStatus: 'paid'
        },
        include: [{ model: PlayerMaster, attributes: ['PlayerID', 'Name', 'Role', 'PhotoURL', 'BattingStyle', 'BowlingStyle', 'CanCaptain'] }],
        order: [['AuctionPlayerID', 'ASC']]
    });

    // Randomize player order consistently for the session
    players = shuffleWithSeed(players, parseInt(sessionId, 10));

    const rawTeams = await AuctionTeam.findAll({
        where: { SessionID: sessionId },
        include: [{ model: TeamMaster, attributes: ['TeamID', 'Name', 'LogoURL'] }]
    });

    // Only include teams where the owner is approved and paid
    const { Owner } = require('../models');
    const approvedOwners = await Owner.findAll({
        where: {
            VerificationStatus: 'approved',
            FeePaymentStatus: 'paid'
        },
        attributes: ['TeamID']
    });
    const approvedTeamIds = new Set(approvedOwners.map(o => o.TeamID).filter(id => id !== null));
    const teams = rawTeams.filter(t => approvedTeamIds.has(t.TeamID));

    const state = {
        sessionId,
        session,
        players: players.map(p => ({
            auctionPlayerId: p.AuctionPlayerID,
            playerId: p.PlayerID,
            name: p.PlayerMaster?.Name || 'Unknown',
            role: p.PlayerMaster?.Role || '',
            photo: p.PlayerMaster?.PhotoURL || null,
            battingStyle: p.PlayerMaster?.BattingStyle || '',
            bowlingStyle: p.PlayerMaster?.BowlingStyle || '',
            canCaptain: p.PlayerMaster?.CanCaptain || false,
            basePrice: p.BasePrice,
            currentBid: p.CurrentBid || p.BasePrice,
            highestBidTeamId: p.HighestBidTeamID || null,
            status: p.Status || 'available',
        })),
        teams: teams.map(t => ({
            auctionTeamId: t.AuctionTeamID,
            teamId: t.TeamID,
            name: t.TeamMaster?.Name || 'Team',
            logo: t.TeamMaster?.LogoURL || null,
            budget: t.Budget || session.MaxBudget,
            remainingBudget: t.RemainingBudget !== null ? parseFloat(t.RemainingBudget) : parseFloat(session.MaxBudget),
            playersCount: t.PlayersCount || 0,
        })),
        currentPlayerIndex: 0,
        timer: null,
        secondsLeft: DEFAULT_BID_DURATION_SECONDS,
        namespace: null, // Will be set to the socket namespace when first used
    };

    // Find the first available/live player index
    const liveIndex = state.players.findIndex(p => p.status === 'live');
    const availableIndex = state.players.findIndex(p => p.status === 'available');
    if (liveIndex >= 0) {
        state.currentPlayerIndex = liveIndex;
    } else if (availableIndex >= 0) {
        state.currentPlayerIndex = availableIndex;
    } else {
        // All players done
        state.currentPlayerIndex = state.players.length;
    }

    return state;
}

/**
 * Get or create a session state (lazy-loads from DB).
 */
async function getSessionState(sessionId) {
    if (!sessionStates[sessionId]) {
        sessionStates[sessionId] = await loadSessionState(sessionId);
    }
    return sessionStates[sessionId];
}

/**
 * Get state synchronously — returns null if not yet loaded into memory.
 * Use this to mutate state without triggering a DB load.
 */
function getSessionStateSync(sessionId) {
    return sessionStates[sessionId] || null;
}

/**
 * Broadcast an event to all clients in the session room.
 * Also broadcasts to the read-only public board room.
 */
function broadcast(state, event, data) {
    if (state.namespace) {
        state.namespace.to(`session-${state.sessionId}`).emit(event, data);
    }
    if (global._broadcastToBoard) {
        global._broadcastToBoard(state.namespace?.server || require('../app').io, state.sessionId, event, data);
    }
}

/**
 * Start or restart the bid timer for the current player.
 */
function startBidTimer(state) {
    if (state.timer) clearInterval(state.timer);
    state.secondsLeft = DEFAULT_BID_DURATION_SECONDS;

    broadcast(state, 'timer-tick', { secondsLeft: state.secondsLeft });

    state.timer = setInterval(async () => {
        state.secondsLeft--;
        broadcast(state, 'timer-tick', { secondsLeft: state.secondsLeft });

        if (state.secondsLeft <= 0) {
            clearInterval(state.timer);
            state.timer = null;
            await handleTimerExpiry(state);
        }
    }, 1000);
}

/**
 * Stop the bid timer.
 */
function stopBidTimer(state) {
    if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
    }
}

/**
 * When timer hits zero: if there's a highest bidder, auto-sell; else mark unsold.
 */
async function handleTimerExpiry(state) {
    const player = state.players[state.currentPlayerIndex];
    if (!player) return;

    if (player.highestBidTeamId) {
        await persistSellPlayer(state, player, player.highestBidTeamId, player.currentBid);
        broadcast(state, 'player-sold', {
            player,
            teamId: player.highestBidTeamId,
            soldPrice: player.currentBid,
            reason: 'timer-expired',
            teams: state.teams,
        });
    } else {
        await persistMarkUnsold(state, player);
        broadcast(state, 'player-unsold', { player, reason: 'timer-expired' });
    }
    broadcast(state, 'timer-expired', {});
}

/**
 * Validate and place a bid. Returns { success, reason }.
 */
async function placeBid(state, teamId, playerId, bidAmount) {
    const player = state.players[state.currentPlayerIndex];
    if (!player || player.playerId !== playerId) {
        return { success: false, reason: 'This player is not currently up for auction' };
    }
    if (player.status !== 'live') {
        return { success: false, reason: `Player is not live (status: ${player.status})` };
    }

    const team = state.teams.find(t => t.teamId === teamId);
    if (!team) {
        return { success: false, reason: 'Your team is not registered for this auction' };
    }

    if (bidAmount <= player.currentBid) {
        return { success: false, reason: `Bid must be higher than current bid of ₹${player.currentBid}` };
    }

    if (bidAmount > team.remainingBudget) {
        return { success: false, reason: `Insufficient budget. Remaining: ₹${team.remainingBudget}` };
    }

    const maxPlayers = state.session.MaxPlayersPerTeam;
    if (team.playersCount >= maxPlayers) {
        return { success: false, reason: `You have reached the maximum squad size of ${maxPlayers} players` };
    }

    // Apply bid to in-memory state
    player.currentBid = bidAmount;
    player.highestBidTeamId = teamId;

    // Persist bid record to DB
    try {
        await AuctionBid.create({
            SessionID: state.sessionId,
            PlayerID: playerId,
            TeamID: teamId,
            BidAmount: bidAmount,
        });

        // Update AuctionPlayer current bid in DB
        await AuctionPlayer.update(
            { CurrentBid: bidAmount, HighestBidTeamID: teamId },
            { where: { SessionID: state.sessionId, PlayerID: playerId } }
        );
    } catch (err) {
        console.error('Failed to persist bid to DB:', err.message);
        // Don't fail the bid — it's still applied in-memory
    }

    // Reset timer on each new bid
    startBidTimer(state);

    return { success: true };
}

/**
 * Start a player for bidding (Admin action).
 */
async function startPlayer(state) {
    const player = state.players[state.currentPlayerIndex];
    if (!player) return { success: false, reason: 'No more players in pool' };
    if (player.status === 'live') return { success: false, reason: 'Player is already live' };

    player.status = 'live';
    player.currentBid = player.basePrice;
    player.highestBidTeamId = null;

    await AuctionPlayer.update(
        { Status: 'live', CurrentBid: player.basePrice, HighestBidTeamID: null },
        { where: { SessionID: state.sessionId, PlayerID: player.playerId } }
    );

    await logAuctionEvent(state.sessionId, 'player-started', null, player.playerId,
        `Player ${player.name} started for bidding at base price ₹${player.basePrice}`);

    startBidTimer(state);
    return { success: true, player };
}

/**
 * Skip the current player (Admin action — marks as skipped, moves to next).
 */
async function skipPlayer(state) {
    const player = state.players[state.currentPlayerIndex];
    if (!player) return { success: false, reason: 'No current player' };

    stopBidTimer(state);
    player.status = 'skipped';

    await AuctionPlayer.update(
        { Status: 'skipped' },
        { where: { SessionID: state.sessionId, PlayerID: player.playerId } }
    );

    await logAuctionEvent(state.sessionId, 'player-skipped', null, player.playerId,
        `Player ${player.name} skipped`);

    advanceToNextPlayer(state);
    return { success: true };
}

/**
 * Sell the current player to the highest bidder (Admin action).
 */
async function sellPlayer(state, teamId, finalBid) {
    const player = state.players[state.currentPlayerIndex];
    if (!player) return { success: false, reason: 'No current player' };
    if (!teamId) return { success: false, reason: 'No team specified' };

    stopBidTimer(state);
    await persistSellPlayer(state, player, teamId, finalBid);
    return { success: true, player, teams: state.teams };
}

/**
 * Mark current player unsold (Admin action).
 */
async function markUnsold(state) {
    const player = state.players[state.currentPlayerIndex];
    if (!player) return { success: false, reason: 'No current player' };

    stopBidTimer(state);
    await persistMarkUnsold(state, player);
    return { success: true };
}

/**
 * Write a sell result to the database and update in-memory state.
 */
async function persistSellPlayer(state, player, teamId, finalBid) {
    player.status = 'sold';
    player.currentBid = finalBid;
    player.highestBidTeamId = teamId;

    const team = state.teams.find(t => t.teamId === teamId);
    if (team) {
        team.remainingBudget -= finalBid;
        team.playersCount += 1;
    }

    await AuctionPlayer.update(
        { Status: 'sold', SoldPrice: finalBid, TeamID: teamId, CurrentBid: finalBid, HighestBidTeamID: teamId },
        { where: { SessionID: state.sessionId, PlayerID: player.playerId } }
    );

    if (team) {
        await AuctionTeam.update(
            { RemainingBudget: team.remainingBudget, PlayersCount: team.playersCount },
            { where: { SessionID: state.sessionId, TeamID: teamId } }
        );
    }

    await logAuctionEvent(state.sessionId, 'player-sold', teamId, player.playerId,
        `Player ${player.name} sold to team ${teamId} for ₹${finalBid}`);

    advanceToNextPlayer(state);
}

/**
 * Write an unsold result to the database and update in-memory state.
 */
async function persistMarkUnsold(state, player) {
    player.status = 'unsold';

    await AuctionPlayer.update(
        { Status: 'unsold' },
        { where: { SessionID: state.sessionId, PlayerID: player.playerId } }
    );

    await logAuctionEvent(state.sessionId, 'player-unsold', null, player.playerId,
        `Player ${player.name} went unsold`);

    advanceToNextPlayer(state);
}

/**
 * Move the session index to the next available player.
 */
function advanceToNextPlayer(state) {
    state.currentPlayerIndex++;
    // Skip past already-processed players
    while (
        state.currentPlayerIndex < state.players.length &&
        ['sold', 'skipped', 'unsold'].includes(state.players[state.currentPlayerIndex]?.status)
    ) {
        state.currentPlayerIndex++;
    }
}

/**
 * Write to the AuctionLogs table.
 */
async function logAuctionEvent(sessionId, event, teamId, playerId, message) {
    try {
        await AuctionLog.create({ event, SessionID: sessionId, TeamID: teamId || null, PlayerID: playerId || null, message });
    } catch (err) {
        console.error('Failed to write auction log:', err.message);
    }
}

/**
 * Clean up a session state from memory.
 */
function clearSessionState(sessionId) {
    const state = sessionStates[sessionId];
    if (state) {
        stopBidTimer(state);
        delete sessionStates[sessionId];
    }
}

module.exports = {
    getSessionState,
    getSessionStateSync,
    loadSessionState,
    clearSessionState,
    broadcast,
    startPlayer,
    skipPlayer,
    sellPlayer,
    markUnsold,
    placeBid,
    startBidTimer,
    stopBidTimer,
};
