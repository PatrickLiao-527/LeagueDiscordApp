const movePlayersToChannels = async (team, channelId, client) => {
    for (const player of team) {
        const member = await client.guilds.cache.first().members.fetch(player.discordId);
        if (member.voice.channel) {
            await member.voice.setChannel(channelId);
        }
    }
};

module.exports = { movePlayersToChannels };
