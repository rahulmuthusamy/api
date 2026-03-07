const matchService = require('../../services/match.service');

/**
 * Live Scoring Socket Handler
 * Handles real-time match scoring and updates
 */
module.exports = function scoringSocketHandler(io) {
    const scoringNamespace = io.of('/live-scoring');

    scoringNamespace.on('connection', (socket) => {
        console.log('🏏 Live scoring socket connected:', socket.id);

        /**
         * Join a match room
         */
        socket.on('join-match', (matchId) => {
            socket.join(`match-${matchId}`);
            console.log(`Socket ${socket.id} joined match ${matchId}`);

            socket.emit('joined-match', {
                matchId,
                message: 'Successfully joined match room'
            });
        });

        /**
         * Leave a match room
         */
        socket.on('leave-match', (matchId) => {
            socket.leave(`match-${matchId}`);
            console.log(`Socket ${socket.id} left match ${matchId}`);
        });

        /**
         * Record a ball (Scorer only)
         */
        socket.on('record-ball', async (data) => {
            try {
                const {
                    matchId,
                    inningsId,
                    overNumber,
                    ballNumber,
                    batsmanId,
                    batsmanEndId,
                    bowlerId,
                    runsScored,
                    isWicket,
                    wicketType,
                    dismissedPlayerId,
                    fielderId,
                    isExtra,
                    extraType,
                    extraRuns,
                    isBoundary,
                    boundaryType,
                    commentary
                } = data;

                // Record the ball
                const result = await matchService.recordBall({
                    matchId,
                    inningsId,
                    overNumber,
                    ballNumber,
                    batsmanId,
                    batsmanEndId,
                    bowlerId,
                    runsScored,
                    isWicket,
                    wicketType,
                    dismissedPlayerId,
                    fielderId,
                    isExtra,
                    extraType,
                    extraRuns,
                    isBoundary,
                    boundaryType,
                    commentary
                });

                // Broadcast to all clients watching this match
                scoringNamespace.to(`match-${matchId}`).emit('ball-scored', {
                    ball: result.data.ball,
                    teamScore: result.data.teamScore,
                    teamWickets: result.data.teamWickets,
                    overNumber,
                    ballNumber,
                    commentary
                });

                // If it was a wicket, emit a specific wicket event for triggers
                if (result.data.ball.IsWicket) {
                    scoringNamespace.to(`match-${matchId}`).emit('wicket', {
                        ball: result.data.ball,
                        matchId: matchId,
                        timestamp: new Date()
                    });
                }

                // Send confirmation to scorer
                socket.emit('ball-recorded', {
                    success: true,
                    message: 'Ball recorded successfully',
                    data: result.data
                });

            } catch (error) {
                socket.emit('ball-error', {
                    success: false,
                    message: error.message
                });
            }
        });

        /**
         * Start match
         */
        socket.on('start-match', async (data) => {
            try {
                const { matchId, tossWinnerId, tossDecision } = data;

                const result = await matchService.startMatch(matchId, tossWinnerId, tossDecision);

                // Broadcast to all clients
                scoringNamespace.to(`match-${matchId}`).emit('match-started', {
                    matchId,
                    match: result.data.match,
                    innings: result.data.innings,
                    message: 'Match has started'
                });

            } catch (error) {
                socket.emit('match-error', {
                    success: false,
                    message: error.message
                });
            }
        });

        /**
         * Complete match
         */
        socket.on('complete-match', async (data) => {
            try {
                const { matchId, winnerId, resultNote } = data;

                const result = await matchService.completeMatch(matchId, winnerId, resultNote);

                // Broadcast to all clients
                scoringNamespace.to(`match-${matchId}`).emit('match-completed', {
                    matchId,
                    match: result.data,
                    message: 'Match has been completed'
                });

            } catch (error) {
                socket.emit('match-error', {
                    success: false,
                    message: error.message
                });
            }
        });

        /**
         * Get live score
         */
        socket.on('get-live-score', async (matchId) => {
            try {
                const scorecard = await matchService.generateScorecard(matchId);

                socket.emit('live-score', {
                    matchId,
                    scorecard: scorecard.data
                });

            } catch (error) {
                socket.emit('score-error', {
                    success: false,
                    message: error.message
                });
            }
        });

        /**
         * Update commentary
         */
        socket.on('update-commentary', (data) => {
            const { matchId, commentary } = data;

            // Broadcast commentary to all clients
            scoringNamespace.to(`match-${matchId}`).emit('commentary-update', {
                commentary,
                timestamp: new Date()
            });
        });

        /**
         * Wicket alert
         */
        socket.on('wicket-alert', (data) => {
            const { matchId, wicketData } = data;

            // Broadcast wicket to all clients
            scoringNamespace.to(`match-${matchId}`).emit('wicket', {
                ...wicketData,
                timestamp: new Date()
            });
        });

        /**
         * Boundary alert
         */
        socket.on('boundary-alert', (data) => {
            const { matchId, boundaryData } = data;

            // Broadcast boundary to all clients
            scoringNamespace.to(`match-${matchId}`).emit('boundary', {
                ...boundaryData,
                timestamp: new Date()
            });
        });

        /**
         * Over complete
         */
        socket.on('over-complete', (data) => {
            const { matchId, overData } = data;

            // Broadcast over completion to all clients
            scoringNamespace.to(`match-${matchId}`).emit('over-completed', {
                ...overData,
                timestamp: new Date()
            });
        });

        /**
         * Innings complete
         */
        socket.on('innings-complete', (data) => {
            const { matchId, inningsData } = data;

            // Broadcast innings completion to all clients
            scoringNamespace.to(`match-${matchId}`).emit('innings-completed', {
                ...inningsData,
                timestamp: new Date()
            });
        });

        /**
         * Disconnect
         */
        socket.on('disconnect', () => {
            console.log('🏏 Live scoring socket disconnected:', socket.id);
        });
    });

    return scoringNamespace;
};
