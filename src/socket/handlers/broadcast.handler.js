/**
 * Broadcast Handler - WebRTC Signaling for Live Camera Streaming
 * 
 * This handler manages:
 * 1. Camera sources connecting (mobile phones)
 * 2. Director connecting (broadcast control page)
 * 3. WebRTC signaling (offer/answer/ICE candidates)
 * 4. Camera management (register, list, disconnect)
 */

module.exports = function broadcastHandler(io) {
    const broadcastNamespace = io.of('/broadcast');

    // Track cameras per match: { matchId: { socketId: { label, socketId, type } } }
    const matchCameras = {};

    broadcastNamespace.on('connection', (socket) => {
        console.log('📹 Broadcast socket connected:', socket.id);

        // ─── Camera joins a match room ───
        socket.on('join-match', (data) => {
            const { role, label } = data;
            const matchId = String(data.matchId);
            const room = `match-${matchId}`;
            socket.join(room);
            socket.matchId = matchId;
            socket.role = role;
            socket.cameraLabel = label || 'Camera';

            console.log(`📹 ${role} "${label || ''}" joined broadcast for match ${matchId}`);

            if (role === 'camera') {
                // Register this camera
                if (!matchCameras[matchId]) matchCameras[matchId] = {};
                matchCameras[matchId][socket.id] = {
                    socketId: socket.id,
                    label: label || `Camera ${Object.keys(matchCameras[matchId]).length + 1}`,
                    joinedAt: new Date()
                };

                // Notify directors about new camera
                broadcastNamespace.to(room).emit('camera-joined', {
                    cameras: Object.values(matchCameras[matchId]),
                    newCamera: matchCameras[matchId][socket.id]
                });
            }

            if (role === 'director') {
                // Send current camera list to director
                const cameras = matchCameras[matchId] ? Object.values(matchCameras[matchId]) : [];
                socket.emit('camera-list', { cameras });
            }
        });

        // ─── WebRTC Signaling: Offer ───
        socket.on('webrtc-offer', (data) => {
            const { targetSocketId, offer } = data;
            console.log(`📹 WebRTC offer from ${socket.id} to ${targetSocketId}`);
            broadcastNamespace.to(targetSocketId).emit('webrtc-offer', {
                fromSocketId: socket.id,
                offer,
                label: socket.cameraLabel
            });
        });

        // ─── WebRTC Signaling: Answer ───
        socket.on('webrtc-answer', (data) => {
            const { targetSocketId, answer } = data;
            console.log(`📹 WebRTC answer from ${socket.id} to ${targetSocketId}`);
            broadcastNamespace.to(targetSocketId).emit('webrtc-answer', {
                fromSocketId: socket.id,
                answer
            });
        });

        // ─── WebRTC Signaling: ICE Candidate ───
        socket.on('webrtc-ice-candidate', (data) => {
            const { targetSocketId, candidate } = data;
            broadcastNamespace.to(targetSocketId).emit('webrtc-ice-candidate', {
                fromSocketId: socket.id,
                candidate
            });
        });

        // ─── Director requests connection to a camera ───
        socket.on('request-camera', (data) => {
            const { cameraSocketId } = data;
            console.log(`📹 Director ${socket.id} requesting stream from camera ${cameraSocketId}`);
            // Tell the camera to create an offer and send to this director
            broadcastNamespace.to(cameraSocketId).emit('create-offer', {
                directorSocketId: socket.id
            });
        });

        // ─── Director triggers replay event ───
        socket.on('trigger-replay', (data) => {
            const { matchId } = data;
            const room = `match-${matchId}`;
            broadcastNamespace.to(room).emit('replay-triggered', {
                matchId,
                timestamp: new Date()
            });
        });

        // ─── Camera label update ───
        socket.on('update-label', (data) => {
            const { label } = data;
            socket.cameraLabel = label;
            const matchId = socket.matchId;
            if (matchId && matchCameras[matchId] && matchCameras[matchId][socket.id]) {
                matchCameras[matchId][socket.id].label = label;
                broadcastNamespace.to(`match-${matchId}`).emit('camera-updated', {
                    cameras: Object.values(matchCameras[matchId])
                });
            }
        });

        // ─── Disconnect ───
        socket.on('disconnect', () => {
            console.log(`📹 Broadcast socket disconnected: ${socket.id} (${socket.role || 'unknown'})`);
            const matchId = socket.matchId;
            if (matchId && matchCameras[matchId]) {
                delete matchCameras[matchId][socket.id];

                // Notify remaining clients
                broadcastNamespace.to(`match-${matchId}`).emit('camera-left', {
                    cameras: Object.values(matchCameras[matchId]),
                    leftSocketId: socket.id
                });

                // Cleanup empty match rooms
                if (Object.keys(matchCameras[matchId]).length === 0) {
                    delete matchCameras[matchId];
                }
            }
        });
    });
};
