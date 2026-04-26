require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// Socket.io Authentication Middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error('Authentication error: Invalid token'));
        socket.user = decoded;
        next();
    });
});

// Basic sanity check route
app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

io.on('connection', (socket) => {
    console.log('Client connected to Socket.IO', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected from Socket.IO', socket.id);
    });
});

const apiRoutes = require('./routes')(io);
app.use('/api', apiRoutes);

const { streamLogs } = require('./sshManager');
// Start streaming logs on startup (if SSH connects)
try {
    streamLogs(io);
} catch (e) {
    console.error('Failed to start log stream on init:', e.message);
}

const { initTelegramBot } = require('./telegramManager');
initTelegramBot();

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Backend server running on port ${PORT}`);
    });
}

module.exports = { app, server, io };
