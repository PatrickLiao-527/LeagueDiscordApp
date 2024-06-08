const Summoner = require('../models/summoners');
const { championIdToName, fetchChampionData } = require('../utils/championIdToName'); // Adjusted import

module.exports = async (client, message) => {
    await fetchChampionData(); // Ensure champion data is fetched and mapped before listing members
    const summoners = await Summoner.find({});
    if (summoners.length === 0) {
        message.channel.send('No registered summoners.');
    } else {
        const memberList = summoners.map(summoner => {
            const topChampions = summoner.masteryData.slice(0, 3).map(champion => 
                `${championIdToName[champion.championId] || 'Unknown Champion'} [Level ${champion.championLevel}]`).join(', ');
            return `🧑‍🚀 **${summoner.gameName}#${summoner.tagLine}**\n**Lane:** ${summoner.lane}\n**Highest Rank:** ${summoner.highestRank}\n**Top Champions:** ${topChampions}`;
        }).join('\n\n');
        message.channel.send(`📋 **Registered Summoners** 📋\n\n${memberList}`);
    }
};
