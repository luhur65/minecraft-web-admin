const TelegramBot = require('node-telegram-bot-api');
const { getStatus } = require('./rconManager');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

let bot = null;

if (token && chatId) {
    bot = new TelegramBot(token, { polling: false });
} else {
    console.warn('Telegram Bot Token or Chat ID is missing. Notifications are disabled.');
}

let lastStatus = 'online';

async function checkServerStatus() {
    if (!bot) return;

    try {
        const status = await getStatus();

        if (status === 'offline' && lastStatus === 'online') {
            bot.sendMessage(chatId, '🚨 *ALERT:* Minecraft server has gone offline!', { parse_mode: 'Markdown' })
                .catch(err => console.error('Failed to send Telegram alert:', err));
        } else if (status === 'online' && lastStatus === 'offline') {
            bot.sendMessage(chatId, '✅ *INFO:* Minecraft server is back online.', { parse_mode: 'Markdown' })
                .catch(err => console.error('Failed to send Telegram alert:', err));
        }

        lastStatus = status;
    } catch (error) {
        console.error('Error checking status for Telegram bot:', error);
    }
}

function initTelegramBot() {
    if (bot) {
        console.log('Telegram Bot initialized for downtime monitoring.');
        // Check every minute
        setInterval(checkServerStatus, 60000);
    }
}

module.exports = { initTelegramBot };
