const AuctionService = require('../services/auction.service');

exports.startPlayer = (io, teamNamespace, state) => {
  const player = state.players[state.currentPlayerIndex];
  if (player.status === 'available') {
    player.status = 'live';
    player.currentBid = player.basePrice;
    player.highestBidTeam = null;
    state.secondsLeft = 30;

    broadcastAll(io, teamNamespace, 'currentPlayer', player);
    startTimer(io, teamNamespace, state);
  }
};

exports.skipPlayer = async (io, teamNamespace, state) => {
  const player = state.players[state.currentPlayerIndex];
  player.status = 'skipped';

  await AuctionService.savePlayerStatus(player); // Save to DB

  broadcastAll(io, teamNamespace, 'playerUpdate', player);
  nextPlayer(io, teamNamespace, state);
};

exports.sellPlayer = async (io, teamNamespace, state) => {
  const player = state.players[state.currentPlayerIndex];
  player.status = 'sold';

  const team = state.teams.find(t => t.id === player.highestBidTeam);
  if (team) {
    team.budget -= player.currentBid;
    broadcastAll(io, teamNamespace, 'teamUpdate', team);
    await AuctionService.updateTeamBudget(team);
  }

  await AuctionService.savePlayerStatus(player); // Save player as sold
  broadcastAll(io, teamNamespace, 'playerUpdate', player);
  nextPlayer(io, teamNamespace, state);
};

// ⏱️ TIMER LOGIC
function startTimer(io, teamNamespace, state) {
  if (state.timer) clearInterval(state.timer);

  state.timer = setInterval(async () => {
    state.secondsLeft--;
    broadcastAll(io, teamNamespace, 'timerUpdate', { timeLeft: state.secondsLeft });

    if (state.secondsLeft <= 0) {
      clearInterval(state.timer);

      const player = state.players[state.currentPlayerIndex];

      if (player.highestBidTeam) {
        // ✅ Sold case
        player.status = 'sold';
        const team = state.teams.find(t => t.id === player.highestBidTeam);
        if (team) {
          team.budget -= player.currentBid;
          broadcastAll(io, teamNamespace, 'teamUpdate', team);
          await AuctionService.updateTeamBudget(team);
        }
      } else {
      
        player.status = 'skipped';
      }

      //await AuctionService.savePlayerStatus(player);
      broadcastAll(io, teamNamespace, 'playerUpdate', player);

      nextPlayer(io, teamNamespace, state);
    }
  }, 1000);
}

// 👉 Proceed to next player or end
function nextPlayer(io, teamNamespace, state) {
  state.currentPlayerIndex++;
  clearInterval(state.timer);

  if (state.currentPlayerIndex >= state.players.length) {
    broadcastAll(io, teamNamespace, 'auctionEnd', {});
    return;
  }

  const next = state.players[state.currentPlayerIndex];
  next.status = 'available';
  state.secondsLeft = 30;

  broadcastAll(io, teamNamespace, 'currentPlayer', next);
}

// 🔁 Emit to both admin and team clients
function broadcastAll(io, teamNamespace, event, data) {
  io.emit(event, data);             // admin
  teamNamespace.emit(event, data);  // teams
}
