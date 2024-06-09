const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
require('dotenv').config();

const commands = [
    {
        name: 'help',
        description: 'Shows the list of available commands'
    },
    {
        name: 'register',
        description: 'Register as a new summoner'
    },
    {
        name: 'remove',
        description: 'Remove your registration'
    },
    {
        name: 'show',
        description: 'Show your current real rank and other information'
    },
    {
        name: 'queue',
        description: 'Show the current registration queue'
    },
    {
        name: 'members',
        description: 'Show the current list of registered summoners'
    },
    {
        name: 'match',
        description: 'Initiates a matchmaking'
    }
];

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
