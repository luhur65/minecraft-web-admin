const express = require('express');
const jwt = require('jsonwebtoken');
const { executeCommand, getStatus } = require('./rconManager');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

// Rate limiting for commands to prevent abuse
const commandLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // limit each IP to 20 requests per windowMs
    message: { error: 'Too many commands sent, please try again later.' }
});

// Auth Middleware
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.user = decoded;
        next();
    });
}

module.exports = (io) => {
    // Authentication
    router.post('/login', (req, res) => {
        const { username, password } = req.body;
        if (username === ADMIN_USER && password === ADMIN_PASS) {
            const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
            return res.json({ token });
        }
        res.status(401).json({ error: 'Invalid credentials' });
    });

    // Get Server Status
    router.get('/status', authMiddleware, async (req, res) => {
        const status = await getStatus();
        const { getServerStats } = require('./sshManager');
        const stats = await getServerStats();

        let onlinePlayers = 0;
        if (status === 'online') {
            try {
                const response = await executeCommand('list');
                const match = response.match(/online:\s*(.*)/i);
                if (match && match[1]) {
                    const list = match[1].split(',').map(p => p.trim()).filter(p => p);
                    onlinePlayers = list.length;
                }
            } catch (error) {
                // Ignore error if server is partially up
            }
        }
        res.json({ status, stats, onlinePlayers });
    });

    // Control Server (Start/Stop/Restart)
    router.post('/server/action', authMiddleware, async (req, res) => {
        const { action } = req.body;
        const { controlService } = require('./sshManager');
        try {
            await controlService(action);
            res.json({ message: `Server ${action} initiated successfully` });
        } catch (error) {
            res.status(500).json({ error: `Failed to ${action} server` });
        }
    });

    // Execute RCON Command
    router.post('/command', authMiddleware, commandLimiter, async (req, res) => {
        const { command } = req.body;
        if (!command) return res.status(400).json({ error: 'Command is required' });

        try {
            const response = await executeCommand(command);
            res.json({ response });
        } catch (error) {
            res.status(500).json({ error: 'Failed to execute command' });
        }
    });

    // Player Management: Get Online Players
    router.get('/players', authMiddleware, async (req, res) => {
        try {
            const response = await executeCommand('list');
            // Typical response: "There are X of a max of Y players online: Player1, Player2"
            const players = [];
            const match = response.match(/online:\s*(.*)/i);
            if (match && match[1]) {
                const list = match[1].split(',').map(p => p.trim()).filter(p => p);
                players.push(...list);
            }
            res.json({ players, raw: response });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch players' });
        }
    });

    // Starter Kits
    router.post('/kits', authMiddleware, commandLimiter, async (req, res) => {
        const { target, kit } = req.body;
        if (!target || !kit) return res.status(400).json({ error: 'Target and kit are required' });

        const kits = {
            starter: [
                'give {target} iron_sword 1',
                'give {target} iron_pickaxe 1',
                'give {target} apple 16'
            ]
        };

        if (!kits[kit]) return res.status(400).json({ error: 'Kit not found' });

        try {
            const results = [];
            for (const cmdTemplate of kits[kit]) {
                const cmd = cmdTemplate.replace('{target}', target);
                const result = await executeCommand(cmd);
                results.push(result);
            }
            res.json({ message: `Kit ${kit} given to ${target}`, results });
        } catch (error) {
            res.status(500).json({ error: 'Failed to give kit' });
        }
    });

    return router;
};
