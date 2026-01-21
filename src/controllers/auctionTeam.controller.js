const AuctionTeamService = require('../services/auctionTeam.service');

exports.joinRoom = (socket, teamId) => {
    socket.join(teamId);
    console.log(`✅ Socket ${socket.id} joined room ${teamId}`);
};

exports.placeBid = (socket, { teamId, playerId, bidAmount }, state) => {
    const player = state.players[state.currentPlayerIndex];

    if (!player || player.id !== playerId || player.status !== 'live') {
        return socket.emit('bidRejected', { reason: 'Invalid player or status' });
    }

    const team = state.teams.find(t => t.id === teamId);
    const validation = AuctionTeamService.validateBid(player, team, bidAmount);

    if (!validation.valid) {
        return socket.emit('bidRejected', { reason: validation.reason });
    }

    // ✅ Update state
    player.currentBid = bidAmount;
    player.highestBidTeam = teamId;

    const bidInfo = { teamName: team.name, amount: bidAmount };

    // ✅ Broadcast updates
    state.teamNamespace.emit('playerUpdate', player);
    state.adminNamespace.emit('playerUpdate', player);

    state.teamNamespace.emit('bidUpdate', bidInfo);
    state.adminNamespace.emit('bidUpdate', bidInfo);
};
