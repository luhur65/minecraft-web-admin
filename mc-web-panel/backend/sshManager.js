const { Client } = require('ssh2');
require('dotenv').config();

const sshConfig = {
    host: process.env.SSH_HOST || '43.133.150.21',
    port: parseInt(process.env.SSH_PORT || '22', 10),
    username: process.env.SSH_USER || 'root',
    password: process.env.SSH_PASSWORD, // Or use privateKey
};

// Singleton connection for executing commands
function executeSSHCommand(command) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            conn.exec(command, (err, stream) => {
                if (err) {
                    conn.end();
                    return reject(err);
                }
                let output = '';
                let errorOutput = '';

                stream.on('close', (code, signal) => {
                    conn.end();
                    if (code !== 0) {
                        return reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
                    }
                    resolve(output);
                }).on('data', (data) => {
                    output += data;
                }).stderr.on('data', (data) => {
                    errorOutput += data;
                });
            });
        }).on('error', (err) => {
            reject(err);
        }).connect(sshConfig);
    });
}

// Stats fetched dynamically
async function getServerStats() {
    try {
        const ramCmd = "free -m | awk 'NR==2{printf \"%.2f%%\", $3*100/$2 }'";
        const cpuCmd = "top -bn1 | grep load | awk '{printf \"%.2f\", $(NF-2)}'";

        const [ramRaw, cpuRaw] = await Promise.all([
            executeSSHCommand(ramCmd),
            executeSSHCommand(cpuCmd)
        ]);

        return {
            ram: ramRaw.trim(),
            cpu: cpuRaw.trim()
        };
    } catch (err) {
        console.error('Failed to get server stats via SSH:', err);
        return { ram: 'N/A', cpu: 'N/A' };
    }
}

async function controlService(action) {
    if (!['start', 'stop', 'restart'].includes(action)) throw new Error('Invalid action');
    return executeSSHCommand(`systemctl ${action} minecraft.service`);
}

// Persistent connection for streaming logs
function streamLogs(io) {
    const conn = new Client();

    conn.on('ready', () => {
        console.log('SSH connection established for log streaming');
        // We assume the service is running in /opt/minecraft or similar.
        // Using generic path here or could be configured via env.
        const logPath = process.env.MC_LOG_PATH || '/var/opt/minecraft/server/logs/latest.log';

        conn.exec(`tail -f ${logPath}`, (err, stream) => {
            if (err) {
                console.error('Failed to execute log stream command:', err.message);
                conn.end();
                return;
            }

            stream.on('close', (code, signal) => {
                console.log('Log stream closed');
                conn.end();
            }).on('data', (data) => {
                const lines = data.toString('utf8').split('\n').filter(line => line);
                lines.forEach(line => {
                    io.emit('console_log', { log: line });
                });
            }).stderr.on('data', (data) => {
                console.error('Log stream error: ' + data);
            });
        });
    }).on('error', (err) => {
        console.error('SSH Error for log stream:', err.message);
    }).connect(sshConfig);
}

module.exports = {
    executeSSHCommand,
    getServerStats,
    controlService,
    streamLogs
};
