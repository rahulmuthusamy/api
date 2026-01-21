function auctionTeamDashboard(io, state) {
    io.on('connection', (socket) => {
        console.log('Team connected:', socket.id);

        socket.emit('teams', state.teams);
        socket.emit('players', state.players);
        socket.emit('currentPlayer', state.players[state.currentPlayerIndex]);

        socket.on('join-team-room', (teamId) => {
            socket.join(teamId);
        });

        socket.on('place-bid', ({ teamId, playerId, bidAmount }) => {
            const player = state.players[state.currentPlayerIndex];
            if (!player || player.id !== playerId || player.status !== 'live') return;

            const team = state.teams.find(t => t.id === teamId);
            if (!team || team.budget < bidAmount || bidAmount <= player.currentBid) {
                socket.emit('bidRejected', { reason: 'Invalid or insufficient bid' });
                return;
            }

            player.currentBid = bidAmount;
            player.highestBidTeam = teamId;

            io.emit('playerUpdate', player);
            // Broadcast to both teamNamespace and admin namespace
            state.teamNamespace.emit('bidUpdate', { teamName: team.name, amount: bidAmount });
            state.adminNamespace.emit('bidUpdate', { teamName: team.name, amount: bidAmount });

        });
    });
}

module.exports = auctionTeamDashboard;
