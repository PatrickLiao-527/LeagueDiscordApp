module.exports = async (client, message) => {
    const commandsList = `
    **Available Commands:**
    \`!register\` - Register as a new summoner.
    \`!remove\` - Remove your registration.
    \`!show\` - Show your current real rank and other information.
    \`!queue\` - Show the current registration queue.
    \`!help\` - Show the list of available commands.
    `;

    message.channel.send(commandsList);
};
