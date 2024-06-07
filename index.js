const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const token = process.env.DISCORD_BOT_TOKEN;
const riotApiKey = process.env.RIOT_API_KEY;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/summoners')
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error('MongoDB connection error:', err));

// Load event handlers
const registerHandler = require('./commands/register');
const matchHandler = require('./commands/match');
const membersHandler = require('./commands/members');
const removeHandler = require('./commands/remove');
const helpHandler = require('./commands/help');

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('messageCreate', async message => {
    if (message.content === '!register') {
        await registerHandler(client, message);
    } else if (message.content === '!members') {
        await membersHandler(client, message);
    } else if (message.content.toLowerCase().includes('patrick')) {
        message.channel.send("闭嘴🤐");
    } else if (message.content === '!match') {
        await matchHandler(client, message);
    } else if (message.content === '!remove') {
        await removeHandler(client, message);
    } else if (message.content === '!help') {
        await helpHandler(client, message);
    }
});

client.login(token);
