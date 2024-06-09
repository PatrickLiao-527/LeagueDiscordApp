module.exports = {
    name: 'help',
    description: 'List all available commands',
    async execute(interaction) {
        const commandsList = `
        **Available Commands:**
        \`/register\` - Register as a new summoner.
        \`/remove\` - Remove your registration.
        \`/show\` - Show your current real rank and other information.
        \`/queue\` - Show the current registration queue.
        \`/help\` - Show the list of available commands.
        \`/match\` - Initiate a matchmaking in the lobby.
        \`/members\` - Show the list of registered summoners.
        \`/bias\` - Change your performance bias.
        `;

        await interaction.reply(commandsList);
    },
};
