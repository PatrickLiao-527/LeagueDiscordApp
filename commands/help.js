module.exports = async (client, message) => {
    message.channel.send(`📜 **Commands** 📜\n
    \`!register\` - Register your summoner information.
    \`!remove\` - Remove your summoner information.
    \`!members\` - List all registered summoners.
    \`!match\` - Start the team selection process.`);
};
