const { Client, GatewayIntentBits, Collection } = require('discord.js');
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
const showCommand = require('./commands/show');
const queueCommand = require('./commands/queue');

// Collection to hold commands
client.commands = new Collection();
client.commands.set('help', helpHandler);
client.commands.set('register', registerHandler);
client.commands.set('remove', removeHandler);
client.commands.set('show', showCommand);
client.commands.set('queue', queueCommand);
client.commands.set('match', matchHandler);
client.commands.set('members', membersHandler);

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (!interaction.replied) {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.login(token);
