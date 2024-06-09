const Summoner = require('../models/summoners');
const { championIdToName, fetchChampionData } = require('../utils/championIdToName'); // Adjusted import

module.exports = {
    name: 'members',
    description: 'List all registered summoners',
    async execute(interaction) {
        await fetchChampionData(); // Ensure champion data is fetched and mapped before listing members
        const summoners = await Summoner.find({});
        if (summoners.length === 0) {
            await interaction.reply('No registered summoners.');
        } else {
            const memberList = summoners.map(summoner => {
                const topChampions = summoner.masteryData.slice(0, 3).map(champion => 
                    `${championIdToName[champion.championId] || 'Unknown Champion'} [Level ${champion.championLevel}]`).join(', ');
                return `🧑‍🚀 **${summoner.gameName}#${summoner.tagLine}**\n**Lane:** ${summoner.sortedLanes}\n**Real rank:** ${summoner.realRank}\n**Top Champions:** ${topChampions}`;
            }).join('\n\n');
            await interaction.reply(`📋 **Registered Summoners** 📋\n\n${memberList}`);
        }
    }
};
