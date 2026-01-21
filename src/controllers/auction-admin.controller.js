function auctionAdmin(io, state, teamNamespace) {
    io.on('connection', (socket) => {
        console.log('Admin connected:', socket.id);

        socket.emit('players', state.players);
        socket.emit('teams', state.teams);
        socket.emit('currentPlayer', state.players[state.currentPlayerIndex]);

        socket.on('start-player', () => {
            const player = state.players[state.currentPlayerIndex];
            if (player.status === 'available') {
                player.status = 'live';
                player.currentBid = player.basePrice;
                player.highestBidTeam = null;
                state.secondsLeft = 30;

                broadcastAll(io, teamNamespace, 'currentPlayer', player);
                startTimer(io, teamNamespace, state);
            }
        });

        socket.on('skip-player', () => {
            const player = state.players[state.currentPlayerIndex];
            player.status = 'skipped';
            broadcastAll(io, teamNamespace, 'playerUpdate', player);
            nextPlayer(io, teamNamespace, state);
        });

        socket.on('sell-player', () => {
            const player = state.players[state.currentPlayerIndex];
            player.status = 'sold';
            const team = state.teams.find(t => t.id === player.highestBidTeam);
            if (team) {
                team.budget -= player.currentBid;
                broadcastAll(io, teamNamespace, 'teamUpdate', team);
            }
            broadcastAll(io, teamNamespace, 'playerUpdate', player);
            nextPlayer(io, teamNamespace, state);
        });
    });
}

function broadcastAll(adminIo, teamNamespace, event, data) {
    adminIo.emit(event, data);
    teamNamespace.emit(event, data);
}

function startTimer(io, teamNamespace, state) {
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(() => {
        state.secondsLeft--;
        broadcastAll(io, teamNamespace, 'timerUpdate', { timeLeft: state.secondsLeft });

        if (state.secondsLeft <= 0) {
            clearInterval(state.timer);
            const player = state.players[state.currentPlayerIndex];
            if (player.highestBidTeam) {
                player.status = 'sold';
                const team = state.teams.find(t => t.id === player.highestBidTeam);
                if (team) team.budget -= player.currentBid;
                broadcastAll(io, teamNamespace, 'teamUpdate', team);
            } else {
                player.status = 'skipped';
            }
            broadcastAll(io, teamNamespace, 'playerUpdate', player);
            nextPlayer(io, teamNamespace, state);
        }
    }, 1000);
}

function nextPlayer(io, teamNamespace, state) {
    state.currentPlayerIndex++;
    if (state.currentPlayerIndex >= state.players.length) {
        broadcastAll(io, teamNamespace, 'auctionEnd', {});
        clearInterval(state.timer);
        return;
    }

    const next = state.players[state.currentPlayerIndex];
    next.status = 'available';
    broadcastAll(io, teamNamespace, 'currentPlayer', next);
    state.secondsLeft = 30;
}

module.exports = auctionAdmin;
