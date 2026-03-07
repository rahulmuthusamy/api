const auctionService = require('../../services/auction.service');

/**
 * Auction Socket Handler
 * Handles real-time bidding for auction sessions
 */
module.exports = function auctionSocketHandler(socket, sessionState) {
    const { sessionId } = sessionState;

    console.log(`📢 Auction socket connected for session ${sessionId}`);

    // Join auction room
    socket.join(`auction-${sessionId}`);

    /**
     * Place a bid
     */
    socket.on('place-bid', async (data) => {
        try {
            const { teamId, playerId, bidAmount } = data;

            // Validate bid
            const validation = await auctionService.validateBid(
                sessionId,
                teamId,
                playerId,
                bidAmount
            );

            if (!validation.success) {
                socket.emit('bid-error', { message: validation.message });
                return;
            }

            // Update current bid in session state
            if (!sessionState.currentBids) {
                sessionState.currentBids = {};
            }

            sessionState.currentBids[playerId] = {
                teamId,
                bidAmount,
                timestamp: new Date()
            };

            // Broadcast new bid to all clients
            socket.to(`auction-${sessionId}`).emit('new-bid', {
                playerId,
                teamId,
                bidAmount,
                timestamp: new Date()
            });

            // Send confirmation to bidder
            socket.emit('bid-placed', {
                playerId,
                bidAmount,
                message: 'Bid placed successfully'
            });

        } catch (error) {
            socket.emit('bid-error', { message: error.message });
        }
    });

    /**
     * Sell player (Admin only)
     */
    socket.on('sell-player', async (data) => {
        try {
            const { playerId, teamId, finalBid } = data;

            const result = await auctionService.sellPlayer(
                sessionId,
                playerId,
                teamId,
                finalBid
            );

            // Broadcast player sold to all clients
            socket.to(`auction-${sessionId}`).emit('player-sold', {
                playerId,
                teamId,
                soldPrice: finalBid,
                player: result.data.player,
                team: result.data.team
            });

            socket.emit('player-sold', {
                playerId,
                teamId,
                soldPrice: finalBid,
                player: result.data.player,
                team: result.data.team
            });

            // Clear current bids for this player
            if (sessionState.currentBids) {
                delete sessionState.currentBids[playerId];
            }

        } catch (error) {
            socket.emit('sell-error', { message: error.message });
        }
    });

    /**
     * Mark player as unsold (Admin only)
     */
    socket.on('mark-unsold', async (data) => {
        try {
            const { playerId } = data;

            await auctionService.markUnsold(sessionId, playerId);

            // Broadcast to all clients
            socket.to(`auction-${sessionId}`).emit('player-unsold', { playerId });
            socket.emit('player-unsold', { playerId });

            // Clear current bids
            if (sessionState.currentBids) {
                delete sessionState.currentBids[playerId];
            }

        } catch (error) {
            socket.emit('unsold-error', { message: error.message });
        }
    });

    /**
     * Start auction (Admin only)
     */
    socket.on('start-auction', async () => {
        try {
            await auctionService.startAuction(sessionId);

            // Broadcast to all clients
            socket.to(`auction-${sessionId}`).emit('auction-started', {
                sessionId,
                message: 'Auction has started'
            });

            socket.emit('auction-started', {
                sessionId,
                message: 'Auction has started'
            });

        } catch (error) {
            socket.emit('auction-error', { message: error.message });
        }
    });

    /**
     * Complete auction (Admin only)
     */
    socket.on('complete-auction', async () => {
        try {
            await auctionService.completeAuction(sessionId);

            // Broadcast to all clients
            socket.to(`auction-${sessionId}`).emit('auction-completed', {
                sessionId,
                message: 'Auction has been completed'
            });

            socket.emit('auction-completed', {
                sessionId,
                message: 'Auction has been completed'
            });

        } catch (error) {
            socket.emit('auction-error', { message: error.message });
        }
    });

    /**
     * Get current auction state
     */
    socket.on('get-auction-state', async () => {
        try {
            const results = await auctionService.getAuctionResults(sessionId);

            socket.emit('auction-state', results.data);

        } catch (error) {
            socket.emit('state-error', { message: error.message });
        }
    });

    /**
     * Disconnect
     */
    socket.on('disconnect', () => {
        console.log(`📢 Auction socket disconnected for session ${sessionId}`);
        socket.leave(`auction-${sessionId}`);
    });
};
