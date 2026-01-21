const AuctionController = require('../../controllers/auction.controller');

module.exports = function auctionAdmin(socket,state, teamNamespace) {

  socket.emit('players', state.players);
  socket.emit('teams', state.teams);
  socket.emit('currentPlayer', state.players[state.currentPlayerIndex]);

  socket.on('start-player', () => AuctionController.startPlayer(socket, teamNamespace, state));
  socket.on('skip-player', () => AuctionController.skipPlayer(socket, teamNamespace, state));
  socket.on('sell-player', () => AuctionController.sellPlayer(socket, teamNamespace, state));

};
