const Summoner = require('../models/summoners');
const championIdToName = require('../utils/championIdToName');

module.exports = async (client, message) => {
    const summoners = await Summoner.find({});
    if (summoners.length === 0) {
        message.channel.send('No registered summoners.');
    } else {
        const memberList = summoners.map(summoner => {
            const topChampions = summoner.masteryData.slice(0, 3).map(champion => `${championIdToName[champion.championId] || 'Unknown Champion'} [Level ${champion.championLevel}]`).join(', ');
            return `🧑‍🚀 **${summoner.gameName}#${summoner.tagLine}**\n**Lane:** ${summoner.lane}\n**Highest Rank:** ${summoner.highestRank}\n**Top Champions:** ${topChampions}`;
        }).join('\n\n');
        message.channel.send(`📋 **Registered Summoners** 📋\n\n${memberList}`);
    }
};
