const AuctionTeamController = require('../../controllers/auctionTeam.controller');

module.exports = function auctionTeamDashboard(socket, state) {

    console.log('Team connected:', socket.id);

    socket.emit('teams', state.teams);
    socket.emit('players', state.players);
    socket.emit('currentPlayer', state.players[state.currentPlayerIndex]);

    socket.on('join-team-room', (teamId) =>
        AuctionTeamController.joinRoom(socket, teamId)
    );

    socket.on('place-bid', (data) =>
        AuctionTeamController.placeBid(socket, data, state)
    );
};
