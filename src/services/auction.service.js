const { Player, Team } = require('../models');

exports.savePlayerStatus = async (player) => {
  await Player.update(
    {
      status: player.status,
      highestBidTeam: player.highestBidTeam || null,
      currentBid: player.currentBid || 0,
    },
    { where: { id: player.id } }
  );
};

exports.updateTeamBudget = async (team) => {
  await Team.update(
    { budget: team.budget },
    { where: { id: team.id } }
  );
};
