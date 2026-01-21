const auctionAdmin = require('./namespaces/auction.admin');
const auctionTeam = require('./namespaces/auction.team');
const { AuctionPlayer, AuctionTeam } = require('../models');

const sessionStates = {}; // Store state for each sessionId

module.exports = function initializeSockets(io) {
    const adminNamespace = io.of('/auction-admin');
    const teamNamespace = io.of('/auction-team');

    adminNamespace.on('connection', (socket) => {
        console.log('🧑‍⚖️ Admin connected:', socket.id);

        socket.on('join-session', async (sessionId) => {
            console.log(`Admin joined session: ${sessionId}`);

            if (!sessionStates[sessionId]) {
                const state = await loadAuctionState(sessionId);
                sessionStates[sessionId] = state;
            }
            sessionStates[sessionId].adminNamespace = adminNamespace;
            sessionStates[sessionId].teamNamespace = teamNamespace;

            auctionAdmin(socket, sessionStates[sessionId], teamNamespace);
        });
    });

    // TEAM CONNECT
    teamNamespace.on('connection', (socket) => {
        console.log('🧑‍🤝‍🧑 Team connected:', socket.id);

        socket.on('join-session', async (sessionId) => {
            console.log(`Team joined session: ${sessionId}`);

            if (!sessionStates[sessionId]) {
                const state = await loadAuctionState(sessionId);
                sessionStates[sessionId] = {
                    ...state,
                    adminNamespace,
                    teamNamespace
                }
            }

            auctionTeam(socket, sessionStates[sessionId]);
        });
    });
};

/**
 * Loads players and teams for a specific auction session
 * @param {number} sessionId
 */
async function loadAuctionState(sessionId) {
    const players = await AuctionPlayer.findAll({
        where: { SessionID: sessionId },
        include: ['PlayerMaster'],
    });

    // const teams = await AuctionTeam.findAll({
    //     where: { SessionID: sessionId },
    //     include: ['TeamMaster'],
    // });



    return {
        players: players.map(p => ({
            id: p.AuctionPlayerID,
            name: p.PlayerMaster?.Name || 'Unknown',
            basePrice: p.BasePrice,
            currentBid: p.CurrentBid || p.BasePrice,
            status: p.Status,
            highestBidTeam: p.HighestBidTeamID,
            photo: p.PlayerMaster?.Photo || null,
        })),
        teams: [
            { id: 1, name: "KKK Juniors", budget: 20000 },
            { id: 2, name: "KKK Legends", budget: 15000 },
            { id: 3, name: "Maveric Strikers", budget: 20000 },
            { id: 4, name: "Seven Stars", budget: 20000 },
            { id: 5, name: "Power Hitters", budget: 20000 },
            { id: 6, name: "GJ Wariers", budget: 20000 },
        ],
        // teams: teams.map(t => ({
        //     id: t.AuctionTeamID,
        //     name: t.Team?.Name || 'Team',
        //     budget: t.Budget,
        // })),
        currentPlayerIndex: 0,
        timer: null,
        secondsLeft: 30
    };
}
