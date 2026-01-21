require('dotenv').config();

const app = require('./src/app');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./src/models');
const initializeSockets = require('./src/socket');

const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: { origin: '*' }
});

initializeSockets(io);


// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected');
  } catch (err) {
    console.error('Failed to connect to database:', err);
  }

  console.log(`Server running at http://localhost:${PORT}`);
});

