const { Rcon } = require('rcon-client');
require('dotenv').config();

let rconInstance = null;

async function getRcon() {
    if (rconInstance && rconInstance.authenticated) {
        return rconInstance;
    }

    try {
        if (rconInstance) {
            rconInstance.end().catch(() => {});
        }
        rconInstance = await Rcon.connect({
            host: process.env.RCON_HOST || '43.133.150.21',
            port: parseInt(process.env.RCON_PORT || '25575', 10),
            password: process.env.RCON_PASSWORD || 'password123',
            timeout: 5000,
        });
        console.log('Connected to RCON server.');
        return rconInstance;
    } catch (error) {
        console.error('Failed to connect to RCON server:', error);
        throw error;
    }
}

async function executeCommand(command) {
    try {
        const rcon = await getRcon();
        const response = await rcon.send(command);
        return response;
    } catch (error) {
        console.error(`Error executing command ${command}:`, error);
        throw error;
    }
}

async function getStatus() {
    try {
        await getRcon();
        return 'online';
    } catch (error) {
        return 'offline';
    }
}

module.exports = {
    getRcon,
    executeCommand,
    getStatus
};
