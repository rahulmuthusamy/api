exports.validateBid = (player, team, bidAmount) => {
    if (!team) {
        return { valid: false, reason: 'Team not found' };
    }

    if (bidAmount <= player.currentBid) {
        return { valid: false, reason: 'Bid must be higher than current bid' };
    }

    if (team.budget < bidAmount) {
        return { valid: false, reason: 'Insufficient budget' };
    }

    return { valid: true };
};
